import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DodecahedronGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from 'three/webgpu';
import type { MeshBasicMaterialParameters, MeshStandardMaterialParameters } from 'three/webgpu';
import { WebGPURenderer } from 'three/webgpu';
import type { Battlefield, CombatEvent, Enemy, EnemyKind, Frame, Pad, Point, Role, Tower } from './types';
import { ENEMIES, PADS, ROUTE, UNITS } from './content';

type SharedMaterial = MeshStandardMaterial | MeshBasicMaterial | LineBasicMaterial;
type Part = Mesh<BufferGeometry, SharedMaterial>;
interface ActorVisual { root: Group; body: Group; health: Part; healthBack: Part; kind: string; }
interface EffectVisual { root: Group; core: Part; halo: Part; expires: number; eventId: number; kind: CombatEvent['kind']; }

const MAP_W = 24;
const MAP_D = 16;
const colorForRole = Object.fromEntries(
  Object.entries(UNITS).map(([role, spec]) => [role, Number(`0x${spec.color.slice(1)}`)]),
) as Record<Role, number>;
const enemyScale: Record<EnemyKind, number> = {
  scout: 0.82, runner: 0.68, swarm: 0.52, armored: 1.1, medic: 0.92, elite: 1.13, boss: 1.72,
};
const routeSegmentLengths = ROUTE.slice(1).map((point, index) => Math.hypot(point.x - ROUTE[index]!.x, point.z - ROUTE[index]!.z));
function routeHeading(progress: number): { x: number; z: number } {
  let remaining = Math.max(0, progress);
  for (let index = 0; index < routeSegmentLengths.length; index++) {
    const length = routeSegmentLengths[index]!;
    const a = ROUTE[index]!;
    const b = ROUTE[index + 1]!;
    if (remaining <= length) return { x: (b.x - a.x) / length, z: (b.z - a.z) / length };
    remaining -= length;
  }
  const last = ROUTE.length - 1;
  const a = ROUTE[last - 1]!;
  const b = ROUTE[last]!;
  const length = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  return { x: (b.x - a.x) / length, z: (b.z - a.z) / length };
}

export async function createBattlefield(host: HTMLElement, onDeviceLost: () => void): Promise<Battlefield> {
  const scene = new Scene();
  scene.background = null;
  scene.add(new AmbientLight(0x8db9dd, 1.35));
  const keyLight = new DirectionalLight(0xffe1bd, 2.6);
  keyLight.position.set(-7, 15, 9);
  scene.add(keyLight);
  const rimLight = new DirectionalLight(0x4eb8e8, 1.3);
  rimLight.position.set(8, 10, -8);
  scene.add(rimLight);

  const camera = new OrthographicCamera(-12, 12, 8, -8, 0.1, 100);
  camera.position.set(0, 22, 20);
  camera.lookAt(0, 0, 0);

  const params = new URLSearchParams(window.location.search);
  const forceWebGL = params.get('renderer') === 'webgl';
  const renderer = new WebGPURenderer({ alpha: true, antialias: true, forceWebGL });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x061421, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  await renderer.init();
  const backend: 'WebGPU' | 'WebGL2' = (renderer.backend as unknown as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2';
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%', background: 'transparent', outline: 'none' });
  host.appendChild(canvas);

  const geometries = new Map<string, BufferGeometry>();
  const materials = new Map<string, SharedMaterial>();
  const actors = new Map<string, ActorVisual>();
  const towerModels = new Map<Role, Group>();
  const towerPools = new Map<Role, ActorVisual[]>();
  const enemyPools = new Map<EnemyKind, ActorVisual[]>();
  const seenEvents = new Map<number, EffectVisual>();
  const effectPool = new Map<CombatEvent['kind'], EffectVisual[]>();
  let selectedRing: Part | null = null;
  let ghost: Group | null = null;
  let latestFrameTime = 0;
  let lost = false;
  let disposed = false;
  let lastFrame: Frame | null = null;

  function geometry<T extends BufferGeometry>(key: string, create: () => T): T {
    let value = geometries.get(key);
    if (!value) { value = create(); geometries.set(key, value); }
    return value as T;
  }
  function standard(key: string, color: number, options: MeshStandardMaterialParameters = {}): MeshStandardMaterial {
    let value = materials.get(key);
    if (!value) {
      value = new MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.08, ...options });
      materials.set(key, value);
    }
    return value as MeshStandardMaterial;
  }
  function basic(key: string, color: number, options: MeshBasicMaterialParameters = {}): MeshBasicMaterial {
    let value = materials.get(key);
    if (!value) {
      value = new MeshBasicMaterial({ color, ...options });
      materials.set(key, value);
    }
    return value as MeshBasicMaterial;
  }
  function part(parent: Object3D, geo: BufferGeometry, mat: SharedMaterial, at: Point3 = [0, 0, 0], scale: Point3 = [1, 1, 1]): Part {
    const node = new Mesh(geo, mat);
    node.position.set(...at);
    node.scale.set(...scale);
    parent.add(node);
    return node;
  }
  type Point3 = [number, number, number];
  const boxGeo = () => geometry('box', () => new BoxGeometry(1, 1, 1));
  const sphereGeo = () => geometry('sphere', () => new SphereGeometry(1, 14, 10));
  const cylinderGeo = () => geometry('cylinder', () => new CylinderGeometry(1, 1, 1, 16));
  const capsuleGeo = () => geometry('capsule', () => new CapsuleGeometry(0.18, 0.42, 3, 8));
  const darkArmor = standard('armor', 0x1c3344, { roughness: 0.64, metalness: 0.18 });
  const plateMat = standard('plate', 0x263f50, { roughness: 0.4, metalness: 0.45 });
  const skinMat = standard('skin', 0xc98f69, { roughness: 0.84 });
  const bootMat = standard('boots', 0x142531);
  const visorMat = standard('visor', 0x0b1b26, { metalness: 0.42, roughness: 0.22 });

  // A dark, translucent board leaves the branded DOM robot visible through the field.
  const board = new Group();
  scene.add(board);
  part(board, geometry('board', () => new BoxGeometry(MAP_W + 0.32, 0.42, MAP_D + 0.32)), standard('board-edge', 0x122b3a, { transparent: true, opacity: 0.2, depthWrite: false, metalness: 0.52, roughness: 0.4 }), [0, -0.28, 0]);
  const floor = part(board, geometry('floor', () => new PlaneGeometry(MAP_W, MAP_D)), standard('floor', 0x102638, { transparent: true, opacity: 0.52, metalness: 0.12, roughness: 0.93, depthWrite: false }), [0, -0.045, 0]);
  floor.rotation.x = -Math.PI / 2;
  const floorGridMat = basic('grid-lines', 0x31566a, { transparent: true, opacity: 0.23, depthWrite: false });
  const grid = new Group();
  for (let x = -11; x <= 11; x += 1) {
    const line = new Line(geometry(`grid-v-${x}`, () => new BufferGeometry().setFromPoints([new Vector3(x, -0.033, -8), new Vector3(x, -0.033, 8)])), floorGridMat);
    grid.add(line);
  }
  for (let z = -7; z <= 7; z += 1) {
    const line = new Line(geometry(`grid-h-${z}`, () => new BufferGeometry().setFromPoints([new Vector3(-12, -0.033, z), new Vector3(12, -0.033, z)])), floorGridMat);
    grid.add(line);
  }
  scene.add(grid);

  // Flat, individually authored route segments align with the simulation's straight path.
  const routePoints = ROUTE.map(p => new Vector3(p.x, 0.01, p.z));
  const routeBedMat = standard('route-bed', 0x172f3d, { metalness: 0.2, roughness: 0.9 });
  const railMat = basic('route-rail', 0x3de1ed, { transparent: true, opacity: 0.78, toneMapped: false });
  const routeGroup = new Group();
  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = routePoints[i]!;
    const b = routePoints[i + 1]!;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    const midX = (a.x + b.x) * 0.5;
    const midZ = (a.z + b.z) * 0.5;
    const nx = dz / length;
    const nz = -dx / length;
    const road = part(routeGroup, boxGeo(), routeBedMat, [midX, 0.015, midZ], [0.82, 0.055, length + 0.08]);
    road.rotation.y = angle;
    for (const side of [-1, 1]) {
      const rail = part(routeGroup, boxGeo(), railMat, [midX + nx * side * 0.36, 0.055, midZ + nz * side * 0.36], [0.048, 0.024, length + 0.08]);
      rail.rotation.y = angle;
    }
    for (let offset = 0.72; offset < length - 0.25; offset += 0.92) {
      const dash = part(routeGroup, boxGeo(), basic('route-center-mark', 0x80dce2, { transparent: true, opacity: 0.6, toneMapped: false }),
        [a.x + dx / length * offset, 0.052, a.z + dz / length * offset], [0.022, 0.01, 0.23]);
      dash.rotation.y = angle;
    }
  }
  scene.add(routeGroup);

  // Subtle field markings frame the board like an illuminated operations table.
  const edgeMat = basic('edge-light', 0x1e7891, { transparent: true, opacity: 0.62, toneMapped: false });
  for (const z of [-7.82, 7.82]) {
    const edge = new Line(geometry(`edge-line-${z}`, () => new BufferGeometry().setFromPoints([new Vector3(-11.72, 0.015, z), new Vector3(11.72, 0.015, z)])), edgeMat);
    scene.add(edge);
  }
  for (const x of [-11.82, 11.82]) {
    const edge = new Line(geometry(`edge-line-${x}`, () => new BufferGeometry().setFromPoints([new Vector3(x, 0.015, -7.72), new Vector3(x, 0.015, 7.72)])), edgeMat);
    scene.add(edge);
  }

  // Reinforcing cover props sit outside the movement lane and avoid every deployment pad.
  const sandbagMat = standard('sandbag', 0x586455, { roughness: 0.98 });
  const rockMat = standard('rock', 0x364c55, { roughness: 1 });
  const coverProps = new Group();
  const cover = (x: number, z: number, count: number, angle: number, rock = false) => {
    const mat = rock ? rockMat : sandbagMat;
    for (let i = 0; i < count; i++) {
      const node = part(coverProps, rock ? geometry('rock-shape', () => new DodecahedronGeometry(0.48, 0)) : capsuleGeo(), mat,
        [x + Math.cos(angle) * (i - (count - 1) / 2) * 0.52, rock ? 0.28 : 0.19, z + Math.sin(angle) * (i - (count - 1) / 2) * 0.52],
        rock ? [1.2, 0.72, 0.88] : [1.15, 0.62, 0.72]);
      node.rotation.y = angle;
      if (!rock) node.rotation.z = Math.PI / 2;
    }
  };
  cover(-9.7, 5.9, 3, 0.24);
  cover(9.8, 5.8, 3, -0.32);
  cover(-9.6, -5.9, 2, -0.24, true);
  cover(9.4, -5.8, 3, 0.4);
  coverProps.renderOrder = 2;
  scene.add(coverProps);

  // A warm entry beacon and an unmistakable cyan command-post / extraction pad.
  const entrance = new Group();
  entrance.position.set(ROUTE[0]?.x ?? -10, 0, ROUTE[0]?.z ?? 0);
  part(entrance, cylinderGeo(), standard('entry-foot', 0x2d3842, { metalness: 0.4 }), [0, 0.08, 0], [0.62, 0.16, 0.62]);
  part(entrance, geometry('entry-ring-geo', () => new TorusGeometry(0.48, 0.055, 7, 36)), basic('entry-ring', 0xff796a, { toneMapped: false }), [0, 0.19, 0], [1, 1, 1]).rotation.x = Math.PI / 2;
  part(entrance, cylinderGeo(), standard('entry-beacon', 0xf27661, { emissive: 0x74261d, emissiveIntensity: 0.8 }), [0, 0.42, 0], [0.09, 0.44, 0.09]);
  part(entrance, sphereGeo(), basic('entry-lamp', 0xffa18b, { toneMapped: false }), [0, 0.67, 0], [0.13, 0.13, 0.13]);
  scene.add(entrance);
  const hq = new Group();
  const exit = ROUTE[ROUTE.length - 1] ?? { x: 10, z: 0 };
  hq.position.set(exit.x, 0, exit.z);
  part(hq, cylinderGeo(), standard('hq-foundation', 0x153b4b, { metalness: 0.4 }), [0, 0.08, 0], [1.26, 0.16, 1.04]);
  part(hq, geometry('hq-ring-geo', () => new TorusGeometry(0.94, 0.075, 8, 40)), basic('hq-ring', 0x48f0ee, { toneMapped: false }), [0, 0.19, 0], [1.14, 1, 0.72]).rotation.x = Math.PI / 2;
  part(hq, boxGeo(), standard('hq-core', 0x2e6671, { metalness: 0.22, roughness: 0.5 }), [0, 0.52, 0], [0.78, 0.62, 0.62]);
  part(hq, boxGeo(), standard('hq-core-light', 0x46c7d0, { emissive: 0x1d9fa9, emissiveIntensity: 0.65, metalness: 0.25 }), [0, 0.55, 0.33], [0.52, 0.2, 0.045]);
  part(hq, cylinderGeo(), plateMat, [-0.36, 0.95, -0.2], [0.045, 0.66, 0.045]);
  part(hq, geometry('hq-antenna', () => new SphereGeometry(0.09, 10, 7)), basic('hq-beacon', 0x66fff3, { toneMapped: false }), [-0.36, 1.3, -0.2], [1, 1, 1]);
  scene.add(hq);

  // Raised beveled deployment pads, with tiny status studs. IDs remain content-owned.
  const padGroup = new Group();
  const padMap = new Map<number, Pad>();
  const occupiedPads = new Set<number>();
  for (const pad of PADS) {
    padMap.set(pad.id, pad);
    const platform = new Group();
    platform.position.set(pad.x, 0, pad.z);
    part(platform, geometry('pad-base', () => new CylinderGeometry(0.91, 1.0, 0.25, 12, 1)), standard('pad-base-mat', 0x253e4d, { metalness: 0.37, roughness: 0.5 }), [0, 0.13, 0]);
    part(platform, geometry('pad-inner', () => new CylinderGeometry(0.79, 0.83, 0.075, 24, 1)), standard('pad-center', 0x426070, { metalness: 0.24, roughness: 0.56 }), [0, 0.29, 0]);
    part(platform, geometry('pad-light-geo', () => new TorusGeometry(0.82, 0.026, 5, 32)), basic('pad-light', 0x2fa7bc, { toneMapped: false }), [0, 0.335, 0], [1, 1, 1]).rotation.x = Math.PI / 2;
    for (let n = 0; n < 4; n++) {
      const a = Math.PI * 0.25 + n * Math.PI * 0.5;
      part(platform, sphereGeo(), basic('pad-stud', 0x69deed, { toneMapped: false }), [Math.cos(a) * 0.7, 0.35, Math.sin(a) * 0.7], [0.045, 0.025, 0.045]);
    }
    platform.userData.padId = pad.id;
    padGroup.add(platform);
  }
  scene.add(padGroup);

  // Body-level lean and squat per role. Applied to the `body` group only, never `root`, so
  // applyRank's rank-ring/rank-mark children (which live on root) stay anchored correctly.
  const STANCE: Record<Role, { lean: number; height: number; width: number }> = {
    cadet: { lean: 0, height: 1, width: 1 },
    officer: { lean: -0.05, height: 1, width: 1 },
    gunner: { lean: 0.16, height: 0.92, width: 1.06 },
    sniper: { lean: 0.06, height: 0.86, width: 1 },
    grenadier: { lean: 0.02, height: 1, width: 1 },
    engineer: { lean: 0.14, height: 0.95, width: 1 },
  };

  function makeSoldier(role: Role): Group {
    const root = new Group();
    const color = colorForRole[role];
    const uniform = standard(`uniform-${role}`, role === 'officer' ? 0x344353 : 0x24394a, { roughness: 0.72 });
    const roleAccent = standard(`role-accent-${role}`, color, { metalness: 0.25, roughness: 0.52 });
    const body = new Group();
    root.add(body);
    // Legs and articulated silhouette.
    for (const side of [-1, 1]) {
      const leg = part(body, capsuleGeo(), uniform, [side * 0.17, 0.48, 0], [0.82, 0.9, 0.82]);
      leg.rotation.z = side * -0.05;
      part(body, boxGeo(), bootMat, [side * 0.18, 0.13, 0.11], [0.26, 0.19, 0.42]);
      part(body, boxGeo(), roleAccent, [side * 0.28, 1.34, 0.03], [0.2, 0.12, 0.2]); // colored shoulder band
    }
    // Torso, carrier vest, webbing, collar and face.
    part(body, boxGeo(), uniform, [0, 1.17, 0], [0.68, 0.72, 0.4]);
    part(body, boxGeo(), darkArmor, [0, 1.14, 0.22], [0.5, 0.42, 0.12]);
    part(body, boxGeo(), plateMat, [0, 1.31, 0.294], [0.28, 0.15, 0.025]);
    part(body, boxGeo(), roleAccent, [0, 1.47, 0.22], [0.55, 0.06, 0.1]);
    for (const side of [-1, 1]) {
      const arm = part(body, capsuleGeo(), uniform, [side * 0.42, 1.13, 0.15], [0.78, 0.76, 0.76]);
      if (role === 'officer' && side === 1) {
        // Raised commanding arm: breaks the outline above the shoulder, unique to the officer
        // and readable from any facing angle, unlike a small held prop.
        arm.rotation.x = -1.35;
        arm.rotation.z = side * 0.08;
        part(body, sphereGeo(), skinMat, [side * 0.46, 1.58, 0.02], [0.13, 0.13, 0.16]);
        const baton = part(body, cylinderGeo(), plateMat, [side * 0.48, 1.72, -0.06], [0.03, 0.24, 0.03]);
        baton.rotation.x = -0.35;
      } else {
        arm.rotation.x = -0.42;
        arm.rotation.z = side * 0.22;
        part(body, sphereGeo(), skinMat, [side * 0.34, 0.88, 0.48], [0.13, 0.13, 0.16]);
      }
    }
    part(body, cylinderGeo(), skinMat, [0, 1.59, 0], [0.12, 0.19, 0.12]);
    part(body, sphereGeo(), skinMat, [0, 1.77, 0.01], [0.27, 0.29, 0.25]);
    part(body, boxGeo(), visorMat, [0, 1.77, 0.232], [0.4, 0.16, 0.055]);
    const helmet = part(body, sphereGeo(), roleAccent, [0, 1.99, -0.005], [0.34, 0.19, 0.32]);
    part(body, boxGeo(), roleAccent, [0, 1.9, 0.11], [0.49, 0.055, 0.35]);
    part(body, boxGeo(), plateMat, [0, 2.09, 0.13], [0.16, 0.07, 0.13]);
    if (role === 'officer') {
      helmet.scale.set(0.32, 0.11, 0.29);
      part(body, boxGeo(), uniform, [0, 2.02, 0], [0.42, 0.12, 0.38]);
      part(body, boxGeo(), roleAccent, [0, 2.1, 0.02], [0.2, 0.06, 0.2]);
    }
    // Role-specific carried gear: every role now carries a genuinely different weapon block, and
    // each contributes at least one large shape (vertical rifle, raised arm, bipod, tube, tall
    // pack, scope tower) that reads as a silhouette at 40px, not just a surface decal.
    const weaponMat = standard(`weapon-${role}`, 0x182a35, { metalness: 0.6, roughness: 0.34 });
    const barrelMat = standard(`barrel-${role}`, 0x52636b, { metalness: 0.75, roughness: 0.24 });
    if (role === 'cadet') {
      // Small forward pistol; the real silhouette read is the rifle slung diagonally across the
      // back, angled across the ground plane (yaw, not pitch) so it stays legible from the
      // battlefield's steep top-down camera instead of foreshortening into a dot.
      part(body, boxGeo(), weaponMat, [0.2, 0.88, 0.42], [0.09, 0.11, 0.17]);
      part(body, boxGeo(), weaponMat, [0.2, 0.78, 0.4], [0.045, 0.13, 0.06]);
      const sling = part(body, boxGeo(), weaponMat, [0, 1.64, -0.38], [0.14, 0.13, 1]);
      sling.rotation.y = 0.75;
      const slingBarrel = part(body, cylinderGeo(), barrelMat, [-0.34, 1.64, -0.73], [0.04, 0.32, 0.04]);
      slingBarrel.rotation.x = Math.PI / 2; slingBarrel.rotation.y = 0.75;
    } else if (role === 'officer') {
      // Holstered sidearm at the hip; the real silhouette read is the raised commanding arm above.
      part(body, boxGeo(), weaponMat, [-0.26, 0.83, 0.1], [0.09, 0.17, 0.09]);
      part(body, boxGeo(), plateMat, [-0.26, 0.94, 0.1], [0.11, 0.045, 0.1]);
    } else if (role === 'gunner') {
      // Heavy SAW plus a splayed bipod: the widest, lowest-braced silhouette on the field.
      part(body, boxGeo(), weaponMat, [0, 0.97, 0.46], [0.2, 0.16, 0.66]);
      part(body, cylinderGeo(), barrelMat, [0, 0.99, 0.88], [0.06, 0.075, 0.38]).rotation.x = Math.PI / 2;
      part(body, boxGeo(), weaponMat, [0, 0.78, 0.48], [0.14, 0.28, 0.17]);
      part(body, boxGeo(), plateMat, [0.1, 1.11, 0.42], [0.2, 0.09, 0.17]);
      for (const side of [-1, 1]) {
        const bipod = part(body, cylinderGeo(), barrelMat, [side * 0.32, 0.55, 0.94], [0.026, 0.5, 0.026]);
        bipod.rotation.z = side * 0.95;
        bipod.rotation.x = 0.1;
      }
    } else if (role === 'sniper') {
      // Long rifle, front bipod and a tall scope tower rising above the weapon line.
      part(body, boxGeo(), weaponMat, [0.04, 0.99, 0.4], [0.13, 0.12, 0.95]);
      part(body, cylinderGeo(), barrelMat, [0.04, 1, 1.02], [0.03, 0.045, 0.55]).rotation.x = Math.PI / 2;
      part(body, boxGeo(), weaponMat, [0.04, 0.84, 0.45], [0.06, 0.2, 0.12]);
      part(body, cylinderGeo(), plateMat, [0.04, 1.2, 0.52], [0.055, 0.34, 0.055]);
      for (const side of [-1, 1]) {
        const bipod = part(body, cylinderGeo(), barrelMat, [side * 0.28, 0.45, 0.78], [0.024, 0.52, 0.024]);
        bipod.rotation.z = side * 0.9;
      }
    } else if (role === 'grenadier') {
      // Short grip plus a big shoulder-mounted launcher tube — a bold cylindrical mass over the shoulder.
      part(body, boxGeo(), weaponMat, [0.14, 0.94, 0.42], [0.14, 0.13, 0.3]);
      const tube = part(body, cylinderGeo(), barrelMat, [-0.32, 1.58, -0.14], [0.17, 0.74, 0.17]);
      tube.rotation.z = 0.32; tube.rotation.x = -0.26;
      const flare = part(body, cylinderGeo(), plateMat, [-0.5, 1.97, -0.37], [0.2, 0.11, 0.2]);
      flare.rotation.z = 0.32; flare.rotation.x = -0.26;
    } else {
      // Engineer: carbine plus an oversized field pack that rises above the head line under a forward hunch.
      part(body, boxGeo(), weaponMat, [0.12, 0.99, 0.46], [0.15, 0.12, 0.58]);
      part(body, cylinderGeo(), barrelMat, [0.12, 1, 0.84], [0.04, 0.05, 0.25]).rotation.x = Math.PI / 2;
      part(body, boxGeo(), standard('engineer-pack', 0x596c56), [0, 1.7, -0.3], [0.5, 1.3, 0.26]);
      part(body, boxGeo(), roleAccent, [0, 2.25, -0.4], [0.36, 0.14, 0.03]);
      part(body, cylinderGeo(), plateMat, [-0.41, 1.03, 0.07], [0.055, 0.46, 0.055]).rotation.z = Math.PI / 2;
    }
    // Rank plate is always visible at field scale; applyRank adds the ring/chevrons separately.
    part(body, boxGeo(), roleAccent, [0.08, 1.44, 0.31], [0.09, 0.08, 0.03]);
    // Stance: a body-level lean and squat gives each role a distinct outline. applyRank's
    // rank-ring/rank-mark children live on root, not body, so they stay anchored regardless.
    const stance = STANCE[role];
    body.rotation.x = stance.lean;
    body.scale.set(stance.width, stance.height, stance.width);
    body.name = 'soldier-body';
    return root;
  }

  for (const role of Object.keys(UNITS) as Role[]) towerModels.set(role, makeSoldier(role));

  function makeEnemy(kind: EnemyKind): ActorVisual {
    const root = new Group();
    const body = new Group();
    root.add(body);
    const spec = ENEMIES[kind];
    const enemyMat = standard(`enemy-${kind}`, Number(spec.color.replace('#', '0x')) || 0xd35b4e, { roughness: 0.76, metalness: kind === 'armored' || kind === 'boss' ? 0.38 : 0.12 });
    const dark = standard(`enemy-dark-${kind}`, 0x3d3032, { roughness: 0.8 });
    const scl = enemyScale[kind];
    if (kind === 'boss') {
      // Broad tracked hull, low turret and long cannon; clearly heavier than all infantry.
      part(body, boxGeo(), enemyMat, [0, 0.7, 0], [1.9, 0.8, 1.18]);
      for (const side of [-1, 1]) {
        part(body, geometry(`boss-track-${side}`, () => new CapsuleGeometry(0.19, 1.2, 3, 8)), dark, [side * 0.85, 0.34, 0], [1, 0.9, 1.3]);
        for (let wheel = -1; wheel <= 1; wheel++) part(body, cylinderGeo(), plateMat, [side * 0.98, 0.36, wheel * 0.34], [0.16, 0.19, 0.16]);
      }
      part(body, cylinderGeo(), enemyMat, [0, 1.22, 0], [0.52, 0.42, 0.52]);
      part(body, boxGeo(), dark, [0, 1.26, 0.61], [0.24, 0.18, 0.86]);
      part(body, cylinderGeo(), standard('boss-muzzle', 0xf5a04d, { emissive: 0xb35224, emissiveIntensity: 0.8 }), [0, 1.26, 1.02], [0.09, 0.095, 0.2]).rotation.x = Math.PI / 2;
    } else {
      // Shape language: scout is the baseline light-infantry read, runner leans into a sprint with
      // trailing speed fins, and swarm hunches wide with stubby nub-arms — three distinct silhouettes,
      // not one mesh at three scales.
      const stature = kind === 'swarm' ? 0.6 : kind === 'runner' ? 0.8 : 1;
      part(body, capsuleGeo(), enemyMat, [0, 0.85 * stature, 0], [1.15 * scl, 1.14 * stature * scl, scl]);
      part(body, sphereGeo(), enemyMat, [0, 1.68 * stature * scl, 0.02], [0.27 * scl, 0.29 * stature * scl, 0.25 * scl]);
      part(body, sphereGeo(), dark, [0, 1.7 * stature * scl, 0.22 * scl], [0.28 * scl, 0.14 * scl, 0.055]);
      if (kind === 'scout') {
        // Kit pouch at the hip identifies the baseline light-infantry shape.
        part(body, boxGeo(), standard('scout-pouch', 0x8a6a4a, { roughness: 0.9 }), [0.24 * scl, 0.6 * scl, -0.14 * scl], [0.22 * scl, 0.22 * scl, 0.16 * scl]);
      }
      if (kind === 'runner') {
        // Forward sprinting lean plus trailing speed fins that extend the outline behind the hips.
        body.rotation.x = -0.32;
        for (const side of [-1, 1]) {
          const fin = part(body, boxGeo(), dark, [side * 0.17 * scl, 0.6 * scl, -0.52 * scl], [0.07 * scl, 0.3 * scl, 0.05 * scl]);
          fin.rotation.x = 0.5;
        }
      }
      if (kind === 'swarm') {
        // Hunched, wide crouch with stubby scrabbling nub-arms breaking the sides of the silhouette.
        body.rotation.x = 0.2;
        for (const side of [-1, 1]) {
          const nub = part(body, capsuleGeo(), enemyMat, [side * 0.34 * scl, 0.5 * scl, 0.05 * scl], [0.4 * scl, 0.4 * scl, 0.4 * scl]);
          nub.rotation.z = side * 0.9;
        }
      }
      if (kind === 'armored' || kind === 'elite') {
        part(body, boxGeo(), standard(`enemy-plate-${kind}`, kind === 'elite' ? 0xff9a55 : 0x6b5650, { metalness: 0.48 }), [0, 0.96, 0.19], [0.75 * scl, 0.42 * scl, 0.15]);
        part(body, sphereGeo(), dark, [0, 1.95 * scl, -0.03], [0.36 * scl, 0.22 * scl, 0.32 * scl]);
        if (kind === 'armored') {
          // Wide block pauldrons: a heavy, square-shouldered tank read.
          for (const side of [-1, 1]) part(body, boxGeo(), standard('armored-pauldron', 0x584c46, { metalness: 0.4 }), [side * 0.31 * scl, 1.18 * scl, -0.02 * scl], [0.24 * scl, 0.3 * scl, 0.46 * scl]);
        } else {
          // Tall spiked crest: a fast, sharp elite-trooper read that peaks above every other infantry kind.
          const crest = part(body, geometry('elite-crest', () => new ConeGeometry(0.13, 0.52, 6)), standard('elite-crest-mat', 0xffb266, { metalness: 0.42 }), [0, 1.98 * scl, -0.22 * scl], [1, 1, 1]);
        crest.rotation.x = 1.95;
        }
      }
      if (kind === 'medic') {
        part(body, boxGeo(), standard('medic-pack', 0xe7ded0), [0, 0.97, -0.27], [0.43, 0.48, 0.2]);
        part(body, boxGeo(), basic('medic-cross', 0xe85f53), [0, 1.02, -0.38], [0.28, 0.065, 0.025]);
        part(body, boxGeo(), basic('medic-cross-vertical', 0xe85f53), [0, 1.02, -0.385], [0.065, 0.28, 0.025]);
      }
    }
    const width = kind === 'boss' ? 1.8 : kind === 'elite' || kind === 'armored' ? 1.18 : 0.92;
    const healthBack = part(root, boxGeo(), basic('health-back', 0x111d26, { transparent: true, opacity: 0.95 }), [0, kind === 'boss' ? 2.55 : 2.32, 0], [width, 0.105, 0.055]);
    const health = part(root, boxGeo(), basic(`health-${kind}`, kind === 'boss' ? 0xffad55 : kind === 'medic' ? 0x7de39d : Number(spec.color.replace('#', '0x')) || 0xe16858, { toneMapped: false }), [0, kind === 'boss' ? 2.55 : 2.32, 0.035], [width, 0.072, 0.035]);
    root.scale.setScalar(kind === 'boss' ? 1.45 : 1);
    return { root, body, health, healthBack, kind };
  }

  function soldierVisual(tower: Tower): ActorVisual {
    const root = towerModels.get(tower.role)!.clone(true) as Group;
    const body = root.getObjectByName('soldier-body') as Group;
    applyRank(root, tower.role, tower.rank);
    const blank = part(root, boxGeo(), basic('hidden-health', 0xffffff, { transparent: true, opacity: 0 }), [0, -40, 0], [0, 0, 0]);
    return { root, body, health: blank, healthBack: blank, kind: `tower:${tower.role}` };
  }

  function applyRank(root: Group, role: Role, rank: number): void {
    for (const child of [...root.children]) {
      if (child.name === 'rank-ring' || child.name.startsWith('rank-mark-')) root.remove(child);
    }
    const rankMat = standard(`rank-${role}`, colorForRole[role], { emissive: colorForRole[role], emissiveIntensity: 0.2, metalness: 0.3 });
    const ring = new Mesh(geometry(`rank-ring-${rank}`, () => new TorusGeometry(0.56 + rank * 0.08, 0.018 + rank * 0.006, 5, 24)), rankMat);
    ring.position.set(0, 0.39, 0);
    ring.rotation.x = Math.PI / 2;
    ring.name = 'rank-ring';
    root.add(ring);
    for (let p = 0; p < rank; p++) {
      const chevron = part(root, boxGeo(), rankMat, [0.18 + p * 0.105, 1.52, 0.32], [0.07, 0.04, 0.035]);
      chevron.rotation.z = Math.PI / 4;
      chevron.name = `rank-mark-${p}`;
    }
    root.userData.rank = rank;
  }

  function acquireEnemy(enemy: Enemy): ActorVisual {
    const kind = enemy.kind;
    let actor = enemyPools.get(kind)?.pop();
    if (!actor) actor = makeEnemy(kind);
    actor.root.visible = true;
    scene.add(actor.root);
    return actor;
  }

  function createRangeRing(): Part {
    const node = new Mesh(geometry('selection-range', () => new RingGeometry(0.985, 1, 64)), basic('selection-range-mat', 0x54ecf1, { transparent: true, opacity: 0.22, side: 2, depthWrite: false, toneMapped: false }));
    node.rotation.x = -Math.PI / 2;
    node.position.y = 0.05;
    node.renderOrder = 5;
    scene.add(node);
    return node;
  }

  function setGhost(role: Role | null, pad: Pad | undefined): void {
    if (!role || !pad) {
      if (ghost) ghost.visible = false;
      return;
    }
    if (!ghost || ghost.userData.role !== role) {
      if (ghost) scene.remove(ghost);
      ghost = towerModels.get(role)!.clone(true) as Group;
      ghost.traverse(object => {
        if ((object as Mesh).isMesh) (object as Mesh).material = basic(`ghost-${role}`, colorForRole[role], { transparent: true, opacity: 0.34, depthWrite: false, wireframe: false });
      });
      ghost.userData.role = role;
      scene.add(ghost);
    }
    ghost.visible = !occupiedPads.has(pad.id);
    ghost.position.set(pad.x, 0.27, pad.z);
  }

  function setupEffect(event: CombatEvent): EffectVisual {
    const root = new Group();
    if (event.kind === 'airstrike') {
      const aircraft = new Group();
      aircraft.name = 'aircraft';
      root.add(aircraft);
      const fuselage = part(aircraft, boxGeo(), basic('airstrike-fuselage', 0xffd38b, { toneMapped: false }), [0, 0, 0], [0.19, 0.14, 1.05]);
      part(aircraft, geometry('aircraft-wing', () => new BoxGeometry(1, 0.055, 0.3)), basic('airstrike-wing', 0x69e9fa, { toneMapped: false }), [0, -0.025, -0.08]);
      part(aircraft, geometry('aircraft-tail', () => new BoxGeometry(0.48, 0.05, 0.19)), basic('airstrike-tail', 0xffd38b, { toneMapped: false }), [0, 0.015, -0.42]);
      part(aircraft, boxGeo(), basic('airstrike-fin', 0x69e9fa, { toneMapped: false }), [0, 0.115, -0.38], [0.08, 0.19, 0.22]);
      const trail = part(aircraft, boxGeo(), basic('airstrike-trail', 0xffb84f, { transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }), [0, -0.01, -1.45], [0.045, 0.045, 2.4]);
      for (let i = 0; i < 5; i++) {
        const impact = new Group();
        impact.name = `strike-impact-${i}`;
        impact.userData.fraction = 0.12 + i * 0.19;
        const ring = part(impact, geometry('airstrike-ring', () => new TorusGeometry(0.8, 0.045, 7, 32)), basic(`airstrike-ring-${i}`, 0x70f1fa, { transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
        ring.rotation.x = Math.PI / 2;
        ring.name = 'impact-ring';
        const outer = part(impact, geometry('airstrike-ring-outer', () => new TorusGeometry(1, 0.026, 5, 32)), basic(`airstrike-outer-${i}`, 0xffbe61, { transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false }));
        outer.rotation.x = Math.PI / 2;
        outer.name = 'impact-outer';
        const column = part(impact, geometry('airstrike-column', () => new CylinderGeometry(0.13, 0.5, 1, 9)), basic(`airstrike-column-${i}`, 0xffa54b, { transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false }), [0, 0.8, 0], [1, 1.6, 1]);
        column.name = 'impact-column';
        const flash = part(impact, sphereGeo(), basic(`airstrike-impact-core-${i}`, 0x90f6ff, { transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }), [0, 0.12, 0], [0.23, 0.23, 0.23]);
        flash.name = 'impact-core';
        impact.visible = false;
        root.add(impact);
      }
      return { root, core: fuselage, halo: trail, expires: event.time + 1.4, eventId: event.id, kind: event.kind };
    }
    const coreColor = event.kind === 'rage' ? 0xffb347 : event.kind === 'headshot' ? 0x86dbff : event.kind === 'blast' ? 0xff8a53 : event.role ? colorForRole[event.role] : 0x78d6ee;
    const coreMat = basic(`effect-core-${event.kind}`, coreColor, { transparent: true, opacity: 0.94, depthWrite: false, toneMapped: false });
    const haloMat = basic(`effect-halo-${event.kind}`, coreColor, { transparent: true, opacity: 0.38, depthWrite: false, toneMapped: false });
    let core: Part;
    let halo: Part;
    if (event.kind === 'rage' || event.kind === 'blast') {
      core = part(root, geometry(`fx-ring-${event.kind}`, () => new TorusGeometry(1, event.kind === 'rage' ? 0.055 : 0.075, 7, 36)), coreMat);
      core.rotation.x = Math.PI / 2;
      halo = part(root, geometry(`fx-halo-${event.kind}`, () => new TorusGeometry(1, 0.025, 5, 36)), haloMat);
      halo.rotation.x = Math.PI / 2;
    } else {
      core = part(root, geometry(`fx-beam-${event.kind}`, () => new CylinderGeometry(0.025, 0.055, 1, 7)), coreMat);
      halo = part(root, geometry(`fx-beam-halo-${event.kind}`, () => new CylinderGeometry(0.07, 0.1, 1, 7)), haloMat);
    }
    return { root, core, halo, expires: event.time, eventId: event.id, kind: event.kind };
  }

  function presentEffect(event: CombatEvent, reducedMotion: boolean): void {
    if (!['shot', 'headshot', 'rage', 'blast', 'airstrike'].includes(event.kind)) return;
    const duration = event.kind === 'airstrike' ? 1.4 : event.kind === 'rage' ? 0.62 : event.kind === 'blast' ? 0.66 : 0.25;
    if (latestFrameTime >= event.time + duration) return;
    let fx = seenEvents.get(event.id);
    if (!fx) {
      const pool = effectPool.get(event.kind) ?? [];
      fx = pool.pop() ?? setupEffect(event);
      fx.kind = event.kind;
      fx.eventId = event.id;
      fx.expires = event.time + duration;
      fx.root.visible = true;
      scene.add(fx.root);
      seenEvents.set(event.id, fx);
    }
    const from = new Vector3(event.from.x, 0.28, event.from.z);
    const to = new Vector3(event.to.x, event.kind === 'rage' ? 0.055 : 0.72, event.to.z);
    const age = Math.max(0, latestFrameTime - event.time);
    const life = Math.max(0.04, fx.expires - event.time);
    const progress = Math.min(1, age / life);
    if (event.kind === 'airstrike') {
      const forward = event.id % 2 === 0;
      const start = new Vector3(forward ? -14 : 14, 0, forward ? -7 : 7);
      const end = new Vector3(-start.x, 0, -start.z);
      const aircraft = fx.root.getObjectByName('aircraft') as Group;
      const flight = progress;
      aircraft.visible = !reducedMotion;
      aircraft.position.set(start.x + (end.x - start.x) * flight, 8.6, start.z + (end.z - start.z) * flight);
      aircraft.rotation.y = Math.atan2(end.x - start.x, end.z - start.z);
      fx.core.material.opacity = 0.96;
      fx.halo.material.opacity = reducedMotion ? 0 : (1 - Math.max(0, progress - 0.88) / 0.12) * 0.82;
      fx.halo.scale.z = Math.min(2.4, progress * 2.4);
      for (let index = 0; index < 5; index++) {
        const impact = fx.root.getObjectByName(`strike-impact-${index}`) as Group;
        const fraction = impact.userData.fraction as number;
        const x = start.x + (end.x - start.x) * fraction;
        const z = start.z + (end.z - start.z) * fraction;
        impact.position.set(x, 0.04, z);
        const impactAge = age - fraction * life;
        impact.visible = reducedMotion || (impactAge >= 0 && impactAge < 0.62);
        const ring = impact.getObjectByName('impact-ring') as Part;
        const outer = impact.getObjectByName('impact-outer') as Part;
        const column = impact.getObjectByName('impact-column') as Part;
        const flash = impact.getObjectByName('impact-core') as Part;
        if (reducedMotion) {
          ring.scale.setScalar(0.68);
          outer.scale.setScalar(0.9);
          ring.material.opacity = 0.42;
          outer.material.opacity = 0.32;
          column.visible = false;
          flash.visible = false;
        } else {
          const burst = Math.max(0, impactAge);
          const fade = Math.max(0, 1 - burst / 0.62);
          ring.scale.setScalar(0.48 + Math.min(burst, 0.62) * 2.3);
          outer.scale.setScalar(0.3 + Math.min(burst, 0.62) * 2.8);
          ring.material.opacity = fade * 0.86;
          outer.material.opacity = fade * 0.55;
          column.visible = impactAge >= 0 && impactAge < 0.34;
          column.scale.y = Math.max(0.08, (1 - Math.max(0, impactAge) / 0.34) * 2.5);
          column.position.y = column.scale.y * 0.48;
          column.material.opacity = Math.max(0, 0.7 - Math.max(0, impactAge) * 1.9);
          flash.visible = column.visible;
          flash.material.opacity = fade * 0.8;
          flash.scale.setScalar(0.18 + Math.min(burst, 0.3) * 0.75);
        }
      }
    } else if (event.kind === 'rage' || event.kind === 'blast') {
      fx.root.position.set(event.kind === 'rage' ? event.from.x : event.to.x, 0.06, event.kind === 'rage' ? event.from.z : event.to.z);
      const scale = event.kind === 'rage' ? (reducedMotion ? 1 : 0.78 + progress * 0.24) : (reducedMotion ? 0.7 : 0.3 + progress * 1.85);
      fx.core.scale.setScalar(scale);
      fx.halo.scale.setScalar(scale * 1.24);
      fx.core.material.opacity = event.kind === 'rage' ? 0.56 : (1 - progress) * 0.94;
      fx.halo.material.opacity = (1 - progress) * 0.36;
    } else {
      const delta = to.clone().sub(from);
      const len = Math.max(0.001, delta.length());
      fx.root.position.copy(from).add(to).multiplyScalar(0.5);
      fx.root.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
      fx.core.scale.set(1, len, 1);
      fx.halo.scale.set(1, len, 1);
      fx.core.material.opacity = (1 - progress) * (event.kind === 'headshot' ? 1 : 0.8);
      fx.halo.material.opacity = (1 - progress) * 0.28;
    }
  }

  function updateActor(actor: ActorVisual, x: number, z: number, y: number): void {
    actor.root.position.set(x, y, z);
  }

  function fitCamera(): void {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const viewAspect = width / height;
    const mobile = width < 650;
    camera.position.set(mobile ? 22 : 0, mobile ? 30 : 22, mobile ? 0 : 20);
    camera.lookAt(0, 0, 0);
    const viewHeight = mobile ? Math.max(15.5, (MAP_D + 3) / viewAspect) : Math.max(14, (MAP_W + 3) / viewAspect);
    camera.left = -viewHeight * viewAspect / 2;
    camera.right = viewHeight * viewAspect / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
  }
  fitCamera();
  const resizeObserver = new ResizeObserver(fitCamera);
  resizeObserver.observe(host);

  function handleLoss(): void {
    if (disposed || lost) return;
    lost = true;
    onDeviceLost();
  }
  const gpuBackend = renderer.backend as unknown as { device?: GPUDevice };
  gpuBackend.device?.lost.then(() => handleLoss()).catch(() => handleLoss());
  const onContextLost = (event: Event) => { event.preventDefault(); handleLoss(); };
  canvas.addEventListener('webglcontextlost', onContextLost);

  function render(frame: Frame, selectedPad: number | null, role: Role | null, reducedMotion: boolean): void {
    if (disposed || lost) return;
    if (lastFrame && frame.time < lastFrame.time) {
      for (const fx of seenEvents.values()) {
        scene.remove(fx.root); fx.root.visible = false;
        const pool = effectPool.get(fx.kind) ?? [];
        pool.push(fx);
        effectPool.set(fx.kind, pool);
      }
      seenEvents.clear();
    }
    latestFrameTime = frame.time;
    lastFrame = frame;
    occupiedPads.clear();
    const towersByKey = new Set<string>();
    const enemiesByKey = new Set<string>();
    const enemiesById = new Map(frame.enemies.map(enemy => [enemy.id, enemy]));

    for (const tower of frame.towers) {
      occupiedPads.add(tower.pad);
      const key = `tower:${tower.id}`;
      towersByKey.add(key);
      let actor = actors.get(key);
      if (!actor) {
        const pool = towerPools.get(tower.role) ?? [];
        actor = pool.pop() ?? soldierVisual(tower);
        if (actor.kind !== `tower:${tower.role}`) actor = soldierVisual(tower);
        if (actor.root.userData.rank !== tower.rank) applyRank(actor.root, tower.role, tower.rank);
        actor.body = actor.root.getObjectByName('soldier-body') as Group;
        actor.root.visible = true;
        actors.set(key, actor);
        scene.add(actor.root);
      }
      if (actor.root.userData.rank !== tower.rank) applyRank(actor.root, tower.role, tower.rank);
      const pad = padMap.get(tower.pad);
      const x = pad?.x ?? tower.x;
      const z = pad?.z ?? tower.z;
      updateActor(actor, x, z, 0.34);
      actor.body.rotation.y = 0;
      if (tower.targetId != null) {
        const target = enemiesById.get(tower.targetId);
        if (target) actor.body.rotation.y = Math.atan2(target.x - x, target.z - z);
      }
      const active = frame.time < tower.rageUntil;
      let aura = actor.root.getObjectByName('rage-aura') as Part | undefined;
      if (active && !aura) {
        aura = part(actor.root, geometry('rage-aura-geo', () => new TorusGeometry(0.83, 0.035, 7, 48)), basic('rage-aura-mat', 0xffbd59, { transparent: true, opacity: 0.76, toneMapped: false }));
        aura.rotation.x = Math.PI / 2;
        aura.position.y = 0.37;
        aura.name = 'rage-aura';
      } else if (aura) aura.visible = active;
    }

    for (const enemy of frame.enemies) {
      const key = `enemy:${enemy.id}`;
      enemiesByKey.add(key);
      let actor = actors.get(key);
      if (!actor) {
        actor = acquireEnemy(enemy);
        actors.set(key, actor);
      }
      updateActor(actor, enemy.x, enemy.z, 0.02);
      actor.root.rotation.y = 0;
      const heading = routeHeading(enemy.progress);
      actor.body.rotation.y = Math.atan2(heading.x, heading.z);
      const fraction = Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.maxHp)));
      actor.health.scale.x = (actor.healthBack.scale.x || 1) * fraction;
      actor.health.position.x = -(actor.healthBack.scale.x || 1) * (1 - fraction) * 0.5;
      let slowAura = actor.root.getObjectByName('slow-aura') as Part | undefined;
      const slowed = frame.time < enemy.slowUntil;
      if (slowed && !slowAura) {
        slowAura = part(actor.root, geometry('slow-aura-geo', () => new TorusGeometry(0.72, 0.035, 7, 36)), basic('slow-aura-mat', 0x4ddcf1, { transparent: true, opacity: 0.58, toneMapped: false }));
        slowAura.rotation.x = Math.PI / 2;
        slowAura.position.y = 0.06;
        slowAura.name = 'slow-aura';
      } else if (slowAura) slowAura.visible = slowed;
    }

    // Return vanished actors to bounded per-role/kind pools instead of allocating per frame.
    for (const [key, actor] of [...actors.entries()]) {
      if (key.startsWith('enemy:') && !enemiesByKey.has(key)) {
        scene.remove(actor.root);
        actor.root.visible = false;
        const kind = actor.kind as EnemyKind;
        const pool = enemyPools.get(kind) ?? [];
        pool.push(actor);
        enemyPools.set(kind, pool);
        actors.delete(key);
      } else if (key.startsWith('tower:') && !towersByKey.has(key)) {
        scene.remove(actor.root);
        actor.root.visible = false;
        actors.delete(key);
        const role = actor.kind.slice(6) as Role;
        const pool = towerPools.get(role) ?? [];
        pool.push(actor);
        towerPools.set(role, pool);
      }
    }
    const selected = selectedPad == null ? undefined : padMap.get(selectedPad);
    const selectedTower = selectedPad == null ? undefined : frame.towers.find(tower => tower.pad === selectedPad);
    const selectedRole = selectedTower?.role ?? role;
    if (selected && selectedRole) {
      if (!selectedRing) selectedRing = createRangeRing();
      const spec = UNITS[selectedRole].ranks[selectedTower?.rank ?? 0];
      selectedRing.position.set(selected.x, 0.055, selected.z);
      selectedRing.scale.set(spec.range, spec.range, 1);
    } else if (selectedRing) selectedRing.visible = false;
    if (selectedRing && selected && selectedRole) selectedRing.visible = true;
    setGhost(role, selected);

    for (const event of frame.events) {
      presentEffect(event, reducedMotion);
    }
    for (const [id, fx] of [...seenEvents.entries()]) {
      if (frame.time >= fx.expires) {
        scene.remove(fx.root);
        fx.root.visible = false;
        seenEvents.delete(id);
        const pool = effectPool.get(fx.kind) ?? [];
        pool.push(fx);
        effectPool.set(fx.kind, pool);
      }
    }
    renderer.render(scene, camera);
  }

  function project(point: Point): { x: number; y: number } {
    const rect = host.getBoundingClientRect();
    const projected = new Vector3(point.x, 0.35, point.z).project(camera);
    return { x: (projected.x * 0.5 + 0.5) * rect.width, y: (-projected.y * 0.5 + 0.5) * rect.height };
  }
  function dispose(): void {
    if (disposed) return;
    disposed = true;
    resizeObserver.disconnect();
    canvas.removeEventListener('webglcontextlost', onContextLost);
    renderer.setAnimationLoop(null);
    renderer.dispose();
    renderer.domElement.remove();
    for (const geo of geometries.values()) geo.dispose();
    for (const mat of materials.values()) mat.dispose();
    geometries.clear(); materials.clear(); actors.clear(); towerModels.clear(); towerPools.clear(); enemyPools.clear(); seenEvents.clear(); effectPool.clear();
    scene.clear();
  }
  return { render, project, backend, dispose };
}

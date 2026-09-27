export type Role = 'cadet' | 'gunner' | 'sniper' | 'grenadier' | 'engineer' | 'officer';
export type Rank = 0 | 1 | 2 | 3;
export type EnemyKind = 'scout' | 'runner' | 'swarm' | 'armored' | 'medic' | 'elite' | 'boss';
export type Phase = 'build' | 'combat' | 'victory' | 'defeat';
export type TargetPolicy = 'first' | 'strongest' | 'weakest';
export interface Point { x: number; z: number }
export interface Pad extends Point { id: number; name: string }
export interface RankSpec { name: string; cost: number; damage: number; rate: number; range: number; splash?: number; slow?: number; aura?: number }
export interface UnitSpec { id: Role; name: string; tag: string; description: string; special: string; color: string; ranks: [RankSpec, RankSpec, RankSpec, RankSpec] }
export interface EnemySpec { name: string; hp: number; speed: number; armor: number; plating: number; bounty: number; leak: number; color: string; description: string }
export interface SpawnGroup { kind: EnemyKind; count: number; at: number; interval: number }
export interface WaveSpec { number: number; name: string; briefing: string; lesson: string; reward: number; groups: SpawnGroup[]; bossName?: string; hpMultiplier: number }
export interface Tower extends Point { id: number; role: Role; rank: Rank; pad: number; cooldown: number; rageUntil: number; targetId: number | null; policy: TargetPolicy; kills: number; damageDealt: number; invested: number }
export interface Enemy extends Point { id: number; kind: EnemyKind; hp: number; maxHp: number; progress: number; armor: number; plating: number; speed: number; slowUntil: number; slowFactor: number; bounty: number; leak: number; boss: boolean }
export interface CombatEvent { id: number; time: number; kind: 'shot' | 'blast' | 'headshot' | 'rage' | 'kill' | 'leak' | 'wave-clear' | 'deploy' | 'upgrade' | 'airstrike'; from: Point; to: Point; role?: Role; amount?: number; boss?: boolean }
export interface GameStats { kills: number; headshots: number; headshotKills: number; rageProcs: number; damage: number; spent: number; earned: number; leaked: number }
export interface Frame { time: number; phase: Phase; paused: boolean; wave: number; waveTime: number; cash: number; lives: number; score: number; towers: Tower[]; enemies: Enemy[]; events: CombatEvent[]; stats: GameStats; spawned: number; waveTotal: number; nextWaveIn: number | null; airstrikes: number; airstrikeReadyIn: number }
export type Command = { kind: 'place'; role: Role; pad: number } | { kind: 'upgrade' | 'sell'; tower: number } | { kind: 'target'; tower: number; policy: TargetPolicy } | { kind: 'start-wave' | 'restart' | 'airstrike' } | { kind: 'pause'; value: boolean };
export type CommandResult = { ok: true } | { ok: false; reason: string };
export interface Session { command(command: Command): CommandResult; advance(ticks: number): void; frame(): Frame }
export interface Battlefield { render(frame: Frame, selectedPad: number | null, role: Role | null, reducedMotion: boolean): void; project(point: Point): { x: number; y: number }; backend: 'WebGPU' | 'WebGL2'; dispose(): void }

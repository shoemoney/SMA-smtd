import type { CombatEvent, Role } from './types';

type Clip = 'pistol' | 'rifle' | 'burst' | 'suppressed' | 'casing';
type Group = 'combat' | 'casing' | 'ui';
type FilterSpec = { type: BiquadFilterType; frequency: number; q?: number };
interface Voice { source: AudioScheduledSourceNode; gain: GainNode; nodes: AudioNode[]; group: Group }
const amplitude = (decibels: number) => 10 ** (decibels / 20);
const localClips: Record<string, string> = { pistol: 'pistol-shot.wav', rifle: 'rifle-shot.wav', burst: 'gunner-burst.wav' };
const voiceLimits: Record<Group, number> = { combat: 8, casing: 3, ui: 4 };

// Per-role shaping applied to the shared CC0 pistol/rifle buffers. Distinct (clip, rate, filter, volume)
// tuples give every role its own character out of the same three source recordings.
const SNIPER_FILTER: FilterSpec = { type: 'lowpass', frequency: 1500, q: 0.5 };
const ENGINEER_FILTER: FilterSpec = { type: 'highpass', frequency: 950, q: 0.8 };
const OFFICER_FILTER: FilterSpec = { type: 'bandpass', frequency: 1800, q: 1.4 };
const GRENADIER_FILTER: FilterSpec = { type: 'lowpass', frequency: 260, q: 0.7 };
const DETONATION_FILTER: FilterSpec = { type: 'lowpass', frequency: 650, q: 0.6 };
const BOSS_DEATH_FILTER: FilterSpec = { type: 'lowpass', frequency: 500, q: 0.5 };

export class BattlefieldAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = false;
  private loading: Promise<void> | null = null;
  private buffers = new Map<Clip, AudioBuffer>();
  private casing: AudioBuffer | null = null;
  private detonation: AudioBuffer | null = null;
  private muzzle: AudioBuffer | null = null;
  private impact: AudioBuffer | null = null;
  private voices = new Set<Voice>();
  private lastShot = -Infinity;
  private lastCasing = -Infinity;
  private lastImpact = -Infinity;
  private lastKill = -Infinity;
  private lastRage = -Infinity;
  private lastBossArrival = -Infinity;
  private lastRoleShot = new Map<Role, number>();
  private rageEnds = new Map<string, number>();
  private lastSimulationTime = -Infinity;

  async setEnabled(value: boolean) {
    this.enabled = value;
    if (!value) {
      if (this.context && this.master) this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.008);
      for (const voice of [...this.voices]) this.stop(voice);
      return;
    }
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain(); this.master.gain.value = 0;
      const limiter = this.context.createDynamicsCompressor();
      limiter.threshold.value = -18; limiter.knee.value = 10; limiter.ratio.value = 8;
      limiter.attack.value = 0.003; limiter.release.value = 0.18;
      this.master.connect(limiter).connect(this.context.destination);
      this.casing = this.createCasing();
      this.detonation = this.createDetonation();
      this.muzzle = this.createMuzzleBlast();
      this.impact = this.createImpact();
    }
    await this.context.resume();
    if (this.enabled) this.master!.gain.setTargetAtTime(amplitude(-10), this.context.currentTime, 0.02);
    this.loading ??= this.loadClips();
    await this.loading;
  }

  /** Derived purely from Frame data in the render loop (see main.ts) — no simulation event or state added. */
  bossArrival() {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running') return;
    const now = context.currentTime;
    if (now - this.lastBossArrival < 1) return;
    this.lastBossArrival = now;
    this.tone(90, 0.6, 0.2, now, 'ui', true);
    this.tone(150, 0.55, 0.14, now + 0.09, 'ui', true);
    this.tone(45, 0.85, 0.22, now + 0.18, 'ui', true);
  }

  play(event: CombatEvent) {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running') return;
    if (event.time < this.lastSimulationTime) {
      this.rageEnds.clear(); this.lastRoleShot.clear(); this.lastShot = -Infinity; this.lastCasing = -Infinity; this.lastImpact = -Infinity;
      this.lastKill = -Infinity; this.lastRage = -Infinity;
      for (const voice of [...this.voices]) this.stop(voice);
    }
    this.lastSimulationTime = event.time;
    const now = context.currentTime;
    if (event.kind === 'rage') {
      this.rageEnds.set(`${event.from.x}:${event.from.z}`, event.time + 5);
      this.rageCue(now);
      return;
    }
    if (event.kind === 'kill') { this.killCue(event, now); return; }
    if ((event.kind === 'shot' || event.kind === 'blast') && event.role) {
      const role = event.role;
      const raging = role === 'gunner' && event.time < (this.rageEnds.get(`${event.from.x}:${event.from.z}`) ?? 0);
      const interval = raging ? 0.22 : role === 'sniper' ? 0.15 : 0.065;
      if (now - (this.lastRoleShot.get(role) ?? -Infinity) < interval) return;
      if (role !== 'sniper' && now - this.lastShot < 0.045) return;
      this.lastRoleShot.set(role, now); this.lastShot = now;
      const pan = event.from.x / 24;
      let played = false;
      if (role === 'grenadier') {
        played = this.sample('rifle', now, -9, 0.42 + (event.id % 3) * 0.01, pan, GRENADIER_FILTER, true) ||
          this.tone(85, 0.25, 0.16, now, 'combat', true);
        if (played && this.detonation) {
          this.buffer(this.detonation, now + 0.045, -6, 0.95 + (event.id % 5) * 0.01, 'combat', pan, DETONATION_FILTER, false, 0, 0.34);
        }
      } else if (role === 'engineer') {
        played = this.sample('pistol', now, -9, 0.9 + (event.id % 5) * 0.01, pan, ENGINEER_FILTER, false) ||
          this.tone(170, 0.055, 0.05, now, 'combat', true);
      } else if (role === 'officer') {
        played = this.sample('pistol', now, -8, 1.05 + (event.id % 5) * 0.01, pan, OFFICER_FILTER, false) ||
          this.tone(170, 0.055, 0.05, now, 'combat', true);
        if (played) this.tone(1400, 0.05, 0.025, now + 0.015, 'ui', false);
      } else {
        const suppressed = role === 'sniper' && this.buffers.has('suppressed');
        const clip: Clip = suppressed ? 'suppressed' : role === 'sniper' ? 'rifle' : role === 'gunner' ? (raging ? 'burst' : 'rifle') : 'pistol';
        const rate = role === 'sniper' && !suppressed ? 0.75 : 0.98 + (event.id % 5) * 0.01;
        const volume = suppressed ? -8 : role === 'sniper' ? -15 : raging ? -14 : clip === 'rifle' ? -11 : -7;
        const filter = role === 'sniper' && !suppressed ? SNIPER_FILTER : null;
        played = this.sample(clip, now, volume, rate, pan, filter, role === 'sniper') ||
          this.tone(role === 'sniper' ? 95 : 170, 0.055, 0.055, now, 'combat', true);
      }
      // Bang under the shot: pitched per role so the six voices stay distinct, and taking an
      // ordinary (non-priority) voice so a busy wave drops the layer instead of the shot itself.
      // The Grenadier already carries its own detonation layer and is excluded.
      if (played && role !== 'grenadier' && this.muzzle) {
        const heavy = role === 'gunner' || role === 'sniper';
        this.buffer(this.muzzle, now, heavy ? -13 : -16,
          (role === 'sniper' ? 0.82 : heavy ? 0.95 : 1.12) + (event.id % 4) * 0.012,
          'combat', pan, role === 'sniper' ? SNIPER_FILTER : null, false, 0, 0.2);
      }
      // Impact, timed to the tracer: battlefield.ts lands the round at 70% of a 0.32 s effect.
      // Rate-limited separately so sustained fire does not turn into a drum roll.
      if (played && role !== 'grenadier' && this.impact && now - this.lastImpact >= 0.12) {
        this.lastImpact = now;
        this.buffer(this.impact, now + 0.22, -19, 0.94 + (event.id % 5) * 0.03, 'combat', pan, null, false, 0, 0.09);
      }
      if (played && role !== 'grenadier' && now - this.lastCasing >= 0.2) {
        this.lastCasing = now;
        const delay = (role === 'sniper' ? 0.32 : role === 'gunner' ? 0.2 : 0.18) + (event.id % 3) * 0.012;
        const casing = this.buffers.get('casing') ?? this.casing!;
        this.buffer(casing, now + delay, this.buffers.has('casing') ? -18 : -6,
          0.96 + (event.id % 7) * 0.012, 'casing', pan, null, false, 0, Math.min(casing.duration, 0.85));
      }
      return;
    }
    const notes: Partial<Record<CombatEvent['kind'], [number, number, number]>> = {
      airstrike: [38, 0.85, 0.13], headshot: [800, 0.12, 0.07],
      leak: [120, 0.3, 0.085], deploy: [520, 0.12, 0.075], upgrade: [750, 0.18, 0.08],
      'wave-clear': [960, 0.35, 0.09],
    };
    const note = notes[event.kind];
    if (note) this.tone(...note, now, 'ui', false, event.kind === 'upgrade');
  }

  private killCue(event: CombatEvent, now: number) {
    if (now - this.lastKill < 0.045) return;
    this.lastKill = now;
    if (event.boss) {
      this.tone(200, 0.55, 0.22, now, 'combat', true);
      this.tone(120, 0.5, 0.18, now + 0.06, 'combat', true);
      if (this.detonation) this.buffer(this.detonation, now, -4, 0.5, 'combat', 0, BOSS_DEATH_FILTER, true, 0, 0.4);
      return;
    }
    this.tone(1050, 0.05, 0.05, now, 'ui', true, true);
    this.tone(1575, 0.035, 0.03, now + 0.016, 'ui', true, true);
  }

  private rageCue(now: number) {
    if (now - this.lastRage < 0.4) return;
    this.lastRage = now;
    this.tone(260, 0.32, 0.15, now, 'ui', true, true);
    this.tone(390, 0.26, 0.1, now + 0.04, 'ui', true, true);
  }

  private async loadClips() {
    const base = new URL(import.meta.env.BASE_URL, document.baseURI);
    const requests: [Clip, URL][] = Object.entries(localClips).map(([clip, filename]) => [clip as Clip, new URL(`audio/${filename}`, base)]);
    if (location.hostname === 'arcade.shoemoney.com') {
      requests.push(['suppressed', new URL('/last-engineer/game/audio/sfx/pistol_suppressed.mp3', location.origin)],
        ['casing', new URL('/last-engineer/game/audio/sfx/bullet_casing.mp3', location.origin)]);
    }
    await Promise.allSettled(requests.map(async ([clip, url]) => {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) return;
      this.buffers.set(clip, await this.context!.decodeAudioData(await response.arrayBuffer()));
    }));
  }

  private sample(clip: Clip, at: number, decibels: number, rate: number, pan: number, filter: FilterSpec | null, priority: boolean) {
    const buffer = this.buffers.get(clip);
    if (!buffer) return false;
    const duration = clip === 'suppressed' ? buffer.duration : clip === 'burst' ? 0.62 : filter ? 0.44 : 0.58;
    return this.buffer(buffer, at, decibels, rate, 'combat', pan, filter, priority,
      clip === 'burst' || clip === 'suppressed' ? 0 : 0.1, duration);
  }

  private buffer(buffer: AudioBuffer, at: number, decibels: number, rate: number, group: Group,
    pan: number, filter: FilterSpec | null = null, priority = false, offset = 0, duration = buffer.duration) {
    const context = this.context!;
    const source = context.createBufferSource(); source.buffer = buffer; source.playbackRate.value = rate;
    const voice = this.voice(source, group, priority);
    if (!voice) return false;
    const seconds = Math.min(duration, buffer.duration - offset) / rate;
    voice.gain.gain.setValueAtTime(amplitude(decibels), at);
    voice.gain.gain.setValueAtTime(amplitude(decibels), at + Math.max(0, seconds - 0.035));
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    let destination: AudioNode = source;
    if (filter) {
      const node = context.createBiquadFilter(); node.type = filter.type; node.frequency.value = filter.frequency; node.Q.value = filter.q ?? 0.5;
      destination.connect(node); destination = node; voice.nodes.push(node);
    }
    const position = context.createStereoPanner(); position.pan.value = Math.max(-0.65, Math.min(0.65, pan));
    destination.connect(position).connect(voice.gain); voice.nodes.push(position);
    source.start(at, offset, Math.min(duration, buffer.duration - offset));
    return true;
  }

  private tone(frequency: number, duration: number, volume: number, at: number, group: Group, triangle = false, rising = false) {
    const source = this.context!.createOscillator();
    const voice = this.voice(source, group, group === 'ui');
    if (!voice) return false;
    source.type = triangle ? 'triangle' : 'sine';
    source.frequency.setValueAtTime(frequency, at);
    source.frequency.exponentialRampToValueAtTime(frequency * (rising ? 1.5 : 0.5), at + duration);
    voice.gain.gain.setValueAtTime(volume, at);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(voice.gain); source.start(at); source.stop(at + duration);
    return true;
  }

  private voice(source: AudioScheduledSourceNode, group: Group, priority: boolean): Voice | null {
    const matching = [...this.voices].filter(voice => voice.group === group);
    if (matching.length >= voiceLimits[group]) {
      if (!priority) return null;
      this.stop(matching[0]!);
    }
    const gain = this.context!.createGain(); gain.connect(this.master!);
    const voice = { source, gain, nodes: [] as AudioNode[], group };
    this.voices.add(voice);
    source.onended = () => {
      this.voices.delete(voice); source.disconnect(); gain.disconnect();
      for (const node of voice.nodes) node.disconnect();
    };
    return voice;
  }

  private stop(voice: Voice) {
    this.voices.delete(voice);
    try { voice.source.stop(); } catch {}
  }

  private createCasing() {
    const rate = this.context!.sampleRate;
    const buffer = this.context!.createBuffer(1, Math.round(rate * 0.26), rate);
    const data = buffer.getChannelData(0);
    let state = 19;
    for (let index = 0; index < data.length; index++) {
      const time = index / rate;
      const bounce = time < 0.11 ? time : time - 0.11;
      const level = time < 0.11 ? 0.1 : 0.045;
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const noise = state / 4294967296 * 2 - 1;
      data[index] = level * Math.exp(-bounce * 45) *
        (Math.sin(bounce * 4200 * Math.PI * 2) + Math.sin(bounce * 6700 * Math.PI * 2) * 0.55 + noise * 0.2);
    }
    return buffer;
  }

  /** Procedural explosion burst: broadband noise decay plus a short high crackle overlay. Used for the
   * grenadier's detonation layer and, at a lower rate, the boss-death cue. */
  /**
   * A short muzzle blast: near-instant attack, a broadband crack, and a low body thump.
   * Layered under the CC0 firearm samples so every shot lands with a bang rather than a
   * click, and synthesized rather than sampled so the licensing statement in ASSETS.md
   * stays true.
   */
  private createMuzzleBlast() {
    const rate = this.context!.sampleRate;
    const buffer = this.context!.createBuffer(1, Math.round(rate * 0.24), rate);
    const data = buffer.getChannelData(0);
    let state = 8191;
    for (let index = 0; index < data.length; index++) {
      const time = index / rate;
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const noise = state / 4294967296 * 2 - 1;
      const attack = Math.min(1, time / 0.0012);
      const crack = noise * Math.exp(-time * 46) * 0.85;
      const body = Math.sin(time * 132 * Math.PI * 2) * Math.exp(-time * 26) * 0.5;
      const snap = Math.sin(time * 1900 * Math.PI * 2) * Math.exp(-time * 150) * 0.18;
      data[index] = attack * (crack + body + snap);
    }
    return buffer;
  }

  /** A dull, short thud for a round striking a target: low body, almost no top end. */
  private createImpact() {
    const rate = this.context!.sampleRate;
    const buffer = this.context!.createBuffer(1, Math.round(rate * 0.09), rate);
    const data = buffer.getChannelData(0);
    let state = 4099;
    for (let index = 0; index < data.length; index++) {
      const time = index / rate;
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const noise = state / 4294967296 * 2 - 1;
      data[index] = Math.min(1, time / 0.0008) * (Math.sin(time * 210 * Math.PI * 2) * 0.6 + noise * 0.35) * Math.exp(-time * 60);
    }
    return buffer;
  }

  private createDetonation() {
    const rate = this.context!.sampleRate;
    const buffer = this.context!.createBuffer(1, Math.round(rate * 0.4), rate);
    const data = buffer.getChannelData(0);
    let state = 733;
    for (let index = 0; index < data.length; index++) {
      const time = index / rate;
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const noise = state / 4294967296 * 2 - 1;
      const crackle = Math.sin(time * 5200 * Math.PI * 2) * Math.exp(-time * 90) * 0.25;
      data[index] = noise * Math.exp(-time * 9) * 0.9 + crackle;
    }
    return buffer;
  }
}

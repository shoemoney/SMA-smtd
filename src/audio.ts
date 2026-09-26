import type { CombatEvent, Role } from './types';

type Clip = 'pistol' | 'rifle' | 'burst' | 'suppressed' | 'casing';
type Group = 'combat' | 'casing' | 'ui';
interface Voice { source: AudioScheduledSourceNode; gain: GainNode; nodes: AudioNode[]; group: Group }
const amplitude = (decibels: number) => 10 ** (decibels / 20);
const localClips: Record<string, string> = { pistol: 'pistol-shot.wav', rifle: 'rifle-shot.wav', burst: 'gunner-burst.wav' };
const voiceLimits: Record<Group, number> = { combat: 8, casing: 3, ui: 4 };

export class BattlefieldAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = false;
  private loading: Promise<void> | null = null;
  private buffers = new Map<Clip, AudioBuffer>();
  private casing: AudioBuffer | null = null;
  private voices = new Set<Voice>();
  private lastShot = -Infinity;
  private lastCasing = -Infinity;
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
    }
    await this.context.resume();
    if (this.enabled) this.master!.gain.setTargetAtTime(amplitude(-10), this.context.currentTime, 0.02);
    this.loading ??= this.loadClips();
    await this.loading;
  }

  play(event: CombatEvent) {
    const context = this.context;
    if (!this.enabled || !context || context.state !== 'running') return;
    if (event.time < this.lastSimulationTime) {
      this.rageEnds.clear(); this.lastRoleShot.clear(); this.lastShot = -Infinity; this.lastCasing = -Infinity;
      for (const voice of [...this.voices]) this.stop(voice);
    }
    this.lastSimulationTime = event.time;
    const now = context.currentTime;
    if (event.kind === 'rage') {
      this.rageEnds.set(`${event.from.x}:${event.from.z}`, event.time + 5);
      return;
    }
    if (event.kind === 'shot' && event.role) {
      const role = event.role;
      const raging = role === 'gunner' && event.time < (this.rageEnds.get(`${event.from.x}:${event.from.z}`) ?? 0);
      const interval = raging ? 0.22 : role === 'sniper' ? 0.15 : 0.065;
      if (now - (this.lastRoleShot.get(role) ?? -Infinity) < interval) return;
      if (role !== 'sniper' && now - this.lastShot < 0.045) return;
      this.lastRoleShot.set(role, now); this.lastShot = now;
      const suppressed = role === 'sniper' && this.buffers.has('suppressed');
      const clip: Clip = suppressed ? 'suppressed' : role === 'sniper' ? 'rifle' : role === 'gunner' ? raging ? 'burst' : 'rifle' : 'pistol';
      const rate = role === 'sniper' && !suppressed ? 0.75 : 0.98 + (event.id % 5) * 0.01;
      const volume = suppressed ? -8 : role === 'sniper' ? -15 : raging ? -14 : clip === 'rifle' ? -11 : -7;
      const played = this.sample(clip, now, volume, rate, event.from.x / 24,
        role === 'sniper' && !suppressed, role === 'sniper') ||
        this.tone(role === 'sniper' ? 95 : 170, 0.055, 0.055, now, 'combat', true);
      if (played && now - this.lastCasing >= 0.2) {
        this.lastCasing = now;
        const delay = (role === 'sniper' ? 0.32 : role === 'gunner' ? 0.2 : 0.18) + (event.id % 3) * 0.012;
        const casing = this.buffers.get('casing') ?? this.casing!;
        this.buffer(casing, now + delay, this.buffers.has('casing') ? -18 : -6,
          0.96 + (event.id % 7) * 0.012, 'casing', event.from.x / 24, false, false, 0, Math.min(casing.duration, 0.85));
      }
      return;
    }
    const notes: Partial<Record<CombatEvent['kind'], [number, number, number]>> = {
      airstrike: [38, 0.85, 0.13], blast: [55, 0.2, 0.1], headshot: [800, 0.12, 0.07],
      leak: [120, 0.3, 0.085], deploy: [520, 0.12, 0.075], upgrade: [750, 0.18, 0.08],
      'wave-clear': [960, 0.35, 0.09],
    };
    const note = notes[event.kind];
    if (note) this.tone(...note, now, event.kind === 'blast' ? 'combat' : 'ui', false, event.kind === 'upgrade');
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

  private sample(clip: Clip, at: number, decibels: number, rate: number, pan: number, filtered: boolean, priority: boolean) {
    const buffer = this.buffers.get(clip);
    if (!buffer) return false;
    const duration = clip === 'suppressed' ? buffer.duration : clip === 'burst' ? 0.62 : filtered ? 0.44 : 0.58;
    return this.buffer(buffer, at, decibels, rate, 'combat', pan, filtered, priority,
      clip === 'burst' || clip === 'suppressed' ? 0 : 0.1, duration);
  }

  private buffer(buffer: AudioBuffer, at: number, decibels: number, rate: number, group: Group,
    pan: number, filtered = false, priority = false, offset = 0, duration = buffer.duration) {
    const context = this.context!;
    const source = context.createBufferSource(); source.buffer = buffer; source.playbackRate.value = rate;
    const voice = this.voice(source, group, priority);
    if (!voice) return false;
    const seconds = Math.min(duration, buffer.duration - offset) / rate;
    voice.gain.gain.setValueAtTime(amplitude(decibels), at);
    voice.gain.gain.setValueAtTime(amplitude(decibels), at + Math.max(0, seconds - 0.035));
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    let destination: AudioNode = source;
    if (filtered) {
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1500; filter.Q.value = 0.5;
      destination.connect(filter); destination = filter; voice.nodes.push(filter);
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
}

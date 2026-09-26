import './style.css';
import { icon, type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faShieldHalved, faCoins, faFlag, faPlay, faPause, faVolumeHigh, faVolumeXmark, faBookOpen, faGun, faPersonMilitaryRifle, faCrosshairs, faBomb, faScrewdriverWrench, faWalkieTalkie, faBolt, faRotateRight, faXmark, faMedal, faCode, faExpand, faCircleInfo, faCircleCheck, faTrashCan, faGamepad, faJetFighter } from '@fortawesome/free-solid-svg-icons';
import { createSession } from './game';
import { createBattlefield } from './battlefield';
import { UNITS, PADS, WAVES, waveBounty } from './content';
import { BattlefieldAudio } from './audio';
import type { Battlefield, Frame, Role, Command, TargetPolicy } from './types';

const symbols: Record<Role, IconDefinition> = { cadet: faGun, gunner: faPersonMilitaryRifle, sniper: faCrosshairs, grenadier: faBomb, engineer: faScrewdriverWrench, officer: faWalkieTalkie };
export const fa = (symbol: IconDefinition) => icon(symbol, { attributes: { 'aria-hidden': 'true' } }).html.join('');
const roles = Object.keys(UNITS) as Role[];
const money = (value: number) => Math.floor(value).toLocaleString('en-US');
const get = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const session = createSession(7341);
const sound = new BattlefieldAudio();
let selectedRole: Role | null = 'cadet';
let previewRole: Role | null = null;
let selectedPad: number | null = null;
let speed = 1;
let audioEnabled = false;
let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let battlefield: Battlefield | null = null;
let battlefieldReady = false;
let lastEvent = -1;
const knownBossIds = new Set<number>();
let lastInspectorKey = '';
let ended = false;
let runToken: string | null = null;
let tokenPromise: Promise<void> | null = null;
let runGeneration = 0;
let scoreSubmission: Record<string, string | number> | null = null;
let savedBest = 0;
try { savedBest = Number(localStorage.getItem('smtd-best-v1')) || 0; } catch {}

get('#app').innerHTML = `
  <header class="site-header"><a class="brand" href="https://arcade.shoemoney.com/" aria-label="ShoeMoney Arcade"><img src="./brand/shoemoney.png" alt="" width="52" height="52"><span>SHOEMONEY<span class="brand-sub">ARCADE / ORIGINALS</span></span></a><nav aria-label="Game navigation"><button id="manual-open" class="quiet" aria-label="Field manual">${fa(faBookOpen)}<span>Field manual</span></button><button id="sound" class="icon-button" aria-label="Enable sound" aria-pressed="false">${fa(faVolumeXmark)}</button><a class="icon-button source-link" href="https://github.com/shoemoney/SMA-smtd" aria-label="Open source on GitHub">${fa(faCode)}</a></nav></header>
  <main>
    <section class="mission-heading"><div><p class="eyebrow"><span class="status-light"></span> OPERATION IRON DIVIDEND</p><h1>HOLD THE <span>LINE.</span></h1></div><p class="mission-intro">Six soldiers. Thirty waves. <br>One outpost worth defending.</p></section>
    <section class="command-layout" aria-label="Tower defense game">
      <div class="battle-column">
        <div class="battle-hud"><div class="hud-stat">${fa(faShieldHalved)}<div><span>BASE INTEGRITY</span><strong id="lives">20 <small>/ 20</small></strong></div></div><div class="hud-stat">${fa(faCoins)}<div><span>FUNDS</span><strong id="cash">100</strong></div></div><div class="hud-stat">${fa(faFlag)}<div><span>WAVE</span><strong id="wave">00 <small>/ 30</small></strong></div></div><div class="hud-stat score-stat">${fa(faMedal)}<div><span>SCORE</span><strong id="score">0</strong></div></div></div>
        <div id="battlefield" class="battlefield" aria-label="Guardian Outpost battlefield">
          <img class="robot-backdrop" src="./brand/robot.webp" alt="" aria-hidden="true">
          <div class="battle-grid"></div><div id="scene" class="scene"></div><div id="pads" class="pad-layer" aria-label="Deployment positions"></div>
          <div class="field-caption"><span><span class="status-light"></span> GUARDIAN OUTPOST</span><span id="renderer-status">INITIALIZING</span></div>
          <div class="field-bottom"><span id="field-message">Choose a soldier, then an empty position.</span><button id="fullscreen" class="icon-button" aria-label="Expand game">${fa(faExpand)}</button></div>
          <div id="loading" class="field-overlay"><span class="loading-orbit"></span><h2>Preparing the outpost</h2><p>Establishing battlefield visuals.</p></div>
          <div id="pause-overlay" class="field-overlay paused-overlay" hidden><h2>Orders on hold.</h2><p>Your squad is waiting. Take your time.</p><button id="resume" class="primary">${fa(faPlay)} Resume operation</button></div>
        </div>
        <div class="battle-controls"><div class="wave-progress"><span id="phase-label">DEPLOYMENT PHASE</span><div class="progress-track"><div id="wave-progress"></div></div><span id="hostiles">Prepare your squad</span></div><div class="control-actions"><button id="airstrike" class="airstrike-button">${fa(faJetFighter)} Airstrike · 3</button><button id="speed" class="quiet" aria-label="Switch to double speed">1× speed</button><button id="pause" class="icon-button" aria-label="Pause operation">${fa(faPause)}</button><button id="send-wave" class="primary">${fa(faPlay)} Send wave 01</button></div></div>
      </div>
      <aside class="command-panel"><div class="panel-kicker">${fa(faWalkieTalkie)} COMMAND CENTER</div><div id="inspector"></div><div class="intel"><p class="eyebrow">NEXT CONTACT</p><h3 id="intel-title"></h3><p id="intel-brief"></p><div id="intel-tags" class="intel-tags"></div></div><p id="notice" class="notice" role="status" aria-live="polite">Choose a soldier. Select a numbered position to deploy.</p></aside>
    </section>
    <section class="roster-section" aria-labelledby="roster-heading"><div class="section-heading"><h2 id="roster-heading">YOUR SQUAD<span>Choose. Deploy. Upgrade.</span></h2><span class="keyboard-hint">Hover for stats · Keys 1–6</span></div><div class="roster">${roles.map((role, i) => `<button class="unit-card ${role === 'cadet' ? 'selected' : ''}" data-role="${role}" aria-pressed="${role === 'cadet'}" style="--unit-color:${UNITS[role].color}"><div class="unit-card-top"><span class="unit-icon">${fa(symbols[role])}</span><span class="unit-key">0${i + 1}</span></div><strong>${UNITS[role].name}</strong><span class="unit-tag">${UNITS[role].tag}</span><span class="unit-cost">${fa(faCoins)} $${money(UNITS[role].ranks[0].cost)}<span class="unit-purchase">DEPLOY</span></span></button>`).join('')}</div></section>
    <footer class="game-footer"><p>${fa(faShieldHalved)} BUILT TO DEFEND. MADE TO PLAY.</p><div><button id="help-open" class="text-button">How to play</button><button id="restart-open" class="text-button">Restart operation</button><button id="motion" class="text-button" aria-pressed="${reducedMotion}">Motion: ${reducedMotion ? 'reduced' : 'full'}</button></div></footer>
  </main>
  <div id="unit-tooltip" class="unit-tooltip" role="tooltip" hidden></div>
  <dialog id="manual" class="manual-dialog" aria-labelledby="manual-title"><div class="dialog-heading"><div><p class="eyebrow">SHOEMONEY FIELD MANUAL</p><h2 id="manual-title">Know your battlefield.</h2></div><button class="icon-button" data-close="manual" aria-label="Close field manual">${fa(faXmark)}</button></div><div id="manual-content"></div></dialog>
  <dialog id="help" class="small-dialog" aria-labelledby="help-title"><div class="dialog-heading"><h2 id="help-title">Your first deployment.</h2><button class="icon-button" data-close="help" aria-label="Close help">${fa(faXmark)}</button></div><ol class="help-steps"><li><strong>Choose a soldier.</strong> Select any of the six soldier cards. Hover a card for its stats, or tap to select it. A Cadet is a reliable first recruit.</li><li><strong>Take a position.</strong> Select an empty numbered pad. The blue circle shows the selected soldier's range.</li><li><strong>Launch the operation.</strong> After your first launch, new waves arrive automatically after a six-second break. A boss comes every five waves with escorts.</li><li><strong>Reinforce the line.</strong> Select a deployed soldier to upgrade, change targeting, or sell for 70% of the supplies invested.</li></ol><p>Stop every enemy before it reaches headquarters. Enemies that escape damage base integrity. Defend all 30 waves to win. You start with $100. Cadets cost $10. Normal monsters pay $1 each on wave one, increasing by $1 every three waves.</p><p>You have three airstrikes for the entire run. They clear current normal enemies and remove 35% of each current boss's maximum health. Strikes need 12 seconds to rearm. Future enemies are unaffected.</p><p>Space launches the operation or pauses combat. A calls an airstrike. Escape closes a panel. You can deploy and upgrade during combat. Each soldier has three upgrades.</p><button class="primary" data-close="help">${fa(faCircleCheck)} Ready for duty</button></dialog>
  <dialog id="restart" class="small-dialog" aria-labelledby="restart-title"><div class="dialog-heading"><h2 id="restart-title">Start a fresh operation?</h2><button class="icon-button" data-close="restart" aria-label="Cancel restart">${fa(faXmark)}</button></div><p>Your current squad and wave progress will reset. Your personal best stays saved.</p><div class="dialog-actions"><button class="quiet" data-close="restart">Keep defending</button><button id="restart-confirm" class="primary">${fa(faRotateRight)} Restart</button></div></dialog>
  <dialog id="result" class="small-dialog result-dialog" aria-labelledby="result-title"><p class="eyebrow">OPERATION REPORT</p><h2 id="result-title"></h2><p id="result-copy"></p><div class="result-stats" id="result-stats"></div><p id="personal-best"></p><form id="score-form"><label for="player-name">Your name on the arcade board</label><input id="player-name" name="name" maxlength="24" placeholder="Commander" required autocomplete="nickname"><button class="quiet" id="submit-score" type="submit">${fa(faMedal)} Submit score</button><p id="score-message">Scores are reported by your browser.</p></form><div class="dialog-actions"><button class="quiet" data-close="result">Review battlefield</button><button id="play-again" class="primary">${fa(faRotateRight)} Play again</button></div></dialog>
`;


const padButtons = PADS.map(pad => {
  const button = document.createElement('button');
  button.className = 'pad-button';
  button.textContent = String(pad.id + 1).padStart(2, '0');
  button.setAttribute('aria-label', `Position ${pad.id + 1}, ${pad.name}, empty`);
  button.dataset.pad = String(pad.id);
  button.addEventListener('click', () => {
    if (!battlefieldReady) return;
    const frame = session.frame();
    const tower = frame.towers.find(t => t.pad === pad.id);
    selectedPad = pad.id;
    if (tower) { selectedRole = tower.role; announce(`${UNITS[tower.role].name} selected. Rank ${tower.rank + 1}.`); }
    else if (selectedRole) act({ kind: 'place', role: selectedRole, pad: pad.id });
    renderHud(true);
  });
  get('#pads').append(button);
  return button;
});

function announce(message: string) { get('#notice').textContent = message; }

function act(command: Command) {
  if (!battlefieldReady && (command.kind === 'airstrike' || command.kind === 'start-wave' || command.kind === 'pause' && !command.value)) {
    announce('Restore the battlefield before resuming the operation.');
    return false;
  }
  const result = session.command(command);
  if (!result.ok) announce(result.reason);
  else if (command.kind === 'place') announce(`${UNITS[command.role].name} deployed to position ${command.pad + 1}.`);
  else if (command.kind === 'upgrade') announce('Promotion confirmed. Your soldier is ready.');
  else if (command.kind === 'sell') { selectedPad = null; announce('Soldier recalled. 70% of invested supplies returned.'); }
  else if (command.kind === 'airstrike') announce('Airstrike inbound. Current normal enemies cleared. Bosses hit for 35% of maximum health.');
  else if (command.kind === 'start-wave') {
    announce(`Wave ${session.frame().wave} incoming. Hold the line.`);
    if (session.frame().wave === 1) beginScoreRun();
  }
  renderHud(true);
  return result.ok;
}

function renderHud(force = false) {
  const f = session.frame();
  get('#lives').innerHTML = `${f.lives} <small>/ 20</small>`;
  get('#cash').textContent = `$${money(f.cash)}`;
  get('#wave').innerHTML = `${String(f.wave).padStart(2, '0')} <small>/ 30</small>`;
  get('#score').textContent = money(f.score);
  get('#phase-label').textContent = f.paused ? 'OPERATION PAUSED' : f.phase === 'build' ? 'DEPLOYMENT PHASE' : f.phase === 'combat' ? 'CONTACT IN PROGRESS' : f.phase === 'victory' ? 'OUTPOST SECURED' : 'OUTPOST LOST';
  const remaining = Math.max(0, f.waveTotal - f.spawned + f.enemies.length);
  get('#hostiles').textContent = f.phase === 'combat' ? `${remaining} hostiles remaining` : f.phase === 'build' ? f.wave ? `Next wave in ${Math.ceil(f.nextWaveIn ?? 0)} seconds` : 'Prepare your squad' : `${f.stats.kills} hostiles stopped`;
  get('#wave-progress').style.width = `${f.waveTotal ? Math.max(0, (f.waveTotal - remaining) / f.waveTotal * 100) : 0}%`;
  const send = get<HTMLButtonElement>('#send-wave');
  send.disabled = !battlefieldReady || f.phase !== 'build' || f.paused || f.wave > 0;
  send.innerHTML = `${fa(faPlay)} ${f.phase === 'combat' ? 'Wave in progress' : f.wave >= 30 ? 'Operation complete' : f.wave > 0 ? `Next wave in ${Math.ceil(f.nextWaveIn ?? 0)}s` : 'Launch operation'}`;
  const strike = get<HTMLButtonElement>('#airstrike');
  strike.disabled = !battlefieldReady || f.paused || f.phase !== 'combat' || f.airstrikes === 0 || f.airstrikeReadyIn > 0 || f.enemies.length === 0;
  strike.innerHTML = `${fa(faJetFighter)} ${f.airstrikeReadyIn > 0 ? `Rearming ${Math.ceil(f.airstrikeReadyIn)}s` : `Airstrike · ${f.airstrikes}`}`;
  strike.setAttribute('aria-label', `Call airstrike, ${f.airstrikes} remaining${f.airstrikeReadyIn > 0 ? ', rearming' : ''}`);
  get('#pause').innerHTML = fa(f.paused ? faPlay : faPause);
  get('#pause').setAttribute('aria-label', f.paused ? 'Resume operation' : 'Pause operation');
  get('#pause-overlay').hidden = !f.paused;
  const next = WAVES[Math.min(f.phase === 'combat' ? f.wave - 1 : f.wave, WAVES.length - 1)];
  get('#intel-title').textContent = `${String(next.number).padStart(2, '0')} / ${next.name}`;
  get('#intel-brief').textContent = next.briefing;
  get('#intel-tags').innerHTML = `<span>${next.groups.reduce((sum, g) => sum + g.count, 0)} contacts</span><span>${fa(faCoins)} $${next.reward} clear bonus</span><span>$${waveBounty(next.number)} per monster</span>${next.bossName ? '<span class="danger-tag">BOSS CONTACT</span>' : ''}`;
  
  const tower = previewRole ? undefined : f.towers.find(t => t.pad === selectedPad);
  const role = previewRole ?? tower?.role ?? selectedRole ?? 'cadet';
  const unit = UNITS[role];
  const rank = tower?.rank ?? 0;
  const stat = unit.ranks[rank];
  const nextRank = unit.ranks[rank + 1];
  const inspectorKey = `${role}:${tower?.id}:${rank}:${tower?.policy}`;
  if (force || inspectorKey !== lastInspectorKey) {
    lastInspectorKey = inspectorKey;
    get('#inspector').innerHTML = `<div class="selected-unit" style="--unit-color:${unit.color}"><div class="selected-unit-top"><div class="inspector-icon">${fa(symbols[role])}</div><span class="unit-rank">${tower ? `RANK ${rank + 1} / 4` : 'READY TO DEPLOY'}</span></div><h2>${unit.name}</h2><p class="unit-subtitle">${stat.name}</p><p class="unit-description">${unit.description}</p><div class="unit-stats"><div><span>DAMAGE</span><strong>${stat.damage}</strong></div><div><span>FIRE / SEC</span><strong>${String(stat.rate)}</strong></div><div><span>RANGE</span><strong>${stat.range.toFixed(1)}m</strong></div></div><div class="special"><span>${fa(role === 'cadet' ? faCircleInfo : faBolt)} ${role === 'cadet' ? 'STANDARD ISSUE' : 'SPECIAL ABILITY'}</span><p>${unit.special}</p></div>${tower ? `<label class="target-label" for="target-policy">Target priority</label><select id="target-policy"><option value="first" ${tower.policy === 'first' ? 'selected' : ''}>First to headquarters</option><option value="strongest" ${tower.policy === 'strongest' ? 'selected' : ''}>Strongest enemy</option><option value="weakest" ${tower.policy === 'weakest' ? 'selected' : ''}>Weakest enemy</option></select><div class="promotion">${nextRank ? `<button id="upgrade" class="primary">${fa(faMedal)} Upgrade · $${money(nextRank.cost)}</button><p>${nextRank.name} · ${nextRank.damage} damage · ${String(nextRank.rate)} shots/sec</p>` : '<p class="max-rank">Maximum rank. Fully equipped.</p>'}<button id="sell" class="text-button">${fa(faTrashCan)} Recall for $${money(Math.floor(tower.invested * .7))}</button></div>` : `<div class="deploy-prompt">${fa(faCoins)} <strong>$${stat.cost} deployment</strong><p>Select an empty numbered position.</p></div>`}</div>`;
    get<HTMLButtonElement>('#upgrade')?.addEventListener('click', () => act({ kind: 'upgrade', tower: tower!.id }));
    get<HTMLButtonElement>('#sell')?.addEventListener('click', () => act({ kind: 'sell', tower: tower!.id }));
    get<HTMLSelectElement>('#target-policy')?.addEventListener('change', event => act({ kind: 'target', tower: tower!.id, policy: (event.target as HTMLSelectElement).value as TargetPolicy }));
  }
  const upgrade = get<HTMLButtonElement>('#upgrade');
  if (upgrade) upgrade.disabled = !nextRank || f.cash < nextRank.cost || f.phase === 'victory' || f.phase === 'defeat';
  document.querySelectorAll<HTMLButtonElement>('[data-role]').forEach(button => {
    const id = button.dataset.role as Role;
    button.classList.toggle('selected', selectedRole === id);
    const unaffordable = f.cash < UNITS[id].ranks[0].cost;
    button.classList.toggle('unaffordable', unaffordable);
    button.setAttribute('aria-disabled', String(unaffordable));
    button.setAttribute('aria-pressed', String(selectedRole === id));
    button.setAttribute('aria-label', `${UNITS[id].name}, $${UNITS[id].ranks[0].cost}${f.cash < UNITS[id].ranks[0].cost ? ', insufficient funds' : ''}`);
  });
  padButtons.forEach((button, index) => {
    const deployed = f.towers.find(t => t.pad === PADS[index].id);
    button.classList.toggle('occupied', !!deployed);
    button.classList.toggle('active', selectedPad === PADS[index].id);
    button.setAttribute('aria-label', deployed ? `Position ${PADS[index].id + 1}, ${UNITS[deployed.role].name}, rank ${deployed.rank + 1}. Select soldier.` : `Deploy ${selectedRole ? UNITS[selectedRole].name : 'soldier'} at position ${PADS[index].id + 1}, ${PADS[index].name}`);
  });
  get('#field-message').textContent = f.phase === 'combat' ? 'Select a deployed soldier to promote or retarget.' : 'Choose a soldier, then an empty position.';
  if ((f.phase === 'victory' || f.phase === 'defeat') && !ended) showResult(f);
}

document.querySelectorAll<HTMLButtonElement>('[data-role]').forEach(button => button.addEventListener('click', () => {
  const role = button.dataset.role as Role;
  if (session.frame().cash < UNITS[role].ranks[0].cost) {
    showUnitPreview(button);
    announce(`You need $${UNITS[role].ranks[0].cost} to deploy a ${UNITS[role].name}.`);
    return;
  }
  selectedRole = role;
  previewRole = null;
  selectedPad = null;
  announce(`${UNITS[selectedRole].name} selected. Choose an empty position.`);
  renderHud(true);
}));
function showUnitPreview(button: HTMLButtonElement) {
  previewRole = button.dataset.role as Role;
  const unit = UNITS[previewRole];
  const r = unit.ranks[0];
  const tooltip = get('#unit-tooltip');
  tooltip.innerHTML = `<strong>${unit.name}</strong><div class="tooltip-stats"><span>${r.damage} damage</span><span>${r.rate} shots/sec</span><span>${r.range}m range</span><span>$${r.cost}</span></div><p>${unit.special}</p>`;
  tooltip.hidden = false;
  button.setAttribute('aria-describedby', 'unit-tooltip');
  const rect = button.getBoundingClientRect();
  const width = tooltip.offsetWidth;
  tooltip.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - width - 12))}px`;
  tooltip.style.top = `${rect.bottom + tooltip.offsetHeight + 12 <= innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - tooltip.offsetHeight - 8)}px`;
  renderHud(true);
}
function hideUnitPreview() {
  previewRole = null;
  get('#unit-tooltip').hidden = true;
  document.querySelectorAll('[aria-describedby="unit-tooltip"]').forEach(e => e.removeAttribute('aria-describedby'));
  renderHud(true);
}
document.querySelectorAll<HTMLButtonElement>('[data-role]').forEach(button => {
  button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') showUnitPreview(button); });
  button.addEventListener('pointerleave', hideUnitPreview);
  button.addEventListener('focus', () => showUnitPreview(button));
  button.addEventListener('blur', hideUnitPreview);
  button.addEventListener('click', () => { get('#unit-tooltip').hidden = true; });
});
window.addEventListener('scroll', () => { get('#unit-tooltip').hidden = true; }, { passive: true });
get('#airstrike').addEventListener('click', () => act({ kind: 'airstrike' }));
get('#send-wave').addEventListener('click', () => act({ kind: 'start-wave' }));
get('#pause').addEventListener('click', () => act({ kind: 'pause', value: !session.frame().paused }));
get('#resume').addEventListener('click', () => act({ kind: 'pause', value: false }));
get('#speed').addEventListener('click', () => { speed = speed === 1 ? 2 : 1; get('#speed').textContent = `${speed}× speed`; get('#speed').setAttribute('aria-label', `Switch to ${speed === 1 ? 'double' : 'normal'} speed`); });
get('#sound').addEventListener('click', async () => {
  audioEnabled = !audioEnabled;
  try { await sound.setEnabled(audioEnabled); } catch { audioEnabled = false; announce('Audio is unavailable in this browser.'); }
  get('#sound').innerHTML = fa(audioEnabled ? faVolumeHigh : faVolumeXmark);
  get('#sound').setAttribute('aria-label', audioEnabled ? 'Mute sound' : 'Enable sound');
  get('#sound').setAttribute('aria-pressed', String(audioEnabled));
});
get('#motion').addEventListener('click', () => { reducedMotion = !reducedMotion; document.documentElement.classList.toggle('reduced-motion', reducedMotion); get('#motion').textContent = `Motion: ${reducedMotion ? 'reduced' : 'full'}`; get('#motion').setAttribute('aria-pressed', String(reducedMotion)); });
get('#fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await get('main').requestFullscreen(); } catch { announce('Fullscreen is unavailable. You can keep playing in this window.'); }
});

let dialogPaused = false;
function openDialog(id: string) {
  const dialog = get<HTMLDialogElement>(`#${id}`);
  if (!document.querySelector('dialog[open]')) { dialogPaused = session.frame().paused; session.command({ kind: 'pause', value: true }); }
  if (!dialog.open) dialog.showModal();
  renderHud();
}
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => dialog.addEventListener('close', () => {
  if (!document.querySelector('dialog[open]') && !dialogPaused && !document.hidden && battlefieldReady) { session.command({ kind: 'pause', value: false }); renderHud(); }
}));
document.querySelectorAll<HTMLElement>('[data-close]').forEach(button => button.addEventListener('click', () => get<HTMLDialogElement>(`#${button.dataset.close}`).close()));
get('#help-open').addEventListener('click', () => openDialog('help'));
get('#restart-open').addEventListener('click', () => openDialog('restart'));
get('#restart-confirm').addEventListener('click', restart);
get('#play-again').addEventListener('click', restart);
get('#manual-open').addEventListener('click', async () => {
  openDialog('manual');
  const host = get('#manual-content');
  if (!host.childElementCount) {
    host.textContent = 'Loading field intelligence…';
    try {
      const { mountManual } = await import('./manual');
      mountManual(host);
    } catch {
      host.textContent = 'Field intelligence could not load. Close this panel and open it again to retry.';
    }
  }
  window.dispatchEvent(new Event('resize'));
});
document.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA/.test((event.target as HTMLElement).tagName)) return;
  if (event.code === 'Space' && (event.target as HTMLElement).tagName !== 'BUTTON') { event.preventDefault(); session.frame().phase === 'build' && session.frame().wave === 0 && !session.frame().paused ? act({ kind: 'start-wave' }) : act({ kind: 'pause', value: !session.frame().paused }); }
  if (event.key.toLowerCase() === 'a') { event.preventDefault(); act({ kind: 'airstrike' }); }
  if (/^[1-6]$/.test(event.key)) document.querySelector<HTMLButtonElement>(`[data-role="${roles[Number(event.key) - 1]}"]`)?.click();
  if (event.key === 'Escape') { selectedPad = null; renderHud(true); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { session.command({ kind: 'pause', value: true }); dialogPaused = true; renderHud(); } });

function restart() {
  session.command({ kind: 'restart' });
  selectedPad = null; selectedRole = 'cadet'; previewRole = null; lastEvent = -1; ended = false; speed = 1;
  knownBossIds.clear();
  runGeneration++; runToken = null; tokenPromise = null; scoreSubmission = null;
  get('#speed').textContent = '1× speed';
  get<HTMLButtonElement>('#submit-score').disabled = false;
  get('#score-message').textContent = 'Scores are reported by your browser.';
  get<HTMLFormElement>('#score-form').reset();
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
  dialogPaused = false;
  announce('Fresh orders received. Deploy your first soldier.');
  renderHud(true);
}

function beginScoreRun() {
  if (location.hostname !== 'arcade.shoemoney.com') return;
  const generation = runGeneration;
  tokenPromise = fetch('/api/games/smtd/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    .then(async response => { if (!response.ok) throw new Error('Board unavailable'); const data = await response.json(); if (generation === runGeneration) runToken = data.runToken; })
    .catch(() => { if (generation === runGeneration) runToken = null; });
}

function showResult(frame: Frame) {
  ended = true;
  savedBest = Math.max(savedBest, frame.score);
  try { localStorage.setItem('smtd-best-v1', String(savedBest)); } catch {}
  get('#result-title').textContent = frame.phase === 'victory' ? 'THE LINE HELD.' : 'A LINE WORTH HOLDING.';
  get('#result-copy').textContent = frame.phase === 'victory' ? 'Thirty waves defeated. Guardian Outpost stands because of your squad.' : 'The outpost fell. Study the next-contact briefing, adjust your mix, and redeploy.';
  get('#result-stats').innerHTML = `<div><strong>${money(frame.score)}</strong><span>FINAL SCORE</span></div><div><strong>${frame.wave}</strong><span>WAVE REACHED</span></div><div><strong>${frame.stats.kills}</strong><span>HOSTILES STOPPED</span></div><div><strong>${frame.lives}</strong><span>BASE INTEGRITY</span></div>`;
  get('#personal-best').textContent = `Your personal best: ${money(savedBest)}`;
  get<HTMLFormElement>('#score-form').hidden = location.hostname !== 'arcade.shoemoney.com';
  openDialog('result');
}

get<HTMLFormElement>('#score-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = get<HTMLButtonElement>('#submit-score');
  button.disabled = true;
  get('#score-message').textContent = 'Sending your operation report…';
  await tokenPromise;
  if (!runToken) { get('#score-message').textContent = 'The score board was unavailable when this run started. Your personal best is saved here.'; button.disabled = false; return; }
  const f = session.frame();
  scoreSubmission ??= { runToken, name: get<HTMLInputElement>('#player-name').value.trim(), score: Math.floor(f.score), wave: f.wave, kills: f.stats.kills, headshots: f.stats.headshotKills, duration: Math.round(f.time) };
  try {
    const response = await fetch('/api/games/smtd/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scoreSubmission) });
    if (!response.ok) { if (response.status === 400) scoreSubmission = null; throw new Error('Score not accepted'); }
    const result = await response.json();
    get('#score-message').textContent = `Report accepted. You are ranked ${result.rank} on the arcade board.`;
  } catch { get('#score-message').textContent = 'The report could not be sent. Try again. Your local best is safe.'; button.disabled = false; }
});

async function initializeBattlefield() {
  battlefieldReady = false;
  try {
    battlefield?.dispose();
    battlefield = null;
    battlefield = await createBattlefield(get('#scene'), () => {
      battlefieldReady = false;
      session.command({ kind: 'pause', value: true });
      get('#loading').hidden = false;
      get('#loading').innerHTML = '<h2>Visual connection interrupted.</h2><p>Your operation is paused.</p><button id="recover" class="primary">Restore battlefield</button>';
      get('#recover').addEventListener('click', initializeBattlefield);
      renderHud();
    });
    battlefieldReady = true;
    get('#renderer-status').textContent = battlefield.backend === 'WebGPU' ? 'WEBGPU ACTIVE' : 'WEBGL2 COMPATIBILITY';
    get('#loading').hidden = true;
    document.documentElement.dataset.renderer = battlefield.backend;
    renderHud(true);
  } catch (error) {
    get('#loading').innerHTML = '<h2>Battlefield unavailable.</h2><p>This game needs WebGPU or WebGL2. Enable hardware acceleration, then reload.</p><button id="reload" class="primary">Try again</button>';
    get('#reload').addEventListener('click', () => location.reload());
    console.error('Battlefield initialization failed', error);
  }
}
renderHud(true);
await initializeBattlefield();
let previous = performance.now();
let accumulator = 0;
let lastHud = 0;
function animate(now: number) {
  const elapsed = Math.min((now - previous) / 1000, .1);
  previous = now;
  if (battlefield && battlefieldReady) {
    accumulator += elapsed * speed;
    const ticks = Math.min(12, Math.floor(accumulator * 60));
    if (ticks > 0) { session.advance(ticks); accumulator -= ticks / 60; }
    const frame = session.frame();
    battlefield.render(frame, selectedPad, selectedRole, reducedMotion);
    PADS.forEach((pad, index) => {
      const position = battlefield!.project(pad);
      padButtons[index].style.left = `${position.x}px`;
      padButtons[index].style.top = `${position.y + 22}px`;
    });
    for (const event of frame.events) if (event.id > lastEvent) { sound.play(event); lastEvent = event.id; }
    for (const enemy of frame.enemies) if (enemy.boss && !knownBossIds.has(enemy.id)) { knownBossIds.add(enemy.id); sound.bossArrival(); }
    if (now - lastHud > 150) { renderHud(); lastHud = now; }
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
document.documentElement.classList.toggle('reduced-motion', reducedMotion);

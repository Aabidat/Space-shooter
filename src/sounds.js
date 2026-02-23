/**
 * Rich procedural audio via Web Audio API.
 * Includes: reverb convolver, distortion, bass rumble, engine throb,
 * layered oscillators, noise synthesis — no external files needed.
 */

let audioCtx = null;
let masterGain = null;
let reverbNode = null;
let engineOsc = null;
let engineGain = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.75;
    masterGain.connect(audioCtx.destination);
    reverbNode = buildReverb(audioCtx, 1.8, 2.0);
    reverbNode.connect(masterGain);
  }
  return audioCtx;
}

/** Build a convolver reverb from white noise impulse */
function buildReverb(ctx, decay = 2.0, duration = 2.5) {
  const convolver = ctx.createConvolver();
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const ch = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  convolver.buffer = impulse;
  return convolver;
}

/** Create a soft distortion waveshaper */
function makeDistortion(ctx, amount = 30) {
  const ws = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
  }
  ws.curve = curve;
  ws.oversample = '4x';
  return ws;
}

/** White noise buffer source */
function noiseSource(ctx, durationSec) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * durationSec, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

// ─── Engine hum (persistent while playing) ───────────────────────────────────
export function startEngine() {
  try {
    const ctx = getCtx();
    if (engineOsc) return;
    engineOsc = ctx.createOscillator();
    engineGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 48;
    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.gain.value = 0;
    engineGain.connect(masterGain);
    engineOsc.start();
    // fade in
    engineGain.gain.setTargetAtTime(0.04, ctx.currentTime, 0.8);
    // slight throb
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 2.5;
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(engineGain.gain);
    lfo.start();
  } catch (_) {}
}

export function stopEngine() {
  try {
    if (engineGain) engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.4);
    setTimeout(() => {
      try { engineOsc && engineOsc.stop(); } catch (_) {}
      engineOsc = null; engineGain = null;
    }, 600);
  } catch (_) {}
}

// ─── Laser shoot — layered plasma zap ────────────────────────────────────────
export function playShoot() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Main laser tone — descending sweep
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    const dist = makeDistortion(ctx, 15);

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(900, now);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.09);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1400, now);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.07);

    g1.gain.setValueAtTime(0.12, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    g2.gain.setValueAtTime(0.06, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(dist); dist.connect(g1); g1.connect(masterGain);
    osc2.connect(g2); g2.connect(masterGain);

    // Noise click at start
    const click = noiseSource(ctx, 0.025);
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 3000;
    clickGain.gain.setValueAtTime(0.08, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    click.connect(clickFilter); clickFilter.connect(clickGain); clickGain.connect(masterGain);

    osc1.start(now); osc1.stop(now + 0.13);
    osc2.start(now); osc2.stop(now + 0.10);
    click.start(now); click.stop(now + 0.03);
  } catch (_) {}
}

// ─── Enemy explosion — layered boom with bass rumble + crack ─────────────────
export function playExplosion() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Low bass thump
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    sub.connect(subGain); subGain.connect(masterGain);
    sub.start(now); sub.stop(now + 0.3);

    // Mid crunch noise
    const noise = noiseSource(ctx, 0.35);
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = 600;
    nFilter.Q.value = 0.8;
    const nDist = makeDistortion(ctx, 40);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.35, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(nFilter); nFilter.connect(nDist); nDist.connect(nGain);
    nGain.connect(masterGain);
    // also send to reverb for space
    nGain.connect(reverbNode);
    noise.start(now); noise.stop(now + 0.4);

    // High crack
    const crack = noiseSource(ctx, 0.05);
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.value = 4000;
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.25, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    crack.connect(crackFilter); crackFilter.connect(crackGain); crackGain.connect(masterGain);
    crack.start(now); crack.stop(now + 0.06);

  } catch (_) {}
}

// ─── Boss explosion — massive layered boom ────────────────────────────────────
export function playBossExplosion() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Three staggered explosions with deeper rumble
    [0, 0.07, 0.16].forEach((offset, i) => {
      const sub = ctx.createOscillator();
      const subG = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(70 - i * 15, now + offset);
      sub.frequency.exponentialRampToValueAtTime(18, now + offset + 0.5);
      subG.gain.setValueAtTime(0.6 - i * 0.1, now + offset);
      subG.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.55);
      sub.connect(subG); subG.connect(masterGain);
      sub.start(now + offset); sub.stop(now + offset + 0.6);

      const noise = noiseSource(ctx, 0.6);
      const nf = ctx.createBiquadFilter();
      nf.type = 'lowpass'; nf.frequency.value = 800 - i * 150;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.4 - i * 0.08, now + offset);
      ng.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.55);
      noise.connect(nf); nf.connect(ng);
      ng.connect(masterGain); ng.connect(reverbNode);
      noise.start(now + offset); noise.stop(now + offset + 0.65);
    });

  } catch (_) {}
}

// ─── Collect pickup — bright ascending chime ─────────────────────────────────
export function playCollect() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const freqs = [523, 659, 784, 1047]; // C5 E5 G5 C6
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * 0.07);
      g.gain.linearRampToValueAtTime(0.14, now + i * 0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);
      osc.connect(g); g.connect(masterGain); g.connect(reverbNode);
      osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.25);
    });
  } catch (_) {}
}

// ─── Game over — dramatic descending doom ─────────────────────────────────────
export function playGameOver() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Descending bass melody
    const notes = [220, 185, 155, 110];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      const dist = makeDistortion(ctx, 20);
      g.gain.setValueAtTime(0.12, now + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.35);
      osc.connect(dist); dist.connect(g);
      g.connect(masterGain); g.connect(reverbNode);
      osc.start(now + i * 0.18); osc.stop(now + i * 0.18 + 0.4);
    });

    // Low rumble underneath
    const rumble = noiseSource(ctx, 1.2);
    const rf = ctx.createBiquadFilter();
    rf.type = 'lowpass'; rf.frequency.value = 120;
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0.2, now);
    rg.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    rumble.connect(rf); rf.connect(rg); rg.connect(masterGain);
    rumble.start(now); rumble.stop(now + 1.3);

  } catch (_) {}
}

// ─── Level up — triumphant fanfare ───────────────────────────────────────────
export function playLevelUp() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const melody = [
      { f: 523, t: 0 },    // C5
      { f: 659, t: 0.1 },  // E5
      { f: 784, t: 0.2 },  // G5
      { f: 1047, t: 0.32 },// C6
    ];
    melody.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.15, now + t);
      g.gain.linearRampToValueAtTime(0.12, now + t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.28);
      osc.connect(g); g.connect(masterGain); g.connect(reverbNode);
      osc.start(now + t); osc.stop(now + t + 0.32);
    });

    // Sweep whoosh
    const sweep = ctx.createOscillator();
    const sg = ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(200, now);
    sweep.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
    sg.gain.setValueAtTime(0.06, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sweep.connect(sg); sg.connect(masterGain);
    sweep.start(now); sweep.stop(now + 0.55);

  } catch (_) {}
}

// ─── Victory — full chord + sparkles + fanfare ────────────────────────────────
export function playVictory() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Triumphant chord
    [330, 415, 523, 660, 830].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * 0.04);
      g.gain.linearRampToValueAtTime(0.12, now + i * 0.04 + 0.08);
      g.gain.linearRampToValueAtTime(0.06, now + 1.2);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.connect(g); g.connect(masterGain); g.connect(reverbNode);
      osc.start(now + i * 0.04); osc.stop(now + 2.8);
    });

    // Sparkle arpeggio
    setTimeout(() => {
      const sparkFreqs = [880, 1047, 1319, 1568, 1760];
      sparkFreqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        const t = audioCtx.currentTime + i * 0.06;
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(g); g.connect(masterGain); g.connect(reverbNode);
        osc.start(t); osc.stop(t + 0.3);
      });
    }, 400);

  } catch (_) {}
}
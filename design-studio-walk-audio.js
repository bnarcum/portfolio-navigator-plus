/**
 * Design Studio walk — procedural cinematic ambient + game SFX (no external assets)
 */
(function () {
  "use strict";

  let ctx = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let musicNodes = [];
  let running = false;
  let muted = false;
  let volume = 0.42;

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.85;
    sfxBus.connect(master);
    return ctx;
  }

  function ramp(param, to, sec) {
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(to, t + sec);
  }

  function makePad(freq, detune, type, gain, filterFreq) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = gain;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.04 + Math.random() * 0.03;
    const lfoG = ctx.createGain();
    lfoG.gain.value = gain * 0.35;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    osc.connect(filter);
    filter.connect(g);
    g.connect(musicBus);
    osc.start();
    lfo.start();
    return { osc, lfo, filter, g };
  }

  function makePulse() {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 55;
    const g = ctx.createGain();
    g.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 0.5;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.08;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    osc.connect(g);
    g.connect(musicBus);
    osc.start();
    lfo.start();
    return { osc, lfo, g };
  }

  function makeArp() {
    const notes = [110, 130.81, 164.81, 196, 220, 261.63];
    let idx = 0;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    const g = ctx.createGain();
    g.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    osc.connect(filter);
    filter.connect(g);
    g.connect(musicBus);
    osc.start();
    const tick = () => {
      if (!running) return;
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(notes[idx % notes.length], t);
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.045, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      idx++;
      setTimeout(tick, 1400);
    };
    tick();
    return { osc, g, filter };
  }

  function startMusic() {
    if (!ensureCtx()) return;
    if (ctx.state === "suspended") ctx.resume();
    if (running) {
      if (!muted) ramp(musicBus.gain, 0.55, 1.2);
      return;
    }
    running = true;
    musicNodes = [
      makePad(55, -8, "sawtooth", 0.07, 280),
      makePad(55, 6, "sawtooth", 0.06, 300),
      makePad(82.41, 0, "sine", 0.09, 420),
      makePad(110, -4, "triangle", 0.05, 520),
      makePad(164.81, 3, "sine", 0.04, 680),
      makePulse(),
      makeArp()
    ];
    ramp(musicBus.gain, muted ? 0 : 0.55, 2.5);
  }

  function stopMusic() {
    if (!ctx || !running) return;
    ramp(musicBus.gain, 0, 1.5);
    setTimeout(() => {
      musicNodes.forEach(n => {
        try { n.osc?.stop?.(); n.lfo?.stop?.(); } catch (_) { /* noop */ }
      });
      musicNodes = [];
      running = false;
    }, 1600);
  }

  function playTone(freq, dur, type, vol, slideTo) {
    if (!ensureCtx() || muted) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function sfxInspect() {
    playTone(440, 0.12, "sine", 0.12, 880);
    setTimeout(() => playTone(660, 0.18, "triangle", 0.08), 60);
  }

  function sfxWaypoint() {
    playTone(220, 0.25, "sine", 0.1, 330);
  }

  function sfxMissionStart() {
    playTone(110, 0.4, "sawtooth", 0.08, 220);
    setTimeout(() => playTone(164.81, 0.5, "sine", 0.12, 329.63), 120);
    setTimeout(() => playTone(220, 0.7, "triangle", 0.1), 280);
  }

  function sfxFootstep() {
    playTone(80 + Math.random() * 20, 0.06, "sine", 0.025);
  }

  function toggleMute() {
    muted = !muted;
    if (musicBus) ramp(musicBus.gain, muted ? 0 : 0.55, 0.35);
    return muted;
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (master) master.gain.value = volume;
  }

  function isMuted() { return muted; }
  function isRunning() { return running; }

  window.__DS_WALK_AUDIO = {
    start: startMusic,
    stop: stopMusic,
    toggleMute,
    setVolume,
    isMuted,
    isRunning,
    sfx: { inspect: sfxInspect, waypoint: sfxWaypoint, missionStart: sfxMissionStart, footstep: sfxFootstep }
  };
})();

// Sizzle & Serve — tiny synthesised sound: effects and a music loop.
// One job: every beep, chop, sizzle and jingle, made with WebAudio, no files.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A lazy AudioContext: browsers only allow sound after a user gesture.
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', gain = 0.12, when = 0, slideTo = null) {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, gain = 0.08, when = 0, filterFreq = 4000) {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime + when;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t);
  }

  // A cheerful 8-step loop in C major pentatonic, bass underneath.
  const MELODY = [523, 659, 784, 659, 880, 784, 659, 587];
  const BASS = [131, 131, 175, 196, 131, 175, 196, 196];

  function musicTick() {
    if (muted) return;
    const i = musicStep % 8;
    tone(MELODY[i], 0.22, 'triangle', 0.05);
    if (i % 2 === 0) tone(BASS[i], 0.4, 'sine', 0.07);
    musicStep++;
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      if (muted && musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      else if (!muted && !musicTimer) musicTimer = setInterval(musicTick, 240);
      return muted;
    },
    get muted() { return muted; },
    startMusic() {
      ensure();
      if (!musicTimer && !muted) musicTimer = setInterval(musicTick, 240);
    },
    stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } },
    pickup() { tone(420, 0.08, 'sine', 0.1, 0, 620); },
    chop() { noise(0.07, 0.16, 0, 1800); tone(180, 0.06, 'square', 0.05); },
    chopDone() { tone(660, 0.1, 'sine', 0.1); tone(880, 0.14, 'sine', 0.1, 0.09); },
    sizzle() { noise(0.5, 0.05, 0, 5200); },
    grillDone() { tone(740, 0.12, 'triangle', 0.12); tone(988, 0.18, 'triangle', 0.12, 0.1); },
    burn() { tone(220, 0.3, 'sawtooth', 0.08, 0, 110); },
    plate() { tone(520, 0.08, 'sine', 0.1); tone(780, 0.1, 'sine', 0.08, 0.06); },
    serve() { tone(784, 0.12, 'triangle', 0.12); tone(1047, 0.16, 'triangle', 0.12, 0.1); tone(1319, 0.22, 'triangle', 0.1, 0.2); },
    error() { tone(160, 0.18, 'square', 0.07, 0, 120); },
    orderIn() { tone(880, 0.1, 'sine', 0.09); tone(1175, 0.14, 'sine', 0.09, 0.09); },
    tick() { tone(980, 0.05, 'square', 0.04); },
    rush() { tone(523, 0.12, 'square', 0.09); tone(659, 0.12, 'square', 0.09, 0.12); tone(784, 0.2, 'square', 0.09, 0.24); },
  };
}

// Sonido ambiental para cinemáticas: viento, moscas, perros, agua, risa con
// eco y "música" (acordes sostenidos). Todo sintetizado con Web Audio API,
// reutilizando getAudioContext()/playTone() de sound.js. Sin archivos de
// audio externos.

// Ruido blanco (para el viento) generado por código, sin descargar nada.
function createNoiseBuffer(ctx, durationSec) {
  const bufferSize = Math.floor(ctx.sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Bucle de viento: ruido filtrado en graves, con un leve vaivén de volumen.
function startWindLoop(volume = 0.05) {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, 2);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return {
    stop(fadeSec = 0.6) {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + fadeSec);
      source.stop(t + fadeSec + 0.05);
    },
  };
}

// Zumbido de moscas: tono agudo con trémolo rápido (LFO en la ganancia).
function startFlyBuzzLoop(volume = 0.03) {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 220;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 28; // aleteo rápido
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = volume * 0.8;

  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, ctx.currentTime);
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1);

  lfo.connect(lfoGain);
  lfoGain.connect(mainGain.gain);
  osc.connect(mainGain);
  mainGain.connect(ctx.destination);

  osc.start();
  lfo.start();

  return {
    stop(fadeSec = 0.4) {
      const t = ctx.currentTime;
      mainGain.gain.cancelScheduledValues(t);
      mainGain.gain.setValueAtTime(mainGain.gain.value, t);
      mainGain.gain.linearRampToValueAtTime(0, t + fadeSec);
      osc.stop(t + fadeSec + 0.05);
      lfo.stop(t + fadeSec + 0.05);
    },
  };
}

function playDogBark() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 180, slideTo: 90, duration: 0.12, type: "square", volume: 0.07 });
  playTone(ctx, { freq: 160, slideTo: 80, duration: 0.1, type: "square", volume: 0.06, delay: 0.16 });
}

function playSewerGurgle() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 140, slideTo: 90, duration: 0.4, type: "sine", volume: 0.08 });
  playTone(ctx, { freq: 200, slideTo: 120, duration: 0.3, type: "sine", volume: 0.05, delay: 0.15 });
}

function playLoudSewerNoise() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 90, slideTo: 40, duration: 0.5, type: "sawtooth", volume: 0.18 });
  playTone(ctx, { freq: 260, duration: 0.15, type: "square", volume: 0.1, delay: 0.05 });
}

// Risa grave con eco real (DelayNode con realimentación).
function playDeepLaughWithEcho() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const delay = ctx.createDelay();
  delay.delayTime.value = 0.22;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.45;
  const echoVolume = ctx.createGain();
  echoVolume.gain.value = 0.5;

  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(echoVolume);
  echoVolume.connect(ctx.destination);

  const notes = [110, 98, 87, 73];
  notes.forEach((freq, i) => {
    const t0 = ctx.currentTime + i * 0.22;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.connect(delay);
    osc.start(t0);
    osc.stop(t0 + 0.4);
  });
}

// Acorde sostenido (para música ambiental / de nivel). Devuelve un handle
// con stop() para poder detenerlo o cambiarlo por otro (crossfade manual).
function startChordPad(freqs, volume = 0.05) {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
  master.connect(ctx.destination);

  const oscs = freqs.map((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.value = freq;
    osc.connect(master);
    osc.start();
    return osc;
  });

  return {
    setVolume(v, rampSec = 0.6) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(v, t + rampSec);
    },
    stop(fadeSec = 1) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + fadeSec);
      oscs.forEach((osc) => osc.stop(t + fadeSec + 0.05));
    },
  };
}

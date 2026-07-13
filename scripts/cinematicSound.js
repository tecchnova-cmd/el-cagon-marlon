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

// Gota de agua: "plink" agudo y corto (goteras de la alcantarilla).
function playWaterDrop() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 1100, slideTo: 700, duration: 0.12, type: "sine", volume: 0.06 });
}

// Golpe metálico corto (tuberías vibrando / chocando).
function playPipeClank() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 620, duration: 0.08, type: "square", volume: 0.08 });
  playTone(ctx, { freq: 580, duration: 0.1, type: "square", volume: 0.06, delay: 0.05 });
}

// Golpe profundo ("BOOOOM" desde las alcantarillas).
function playDeepBoom() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 70, slideTo: 30, duration: 0.5, type: "sine", volume: 0.22 });
  playTone(ctx, { freq: 45, slideTo: 20, duration: 0.6, type: "sawtooth", volume: 0.14, delay: 0.03 });
}

// Respiración profunda con eco (ruido filtrado, no un tono): algo respira
// cerca de la tubería grande, justo antes de que hable la voz misteriosa.
function playDeepBreathWithEcho() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const delay = ctx.createDelay();
  delay.delayTime.value = 0.25;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.35;
  const echoVolume = ctx.createGain();
  echoVolume.gain.value = 0.4;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(echoVolume);
  echoVolume.connect(ctx.destination);

  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, 0.7);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 260;
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  const t0 = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.connect(delay);
  source.start(t0);
  source.stop(t0 + 0.75);
}

// Tono grave con eco, para acompañar cada línea de la voz misteriosa del
// Rey Maloliente (no hay síntesis de voz real: mismo criterio que la risa
// de la cinemática del Nivel 1).
function playDeepVoiceWithEcho() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const delay = ctx.createDelay();
  delay.delayTime.value = 0.24;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.4;
  const echoVolume = ctx.createGain();
  echoVolume.gain.value = 0.45;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(echoVolume);
  echoVolume.connect(ctx.destination);

  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(85, t0);
  osc.frequency.exponentialRampToValueAtTime(58, t0 + 0.6);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.connect(delay);
  osc.start(t0);
  osc.stop(t0 + 0.65);
}

// Canto de pájaro: dos notas cortas y agudas.
function playBirdChirp() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 2200, slideTo: 2800, duration: 0.06, type: "sine", volume: 0.05 });
  playTone(ctx, { freq: 2000, slideTo: 2500, duration: 0.07, type: "sine", volume: 0.04, delay: 0.09 });
}

// Graznido de cuervo: tono grave y áspero, corto.
function playCrowCaw() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 340, slideTo: 200, duration: 0.16, type: "sawtooth", volume: 0.1 });
}

// Golpe suave (Marlon aterriza al caer de la tubería): más ligero que playDeepBoom.
function playSoftThud() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 130, slideTo: 60, duration: 0.18, type: "sine", volume: 0.13 });
}

// Chispazo eléctrico corto (electricidad, pantallas, tubería).
function playElectricZap() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 1800, slideTo: 2600, duration: 0.05, type: "square", volume: 0.06 });
  playTone(ctx, { freq: 900, slideTo: 1400, duration: 0.06, type: "square", volume: 0.05, delay: 0.04 });
}

// Pitido de alarma (dos tonos alternos, tipo sirena de laboratorio).
function playAlarmBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { freq: 700, duration: 0.14, type: "square", volume: 0.07 });
  playTone(ctx, { freq: 500, duration: 0.14, type: "square", volume: 0.07, delay: 0.16 });
}

// Blips robóticos entrecortados (voz robótica deformada del intro).
function playRoboticBlip() {
  const ctx = getAudioContext();
  if (!ctx) return;
  for (let i = 0; i < 4; i++) {
    playTone(ctx, { freq: 260 + i * 40, duration: 0.05, type: "square", volume: 0.05, delay: i * 0.07 });
  }
}

// Interferencia / estática corta (grabación que se corta).
function playStaticCrackle() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const source = ctx.createBufferSource();
  source.buffer = createNoiseBuffer(ctx, 0.3);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1200;
  const gain = ctx.createGain();
  const t0 = ctx.currentTime;
  gain.gain.setValueAtTime(0.09, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(t0);
  source.stop(t0 + 0.32);
}

// Descarga de inodoro distante (silbido grave descendente con un poco de eco).
function playDistantFlush() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const delay = ctx.createDelay();
  delay.delayTime.value = 0.2;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.3;
  const echoVolume = ctx.createGain();
  echoVolume.gain.value = 0.3;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(echoVolume);
  echoVolume.connect(ctx.destination);

  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(500, t0);
  osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.8);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.1, t0 + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.8);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.connect(delay);
  osc.start(t0);
  osc.stop(t0 + 0.85);
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

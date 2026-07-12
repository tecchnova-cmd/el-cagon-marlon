// Efectos de sonido simples generados con Web Audio API (sin archivos de
// audio externos). Si en el futuro quieres reemplazarlos por grabaciones
// reales, basta con cargarlas en preload y usar scene.sound.play() en su
// lugar dentro de playGameSound().

const SOUND_KEYS = {
  jump: "jump",
  coin: "coin",
  poop: "poop",
  bottle: "bottle",
  glassBreak: "glassBreak",
  enemyDown: "enemyDown",
  gameOver: "gameOver",
  checkpoint: "checkpoint",
  victory: "victory",
};

function preloadGameSounds(scene) {
  // No hace falta cargar nada: los efectos se sintetizan en playGameSound().
}

// Activar/desactivar sonido (independiente de la música, que no existe: solo
// hay efectos). El menú de pausa lo controla y se recuerda entre partidas.
let soundEnabled = true;

function setSoundEnabled(enabled) {
  soundEnabled = enabled;
}

function isSoundEnabled() {
  return soundEnabled;
}

let sharedAudioCtx = null;

function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
  if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume();
  return sharedAudioCtx;
}

function playTone(ctx, { freq, duration, type = "sine", volume = 0.15, slideTo, delay = 0 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;

  const t0 = ctx.currentTime + delay;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);

  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playGameSound(scene, key) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (key) {
    case SOUND_KEYS.jump:
      playTone(ctx, { freq: 320, slideTo: 560, duration: 0.12, type: "square", volume: 0.1 });
      break;
    case SOUND_KEYS.coin:
      playTone(ctx, { freq: 880, duration: 0.08, type: "square", volume: 0.13 });
      playTone(ctx, { freq: 1320, duration: 0.12, type: "square", volume: 0.13, delay: 0.06 });
      break;
    case SOUND_KEYS.poop:
      playTone(ctx, { freq: 240, slideTo: 70, duration: 0.18, type: "sawtooth", volume: 0.13 });
      break;
    case SOUND_KEYS.bottle:
      playTone(ctx, { freq: 500, slideTo: 300, duration: 0.15, type: "triangle", volume: 0.12 });
      break;
    case SOUND_KEYS.glassBreak:
      playTone(ctx, { freq: 1400, duration: 0.05, type: "square", volume: 0.1 });
      playTone(ctx, { freq: 900, duration: 0.08, type: "square", volume: 0.09, delay: 0.04 });
      playTone(ctx, { freq: 600, duration: 0.1, type: "square", volume: 0.08, delay: 0.08 });
      break;
    case SOUND_KEYS.enemyDown:
      playTone(ctx, { freq: 520, slideTo: 140, duration: 0.2, type: "triangle", volume: 0.16 });
      break;
    case SOUND_KEYS.gameOver:
      playTone(ctx, { freq: 400, duration: 0.2, type: "sawtooth", volume: 0.13 });
      playTone(ctx, { freq: 300, duration: 0.2, type: "sawtooth", volume: 0.13, delay: 0.2 });
      playTone(ctx, { freq: 190, duration: 0.35, type: "sawtooth", volume: 0.13, delay: 0.4 });
      break;
    case SOUND_KEYS.checkpoint:
      playTone(ctx, { freq: 660, duration: 0.1, type: "sine", volume: 0.12 });
      playTone(ctx, { freq: 990, duration: 0.14, type: "sine", volume: 0.12, delay: 0.08 });
      break;
    case SOUND_KEYS.victory:
      playTone(ctx, { freq: 523, duration: 0.15, type: "square", volume: 0.13 });
      playTone(ctx, { freq: 659, duration: 0.15, type: "square", volume: 0.13, delay: 0.15 });
      playTone(ctx, { freq: 784, duration: 0.15, type: "square", volume: 0.13, delay: 0.3 });
      playTone(ctx, { freq: 1047, duration: 0.3, type: "square", volume: 0.13, delay: 0.45 });
      break;
  }
}

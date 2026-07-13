// Guardado persistente (localStorage): mejor puntuación, monedas, mejoras y
// progreso de nivel. Si localStorage no está disponible, el juego sigue
// funcionando (simplemente no persiste entre sesiones).

const SAVE_KEY = "elCagonMarlonSave";

function getDefaultSave() {
  return {
    bestScore: 0,
    coins: 0,
    upgrades: { throwSpeed: 0, poopRange: 0, extraBottle: 0, jumpHeight: 0, coinMagnet: 0 },
    bottleStock: 0, // botellas extra compradas en la tienda, se añaden al empezar el siguiente nivel
    currentScene: "CityScene",
    hasProgress: false,
    soundEnabled: true,
  };
}

function loadSaveData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return getDefaultSave();
    const parsed = JSON.parse(raw);
    return Object.assign(getDefaultSave(), parsed, {
      upgrades: Object.assign(getDefaultSave().upgrades, parsed.upgrades || {}),
    });
  } catch (e) {
    return getDefaultSave();
  }
}

function writeSaveData(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage no disponible: el juego sigue funcionando sin guardado.
  }
}

function clearSaveData() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    // nada que limpiar
  }
}

function updateBestScore(score) {
  const data = loadSaveData();
  if (score > data.bestScore) {
    data.bestScore = score;
    writeSaveData(data);
  }
  return data.bestScore;
}

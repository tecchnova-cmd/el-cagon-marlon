// Configuración principal del juego "Super Marlon Cagón"

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: "game-container",
  pixelArt: true,
  backgroundColor: "#7ec0ee",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3, // permite varios dedos a la vez (mover + saltar + atacar)
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 900 },
      debug: false,
    },
  },
  scene: [
    IntroScene,
    MenuScene,
    CityIntroCinematic,
    CityScene,
    SewerIntroCinematic,
    SewerScene,
    ToxicForestIntroCinematic,
    ToxicForestScene,
    LaboratoryIntroCinematic,
    LaboratoryScene,
    CastleIntroCinematic,
    CastleScene,
    FinalBossScene,
    UpgradeScene,
    PauseMenuScene,
    GameOverScene,
    LevelCompleteScene,
    VictoryScene,
  ],
};

window.game = new Phaser.Game(config);

// Red de seguridad para móviles (sobre todo Android): al girar el teléfono
// o cambiar de tamaño de ventana, se fuerza a Phaser a recalcular el tamaño
// del canvas, por si el navegador no dispara el resize interno a tiempo.
window.addEventListener("resize", () => window.game.scale.refresh());
window.addEventListener("orientationchange", () => {
  setTimeout(() => window.game.scale.refresh(), 100);
});

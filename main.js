// Configuración principal del juego "El Cagón Marlon"

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
    CityScene,
    SewerScene,
    ToxicForestScene,
    LaboratoryScene,
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

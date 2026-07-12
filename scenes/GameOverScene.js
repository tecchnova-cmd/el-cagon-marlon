// Pantalla de GAME OVER con botón para reiniciar.

class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.finalScore = data && data.score ? data.score : 0;
    this.currentScene = (data && data.currentScene) || "CityScene";
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#2b2b52");

    this.add
      .text(width / 2, height / 2 - 100, "GAME OVER", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "56px",
        color: "#e63946",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 30, "Puntos: " + this.finalScore, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const retryButton = this.add
      .text(width / 2, height / 2 + 50, "JUGAR DE NUEVO", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "30px",
        color: "#ffffff",
        backgroundColor: "#e63946",
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retryButton.on("pointerover", () => retryButton.setScale(1.08));
    retryButton.on("pointerout", () => retryButton.setScale(1));
    retryButton.on("pointerdown", () => this.retryLevel());

    this.input.keyboard.once("keydown-SPACE", () => this.retryLevel());
    this.input.keyboard.once("keydown-ENTER", () => this.retryLevel());
  }

  retryLevel() {
    // El intento se reinicia desde el último nivel completado y guardado,
    // no desde cero: solo se pierde el progreso de la partida actual.
    const save = loadSaveData();
    this.registry.set("score", save.currentScore || 0);
    this.registry.set("lives", 3);
    this.scene.start(this.currentScene);
  }
}

// Pantalla de "NIVEL COMPLETADO". Si hay un siguiente nivel, avanza a él;
// si no (todavía no está construido), reinicia el nivel actual.

class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelCompleteScene");
  }

  init(data) {
    this.finalScore = data && data.score ? data.score : 0;
    this.currentScene = (data && data.currentScene) || "CityScene";
    this.nextScene = (data && data.nextScene) || null;
    this.title = (data && data.title) || "¡NIVEL COMPLETADO!";
  }

  create() {
    const { width, height } = this.scale;

    // Guardado automático al completar el nivel (puntuación, monedas, progreso).
    const targetSceneForSave = this.nextScene || this.currentScene;
    const save = loadSaveData();
    save.currentScore = this.finalScore;
    save.currentScene = targetSceneForSave;
    save.coins = this.registry.get("coinsWallet") || save.coins;
    save.hasProgress = true;
    writeSaveData(save);
    updateBestScore(this.finalScore);

    this.cameras.main.setBackgroundColor("#3d8b40");

    this.add
      .text(width / 2, height / 2 - 100, this.title, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: this.title.length > 20 ? "26px" : "44px",
        color: "#ffffff",
        stroke: "#2b2b52",
        strokeThickness: 6,
        align: "center",
        wordWrap: { width: width - 60 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 30, "Puntos: " + this.finalScore, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const buttonLabel = this.nextScene ? "SIGUIENTE NIVEL" : "REINICIAR";

    const goNext = () => {
      if (this.nextScene) {
        // Antes del siguiente nivel, pasa por la tienda de mejoras.
        this.scene.start("UpgradeScene", { nextScene: this.nextScene });
      } else {
        this.scene.start(this.currentScene);
      }
    };

    const continueButton = this.add
      .text(width / 2, height / 2 + 50, buttonLabel, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "30px",
        color: "#ffffff",
        backgroundColor: "#2b2b52",
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    continueButton.on("pointerover", () => continueButton.setScale(1.08));
    continueButton.on("pointerout", () => continueButton.setScale(1));
    continueButton.on("pointerdown", goNext);

    this.input.keyboard.once("keydown-SPACE", goNext);
    this.input.keyboard.once("keydown-ENTER", goNext);
  }
}

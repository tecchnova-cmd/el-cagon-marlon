// Pantalla final: Marlon celebrando, confeti, estadísticas de la partida,
// mejor puntuación guardada y frase cómica final.

const COMIC_END_PHRASE = "Marlon salvó la ciudad… pero nadie quiere acercarse a felicitarlo.";

class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  init(data) {
    this.finalScore = (data && data.score) || 0;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#3d8b40");

    const coinsCollected = this.registry.get("coinsCollected") || 0;
    const enemiesDefeated = this.registry.get("enemiesDefeated") || 0;
    const runStartTime = this.registry.get("runStartTime") || Date.now();
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - runStartTime) / 1000));
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeText = minutes + ":" + String(seconds).padStart(2, "0");

    const bestScore = updateBestScore(this.finalScore);

    // Guardado final: la partida se completó, se limpia el progreso "en curso".
    const save = loadSaveData();
    save.currentScore = 0;
    save.currentScene = "CityScene";
    save.coins = this.registry.get("coinsWallet") || save.coins;
    save.hasProgress = false;
    writeSaveData(save);

    this.startConfettiLoop();
    playGameSound(this, SOUND_KEYS.victory);

    const cx = width / 2;

    this.add
      .text(cx, 8, "¡EL REY MALOLIENTE HA SIDO DERROTADO!", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "19px",
        color: "#ffd93d",
        stroke: "#2b2b52",
        strokeThickness: 5,
        align: "center",
        wordWrap: { width: width - 40 },
      })
      .setOrigin(0.5, 0);

    // Marlon celebrando
    const marlonY = 105;
    const body = this.add.image(cx, marlonY, "playerBody").setScale(1.6);
    const face = this.add.image(cx, marlonY + PLAYER_HEAD_OFFSET_Y * 1.6, getPlayerFaceKey(this));
    face.setDisplaySize(PLAYER_HEAD_DIAMETER * 1.6, PLAYER_HEAD_DIAMETER * 1.6);
    this.tweens.add({
      targets: [body, face],
      y: "-=10",
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const statsLines = [
      "Puntuación total: " + this.finalScore,
      "Monedas recogidas: " + coinsCollected,
      "Enemigos derrotados: " + enemiesDefeated,
      "Tiempo total: " + timeText,
      "Mejor puntuación: " + bestScore,
    ];
    this.add
      .text(cx, 185, statsLines.join("\n"), {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "15px",
        color: "#ffffff",
        align: "center",
        lineSpacing: 5,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(cx, 330, COMIC_END_PHRASE, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "12px",
        color: "#dfffe0",
        fontStyle: "italic",
        align: "center",
        wordWrap: { width: width - 60 },
      })
      .setOrigin(0.5, 0);

    const playAgainButton = this.add
      .text(cx - 110, 400, "JUGAR DE NUEVO", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#e63946",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    playAgainButton.on("pointerover", () => playAgainButton.setScale(1.06));
    playAgainButton.on("pointerout", () => playAgainButton.setScale(1));
    playAgainButton.on("pointerdown", () => this.startNewRun());

    const menuButton = this.add
      .text(cx + 110, 400, "MENÚ PRINCIPAL", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#2b2b52",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    menuButton.on("pointerover", () => menuButton.setScale(1.06));
    menuButton.on("pointerout", () => menuButton.setScale(1));
    menuButton.on("pointerdown", () => this.scene.start("MenuScene"));
  }

  startConfettiLoop() {
    const { width } = this.scale;
    const colors = [0xe63946, 0xffd93d, 0x4ad9d9, 0x5aff5a, 0xffffff];
    this.confettiEvent = this.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        const piece = this.add
          .image(Phaser.Math.Between(0, width), -10, "confettiPiece")
          .setTint(Phaser.Utils.Array.GetRandom(colors))
          .setScale(Phaser.Math.FloatBetween(0.8, 1.6));
        this.tweens.add({
          targets: piece,
          y: this.scale.height + 20,
          x: piece.x + Phaser.Math.Between(-60, 60),
          angle: Phaser.Math.Between(180, 720),
          duration: Phaser.Math.Between(1800, 3200),
          onComplete: () => piece.destroy(),
        });
      },
    });
  }

  startNewRun() {
    this.registry.set("score", 0);
    this.registry.set("lives", 3);
    this.registry.set("coinsCollected", 0);
    this.registry.set("enemiesDefeated", 0);
    this.registry.set("runStartTime", Date.now());
    const save = loadSaveData();
    this.registry.set("coinsWallet", save.coins);
    this.scene.start("CityScene");
  }
}

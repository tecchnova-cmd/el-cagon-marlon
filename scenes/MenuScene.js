// Menú principal: título del juego, JUGAR/CONTINUAR y NUEVA PARTIDA.

class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    // La foto de Marlon y las texturas ya se cargaron en IntroScene.
    const save = loadSaveData();
    setSoundEnabled(save.soundEnabled !== false);

    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#7ec0ee");

    // nubes decorativas
    this.add.image(120, 80, "bgCloud").setScale(1.2).setAlpha(0.9);
    this.add.image(700, 130, "bgCloud").setScale(1.6).setAlpha(0.9);
    this.add.image(430, 60, "bgCloud").setScale(1).setAlpha(0.9);

    // franja de suelo decorativa
    for (let x = 0; x < width + 64; x += 64) {
      this.add.image(x, height - 32, "ground").setOrigin(0, 0.5);
    }

    // Marlon decorativo (a un lado, para no tapar el texto de controles)
    const marlonX = width - 140;
    const marlonY = height - 90;
    this.add.image(marlonX, marlonY, "playerBody").setScale(2.2);
    this.add
      .image(marlonX, marlonY + PLAYER_HEAD_OFFSET_Y * 2.2, getPlayerFaceKey(this))
      .setDisplaySize(PLAYER_HEAD_DIAMETER * 2.2, PLAYER_HEAD_DIAMETER * 2.2);

    this.add
      .text(width / 2, height / 2 - 150, "SUPER MARLON CAGÓN", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "48px",
        color: "#ffffff",
        stroke: "#2b2b52",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    const hasProgress = save.hasProgress && save.currentScene && save.currentScene !== "CityScene";

    if (hasProgress) {
      this.makeButton(width / 2, height / 2 - 60, "CONTINUAR", "#e63946", () => this.continueGame(save));
      this.makeButton(width / 2, height / 2 + 4, "NUEVA PARTIDA", "#2b2b52", () => this.confirmNewGame());
    } else {
      this.makeButton(width / 2, height / 2 - 30, "JUGAR", "#e63946", () => this.startNewGame());
    }

    this.add
      .text(
        width / 2,
        height / 2 + 100,
        "← → mover   ·   ↑ / W / ESPACIO saltar\nZ lanzar caca   ·   X lanzar botella   ·   F flatulencia   ·   ESC pausa",
        {
          fontFamily: "Comic Sans MS, sans-serif",
          fontSize: "15px",
          color: "#2b2b52",
          align: "center",
        }
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 16, "Mejor puntuación: " + save.bestScore, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "14px",
        color: "#2b2b52",
      })
      .setOrigin(0.5, 1);
  }

  makeButton(x, y, label, bg, onClick) {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: bg,
        padding: { x: 26, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerover", () => btn.setScale(1.06));
    btn.on("pointerout", () => btn.setScale(1));
    btn.on("pointerdown", () => {
      requestFullscreenIfMobile(this);
      onClick();
    });
    return btn;
  }

  confirmNewGame() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65).setDepth(5);
    const box = [overlay];

    box.push(
      this.add
        .text(width / 2, height / 2 - 40, "¿Empezar una nueva partida?\nSe borrará tu progreso guardado.", {
          fontFamily: "Comic Sans MS, sans-serif",
          fontSize: "18px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(6)
    );

    const closeAll = () => box.forEach((el) => el.destroy());

    const yesBtn = this.add
      .text(width / 2 - 80, height / 2 + 30, "SÍ, BORRAR", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#e63946",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });
    yesBtn.on("pointerdown", () => {
      closeAll();
      clearSaveData();
      this.startNewGame();
    });
    box.push(yesBtn);

    const noBtn = this.add
      .text(width / 2 + 80, height / 2 + 30, "CANCELAR", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#2b2b52",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });
    noBtn.on("pointerdown", closeAll);
    box.push(noBtn);
  }

  resetRunStats(coinsWallet) {
    this.registry.set("score", 0);
    this.registry.set("lives", 3);
    this.registry.set("coinsCollected", 0);
    this.registry.set("enemiesDefeated", 0);
    this.registry.set("runStartTime", Date.now());
    this.registry.set("coinsWallet", coinsWallet);
  }

  startNewGame() {
    this.resetRunStats(loadSaveData().coins);
    this.scene.start("CityIntroCinematic", { nextScene: "CityScene" });
  }

  continueGame(save) {
    this.registry.set("score", save.currentScore || 0);
    this.registry.set("lives", 3);
    this.registry.set("coinsCollected", 0);
    this.registry.set("enemiesDefeated", 0);
    this.registry.set("runStartTime", Date.now());
    this.registry.set("coinsWallet", save.coins);
    this.scene.start(save.currentScene || "CityScene");
  }
}

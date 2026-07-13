// Pantalla de introducción: la historia antes de llegar al menú principal.

class IntroScene extends Phaser.Scene {
  constructor() {
    super("IntroScene");
  }

  preload() {
    generateGameTextures(this);
    this.load.image("marlonFace", "assets/marlon_face.png");
    preloadGameSounds(this);
  }

  create() {
    bakeCircularFaceTexture(this, "marlonFace", "marlonFaceCircle");

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#241a1f");

    this.add
      .text(width / 2, 34, "SUPER MARLON CAGÓN", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "32px",
        color: "#ffd93d",
        stroke: "#2b2b52",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const marlonY = 110;
    const body = this.add.image(width / 2, marlonY, "playerBody").setScale(1.8);
    const face = this.add.image(width / 2, marlonY + PLAYER_HEAD_OFFSET_Y * 1.8, getPlayerFaceKey(this));
    face.setDisplaySize(PLAYER_HEAD_DIAMETER * 1.8, PLAYER_HEAD_DIAMETER * 1.8);
    this.tweens.add({
      targets: [body, face],
      angle: { from: -4, to: 4 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const story =
      "Marlon está borracho y necesita cagar YA... ¡pero el Rey Maloliente se ha adueñado de todos los baños del reino!\n\n" +
      "Ayúdalo a derrotar al Rey Maloliente para que los baños dejen de existir de una vez, y Marlon pueda cagar donde le dé la gana.\n\n" +
      "Usa la caca y las botellas de cerveza para derrotar a tus enemigos por el camino.";

    this.add
      .text(width / 2, 200, story, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "16px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: width - 100 },
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0);

    const startButton = this.add
      .text(width / 2, height - 60, "CONTINUAR", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "26px",
        color: "#ffffff",
        backgroundColor: "#e63946",
        padding: { x: 26, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerover", () => startButton.setScale(1.06));
    startButton.on("pointerout", () => startButton.setScale(1));
    startButton.on("pointerdown", () => {
      requestFullscreenIfMobile(this);
      this.scene.start("MenuScene");
    });

    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("MenuScene"));
    this.input.keyboard.once("keydown-ENTER", () => this.scene.start("MenuScene"));

    if (this.sys.game.device.input.touch) {
      const fullscreenBtn = this.add
        .text(width / 2, height - 20, "PANTALLA COMPLETA", {
          fontFamily: "Comic Sans MS, sans-serif",
          fontSize: "13px",
          color: "#ffffff",
          backgroundColor: "#2b2b52",
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      fullscreenBtn.on("pointerover", () => fullscreenBtn.setScale(1.06));
      fullscreenBtn.on("pointerout", () => fullscreenBtn.setScale(1));
      fullscreenBtn.on("pointerdown", () => toggleFullscreen(this));
    }
  }
}

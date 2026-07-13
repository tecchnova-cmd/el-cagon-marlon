// Menú de pausa: continuar, reiniciar nivel, controles, sonido on/off, menú.
// Se lanza ENCIMA de la escena de nivel (que queda realmente pausada:
// física, tweens y temporizadores incluidos) y la reanuda al cerrar.

class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super("PauseMenuScene");
  }

  init(data) {
    this.parentKey = data.parentKey;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setDepth(0);

    this.add
      .text(width / 2, 60, "PAUSA", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "32px",
        color: "#ffffff",
        stroke: "#2b2b52",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.add
      .text(width / 2, 110, "← → mover · ↑/W/ESPACIO saltar\nZ caca · X botella · ESC pausa", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "13px",
        color: "#cfcfcf",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.soundLabel = null;
    this.buildButton(width / 2, 190, "CONTINUAR", () => this.resumeGame());
    this.buildButton(width / 2, 236, "REINICIAR NIVEL", () => this.restartLevel());
    this.soundLabel = this.buildButton(width / 2, 282, this.soundButtonText(), () => this.toggleSound());
    this.buildButton(width / 2, 328, "MENÚ PRINCIPAL", () => this.goToMenu());
    if (this.sys.game.device.input.touch) {
      this.buildButton(width / 2, 374, "PANTALLA COMPLETA", () => toggleFullscreen(this));
    }

    this.input.keyboard.once("keydown-ESC", () => this.resumeGame());
  }

  soundButtonText() {
    return isSoundEnabled() ? "SONIDO: ACTIVADO" : "SONIDO: DESACTIVADO";
  }

  buildButton(x, y, text, onClick) {
    const btn = this.add
      .text(x, y, text, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#2b2b52",
        padding: { x: 18, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(1)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerover", () => btn.setScale(1.06));
    btn.on("pointerout", () => btn.setScale(1));
    btn.on("pointerdown", onClick);
    return btn;
  }

  toggleSound() {
    const enabled = !isSoundEnabled();
    setSoundEnabled(enabled);
    const save = loadSaveData();
    save.soundEnabled = enabled;
    writeSaveData(save);
    this.soundLabel.setText(this.soundButtonText());
    if (enabled) playGameSound(this, SOUND_KEYS.coin);
  }

  resumeGame() {
    this.scene.stop();
    this.scene.resume(this.parentKey);
  }

  restartLevel() {
    this.scene.stop();
    this.scene.stop(this.parentKey);
    this.scene.start(this.parentKey);
  }

  goToMenu() {
    this.scene.stop();
    this.scene.stop(this.parentKey);
    this.scene.start("MenuScene");
  }
}

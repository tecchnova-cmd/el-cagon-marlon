// Tienda de mejoras entre niveles. Se gastan monedas (moneda persistente,
// separada de la puntuación) en hasta 3 niveles por mejora.

class UpgradeScene extends Phaser.Scene {
  constructor() {
    super("UpgradeScene");
  }

  init(data) {
    this.nextScene = (data && data.nextScene) || "CityScene";
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#2b2b52");

    this.save = loadSaveData();
    this.wallet = this.registry.get("coinsWallet");
    if (this.wallet === undefined) this.wallet = this.save.coins;

    this.add
      .text(width / 2, 30, "TIENDA DE MEJORAS", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "30px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0);

    this.coinsText = this.add
      .text(width / 2, 68, "", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "18px",
        color: "#ffd93d",
      })
      .setOrigin(0.5, 0);

    this.rows = [];
    const keys = Object.keys(UPGRADE_DEFS);
    keys.forEach((key, i) => {
      this.rows.push(this.createUpgradeRow(key, 110 + i * 62));
    });

    const continueButton = this.add
      .text(width / 2, height - 40, "CONTINUAR", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "26px",
        color: "#ffffff",
        backgroundColor: "#3d8b40",
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    continueButton.on("pointerover", () => continueButton.setScale(1.06));
    continueButton.on("pointerout", () => continueButton.setScale(1));
    continueButton.on("pointerdown", () => this.goToNextLevel());

    this.refreshDisplay();
  }

  createUpgradeRow(key, y) {
    const def = UPGRADE_DEFS[key];
    const width = this.scale.width;

    const label = this.add.text(30, y, def.label, {
      fontFamily: "Comic Sans MS, sans-serif",
      fontSize: "16px",
      color: "#ffffff",
    });

    const dots = [];
    for (let i = 0; i < def.maxLevel; i++) {
      dots.push(this.add.image(340 + i * 20, y + 10, "coin").setScale(0.6));
    }

    const buyButton = this.add
      .text(width - 20, y, "COMPRAR", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#e63946",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    buyButton.on("pointerdown", () => this.buyUpgrade(key));

    return { key, dots, buyButton };
  }

  buyUpgrade(key) {
    const level = this.save.upgrades[key] || 0;
    const cost = getUpgradeCost(key, level);
    if (cost === null || this.wallet < cost) {
      this.cameras.main.shake(150, 0.004);
      return;
    }
    this.wallet -= cost;
    this.save.upgrades[key] = level + 1;
    this.save.coins = this.wallet;
    writeSaveData(this.save);
    this.registry.set("coinsWallet", this.wallet);
    playGameSound(this, SOUND_KEYS.coin);
    this.refreshDisplay();
  }

  refreshDisplay() {
    this.coinsText.setText("Monedas: " + this.wallet);

    this.rows.forEach(({ key, dots, buyButton }) => {
      const level = this.save.upgrades[key] || 0;
      dots.forEach((dot, i) => dot.setAlpha(i < level ? 1 : 0.25));

      const cost = getUpgradeCost(key, level);
      if (cost === null) {
        buyButton.setText("MÁXIMO");
        buyButton.setBackgroundColor("#555555");
        buyButton.disableInteractive();
      } else {
        buyButton.setText("COMPRAR (" + cost + ")");
        buyButton.setBackgroundColor(this.wallet >= cost ? "#e63946" : "#7a3a3a");
      }
    });
  }

  goToNextLevel() {
    this.scene.start(this.nextScene);
  }
}

// Pantalla final: Marlon celebrando, confeti, estadísticas de la partida,
// mejor puntuación guardada, bonificaciones y frase cómica final.

const COMIC_END_PHRASE = "Marlon salvó el reino… pero nadie quiso estrecharle la mano.";

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
    const bottlesUsed = this.registry.get("bottlesUsed") || 0;
    const deathCount = this.registry.get("deathCount") || 0;
    const bestCombo = this.registry.get("bestCombo") || 0;
    const bossHits = 5; // el jefe siempre cae exactamente al 5º impacto de caca
    const runStartTime = this.registry.get("runStartTime") || Date.now();
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - runStartTime) / 1000));
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeText = minutes + ":" + String(seconds).padStart(2, "0");

    const bestScore = updateBestScore(this.finalScore);

    // Guardado final: la partida se completó, se limpia el progreso "en curso".
    // (FinalBossVictoryCinematic ya guardó gameCompleted/finalVictorySeen,
    // aquí solo se actualiza lo propio de esta pantalla de resultados.)
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
      .text(cx, 4, "¡EL REY MALOLIENTE HA SIDO DERROTADO!", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "16px",
        color: "#ffd93d",
        stroke: "#2b2b52",
        strokeThickness: 4,
        align: "center",
        wordWrap: { width: width - 40 },
      })
      .setOrigin(0.5, 0);

    // Marlon celebrando (con su corona de Cagón Número Uno).
    const marlonY = 64;
    const body = this.add.image(cx, marlonY, "playerBody").setScale(1.3);
    const face = this.add.image(cx, marlonY + PLAYER_HEAD_OFFSET_Y * 1.3, getPlayerFaceKey(this));
    face.setDisplaySize(PLAYER_HEAD_DIAMETER * 1.3, PLAYER_HEAD_DIAMETER * 1.3);
    this.tweens.add({
      targets: [body, face],
      y: "-=8",
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const statsLeft = [
      "Puntuación total: " + this.finalScore,
      "Monedas recogidas: " + coinsCollected,
      "Enemigos derrotados: " + enemiesDefeated,
      "Tiempo total: " + timeText,
    ];
    const statsRight = [
      "Botellas utilizadas: " + bottlesUsed,
      "Muertes: " + deathCount,
      "Mejor combo: x" + bestCombo,
      "Impactos al jefe: " + bossHits + "/5",
    ];
    this.add
      .text(cx - 130, 120, statsLeft.join("\n"), {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "13px",
        color: "#ffffff",
        align: "left",
        lineSpacing: 5,
      })
      .setOrigin(0.5, 0);
    this.add
      .text(cx + 130, 120, statsRight.join("\n"), {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "13px",
        color: "#ffffff",
        align: "left",
        lineSpacing: 5,
      })
      .setOrigin(0.5, 0);
    this.add
      .text(cx, 196, "Mejor puntuación guardada: " + bestScore, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "13px",
        color: "#ffd93d",
      })
      .setOrigin(0.5, 0);

    // Bonificaciones conseguidas en esta partida.
    const bonuses = [
      "✔ Derrotar al Rey Maloliente",
      (deathCount === 0 ? "✔" : "✘") + " No recibir daño",
      (bottlesUsed === 0 ? "✔" : "✘") + " Derrotarlo sin usar botellas",
      "✔ Completar todos los niveles",
    ];
    this.add
      .text(cx, 222, bonuses.join("\n"), {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "12px",
        color: "#dfffe0",
        align: "center",
        lineSpacing: 3,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(cx, 320, COMIC_END_PHRASE, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "12px",
        color: "#dfffe0",
        fontStyle: "italic",
        align: "center",
        wordWrap: { width: width - 60 },
      })
      .setOrigin(0.5, 0);

    const makeButton = (x, y, label, bg, onClick) => {
      const btn = this.add
        .text(x, y, label, {
          fontFamily: "Comic Sans MS, sans-serif",
          fontSize: "15px",
          color: "#ffffff",
          backgroundColor: bg,
          padding: { x: 12, y: 8 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      btn.on("pointerover", () => btn.setScale(1.06));
      btn.on("pointerout", () => btn.setScale(1));
      btn.on("pointerdown", onClick);
      return btn;
    };

    makeButton(cx - 190, 410, "JUGAR DE NUEVO", "#e63946", () => this.startNewRun());
    makeButton(cx, 410, "MENÚ PRINCIPAL", "#2b2b52", () => this.scene.start("MenuScene"));
    makeButton(cx + 190, 410, "VER CRÉDITOS", "#3d6b8b", () => this.scene.start("CreditsScene"));
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

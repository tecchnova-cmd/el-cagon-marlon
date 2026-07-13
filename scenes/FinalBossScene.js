// Batalla final: El Inodoro Gigante. Exactamente 5 impactos de caca lo
// derrotan; las botellas solo lo aturden brevemente (no quitan segmentos de
// vida). 3 fases según los impactos recibidos, con miniinodoros a partir
// del tercer impacto.

const ARENA_WIDTH = 1000;
const ARENA_HEIGHT = 540;
const ARENA_GROUND_TOP = 476;
const BOSS_X = 850;
const BOSS_Y = 396;

class FinalBossScene extends Phaser.Scene {
  constructor() {
    super("FinalBossScene");
  }

  create() {
    if (this.registry.get("score") === undefined) this.registry.set("score", 0);
    if (this.registry.get("lives") === undefined) this.registry.set("lives", 3);
    this.isRoundOver = false;

    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.cameras.main.setBackgroundColor("#241a1f");
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    this.createBackground();
    this.createPlatforms();

    this.player = new Player(this, 100, ARENA_GROUND_TOP - 60);
    applyUpgradesToPlayer(this.player, loadSaveData());
    this.physics.add.collider(this.player, this.platforms);

    this.poopGroup = this.physics.add.group();
    this.bottleGroup = this.physics.add.group();
    this.pigeonDroppings = this.physics.add.group(); // sin uso aquí, compatibilidad
    this.bossWaterJets = this.physics.add.group();
    this.ceilingDrops = this.physics.add.group();
    this.bossWaves = this.physics.add.group();

    this.groundEnemies = this.physics.add.group();
    this.airEnemies = this.physics.add.group(); // vacío en esta arena, mantiene compatibilidad

    this.boss = new Boss(this, BOSS_X, BOSS_Y);
    this.groundEnemies.add(this.boss);

    this.lastWaterJetTime = 0;
    this.lastDropTime = 0;
    this.lastWaveTime = 0;
    this.lastMiniToiletTime = 0;

    this.physics.add.collider(this.groundEnemies, this.platforms);
    this.physics.add.collider(this.bottleGroup, this.platforms, (bottle) => this.breakBottle(bottle), null, this);

    this.physics.add.overlap(this.player, this.groundEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.bossWaterJets, this.onHazardHitPlayer, null, this);
    this.physics.add.overlap(this.player, this.ceilingDrops, this.onHazardHitPlayer, null, this);
    this.physics.add.overlap(this.player, this.bossWaves, this.onHazardHitPlayer, null, this);
    this.physics.add.overlap(this.poopGroup, this.groundEnemies, this.onPoopHitEnemy, null, this);
    this.physics.add.overlap(this.bottleGroup, this.groundEnemies, this.onBottleHitEnemy, null, this);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(180, 100);

    this.createHUD();
    this.setupInput();
  }

  createBackground() {
    [150, 500, 750].forEach((x) => {
      const torch = this.add.image(x, ARENA_GROUND_TOP - 20, "castleTorch").setDepth(1);
      this.tweens.add({ targets: torch, alpha: 0.6, scale: 1.1, duration: 400, yoyo: true, repeat: -1 });
    });
    this.add.image(300, 60, "castleBanner").setOrigin(0.5, 0).setAlpha(0.9);
    this.add.image(650, 60, "castleBanner").setOrigin(0.5, 0).setAlpha(0.9);
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    for (let x = 0; x <= ARENA_WIDTH; x += 64) {
      this.platforms.create(x + 32, ARENA_GROUND_TOP + 32, "bossArenaFloor");
    }

    // Plataforma elevada: refugio para esquivar la gran ola.
    this.platforms.create(420, 370, "metalPlatform");
    this.platforms.create(484, 370, "metalPlatform");
  }

  createHUD() {
    const style = {
      fontFamily: "Comic Sans MS, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      stroke: "#2b2b52",
      strokeThickness: 4,
    };

    this.scoreText = this.add.text(16, 14, "Puntos: 0", style).setScrollFactor(0).setDepth(10);
    this.levelText = this.add
      .text(this.scale.width / 2, 14, "JEFE FINAL: INODORO GIGANTE", style)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10)
      .setFontSize(18);

    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add
        .image(this.scale.width - 30 - i * 28, 26, "heart")
        .setScrollFactor(0)
        .setDepth(10);
      this.hearts.push(heart);
    }

    this.bossHealthSegments = [];
    const startX = this.scale.width / 2 - (5 * 34) / 2 + 15;
    for (let i = 0; i < 5; i++) {
      const seg = this.add
        .image(startX + i * 34, 46, "bossHealthFull")
        .setScrollFactor(0)
        .setDepth(10);
      this.bossHealthSegments.push(seg);
    }

    this.bottleText = this.add
      .text(16, 40, "", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "16px",
        color: "#ffd93d",
        stroke: "#2b2b52",
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.comboText = this.add
      .text(this.scale.width / 2, 66, "", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "16px",
        color: "#ffd93d",
        stroke: "#2b2b52",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,D,SPACE,Z,X,F");
    setupPauseKey(this);
    createTouchControls(this);
  }

  update(time) {
    checkPauseToggle(this);
    if (this.isRoundOver) return;

    this.player.handleMovement(this.cursors, this.wasd);
    this.bottleText.setText("Botellas: " + this.player.bottles);

    if (Phaser.Input.Keyboard.JustDown(this.wasd.Z)) {
      this.player.throwPoop(this.poopGroup);
    }
    if (Phaser.Input.Keyboard.JustDown(this.wasd.X)) {
      this.player.throwBottle(this.bottleGroup);
    }
    if (Phaser.Input.Keyboard.JustDown(this.wasd.F)) {
      this.player.fart();
    }

    this.groundEnemies.children.each((enemy) => enemy.update());
    this.updateProjectiles();

    if (!this.boss.defeated) this.updateBossAI(time);

    if (this.player.y > ARENA_HEIGHT + 100) {
      this.onPlayerHit(this.player, null);
    }
  }

  updateBossAI(now) {
    if (this.boss.isStunned) return;

    const phase = this.boss.phase;
    const waterInterval = phase === 1 ? 3500 : phase === 2 ? 2600 : 2200;
    if (now - this.lastWaterJetTime >= waterInterval) {
      this.lastWaterJetTime = now;
      this.bossWaterJetAttack();
    }

    if (phase >= 2) {
      const dropInterval = phase === 2 ? 3000 : 2500;
      if (now - this.lastDropTime >= dropInterval) {
        this.lastDropTime = now;
        this.bossCeilingDropAttack();
      }
    }

    if (phase >= 3) {
      if (now - this.lastWaveTime >= 6000) {
        this.lastWaveTime = now;
        this.bossWaveAttack();
      }
    }

    if (this.boss.hitsTaken >= 3) {
      if (now - this.lastMiniToiletTime >= 5000) {
        this.lastMiniToiletTime = now;
        this.spawnMiniToilet();
      }
    }
  }

  bossWaterJetAttack() {
    const jet = this.bossWaterJets.create(this.boss.x - 70, ARENA_GROUND_TOP - 20, "bossWaterJet");
    jet.body.allowGravity = false;
    jet.setVelocityX(-220);
  }

  bossCeilingDropAttack() {
    const x = Phaser.Math.Between(150, this.boss.x - 150);
    const marker = this.add.image(x, 60, "warningMarker").setDepth(5);
    this.tweens.add({ targets: marker, alpha: 0.3, duration: 150, yoyo: true, repeat: 3 });
    this.time.delayedCall(600, () => {
      marker.destroy();
      if (this.boss.defeated) return;
      const drop = this.ceilingDrops.create(x, 40, "ceilingDrop");
      drop.body.allowGravity = false;
      drop.setVelocityY(260);
    });
  }

  bossWaveAttack() {
    this.cameras.main.shake(400, 0.01);
    this.time.delayedCall(500, () => {
      if (this.boss.defeated) return;
      const wave = this.bossWaves.create(this.boss.x, ARENA_GROUND_TOP - 15, "bossWave");
      wave.body.allowGravity = false;
      wave.setVelocityX(-180);
    });
  }

  spawnMiniToilet() {
    const x = Phaser.Math.Between(200, this.boss.x - 120);
    const mini = new MiniToilet(this, x, ARENA_GROUND_TOP - 13);
    this.groundEnemies.add(mini);
  }

  updateProjectiles() {
    this.poopGroup.children.each((poop) => {
      if (Math.abs(poop.x - poop.spawnX) > (poop.maxRange || POOP_RANGE)) {
        this.spawnPoopSplash(poop.x, poop.y);
        poop.destroy();
      }
    });

    this.bottleGroup.children.each((bottle) => {
      if (bottle.y > ARENA_HEIGHT + 50 || bottle.x < -50 || bottle.x > ARENA_WIDTH + 50) {
        bottle.destroy();
      }
    });

    this.bossWaterJets.children.each((jet) => {
      if (jet.x < -60) jet.destroy();
    });

    this.ceilingDrops.children.each((drop) => {
      if (drop.y > ARENA_HEIGHT + 50) drop.destroy();
    });

    this.bossWaves.children.each((wave) => {
      if (wave.x < -220) wave.destroy();
    });
  }

  onHazardHitPlayer(player, hazard) {
    hazard.destroy();
    this.onPlayerHit(player, null);
  }

  addScore(amount) {
    const score = this.registry.get("score") + amount;
    this.registry.set("score", score);
    this.scoreText.setText("Puntos: " + score);
  }

  onPoopHitEnemy(poop, enemy) {
    if (!enemy.active) return;
    this.spawnPoopSplash(poop.x, poop.y);
    poop.destroy();

    if (enemy.isBoss) {
      const before = enemy.hitsTaken;
      const finalHit = enemy.takeDamage(1);
      if (enemy.hitsTaken > before) this.updateBossHealthBar(enemy.hitsTaken);
      if (finalHit) {
        this.addScore(enemy.points);
        this.triggerBossDefeatSequence(enemy);
      }
      return;
    }

    const ex = enemy.x, ey = enemy.y;
    if (enemy.takeDamage(1)) awardEnemyDefeat(this, ex, ey, enemy.points);
  }

  onBottleHitEnemy(bottle, enemy) {
    if (!enemy.active) return;
    this.spawnGlassBreak(bottle.x, bottle.y);
    bottle.destroy();

    if (enemy.isBoss) {
      enemy.stun();
      return; // las botellas solo aturden al jefe, nunca le quitan vida
    }

    const ex = enemy.x, ey = enemy.y;
    if (enemy.takeDamage(2)) awardEnemyDefeat(this, ex, ey, enemy.points);
  }

  updateBossHealthBar(hitsTaken) {
    for (let i = 0; i < hitsTaken; i++) {
      if (this.bossHealthSegments[i]) this.bossHealthSegments[i].setVisible(false);
    }
  }

  triggerBossDefeatSequence(boss) {
    this.isRoundOver = true;

    this.cameras.main.shake(500, 0.012);
    this.tweens.add({ targets: boss, angle: 360, duration: 900, repeat: 1 });

    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 200, () => {
        const puff = this.add.image(boss.x + Phaser.Math.Between(-30, 30), boss.y - 40, "steamPuff").setScale(1.5);
        this.tweens.add({ targets: puff, y: puff.y - 40, alpha: 0, duration: 800, onComplete: () => puff.destroy() });
      });
    }

    this.time.delayedCall(1600, () => {
      this.tweens.add({
        targets: boss,
        scale: 0,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          boss.destroy();
          this.showVictoryMessage();
        },
      });
    });
  }

  showVictoryMessage() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, "¡EL REY MALOLIENTE HA SIDO DERROTADO!", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "26px",
        color: "#ffd93d",
        stroke: "#2b2b52",
        strokeThickness: 6,
        align: "center",
        wordWrap: { width: width - 60 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20);

    const score = this.registry.get("score");
    this.time.delayedCall(2500, () => {
      this.scene.start("VictoryScene", { score });
    });
  }

  breakBottle(bottle) {
    this.spawnGlassBreak(bottle.x, bottle.y);
    bottle.destroy();
  }

  spawnPoopSplash(x, y) {
    const splash = this.add.sprite(x, y, "poopSplash").setScale(0.5);
    this.tweens.add({
      targets: splash,
      scale: 1.2,
      alpha: 0,
      duration: 250,
      onComplete: () => splash.destroy(),
    });
  }

  spawnGlassBreak(x, y) {
    for (let i = 0; i < 5; i++) {
      const shard = this.add.sprite(x, y, "glassShard").setScale(0.8);
      const angle = Phaser.Math.Between(0, 360);
      const distance = Phaser.Math.Between(10, 26);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(Phaser.Math.DegToRad(angle)) * distance,
        y: y + Math.sin(Phaser.Math.DegToRad(angle)) * distance,
        alpha: 0,
        rotation: Phaser.Math.Between(-3, 3),
        duration: 300,
        onComplete: () => shard.destroy(),
      });
    }
    playGameSound(this, SOUND_KEYS.glassBreak);
  }

  onPlayerHit(player, enemy) {
    if (this.isRoundOver || player.isInvulnerable) return;
    if (enemy && enemy.intangible) return;

    const lives = this.registry.get("lives") - 1;
    this.registry.set("lives", lives);

    if (this.hearts[lives]) {
      this.hearts[lives].setVisible(false);
    }

    const knockbackDir = enemy && player.x < enemy.x ? -1 : 1;
    player.takeHit(knockbackDir);

    if (lives <= 0) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.isRoundOver = true;
    playGameSound(this, SOUND_KEYS.gameOver);
    const score = this.registry.get("score");
    this.time.delayedCall(300, () => {
      this.scene.start("GameOverScene", { score, currentScene: "FinalBossScene" });
    });
  }
}


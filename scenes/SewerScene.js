// Nivel 2: Alcantarillas. Tuberías, agua tóxica, plataformas metálicas
// móviles, rata mutante, mosquito gigante (con embestida) y baba tóxica.
// La salida es una tubería gigante que conduce al bosque.

const SEWER_LEVEL_WIDTH = 3000;
const SEWER_LEVEL_HEIGHT = 540;
const SEWER_GROUND_TOP = 476;

class SewerScene extends Phaser.Scene {
  constructor() {
    super("SewerScene");
  }

  create() {
    if (this.registry.get("score") === undefined) this.registry.set("score", 0);
    if (this.registry.get("lives") === undefined) this.registry.set("lives", 3);
    this.isRoundOver = false;

    this.physics.world.setBounds(0, 0, SEWER_LEVEL_WIDTH, SEWER_LEVEL_HEIGHT);
    this.cameras.main.setBackgroundColor("#2a3a2f");
    this.cameras.main.setBounds(0, 0, SEWER_LEVEL_WIDTH, SEWER_LEVEL_HEIGHT);

    this.createBackground();
    this.createPlatforms();
    this.createMovingPlatforms();
    this.createHazards();
    this.createCoins();

    this.player = new Player(this, 80, SEWER_GROUND_TOP - 60);
    applyUpgradesToPlayer(this.player, loadSaveData().upgrades);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);
    createCheckpoint(this, SEWER_LEVEL_WIDTH / 2, SEWER_GROUND_TOP);

    this.poopGroup = this.physics.add.group();
    this.bottleGroup = this.physics.add.group();
    this.pigeonDroppings = this.physics.add.group(); // sin uso en este nivel, mantiene compatibilidad con Enemy

    this.createEnemies();
    this.createExit();

    this.physics.add.collider(this.groundEnemies, this.platforms);
    this.physics.add.collider(this.bottleGroup, this.platforms, (bottle) => this.breakBottle(bottle), null, this);
    this.physics.add.collider(this.bottleGroup, this.movingPlatforms, (bottle) => this.breakBottle(bottle), null, this);

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.groundEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.airEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.hazardZones, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.poopGroup, this.groundEnemies, this.onPoopHitEnemy, null, this);
    this.physics.add.overlap(this.poopGroup, this.airEnemies, this.onPoopHitEnemy, null, this);
    this.physics.add.overlap(this.bottleGroup, this.groundEnemies, this.onBottleHitEnemy, null, this);
    this.physics.add.overlap(this.bottleGroup, this.airEnemies, this.onBottleHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.exitZone, this.onReachExit, null, this);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(200, 100);

    this.createHUD();
    this.setupInput();
  }

  createBackground() {
    const pipeXs = [80, 400, 780, 1150, 1520, 1900, 2280, 2650, 2950];
    pipeXs.forEach((x) => {
      this.add.image(x, SEWER_GROUND_TOP + 10, "pipeBackground").setOrigin(0.5, 1).setScrollFactor(0.5).setAlpha(0.8);
    });

    // Vapor decorativo: puffs que suben y se desvanecen en bucle.
    [300, 900, 1600, 2300, 2800].forEach((x) => {
      this.spawnSteamLoop(x, SEWER_GROUND_TOP - 10);
    });

    // Goteras decorativas cayendo desde el techo.
    [500, 1200, 1950, 2600].forEach((x) => {
      this.spawnDripLoop(x, 40);
    });
  }

  spawnSteamLoop(x, y) {
    const puff = this.add.image(x, y, "steamPuff").setAlpha(0).setScrollFactor(0.7);
    const loop = () => {
      puff.setPosition(x, y).setAlpha(0.5).setScale(0.8);
      this.tweens.add({
        targets: puff,
        y: y - 50,
        alpha: 0,
        scale: 1.4,
        duration: 2200,
        onComplete: loop,
      });
    };
    this.time.delayedCall(Phaser.Math.Between(0, 1500), loop);
  }

  spawnDripLoop(x, topY) {
    const drip = this.add.image(x, topY, "waterDrip").setAlpha(0);
    const loop = () => {
      drip.setPosition(x, topY).setAlpha(0.9);
      this.tweens.add({
        targets: drip,
        y: SEWER_GROUND_TOP,
        duration: 900,
        onComplete: loop,
      });
    };
    this.time.delayedCall(Phaser.Math.Between(0, 1200), loop);
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    for (let x = 0; x <= SEWER_LEVEL_WIDTH; x += 64) {
      this.platforms.create(x + 32, SEWER_GROUND_TOP + 32, "sewerFloor");
    }

    const floating = [
      [420, 420],
      [660, 350],
      [900, 420],
      [1450, 340],
      [1700, 420],
      [2200, 340],
      [2450, 420],
      [2750, 360],
    ];
    floating.forEach(([x, y]) => this.platforms.create(x, y, "metalPlatform"));

    this.floatingPlatforms = floating;
  }

  createMovingPlatforms() {
    // Plataformas metálicas que se desplazan sobre las zonas de agua tóxica.
    this.movingPlatforms = this.physics.add.group();

    const defs = [
      { x: 1150, y: 430, range: 120, duration: 1800 },
      { x: 2000, y: 430, range: 130, duration: 2000 },
    ];

    defs.forEach(({ x, y, range, duration }) => {
      const plat = this.movingPlatforms.create(x, y, "metalPlatform");
      plat.body.allowGravity = false;
      plat.setImmovable(true);
      this.tweens.add({
        targets: plat,
        x: x + range,
        duration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        onUpdate: () => plat.body.updateFromGameObject(),
      });
    });
  }

  createHazards() {
    // Agua tóxica: zonas peligrosas pintadas sobre tramos del suelo (el suelo
    // sigue siendo sólido; tocar la zona resta una vida, igual que un enemigo).
    this.hazardZones = this.physics.add.staticGroup();

    const hazardXs = [1150, 2000];
    hazardXs.forEach((x) => {
      this.add.image(x, SEWER_GROUND_TOP - 6, "toxicWater").setDepth(1);
      const zone = this.hazardZones.create(x, SEWER_GROUND_TOP - 10, "toxicWater");
      zone.setVisible(false);
      zone.body.setSize(60, 16);
    });
  }

  createCoins() {
    this.coins = this.physics.add.staticGroup();

    this.floatingPlatforms.forEach(([x, y]) => {
      this.coins.create(x, y - 26, "coin");
    });

    [220, 780, 1300, 1850, 2350, 2850].forEach((x) => {
      this.coins.create(x, SEWER_GROUND_TOP - 24, "coin");
    });
  }

  createEnemies() {
    this.groundEnemies = this.physics.add.group();
    this.airEnemies = this.physics.add.group();

    const ratMutant1 = new RatMutant(this, 700, SEWER_GROUND_TOP - 11, 100);
    const ratMutant2 = new RatMutant(this, 2600, SEWER_GROUND_TOP - 11, 100);
    this.groundEnemies.add(ratMutant1);
    this.groundEnemies.add(ratMutant2);

    const slime1 = new ToxicSlime(this, 1550, SEWER_GROUND_TOP - 7, 60);
    const slime2 = new ToxicSlime(this, 2350, SEWER_GROUND_TOP - 7, 60);
    this.groundEnemies.add(slime1);
    this.groundEnemies.add(slime2);

    const mosquito1 = new Mosquito(this, 950, 340, 100, true);
    const mosquito2 = new Mosquito(this, 2100, 300, 120, true);
    this.airEnemies.add(mosquito1);
    this.airEnemies.add(mosquito2);
  }

  createExit() {
    const exitX = 2920;
    this.add.image(exitX, SEWER_GROUND_TOP - 20, "pipeExit").setDepth(1);

    const zone = this.add.zone(exitX, SEWER_GROUND_TOP - 20, 60, 80);
    this.physics.add.existing(zone, true);
    this.exitZone = zone;
  }

  createHUD() {
    const style = {
      fontFamily: "Comic Sans MS, sans-serif",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#2b2b52",
      strokeThickness: 4,
    };

    this.scoreText = this.add.text(16, 14, "Puntos: 0", style).setScrollFactor(0).setDepth(10);
    this.levelText = this.add
      .text(this.scale.width / 2, 14, "NIVEL 2: ALCANTARILLAS", style)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10);

    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add
        .image(this.scale.width - 30 - i * 28, 26, "heart")
        .setScrollFactor(0)
        .setDepth(10);
      this.hearts.push(heart);
    }

    this.bottleText = this.add
      .text(16, 40, "", { fontFamily: "Comic Sans MS, sans-serif", fontSize: "16px", color: "#ffd93d", stroke: "#2b2b52", strokeThickness: 3 })
      .setScrollFactor(0)
      .setDepth(10);

    this.comboText = this.add
      .text(this.scale.width / 2, 40, "", { fontFamily: "Comic Sans MS, sans-serif", fontSize: "16px", color: "#ffd93d", stroke: "#2b2b52", strokeThickness: 3 })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,D,SPACE,Z,X");
    setupPauseKey(this);
    createTouchControls(this);
  }

  update() {
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

    this.groundEnemies.children.each((enemy) => enemy.update());
    this.airEnemies.children.each((enemy) => enemy.update());
    this.updateProjectiles();
    applyCoinMagnet(this);

    if (this.player.y > SEWER_LEVEL_HEIGHT + 100) {
      this.onPlayerHit(this.player, null);
    }
  }

  updateProjectiles() {
    this.poopGroup.children.each((poop) => {
      if (Math.abs(poop.x - poop.spawnX) > (poop.maxRange || POOP_RANGE)) {
        this.spawnPoopSplash(poop.x, poop.y);
        poop.destroy();
      }
    });

    this.bottleGroup.children.each((bottle) => {
      if (bottle.y > SEWER_LEVEL_HEIGHT + 50 || bottle.x < -50 || bottle.x > SEWER_LEVEL_WIDTH + 50) {
        bottle.destroy();
      }
    });
  }

  addScore(amount) {
    const score = this.registry.get("score") + amount;
    this.registry.set("score", score);
    this.scoreText.setText("Puntos: " + score);
  }

  collectCoin(player, coin) {
    spawnCoinParticles(this, coin.x, coin.y);
    coin.destroy();
    this.addScore(10);
    trackCoinCollected(this);
    playGameSound(this, SOUND_KEYS.coin);
  }

  onPoopHitEnemy(poop, enemy) {
    if (!enemy.active) return;
    this.spawnPoopSplash(poop.x, poop.y);
    poop.destroy();
    const ex = enemy.x, ey = enemy.y;
    if (enemy.takeDamage(1)) awardEnemyDefeat(this, ex, ey, enemy.points);
  }

  onBottleHitEnemy(bottle, enemy) {
    if (!enemy.active) return;
    this.spawnGlassBreak(bottle.x, bottle.y);
    bottle.destroy();
    const ex = enemy.x, ey = enemy.y;
    if (enemy.takeDamage(2)) awardEnemyDefeat(this, ex, ey, enemy.points);
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

    const lives = this.registry.get("lives") - 1;
    this.registry.set("lives", lives);

    if (this.hearts[lives]) {
      this.hearts[lives].setVisible(false);
    }

    const knockbackDir = enemy && player.x < enemy.x ? -1 : 1;
    player.takeHit(knockbackDir);

    if (lives <= 0) {
      this.triggerGameOver();
    } else {
      respawnAtCheckpoint(this);
    }
  }

  onReachExit() {
    if (this.isRoundOver) return;
    this.triggerLevelComplete();
  }

  triggerGameOver() {
    this.isRoundOver = true;
    playGameSound(this, SOUND_KEYS.gameOver);
    const score = this.registry.get("score");
    this.time.delayedCall(300, () => {
      this.scene.start("GameOverScene", { score, currentScene: "SewerScene" });
    });
  }

  triggerLevelComplete() {
    this.isRoundOver = true;
    const score = this.registry.get("score");
    this.player.setVelocity(0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start("LevelCompleteScene", { score, currentScene: "SewerScene", nextScene: "ToxicForestScene" });
    });
  }
}

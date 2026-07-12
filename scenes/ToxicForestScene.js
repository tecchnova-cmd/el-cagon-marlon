// Nivel 3: Bosque Tóxico. Árboles deformados, niebla verde, hongos
// saltarines, mosca mutante, planta carnívora y jabalí apestoso.
// La salida es la puerta de seguridad de un laboratorio secreto.

const FOREST_LEVEL_WIDTH = 3000;
const FOREST_LEVEL_HEIGHT = 540;
const FOREST_GROUND_TOP = 476;

class ToxicForestScene extends Phaser.Scene {
  constructor() {
    super("ToxicForestScene");
  }

  create() {
    if (this.registry.get("score") === undefined) this.registry.set("score", 0);
    if (this.registry.get("lives") === undefined) this.registry.set("lives", 3);
    this.isRoundOver = false;

    this.physics.world.setBounds(0, 0, FOREST_LEVEL_WIDTH, FOREST_LEVEL_HEIGHT);
    this.cameras.main.setBackgroundColor("#3a4a2f");
    this.cameras.main.setBounds(0, 0, FOREST_LEVEL_WIDTH, FOREST_LEVEL_HEIGHT);

    this.createBackground();
    this.createPlatforms();
    this.createObstacles();
    this.createCoins();

    this.player = new Player(this, 80, FOREST_GROUND_TOP - 60);
    applyUpgradesToPlayer(this.player, loadSaveData().upgrades);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.trampolines, (player, pad) => this.onTrampolineBounce(player, pad));
    createCheckpoint(this, FOREST_LEVEL_WIDTH / 2, FOREST_GROUND_TOP);

    this.poopGroup = this.physics.add.group();
    this.bottleGroup = this.physics.add.group();
    this.pigeonDroppings = this.physics.add.group(); // sin uso aquí, mantiene compatibilidad
    this.toxicClouds = this.physics.add.group();
    this.fallingBranches = this.physics.add.group();

    this.createEnemies();
    this.createExit();

    this.physics.add.collider(this.groundEnemies, this.platforms);
    this.physics.add.collider(
      this.groundEnemies,
      this.breakableCrates,
      (enemy, crate) => this.onEnemyHitCrate(enemy, crate),
      null,
      this
    );
    this.physics.add.collider(this.bottleGroup, this.platforms, (bottle) => this.breakBottle(bottle), null, this);
    this.physics.add.collider(this.fallingBranches, this.platforms, (branch) => branch.destroy());

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.groundEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.airEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.hazardZones, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.toxicClouds, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.fallingBranches, this.onBranchHitPlayer, null, this);
    this.physics.add.overlap(this.poopGroup, this.groundEnemies, this.onPoopHitEnemy, null, this);
    this.physics.add.overlap(this.poopGroup, this.airEnemies, this.onPoopHitEnemy, null, this);
    this.physics.add.overlap(this.bottleGroup, this.groundEnemies, this.onBottleHitEnemy, null, this);
    this.physics.add.overlap(this.bottleGroup, this.airEnemies, this.onBottleHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.exitZone, this.onReachExit, null, this);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(200, 100);

    this.createHUD();
    this.setupInput();
    this.setupBranchSpawners();
  }

  createBackground() {
    const treeXs = [60, 380, 720, 1080, 1420, 1780, 2120, 2460, 2800, 2980];
    treeXs.forEach((x, i) => {
      this.add
        .image(x, FOREST_GROUND_TOP + 10, "forestTree")
        .setOrigin(0.5, 1)
        .setScrollFactor(0.5)
        .setScale(0.9 + (i % 3) * 0.15)
        .setAlpha(0.85);
    });

    for (let x = 100; x < FOREST_LEVEL_WIDTH; x += 400) {
      this.add.image(x, FOREST_GROUND_TOP - 120, "toxicFog").setScrollFactor(0.6).setDepth(2);
    }
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    for (let x = 0; x <= FOREST_LEVEL_WIDTH; x += 64) {
      this.platforms.create(x + 32, FOREST_GROUND_TOP + 32, "forestFloor");
    }

    const floating = [
      [400, 420],
      [640, 350],
      [880, 420],
      [1400, 340],
      [1650, 420],
      [2150, 340],
      [2400, 420],
      [2700, 360],
    ];
    floating.forEach(([x, y]) => this.platforms.create(x, y, "platform"));

    this.floatingPlatforms = floating;

    // Trampolines: hongos grandes que impulsan a Marlon hacia arriba.
    this.trampolines = this.physics.add.staticGroup();
    [1050, 2500].forEach((x) => {
      this.trampolines.create(x, FOREST_GROUND_TOP - 9, "mushroomTrampoline");
    });
  }

  createObstacles() {
    this.hazardZones = this.physics.add.staticGroup();

    // Espinas: peligro a nivel de suelo, hay que saltarlas.
    [550, 1900].forEach((x) => {
      this.add.image(x, FOREST_GROUND_TOP - 8, "thornPatch").setDepth(1);
      const zone = this.hazardZones.create(x, FOREST_GROUND_TOP - 8, "thornPatch");
      zone.setVisible(false);
      zone.body.setSize(36, 14);
    });

    // Pozos tóxicos: igual que las espinas, pintados sobre el suelo.
    [1250, 2650].forEach((x) => {
      this.add.image(x, FOREST_GROUND_TOP - 6, "toxicPit").setDepth(1);
      const zone = this.hazardZones.create(x, FOREST_GROUND_TOP - 6, "toxicPit");
      zone.setVisible(false);
      zone.body.setSize(36, 12);
    });

    // Cajas rompibles: el jabalí apestoso las destruye al chocar con ellas.
    this.breakableCrates = this.physics.add.staticGroup();
    [1700, 2250].forEach((x) => {
      this.breakableCrates.create(x, FOREST_GROUND_TOP - 12, "crate");
    });
  }

  createCoins() {
    this.coins = this.physics.add.staticGroup();

    this.floatingPlatforms.forEach(([x, y]) => {
      this.coins.create(x, y - 26, "coin");
    });

    [200, 800, 1550, 2000, 2450, 2900].forEach((x) => {
      this.coins.create(x, FOREST_GROUND_TOP - 24, "coin");
    });
  }

  createEnemies() {
    this.groundEnemies = this.physics.add.group();
    this.airEnemies = this.physics.add.group();

    const mushroom1 = new HoppingMushroom(this, 850, FOREST_GROUND_TOP - 12);
    const mushroom2 = new HoppingMushroom(this, 2350, FOREST_GROUND_TOP - 12);
    this.groundEnemies.add(mushroom1);
    this.groundEnemies.add(mushroom2);

    const plant1 = new CarnivorousPlant(this, 1500, FOREST_GROUND_TOP - 18);
    const plant2 = new CarnivorousPlant(this, 2800, FOREST_GROUND_TOP - 18);
    this.groundEnemies.add(plant1);
    this.groundEnemies.add(plant2);

    const boar = new StinkyBoar(this, 2000, FOREST_GROUND_TOP - 15, 150);
    this.groundEnemies.add(boar);

    const fly1 = new MutantFly(this, 500, 350, 90);
    const fly2 = new MutantFly(this, 2600, 320, 100);
    this.airEnemies.add(fly1);
    this.airEnemies.add(fly2);
  }

  createExit() {
    const exitX = 2920;
    this.add.image(exitX, FOREST_GROUND_TOP - 18, "securityDoor").setDepth(1);

    const zone = this.add.zone(exitX, FOREST_GROUND_TOP - 18, 60, 90);
    this.physics.add.existing(zone, true);
    this.exitZone = zone;
  }

  setupBranchSpawners() {
    // Ramas que caen periódicamente desde el follaje en un par de puntos fijos.
    [700, 2100].forEach((x) => {
      this.time.addEvent({
        delay: Phaser.Math.Between(2500, 3500),
        loop: true,
        callback: () => {
          if (this.isRoundOver) return;
          const branch = this.fallingBranches.create(x, FOREST_GROUND_TOP - 260, "fallingBranch");
          branch.setVelocityY(140);
        },
      });
    });
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
      .text(this.scale.width / 2, 14, "NIVEL 3: BOSQUE TÓXICO", style)
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

    this.fallingBranches.children.each((branch) => {
      if (branch.y > FOREST_LEVEL_HEIGHT + 50) branch.destroy();
    });

    if (this.player.y > FOREST_LEVEL_HEIGHT + 100) {
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
      if (bottle.y > FOREST_LEVEL_HEIGHT + 50 || bottle.x < -50 || bottle.x > FOREST_LEVEL_WIDTH + 50) {
        bottle.destroy();
      }
    });
  }

  onTrampolineBounce(player, pad) {
    if (player.body.velocity.y > 0) {
      player.setVelocityY(-700);
      player.spawnDust();
      playGameSound(this, SOUND_KEYS.jump);
    }
  }

  onEnemyHitCrate(enemy, crate) {
    if (enemy.texture.key !== "stinkyBoar") return;
    spawnPoof(this, crate.x, crate.y, 0.35);
    crate.destroy();
  }

  onBranchHitPlayer(player, branch) {
    branch.destroy();
    this.onPlayerHit(player, null);
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
      this.scene.start("GameOverScene", { score, currentScene: "ToxicForestScene" });
    });
  }

  triggerLevelComplete() {
    this.isRoundOver = true;
    const score = this.registry.get("score");
    this.player.setVelocity(0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start("LevelCompleteScene", { score, currentScene: "ToxicForestScene", nextScene: "LaboratoryScene" });
    });
  }
}

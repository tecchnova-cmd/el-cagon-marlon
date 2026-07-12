// Nivel 5: Castillo del Rey Maloliente. Guardia del retrete (con escudo),
// fantasma oloroso (intangible), caballero del papel higiénico (suelta
// curación), hechicero de las flatulencias (teletransporte + nubes verdes).
// Pinchos, chorros de agua, bolas de piedra, plataformas móviles y puertas
// con interruptores. El nivel termina al entrar en el salón del trono.

const CASTLE_LEVEL_WIDTH = 3200;
const CASTLE_LEVEL_HEIGHT = 540;
const CASTLE_GROUND_TOP = 476;
const FART_CLOUD_RANGE = 260;

class CastleScene extends Phaser.Scene {
  constructor() {
    super("CastleScene");
  }

  create() {
    if (this.registry.get("score") === undefined) this.registry.set("score", 0);
    if (this.registry.get("lives") === undefined) this.registry.set("lives", 3);
    this.isRoundOver = false;

    this.physics.world.setBounds(0, 0, CASTLE_LEVEL_WIDTH, CASTLE_LEVEL_HEIGHT);
    this.cameras.main.setBackgroundColor("#241a1f");
    this.cameras.main.setBounds(0, 0, CASTLE_LEVEL_WIDTH, CASTLE_LEVEL_HEIGHT);

    this.hazardZones = this.physics.add.staticGroup();

    this.createBackground();
    this.createPlatforms();
    this.createMovingPlatforms();
    this.createHazards();
    this.createSwitchDoors();
    this.createCoins();

    this.player = new Player(this, 80, CASTLE_GROUND_TOP - 60);
    applyUpgradesToPlayer(this.player, loadSaveData().upgrades);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);
    createCheckpoint(this, CASTLE_LEVEL_WIDTH / 2, CASTLE_GROUND_TOP);

    this.poopGroup = this.physics.add.group();
    this.bottleGroup = this.physics.add.group();
    this.pigeonDroppings = this.physics.add.group(); // sin uso aquí, compatibilidad
    this.fartClouds = this.physics.add.group();
    this.toiletPaperPickups = this.physics.add.group();
    this.stoneBalls = this.physics.add.group();

    this.createEnemies();
    this.createStoneBalls();
    this.createExit();

    this.physics.add.collider(this.groundEnemies, this.platforms);
    this.physics.add.collider(this.stoneBalls, this.platforms);
    this.physics.add.collider(this.toiletPaperPickups, this.platforms);
    this.physics.add.collider(this.bottleGroup, this.platforms, (bottle) => this.breakBottle(bottle), null, this);
    this.physics.add.collider(this.bottleGroup, this.movingPlatforms, (bottle) => this.breakBottle(bottle), null, this);
    this.physics.add.collider(this.fartClouds, this.platforms, (cloud) => cloud.destroy());

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.groundEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.airEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.hazardZones, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.stoneBalls, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.fartClouds, this.onFartCloudHitPlayer, null, this);
    this.physics.add.overlap(this.player, this.toiletPaperPickups, this.onCollectToiletPaper, null, this);
    this.physics.add.overlap(this.player, this.switches, this.onSwitchTouch, null, this);
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
    const statueXs = [200, 900, 1700, 2500, 3050];
    statueXs.forEach((x) => {
      this.add.image(x, CASTLE_GROUND_TOP + 10, "castleStatue").setOrigin(0.5, 1).setScrollFactor(0.5).setAlpha(0.8);
    });

    const bannerXs = [500, 1300, 2100, 2900];
    bannerXs.forEach((x) => {
      this.add.image(x, 60, "castleBanner").setScrollFactor(0.6).setOrigin(0.5, 0).setAlpha(0.9);
    });

    const torchXs = [350, 750, 1150, 1550, 1950, 2350, 2750, 3100];
    torchXs.forEach((x) => {
      const torch = this.add.image(x, CASTLE_GROUND_TOP - 20, "castleTorch").setDepth(1);
      this.tweens.add({ targets: torch, alpha: 0.6, scale: 1.1, duration: 400, yoyo: true, repeat: -1 });
    });
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    for (let x = 0; x <= CASTLE_LEVEL_WIDTH; x += 64) {
      this.platforms.create(x + 32, CASTLE_GROUND_TOP + 32, "castleFloor");
    }

    const floating = [
      [420, 420],
      [680, 350],
      [1600, 420],
      [1850, 340],
      [2400, 420],
      [2650, 350],
    ];
    floating.forEach(([x, y]) => this.platforms.create(x, y, "metalPlatform"));
    this.floatingPlatforms = floating;
  }

  createMovingPlatforms() {
    this.movingPlatforms = this.physics.add.group();

    const defs = [
      { x: 1050, y: 430, range: 130, duration: 1900 },
      { x: 2900, y: 420, range: 140, duration: 2100 },
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
    // Pinchos: peligro fijo a nivel de suelo.
    [560, 2000].forEach((x) => {
      this.add.image(x, CASTLE_GROUND_TOP - 8, "spikes").setDepth(1);
      const zone = this.hazardZones.create(x, CASTLE_GROUND_TOP - 8, "spikes");
      zone.setVisible(false);
      zone.body.setSize(36, 14);
    });

    // Chorros de agua: alternan encendido/apagado.
    [1400, 2550].forEach((x) => this.setupWaterJet(x, CASTLE_GROUND_TOP - 50));
  }

  setupWaterJet(x, y) {
    const jet = this.add.image(x, y, "waterJet").setDepth(1).setVisible(false);
    const zone = this.hazardZones.create(x, y, "waterJet");
    zone.setVisible(false);
    zone.body.enable = false;

    const toggle = () => {
      const on = !zone.body.enable;
      zone.body.enable = on;
      jet.setVisible(on);
      this.time.delayedCall(on ? 1200 : 1700, toggle);
    };
    this.time.delayedCall(1700, toggle);
  }

  createStoneBalls() {
    // Bolas de piedra: obstáculo que patrulla un tramo, no se puede derrotar.
    const defs = [
      { x: 900, range: 150 },
      { x: 2250, range: 160 },
    ];
    defs.forEach(({ x, range }) => {
      const ball = this.stoneBalls.create(x, CASTLE_GROUND_TOP - 14, "stoneBall");
      ball.setCollideWorldBounds(true);
      ball.setBounce(1, 0);
      ball.startX = x;
      ball.range = range;
      ball.speed = 80;
      ball.direction = 1;
      ball.setVelocityX(ball.speed);
    });
  }

  createSwitchDoors() {
    // Puertas con interruptores: cada interruptor abre su puerta más cercana.
    this.switches = this.physics.add.staticGroup();
    this.switchDoorPairs = [];

    const pairs = [
      { switchX: 1180, doorX: 1250 },
      { switchX: 2780, doorX: 2850 },
    ];

    pairs.forEach(({ switchX, doorX }) => {
      const sw = this.switches.create(switchX, CASTLE_GROUND_TOP - 20, "switchOff");
      sw.activated = false;
      const door = this.platforms.create(doorX, CASTLE_GROUND_TOP - 13, "timedDoorClosed");
      sw.pairedDoor = door;
    });
  }

  createCoins() {
    this.coins = this.physics.add.staticGroup();

    this.floatingPlatforms.forEach(([x, y]) => {
      this.coins.create(x, y - 26, "coin");
    });

    [220, 1050, 1950, 2500, 3050].forEach((x) => {
      this.coins.create(x, CASTLE_GROUND_TOP - 24, "coin");
    });
  }

  createEnemies() {
    this.groundEnemies = this.physics.add.group();
    this.airEnemies = this.physics.add.group();

    const guard = new ToiletGuard(this, 750, CASTLE_GROUND_TOP - 17, 90);
    this.groundEnemies.add(guard);

    const knight1 = new ToiletKnight(this, 1750, CASTLE_GROUND_TOP - 19, 90);
    const knight2 = new ToiletKnight(this, 2600, CASTLE_GROUND_TOP - 19, 90);
    this.groundEnemies.add(knight1);
    this.groundEnemies.add(knight2);

    const ghost = new Ghost(this, 1450, 330, 110);
    this.airEnemies.add(ghost);

    const wizard = new FartWizard(this, 2100, 380, 130);
    this.airEnemies.add(wizard);
  }

  createExit() {
    const exitX = 3120;
    this.add.image(exitX, CASTLE_GROUND_TOP - 27, "throneDoor").setDepth(1);

    const zone = this.add.zone(exitX, CASTLE_GROUND_TOP - 27, 60, 110);
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
      .text(this.scale.width / 2, 14, "NIVEL 5: CASTILLO DEL REY MALOLIENTE", style)
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
    this.updateStoneBalls();
    this.updateProjectiles();
    applyCoinMagnet(this);

    if (this.player.y > CASTLE_LEVEL_HEIGHT + 100) {
      this.onPlayerHit(this.player, null);
    }
  }

  updateStoneBalls() {
    this.stoneBalls.children.each((ball) => {
      if (ball.x <= ball.startX - ball.range) ball.direction = 1;
      else if (ball.x >= ball.startX + ball.range) ball.direction = -1;
      if (ball.body.blocked.left) ball.direction = 1;
      if (ball.body.blocked.right) ball.direction = -1;
      ball.setVelocityX(ball.speed * ball.direction);
    });
  }

  updateProjectiles() {
    this.poopGroup.children.each((poop) => {
      if (Math.abs(poop.x - poop.spawnX) > (poop.maxRange || POOP_RANGE)) {
        this.spawnPoopSplash(poop.x, poop.y);
        poop.destroy();
      }
    });

    this.bottleGroup.children.each((bottle) => {
      if (bottle.y > CASTLE_LEVEL_HEIGHT + 50 || bottle.x < -50 || bottle.x > CASTLE_LEVEL_WIDTH + 50) {
        bottle.destroy();
      }
    });

    this.fartClouds.children.each((cloud) => {
      if (Math.abs(cloud.x - cloud.spawnX) > FART_CLOUD_RANGE) cloud.destroy();
    });
  }

  onFartCloudHitPlayer(player, cloud) {
    cloud.destroy();
    this.onPlayerHit(player, null);
  }

  onCollectToiletPaper(player, pickup) {
    pickup.destroy();
    const lives = this.registry.get("lives");
    if (lives >= 3) return;
    const newLives = lives + 1;
    this.registry.set("lives", newLives);
    if (this.hearts[newLives - 1]) this.hearts[newLives - 1].setVisible(true);
    playGameSound(this, SOUND_KEYS.coin);
  }

  onSwitchTouch(player, sw) {
    if (sw.activated) return;
    sw.activated = true;
    sw.setTexture("switchOn");
    if (sw.pairedDoor) {
      sw.pairedDoor.body.enable = false;
      sw.pairedDoor.setAlpha(0.15);
    }
    playGameSound(this, SOUND_KEYS.coin);
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
      this.scene.start("GameOverScene", { score, currentScene: "CastleScene" });
    });
  }

  triggerLevelComplete() {
    this.isRoundOver = true;
    const score = this.registry.get("score");
    this.player.setVelocity(0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start("LevelCompleteScene", { score, currentScene: "CastleScene", nextScene: "FinalBossScene" });
    });
  }
}

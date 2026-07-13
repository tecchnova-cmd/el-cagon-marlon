// Nivel 4: Laboratorio. Científico loco, robot aspiradora, mutante de
// laboratorio, dron desodorante, láseres, plataformas eléctricas, puertas
// temporizadas, líquidos experimentales y dos interruptores que abren la
// salida (portal/ascensor hacia el Castillo del Rey Maloliente).

const LAB_LEVEL_WIDTH = 3000;
const LAB_LEVEL_HEIGHT = 540;
const LAB_GROUND_TOP = 476;
const TEST_TUBE_RANGE = 280;

class LaboratoryScene extends Phaser.Scene {
  constructor() {
    super("LaboratoryScene");
  }

  create() {
    if (this.registry.get("score") === undefined) this.registry.set("score", 0);
    if (this.registry.get("lives") === undefined) this.registry.set("lives", 3);
    this.isRoundOver = false;
    this.switchesActivated = 0;
    this.lockedMsgShowing = false;

    this.physics.world.setBounds(0, 0, LAB_LEVEL_WIDTH, LAB_LEVEL_HEIGHT);
    this.cameras.main.setBackgroundColor("#20242e");
    this.cameras.main.setBounds(0, 0, LAB_LEVEL_WIDTH, LAB_LEVEL_HEIGHT);

    this.hazardZones = this.physics.add.staticGroup();

    this.createBackground();
    this.createPlatforms();
    this.createHazards();
    this.createDoors();
    this.createSwitches();
    this.createCoins();

    this.player = new Player(this, 80, LAB_GROUND_TOP - 60);
    applyUpgradesToPlayer(this.player, loadSaveData());
    this.physics.add.collider(this.player, this.platforms);
    createCheckpoint(this, LAB_LEVEL_WIDTH / 2, LAB_GROUND_TOP);

    this.poopGroup = this.physics.add.group();
    this.bottleGroup = this.physics.add.group();
    this.pigeonDroppings = this.physics.add.group(); // sin uso aquí, compatibilidad
    this.testTubes = this.physics.add.group();
    this.slowClouds = this.physics.add.group();

    this.createEnemies();
    this.createExit();

    this.physics.add.collider(this.groundEnemies, this.platforms);
    this.physics.add.collider(this.bottleGroup, this.platforms, (bottle) => this.breakBottle(bottle), null, this);
    this.physics.add.collider(this.testTubes, this.platforms, (tube) => tube.destroy());

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.groundEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.airEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.hazardZones, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.testTubes, this.onTestTubeHitPlayer, null, this);
    this.physics.add.overlap(this.player, this.slowClouds, this.onSlowCloudHitPlayer, null, this);
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
    const panelXs = [150, 500, 900, 1300, 1700, 2100, 2500, 2850];
    panelXs.forEach((x) => {
      this.add.image(x, LAB_GROUND_TOP - 60, "labComputer").setScrollFactor(0.5).setAlpha(0.85);
    });
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    for (let x = 0; x <= LAB_LEVEL_WIDTH; x += 64) {
      this.platforms.create(x + 32, LAB_GROUND_TOP + 32, "labFloor");
    }

    const floating = [
      [400, 420],
      [650, 350],
      [1550, 420],
      [1800, 340],
      [2300, 420],
      [2600, 350],
    ];
    floating.forEach(([x, y]) => this.platforms.create(x, y, "metalPlatform"));
    this.floatingPlatforms = floating;

    // Plataformas eléctricas: alternan entre seguras y peligrosas.
    this.electricToggles = [];
    [[1050, 420], [2000, 340]].forEach(([x, y]) => this.setupElectricPlatform(x, y));
  }

  setupElectricPlatform(x, y) {
    const plat = this.platforms.create(x, y, "metalPlatform");
    const hazard = this.hazardZones.create(x, y - 6, "metalPlatform");
    hazard.setVisible(false);
    hazard.body.setSize(60, 8);
    hazard.body.enable = false;

    const toggle = () => {
      const charged = !hazard.body.enable;
      hazard.body.enable = charged;
      plat.setTint(charged ? 0xff6666 : 0xffffff);
      this.time.delayedCall(charged ? 1100 : 1900, toggle);
    };
    this.time.delayedCall(1900, toggle);
  }

  createHazards() {
    // Líquidos experimentales: peligro fijo a nivel de suelo.
    [750, 2450].forEach((x) => {
      this.add.image(x, LAB_GROUND_TOP - 5, "experimentalLiquid").setDepth(1);
      const zone = this.hazardZones.create(x, LAB_GROUND_TOP - 9, "experimentalLiquid");
      zone.setVisible(false);
      zone.body.setSize(50, 14);
    });

    // Rayos láser: alternan encendido/apagado.
    [1250, 2750].forEach((x) => this.setupLaser(x, LAB_GROUND_TOP - 60));
  }

  setupLaser(x, y) {
    const beam = this.add.image(x, y, "laserBeam").setDepth(1).setVisible(false);
    const zone = this.hazardZones.create(x, y, "laserBeam");
    zone.setVisible(false);
    zone.body.enable = false;

    const toggle = () => {
      const on = !zone.body.enable;
      zone.body.enable = on;
      beam.setVisible(on);
      this.time.delayedCall(on ? 1300 : 1600, toggle);
    };
    this.time.delayedCall(1600, toggle);
  }

  createDoors() {
    // Puertas temporizadas: bloquean el paso mientras están cerradas.
    this.doors = [];
    [1450, 2950].forEach((x) => {
      const door = this.platforms.create(x, LAB_GROUND_TOP - 13, "timedDoorClosed");
      let isOpen = false;
      const toggle = () => {
        isOpen = !isOpen;
        door.body.enable = !isOpen;
        door.setAlpha(isOpen ? 0.15 : 1);
        this.time.delayedCall(isOpen ? 1500 : 2500, toggle);
      };
      this.time.delayedCall(2500, toggle);
      this.doors.push(door);
    });
  }

  createSwitches() {
    this.switches = this.physics.add.staticGroup();
    [950, 2150].forEach((x) => {
      const sw = this.switches.create(x, LAB_GROUND_TOP - 20, "switchOff");
      sw.activated = false;
    });
  }

  createCoins() {
    this.coins = this.physics.add.staticGroup();

    this.floatingPlatforms.forEach(([x, y]) => {
      this.coins.create(x, y - 26, "coin");
    });

    [220, 1150, 1950, 2600].forEach((x) => {
      this.coins.create(x, LAB_GROUND_TOP - 24, "coin");
    });
  }

  createEnemies() {
    this.groundEnemies = this.physics.add.group();
    this.airEnemies = this.physics.add.group();

    const scientist = new MadScientist(this, 700, LAB_GROUND_TOP - 21, 90);
    this.groundEnemies.add(scientist);

    const vacuum = new RobotVacuum(this, 1600, LAB_GROUND_TOP - 12, 90);
    this.groundEnemies.add(vacuum);

    const mutant = new LabMutant(this, 2350, LAB_GROUND_TOP - 18, 100);
    this.groundEnemies.add(mutant);

    const drone = new DeodorantDrone(this, 1300, 320, 100);
    this.airEnemies.add(drone);
  }

  createExit() {
    const exitX = 2950;
    this.add.image(exitX, LAB_GROUND_TOP - 50, "labPortal").setDepth(1);

    const zone = this.add.zone(exitX, LAB_GROUND_TOP - 50, 60, 100);
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
      .text(this.scale.width / 2, 14, "NIVEL 4: LABORATORIO", style)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10);

    this.switchText = this.add
      .text(this.scale.width / 2, 42, "Interruptores: 0/2", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "16px",
        color: "#ffd93d",
        stroke: "#2b2b52",
        strokeThickness: 3,
      })
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
    this.wasd = this.input.keyboard.addKeys("W,A,D,SPACE,Z,X,F");
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
    if (Phaser.Input.Keyboard.JustDown(this.wasd.F)) {
      this.player.fart();
    }

    this.groundEnemies.children.each((enemy) => enemy.update());
    this.airEnemies.children.each((enemy) => enemy.update());
    this.updateProjectiles();
    applyCoinMagnet(this);

    if (this.player.y > LAB_LEVEL_HEIGHT + 100) {
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
      if (bottle.y > LAB_LEVEL_HEIGHT + 50 || bottle.x < -50 || bottle.x > LAB_LEVEL_WIDTH + 50) {
        bottle.destroy();
      }
    });

    this.testTubes.children.each((tube) => {
      if (Math.abs(tube.x - tube.spawnX) > TEST_TUBE_RANGE) tube.destroy();
    });

    this.slowClouds.children.each((cloud) => {
      if (cloud.x < -50 || cloud.x > LAB_LEVEL_WIDTH + 50) cloud.destroy();
    });
  }

  onTestTubeHitPlayer(player, tube) {
    tube.destroy();
    this.onPlayerHit(player, null);
  }

  onSlowCloudHitPlayer(player, cloud) {
    cloud.destroy();
    player.applySlow(2000, 0.5);
  }

  onSwitchTouch(player, sw) {
    if (sw.activated) return;
    sw.activated = true;
    sw.setTexture("switchOn");
    this.switchesActivated += 1;
    this.switchText.setText("Interruptores: " + this.switchesActivated + "/2");
    playGameSound(this, SOUND_KEYS.coin);
  }

  showLockedMessage() {
    if (this.lockedMsgShowing) return;
    this.lockedMsgShowing = true;
    const msg = this.add
      .text(this.player.x, this.player.y - 60, "Activa los 2 interruptores", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#2b2b52",
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: msg.y - 20,
      duration: 1500,
      onComplete: () => {
        msg.destroy();
        this.lockedMsgShowing = false;
      },
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
    if (enemy.immuneToPoop) return; // el robot aspiradora absorbe la caca sin daño
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
    if (this.switchesActivated < 2) {
      this.showLockedMessage();
      return;
    }
    this.triggerLevelComplete();
  }

  triggerGameOver() {
    this.isRoundOver = true;
    playGameSound(this, SOUND_KEYS.gameOver);
    const score = this.registry.get("score");
    this.time.delayedCall(300, () => {
      this.scene.start("GameOverScene", { score, currentScene: "LaboratoryScene" });
    });
  }

  triggerLevelComplete() {
    this.isRoundOver = true;
    const score = this.registry.get("score");
    this.player.setVelocity(0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start("LevelCompleteScene", { score, currentScene: "LaboratoryScene", nextScene: "CastleScene" });
    });
  }
}

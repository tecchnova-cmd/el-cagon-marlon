// Nivel 1: Ciudad. Calles, basureros, palomas bombarderas, ratas callejeras
// y el perro del basurero. La salida es una alcantarilla abierta.

const LEVEL_WIDTH = 3000;
const LEVEL_HEIGHT = 540;
const GROUND_TOP = 476;

class CityScene extends Phaser.Scene {
  constructor() {
    super("CityScene");
  }

  create() {
    // Estado de partida: cada inicio de nivel es una partida nueva.
    if (this.registry.get("score") === undefined) this.registry.set("score", 0);
    if (this.registry.get("lives") === undefined) this.registry.set("lives", 3);
    this.isRoundOver = false;

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
    this.cameras.main.setBackgroundColor("#6d8cad");
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);

    this.createBackground();
    this.createPlatforms();
    this.createObstacles();
    this.createCoins();

    this.player = new Player(this, 80, GROUND_TOP - 60);
    applyUpgradesToPlayer(this.player, loadSaveData().upgrades);
    this.physics.add.collider(this.player, this.platforms);
    createCheckpoint(this, LEVEL_WIDTH / 2, GROUND_TOP);

    this.poopGroup = this.physics.add.group();
    this.bottleGroup = this.physics.add.group();
    this.pigeonDroppings = this.physics.add.group();

    this.createEnemies();
    this.createExit();

    // Colisiones y solapamientos
    this.physics.add.collider(this.groundEnemies, this.platforms);
    this.physics.add.collider(this.bottleGroup, this.platforms, (bottle) => this.breakBottle(bottle), null, this);
    this.physics.add.collider(this.pigeonDroppings, this.platforms, (stain) => stain.destroy());

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.groundEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.airEnemies, this.onPlayerHit, null, this);
    this.physics.add.overlap(this.player, this.pigeonDroppings, this.onDroppingHitPlayer, null, this);
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
    // Edificios en parallax (más lento que el jugador, da sensación de profundidad)
    const buildingXs = [50, 260, 470, 690, 910, 1140, 1370, 1600, 1830, 2060, 2290, 2520, 2750, 2960];
    buildingXs.forEach((x, i) => {
      const scale = 0.9 + (i % 3) * 0.2;
      this.add
        .image(x, GROUND_TOP + 10, "building")
        .setOrigin(0.5, 1)
        .setScrollFactor(0.5)
        .setScale(1, scale)
        .setAlpha(0.85);
    });

    for (let x = 150; x < LEVEL_WIDTH; x += 600) {
      this.add.image(x, 60, "bgCloud").setScrollFactor(0.3).setAlpha(0.8).setScale(1.1);
    }
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    // Calle continua
    for (let x = 0; x <= LEVEL_WIDTH; x += 64) {
      this.platforms.create(x + 32, GROUND_TOP + 32, "pavement");
    }

    // Plataformas flotantes (obstáculos elevados que exigen saltar)
    const floating = [
      [380, 430],
      [600, 370],
      [820, 430],
      [1020, 300],
      [1250, 430],
      [1450, 360],
      [1680, 430],
      [1900, 300],
      [2120, 370],
      [2350, 430],
      [2580, 300],
      [2800, 400],
    ];
    floating.forEach(([x, y]) => this.platforms.create(x, y, "platform"));

    this.floatingPlatforms = floating;
  }

  createObstacles() {
    // Basureros, cajas y señales caídas: obstáculos sólidos a nivel de calle
    // (se añaden a "platforms" para reusar toda la colisión ya existente).
    // Se posicionan por su base, apoyados justo sobre la línea de la calle (GROUND_TOP).
    const trashCans = [500, 1550, 2650];
    trashCans.forEach((x) => this.platforms.create(x, GROUND_TOP - 15, "trashCan"));

    const crates = [980, 2000];
    crates.forEach((x) => this.platforms.create(x, GROUND_TOP - 12, "crate"));

    const signs = [1350, 2450];
    signs.forEach((x) => this.platforms.create(x, GROUND_TOP - 8, "fallenSign"));

    // Charcos: solo decorativos, no bloquean el paso, pintados sobre la calle.
    [300, 1150, 1900, 2550].forEach((x) => {
      this.add.image(x, GROUND_TOP - 4, "puddle").setDepth(1);
    });
  }

  createCoins() {
    this.coins = this.physics.add.staticGroup();

    this.floatingPlatforms.forEach(([x, y]) => {
      this.coins.create(x, y - 26, "coin");
    });

    [200, 710, 1140, 1560, 2000, 2460, 2850].forEach((x) => {
      this.coins.create(x, GROUND_TOP - 24, "coin");
    });
  }

  createEnemies() {
    this.groundEnemies = this.physics.add.group();
    this.airEnemies = this.physics.add.group();

    const rat1 = new Rat(this, 760, GROUND_TOP - 8, 100);
    const rat2 = new Rat(this, 2250, GROUND_TOP - 8, 110);
    this.groundEnemies.add(rat1);
    this.groundEnemies.add(rat2);

    const trashDog = new TrashDog(this, 1720, GROUND_TOP - 8, 120);
    this.groundEnemies.add(trashDog);

    const pigeon1 = new Pigeon(this, 1050, 320, 100);
    const pigeon2 = new Pigeon(this, 2550, 300, 120);
    this.airEnemies.add(pigeon1);
    this.airEnemies.add(pigeon2);
  }

  createExit() {
    const exitX = 2900;
    this.add.image(exitX, GROUND_TOP + 4, "manhole").setDepth(1);

    const zone = this.add.zone(exitX, GROUND_TOP - 10, 60, 60);
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

    this.scoreText = this.add
      .text(16, 14, "Puntos: 0", style)
      .setScrollFactor(0)
      .setDepth(10);

    this.levelText = this.add
      .text(this.scale.width / 2, 14, "NIVEL 1: CIUDAD", style)
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

    // El jugador no puede caer del mundo (por si acaso).
    if (this.player.y > LEVEL_HEIGHT + 100) {
      this.onPlayerHit(this.player, null);
    }
  }

  updateProjectiles() {
    // La caca desaparece al superar su alcance máximo (evita acumular objetos).
    this.poopGroup.children.each((poop) => {
      if (Math.abs(poop.x - poop.spawnX) > (poop.maxRange || POOP_RANGE)) {
        this.spawnPoopSplash(poop.x, poop.y);
        poop.destroy();
      }
    });

    // Red de seguridad: si una botella o mancha sale del nivel sin tocar nada, se limpia.
    this.bottleGroup.children.each((bottle) => {
      if (bottle.y > LEVEL_HEIGHT + 50 || bottle.x < -50 || bottle.x > LEVEL_WIDTH + 50) {
        bottle.destroy();
      }
    });
    this.pigeonDroppings.children.each((stain) => {
      if (stain.y > LEVEL_HEIGHT + 50) stain.destroy();
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

  onDroppingHitPlayer(player, stain) {
    stain.destroy();
    this.onPlayerHit(player, null);
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
      this.scene.start("GameOverScene", { score, currentScene: "CityScene" });
    });
  }

  triggerLevelComplete() {
    this.isRoundOver = true;
    const score = this.registry.get("score");
    this.player.setVelocity(0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start("LevelCompleteScene", { score, currentScene: "CityScene", nextScene: "SewerScene" });
    });
  }
}

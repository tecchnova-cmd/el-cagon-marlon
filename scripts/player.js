// Marlon: movimiento, salto y los dos ataques (caca y botella).

const POOP_SPEED = 380;
const POOP_RANGE = 260; // distancia máxima antes de desaparecer
const POOP_COOLDOWN = 400; // ms, evita spam

const BOTTLE_SPEED_X = 260;
const BOTTLE_LAUNCH_Y = 380; // impulso vertical inicial (trayectoria en arco)
const BOTTLE_COOLDOWN = 550;

const FART_COOLDOWN = 900; // ms, evita spam del humo verde

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "playerBody");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(28, 50);
    this.setOffset(6, 4);
    this.setMaxVelocity(220, 900);

    // Cara real (foto) superpuesta sobre el cuerpo dibujado.
    this.face = scene.add.image(x, y + PLAYER_HEAD_OFFSET_Y, getPlayerFaceKey(scene));
    this.face.setDisplaySize(PLAYER_HEAD_DIAMETER, PLAYER_HEAD_DIAMETER);

    this.speed = 190;
    this.jumpSpeed = 430;
    this.facing = 1; // 1 = derecha, -1 = izquierda

    this.lastPoopTime = -Infinity;
    this.lastBottleTime = -Infinity;
    this.lastFartTime = -Infinity;

    this.bottles = 3;
    this.maxBottles = 8;

    this.isInvulnerable = false;
    this.wasOnGround = true;

    this.speedMultiplier = 1; // reducido temporalmente por la nube del dron desodorante
    this.slowTimer = null;

    // Multiplicadores de mejoras (ver upgradeSystem.js applyUpgradesToPlayer).
    this.throwSpeedMultiplier = 1;
    this.poopRangeMultiplier = 1;
    this.jumpHeightMultiplier = 1;
    this.coinMagnetLevel = 0;
  }

  applySlow(durationMs = 2000, factor = 0.5) {
    this.speedMultiplier = factor;
    if (this.slowTimer) this.slowTimer.remove();
    this.slowTimer = this.scene.time.delayedCall(durationMs, () => {
      this.speedMultiplier = 1;
    });
  }

  spawnDust() {
    const dust = this.scene.add.sprite(this.x, this.y + 24, "dust").setScale(0.8);
    this.scene.tweens.add({
      targets: dust,
      scaleX: 1.6,
      scaleY: 1.2,
      alpha: 0,
      duration: 300,
      onComplete: () => dust.destroy(),
    });
  }

  handleMovement(cursors, keys) {
    const left = cursors.left.isDown || keys.A.isDown;
    const right = cursors.right.isDown || keys.D.isDown;
    const jump = cursors.up.isDown || keys.W.isDown || keys.SPACE.isDown;

    const effectiveSpeed = this.speed * this.speedMultiplier;

    if (left) {
      this.setVelocityX(-effectiveSpeed);
      this.facing = -1;
      this.setFlipX(true);
    } else if (right) {
      this.setVelocityX(effectiveSpeed);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    const onGround = this.body.blocked.down || this.body.touching.down;

    if (jump && onGround) {
      this.setVelocityY(-this.jumpSpeed * this.jumpHeightMultiplier);
      this.spawnDust();
      playGameSound(this.scene, SOUND_KEYS.jump);
    }

    // Aterrizaje: acaba de tocar el suelo tras estar en el aire.
    if (onGround && !this.wasOnGround) {
      this.spawnDust();
    }
    this.wasOnGround = onGround;

    // Pequeño balanceo mientras camina (sensación de "caminar" sin sprites extra).
    if ((left || right) && onGround) {
      this.setScale(1, 1 + Math.sin(this.scene.time.now / 60) * 0.03);
    } else {
      this.setScale(1, 1);
    }

    // La cara acompaña al cuerpo (misma posición y orientación).
    this.face.setPosition(this.x, this.y + PLAYER_HEAD_OFFSET_Y);
    this.face.setFlipX(this.flipX);
  }

  canThrowPoop() {
    return this.scene.time.now - this.lastPoopTime >= POOP_COOLDOWN;
  }

  throwPoop(poopGroup) {
    if (!this.canThrowPoop()) return;
    this.lastPoopTime = this.scene.time.now;

    const offsetX = this.facing * 16;
    const poop = poopGroup.create(this.x + offsetX, this.y - 4, "poop");
    poop.body.allowGravity = false;
    poop.setVelocityX(this.facing * POOP_SPEED * this.throwSpeedMultiplier);
    poop.setFlipX(this.facing === -1);
    poop.spawnX = poop.x;
    poop.maxRange = POOP_RANGE * this.poopRangeMultiplier;

    playGameSound(this.scene, SOUND_KEYS.poop);
  }

  canThrowBottle() {
    return this.scene.time.now - this.lastBottleTime >= BOTTLE_COOLDOWN;
  }

  throwBottle(bottleGroup) {
    if (this.bottles <= 0 || !this.canThrowBottle()) return;
    this.lastBottleTime = this.scene.time.now;
    this.bottles -= 1;

    const offsetX = this.facing * 16;
    const bottle = bottleGroup.create(this.x + offsetX, this.y - 8, "bottle");
    bottle.body.allowGravity = true;
    bottle.setVelocity(this.facing * BOTTLE_SPEED_X * this.throwSpeedMultiplier, -BOTTLE_LAUNCH_Y);
    bottle.setAngularVelocity(this.facing * 320);

    playGameSound(this.scene, SOUND_KEYS.bottle);
  }

  canFart() {
    return this.scene.time.now - this.lastFartTime >= FART_COOLDOWN;
  }

  // Habilidad puramente cómica: humo verde saliendo de detrás de Marlon.
  // No hace daño ni afecta el gameplay, solo diversión.
  fart() {
    if (!this.canFart()) return;
    this.lastFartTime = this.scene.time.now;

    const offsetX = -this.facing * 14; // sale por detrás, no por delante
    spawnFartCloud(this.scene, this.x + offsetX, this.y + 16);
    playGameSound(this.scene, SOUND_KEYS.fart);
  }

  addBottles(amount) {
    this.bottles = Math.min(this.maxBottles, this.bottles + amount);
  }

  takeHit(knockbackDir) {
    if (this.isInvulnerable) return;
    this.isInvulnerable = true;

    this.setVelocity(knockbackDir * 220, -300);

    this.scene.tweens.add({
      targets: [this, this.face],
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.alpha = 1;
        this.face.alpha = 1;
        this.isInvulnerable = false;
      },
    });
  }
}

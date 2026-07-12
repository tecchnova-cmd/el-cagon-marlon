// Enemigos. Todos comparten vida/daño/derrota a través de la clase base
// Enemy; cada uno añade su propio patrón de movimiento en update().

class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, { hp = 1, points = 50 } = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = hp;
    this.points = points;
  }

  // Devuelve true si el golpe lo derrota, false si sobrevive (y solo parpadea).
  takeDamage(amount = 1) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.defeat();
      return true;
    }
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 1,
    });
    return false;
  }

  defeat() {
    spawnPoof(this.scene, this.x, this.y, 0.4);
    playGameSound(this.scene, SOUND_KEYS.enemyDown);
    this.destroy();
  }
}

// ---------- RATA CALLEJERA ----------
class Rat extends Enemy {
  constructor(scene, x, y, range = 90) {
    super(scene, x, y, "rat", { hp: 1, points: 50 });

    this.setCollideWorldBounds(true);
    this.setBounce(1, 0);
    this.setSize(30, 16);

    this.startX = x;
    this.range = range;
    this.speed = 60;
    this.direction = 1;
    this.setVelocityX(this.speed);
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;
    if (this.body.blocked.left) this.direction = 1;
    if (this.body.blocked.right) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);
  }
}

// ---------- MOSQUITO GIGANTE (alcantarillas) ----------
// canDive=true hace que se lance rápidamente hacia Marlon cuando está cerca.
class Mosquito extends Enemy {
  constructor(scene, x, y, range = 80, canDive = false) {
    super(scene, x, y, "mosquito", { hp: 1, points: 50 });

    this.body.allowGravity = false;
    this.setSize(34, 20);

    this.startX = x;
    this.startY = y;
    this.range = range;
    this.speed = 90;
    this.direction = 1;
    this.setVelocityX(this.speed);

    this.canDive = canDive;
    this.diveSpeed = 220;
    this.diveRange = 140;
    this.diveCooldown = 3000;
    this.lastDiveTime = -Infinity;
    this.diving = false;
    this.diveEndTime = 0;
    this.diveDirX = 1;

    // Vuelo ondulado: un tween mueve la altura, la física solo controla X.
    this.flightTween = this.scene.tweens.add({
      targets: this,
      y: y + 18,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  update() {
    const player = this.scene.player;

    if (this.canDive && !this.diving && player) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.diveRange && this.scene.time.now - this.lastDiveTime >= this.diveCooldown) {
        this.diving = true;
        this.lastDiveTime = this.scene.time.now;
        this.diveEndTime = this.scene.time.now + 500;
        this.diveDirX = dx < 0 ? -1 : 1;
      }
    }

    if (this.diving) {
      this.setVelocityX(this.diveDirX * this.diveSpeed);
      if (this.scene.time.now >= this.diveEndTime) this.diving = false;
    } else {
      if (this.x <= this.startX - this.range) this.direction = 1;
      else if (this.x >= this.startX + this.range) this.direction = -1;
      this.setVelocityX(this.speed * this.direction);
    }

    this.setFlipX(this.body.velocity.x < 0);
    this.body.updateFromGameObject();
  }

  defeat() {
    if (this.flightTween) this.flightTween.stop();
    super.defeat();
  }
}

// ---------- PALOMA BOMBARDERA ----------
class Pigeon extends Enemy {
  constructor(scene, x, y, range = 100) {
    super(scene, x, y, "pigeon", { hp: 1, points: 50 });

    this.body.allowGravity = false;
    this.setSize(26, 16);

    this.startX = x;
    this.startY = y;
    this.range = range;
    this.speed = 70;
    this.direction = 1;
    this.setVelocityX(this.speed);

    this.dropInterval = 2500;
    this.lastDropTime = scene.time.now + Phaser.Math.Between(500, 2000);

    this.flightTween = scene.tweens.add({
      targets: this,
      y: y + 14,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);
    this.body.updateFromGameObject();

    if (this.scene.time.now - this.lastDropTime >= this.dropInterval) {
      this.lastDropTime = this.scene.time.now;
      this.dropStain();
    }
  }

  dropStain() {
    if (!this.scene.pigeonDroppings) return;
    const stain = this.scene.pigeonDroppings.create(this.x, this.y + 12, "stain");
    stain.body.allowGravity = false;
    stain.setVelocityY(160);
  }

  defeat() {
    if (this.flightTween) this.flightTween.stop();
    super.defeat();
  }
}

// ---------- PERRO DEL BASURERO ----------
class TrashDog extends Enemy {
  constructor(scene, x, y, range = 110) {
    super(scene, x, y, "trashDog", { hp: 2, points: 100 });

    this.setCollideWorldBounds(true);
    this.setSize(34, 20);

    this.startX = x;
    this.range = range;
    this.walkSpeed = 50;
    this.chargeSpeed = 180;
    this.detectRange = 180;
    this.direction = 1;
    this.setVelocityX(this.walkSpeed);
  }

  update() {
    const player = this.scene.player;
    const sameGroundLevel = player && Math.abs(player.y - this.y) < 60;
    const distanceToPlayer = player ? Math.abs(player.x - this.x) : Infinity;
    const chasing = sameGroundLevel && distanceToPlayer < this.detectRange;

    let speed = this.walkSpeed;
    if (chasing) {
      speed = this.chargeSpeed;
      this.direction = player.x < this.x ? -1 : 1;
    } else {
      if (this.x <= this.startX - this.range) this.direction = 1;
      else if (this.x >= this.startX + this.range) this.direction = -1;
      if (this.body.blocked.left) this.direction = 1;
      if (this.body.blocked.right) this.direction = -1;
    }

    this.setVelocityX(speed * this.direction);
    this.setFlipX(this.direction < 0);
  }
}

// ---------- RATA MUTANTE (alcantarillas) ----------
class RatMutant extends Enemy {
  constructor(scene, x, y, range = 90) {
    super(scene, x, y, "ratMutant", { hp: 2, points: 100 });

    this.setCollideWorldBounds(true);
    this.setBounce(1, 0);
    this.setSize(40, 22);

    this.startX = x;
    this.range = range;
    this.speed = 70;
    this.direction = 1;
    this.setVelocityX(this.speed);

    this.hopInterval = 1800;
    this.lastHopTime = scene.time.now + Phaser.Math.Between(0, 1000);
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;
    if (this.body.blocked.left) this.direction = 1;
    if (this.body.blocked.right) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);

    // Salta pequeños obstáculos periódicamente mientras patrulla.
    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround && this.scene.time.now - this.lastHopTime >= this.hopInterval) {
      this.lastHopTime = this.scene.time.now;
      this.setVelocityY(-220);
    }
  }
}

// ---------- BABA TÓXICA (alcantarillas) ----------
class ToxicSlime extends Enemy {
  constructor(scene, x, y, range = 60) {
    super(scene, x, y, "toxicSlime", { hp: 2, points: 100 });

    this.setCollideWorldBounds(true);
    this.setBounce(1, 0);
    this.setSize(26, 14);

    this.startX = x;
    this.range = range;
    this.speed = 24;
    this.direction = 1;
    this.setVelocityX(this.speed);
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;
    if (this.body.blocked.left) this.direction = 1;
    if (this.body.blocked.right) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
  }

  takeDamage(amount = 1) {
    const defeated = super.takeDamage(amount);
    if (!defeated) {
      // Se "divide" visualmente al recibir daño (solo partículas, sin crear enemigos nuevos).
      spawnPoof(this.scene, this.x - 6, this.y, 0.2);
      spawnPoof(this.scene, this.x + 6, this.y, 0.2);
    }
    return defeated;
  }
}

// ---------- HONGO SALTARÍN (bosque tóxico) ----------
class HoppingMushroom extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "hoppingMushroom", { hp: 1, points: 50 });

    this.setCollideWorldBounds(true);
    this.setSize(22, 20);

    this.hopInterval = 1600;
    this.lastHopTime = scene.time.now + Phaser.Math.Between(0, 800);
  }

  update() {
    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround && this.scene.time.now - this.lastHopTime >= this.hopInterval) {
      this.lastHopTime = this.scene.time.now;
      this.setVelocityY(-260);
      this.setVelocityX(Phaser.Math.Between(-40, 40));
      this.releaseCloud();
    }
  }

  releaseCloud() {
    if (!this.scene.toxicClouds) return;
    const cloud = this.scene.toxicClouds.create(this.x, this.y + 8, "toxicCloud");
    cloud.body.allowGravity = false;
    cloud.setImmovable(true);
    this.scene.tweens.add({
      targets: cloud,
      scale: 1.4,
      alpha: 0,
      duration: 1200,
      onComplete: () => cloud.destroy(),
    });
  }
}

// ---------- MOSCA MUTANTE (bosque tóxico) ----------
class MutantFly extends Enemy {
  constructor(scene, x, y, range = 90) {
    super(scene, x, y, "mutantFly", { hp: 1, points: 50 });

    this.body.allowGravity = false;
    this.setSize(20, 16);

    this.startX = x;
    this.startY = y;
    this.range = range;
    this.patrolSpeed = 55;
    this.chaseSpeed = 130;
    this.detectRange = 150;
    this.chaseDuration = 3000;
    this.isChasing = false;
    this.chaseEndTime = 0;
    this.direction = 1;
    this.setVelocityX(this.patrolSpeed);

    this.flightTween = scene.tweens.add({
      targets: this,
      y: y + 10,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  update() {
    const player = this.scene.player;
    const now = this.scene.time.now;

    if (player && !this.isChasing) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < this.detectRange) {
        this.isChasing = true;
        this.chaseEndTime = now + this.chaseDuration;
        if (this.flightTween) this.flightTween.pause();
      }
    }

    if (this.isChasing) {
      if (!player || now >= this.chaseEndTime) {
        this.isChasing = false;
        if (this.flightTween) this.flightTween.resume();
      } else {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        this.setVelocity((dx / dist) * this.chaseSpeed, (dy / dist) * this.chaseSpeed);
        this.setFlipX(dx < 0);
        this.body.updateFromGameObject();
        return;
      }
    }

    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;
    this.setVelocityX(this.patrolSpeed * this.direction);
    this.setFlipX(this.direction < 0);
    this.body.updateFromGameObject();
  }

  defeat() {
    if (this.flightTween) this.flightTween.stop();
    super.defeat();
  }
}

// ---------- PLANTA CARNÍVORA (bosque tóxico) ----------
// Fija; solo puede hacer daño cuando Marlon se acerca (overlap normal), y
// muestra un pequeño mordisco visual cuando lo detecta cerca.
class CarnivorousPlant extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "carnivorousPlant", { hp: 2, points: 100 });

    this.body.allowGravity = false;
    this.setImmovable(true);
    this.setSize(24, 30);

    this.biteInterval = 1400;
    this.lastBiteTime = scene.time.now + Phaser.Math.Between(0, 700);
  }

  update() {
    // Los grupos de física de Phaser pueden reaplicar sus valores por defecto
    // a los miembros añadidos con group.add(); se reafirman aquí cada frame
    // para garantizar que la planta se quede quieta y fija en su sitio.
    this.body.allowGravity = false;
    this.body.immovable = true;
    this.setVelocity(0, 0);

    const player = this.scene.player;
    if (!player) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist < 70 && this.scene.time.now - this.lastBiteTime >= this.biteInterval) {
      this.lastBiteTime = this.scene.time.now;
      this.scene.tweens.add({ targets: this, scaleX: 1.25, scaleY: 0.85, duration: 120, yoyo: true });
    }
  }
}

// ---------- JABALÍ APESTOSO (bosque tóxico) ----------
class StinkyBoar extends Enemy {
  constructor(scene, x, y, range = 140) {
    super(scene, x, y, "stinkyBoar", { hp: 3, points: 100 });

    this.setCollideWorldBounds(true);
    this.setBounce(1, 0);
    this.setSize(36, 20);

    this.startX = x;
    this.range = range;
    this.walkSpeed = 45;
    this.chargeSpeed = 220;
    this.detectRange = 160;
    this.direction = 1;
    this.setVelocityX(this.walkSpeed);
  }

  update() {
    const player = this.scene.player;
    const sameGroundLevel = player && Math.abs(player.y - this.y) < 60;
    const distanceToPlayer = player ? Math.abs(player.x - this.x) : Infinity;
    const charging = sameGroundLevel && distanceToPlayer < this.detectRange;

    let speed = this.walkSpeed;
    if (charging) {
      speed = this.chargeSpeed;
      this.direction = player.x < this.x ? -1 : 1;
    } else {
      if (this.x <= this.startX - this.range) this.direction = 1;
      else if (this.x >= this.startX + this.range) this.direction = -1;
      if (this.body.blocked.left) this.direction = 1;
      if (this.body.blocked.right) this.direction = -1;
    }

    this.setVelocityX(speed * this.direction);
    this.setFlipX(this.direction < 0);
  }
}

// ---------- CIENTÍFICO LOCO (laboratorio) ----------
// Lanza tubos de ensayo y retrocede cuando Marlon se acerca demasiado.
class MadScientist extends Enemy {
  constructor(scene, x, y, range = 80) {
    super(scene, x, y, "madScientist", { hp: 2, points: 100 });

    this.setCollideWorldBounds(true);
    this.setSize(22, 34);

    this.startX = x;
    this.range = range;
    this.retreatSpeed = 70;
    this.detectRange = 140;
    this.throwRange = 260;
    this.throwInterval = 1800;
    this.lastThrowTime = scene.time.now + Phaser.Math.Between(0, 900);
  }

  update() {
    const player = this.scene.player;
    if (!player) {
      this.setVelocityX(0);
      return;
    }

    const dx = this.x - player.x;
    const dist = Math.abs(dx);

    if (dist < this.detectRange) {
      const awayDir = dx < 0 ? -1 : 1;
      let vx = awayDir * this.retreatSpeed;
      if (this.x <= this.startX - this.range && vx < 0) vx = 0;
      if (this.x >= this.startX + this.range && vx > 0) vx = 0;
      this.setVelocityX(vx);
      if (vx !== 0) this.setFlipX(vx > 0);
    } else {
      this.setVelocityX(0);
    }

    if (dist < this.throwRange && this.scene.time.now - this.lastThrowTime >= this.throwInterval) {
      this.lastThrowTime = this.scene.time.now;
      this.throwTestTube(player);
    }
  }

  throwTestTube(player) {
    if (!this.scene.testTubes) return;
    const dir = player.x < this.x ? -1 : 1;
    const tube = this.scene.testTubes.create(this.x, this.y - 4, "testTube");
    tube.body.allowGravity = false;
    tube.setVelocityX(dir * 220);
    tube.spawnX = tube.x;
  }
}

// ---------- ROBOT ASPIRADORA (laboratorio) ----------
// Absorbe (ignora) los ataques de caca; solo las botellas le hacen daño de verdad.
class RobotVacuum extends Enemy {
  constructor(scene, x, y, range = 100) {
    super(scene, x, y, "robotVacuum", { hp: 3, points: 100 });

    this.immuneToPoop = true;

    this.setCollideWorldBounds(true);
    this.setBounce(1, 0);
    this.setSize(30, 20);

    this.startX = x;
    this.range = range;
    this.speed = 45;
    this.direction = 1;
    this.setVelocityX(this.speed);
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;
    if (this.body.blocked.left) this.direction = 1;
    if (this.body.blocked.right) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
  }
}

// ---------- MUTANTE DE LABORATORIO ----------
class LabMutant extends Enemy {
  constructor(scene, x, y, range = 100) {
    super(scene, x, y, "labMutant", { hp: 3, points: 100 });

    this.setCollideWorldBounds(true);
    this.setSize(26, 34);

    this.startX = x;
    this.range = range;
    this.speed = 85;
    this.direction = 1;
    this.setVelocityX(this.speed);

    this.hopInterval = 1400;
    this.lastHopTime = scene.time.now + Phaser.Math.Between(0, 700);
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;
    if (this.body.blocked.left) this.direction = 1;
    if (this.body.blocked.right) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround && this.scene.time.now - this.lastHopTime >= this.hopInterval) {
      this.lastHopTime = this.scene.time.now;
      this.setVelocityY(-300);
    }
  }
}

// ---------- DRON DESODORANTE (laboratorio) ----------
// Dispara nubes azules que ralentizan a Marlon (no le quitan vida).
class DeodorantDrone extends Enemy {
  constructor(scene, x, y, range = 100) {
    super(scene, x, y, "deodorantDrone", { hp: 2, points: 100 });

    this.body.allowGravity = false;
    this.setSize(24, 18);

    this.startX = x;
    this.startY = y;
    this.range = range;
    this.speed = 60;
    this.direction = 1;
    this.setVelocityX(this.speed);

    this.shootInterval = 2200;
    this.lastShotTime = scene.time.now + Phaser.Math.Between(0, 1000);

    this.flightTween = scene.tweens.add({
      targets: this,
      y: y + 16,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);
    this.body.updateFromGameObject();

    if (this.scene.time.now - this.lastShotTime >= this.shootInterval) {
      this.lastShotTime = this.scene.time.now;
      this.shootCloud();
    }
  }

  shootCloud() {
    if (!this.scene.slowClouds) return;
    const player = this.scene.player;
    const dir = player && player.x < this.x ? -1 : 1;
    const cloud = this.scene.slowClouds.create(this.x, this.y + 6, "slowCloud");
    cloud.body.allowGravity = false;
    cloud.setVelocityX(dir * 140);
  }

  defeat() {
    if (this.flightTween) this.flightTween.stop();
    super.defeat();
  }
}

// ---------- GUARDIA DEL RETRETE (castillo) ----------
// Solo recibe daño cuando baja el escudo (se alterna con el tiempo).
class ToiletGuard extends Enemy {
  constructor(scene, x, y, range = 60) {
    super(scene, x, y, "toiletGuard", { hp: 3, points: 100 });

    this.setCollideWorldBounds(true);
    this.setBounce(1, 0);
    this.setSize(26, 34);

    this.startX = x;
    this.range = range;
    this.speed = 35;
    this.direction = 1;
    this.setVelocityX(this.speed);

    this.shielded = true;
    this.setTint(0xaaaaaa);
    this.shieldCycle = () => {
      this.shielded = !this.shielded;
      this.setTint(this.shielded ? 0xaaaaaa : 0xffffff);
      this.scene.time.delayedCall(this.shielded ? 2200 : 1400, this.shieldCycle);
    };
    scene.time.delayedCall(2200, this.shieldCycle);
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;
    if (this.body.blocked.left) this.direction = 1;
    if (this.body.blocked.right) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);
  }

  takeDamage(amount = 1) {
    if (this.shielded) {
      this.scene.tweens.add({ targets: this, scaleX: 1.15, duration: 80, yoyo: true });
      return false;
    }
    return super.takeDamage(amount);
  }
}

// ---------- FANTASMA OLOROSO (castillo) ----------
// Intangible mientras está "en fase" (no hace ni recibe daño); se vuelve
// visible/sólido antes de atacar.
class Ghost extends Enemy {
  constructor(scene, x, y, range = 100) {
    super(scene, x, y, "ghostEnemy", { hp: 2, points: 100 });

    this.body.allowGravity = false;
    this.setSize(24, 28);

    this.startX = x;
    this.startY = y;
    this.range = range;
    this.speed = 50;
    this.direction = 1;
    this.setVelocityX(this.speed);

    this.manifested = false;
    this.intangible = true;
    this.setAlpha(0.35);

    this.phaseCycle = () => {
      this.manifested = !this.manifested;
      this.intangible = !this.manifested;
      this.setAlpha(this.manifested ? 1 : 0.35);
      this.scene.time.delayedCall(this.manifested ? 900 : 2000, this.phaseCycle);
    };
    scene.time.delayedCall(2000, this.phaseCycle);

    this.flightTween = scene.tweens.add({
      targets: this,
      y: y + 14,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);
    this.body.allowGravity = false;
    this.body.updateFromGameObject();
  }

  takeDamage(amount = 1) {
    if (!this.manifested) return false;
    return super.takeDamage(amount);
  }

  defeat() {
    if (this.flightTween) this.flightTween.stop();
    super.defeat();
  }
}

// ---------- CABALLERO DEL PAPEL HIGIÉNICO (castillo) ----------
// Al derrotarlo, a veces deja caer papel higiénico (cura un corazón).
class ToiletKnight extends Enemy {
  constructor(scene, x, y, range = 70) {
    super(scene, x, y, "toiletKnight", { hp: 3, points: 100 });

    this.setCollideWorldBounds(true);
    this.setBounce(1, 0);
    this.setSize(24, 34);

    this.startX = x;
    this.range = range;
    this.speed = 55;
    this.direction = 1;
    this.setVelocityX(this.speed);
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;
    if (this.body.blocked.left) this.direction = 1;
    if (this.body.blocked.right) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction < 0);
  }

  defeat() {
    const scene = this.scene;
    const x = this.x;
    const y = this.y;
    const shouldDrop = Math.random() < 0.45;
    super.defeat();
    if (shouldDrop && scene.toiletPaperPickups) {
      const pickup = scene.toiletPaperPickups.create(x, y, "toiletPaper");
      pickup.body.allowGravity = true;
    }
  }
}

// ---------- HECHICERO DE LAS FLATULENCIAS (castillo) ----------
class FartWizard extends Enemy {
  constructor(scene, x, y, range = 120) {
    super(scene, x, y, "fartWizard", { hp: 3, points: 100 });

    this.body.allowGravity = false;
    this.setSize(24, 34);

    this.startX = x;
    this.range = range;

    this.castInterval = 2000;
    this.lastCastTime = scene.time.now + Phaser.Math.Between(0, 1000);
    this.teleportInterval = 3500;
    this.lastTeleportTime = scene.time.now + Phaser.Math.Between(0, 1500);
  }

  update() {
    // Reafirma la flotación por si el grupo de física reinició el body (ver CarnivorousPlant).
    this.body.allowGravity = false;
    this.setVelocity(0, 0);

    const player = this.scene.player;
    const now = this.scene.time.now;

    if (player && now - this.lastCastTime >= this.castInterval) {
      this.lastCastTime = now;
      this.castCloud(player);
    }

    if (now - this.lastTeleportTime >= this.teleportInterval) {
      this.lastTeleportTime = now;
      this.teleportNearby();
    }
  }

  castCloud(player) {
    if (!this.scene.fartClouds) return;
    const dir = player.x < this.x ? -1 : 1;
    const cloud = this.scene.fartClouds.create(this.x, this.y, "fartCloud");
    cloud.body.allowGravity = false;
    cloud.setVelocityX(dir * 130);
    cloud.spawnX = cloud.x;
  }

  teleportNearby() {
    const offset = Phaser.Math.Between(-90, 90) || 60;
    const minX = this.startX - this.range - 40;
    const maxX = this.startX + this.range + 40;
    const newX = Phaser.Math.Clamp(this.x + offset, minX, maxX);
    this.setPosition(newX, this.y);
    this.body.updateFromGameObject();
    spawnPoof(this.scene, this.x, this.y, 0.3);
  }
}

// ---------- MINI-INODORO (invocado por el jefe final) ----------
class MiniToilet extends Enemy {
  constructor(scene, x, y, range = 60) {
    super(scene, x, y, "miniToilet", { hp: 1, points: 30 });

    this.setCollideWorldBounds(true);
    this.setBounce(1, 0);
    this.setSize(20, 20);

    this.startX = x;
    this.range = range;
    this.speed = 40;
    this.direction = 1;
    this.setVelocityX(this.speed);
  }

  update() {
    if (this.x <= this.startX - this.range) this.direction = 1;
    else if (this.x >= this.startX + this.range) this.direction = -1;
    if (this.body.blocked.left) this.direction = 1;
    if (this.body.blocked.right) this.direction = -1;

    this.setVelocityX(this.speed * this.direction);
  }
}

// ---------- INODORO GIGANTE (jefe final) ----------
// Solo pierde un segmento de vida con ataques de caca (5 en total); las
// botellas únicamente lo aturden. La escena orquesta la animación de
// derrota final, así que aquí NO se autodestruye al llegar a 0 vida.
class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, "bossToilet", { hp: 5, points: 2000 });

    this.isBoss = true;
    this.setCollideWorldBounds(true);
    this.setImmovable(true);
    this.body.allowGravity = false;
    this.setSize(90, 110);

    this.hitsTaken = 0;
    this.phase = 1;
    this.isInvulnerable = false;
    this.isStunned = false;
    this.defeated = false;
    this.stunTimer = null;
  }

  update() {
    this.body.allowGravity = false;
    this.setVelocity(0, 0);
  }

  takeDamage(amount = 1) {
    if (this.defeated || this.isInvulnerable) return false;

    this.hitsTaken += 1;
    this.hp = 5 - this.hitsTaken;
    this.isInvulnerable = true;
    this.scene.time.delayedCall(800, () => {
      this.isInvulnerable = false;
    });

    this.phase = this.hitsTaken < 2 ? 1 : this.hitsTaken < 4 ? 2 : 3;
    if (this.phase === 3) this.setTint(0xffaaaa);

    this.scene.cameras.main.shake(200, 0.006);
    spawnPoof(this.scene, this.x, this.y - 30, 0.6);
    playGameSound(this.scene, SOUND_KEYS.enemyDown);

    if (this.hitsTaken >= 5) {
      this.defeated = true;
      return true;
    }
    return false;
  }

  stun() {
    if (this.defeated) return;
    this.isStunned = true;
    this.setTint(this.phase === 3 ? 0xaaaaff : 0xaaaaee);
    if (this.stunTimer) this.stunTimer.remove();
    this.stunTimer = this.scene.time.delayedCall(1500, () => {
      this.isStunned = false;
      this.clearTint();
      if (this.phase === 3) this.setTint(0xffaaaa);
    });
  }
}

function spawnPoof(scene, x, y, startScale) {
  const poof = scene.add.sprite(x, y, "poof").setScale(startScale);
  scene.tweens.add({
    targets: poof,
    scale: startScale + 0.9,
    alpha: 0,
    duration: 350,
    onComplete: () => poof.destroy(),
  });
}

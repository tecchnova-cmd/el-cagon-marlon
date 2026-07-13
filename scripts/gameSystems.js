// Sistemas compartidos entre todas las escenas de nivel: combo, monedas,
// checkpoints, menú de pausa y pequeños toques visuales (partículas de
// moneda, frases cómicas al derrotar enemigos).

const COMBO_WINDOW_MS = 2500;
const COMBO_MESSAGES = {
  2: "¡Combo x2!",
  3: "¡Combo x3!",
  4: "¡Ataque apestoso!",
  5: "¡Golpe perfecto!",
};

const DEFEAT_PHRASES = [
  "¡Toma caca!",
  "¡Al hoyo!",
  "¡Qué asco de victoria!",
  "¡Marlon 1 - Villano 0!",
  "¡Directo al inodoro!",
];

// En móvil, pide pantalla completa real (oculta la barra de direcciones) en
// el primer toque del jugador. Los navegadores exigen que sea un gesto
// directo del usuario, así que solo se llama desde un pointerdown/click.
function requestFullscreenIfMobile(scene) {
  const isTouch = scene.sys.game.device.input.touch;
  if (!isTouch || scene.scale.isFullscreen) return;
  try {
    scene.scale.startFullscreen();
  } catch (e) {
    // Algunos navegadores lo bloquean (o ya no hace falta); el juego sigue
    // funcionando igual, solo sin pantalla completa.
  }
}

function trackCoinCollected(scene) {
  scene.registry.set("coinsCollected", (scene.registry.get("coinsCollected") || 0) + 1);
  scene.registry.set("coinsWallet", (scene.registry.get("coinsWallet") || 0) + 1);
}

function spawnCoinParticles(scene, x, y) {
  for (let i = 0; i < 5; i++) {
    const spark = scene.add.image(x, y, "coin").setScale(0.35);
    const angle = Phaser.Math.Between(0, 360);
    const dist = Phaser.Math.Between(14, 30);
    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(Phaser.Math.DegToRad(angle)) * dist,
      y: y + Math.sin(Phaser.Math.DegToRad(angle)) * dist - 10,
      alpha: 0,
      scale: 0.1,
      duration: 350,
      onComplete: () => spark.destroy(),
    });
  }
}

// Reemplaza a "scene.addScore(enemy.points)" tras derrotar un enemigo normal:
// aplica el multiplicador de combo, suma la puntuación y muestra el mensaje.
function awardEnemyDefeat(scene, x, y, points) {
  const now = scene.time.now;
  if (!scene.comboExpireTime || now > scene.comboExpireTime) {
    scene.comboCount = 1;
  } else {
    scene.comboCount = Math.min(5, (scene.comboCount || 1) + 1);
  }
  scene.comboExpireTime = now + COMBO_WINDOW_MS;

  scene.addScore(points * scene.comboCount);
  scene.registry.set("enemiesDefeated", (scene.registry.get("enemiesDefeated") || 0) + 1);

  if (scene.comboText) {
    scene.comboText.setText(scene.comboCount > 1 ? "Combo x" + scene.comboCount : "");
  }

  if (scene.comboCount >= 2) {
    const label = COMBO_MESSAGES[scene.comboCount] || "¡Combo x" + scene.comboCount + "!";
    showFloatingText(scene, x, y - 30, label, "#ffd93d");
  } else if (Math.random() < 0.3) {
    showFloatingText(scene, x, y - 30, Phaser.Utils.Array.GetRandom(DEFEAT_PHRASES), "#ffffff");
  }
}

function showFloatingText(scene, x, y, text, color) {
  const label = scene.add
    .text(x, y, text, {
      fontFamily: "Comic Sans MS, sans-serif",
      fontSize: "14px",
      color: color || "#ffffff",
      stroke: "#2b2b52",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(15);
  scene.tweens.add({
    targets: label,
    y: y - 26,
    alpha: 0,
    duration: 800,
    onComplete: () => label.destroy(),
  });
}

// ---------- FLATULENCIA ----------
// Nube de humo verde puramente cómica: no hace daño ni empuja, solo sale
// detrás de Marlon cuando se tira un pedo (tecla F / botón táctil).
function spawnFartCloud(scene, x, y) {
  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 90, () => {
      const puff = scene.add.image(x + Phaser.Math.Between(-6, 6), y, "fartCloud").setAlpha(0.85).setScale(0.5 + i * 0.15).setDepth(9);
      scene.tweens.add({
        targets: puff,
        y: y - Phaser.Math.Between(18, 34),
        x: puff.x + Phaser.Math.Between(-10, 10),
        scale: puff.scale + 0.5,
        alpha: 0,
        duration: 550,
        ease: "Sine.easeOut",
        onComplete: () => puff.destroy(),
      });
    });
  }
}

// ---------- CHECKPOINT ----------
// Un checkpoint por nivel: al pasarlo, Marlon reaparecerá ahí (en vez de en
// el punto de inicio) la próxima vez que pierda una vida.
function createCheckpoint(scene, x, groundTop) {
  const respawnY = groundTop - 60;
  scene.checkpoint = { x: scene.player.x, y: scene.player.y };

  const flag = scene.add.image(x, groundTop - 20, "checkpointFlag").setDepth(1);
  const zone = scene.add.zone(x, groundTop - 20, 34, 90);
  scene.physics.add.existing(zone, true);

  scene.physics.add.overlap(scene.player, zone, () => {
    if (scene.checkpoint.x === x) return;
    scene.checkpoint = { x, y: respawnY };
    flag.setTint(0x5aff5a);
    playGameSound(scene, SOUND_KEYS.checkpoint);
  });
}

// Se llama tras aplicar el golpe (knockback) en onPlayerHit, solo si a
// Marlon todavía le quedan vidas (si no, la escena va a reiniciar/game over).
function respawnAtCheckpoint(scene) {
  if (!scene.checkpoint) return;
  scene.time.delayedCall(180, () => {
    if (!scene.player || !scene.player.active) return;
    scene.player.setPosition(scene.checkpoint.x, scene.checkpoint.y);
    scene.player.setVelocity(0, 0);
  });
}

// ---------- MENÚ DE PAUSA ----------
function setupPauseKey(scene) {
  scene.escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
}

function openPauseMenu(scene) {
  scene.scene.launch("PauseMenuScene", { parentKey: scene.scene.key });
  scene.scene.pause();
}

function checkPauseToggle(scene) {
  if (Phaser.Input.Keyboard.JustDown(scene.escKey)) {
    openPauseMenu(scene);
  }
}

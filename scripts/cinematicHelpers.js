// Motor reutilizable de cinemáticas: texturas decorativas, caja de diálogo,
// tarjetas de título/objetivo, partículas ambientales (papel, moscas, humo),
// barras de cine y el sistema de "saltar cinemática". Cualquier escena de
// cinemática futura (SewerIntroCinematic, etc.) puede reusar estas funciones
// pasándose a sí misma como primer argumento.

function generateCinematicTextures(scene) {
  if (scene.textures.exists("cineGraffiti1")) return;

  const g = scene.make.graphics({ add: false });

  // ---------- GRAFITIS (varias variantes) ----------
  g.clear();
  g.lineStyle(3, 0xff5a7a, 0.8);
  g.beginPath();
  g.moveTo(2, 26);
  g.lineTo(14, 4);
  g.lineTo(24, 22);
  g.lineTo(38, 2);
  g.strokePath();
  g.generateTexture("cineGraffiti1", 40, 30);

  g.clear();
  g.lineStyle(3, 0x5ad9ff, 0.7);
  g.strokeCircle(14, 14, 12);
  g.lineStyle(2, 0x5ad9ff, 0.7);
  g.lineBetween(4, 4, 24, 24);
  g.generateTexture("cineGraffiti2", 28, 28);

  // ---------- BASURA (montón) ----------
  g.clear();
  g.fillStyle(0x3a3a30, 1);
  g.fillEllipse(20, 14, 34, 14);
  g.fillStyle(0x5a5a40, 1);
  g.fillRect(6, 4, 10, 10);
  g.fillStyle(0x2a2a20, 1);
  g.fillRect(22, 2, 8, 12);
  g.generateTexture("cineTrashPile", 40, 20);

  // ---------- PAPEL AL VIENTO ----------
  g.clear();
  g.fillStyle(0xe8e0c8, 0.85);
  g.fillRect(0, 0, 10, 8);
  g.generateTexture("cinePaper", 10, 8);

  // ---------- MOSCA ----------
  g.clear();
  g.fillStyle(0x1a1a1a, 1);
  g.fillCircle(3, 3, 3);
  g.fillStyle(0xcfe8ff, 0.4);
  g.fillEllipse(0, 1, 5, 2);
  g.generateTexture("cineFly", 6, 6);

  // ---------- BARRA DE CINE (letterbox) ----------
  g.clear();
  g.fillStyle(0x000000, 1);
  g.fillRect(0, 0, 4, 4);
  g.generateTexture("cineBar", 4, 4);

  // ---------- SOMBRA (bajo los personajes) ----------
  g.clear();
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(20, 6, 40, 12);
  g.generateTexture("cineShadow", 40, 12);

  // ---------- RESPLANDOR VERDE (luz tenue junto a la alcantarilla) ----------
  g.clear();
  g.fillStyle(0x6fcf3a, 0.12);
  g.fillCircle(60, 60, 60);
  g.fillStyle(0x9be86b, 0.14);
  g.fillCircle(60, 60, 36);
  g.generateTexture("cineGlow", 120, 120);

  g.destroy();
}

// Texturas exclusivas de la cinemática de Alcantarillas (Nivel 2). Guardadas
// aparte de generateCinematicTextures() para no depender de su guardia
// ("cineGraffiti1"): si esa función ya se ejecutó antes (por ejemplo porque
// el jugador ya vio la cinemática del Nivel 1 en esta sesión), su return
// temprano nunca llegaría a generar estas.
function generateSewerCinematicTextures(scene) {
  if (scene.textures.exists("cineMuralSilhouette")) return;

  const g = scene.make.graphics({ add: false });

  // ---------- PELDAÑO DE ESCALERA METÁLICA ----------
  g.clear();
  g.fillStyle(0x8a8a95, 1);
  g.fillRoundedRect(0, 0, 40, 8, 2);
  g.fillStyle(0x5a5a62, 0.6);
  g.fillRect(0, 5, 40, 3);
  g.generateTexture("cineLadderRung", 40, 8);

  // ---------- MURAL / GRAFITI DEL REY MALOLIENTE (silueta, no el jefe real) ----------
  g.clear();
  // tanque
  g.fillStyle(0x151b18, 0.85);
  g.fillRoundedRect(45, 10, 60, 34, 8);
  // taza
  g.fillRoundedRect(20, 46, 110, 70, 20);
  g.fillStyle(0x0c100d, 0.85);
  g.fillEllipse(75, 60, 50, 26);
  // corona encima
  g.fillStyle(0xffd93d, 0.9);
  g.fillTriangle(45, 14, 55, -8, 65, 14);
  g.fillTriangle(65, 14, 75, -14, 85, 14);
  g.fillTriangle(85, 14, 95, -8, 105, 14);
  g.fillRect(43, 10, 64, 8);
  // ojos enojados
  g.fillStyle(0xe63946, 0.95);
  g.fillEllipse(58, 92, 16, 10);
  g.fillEllipse(92, 92, 16, 10);
  g.fillStyle(0x2b0a0a, 1);
  g.fillCircle(58, 92, 3);
  g.fillCircle(92, 92, 3);
  // cejas enojadas
  g.lineStyle(4, 0xe63946, 0.9);
  g.lineBetween(48, 80, 66, 86);
  g.lineBetween(102, 80, 84, 86);
  g.generateTexture("cineMuralSilhouette", 150, 120);

  // ---------- OJOS ROJOS EN LA OSCURIDAD ----------
  g.clear();
  g.fillStyle(0xff2e2e, 0.9);
  g.fillEllipse(12, 11, 18, 12);
  g.fillEllipse(42, 11, 18, 12);
  g.fillStyle(0xffb3b3, 0.8);
  g.fillCircle(9, 8, 2.4);
  g.fillCircle(39, 8, 2.4);
  g.generateTexture("cineRedEyePair", 54, 22);

  // ---------- MOTA DE POLVO (cae con el golpe) ----------
  g.clear();
  g.fillStyle(0xcfc7a8, 0.8);
  g.fillCircle(2, 2, 2);
  g.generateTexture("cineDustMote", 4, 4);

  g.destroy();
}

// ---------- BARRAS DE CINE ----------
function showLetterboxBars(scene) {
  const { width, height } = scene.scale;
  const barHeight = 46;
  const top = scene.add.image(width / 2, -barHeight / 2, "cineBar").setDisplaySize(width, barHeight).setScrollFactor(0).setDepth(200);
  const bottom = scene.add
    .image(width / 2, height + barHeight / 2, "cineBar")
    .setDisplaySize(width, barHeight)
    .setScrollFactor(0)
    .setDepth(200);

  scene.tweens.add({ targets: top, y: barHeight / 2, duration: 700, ease: "Cubic.easeOut" });
  scene.tweens.add({ targets: bottom, y: height - barHeight / 2, duration: 700, ease: "Cubic.easeOut" });

  return { top, bottom };
}

function hideLetterboxBars(scene, bars, duration = 500) {
  if (!bars) return;
  const { width, height } = scene.scale;
  scene.tweens.add({ targets: bars.top, y: -30, duration, ease: "Cubic.easeIn" });
  scene.tweens.add({ targets: bars.bottom, y: height + 30, duration, ease: "Cubic.easeIn" });
}

// ---------- DIÁLOGOS ----------
// Caja inferior con nombre del hablante (para las líneas de Marlon).
function showDialogue(scene, speaker, text, durationMs) {
  const { width, height } = scene.scale;
  const y = height - 90;

  const box = scene.add.rectangle(width / 2, y, width - 80, 64, 0x000000, 0.55).setScrollFactor(0).setDepth(150).setAlpha(0);
  const label = scene.add
    .text(width / 2 - (width - 100) / 2, y - 24, speaker + ":", {
      fontFamily: "Comic Sans MS, sans-serif",
      fontSize: "15px",
      color: "#ffd93d",
    })
    .setScrollFactor(0)
    .setDepth(151)
    .setAlpha(0);
  const body = scene.add
    .text(width / 2, y + 6, text, {
      fontFamily: "Comic Sans MS, sans-serif",
      fontSize: "17px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: width - 120 },
    })
    .setOrigin(0.5, 0.5)
    .setScrollFactor(0)
    .setDepth(151)
    .setAlpha(0);

  const items = [box, label, body];
  scene.tweens.add({ targets: items, alpha: { from: 0, to: 1 }, duration: 250 });
  scene.time.delayedCall(Math.max(0, durationMs - 300), () => {
    scene.tweens.add({ targets: items, alpha: 0, duration: 250, onComplete: () => items.forEach((i) => i.destroy()) });
  });

  return items;
}

// Línea "misteriosa" (la voz del Rey Maloliente): centrada, sin nombre, con
// tinte verdoso y un pequeño temblor para diferenciarla del diálogo normal.
function showMysteriousLine(scene, text, durationMs) {
  const { width, height } = scene.scale;
  const label = scene.add
    .text(width / 2, height / 2 - 20, text, {
      fontFamily: "Comic Sans MS, sans-serif",
      fontSize: "22px",
      color: "#9be86b",
      stroke: "#0a1a0a",
      strokeThickness: 6,
      align: "center",
      wordWrap: { width: width - 160 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(151)
    .setAlpha(0);

  scene.tweens.add({ targets: label, alpha: 1, duration: 200 });
  scene.tweens.add({
    targets: label,
    x: width / 2 + 3,
    duration: 60,
    yoyo: true,
    repeat: 6,
  });
  scene.time.delayedCall(Math.max(0, durationMs - 300), () => {
    scene.tweens.add({ targets: label, alpha: 0, duration: 300, onComplete: () => label.destroy() });
  });

  return label;
}

// ---------- TARJETAS DE TEXTO (título / objetivo) ----------
function showTitleCard(scene, title, subtitle, durationMs) {
  const { width, height } = scene.scale;
  const items = [];

  const titleText = scene.add
    .text(width / 2, height / 2 - 20, title, {
      fontFamily: "Comic Sans MS, sans-serif",
      fontSize: "48px",
      color: "#ffffff",
      stroke: "#2b2b52",
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(150)
    .setAlpha(0);
  items.push(titleText);

  if (subtitle) {
    const subText = scene.add
      .text(width / 2, height / 2 + 34, subtitle, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "20px",
        color: "#ffd93d",
        stroke: "#2b2b52",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(150)
      .setAlpha(0);
    items.push(subText);
  }

  scene.tweens.add({ targets: items, alpha: 1, duration: 600 });
  scene.time.delayedCall(Math.max(0, durationMs - 700), () => {
    scene.tweens.add({ targets: items, alpha: 0, duration: 600, onComplete: () => items.forEach((i) => i.destroy()) });
  });

  return items;
}

function showObjectiveLine(scene, text, durationMs) {
  const { width, height } = scene.scale;
  const label = scene.add
    .text(width / 2, height / 2 + 60, text, {
      fontFamily: "Comic Sans MS, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      stroke: "#2b2b52",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(150)
    .setAlpha(0);

  scene.tweens.add({ targets: label, alpha: 1, duration: 250 });
  scene.time.delayedCall(Math.max(0, durationMs - 300), () => {
    scene.tweens.add({ targets: label, alpha: 0, duration: 300, onComplete: () => label.destroy() });
  });
  return label;
}

// ---------- PARTÍCULAS AMBIENTALES ----------
function spawnBlowingPaper(scene, startX, y, travel) {
  const paper = scene.add.image(startX, y, "cinePaper").setAlpha(0.85).setDepth(5);
  scene.tweens.add({
    targets: paper,
    x: startX + travel,
    y: y + Phaser.Math.Between(-20, 20),
    angle: Phaser.Math.Between(180, 540),
    duration: Phaser.Math.Between(3000, 5000),
    onComplete: () => paper.destroy(),
  });
  return paper;
}

function spawnFlyingFly(scene, x, y, range) {
  const fly = scene.add.image(x, y, "cineFly").setDepth(6);
  const wander = () => {
    if (!fly.active) return;
    scene.tweens.add({
      targets: fly,
      x: x + Phaser.Math.Between(-range, range),
      y: y + Phaser.Math.Between(-range / 2, range / 2),
      duration: Phaser.Math.Between(400, 900),
      onComplete: wander,
    });
  };
  wander();
  return fly;
}

function scatterFly(scene, fly) {
  if (!fly || !fly.active) return;
  scene.tweens.killTweensOf(fly);
  scene.tweens.add({
    targets: fly,
    x: fly.x + Phaser.Math.Between(-200, 200),
    y: fly.y - Phaser.Math.Between(100, 200),
    alpha: 0,
    duration: 500,
    onComplete: () => fly.destroy(),
  });
}

function spawnRisingSmoke(scene, x, y, textureKey, tint) {
  const puff = scene.add.image(x, y, textureKey).setAlpha(0.7).setDepth(4).setScale(0.6);
  if (tint) puff.setTint(tint);
  scene.tweens.add({
    targets: puff,
    y: y - Phaser.Math.Between(40, 70),
    x: x + Phaser.Math.Between(-15, 15),
    scale: 1.6,
    alpha: 0,
    duration: Phaser.Math.Between(1800, 2600),
    onComplete: () => puff.destroy(),
  });
  return puff;
}

// ---------- SALTAR CINEMÁTICA ----------
// onSkip se llama una sola vez, sin importar cuántas teclas/toques disparen el salto.
function setupCinematicSkip(scene, onSkip) {
  let triggered = false;
  const trigger = () => {
    if (triggered) return;
    triggered = true;
    onSkip();
  };

  scene.input.keyboard.on("keydown-ENTER", trigger);
  scene.input.keyboard.on("keydown-ESC", trigger);

  if (scene.sys.game.device.input.touch) {
    const { width } = scene.scale;
    const skipBtn = scene.add
      .text(width - 18, 14, "SALTAR ▶▶", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#00000088",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(210)
      .setInteractive({ useHandCursor: true });
    skipBtn.on("pointerdown", trigger);
  }

  return trigger;
}

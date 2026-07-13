// Cinemática de apertura del Nivel 3 (Bosque Tóxico). Continúa justo después
// del Nivel 2: Marlon sale de la tubería gigante de las alcantarillas, cruza
// un tramo del bosque (niebla verde, hongos, luciérnagas), encuentra un
// árbol muerto con una advertencia pintada y recibe una segunda señal del
// Rey Maloliente (voz + ojos enormes) antes de que empiece el nivel.
//
// Mismo motor de cinemáticas que CityIntroCinematic.js / SewerIntroCinematic.js
// (cinematicHelpers.js / cinematicSound.js): cámara, tweens, sonido
// sintetizado, sin video. Aquí el tono sube el humor absurdo de Marlon.
// Se puede saltar con ENTER/ESC en cualquier momento.

const FOREST_CINE_WIDTH = 1650;
const FOREST_CINE_HEIGHT = 540;
const FOREST_CINE_GROUND_TOP = 476;
const FOREST_CINE_PIPE_X = 140;
const FOREST_CINE_OBSERVE_X = 520;
const FOREST_CINE_TREE_X = 1150;

class ToxicForestIntroCinematic extends Phaser.Scene {
  constructor() {
    super("ToxicForestIntroCinematic");
  }

  init(data) {
    this.nextScene = (data && data.nextScene) || "ToxicForestScene";
  }

  preload() {
    generateGameTextures(this);
    generateCinematicTextures(this);
    generateForestCinematicTextures(this);
  }

  create() {
    this.skipped = false;
    this.finished = false;
    this.activeTimers = [];
    this.windHandle = null;
    this.ambientPad = null;
    this.levelMusic = null;
    this.birdEvent = null;

    const cam = this.cameras.main;
    cam.setBackgroundColor("#101a10");
    cam.setBounds(0, 0, FOREST_CINE_WIDTH, FOREST_CINE_HEIGHT);
    cam.setZoom(1);
    cam.scrollX = 0;
    cam.scrollY = 0;

    this.blackout = this.add.rectangle(480, 270, 960, 540, 0x000000, 1).setScrollFactor(0).setDepth(300);

    this.buildWorld();
    this.skipTrigger = setupCinematicSkip(this, () => this.skip());
    this.runSequence();
  }

  // ---------- CONSTRUCCIÓN DEL ESCENARIO ----------
  buildWorld() {
    this.add.rectangle(FOREST_CINE_WIDTH / 2, FOREST_CINE_HEIGHT / 2, FOREST_CINE_WIDTH, FOREST_CINE_HEIGHT, 0x1c2b18, 1).setDepth(-10);

    // Tubería gigante por la que sale Marlon (misma textura de la salida del Nivel 2).
    this.add.image(FOREST_CINE_PIPE_X, FOREST_CINE_GROUND_TOP - 18, "pipeExit").setScale(1.2).setDepth(2).setAngle(20);

    // Suelo del bosque.
    for (let x = 0; x <= FOREST_CINE_WIDTH; x += 64) {
      this.add.image(x + 32, FOREST_CINE_GROUND_TOP + 32, "forestFloor").setAlpha(0.9).setDepth(1);
    }

    // Árboles enormes de fondo.
    const treeXs = [40, 320, 480, 700, 880, 1000, 1350, 1550];
    treeXs.forEach((x, i) => {
      this.add
        .image(x, FOREST_CINE_GROUND_TOP + 10, "forestTree")
        .setOrigin(0.5, 1)
        .setAlpha(0.85)
        .setScale(0.85 + (i % 3) * 0.12)
        .setDepth(1);
    });

    // Niebla verde flotando.
    [200, 620, 950, 1300].forEach((x) => {
      const fog = this.add.image(x, FOREST_CINE_GROUND_TOP - 130, "toxicFog").setAlpha(0.5).setDepth(3);
      this.tweens.add({ targets: fog, x: x + 40, duration: Phaser.Math.Between(2600, 3600), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    });

    // Hongos gigantes brillando (decorativos, con un resplandor detrás).
    [FOREST_CINE_OBSERVE_X - 60, FOREST_CINE_OBSERVE_X + 90].forEach((x) => {
      this.add.image(x, FOREST_CINE_GROUND_TOP - 4, "cineGlow").setScale(0.5).setAlpha(0.5).setDepth(1).setTint(0x9be86b);
      this.add.image(x, FOREST_CINE_GROUND_TOP - 6, "hoppingMushroom").setDepth(2);
    });

    // Luciérnagas: puntitos brillantes flotando despacio.
    this.fireflies = [
      { x: FOREST_CINE_OBSERVE_X - 100, y: FOREST_CINE_GROUND_TOP - 90 },
      { x: FOREST_CINE_OBSERVE_X + 60, y: FOREST_CINE_GROUND_TOP - 140 },
      { x: FOREST_CINE_OBSERVE_X + 180, y: FOREST_CINE_GROUND_TOP - 70 },
    ].map(({ x, y }) => this.buildFirefly(x, y));

    // Mosca ambiental (decorativa, sin física).
    this.forestFly = this.buildAmbientCreature(FOREST_CINE_OBSERVE_X + 40, FOREST_CINE_GROUND_TOP - 160, "mutantFly", 50, true);

    // Árbol muerto (más adelante, con la advertencia pintada).
    this.deadTree = this.add
      .image(FOREST_CINE_TREE_X, FOREST_CINE_GROUND_TOP + 10, "forestTree")
      .setOrigin(0.5, 1)
      .setScale(1.3)
      .setTint(0x554431)
      .setDepth(2);

    // Hueco oscuro en el tronco donde aparecerán los ojos.
    this.treeHollow = this.add.ellipse(FOREST_CINE_TREE_X, FOREST_CINE_GROUND_TOP - 150, 46, 60, 0x080a06, 0.85).setDepth(3);

    // Ojos enormes (ocultos hasta la Escena 6).
    this.redEyes = this.add.image(FOREST_CINE_TREE_X, FOREST_CINE_GROUND_TOP - 150, "cineRedEyePair").setScale(1.5).setDepth(4).setAlpha(0);

    // Advertencia pintada + huellas (ocultas hasta la Escena 3).
    this.warningText = this.add
      .text(FOREST_CINE_TREE_X, FOREST_CINE_GROUND_TOP - 40, "EL REY MALOLIENTE\nTODO LO VE", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "16px",
        color: "#b33a3a",
        align: "center",
        stroke: "#2a1010",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAngle(-3)
      .setDepth(3)
      .setAlpha(0);

    this.footprints = [];
    for (let i = 0; i < 10; i++) {
      const fx = FOREST_CINE_TREE_X - 90 + i * 18 + Phaser.Math.Between(-6, 6);
      const fy = FOREST_CINE_GROUND_TOP + 26 + (i % 2 === 0 ? -4 : 4);
      this.footprints.push(this.add.image(fx, fy, "cineFootprint").setDepth(2).setAlpha(0));
    }

    // Marlon: empieza justo encima de la tubería, cayendo.
    this.marlonX = FOREST_CINE_PIPE_X;
    this.marlonY = FOREST_CINE_GROUND_TOP - 130;
    this.marlonShadow = this.add.image(this.marlonX, FOREST_CINE_GROUND_TOP + 24, "cineShadow").setDepth(9).setAlpha(0.3);
    this.marlonBody = this.add.image(this.marlonX, this.marlonY, "playerBody").setScale(1.3).setDepth(10);
    this.marlonFace = this.add
      .image(this.marlonX, this.marlonY + PLAYER_HEAD_OFFSET_Y * 1.3, getPlayerFaceKey(this))
      .setDepth(11);
    this.marlonFace.setDisplaySize(PLAYER_HEAD_DIAMETER * 1.3, PLAYER_HEAD_DIAMETER * 1.3);
  }

  buildFirefly(x, y) {
    const fly = this.add.image(x, y, "cineFirefly").setDepth(6);
    this.tweens.add({ targets: fly, alpha: { from: 0.4, to: 1 }, duration: Phaser.Math.Between(700, 1100), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: fly, x: x + Phaser.Math.Between(-30, 30), y: y + Phaser.Math.Between(-20, 20), duration: Phaser.Math.Between(2200, 3200), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    return fly;
  }

  buildAmbientCreature(x, y, textureKey, range, floaty) {
    const sprite = this.add.image(x, y, textureKey).setDepth(6);
    const dir = { v: 1 };
    const wander = () => {
      if (!sprite.active) return;
      this.tweens.add({
        targets: sprite,
        x: x + range * dir.v,
        duration: Phaser.Math.Between(900, 1500),
        ease: "Sine.easeInOut",
        onComplete: () => {
          dir.v *= -1;
          sprite.setFlipX(dir.v < 0);
          wander();
        },
      });
    };
    wander();
    if (floaty) {
      this.tweens.add({ targets: sprite, y: y + 10, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    return sprite;
  }

  // ---------- MOVIMIENTO DE MARLON ----------
  fallMarlon(toY, duration) {
    const deltaY = toY - this.marlonY;
    const targets = [this.marlonBody, this.marlonFace];
    this.marlonY = toY;
    this.tweenTrack(this.tweens.add({ targets, y: "+=" + deltaY, duration, ease: "Quad.easeIn" }));
  }

  moveMarlonX(toX, duration) {
    const deltaX = toX - this.marlonX;
    const targets = [this.marlonBody, this.marlonFace];
    this.marlonBody.setFlipX(deltaX < 0);
    this.marlonFace.setFlipX(deltaX < 0);
    this.marlonX = toX;
    this.tweenTrack(this.tweens.add({ targets, x: "+=" + deltaX, duration, ease: "Sine.easeInOut" }));
    this.tweenTrack(this.tweens.add({ targets: this.marlonShadow, x: toX, duration, ease: "Sine.easeInOut" }));
  }

  marlonLookAround() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], angle: { from: 0, to: -8 }, duration: 220, yoyo: true, repeat: 3 })
    );
  }

  marlonCoverNose() {
    this.tweenTrack(
      this.tweens.add({
        targets: [this.marlonBody, this.marlonFace],
        scaleY: "*=0.94",
        scaleX: "*=1.04",
        duration: 170,
        yoyo: true,
        repeat: 2,
      })
    );
  }

  marlonHeroicPose() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], scale: "*=1.15", duration: 260, yoyo: true, ease: "Back.easeOut" })
    );
  }

  tweenTrack(tween) {
    this.activeTimers.push({ remove: () => tween.stop() });
    return tween;
  }

  // ---------- EFECTOS DEL BOSQUE ----------
  passingGreenCloud() {
    const cloud = this.add.image(this.marlonX + 20, this.marlonY - 6, "fartCloud").setAlpha(0).setScale(0.7).setDepth(12);
    this.tweenTrack(
      this.tweens.add({
        targets: cloud,
        alpha: 0.85,
        x: this.marlonX - 24,
        duration: 500,
        yoyo: true,
        onComplete: () => cloud.destroy(),
      })
    );
  }

  revealGraffiti() {
    this.tweenTrack(this.tweens.add({ targets: this.warningText, alpha: 1, duration: 500 }));
    this.tweenTrack(this.tweens.add({ targets: this.footprints, alpha: 0.8, duration: 500 }));
  }

  treeTremble() {
    this.tweenTrack(
      this.tweens.add({ targets: this.deadTree, angle: { from: -1.5, to: 1.5 }, duration: 110, yoyo: true, repeat: 6 })
    );
  }

  revealEyes() {
    this.redEyes.setAlpha(0);
    this.tweenTrack(
      this.tweens.add({
        targets: this.redEyes,
        alpha: 1,
        duration: 200,
        onComplete: () => {
          this.delay(400, () => {
            this.tweenTrack(this.tweens.add({ targets: this.redEyes, alpha: 0, duration: 250 }));
          });
        },
      })
    );
  }

  windGustLeaves() {
    this.gustHandle = startWindLoop(0.06);
    this.delay(1600, () => {
      if (this.gustHandle) this.gustHandle.stop(0.5);
    });
    for (let i = 0; i < 6; i++) {
      const startX = Phaser.Math.Between(0, FOREST_CINE_WIDTH);
      spawnBlowingPaper(this, startX, FOREST_CINE_GROUND_TOP - Phaser.Math.Between(20, 160), Phaser.Math.Between(120, 220)).setTint(0x6a8f4a);
    }
  }

  // ---------- TEMPORIZACIÓN ----------
  delay(ms, callback) {
    if (this.skipped) return null;
    const t = this.time.delayedCall(ms, () => {
      if (this.skipped) return;
      callback();
    });
    this.activeTimers.push(t);
    return t;
  }

  // ---------- SECUENCIA COMPLETA ----------
  runSequence() {
    let t = 0;
    const at = (gap, fn) => {
      t += gap;
      this.delay(t, fn);
    };
    const cam = this.cameras.main;

    // Sonido ambiental: pájaros y una brisa suave. Todo tranquilo.
    at(0, () => {
      this.windHandle = startWindLoop(0.02);
      this.birdEvent = this.time.addEvent({
        delay: 1300,
        loop: true,
        callback: () => {
          if (!this.skipped) playBirdChirp();
        },
      });
    });

    // Fade in lento.
    at(200, () => {
      this.tweens.add({ targets: this.blackout, alpha: 0, duration: 1100, ease: "Sine.easeOut" });
    });

    // ---- ESCENA 1: Marlon sale de la tubería ----
    at(600, () => {
      this.fallMarlon(FOREST_CINE_GROUND_TOP - 40, 500);
      this.delay(480, () => playSoftThud());
    });
    at(700, () => this.marlonCoverNose());
    at(650, () => showDialogue(this, "Marlon", "¡Nunca pensé que una alcantarilla pudiera tener tantas escaleras!", 1700));

    // ---- ESCENA 2: Camina y observa el bosque ----
    at(600, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: 60, duration: 1300, ease: "Sine.easeInOut" }));
      this.moveMarlonX(FOREST_CINE_OBSERVE_X, 1300);
    });
    at(2350, () => showDialogue(this, "Marlon", "Bueno... al menos aquí el aire está un poquito menos podrido.", 1700));
    at(2350, () => this.passingGreenCloud());
    at(300, () => this.marlonCoverNose());
    at(500, () => showDialogue(this, "Marlon", "...olvídenlo.", 1700));

    // ---- ESCENA 3: El árbol seco con la advertencia ----
    at(1750, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: FOREST_CINE_TREE_X - 480, zoom: 1.1, duration: 1500, ease: "Sine.easeInOut" }));
      this.moveMarlonX(FOREST_CINE_TREE_X - 110, 1500);
    });
    at(1500, () => this.revealGraffiti());
    at(400, () => this.marlonLookAround());
    at(500, () => showDialogue(this, "Marlon", "Pues que mire todo lo que quiera...", 1820));

    // ---- ESCENA 4: Humor absurdo, confianza de Marlon ----
    at(1900, () => {
      this.marlonHeroicPose();
      showDialogue(this, "Marlon", "¡No voy a permitir que me quiten el título del Cagón Número Uno!", 2812);
    });
    at(2850, () =>
      showDialogue(this, "Marlon", "A mí nadie me va a obligar a usar un baño.\nA mí me gusta hacer las cosas a mi manera.", 3452)
    );
    at(3500, () => showDialogue(this, "Marlon", "¡Yo hago mis necesidades en piscinas ajenas... y hasta en árboles de Navidad!", 3196));
    at(3200, () => {
      playCrowCaw();
      this.marlonCoverNose();
    });
    at(400, () => showDialogue(this, "Marlon", "...¿Qué?", 1700));

    // ---- ESCENA 5: Silencio repentino + advertencia ----
    at(1750, () => {
      if (this.birdEvent) this.birdEvent.remove(false);
      if (this.forestFly) this.tweenTrack(this.tweens.add({ targets: this.forestFly, alpha: 0, duration: 400 }));
      this.tweenTrack(this.tweens.add({ targets: cam, zoom: 1.25, duration: 1400, ease: "Sine.easeInOut" }));
    });
    at(1150, () => {
      this.treeTremble();
      playDeepBreathWithEcho();
    });
    at(700, () => {
      cam.shake(180, 0.005);
      showMysteriousLine(this, "Sigues avanzando...", 1500);
      playDeepVoiceWithEcho();
    });
    at(1550, () => {
      cam.shake(180, 0.005);
      showMysteriousLine(this, "...pequeño impostor...", 1500);
      playDeepVoiceWithEcho();
    });

    // ---- ESCENA 6: Ojos enormes + viento ----
    at(1550, () => this.revealEyes());
    at(600, () => this.windGustLeaves());
    at(700, () => this.marlonLookAround());
    at(500, () => showDialogue(this, "Marlon", "Perfecto... Eso significa que voy por buen camino.", 2364));

    // ---- ESCENA 7: Inicio del nivel ----
    at(2400, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: 0, zoom: 1, duration: 1200, ease: "Sine.easeInOut" }));
      this.moveMarlonX(FOREST_CINE_OBSERVE_X, 1200);
      this.startLevelMusic();
    });
    at(1300, () => showTitleCard(this, "NIVEL 3", "BOSQUE TÓXICO", 1900));
    at(1950, () => showObjectiveLine(this, "Encuentra la salida.", 1300));
    at(1450, () => showObjectiveLine(this, "Sobrevive a las criaturas mutantes.", 1300));
    at(1900, () => showObjectiveLine(this, "Sigue las pistas del Rey Maloliente.", 1300));

    at(1700, () => this.finish());
  }

  startLevelMusic() {
    if (this.ambientPad) this.ambientPad.stop(0.6);
    this.levelMusic = startChordPad([87, 110, 147, 175], 0.03);
    this.delay(1100, () => {
      if (this.levelMusic) this.levelMusic.stop(1.1);
    });
  }

  // ---------- SALTAR / TERMINAR ----------
  skip() {
    if (this.skipped) return;
    this.skipped = true;
    this.stopAllTimersAndTweens();
    this.stopAllSound();
    this.finish(200);
  }

  stopAllTimersAndTweens() {
    this.activeTimers.forEach((t) => {
      try {
        t.remove(false);
      } catch (e) {
        // el temporizador/tween ya pudo haberse completado; no pasa nada
      }
    });
    this.activeTimers = [];
    this.tweens.killAll();
    if (this.birdEvent) this.birdEvent.remove(false);
  }

  stopAllSound() {
    if (this.windHandle) this.windHandle.stop(0.2);
    if (this.gustHandle) this.gustHandle.stop(0.2);
    if (this.ambientPad) this.ambientPad.stop(0.2);
    if (this.levelMusic) this.levelMusic.stop(0.2);
  }

  finish(fadeMs = 700) {
    if (this.finished) return;
    this.finished = true;
    this.stopAllSound();

    const save = loadSaveData();
    save.forestIntroSeen = true;
    writeSaveData(save);

    this.tweens.add({
      targets: this.blackout,
      alpha: 1,
      duration: fadeMs,
      ease: "Sine.easeIn",
      onComplete: () => this.scene.start(this.nextScene),
    });
  }
}

// Cinemática de apertura del Nivel 2 (Alcantarillas). Continúa directamente
// la historia del Nivel 1: Marlon desciende por el conducto vertical, llega
// al fondo, encuentra un mural antiguo del Rey Maloliente y recibe una
// advertencia (voz + ojos en la oscuridad) antes de que empiece el nivel.
//
// Totalmente programada con Phaser (cámara, tweens, partículas, sonido
// sintetizado): sin video ni imágenes pesadas. Reutiliza el mismo motor de
// cinemáticas que CityIntroCinematic.js (cinematicHelpers.js / cinematicSound.js).
// Se puede saltar con ENTER/ESC en cualquier momento.

const SEWER_CINE_WIDTH = 1500;
const SEWER_CINE_HEIGHT = 1000;
const SEWER_CINE_SHAFT_X = 300; // centro del conducto vertical (boca + escalera)
const SEWER_CINE_SHAFT_TOP = 40;
const SEWER_CINE_FLOOR_Y = 860; // suelo de la sala inferior
const SEWER_CINE_MURAL_X = 1010;
const SEWER_CINE_MURAL_Y = 780;
const SEWER_CINE_PIPE_X = 1220;
const SEWER_CINE_PIPE_Y = 760;
const SEWER_CINE_EYES_X = 1310;
const SEWER_CINE_EYES_Y = 660;

class SewerIntroCinematic extends Phaser.Scene {
  constructor() {
    super("SewerIntroCinematic");
  }

  init(data) {
    this.nextScene = (data && data.nextScene) || "SewerScene";
  }

  preload() {
    generateGameTextures(this);
    generateCinematicTextures(this);
    generateSewerCinematicTextures(this);
  }

  create() {
    this.skipped = false;
    this.finished = false;
    this.activeTimers = [];
    this.pipeHum = null;
    this.ambientPad = null;
    this.levelMusic = null;
    this.dripSoundEvent = null;

    const cam = this.cameras.main;
    cam.setBackgroundColor("#05070a");
    cam.setBounds(0, 0, SEWER_CINE_WIDTH, SEWER_CINE_HEIGHT);
    cam.setZoom(1);
    cam.scrollX = 0;
    cam.scrollY = 0;

    // Empezamos en negro con un rectángulo (mismo criterio que la cinemática
    // del Nivel 1: control manual del fade de entrada y de salida/skip).
    this.blackout = this.add.rectangle(480, 270, 960, 540, 0x000000, 1).setScrollFactor(0).setDepth(300);

    this.buildWorld();
    this.skipTrigger = setupCinematicSkip(this, () => this.skip());
    this.runSequence();
  }

  // ---------- CONSTRUCCIÓN DEL ESCENARIO ----------
  buildWorld() {
    this.add.rectangle(SEWER_CINE_WIDTH / 2, SEWER_CINE_HEIGHT / 2, SEWER_CINE_WIDTH, SEWER_CINE_HEIGHT, 0x0e150f, 1).setDepth(-10);

    // Boca de la alcantarilla arriba (luz tenue de la calle que queda atrás).
    this.add.image(SEWER_CINE_SHAFT_X, SEWER_CINE_SHAFT_TOP, "manhole").setScale(1.6).setDepth(3).setTint(0x2c2c2c);
    this.add.circle(SEWER_CINE_SHAFT_X, SEWER_CINE_SHAFT_TOP, 70, 0x8fae86, 0.08).setDepth(2);

    // Tuberías oxidadas a los lados del conducto vertical.
    this.pipeSprites = [];
    for (let y = SEWER_CINE_SHAFT_TOP + 60; y < SEWER_CINE_FLOOR_Y; y += 110) {
      const left = this.add.image(SEWER_CINE_SHAFT_X - 90, y, "pipeBackground").setScale(0.55, 0.5).setAlpha(0.85).setDepth(1);
      const right = this.add.image(SEWER_CINE_SHAFT_X + 95, y, "pipeBackground").setScale(0.55, 0.5).setAlpha(0.85).setDepth(1).setFlipX(true);
      this.pipeSprites.push(left, right);
    }

    // Escalera metálica: peldaños centrados en el conducto.
    for (let y = SEWER_CINE_SHAFT_TOP + 50; y < SEWER_CINE_FLOOR_Y - 20; y += 34) {
      this.add.image(SEWER_CINE_SHAFT_X, y, "cineLadderRung").setDepth(2);
    }

    // Luces amarillas parpadeantes en el conducto.
    this.blinkLights = [
      { x: SEWER_CINE_SHAFT_X - 60, y: SEWER_CINE_SHAFT_TOP + 180 },
      { x: SEWER_CINE_SHAFT_X + 65, y: SEWER_CINE_SHAFT_TOP + 420 },
      { x: SEWER_CINE_SHAFT_X - 55, y: SEWER_CINE_SHAFT_TOP + 640 },
    ].map(({ x, y }) => {
      const light = this.add.circle(x, y, 8, 0xffd93d, 0.7).setDepth(2);
      this.tweens.add({ targets: light, alpha: 0.15, duration: Phaser.Math.Between(700, 1200), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      return light;
    });

    // Agua verde turbia en el fondo del conducto.
    this.add.ellipse(SEWER_CINE_SHAFT_X, SEWER_CINE_FLOOR_Y + 10, 220, 40, 0x2f4f2a, 0.7).setDepth(1);

    // Goteras cayendo desde el techo del conducto.
    [SEWER_CINE_SHAFT_X - 120, SEWER_CINE_SHAFT_X + 140].forEach((x) => this.spawnDripVisualLoop(x, SEWER_CINE_SHAFT_TOP + 100));

    // Ratas y mosquitos ambientales cruzando el conducto (decorativos, sin física).
    this.shaftRat1 = this.buildAmbientCreature(SEWER_CINE_SHAFT_X - 70, SEWER_CINE_SHAFT_TOP + 300, "ratMutant", 40);
    this.shaftRat2 = this.buildAmbientCreature(SEWER_CINE_SHAFT_X + 75, SEWER_CINE_SHAFT_TOP + 470, "ratMutant", 30);
    this.buildAmbientCreature(SEWER_CINE_SHAFT_X + 40, SEWER_CINE_SHAFT_TOP + 220, "mosquito", 60, true);

    // Suelo de la sala inferior.
    this.add.rectangle(SEWER_CINE_WIDTH / 2, SEWER_CINE_FLOOR_Y + 70, SEWER_CINE_WIDTH, 140, 0x141c14, 1).setDepth(0);
    for (let x = 0; x <= SEWER_CINE_WIDTH; x += 64) {
      this.add.image(x + 32, SEWER_CINE_FLOOR_Y + 32, "sewerFloor").setAlpha(0.9).setDepth(1);
    }

    // Pared del fondo con el mural (oculto hasta la Secuencia 4).
    this.add.rectangle(SEWER_CINE_MURAL_X, SEWER_CINE_MURAL_Y, 220, 240, 0x0a0f0a, 1).setDepth(1);
    this.muralArt = this.add.image(SEWER_CINE_MURAL_X, SEWER_CINE_MURAL_Y - 30, "cineMuralSilhouette").setDepth(2).setAlpha(0);
    this.muralCaption = this.add
      .text(SEWER_CINE_MURAL_X, SEWER_CINE_MURAL_Y + 90, "LARGA VIDA AL\nREY MALOLIENTE", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "14px",
        color: "#9be86b",
        align: "center",
        stroke: "#0a1a0a",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setAlpha(0);

    // Tubería grande que vibrará y soltará la nube verde (Secuencia 5).
    this.bigPipe = this.add.image(SEWER_CINE_PIPE_X, SEWER_CINE_PIPE_Y, "pipeBackground").setScale(0.65, 0.85).setAlpha(0.9).setDepth(2);

    // Ojos rojos en la oscuridad (ocultos hasta la Secuencia 6).
    this.redEyes = this.add.image(SEWER_CINE_EYES_X, SEWER_CINE_EYES_Y, "cineRedEyePair").setDepth(2).setAlpha(0);

    // Marlon: ya está a mitad de la escalera, listo para que la cámara lo encuentre.
    this.marlonX = SEWER_CINE_SHAFT_X;
    this.marlonY = SEWER_CINE_SHAFT_TOP + 560;
    this.marlonShadow = this.add.image(this.marlonX, SEWER_CINE_FLOOR_Y + 24, "cineShadow").setDepth(9).setAlpha(0);
    this.marlonBody = this.add.image(this.marlonX, this.marlonY, "playerBody").setScale(1.3).setDepth(10);
    this.marlonFace = this.add
      .image(this.marlonX, this.marlonY + PLAYER_HEAD_OFFSET_Y * 1.3, getPlayerFaceKey(this))
      .setDepth(11);
    this.marlonFace.setDisplaySize(PLAYER_HEAD_DIAMETER * 1.3, PLAYER_HEAD_DIAMETER * 1.3);
  }

  buildAmbientCreature(x, y, textureKey, range, floaty) {
    const sprite = this.add.image(x, y, textureKey).setDepth(4);
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

  spawnDripVisualLoop(x, topY) {
    const drip = this.add.image(x, topY, "waterDrip").setAlpha(0).setDepth(3);
    const loop = () => {
      if (this.skipped || this.finished || !drip.scene) return;
      drip.setPosition(x, topY).setAlpha(0.9);
      this.tweens.add({ targets: drip, y: topY + 500, duration: 900, onComplete: loop });
    };
    this.time.delayedCall(Phaser.Math.Between(0, 900), loop);
  }

  // ---------- MOVIMIENTO DE MARLON ----------
  climbMarlon(toY, duration) {
    const deltaY = toY - this.marlonY;
    const targets = [this.marlonBody, this.marlonFace];
    this.marlonY = toY;
    this.tweenTrack(this.tweens.add({ targets, y: "+=" + deltaY, duration, ease: "Sine.easeInOut" }));
    this.tweenTrack(
      this.tweens.add({ targets, angle: { from: -3, to: 3 }, duration: 220, yoyo: true, repeat: Math.floor(duration / 440) })
    );
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

  marlonJump() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], y: "-=20", duration: 150, yoyo: true, ease: "Quad.easeOut" })
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
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], scale: "*=1.15", duration: 250, yoyo: true, ease: "Back.easeOut" })
    );
  }

  tweenTrack(tween) {
    this.activeTimers.push({ remove: () => tween.stop() });
    return tween;
  }

  // ---------- EFECTOS DEL GOLPE (BOOM) ----------
  wobblePipes() {
    this.pipeSprites.forEach((p) => {
      this.tweenTrack(this.tweens.add({ targets: p, angle: { from: -2, to: 2 }, duration: 90, yoyo: true, repeat: 5 }));
    });
  }

  wobblePipe(pipe) {
    this.tweenTrack(this.tweens.add({ targets: pipe, angle: { from: -3, to: 3 }, duration: 100, yoyo: true, repeat: 4 }));
  }

  flickerLights() {
    this.blinkLights.forEach((light) => {
      this.tweenTrack(this.tweens.add({ targets: light, alpha: 0.05, duration: 70, yoyo: true, repeat: 5 }));
    });
  }

  spawnDustFall() {
    for (let i = 0; i < 6; i++) {
      const x = SEWER_CINE_SHAFT_X + Phaser.Math.Between(-60, 60);
      const mote = this.add.image(x, SEWER_CINE_SHAFT_TOP + 40, "cineDustMote").setAlpha(0.8).setDepth(5);
      this.tweenTrack(
        this.tweens.add({
          targets: mote,
          y: mote.y + Phaser.Math.Between(60, 140),
          alpha: 0,
          duration: Phaser.Math.Between(500, 800),
          onComplete: () => mote.destroy(),
        })
      );
    }
  }

  dimLighting() {
    this.tweenTrack(this.tweens.add({ targets: this.blinkLights, alpha: 0.2, duration: 500 }));
  }

  revealEyes() {
    this.redEyes.setAlpha(0);
    this.tweenTrack(
      this.tweens.add({
        targets: this.redEyes,
        alpha: 1,
        duration: 200,
        onComplete: () => {
          this.delay(350, () => {
            this.tweenTrack(this.tweens.add({ targets: this.redEyes, alpha: 0, duration: 250 }));
          });
        },
      })
    );
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

  // ---------- SECUENCIA COMPLETA (~20-25s) ----------
  runSequence() {
    let t = 0;
    const at = (gap, fn) => {
      t += gap;
      this.delay(t, fn);
    };
    const cam = this.cameras.main;

    // Silencio en negro + sonido ambiental (goteo, eco, tuberías).
    at(0, () => {
      this.pipeHum = startWindLoop(0.03);
      this.ambientPad = startChordPad([65, 98, 155], 0.025);
      this.dripSoundEvent = this.time.addEvent({
        delay: 1500,
        loop: true,
        callback: () => {
          if (!this.skipped) playWaterDrop();
        },
      });
    });

    // Fade in lento.
    at(200, () => {
      this.tweens.add({ targets: this.blackout, alpha: 0, duration: 1300, ease: "Sine.easeOut" });
    });

    // ---- SECUENCIA 1: Descenso (solo cámara, sin control del jugador) ----
    at(500, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollY: 430, duration: 2000, ease: "Sine.easeInOut" }));
    });

    // ---- SECUENCIA 2: Aparición de Marlon ----
    at(1600, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollY: SEWER_CINE_FLOOR_Y - 260, duration: 1600, ease: "Sine.easeInOut" }));
      this.climbMarlon(SEWER_CINE_FLOOR_Y - 40, 1600);
      this.tweenTrack(this.tweens.add({ targets: this.marlonShadow, alpha: 0.35, duration: 700, delay: 1000 }));
    });

    at(650, () => showDialogue(this, "Marlon", "Aquí abajo el olor es muchísimo peor...", 1300));
    at(1150, () => showDialogue(this, "Marlon", "¿Quién podría vivir en un lugar como este?", 1400));
    at(1050, () => this.marlonCoverNose());
    at(300, () => this.marlonLookAround());

    // ---- SECUENCIA 3: El gran golpe ----
    at(400, () => {
      playDeepBoom();
      cam.shake(320, 0.01);
      this.wobblePipes();
      this.flickerLights();
      this.spawnDustFall();
      if (this.shaftRat1) scatterFly(this, this.shaftRat1);
      if (this.shaftRat2) scatterFly(this, this.shaftRat2);
      this.marlonJump();
    });
    at(700, () => this.marlonLookAround());

    // ---- SECUENCIA 4: El mural ----
    at(500, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: 500, zoom: 1.15, duration: 1200, ease: "Sine.easeInOut" }));
      this.moveMarlonX(SEWER_CINE_MURAL_X - 90, 1200);
    });
    at(900, () => {
      this.tweens.add({ targets: [this.muralArt, this.muralCaption], alpha: 1, duration: 500 });
    });
    at(500, () => showDialogue(this, "Marlon", "¿Rey Maloliente...?", 1200));
    at(1300, () => showDialogue(this, "Marlon", "Pensé que era solo una leyenda.", 1400));

    // ---- SECUENCIA 5: La advertencia ----
    at(950, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: 560, zoom: 1.25, duration: 600, ease: "Sine.easeInOut" }));
      this.wobblePipe(this.bigPipe);
      playPipeClank();
    });
    at(700, () => {
      spawnRisingSmoke(this, SEWER_CINE_PIPE_X, SEWER_CINE_PIPE_Y - 20, "fartCloud", 0x4caf50);
      spawnRisingSmoke(this, SEWER_CINE_PIPE_X + 12, SEWER_CINE_PIPE_Y - 10, "steamPuff");
      playDeepBreathWithEcho();
      this.dimLighting();
    });
    at(700, () => {
      cam.shake(200, 0.005);
      showMysteriousLine(this, "Cada paso que das...", 1100);
      playDeepVoiceWithEcho();
    });
    at(1200, () => {
      cam.shake(180, 0.005);
      showMysteriousLine(this, "...te acerca a tu final.", 1300);
      playDeepVoiceWithEcho();
    });

    // ---- SECUENCIA 6: Los ojos ----
    at(1400, () => this.revealEyes());
    at(350, () => this.moveMarlonX(SEWER_CINE_MURAL_X - 150, 350));
    at(450, () => showDialogue(this, "Marlon", "Creo que ya no puedo dar marcha atrás...", 1400));
    at(1300, () => this.marlonHeroicPose());

    // ---- SECUENCIA 7: Inicio del nivel ----
    at(550, () => {
      this.tweenTrack(
        this.tweens.add({ targets: cam, scrollX: 0, scrollY: SEWER_CINE_FLOOR_Y - 260, zoom: 1, duration: 1000, ease: "Sine.easeInOut" })
      );
      this.moveMarlonX(SEWER_CINE_SHAFT_X, 1000);
      this.startLevelMusic();
    });
    at(1100, () => showTitleCard(this, "NIVEL 2", "ALCANTARILLAS", 1500));
    at(800, () => showObjectiveLine(this, "Desciende hacia el Reino Maloliente.", 1100));
    at(1200, () => showObjectiveLine(this, "Encuentra la salida.", 900));
    at(1000, () => showObjectiveLine(this, "Sobrevive a las criaturas mutantes.", 1000));
    at(1100, () => showObjectiveLine(this, "Sigue las pistas del Rey Maloliente.", 1000));

    at(1200, () => this.finish());
  }

  startLevelMusic() {
    if (this.ambientPad) this.ambientPad.stop(0.6);
    this.levelMusic = startChordPad([98, 123, 165, 196], 0.03);
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
    if (this.dripSoundEvent) this.dripSoundEvent.remove(false);
  }

  stopAllSound() {
    if (this.pipeHum) this.pipeHum.stop(0.2);
    if (this.ambientPad) this.ambientPad.stop(0.2);
    if (this.levelMusic) this.levelMusic.stop(0.2);
  }

  finish(fadeMs = 700) {
    if (this.finished) return;
    this.finished = true;
    this.stopAllSound();

    const save = loadSaveData();
    save.sewerIntroSeen = true;
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

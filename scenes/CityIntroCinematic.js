// Cinemática de apertura del Nivel 1 (Ciudad). Totalmente programada con
// Phaser (cámara, tweens, partículas, sonido sintetizado): sin video ni
// imágenes pesadas. Se puede saltar con ENTER/ESC en cualquier momento.
//
// Estructura pensada para reutilizarse: toda la maquinaria genérica
// (diálogos, barras de cine, partículas, skip) vive en cinematicHelpers.js
// y cinematicSound.js; futuras cinemáticas de otros niveles solo necesitan
// escribir su propia secuencia de beats como esta clase.

const CINE_WIDTH = 2000;
const CINE_HEIGHT = 540;
const CINE_GROUND_TOP = 476;

class CityIntroCinematic extends Phaser.Scene {
  constructor() {
    super("CityIntroCinematic");
  }

  init(data) {
    this.nextScene = (data && data.nextScene) || "CityScene";
  }

  preload() {
    generateGameTextures(this);
    generateCinematicTextures(this);
  }

  create() {
    this.skipped = false;
    this.finished = false;
    this.activeTimers = [];
    this.soundHandles = [];
    this.windHandle = null;
    this.flyLoopHandle = null;
    this.ambientMusic = null;
    this.levelMusic = null;

    const cam = this.cameras.main;
    cam.setBackgroundColor("#0a0a0f");
    this.physics.world.setBounds(0, 0, CINE_WIDTH, CINE_HEIGHT);
    cam.setBounds(0, 0, CINE_WIDTH, CINE_HEIGHT);
    cam.setZoom(1);
    cam.scrollX = 0;
    // Empezamos en negro con un rectángulo (no con cam.fadeIn) para poder
    // controlar el fade a mano igual que el resto de la secuencia, y para
    // reutilizarlo también como fundido de salida al terminar/saltar.
    this.blackout = this.add.rectangle(480, 270, 960, 540, 0x000000, 1).setScrollFactor(0).setDepth(300);

    this.buildWorld();

    this.skipTrigger = setupCinematicSkip(this, () => this.skip());

    this.runSequence();
  }

  // ---------- CONSTRUCCIÓN DEL ESCENARIO ----------
  buildWorld() {
    // Cielo/ambiente con un tinte apagado (luz tenue de atardecer sucio).
    this.cameras.main.setBackgroundColor("#4a5568");
    this.add.rectangle(CINE_WIDTH / 2, CINE_HEIGHT / 2, CINE_WIDTH, CINE_HEIGHT, 0x14141f, 0.18).setDepth(90);

    // Edificios con grafitis.
    const buildingXs = [80, 380, 700, 1020, 1340, 1650, 1950];
    buildingXs.forEach((x, i) => {
      this.add.image(x, CINE_GROUND_TOP + 10, "building").setOrigin(0.5, 1).setScale(1, 0.85 + (i % 3) * 0.15).setAlpha(0.9);
    });
    [150, 520, 900, 1250, 1600].forEach((x) => {
      const key = Phaser.Math.Between(0, 1) === 0 ? "cineGraffiti1" : "cineGraffiti2";
      this.add.image(x, CINE_GROUND_TOP - Phaser.Math.Between(40, 90), key).setAlpha(0.8);
    });

    // Calle.
    this.platforms = this.physics.add.staticGroup();
    for (let x = 0; x <= CINE_WIDTH; x += 64) {
      this.platforms.create(x + 32, CINE_GROUND_TOP + 32, "pavement");
    }

    // Basureros y bultos de basura.
    [220, 640, 1080, 1500, 1820].forEach((x) => {
      this.add.image(x, CINE_GROUND_TOP + 20, "cineTrashPile").setOrigin(0.5, 1);
    });

    // Alcantarilla pequeña (la del susto) y alcantarilla gigante (el jefe).
    this.add.image(300, CINE_GROUND_TOP + 6, "manhole").setScale(0.8).setDepth(2);
    this.sewerX = 1560;
    this.add.image(this.sewerX, CINE_GROUND_TOP + 10, "manhole").setScale(1.8).setDepth(2);
    this.sewerGlow = this.add.image(this.sewerX, CINE_GROUND_TOP - 10, "cineGlow").setScale(1.4).setAlpha(0).setDepth(3);

    // Vapor/humo saliendo de un par de rejillas del suelo.
    this.smokeSpots = [520, 1180];
    this.smokeEvent = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        this.smokeSpots.forEach((x) => spawnRisingSmoke(this, x, CINE_GROUND_TOP + 4, "steamPuff"));
      },
    });

    // Papeles arrastrados por el viento.
    this.paperEvent = this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => spawnBlowingPaper(this, -20, Phaser.Math.Between(CINE_GROUND_TOP - 200, CINE_GROUND_TOP - 20), CINE_WIDTH + 40),
    });

    // Moscas cerca de la basura.
    this.flies = [220, 640, 1500].map((x) => spawnFlyingFly(this, x, CINE_GROUND_TOP - 20, 26));

    // Enemigos ambientales (decorativos, sin física ni ataque).
    this.buildAmbientEnemy(760, CINE_GROUND_TOP - 8, "rat", 60);
    this.buildAmbientEnemy(940, 330, "pigeon", 80, true);
    this.buildAmbientEnemy(1180, 350, "mosquito", 70, true);

    // Marlon (representación visual, sin física: esto es una cinemática).
    this.marlonX = 120;
    this.marlonShadow = this.add.image(this.marlonX, CINE_GROUND_TOP + 26, "cineShadow").setDepth(9);
    this.marlonBody = this.add.image(this.marlonX, CINE_GROUND_TOP - 34, "playerBody").setScale(1.4).setDepth(10);
    this.marlonFace = this.add.image(this.marlonX, CINE_GROUND_TOP - 34 + PLAYER_HEAD_OFFSET_Y * 1.4, getPlayerFaceKey(this)).setDepth(11);
    this.marlonFace.setDisplaySize(PLAYER_HEAD_DIAMETER * 1.4, PLAYER_HEAD_DIAMETER * 1.4);
  }

  buildAmbientEnemy(x, y, textureKey, range, floaty) {
    const sprite = this.add.image(x, y, textureKey).setDepth(8);
    const dir = { v: 1 };
    const wander = () => {
      if (!sprite.active) return;
      this.tweens.add({
        targets: sprite,
        x: x + range * dir.v,
        duration: Phaser.Math.Between(1400, 2000),
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
      this.tweens.add({ targets: sprite, y: y + 12, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  moveMarlon(toX, duration) {
    const targets = [this.marlonBody, this.marlonFace];
    this.marlonBody.setFlipX(toX < this.marlonX);
    this.marlonFace.setFlipX(toX < this.marlonX);
    this.marlonX = toX;
    this.tweenTrack(
      this.tweens.add({ targets, x: toX, duration, ease: "Sine.easeInOut" })
    );
    this.tweenTrack(this.tweens.add({ targets: this.marlonShadow, x: toX, duration, ease: "Sine.easeInOut" }));
    // pequeño balanceo mientras camina
    this.tweenTrack(
      this.tweens.add({ targets, angle: { from: -3, to: 3 }, duration: 220, yoyo: true, repeat: Math.floor(duration / 440) })
    );
  }

  marlonLookAround() {
    this.tweenTrack(
      this.tweens.add({
        targets: [this.marlonBody, this.marlonFace],
        angle: { from: 0, to: -8 },
        duration: 260,
        yoyo: true,
        repeat: 3,
      })
    );
  }

  marlonJump() {
    this.tweenTrack(
      this.tweens.add({
        targets: [this.marlonBody, this.marlonFace],
        y: "-=22",
        duration: 160,
        yoyo: true,
        ease: "Quad.easeOut",
      })
    );
  }

  marlonHeroicPose() {
    this.tweenTrack(
      this.tweens.add({
        targets: [this.marlonBody, this.marlonFace],
        scale: "*=1.15",
        duration: 260,
        yoyo: true,
        ease: "Back.easeOut",
      })
    );
  }

  tweenTrack(tween) {
    this.activeTimers.push({ remove: () => tween.stop() });
    return tween;
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

  // ---------- SECUENCIA COMPLETA (~30s) ----------
  runSequence() {
    let t = 0;
    const at = (gap, fn) => {
      t += gap;
      this.delay(t, fn);
    };

    // Silencio en negro + ambiente sonoro.
    at(0, () => {
      this.windHandle = startWindLoop(0.045);
    });
    at(600, () => playDogBark());
    at(400, () => {
      this.flyLoopHandle = startFlyBuzzLoop(0.02);
    });
    at(300, () => {
      this.ambientMusic = startChordPad([98, 147, 233], 0.035); // pad grave de ciudad
    });

    // Fade in lento sobre la ciudad.
    at(300, () => {
      this.tweens.add({ targets: this.blackout, alpha: 0, duration: 1600, ease: "Sine.easeOut" });
    });

    // Paneo lento inicial mostrando la ciudad.
    at(1300, () => {
      this.tweenTrack(this.tweens.add({ targets: this.cameras.main, scrollX: 220, duration: 3200, ease: "Sine.easeInOut" }));
    });

    // Título del nivel.
    at(700, () => showTitleCard(this, "CIUDAD", "NIVEL 1", 2000));

    // Marlon entra caminando desde la izquierda.
    at(1600, () => this.moveMarlon(300, 2400));
    at(300, () => this.marlonLookAround());

    // Ruido fuerte de la alcantarilla + susto.
    at(1300, () => {
      playLoudSewerNoise();
      this.cameras.main.shake(180, 0.006);
      this.marlonJump();
    });

    // Sigue caminando un poco más y la cámara hace zoom sobre él.
    at(600, () => this.moveMarlon(430, 1400));
    at(600, () => {
      this.tweenTrack(this.tweens.add({ targets: this.cameras.main, zoom: 1.15, scrollX: 60, duration: 900, ease: "Sine.easeInOut" }));
    });

    // Diálogo 1.
    at(800, () => showDialogue(this, "Marlon", "Dicen que aquí empezó todo...", 2000));

    // La cámara sigue avanzando, mostrando enemigos ambientales.
    at(1300, () => {
      this.tweenTrack(this.tweens.add({ targets: this.cameras.main, zoom: 1, scrollX: 620, duration: 3000, ease: "Sine.easeInOut" }));
    });

    // Diálogo 2 (dos líneas).
    at(1400, () => showDialogue(this, "Marlon", "Qué olor tan horrible...", 1600));
    at(1500, () => showDialogue(this, "Marlon", "...algo muy grande debe estar escondido aquí.", 2000));

    // La cámara enfoca la alcantarilla gigante.
    at(1300, () => {
      this.tweenTrack(
        this.tweens.add({ targets: this.cameras.main, scrollX: this.sewerX - 480, zoom: 1.1, duration: 2000, ease: "Sine.easeInOut" })
      );
    });

    // Nube verde + temblor + risa con eco.
    at(1700, () => {
      for (let i = 0; i < 3; i++) {
        this.delay(i * 260, () => spawnRisingSmoke(this, this.sewerX, CINE_GROUND_TOP - 4, "attackCloud", 0x4caf50));
      }
      this.tweens.add({ targets: this.sewerGlow, alpha: 1, duration: 500, yoyo: true, repeat: 3 });
      this.cameras.main.shake(260, 0.008);
      playDeepLaughWithEcho();
    });

    // Voz misteriosa.
    at(600, () => showMysteriousLine(this, "Pronto conocerás...", 1500));
    at(1300, () => showMysteriousLine(this, "...al Rey Maloliente...", 1800));

    // Clímax: temblor fuerte, moscas huyen, música sube y luego silencio.
    at(1400, () => {
      this.cameras.main.shake(420, 0.012);
      this.flies.forEach((fly) => scatterFly(this, fly));
      if (this.ambientMusic) this.ambientMusic.setVolume(0.09, 0.2);
    });
    at(600, () => {
      if (this.ambientMusic) this.ambientMusic.setVolume(0, 0.8);
      if (this.windHandle) this.windHandle.stop(0.8);
      if (this.flyLoopHandle) this.flyLoopHandle.stop(0.6);
    });

    // La cámara vuelve sobre Marlon.
    at(800, () => {
      this.tweenTrack(
        this.tweens.add({ targets: this.cameras.main, scrollX: 0, zoom: 1, duration: 1400, ease: "Sine.easeInOut" })
      );
    });

    // Marlon mira la alcantarilla, sonríe y decide bajar.
    at(1200, () => this.marlonLookAround());
    at(800, () => showDialogue(this, "Marlon", "Pues habrá que bajar...", 1900));
    at(500, () => this.marlonHeroicPose());
    at(600, () => {
      this.tweenTrack(this.tweens.add({ targets: this.cameras.main, zoom: 1.1, duration: 700, ease: "Sine.easeOut" }));
      this.startLevelMusic();
    });

    // Tarjeta de objetivos.
    at(700, () => showObjectiveLine(this, "OBJETIVO", 1000));
    at(1000, () => showObjectiveLine(this, "Encuentra la entrada al Reino Maloliente.", 1600));
    at(1300, () => showObjectiveLine(this, "Derrota a los enemigos.", 1200));
    at(1000, () => showObjectiveLine(this, "Recolecta monedas.", 1200));
    at(1000, () => showObjectiveLine(this, "Sobrevive.", 1200));

    // Fin: fundido a negro y arranca el nivel de verdad.
    at(1200, () => this.finish());
  }

  startLevelMusic() {
    if (this.ambientMusic) this.ambientMusic.stop(0.6);
    this.levelMusic = startChordPad([131, 165, 196, 262], 0.03);
    this.delay(1200, () => {
      if (this.levelMusic) this.levelMusic.stop(1.2);
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
        // el temporizador ya pudo haberse completado; no pasa nada
      }
    });
    this.activeTimers = [];
    this.tweens.killAll();
  }

  stopAllSound() {
    if (this.windHandle) this.windHandle.stop(0.2);
    if (this.flyLoopHandle) this.flyLoopHandle.stop(0.2);
    if (this.ambientMusic) this.ambientMusic.stop(0.2);
    if (this.levelMusic) this.levelMusic.stop(0.2);
  }

  finish(fadeMs = 700) {
    if (this.finished) return;
    this.finished = true;
    this.stopAllSound();
    this.tweens.add({
      targets: this.blackout,
      alpha: 1,
      duration: fadeMs,
      ease: "Sine.easeIn",
      onComplete: () => this.scene.start(this.nextScene),
    });
  }
}

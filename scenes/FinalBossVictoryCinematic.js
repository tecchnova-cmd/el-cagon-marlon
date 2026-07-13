// Cinemática final de victoria (tras el 5º impacto en FinalBossScene). El
// Rey Maloliente colapsa y es absorbido por su propia descarga, su corona
// cae, Marlon la recupera y conserva oficialmente el título de "Cagón
// Número Uno", seguido de una celebración absurda y una última llamada del
// científico del laboratorio. Termina en la pantalla de resultados
// (VictoryScene), que ya existía y aquí solo recibe las estadísticas.
//
// Mismo motor de cinemáticas que los niveles anteriores (cinematicHelpers.js
// / cinematicSound.js). Se puede saltar con ENTER/ESC: aun así se guarda la
// victoria, las estadísticas (viven en el registry y no se tocan aquí) y se
// va directo a la pantalla de resultados, sin reiniciar la batalla.

const VBOSS_CINE_WIDTH = 1300;
const VBOSS_CINE_HEIGHT = 540;
const VBOSS_CINE_GROUND_TOP = 476;
const VBOSS_CINE_THRONE_X = 700;

class FinalBossVictoryCinematic extends Phaser.Scene {
  constructor() {
    super("FinalBossVictoryCinematic");
  }

  init(data) {
    this.finalScore = (data && data.score) || 0;
  }

  preload() {
    generateGameTextures(this);
    generateCinematicTextures(this);
    generateFinalBossCinematicTextures(this);
  }

  create() {
    this.skipped = false;
    this.finished = false;
    this.activeTimers = [];
    this.ambientPad = null;
    this.victoryMusic = null;
    this.confettiEvent = null;

    const cam = this.cameras.main;
    cam.setBackgroundColor("#140c14");
    cam.setBounds(0, 0, VBOSS_CINE_WIDTH, VBOSS_CINE_HEIGHT);
    cam.setZoom(1);
    cam.scrollX = 0;
    cam.scrollY = 0;

    this.blackout = this.add.rectangle(480, 270, 960, 540, 0x000000, 0).setScrollFactor(0).setDepth(300);

    this.buildWorld();
    this.skipTrigger = setupCinematicSkip(this, () => this.skip());
    this.runSequence();
  }

  // ---------- CONSTRUCCIÓN DEL ESCENARIO ----------
  buildWorld() {
    this.add.rectangle(VBOSS_CINE_WIDTH / 2, VBOSS_CINE_HEIGHT / 2, VBOSS_CINE_WIDTH, VBOSS_CINE_HEIGHT, 0x1c1220, 1).setDepth(-10);

    for (let x = 0; x <= VBOSS_CINE_WIDTH; x += 64) {
      this.add.image(x + 32, VBOSS_CINE_GROUND_TOP + 32, "castleFloor").setAlpha(0.9).setDepth(1);
    }
    [300, 1080].forEach((x) => {
      const torch = this.add.image(x, VBOSS_CINE_GROUND_TOP - 60, "castleTorch").setDepth(1).setAlpha(0.5);
      this.tweens.add({ targets: torch, alpha: 0.75, duration: 350, yoyo: true, repeat: -1 });
      this.torches = (this.torches || []).concat(torch);
    });

    // Trono + Rey Maloliente (ya golpeado, listo para colapsar).
    this.throneBack = this.add.rectangle(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP - 170, 140, 220, 0x2a2030, 1).setDepth(2);
    this.bossCape = this.add.image(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP - 150, "cineCape").setScale(1.8).setDepth(3);
    this.bossSprite = this.add.image(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP - 150, "bossToilet").setScale(1.6).setDepth(4).setTint(0xffaaaa);
    this.bossCrown = this.add.image(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP - 260, "cineCrown").setScale(1.3).setAngle(-6).setDepth(5);
    this.bossMedals = [-24, 0, 24].map((dx) => this.add.image(VBOSS_CINE_THRONE_X + dx, VBOSS_CINE_GROUND_TOP - 110, "cineMedal").setScale(1.1).setDepth(5));

    // Desagüe donde el Rey será absorbido.
    this.drain = this.add.ellipse(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP + 26, 60, 18, 0x0a0a0a, 0.9).setDepth(1);

    // Pantallas de propaganda (fallarán en la Escena 4).
    this.propScreens = [VBOSS_CINE_THRONE_X - 260, VBOSS_CINE_THRONE_X + 260].map((x) =>
      this.add.rectangle(x, VBOSS_CINE_GROUND_TOP - 220, 100, 70, 0x02131a, 0.9).setStrokeStyle(2, 0x2fb8d9, 0.8).setDepth(2)
    );

    // Pantalla pequeña del científico (Escena 7).
    this.scientistScreen = this.add.rectangle(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP - 230, 70, 50, 0x02131a, 0.92).setStrokeStyle(2, 0x2fb8d9, 0.85).setDepth(2).setAlpha(0);
    this.scientistSilhouette = this.add.image(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP - 244, "cineSilhouette").setScale(0.6).setDepth(3).setAlpha(0);

    // Corona voladora (tras la descarga) y corona puesta en Marlon.
    this.flyingCrown = this.add.image(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP - 150, "cineCrown").setScale(1).setDepth(20).setAlpha(0);
    this.wornCrown = null;

    // Marlon.
    this.marlonX = VBOSS_CINE_THRONE_X - 220;
    this.marlonY = VBOSS_CINE_GROUND_TOP - 34;
    this.marlonShadow = this.add.image(this.marlonX, VBOSS_CINE_GROUND_TOP + 24, "cineShadow").setDepth(9).setAlpha(0.4);
    this.marlonBody = this.add.image(this.marlonX, this.marlonY, "playerBody").setScale(1.3).setDepth(10);
    this.marlonFace = this.add
      .image(this.marlonX, this.marlonY + PLAYER_HEAD_OFFSET_Y * 1.3, getPlayerFaceKey(this))
      .setDepth(11);
    this.marlonFace.setDisplaySize(PLAYER_HEAD_DIAMETER * 1.3, PLAYER_HEAD_DIAMETER * 1.3);
  }

  // ---------- MOVIMIENTO DE MARLON ----------
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

  marlonHeroicPose() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], scale: "*=1.2", duration: 300, yoyo: true, ease: "Back.easeOut" })
    );
  }

  marlonSitThenStandUp() {
    this.tweenTrack(this.tweens.add({ targets: [this.marlonBody, this.marlonFace], y: "+=10", scaleY: "*=0.9", duration: 250, yoyo: true }));
  }

  tweenTrack(tween) {
    this.activeTimers.push({ remove: () => tween.stop() });
    return tween;
  }

  // ---------- EFECTOS ----------
  bossTremble() {
    this.tweenTrack(this.tweens.add({ targets: [this.bossSprite, this.bossCape], angle: { from: -3, to: 3 }, duration: 90, yoyo: true, repeat: 6 }));
  }

  bossSparksAndSteam() {
    for (let i = 0; i < 4; i++) {
      const x = VBOSS_CINE_THRONE_X + Phaser.Math.Between(-40, 40);
      const y = VBOSS_CINE_GROUND_TOP - 150 + Phaser.Math.Between(-40, 40);
      const spark = this.add.image(x, y, "cineSpark").setDepth(6);
      this.tweenTrack(this.tweens.add({ targets: spark, alpha: 0, y: y - 20, duration: 400, onComplete: () => spark.destroy() }));
    }
    spawnRisingSmoke(this, VBOSS_CINE_THRONE_X + 50, VBOSS_CINE_GROUND_TOP - 180, "steamPuff");
    playElectricZap();
  }

  bossAbsorb() {
    playSuctionSound();
    this.tweenTrack(
      this.tweens.add({
        targets: [this.bossSprite, this.bossCape, this.bossMedals].flat(),
        y: "+=140",
        scale: 0,
        angle: 360,
        alpha: 0,
        duration: 1400,
        ease: "Cubic.easeIn",
      })
    );
    this.tweenTrack(this.tweens.add({ targets: this.bossCrown, alpha: 0, duration: 300, delay: 200 }));
  }

  launchCrown() {
    this.flyingCrown.setPosition(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP - 150).setAlpha(1).setAngle(0);
    this.tweenTrack(
      this.tweens.add({ targets: this.flyingCrown, y: VBOSS_CINE_GROUND_TOP - 280, angle: 260, duration: 550, ease: "Quad.easeOut" })
    );
    this.tweenTrack(
      this.tweens.add({
        targets: this.flyingCrown,
        x: this.marlonX + 10,
        y: this.marlonY - 40,
        angle: 500,
        duration: 700,
        delay: 550,
        ease: "Quad.easeIn",
      })
    );
  }

  pickUpCrown() {
    this.flyingCrown.setAlpha(0);
    this.wornCrown = this.add.image(this.marlonX, this.marlonY - 42, "cineCrown").setScale(0.9).setDepth(12).setAngle(-4);
    this.tweenTrack(this.tweens.add({ targets: this.wornCrown, y: "+=8", duration: 300, ease: "Bounce.easeOut" }));
  }

  startCelebration() {
    const { width } = this.scale;
    const colors = [0xe63946, 0xffd93d, 0x4ad9d9, 0x5aff5a, 0xffffff];
    this.confettiEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const piece = this.add
          .image(Phaser.Math.Between(0, width), -10, Phaser.Math.Between(0, 1) === 0 ? "confettiPiece" : "cineFirework")
          .setScrollFactor(0)
          .setTint(Phaser.Utils.Array.GetRandom(colors))
          .setDepth(60)
          .setScale(Phaser.Math.FloatBetween(0.8, 1.5));
        this.tweens.add({
          targets: piece,
          y: this.scale.height + 20,
          x: piece.x + Phaser.Math.Between(-60, 60),
          angle: Phaser.Math.Between(180, 720),
          duration: Phaser.Math.Between(1600, 2600),
          onComplete: () => piece.destroy(),
        });
      },
    });
    this.tweenTrack(this.tweens.add({ targets: this.torches, tint: 0xffd93d, duration: 500 }));
    playPartyPop();
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

    at(0, () => {
      this.ambientPad = startChordPad([87, 110, 165], 0.02);
    });

    // ---- SECUENCIA 1: Quinto impacto ----
    at(300, () => {
      cam.shake(300, 0.012);
      this.bossTremble();
    });
    at(700, () => showMysteriousLine(this, "No... Esto no puede ser...", 2200));
    at(4900, () => showDialogue(this, "Marlon", "Sí puede. Acaba de pasar.", 2100));

    // ---- SECUENCIA 2: Colapso del Rey ----
    at(4900, () => {
      this.bossTremble();
      this.bossSparksAndSteam();
      showMysteriousLine(this, "¡Yo soy el Cagón Supremo!", 2100);
    });
    at(4900, () => showDialogue(this, "Marlon", "Autoproclamado.", 1900));
    at(4900, () => {
      this.bossTremble();
      showMysteriousLine(this, "¡Yo controlo este reino!", 2000);
    });
    at(4900, () => showDialogue(this, "Marlon", "Por eso está todo dañado.", 2000));
    at(4900, () => {
      this.bossTremble();
      showMysteriousLine(this, "¡Yo tengo la corona!", 1900);
    });
    at(4900, () => showDialogue(this, "Marlon", "Y yo tengo puntería.", 1900));
    at(4900, () => {
      this.bossSparksAndSteam();
      playSoftThud();
    });
    at(700, () => showDialogue(this, "Marlon", "Impresionante.", 1900));

    // ---- SECUENCIA 3: La descarga final ----
    at(4900, () => {
      cam.shake(200, 0.006);
      showMysteriousLine(this, "¡No pueden quitarme mi título!", 2200);
    });
    at(4900, () => showDialogue(this, "Marlon", "No te lo están quitando.\nNunca fue tuyo.", 2400));
    at(4900, () => {
      cam.shake(420, 0.014);
      this.bossAbsorb();
      playDeepBoom();
    });
    at(1700, () => this.launchCrown());
    at(1300, () => this.pickUpCrown());
    at(400, () => {
      const bubble = this.add.image(VBOSS_CINE_THRONE_X, VBOSS_CINE_GROUND_TOP + 20, "steamPuff").setScale(0.4).setDepth(2);
      this.tweenTrack(this.tweens.add({ targets: bubble, scale: 0.9, alpha: 0, duration: 500, onComplete: () => bubble.destroy() }));
      playElectricZap();
    });

    // ---- SECUENCIA 4: Destrucción de la propaganda ----
    at(1200, () => {
      this.tweenTrack(this.tweens.add({ targets: this.propScreens, strokeAlpha: 0.3, duration: 200, yoyo: true, repeat: 4 }));
      playStaticCrackle();
      showScreenText(
        this,
        VBOSS_CINE_THRONE_X,
        VBOSS_CINE_GROUND_TOP - 220,
        ['"EL REY NUNCA PIERDE"', '-> "EL REY ACABA DE PERDER"', "", '"100% APOYA AL REY"', '-> "0% DISPONIBLE"'],
        4900,
        { width: 260, lineHeight: 15, fontSize: "10px" }
      );
    });
    at(4900, () =>
      showMysteriousLine(this, "Actualización del sistema.\nRey Maloliente: derrotado.", 2600)
    );
    at(4900, () =>
      showMysteriousLine(
        this,
        "Propaganda oficial: suspendida por falta de autoridad.\nImpuesto por descarga: eliminado.\nBaños del reino: temporalmente gratuitos.",
        3400
      )
    );
    at(4900, () => showDialogue(this, "Marlon", "Eso sí es una reforma.", 2000));

    // ---- SECUENCIA 5: Recuperación del título ----
    at(4900, () => showDialogue(this, "Marlon", "Mucho mejor.", 1800));
    at(4900, () => {
      this.startCelebration();
      showTitleCard(this, "MARLON CONSERVA SU TÍTULO", "CAGÓN NÚMERO UNO", 2600);
    });

    // ---- SECUENCIA 6: Discurso de victoria ----
    at(4900, () => {
      this.moveMarlonX(VBOSS_CINE_THRONE_X, 900);
    });
    at(1100, () => this.marlonSitThenStandUp());
    at(500, () => showDialogue(this, "Marlon", "No. Ahí no me siento.", 1900));
    at(4900, () => this.moveMarlonX(VBOSS_CINE_THRONE_X - 120, 700));
    at(800, () =>
      showDialogue(
        this,
        "Marlon",
        "Después de seis niveles... Cientos de enemigos...\nCinco impactos perfectos... y demasiado olor...",
        3200
      )
    );
    at(4900, () => showDialogue(this, "Marlon", "Mi título sigue conmigo.", 2000));
    at(4900, () => {
      this.marlonHeroicPose();
      playPartyPop();
      showDialogue(this, "Marlon", "¡Marlon, el Cagón Número Uno!", 2200);
    });
    at(4900, () => showDialogue(this, "Marlon", "Pero que quede claro...\nA mí nadie me va a obligar a cagar en un baño.", 2700));
    at(4900, () => showDialogue(this, "Marlon", "Las piscinas ajenas siguen siendo territorio libre.", 2400));
    at(4900, () => showDialogue(this, "Marlon", "Y los árboles de Navidad... que se preparen.", 2200));

    // ---- SECUENCIA 7: Remate final ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: [this.scientistScreen, this.scientistSilhouette], alpha: 1, duration: 400 }));
      playStaticCrackle();
    });
    at(1200, () => showDialogue(this, "Científico", "Felicidades, Marlon. Has salvado el reino.", 2400));
    at(4900, () => showDialogue(this, "Marlon", "¿Hay recompensa?", 1900));
    at(4900, () => showDialogue(this, "Científico", "Sí. Un baño real completamente nuevo.", 2200));
    at(4900, () => showDialogue(this, "Marlon", "¿No escuchaste nada de lo que acabo de decir?", 2400));
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: [this.scientistScreen, this.scientistSilhouette], alpha: 0, duration: 300 }));
    });
    at(500, () => showMysteriousLine(this, "¡Encontraron algo en la piscina del palacio!", 2400));
    at(4900, () => {
      this.marlonLookAround();
      showDialogue(this, "Marlon", "No pueden probar que fui yo.", 2200);
    });

    // Freeze frame breve antes de ir a resultados.
    at(4900, () => {
      this.tweens.killTweensOf([this.marlonBody, this.marlonFace]);
    });
    at(1200, () => this.finish());
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
    if (this.confettiEvent) this.confettiEvent.remove(false);
  }

  stopAllSound() {
    if (this.ambientPad) this.ambientPad.stop(0.2);
    if (this.victoryMusic) this.victoryMusic.stop(0.2);
  }

  // Guarda la victoria (y las estadísticas ya acumuladas en el registry)
  // pase lo que pase: tanto si la cinemática se ve completa como si se salta.
  finish(fadeMs = 500) {
    if (this.finished) return;
    this.finished = true;
    this.stopAllSound();

    const save = loadSaveData();
    save.finalVictorySeen = true;
    save.gameCompleted = true;
    save.currentScore = this.finalScore;
    writeSaveData(save);

    this.tweens.add({
      targets: this.blackout,
      alpha: 1,
      duration: fadeMs,
      ease: "Sine.easeIn",
      onComplete: () => this.scene.start("VictoryScene", { score: this.finalScore }),
    });
  }
}

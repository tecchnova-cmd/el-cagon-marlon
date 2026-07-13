// Cinemática de apertura del Nivel 4 (Laboratorio). Continúa justo después
// del Nivel 3: Marlon se abre paso a patadas por la puerta oxidada del
// laboratorio abandonado y descubre que el Rey Maloliente fue creado ahí
// ("PROYECTO R.M."), con una grabación de un científico, un plano incompleto
// del jefe, y finalmente contacto directo con la voz del Rey Maloliente
// antes de que un mutante escape de un tanque roto.
//
// Mismo motor de cinemáticas que City/Sewer/ToxicForestIntroCinematic.js
// (cinematicHelpers.js / cinematicSound.js): cámara, tweens, sonido
// sintetizado, sin video. Se puede saltar con ENTER/ESC en cualquier momento.

const LAB_CINE_WIDTH = 1700;
const LAB_CINE_HEIGHT = 540;
const LAB_CINE_GROUND_TOP = 476;
const LAB_CINE_DOOR_X = 130;
const LAB_CINE_TABLE_X = 400;
const LAB_CINE_SCREEN_X = 700;
const LAB_CINE_RECORDING_X = 1020;
const LAB_CINE_TANK_X = 1360;

class LaboratoryIntroCinematic extends Phaser.Scene {
  constructor() {
    super("LaboratoryIntroCinematic");
  }

  init(data) {
    this.nextScene = (data && data.nextScene) || "LaboratoryScene";
  }

  preload() {
    generateGameTextures(this);
    generateCinematicTextures(this);
    generateLabCinematicTextures(this);
  }

  create() {
    this.skipped = false;
    this.finished = false;
    this.activeTimers = [];
    this.machineHum = null;
    this.ambientPad = null;
    this.levelMusic = null;
    this.alarmEvent = null;
    this.dripEvent = null;

    const cam = this.cameras.main;
    cam.setBackgroundColor("#0a0d12");
    cam.setBounds(0, 0, LAB_CINE_WIDTH, LAB_CINE_HEIGHT);
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
    this.add.rectangle(LAB_CINE_WIDTH / 2, LAB_CINE_HEIGHT / 2, LAB_CINE_WIDTH, LAB_CINE_HEIGHT, 0x141b24, 1).setDepth(-10);

    // Suelo del laboratorio.
    for (let x = 0; x <= LAB_CINE_WIDTH; x += 64) {
      this.add.image(x + 32, LAB_CINE_GROUND_TOP + 32, "labFloor").setAlpha(0.9).setDepth(1);
    }

    // Puerta metálica cubierta de raíces, con el símbolo del proyecto.
    this.door = this.add.image(LAB_CINE_DOOR_X, LAB_CINE_GROUND_TOP - 55, "timedDoorClosed").setScale(2.1).setDepth(3).setTint(0x8a8f95);
    this.doorSymbol = this.add.image(LAB_CINE_DOOR_X, LAB_CINE_GROUND_TOP - 90, "cineMuralSilhouette").setScale(0.32).setDepth(4);
    this.doorLabel = this.add
      .text(LAB_CINE_DOOR_X, LAB_CINE_GROUND_TOP - 40, "PROYECTO R.M.", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffd93d",
      })
      .setOrigin(0.5)
      .setDepth(4);
    [-30, 30].forEach((dx) => {
      this.add.image(LAB_CINE_DOOR_X + dx, LAB_CINE_GROUND_TOP - 30, "thornPatch").setTint(0x3a6b3a).setAlpha(0.85).setDepth(2);
    });

    // Tubos con líquido verde (fondo).
    [520, 850, 1150, 1450].forEach((x) => {
      const tube = this.add.image(x, LAB_CINE_GROUND_TOP - 55, "testTube").setScale(3.2).setAlpha(0.8).setDepth(1).setTint(0x6fcf3a);
      this.tweens.add({ targets: tube, alpha: 0.5, duration: Phaser.Math.Between(1200, 1800), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    });

    // Computadoras parpadeantes de fondo.
    this.backgroundComputers = [300, 620, 900, 1200, 1500].map((x) => {
      const comp = this.add.image(x, LAB_CINE_GROUND_TOP - 70, "labComputer").setAlpha(0.75).setDepth(1);
      this.tweens.add({ targets: comp, alpha: 0.35, duration: Phaser.Math.Between(500, 1000), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      return comp;
    });

    // Robots desactivados, papeles, huellas de agua, papel higiénico "científico".
    this.add.image(560, LAB_CINE_GROUND_TOP - 10, "robotVacuum").setTint(0x555555).setAlpha(0.85).setDepth(2);
    this.add.image(1230, LAB_CINE_GROUND_TOP - 15, "labMutant").setTint(0x444444).setAlpha(0.7).setAngle(12).setDepth(2);
    [250, 470, 780, 1080].forEach((x) => {
      this.add.image(x, LAB_CINE_GROUND_TOP + 20, "cinePaper").setTint(0xd8d8c8).setAngle(Phaser.Math.Between(-30, 30)).setDepth(1);
    });
    [340, 640, 960].forEach((x) => this.add.image(x, LAB_CINE_GROUND_TOP + 26, "cineFootprint").setAlpha(0.5).setDepth(1));
    [430, 450].forEach((x, i) => this.add.image(x, LAB_CINE_GROUND_TOP + 10, "toiletPaper").setScale(1.4).setDepth(2).setAngle(i * 20));

    // Bata de científico abandonada (forma simple).
    this.add.rectangle(300, LAB_CINE_GROUND_TOP + 22, 26, 10, 0xe8e8e8, 0.85).setDepth(1);

    // Mesa con frascos ("Extracto concentrado de frijol").
    this.add.rectangle(LAB_CINE_TABLE_X, LAB_CINE_GROUND_TOP - 6, 70, 10, 0x3a3f4a, 1).setDepth(2);
    [-18, 0, 18].forEach((dx) => {
      this.add.image(LAB_CINE_TABLE_X + dx, LAB_CINE_GROUND_TOP - 18, "testTube").setScale(1.4).setTint(0x9be86b).setDepth(3);
    });

    // Pantalla principal (contenido dinámico vía showScreenText).
    this.mainScreen = this.add.rectangle(LAB_CINE_SCREEN_X, LAB_CINE_GROUND_TOP - 110, 150, 100, 0x02131a, 0.95).setStrokeStyle(3, 0x2fb8d9, 0.9).setDepth(3).setAlpha(0);
    this.blueprintImg = this.add.image(LAB_CINE_SCREEN_X + 46, LAB_CINE_GROUND_TOP - 130, "cineBlueprint").setScale(0.6).setDepth(4).setAlpha(0);

    // Computadora antigua con la grabación del científico.
    this.recordingComputer = this.add.image(LAB_CINE_RECORDING_X, LAB_CINE_GROUND_TOP - 55, "labComputer").setScale(1.3).setDepth(3);
    this.scientistSilhouette = this.add.image(LAB_CINE_RECORDING_X, LAB_CINE_GROUND_TOP - 75, "cineSilhouette").setScale(1.1).setDepth(4).setAlpha(0);

    // Tanque de experimentación (se agrieta en la Escena 7).
    this.tank = this.add.rectangle(LAB_CINE_TANK_X, LAB_CINE_GROUND_TOP - 60, 60, 110, 0x3a5f3a, 0.35).setStrokeStyle(3, 0x8fae86, 0.8).setDepth(2);
    this.tankShadow = this.add.image(LAB_CINE_TANK_X, LAB_CINE_GROUND_TOP - 60, "cineSilhouette").setScale(1.6).setTint(0x6fcf3a).setAlpha(0).setDepth(2);

    // Ojos rojos que aparecerán en TODOS los monitores en la Escena 6.
    this.screenEyes = this.backgroundComputers.map((comp) =>
      this.add.image(comp.x, comp.y, "cineRedEyePair").setScale(0.6).setDepth(2).setAlpha(0)
    );

    // Marlon: entra caminando desde fuera de cuadro, a la izquierda de la puerta.
    this.marlonX = LAB_CINE_DOOR_X - 90;
    this.marlonY = LAB_CINE_GROUND_TOP - 34;
    this.marlonShadow = this.add.image(this.marlonX, LAB_CINE_GROUND_TOP + 24, "cineShadow").setDepth(9).setAlpha(0.4);
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

  marlonBump() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], x: "+=6", duration: 90, yoyo: true, repeat: 2 })
    );
  }

  marlonStumble() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], angle: { from: 0, to: 14 }, duration: 180, yoyo: true })
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

  marlonJump() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], y: "-=18", duration: 150, yoyo: true, ease: "Quad.easeOut" })
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

  // ---------- EFECTOS DEL LABORATORIO ----------
  kickDoorOpen() {
    this.tweenTrack(this.tweens.add({ targets: [this.door, this.doorSymbol, this.doorLabel], angle: 70, x: "+=30", alpha: 0.3, duration: 350, ease: "Cubic.easeOut" }));
    for (let i = 0; i < 5; i++) {
      const mote = this.add.image(LAB_CINE_DOOR_X, LAB_CINE_GROUND_TOP - 20, "cineDustMote").setDepth(5);
      this.tweenTrack(
        this.tweens.add({ targets: mote, x: mote.x + Phaser.Math.Between(-30, 30), y: mote.y - Phaser.Math.Between(20, 50), alpha: 0, duration: 500, onComplete: () => mote.destroy() })
      );
    }
  }

  doorSlamShut() {
    this.tweenTrack(this.tweens.add({ targets: [this.door, this.doorSymbol, this.doorLabel], angle: 0, x: LAB_CINE_DOOR_X, alpha: 1, duration: 220, ease: "Cubic.easeIn" }));
  }

  flickerBackgroundComputers() {
    this.backgroundComputers.forEach((comp) => {
      this.tweenTrack(this.tweens.add({ targets: comp, alpha: 0.1, duration: 80, yoyo: true, repeat: 5 }));
    });
  }

  revealBossEyesOnScreens() {
    this.tweenTrack(this.tweens.add({ targets: this.screenEyes, alpha: 1, duration: 400 }));
  }

  hideBossEyesOnScreens() {
    this.tweenTrack(this.tweens.add({ targets: this.screenEyes, alpha: 0, duration: 300 }));
  }

  sparkBurst(x, y) {
    for (let i = 0; i < 5; i++) {
      const spark = this.add.image(x, y, "cineSpark").setDepth(6);
      const angle = Phaser.Math.Between(0, 360);
      const dist = Phaser.Math.Between(16, 40);
      this.tweenTrack(
        this.tweens.add({
          targets: spark,
          x: x + Math.cos(Phaser.Math.DegToRad(angle)) * dist,
          y: y + Math.sin(Phaser.Math.DegToRad(angle)) * dist,
          alpha: 0,
          duration: 350,
          onComplete: () => spark.destroy(),
        })
      );
    }
  }

  crackTank() {
    this.tweenTrack(this.tweens.add({ targets: this.tank, angle: { from: -1, to: 1 }, duration: 90, yoyo: true, repeat: 6 }));
    spawnRisingSmoke(this, LAB_CINE_TANK_X, LAB_CINE_GROUND_TOP - 30, "toxicFog");
    this.tweenTrack(this.tweens.add({ targets: this.tankShadow, alpha: 0.8, duration: 400, yoyo: true, repeat: 3 }));
  }

  breakTank() {
    playGameSound(this, SOUND_KEYS.glassBreak);
    for (let i = 0; i < 6; i++) {
      const shard = this.add.image(LAB_CINE_TANK_X, LAB_CINE_GROUND_TOP - 60, "glassShard").setDepth(6);
      const angle = Phaser.Math.Between(0, 360);
      const dist = Phaser.Math.Between(20, 50);
      this.tweenTrack(
        this.tweens.add({
          targets: shard,
          x: shard.x + Math.cos(Phaser.Math.DegToRad(angle)) * dist,
          y: shard.y + Math.sin(Phaser.Math.DegToRad(angle)) * dist,
          alpha: 0,
          duration: 400,
          onComplete: () => shard.destroy(),
        })
      );
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

    // Sonido ambiental: alarma distante, electricidad, máquinas, goteo, voz robótica.
    at(0, () => {
      this.machineHum = startWindLoop(0.025);
      this.ambientPad = startChordPad([73, 110, 175], 0.02);
      this.alarmEvent = this.time.addEvent({
        delay: 2600,
        loop: true,
        callback: () => {
          if (!this.skipped) playAlarmBeep();
        },
      });
      this.dripEvent = this.time.addEvent({
        delay: 1700,
        loop: true,
        callback: () => {
          if (!this.skipped) playWaterDrop();
        },
      });
    });
    at(300, () => playRoboticBlip());
    at(500, () => playElectricZap());

    // Fade in lento.
    at(300, () => {
      this.tweens.add({ targets: this.blackout, alpha: 0, duration: 1300, ease: "Sine.easeOut" });
    });

    // ---- ESCENA 1: Entrada al laboratorio ----
    at(1200, () => this.moveMarlonX(LAB_CINE_DOOR_X - 46, 1100));
    at(1200, () => {
      this.marlonBump();
      playPipeClank();
    });
    at(700, () => {
      this.marlonBump();
      playPipeClank();
    });
    at(700, () => {
      this.kickDoorOpen();
      playDeepBoom();
      this.marlonStumble();
    });
    at(900, () => showDialogue(this, "Marlon", "Eso estaba calculado.", 1200));
    at(4900, () => {
      this.doorSlamShut();
      cam.shake(220, 0.008);
      playDeepBoom();
      this.marlonLookAround();
    });
    at(1200, () => showDialogue(this, "Marlon", "Bueno... ahora sí parece que estaba calculado por otra persona.", 2200));

    // ---- ESCENA 2: El laboratorio abandonado ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: LAB_CINE_TABLE_X - 480, duration: 1600, ease: "Sine.easeInOut" }));
      this.moveMarlonX(LAB_CINE_TABLE_X - 60, 1600);
      this.flickerBackgroundComputers();
    });
    at(2000, () => showDialogue(this, "Marlon", "Así que aquí fabricaban monstruos...", 1800));
    at(4900, () => showScreenText(this, LAB_CINE_TABLE_X, LAB_CINE_GROUND_TOP - 70, ["EXTRACTO CONCENTRADO", "DE FRIJOL."], 4000, { width: 190 }));
    at(4900, () => showDialogue(this, "Marlon", "Por fin un laboratorio que respeta la ciencia.", 2200));

    // ---- ESCENA 3: La pantalla principal ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: LAB_CINE_SCREEN_X - 480, zoom: 1.2, duration: 1500, ease: "Sine.easeInOut" }));
      this.moveMarlonX(LAB_CINE_SCREEN_X - 90, 1500);
      this.tweenTrack(this.tweens.add({ targets: this.mainScreen, alpha: 1, duration: 400 }));
      playElectricZap();
    });
    at(1700, () => {
      showScreenText(
        this,
        LAB_CINE_SCREEN_X,
        LAB_CINE_GROUND_TOP - 110,
        ["PROYECTO R.M.", "", "SUJETO: REY MALOLIENTE", "OBJETIVO: SISTEMA DE", "DESCARGA DEFINITIVO", "ESTADO: INCONTROLABLE", "RIESGO: EXTREMO"],
        5600,
        { width: 210, lineHeight: 16, fontSize: "11px" }
      );
      this.tweenTrack(this.tweens.add({ targets: this.blueprintImg, alpha: 0.9, duration: 500 }));
    });
    at(5700, () => showDialogue(this, "Marlon", "Entonces no nació así... Lo construyeron.", 2100));
    at(4900, () =>
      showScreenText(this, LAB_CINE_SCREEN_X, LAB_CINE_GROUND_TOP - 110, ["FUENTE DE ENERGÍA:", '"ESENCIA DEL', 'CAGÓN SUPREMO"'], 4600, { width: 200, lineHeight: 16, fontSize: "11px" })
    );
    at(4700, () => this.moveMarlonX(LAB_CINE_SCREEN_X + 40, 500));
    at(600, () => showDialogue(this, "Marlon", "¿Esencia del qué?... Ah, claro. Están hablando de mí.", 2500));

    // ---- ESCENA 4: Humor y sátira ----
    at(4900, () => this.marlonLookAround());
    at(700, () =>
      showDialogue(this, "Marlon", "Con que querían estudiar mi talento... Seguro después lo patentaban... y me cobraban por usarlo.", 3300)
    );
    at(4900, () => showDialogue(this, "Marlon", "Así funciona la ciencia cuando tiene presupuesto público.", 2400));
    at(4900, () => {
      playAlarmBeep();
      showScreenText(
        this,
        LAB_CINE_SCREEN_X,
        LAB_CINE_GROUND_TOP - 110,
        ["PROPIEDAD DEL MINISTERIO DE", "DESCARGAS Y ASUNTOS", "MALOLIENTES", "PRESUPUESTO EJECUTADO: 300%"],
        5300,
        { width: 230, lineHeight: 15, fontSize: "10px" }
      );
    });
    at(5400, () => showDialogue(this, "Marlon", "Eso explica por qué todo está roto.", 2000));

    // ---- ESCENA 5: Grabación del científico ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: LAB_CINE_RECORDING_X - 480, zoom: 1.15, duration: 1500, ease: "Sine.easeInOut" }));
      this.moveMarlonX(LAB_CINE_RECORDING_X - 90, 1500);
      this.tweenTrack(this.tweens.add({ targets: this.scientistSilhouette, alpha: 0.9, duration: 400 }));
      playStaticCrackle();
    });
    at(1700, () =>
      showDialogue(
        this,
        "Científico",
        "Registro final del Proyecto Rey Maloliente.\nEl sujeto ha desarrollado conciencia propia.",
        3200
      )
    );
    at(4900, () =>
      showDialogue(
        this,
        "Científico",
        "Ya no acepta órdenes.\nDice que solo puede existir un Cagón Supremo.\nEstá buscando al portador de la esencia original.",
        4200
      )
    );
    at(4900, () => {
      playStaticCrackle();
      this.tweenTrack(this.tweens.add({ targets: this.scientistSilhouette, alpha: 0.1, duration: 90, yoyo: true, repeat: 4 }));
    });
    at(1000, () => showDialogue(this, "Científico", "Si alguien encuentra este mensaje...\nNo permita que llegue al castillo.", 3100));
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: this.scientistSilhouette, alpha: 0, duration: 300 }));
    });
    at(400, () => showDialogue(this, "Marlon", "Muy tarde... Yo siempre llego donde no me invitan.", 2400));

    // ---- ESCENA 6: Contacto del Rey Maloliente ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: this.backgroundComputers, alpha: 0.15, duration: 1200 }));
      cam.shake(200, 0.005);
      this.revealBossEyesOnScreens();
      playDeepVoiceWithEcho();
    });
    at(1400, () => showMysteriousLine(this, "Por fin has descubierto la verdad...\nTú posees lo que me pertenece.", 2600));
    at(4900, () => showDialogue(this, "Marlon", "Te equivocas... Lo mío no se presta.", 2200));
    at(4900, () => {
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Entrégame tu poder...\n...y ocuparé para siempre el trono del Cagón Supremo.", 2900);
    });
    at(4900, () => showDialogue(this, "Marlon", "¿Mi poder? Ni siquiera dejo que nadie use mi baño...", 2400));
    at(4900, () => showDialogue(this, "Marlon", "...y tú quieres que te entregue mi legado.", 2200));
    at(4900, () => {
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Entonces vendré por ti.", 1900);
    });
    at(2200, () => {
      cam.shake(380, 0.014);
      playDeepBoom();
      this.screenEyes.forEach((eyes) => this.sparkBurst(eyes.x, eyes.y));
      this.hideBossEyesOnScreens();
      this.tweenTrack(this.tweens.add({ targets: this.backgroundComputers, alpha: 0.75, duration: 800 }));
    });

    // ---- ESCENA 7: Aparición del mutante ----
    at(1400, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: LAB_CINE_WIDTH - 960, zoom: 1.1, duration: 1300, ease: "Sine.easeInOut" }));
      this.moveMarlonX(LAB_CINE_TANK_X - 130, 1300);
      this.crackTank();
      playElectricZap();
    });
    at(1500, () => this.moveMarlonX(LAB_CINE_TANK_X - 190, 500));
    at(700, () => showDialogue(this, "Marlon", "Perfecto. Primero científicos locos... después monstruos...", 2500));
    at(4900, () => showDialogue(this, "Marlon", "...y al final un inodoro con problemas de autoestima.", 2300));
    at(4900, () => {
      cam.shake(420, 0.015);
      this.breakTank();
    });
    // Corte rápido a negro (destello breve, no el fundido final): así no se
    // muestra todavía al mutante completo, y deja paso a la Escena 8.
    at(400, () => {
      this.tweens.add({
        targets: this.blackout,
        alpha: 1,
        duration: 220,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.tweens.add({ targets: this.blackout, alpha: 0, duration: 250, delay: 150 });
        },
      });
      this.startLevelMusic();
    });

    // ---- ESCENA 8: Inicio del nivel ----
    at(900, () => showTitleCard(this, "NIVEL 4", "LABORATORIO", 2200));
    at(5100, () => showObjectiveLine(this, "Donde comenzó el Proyecto Rey Maloliente.", 2400));
    at(4900, () => showObjectiveLine(this, "Activa los dos interruptores.", 2000));
    at(4900, () => showObjectiveLine(this, "Encuentra los archivos del Proyecto R.M.", 2200));
    at(4900, () => showObjectiveLine(this, "Escapa del laboratorio.", 1800));
    at(4900, () => showObjectiveLine(this, "Evita que capturen a Marlon.", 2000));

    at(4900, () => this.finish());
  }

  startLevelMusic() {
    if (this.ambientPad) this.ambientPad.stop(0.6);
    this.levelMusic = startChordPad([98, 131, 165, 220], 0.03);
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
    if (this.alarmEvent) this.alarmEvent.remove(false);
    if (this.dripEvent) this.dripEvent.remove(false);
  }

  stopAllSound() {
    if (this.machineHum) this.machineHum.stop(0.2);
    if (this.ambientPad) this.ambientPad.stop(0.2);
    if (this.levelMusic) this.levelMusic.stop(0.2);
  }

  finish(fadeMs = 700) {
    if (this.finished) return;
    this.finished = true;
    this.stopAllSound();

    const save = loadSaveData();
    save.laboratoryIntroSeen = true;
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

// Cinemática de apertura del Nivel 5 (Castillo del Rey Maloliente). Continúa
// justo después del Nivel 4: un ascensor industrial saca a Marlon del
// Laboratorio hacia la superficie, donde se revela por primera vez el
// castillo (torres-cisterna, ventanas con forma de tapa de inodoro,
// propaganda del reino, un Guardia del Retrete, contacto directo con la voz
// del Rey Maloliente, una silueta parcial del jefe al fondo de un pasillo, y
// una última advertencia grabada del científico del laboratorio) antes de
// que Marlon entre decidido al castillo.
//
// Mismo motor de cinemáticas que City/Sewer/ToxicForest/LaboratoryIntroCinematic.js
// (cinematicHelpers.js / cinematicSound.js): cámara, tweens, sonido
// sintetizado, sin video. No se muestra al jefe completo (eso se reserva
// para la cinemática del Nivel 6). Se puede saltar con ENTER/ESC.

const CASTLE_CINE_WIDTH = 1900;
const CASTLE_CINE_HEIGHT = 540;
const CASTLE_CINE_GROUND_TOP = 476;
const CASTLE_CINE_ELEVATOR_X = 130;
const CASTLE_CINE_VIEW_X = 480;
const CASTLE_CINE_ENTRANCE_X = 820;
const CASTLE_CINE_GUARD_X = 1020;
const CASTLE_CINE_INTERIOR_X = 1320;
const CASTLE_CINE_FINAL_X = 1580;

class CastleIntroCinematic extends Phaser.Scene {
  constructor() {
    super("CastleIntroCinematic");
  }

  init(data) {
    this.nextScene = (data && data.nextScene) || "CastleScene";
  }

  preload() {
    generateGameTextures(this);
    generateCinematicTextures(this);
    generateCastleCinematicTextures(this);
  }

  create() {
    this.skipped = false;
    this.finished = false;
    this.activeTimers = [];
    this.windHandle = null;
    this.ambientPad = null;
    this.levelMusic = null;
    this.lightningEvent = null;

    const cam = this.cameras.main;
    cam.setBackgroundColor("#140c14");
    cam.setBounds(0, 0, CASTLE_CINE_WIDTH, CASTLE_CINE_HEIGHT);
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
    this.add.rectangle(CASTLE_CINE_WIDTH / 2, CASTLE_CINE_HEIGHT / 2, CASTLE_CINE_WIDTH, CASTLE_CINE_HEIGHT, 0x1c1220, 1).setDepth(-10);

    // Suelo.
    for (let x = 0; x <= CASTLE_CINE_WIDTH; x += 64) {
      this.add.image(x + 32, CASTLE_CINE_GROUND_TOP + 32, "castleFloor").setAlpha(0.9).setDepth(1);
    }

    // Ascensor industrial (Escena 1): caja metálica con puertas que se abren.
    this.elevatorBack = this.add.rectangle(CASTLE_CINE_ELEVATOR_X, CASTLE_CINE_GROUND_TOP - 60, 90, 160, 0x2a2a32, 1).setDepth(2);
    for (let i = -1; i <= 1; i++) {
      this.add.rectangle(CASTLE_CINE_ELEVATOR_X + i * 28, CASTLE_CINE_GROUND_TOP - 130, 2, 20, 0x50505a, 0.7).setDepth(3);
    }
    this.elevatorLight = this.add.circle(CASTLE_CINE_ELEVATOR_X, CASTLE_CINE_GROUND_TOP - 130, 6, 0xfff2a0, 0.8).setDepth(3);
    this.doorLeft = this.add.rectangle(CASTLE_CINE_ELEVATOR_X - 24, CASTLE_CINE_GROUND_TOP - 60, 46, 158, 0x4a4a54, 1).setDepth(4);
    this.doorRight = this.add.rectangle(CASTLE_CINE_ELEVATOR_X + 24, CASTLE_CINE_GROUND_TOP - 60, 46, 158, 0x4a4a54, 1).setDepth(4);

    // Castillo al fondo (Escena 2): torres tipo cisterna, ventanas de tapa,
    // corona en la torre principal, banderas, desagües con agua cayendo.
    this.castleGroup = [];
    const towerXs = [CASTLE_CINE_VIEW_X - 140, CASTLE_CINE_VIEW_X, CASTLE_CINE_VIEW_X + 150, CASTLE_CINE_VIEW_X + 300];
    towerXs.forEach((x, i) => {
      const h = i === 1 ? 300 : 200 + i * 15;
      const tower = this.add.rectangle(x, CASTLE_CINE_GROUND_TOP - h / 2 + 20, 60, h, 0x2f2432, 1).setDepth(0);
      this.castleGroup.push(tower);
      const window = this.add.circle(x, CASTLE_CINE_GROUND_TOP - h + 50, 10, 0x0a0a0a, 0.9).setDepth(1);
      this.castleGroup.push(window);
    });
    this.crown = this.add.image(CASTLE_CINE_VIEW_X, CASTLE_CINE_GROUND_TOP - 320, "cineMuralSilhouette").setScale(0.5).setDepth(1).setTint(0xffd93d);
    [CASTLE_CINE_VIEW_X - 200, CASTLE_CINE_VIEW_X + 60, CASTLE_CINE_VIEW_X + 340].forEach((x) => {
      const banner = this.add.image(x, CASTLE_CINE_GROUND_TOP - 210, "castleBanner").setOrigin(0.5, 0).setDepth(1);
      this.tweens.add({ targets: banner, angle: 4, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    });
    [CASTLE_CINE_VIEW_X - 100, CASTLE_CINE_VIEW_X + 200].forEach((x) => {
      const jet = this.add.image(x, CASTLE_CINE_GROUND_TOP - 90, "waterJet").setAlpha(0.6).setDepth(1);
      this.tweens.add({ targets: jet, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
    });
    [CASTLE_CINE_VIEW_X - 260, CASTLE_CINE_VIEW_X + 380].forEach((x) => {
      const fog = this.add.image(x, CASTLE_CINE_GROUND_TOP - 60, "toxicFog").setAlpha(0.45).setDepth(2);
      this.tweens.add({ targets: fog, x: x + 30, duration: 3000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    });

    // Estatuas y propaganda en la entrada (Escena 3).
    this.add.image(CASTLE_CINE_ENTRANCE_X - 90, CASTLE_CINE_GROUND_TOP - 30, "cineMuralSilhouette").setScale(0.55).setDepth(2);
    this.add.image(CASTLE_CINE_ENTRANCE_X + 90, CASTLE_CINE_GROUND_TOP - 30, "cineMuralSilhouette").setScale(0.55).setDepth(2).setFlipX(true);

    this.signGroup = [];
    [
      { x: CASTLE_CINE_ENTRANCE_X - 150, text: "UN REY, UN REINO,\nUNA SOLA DESCARGA" },
      { x: CASTLE_CINE_ENTRANCE_X - 20, text: "PROHIBIDO USAR BAÑOS\nSIN AUTORIZACIÓN REAL" },
      { x: CASTLE_CINE_ENTRANCE_X + 150, text: "IMPUESTO POR DESCARGA:\n40 MONEDAS" },
    ].forEach(({ x, text }) => {
      const bg = this.add.rectangle(x, CASTLE_CINE_GROUND_TOP - 90, 130, 46, 0x1a1010, 0.85).setStrokeStyle(2, 0x8a3a3a, 0.8).setDepth(2);
      const label = this.add
        .text(x, CASTLE_CINE_GROUND_TOP - 90, text, { fontFamily: "monospace", fontSize: "9px", color: "#e0a0a0", align: "center" })
        .setOrigin(0.5)
        .setDepth(3);
      this.signGroup.push(bg, label);
    });

    // Puerta principal del castillo (Escena 4-5).
    this.throneDoor = this.add.image(CASTLE_CINE_GUARD_X + 40, CASTLE_CINE_GROUND_TOP - 55, "throneDoor").setDepth(2);
    this.guard = this.add.image(CASTLE_CINE_GUARD_X, CASTLE_CINE_GROUND_TOP - 18, "toiletGuard").setScale(1.6).setDepth(3).setAlpha(0);

    // Antorchas.
    this.torches = [CASTLE_CINE_ENTRANCE_X - 200, CASTLE_CINE_GUARD_X + 150, CASTLE_CINE_INTERIOR_X - 100].map((x) => {
      const torch = this.add.image(x, CASTLE_CINE_GROUND_TOP - 40, "castleTorch").setDepth(2);
      this.tweens.add({ targets: torch, alpha: 0.6, duration: 350, yoyo: true, repeat: -1 });
      return torch;
    });

    // Pasillo interior oscuro + silueta parcial del jefe (Escena 6).
    this.corridor = this.add.rectangle(CASTLE_CINE_INTERIOR_X, CASTLE_CINE_GROUND_TOP - 90, 260, 220, 0x05040a, 0.92).setDepth(2);
    this.bossSilhouette = this.add.image(CASTLE_CINE_INTERIOR_X, CASTLE_CINE_GROUND_TOP - 110, "cineBossSilhouette").setScale(0.9).setDepth(3).setAlpha(0);

    // Pequeña pantalla con la grabación del científico (Escena 7).
    this.warningScreen = this.add.rectangle(CASTLE_CINE_INTERIOR_X + 160, CASTLE_CINE_GROUND_TOP - 70, 60, 46, 0x02131a, 0.9).setStrokeStyle(2, 0x2fb8d9, 0.8).setDepth(3).setAlpha(0);
    this.warningSilhouette = this.add.image(CASTLE_CINE_INTERIOR_X + 160, CASTLE_CINE_GROUND_TOP - 82, "cineSilhouette").setScale(0.6).setDepth(4).setAlpha(0);

    // Marlon: empieza dentro del ascensor.
    this.marlonX = CASTLE_CINE_ELEVATOR_X;
    this.marlonY = CASTLE_CINE_GROUND_TOP - 34;
    this.marlonShadow = this.add.image(this.marlonX, CASTLE_CINE_GROUND_TOP + 24, "cineShadow").setDepth(9).setAlpha(0.4);
    this.marlonBody = this.add.image(this.marlonX, this.marlonY, "playerBody").setScale(1.3).setDepth(10);
    this.marlonFace = this.add
      .image(this.marlonX, this.marlonY + PLAYER_HEAD_OFFSET_Y * 1.3, getPlayerFaceKey(this))
      .setDepth(11);
    this.marlonFace.setDisplaySize(PLAYER_HEAD_DIAMETER * 1.3, PLAYER_HEAD_DIAMETER * 1.3);

    // Botella vacía que Marlon revisa al inicio.
    this.emptyBottle = this.add.image(this.marlonX + 14, this.marlonY + 6, "bottle").setScale(0.9).setDepth(11);
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

  marlonJump() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], y: "-=16", duration: 140, yoyo: true, ease: "Quad.easeOut" })
    );
  }

  marlonShakeBottle() {
    this.tweenTrack(this.tweens.add({ targets: this.emptyBottle, angle: { from: -20, to: 20 }, duration: 90, yoyo: true, repeat: 4 }));
  }

  marlonHeroicPose() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], scale: "*=1.15", duration: 260, yoyo: true, ease: "Back.easeOut" })
    );
  }

  marlonCrossArms() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], scaleX: "*=1.08", duration: 200, yoyo: true, repeat: 1 })
    );
  }

  tweenTrack(tween) {
    this.activeTimers.push({ remove: () => tween.stop() });
    return tween;
  }

  // ---------- EFECTOS DEL CASTILLO ----------
  openElevatorDoors() {
    this.tweenTrack(this.tweens.add({ targets: this.doorLeft, x: "-=40", duration: 700, ease: "Cubic.easeOut" }));
    this.tweenTrack(this.tweens.add({ targets: this.doorRight, x: "+=40", duration: 700, ease: "Cubic.easeOut" }));
  }

  flickerElevatorLight() {
    this.tweenTrack(this.tweens.add({ targets: this.elevatorLight, alpha: 0.1, duration: 90, yoyo: true, repeat: 6 }));
  }

  greenLightningFlash() {
    const bolt = this.add.image(Phaser.Math.Between(200, CASTLE_CINE_WIDTH - 200), CASTLE_CINE_GROUND_TOP - 260, "cineLightning").setAlpha(0).setDepth(50).setScale(2.5);
    this.tweenTrack(
      this.tweens.add({ targets: bolt, alpha: 0.85, duration: 60, yoyo: true, onComplete: () => bolt.destroy() })
    );
    playThunderCrack();
  }

  openThroneDoorWide() {
    this.tweenTrack(this.tweens.add({ targets: this.throneDoor, alpha: 0.15, duration: 900, ease: "Sine.easeIn" }));
  }

  extinguishTorches() {
    this.torches.forEach((torch) => {
      this.tweenTrack(this.tweens.add({ targets: torch, alpha: 0, duration: 400 }));
    });
  }

  revealBossSilhouette() {
    this.tweenTrack(this.tweens.add({ targets: this.bossSilhouette, alpha: 0.92, duration: 600 }));
  }

  hideBossSilhouette() {
    this.tweenTrack(this.tweens.add({ targets: this.bossSilhouette, alpha: 0, duration: 200 }));
  }

  crumbleDust() {
    for (let i = 0; i < 6; i++) {
      const x = CASTLE_CINE_INTERIOR_X + Phaser.Math.Between(-100, 100);
      const mote = this.add.image(x, CASTLE_CINE_GROUND_TOP - 220, "cineDustMote").setDepth(5);
      this.tweenTrack(
        this.tweens.add({ targets: mote, y: mote.y + Phaser.Math.Between(150, 220), alpha: 0, duration: Phaser.Math.Between(500, 800), onComplete: () => mote.destroy() })
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

    // Sonido ambiental: alarma apagándose, máquinas deteniéndose, viento, puerta.
    at(0, () => {
      this.windHandle = startWindLoop(0.03);
      this.ambientPad = startChordPad([87, 130, 175], 0.02);
      playAlarmBeep();
    });
    at(400, () => playElectricZap());
    at(500, () => playPipeClank());

    // Fade in.
    at(300, () => {
      this.tweens.add({ targets: this.blackout, alpha: 0, duration: 1300, ease: "Sine.easeOut" });
    });

    // ---- ESCENA 1: Salida del laboratorio (ascensor) ----
    at(1500, () => this.flickerElevatorLight());
    at(900, () => this.marlonShakeBottle());
    at(900, () => showDialogue(this, "Marlon", "Cinco niveles de olor... y ni una sola cafetería decente.", 2200));
    at(4900, () => {
      cam.shake(260, 0.01);
      this.marlonJump();
      playDeepBoom();
    });
    at(900, () => showDialogue(this, "Marlon", "Excelente. Hasta los ascensores aquí tienen miedo.", 2200));
    at(4900, () => {
      this.openElevatorDoors();
      playPipeClank();
    });

    // ---- ESCENA 2: Revelación del castillo ----
    at(1400, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: CASTLE_CINE_VIEW_X - 480, duration: 1800, ease: "Sine.easeInOut" }));
      this.moveMarlonX(CASTLE_CINE_VIEW_X - 60, 1800);
    });
    at(1500, () => this.greenLightningFlash());
    at(1900, () => showDialogue(this, "Marlon", "Vaya... Cuando dijeron castillo... pensé que exageraban.", 2200));
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollY: -40, zoom: 1.1, duration: 1300, ease: "Sine.easeInOut" }));
    });
    at(1400, () =>
      showDialogue(this, "Marlon", "Pero esto parece una ferretería embrujada con presupuesto ilimitado.", 2400)
    );

    // ---- ESCENA 3: Propaganda del Rey Maloliente ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: CASTLE_CINE_ENTRANCE_X - 480, scrollY: 0, zoom: 1, duration: 1500, ease: "Sine.easeInOut" }));
      this.moveMarlonX(CASTLE_CINE_ENTRANCE_X - 150, 1500);
      this.tweenTrack(this.tweens.add({ targets: this.signGroup, alpha: 1, duration: 500 }));
    });
    at(1700, () => showDialogue(this, "Marlon", "Impuesto por descarga... Con razón nadie aquí va al baño.", 2400));
    at(4900, () => this.marlonCrossArms());
    at(600, () => showDialogue(this, "Marlon", "Eso sí que no. Mi libertad termina donde comienza el baño ajeno.", 2500));
    at(4900, () => showDialogue(this, "Marlon", "Y a mí nadie me va a quitar el título del Cagón Número Uno.", 2400));

    // ---- ESCENA 4: El guardia real ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: CASTLE_CINE_GUARD_X - 480, duration: 1300, ease: "Sine.easeInOut" }));
      this.moveMarlonX(CASTLE_CINE_GUARD_X - 130, 1300);
      this.tweenTrack(this.tweens.add({ targets: this.guard, alpha: 1, duration: 400 }));
      playPipeClank();
    });
    at(1500, () =>
      showDialogue(this, "Guardia", "¡Alto! Por orden del Rey Maloliente, todo visitante debe declarar sus bienes.", 2600)
    );
    at(4900, () => showDialogue(this, "Marlon", "¿Qué bienes?", 1800));
    at(4900, () => showDialogue(this, "Guardia", "Monedas. Botellas. Papel.\nY cualquier reserva intestinal de valor estratégico.", 2800));
    at(4900, () => showDialogue(this, "Marlon", "Eso último es propiedad privada.", 2000));
    at(4900, () => showDialogue(this, "Guardia", "También deberá pagar el impuesto de entrada.", 2200));
    at(4900, () => showDialogue(this, "Marlon", "¿Cuánto?", 1800));
    at(4900, () => showDialogue(this, "Guardia", "Todo lo que tenga.", 1900));
    at(4900, () => {
      this.marlonHeroicPose();
      showDialogue(this, "Marlon", "Entonces te voy a pagar con intereses.", 2200);
    });
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, zoom: 0.95, duration: 500, ease: "Sine.easeOut" }));
      this.tweenTrack(this.tweens.add({ targets: this.guard, x: "+=20", duration: 300, yoyo: true }));
    });

    // ---- ESCENA 5: La voz del Rey ----
    at(900, () => {
      playBellChime();
      this.tweenTrack(this.tweens.add({ targets: cam, zoom: 1, duration: 500 }));
    });
    at(700, () => playBellChime());
    at(700, () => {
      this.openThroneDoorWide();
      spawnRisingSmoke(this, CASTLE_CINE_GUARD_X + 40, CASTLE_CINE_GROUND_TOP - 60, "fartCloud", 0x4caf50);
      spawnRisingSmoke(this, CASTLE_CINE_GUARD_X + 60, CASTLE_CINE_GROUND_TOP - 40, "toxicFog");
      this.extinguishTorches();
      cam.shake(260, 0.008);
      playDeepVoiceWithEcho();
    });
    at(1400, () => showMysteriousLine(this, "Has llegado más lejos de lo que esperaba...", 2400));
    at(4900, () => {
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Ciudad. Alcantarillas. Bosque. Laboratorio.\nTodo te condujo hasta mí.", 2700);
    });
    at(4900, () => showDialogue(this, "Marlon", "Sí. Y todavía no me han dado ni un mapa.", 2200));
    at(4900, () => {
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Tu poder será mío. Tu título será olvidado.\nSolo existirá un Cagón Supremo.", 2800);
    });
    at(4900, () => showDialogue(this, "Marlon", "Escúchame bien, retrete con corona.\nEse título me lo gané con años de esfuerzo...", 2800));
    at(4900, () => showDialogue(this, "Marlon", "...y con muchas piscinas ajenas cerradas por mantenimiento.", 2500));
    at(4900, () => {
      this.marlonHeroicPose();
      showDialogue(this, "Marlon", "No voy a permitir que me lo quites.", 2200);
    });

    // ---- ESCENA 6: Visión parcial del jefe ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: CASTLE_CINE_INTERIOR_X - 480, zoom: 1.15, duration: 1600, ease: "Sine.easeInOut" }));
      this.moveMarlonX(CASTLE_CINE_INTERIOR_X - 140, 1600);
    });
    at(1700, () => this.revealBossSilhouette());
    at(1000, () => {
      this.greenLightningFlash();
      cam.shake(380, 0.014);
      playDeepBoom();
      this.crumbleDust();
      this.hideBossSilhouette();
      this.moveMarlonX(CASTLE_CINE_INTERIOR_X - 200, 300);
    });
    at(1200, () => showDialogue(this, "Marlon", "Muy grande... pero seguro usa papel de una sola capa.", 2300));

    // ---- ESCENA 7: La advertencia del científico ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: this.warningScreen, alpha: 1, duration: 400 }));
      this.tweenTrack(this.tweens.add({ targets: this.warningSilhouette, alpha: 0.85, duration: 400 }));
      playStaticCrackle();
    });
    at(1700, () =>
      showDialogue(this, "Científico", "Si has llegado al castillo... debes saber que su poder proviene del sistema central de tuberías.", 3200)
    );
    at(4900, () =>
      showDialogue(this, "Científico", "En el salón del trono se encuentra su verdadera forma.\nPero primero tendrás que atravesar sus defensas.", 3300)
    );
    at(4900, () => {
      playStaticCrackle();
      showDialogue(this, "Científico", "Y no confíes en los baños del castillo.\nTodos tienen cámaras.", 2600);
    });
    at(4900, () => showDialogue(this, "Marlon", "Eso explica demasiadas cosas.", 2000));
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: [this.warningScreen, this.warningSilhouette], alpha: 0, duration: 300 }));
    });

    // ---- ESCENA 8: Preparación de Marlon ----
    at(2200, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: CASTLE_CINE_FINAL_X - 480, zoom: 1, duration: 1300, ease: "Sine.easeInOut" }));
      this.moveMarlonX(CASTLE_CINE_FINAL_X - 100, 1300);
    });
    at(1500, () =>
      showDialogue(this, "Marlon", "Bueno... Entraré al castillo.\nDerrotaré a sus guardias. Llegaré al salón del trono.", 3000)
    );
    at(4900, () => {
      this.marlonHeroicPose();
      showDialogue(this, "Marlon", "Y después voy a enseñarle a ese inodoro quién manda aquí.", 2500);
    });
    at(4900, () => showDialogue(this, "Marlon", "Y si veo un árbol de Navidad... no prometo nada.", 2300));

    // ---- ESCENA 9: Inicio del nivel ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollY: -30, zoom: 1.1, duration: 1200, ease: "Sine.easeInOut" }));
      this.moveMarlonX(CASTLE_CINE_FINAL_X + 60, 1200);
      this.startLevelMusic();
    });
    at(1400, () => showTitleCard(this, "NIVEL 5", "CASTILLO DEL REY MALOLIENTE", 2400));
    at(5300, () => showObjectiveLine(this, "El trono está cerca.", 1900));
    at(4900, () => showObjectiveLine(this, "Cruza las defensas del castillo.", 2000));
    at(4900, () => showObjectiveLine(this, "Derrota a los guardias reales.", 2000));
    at(4900, () => showObjectiveLine(this, "Encuentra la entrada al salón del trono.", 2200));
    at(4900, () => showObjectiveLine(this, "Prepárate para enfrentar al Rey Maloliente.", 2200));

    at(4900, () => this.finish());
  }

  startLevelMusic() {
    if (this.ambientPad) this.ambientPad.stop(0.6);
    this.levelMusic = startChordPad([98, 147, 196, 233], 0.03);
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
    if (this.lightningEvent) this.lightningEvent.remove(false);
  }

  stopAllSound() {
    if (this.windHandle) this.windHandle.stop(0.2);
    if (this.ambientPad) this.ambientPad.stop(0.2);
    if (this.levelMusic) this.levelMusic.stop(0.2);
  }

  finish(fadeMs = 700) {
    if (this.finished) return;
    this.finished = true;
    this.stopAllSound();

    const save = loadSaveData();
    save.castleIntroSeen = true;
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

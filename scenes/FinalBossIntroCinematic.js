// Cinemática de apertura del Nivel 6 (Batalla Final). Continúa justo después
// del Nivel 5: Marlon fuerza la entrada al salón del trono, el Rey Maloliente
// se revela COMPLETO por primera vez (con corona, capa y medallas absurdas),
// discuten quién es el verdadero "Cagón Número Uno", se satiriza la
// propaganda del reino, y finalmente se muestra la barra de 5 segmentos
// antes de que el combate (FinalBossScene, sin cambios) comience de verdad.
//
// Mismo motor de cinemáticas que los niveles anteriores (cinematicHelpers.js
// / cinematicSound.js): cámara, tweens, sonido sintetizado, sin video. Se
// puede saltar con ENTER/ESC en cualquier momento.

const FBOSS_CINE_WIDTH = 1700;
const FBOSS_CINE_HEIGHT = 540;
const FBOSS_CINE_GROUND_TOP = 476;
const FBOSS_CINE_DOOR_X = 150;
const FBOSS_CINE_THRONE_X = 900;

class FinalBossIntroCinematic extends Phaser.Scene {
  constructor() {
    super("FinalBossIntroCinematic");
  }

  init(data) {
    this.nextScene = (data && data.nextScene) || "FinalBossScene";
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
    this.windHandle = null;
    this.ambientPad = null;
    this.levelMusic = null;

    const cam = this.cameras.main;
    cam.setBackgroundColor("#140c14");
    cam.setBounds(0, 0, FBOSS_CINE_WIDTH, FBOSS_CINE_HEIGHT);
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
    this.add.rectangle(FBOSS_CINE_WIDTH / 2, FBOSS_CINE_HEIGHT / 2, FBOSS_CINE_WIDTH, FBOSS_CINE_HEIGHT, 0x1c1220, 1).setDepth(-10);

    for (let x = 0; x <= FBOSS_CINE_WIDTH; x += 64) {
      this.add.image(x + 32, FBOSS_CINE_GROUND_TOP + 32, "castleFloor").setAlpha(0.9).setDepth(1);
    }

    // Puerta doble del salón del trono, con placas y palanca.
    this.doorLeft = this.add.rectangle(FBOSS_CINE_DOOR_X - 24, FBOSS_CINE_GROUND_TOP - 70, 46, 180, 0x3a2f38, 1).setDepth(3);
    this.doorRight = this.add.rectangle(FBOSS_CINE_DOOR_X + 24, FBOSS_CINE_GROUND_TOP - 70, 46, 180, 0x3a2f38, 1).setDepth(3);
    this.add.image(FBOSS_CINE_DOOR_X, FBOSS_CINE_GROUND_TOP - 165, "cineCrown").setScale(0.8).setDepth(4);
    this.add
      .text(FBOSS_CINE_DOOR_X, FBOSS_CINE_GROUND_TOP - 110, "SALÓN DEL TRONO", { fontFamily: "monospace", fontSize: "10px", color: "#ffd93d" })
      .setOrigin(0.5)
      .setDepth(4);
    this.add
      .text(FBOSS_CINE_DOOR_X, FBOSS_CINE_GROUND_TOP - 40, "PROHIBIDO ENTRAR SIN\nAUTORIZACIÓN, SELLO,\nCOPIA DE CÉDULA Y\nTRES FORMULARIOS.", {
        fontFamily: "monospace",
        fontSize: "7px",
        color: "#e0a0a0",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.lever = this.add.rectangle(FBOSS_CINE_DOOR_X + 110, FBOSS_CINE_GROUND_TOP - 30, 8, 50, 0x8a8f95, 1).setDepth(3);
    this.leverKnob = this.add.circle(FBOSS_CINE_DOOR_X + 110, FBOSS_CINE_GROUND_TOP - 54, 7, 0xe63946, 1).setDepth(3);
    this.add
      .text(FBOSS_CINE_DOOR_X + 110, FBOSS_CINE_GROUND_TOP + 4, "USO EXCLUSIVO DE\nPERSONAL AUTORIZADO", { fontFamily: "monospace", fontSize: "6px", color: "#e0a0a0", align: "center" })
      .setOrigin(0.5)
      .setDepth(3);

    // Salón del trono: columnas, tuberías, banderas, papel higiénico apilado.
    [500, 620, 1050, 1170].forEach((x) => {
      this.add.rectangle(x, FBOSS_CINE_GROUND_TOP - 100, 26, 200, 0xd8d8e0, 0.9).setDepth(1);
    });
    [560, 1110].forEach((x) => {
      const jet = this.add.image(x, FBOSS_CINE_GROUND_TOP - 200, "waterJet").setScale(1.4).setAlpha(0.55).setDepth(1);
      this.tweens.add({ targets: jet, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
    });
    [430, 1330].forEach((x) => {
      const torch = this.add.image(x, FBOSS_CINE_GROUND_TOP - 60, "castleTorch").setTint(0x6fcf3a).setDepth(2);
      this.tweens.add({ targets: torch, alpha: 0.6, duration: 350, yoyo: true, repeat: -1 });
    });
    [720, 1080].forEach((x) => {
      this.add.image(x, FBOSS_CINE_GROUND_TOP - 210, "castleBanner").setOrigin(0.5, 0).setDepth(1);
    });
    [780, 840, 960, 1020].forEach((x) => {
      this.add.image(x, FBOSS_CINE_GROUND_TOP + 10, "toiletPaper").setScale(2).setDepth(1);
    });
    [660, 1140].forEach((x) => {
      this.add.image(x, FBOSS_CINE_GROUND_TOP + 4, "miniToilet").setScale(0.8).setDepth(1);
    });
    this.add.rectangle(FBOSS_CINE_THRONE_X, FBOSS_CINE_GROUND_TOP + 20, 620, 16, 0x8a1f2d, 0.6).setDepth(1); // alfombra

    // Trono + Rey Maloliente completo (revelado por primera vez).
    this.throneBack = this.add.rectangle(FBOSS_CINE_THRONE_X, FBOSS_CINE_GROUND_TOP - 170, 140, 220, 0x2a2030, 1).setDepth(2);
    this.bossCape = this.add.image(FBOSS_CINE_THRONE_X, FBOSS_CINE_GROUND_TOP - 150, "cineCape").setScale(1.8).setDepth(3).setAlpha(0);
    this.bossSprite = this.add.image(FBOSS_CINE_THRONE_X, FBOSS_CINE_GROUND_TOP - 150, "bossToilet").setScale(1.6).setDepth(4).setAlpha(0);
    this.bossCrown = this.add.image(FBOSS_CINE_THRONE_X, FBOSS_CINE_GROUND_TOP - 260, "cineCrown").setScale(1.3).setAngle(-6).setDepth(5).setAlpha(0);
    this.bossMedals = [-24, 0, 24].map((dx) =>
      this.add.image(FBOSS_CINE_THRONE_X + dx, FBOSS_CINE_GROUND_TOP - 110, "cineMedal").setScale(1.1).setDepth(5).setAlpha(0)
    );
    this.bossPlate = this.add
      .text(FBOSS_CINE_THRONE_X, FBOSS_CINE_GROUND_TOP - 40, "CAGÓN SUPREMO AUTOPROCLAMADO", { fontFamily: "monospace", fontSize: "9px", color: "#ffd93d" })
      .setOrigin(0.5)
      .setDepth(5)
      .setAlpha(0);
    this.titleCrown = this.add
      .image(FBOSS_CINE_THRONE_X - 220, FBOSS_CINE_GROUND_TOP - 100, "cineCrown")
      .setScale(1.4)
      .setDepth(3)
      .setAlpha(0);
    this.titleCrownLabel = this.add
      .text(FBOSS_CINE_THRONE_X - 220, FBOSS_CINE_GROUND_TOP - 60, "TÍTULO OFICIAL DEL\nCAGÓN NÚMERO UNO", { fontFamily: "monospace", fontSize: "8px", color: "#ffd93d", align: "center" })
      .setOrigin(0.5)
      .setDepth(3)
      .setAlpha(0);

    // Pantallas de propaganda (Escena 5).
    this.propScreens = [FBOSS_CINE_THRONE_X - 330, FBOSS_CINE_THRONE_X + 330].map((x) =>
      this.add.rectangle(x, FBOSS_CINE_GROUND_TOP - 220, 100, 70, 0x02131a, 0.9).setStrokeStyle(2, 0x2fb8d9, 0.8).setDepth(2).setAlpha(0)
    );

    // Marlon.
    this.marlonX = 20;
    this.marlonY = FBOSS_CINE_GROUND_TOP - 34;
    this.marlonShadow = this.add.image(this.marlonX, FBOSS_CINE_GROUND_TOP + 24, "cineShadow").setDepth(9).setAlpha(0.4);
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
    this.tweenTrack(this.tweens.add({ targets: [this.marlonBody, this.marlonFace], x: "+=6", duration: 90, yoyo: true, repeat: 2 }));
  }

  marlonCrossArms() {
    this.tweenTrack(this.tweens.add({ targets: [this.marlonBody, this.marlonFace], scaleX: "*=1.08", duration: 200, yoyo: true, repeat: 1 }));
  }

  marlonHeroicPose() {
    this.tweenTrack(
      this.tweens.add({ targets: [this.marlonBody, this.marlonFace], scale: "*=1.18", duration: 280, yoyo: true, ease: "Back.easeOut" })
    );
  }

  tweenTrack(tween) {
    this.activeTimers.push({ remove: () => tween.stop() });
    return tween;
  }

  // ---------- EFECTOS ----------
  pullLever() {
    this.tweenTrack(this.tweens.add({ targets: [this.lever, this.leverKnob], angle: 45, duration: 300, ease: "Back.easeOut" }));
  }

  openThroneDoors() {
    this.tweenTrack(this.tweens.add({ targets: this.doorLeft, x: "-=40", duration: 800, ease: "Cubic.easeOut" }));
    this.tweenTrack(this.tweens.add({ targets: this.doorRight, x: "+=40", duration: 800, ease: "Cubic.easeOut" }));
  }

  revealBossFull() {
    this.tweenTrack(this.tweens.add({ targets: this.bossCape, alpha: 0.9, duration: 700 }));
    this.tweenTrack(this.tweens.add({ targets: this.bossSprite, alpha: 1, duration: 700 }));
    this.tweenTrack(this.tweens.add({ targets: this.bossCrown, alpha: 1, duration: 700, delay: 300 }));
    this.tweenTrack(this.tweens.add({ targets: this.bossMedals, alpha: 1, duration: 500, delay: 500 }));
    this.tweenTrack(this.tweens.add({ targets: this.bossPlate, alpha: 1, duration: 500, delay: 700 }));
  }

  openBossMouth() {
    this.tweenTrack(this.tweens.add({ targets: this.bossSprite, scaleY: "*=1.06", duration: 200, yoyo: true, repeat: 3 }));
  }

  revealTitleCrown() {
    this.tweenTrack(this.tweens.add({ targets: [this.titleCrown, this.titleCrownLabel], alpha: 1, duration: 500 }));
  }

  showPropagandaScreens(lines) {
    this.tweenTrack(this.tweens.add({ targets: this.propScreens, alpha: 1, duration: 400 }));
    this.propScreens.forEach((screen, i) => {
      showScreenText(this, screen.x, screen.y, lines[i] || lines[0], 4700, { width: 90, lineHeight: 12, fontSize: "8px" });
    });
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
      this.windHandle = startWindLoop(0.03);
      this.ambientPad = startChordPad([73, 110, 146], 0.02);
      playDeepBreathWithEcho();
    });
    at(400, () => playBellChime());
    at(500, () => playDeepBoom());

    at(300, () => {
      this.tweens.add({ targets: this.blackout, alpha: 0, duration: 1300, ease: "Sine.easeOut" });
    });

    // ---- SECUENCIA 1: Entrada al salón del trono ----
    at(1300, () => this.moveMarlonX(FBOSS_CINE_DOOR_X - 80, 1200));
    at(1300, () => showDialogue(this, "Marlon", "¿Tres formularios? Prefiero enfrentar al monstruo.", 2200));
    at(4900, () => {
      this.moveMarlonX(FBOSS_CINE_DOOR_X - 40, 400);
      this.marlonBump();
      playPipeClank();
    });
    at(700, () => {
      this.moveMarlonX(FBOSS_CINE_DOOR_X + 60, 500);
      this.marlonBump();
      playPipeClank();
    });
    at(900, () => showDialogue(this, "Marlon", "Por suerte nunca he sido personal autorizado.", 2200));
    at(4900, () => {
      this.pullLever();
      this.openThroneDoors();
      playDeepBoom();
      cam.shake(260, 0.008);
    });

    // ---- SECUENCIA 2: Revelación del salón (visual, sin texto) ----
    at(1400, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: FBOSS_CINE_THRONE_X - 480, duration: 2200, ease: "Sine.easeInOut" }));
      this.moveMarlonX(FBOSS_CINE_THRONE_X - 220, 2200);
    });
    at(1600, () => this.revealBossFull());
    at(1200, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollY: -60, zoom: 1.2, duration: 1600, ease: "Sine.easeInOut" }));
    });

    // ---- SECUENCIA 3: El discurso del Rey Maloliente ----
    at(1800, () => {
      this.openBossMouth();
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Por fin has llegado... Marlon.\nEl llamado Cagón Número Uno.", 2700);
    });
    at(4900, () => {
      this.marlonCrossArms();
      showDialogue(this, "Marlon", "No soy 'el llamado'. Soy el original.", 2200);
    });
    at(4900, () => {
      this.openBossMouth();
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Tu título termina hoy.\nDurante años construí este reino.", 2600);
    });
    at(4900, () => {
      this.openBossMouth();
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Controlé las alcantarillas. Goberné el castillo.\nCreé leyes. Cobré impuestos.\nY me declaré a mí mismo Cagón Supremo.", 3300);
    });
    at(4900, () => showDialogue(this, "Marlon", "Eso de declararte ganador sin competir...\nsí suena bastante oficial.", 2600));
    at(4900, () => {
      this.openBossMouth();
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Tu poder será absorbido por mi sistema central.\nCuando te derrote, nadie volverá a pronunciar tu nombre.", 3200);
    });
    at(4900, () => showDialogue(this, "Marlon", "Eso ya lo intentaron varias personas...\nPero siempre me encuentran por el olor.", 2600));

    // ---- SECUENCIA 4: La disputa por el título ----
    at(4900, () => {
      this.revealTitleCrown();
      this.openBossMouth();
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Ese título será mío.", 2000);
    });
    at(4900, () => showDialogue(this, "Marlon", "Escúchame bien, inodoro con delirios de grandeza.", 2400));
    at(4900, () =>
      showDialogue(
        this,
        "Marlon",
        "No crucé una ciudad llena de basura... No bajé por alcantarillas...\nNo atravesé un bosque tóxico... No sobreviví a un laboratorio...\nY no entré en este castillo...",
        4200
      )
    );
    at(4900, () => showDialogue(this, "Marlon", "...para que un baño con corona me quite mi título.", 2400));
    at(4900, () => {
      this.marlonHeroicPose();
      this.tweenTrack(this.tweens.add({ targets: cam, zoom: 1.3, duration: 500, yoyo: true }));
      showDialogue(this, "Marlon", "¡Yo soy el Cagón Número Uno!", 2200);
    });
    at(4900, () => showDialogue(this, "Marlon", "Y a mí nadie me obliga a cagar en un baño.\nYo cago donde me da la gana.", 2600));
    at(4900, () => showDialogue(this, "Marlon", "En piscinas de casas ajenas... en árboles de Navidad...\ny una vez casi en una fuente municipal.", 2900));
    at(4900, () => showDialogue(this, "Marlon", "Pero eso último nunca se pudo probar.", 2100));

    // ---- SECUENCIA 5: Sátira del reino ----
    at(4900, () => {
      cam.shake(200, 0.006);
      playElectricZap();
      this.showPropagandaScreens([
        ["EL REY NUNCA", "PIERDE"],
        ["ENCUESTA: 100%", "APOYA AL REY"],
      ]);
    });
    at(1500, () => showDialogue(this, "Marlon", "¿Quién hizo esa encuesta?", 2000));
    at(4900, () => {
      playRoboticBlip();
      showMysteriousLine(this, "El Rey.", 1800);
    });
    at(4900, () => showDialogue(this, "Marlon", "¿Y quién contó los votos?", 2000));
    at(4900, () => {
      playRoboticBlip();
      showMysteriousLine(this, "El Rey.", 1800);
    });
    at(4900, () => showDialogue(this, "Marlon", "¿Y quién certificó el resultado?", 2100));
    at(4900, () => {
      playRoboticBlip();
      showMysteriousLine(this, "El Rey.", 1800);
    });
    at(4900, () => showDialogue(this, "Marlon", "Muy transparente.", 1900));

    // ---- SECUENCIA 6: Inicio del combate ----
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: this.propScreens, alpha: 0, duration: 400 }));
      cam.shake(300, 0.01);
      this.openBossMouth();
      playDeepVoiceWithEcho();
      showMysteriousLine(this, "Cinco impactos no serán suficientes para derrotarme.", 2700);
    });
    at(4900, () => showDialogue(this, "Marlon", "Perfecto. Solo traje cinco.", 2100));
    at(4900, () => {
      playDeepBoom();
      spawnRisingSmoke(this, FBOSS_CINE_THRONE_X - 70, FBOSS_CINE_GROUND_TOP - 60, "steamPuff");
    });
    at(700, () => showDialogue(this, "Marlon", "Vamos a resolver esto como adultos.\nYo lanzo... y tú recibes.", 2600));
    at(4900, () => {
      this.tweenTrack(this.tweens.add({ targets: cam, scrollX: 0, scrollY: 0, zoom: 1, duration: 1300, ease: "Sine.easeInOut" }));
      this.startLevelMusic();
    });
    at(1400, () => showTitleCard(this, "BATALLA FINAL", "REY MALOLIENTE", 2200));
    at(5300, () => showObjectiveLine(this, "Golpéalo 5 veces con excremento.\nLas botellas solo lo aturden.", 2600));

    at(4900, () => this.finish());
  }

  startLevelMusic() {
    if (this.ambientPad) this.ambientPad.stop(0.6);
    this.levelMusic = startChordPad([73, 110, 146, 220], 0.035);
    this.delay(1200, () => {
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
    save.finalBossIntroSeen = true;
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

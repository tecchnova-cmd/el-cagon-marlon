// Genera todas las texturas del juego con formas simples (sin depender de
// imágenes externas). Se llama una única vez, en el preload del MenuScene.

// Offset (relativo al centro del sprite) y diámetro con los que la cara
// (foto real, ver bakeCircularFaceTexture) se superpone sobre el cuerpo.
// Proporción chibi: cabeza grande (~57% de la altura total), cuerpo corto.
const PLAYER_HEAD_OFFSET_Y = -12;
const PLAYER_HEAD_DIAMETER = 32;

function generateGameTextures(scene) {
  // Evita regenerar texturas si ya existen (por ejemplo al reiniciar la partida).
  if (scene.textures.exists("playerBody")) return;

  const g = scene.make.graphics({ add: false });

  // ---------- CUERPO DE MARLON (chibi: corto; la cara real va superpuesta) ----------
  // Estilo "Super Marlon Cagón": camisa roja debajo, overol azul encima (como Mario).
  g.clear();
  // piernas (pantalón del overol, cortas)
  g.fillStyle(0x3b6fd6, 1);
  g.fillRect(11, 46, 8, 8);
  g.fillRect(21, 46, 8, 8);
  // cuello de la camisa (se asoma por encima del overol)
  g.fillStyle(0xd6432b, 1);
  g.fillRoundedRect(10, 20, 20, 10, 3);
  // torso (overol, corto)
  g.fillStyle(0x3b6fd6, 1);
  g.fillRoundedRect(8, 26, 24, 20, 5);
  // brazos (mangas de la camisa)
  g.fillStyle(0xd6432b, 1);
  g.fillRoundedRect(2, 28, 6, 14, 3);
  g.fillRoundedRect(32, 28, 6, 14, 3);
  // tirantes del overol
  g.fillStyle(0x2b4fa8, 1);
  g.fillRect(13, 20, 4, 8);
  g.fillRect(24, 20, 4, 8);
  // botones del overol
  g.fillStyle(0xffd93d, 1);
  g.fillCircle(15, 32, 1.6);
  g.fillCircle(25, 32, 1.6);
  g.generateTexture("playerBody", 40, 56);

  // ---------- POLVO (al saltar/aterrizar) ----------
  g.clear();
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(6, 6, 5);
  g.fillCircle(14, 7, 4);
  g.fillCircle(10, 3, 3);
  g.generateTexture("dust", 20, 12);

  // ---------- CACA (proyectil principal, caricaturesca) ----------
  g.clear();
  g.fillStyle(0x6b4226, 1);
  g.fillCircle(8, 11, 6);
  g.fillCircle(8, 6, 4.5);
  g.fillCircle(8, 2, 3);
  g.fillStyle(0x8a5a30, 0.7);
  g.fillCircle(6, 9, 2);
  g.generateTexture("poop", 16, 16);

  // ---------- SALPICADURA DE CACA (impacto) ----------
  g.clear();
  g.fillStyle(0x6b4226, 0.85);
  g.fillEllipse(9, 6, 18, 9);
  g.fillCircle(3, 3, 3.5);
  g.fillCircle(15, 3, 3.5);
  g.generateTexture("poopSplash", 18, 12);

  // ---------- BOTELLA DE CERVEZA (proyectil secundario) ----------
  g.clear();
  g.fillStyle(0x3a2b1a, 1);
  g.fillRoundedRect(2, 6, 8, 15, 2);
  g.fillRect(4, 2, 4, 6);
  g.fillStyle(0xd9d9d9, 1);
  g.fillRect(3, 0, 6, 3);
  g.fillStyle(0xf4e4c1, 0.9);
  g.fillRect(2, 11, 8, 5);
  g.generateTexture("bottle", 12, 22);

  // ---------- VIDRIO ROTO (impacto de botella) ----------
  g.clear();
  g.fillStyle(0xbfe3c8, 0.9);
  g.fillTriangle(0, 8, 4, 0, 8, 8);
  g.generateTexture("glassShard", 8, 8);

  // ---------- CARA DE RESPALDO (por si la foto no carga) ----------
  g.clear();
  g.fillStyle(0xf1c27d, 1);
  g.fillCircle(PLAYER_HEAD_DIAMETER / 2, PLAYER_HEAD_DIAMETER / 2, PLAYER_HEAD_DIAMETER / 2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(9, 11, 4);
  g.fillCircle(17, 11, 4);
  g.fillStyle(0x000000, 1);
  g.fillCircle(9, 12, 2);
  g.fillCircle(17, 12, 2);
  g.lineStyle(2, 0x8a3b00, 1);
  g.strokeCircle(13, 19, 3);
  g.generateTexture("marlonFaceFallback", PLAYER_HEAD_DIAMETER, PLAYER_HEAD_DIAMETER);

  // ---------- RATA ----------
  g.clear();
  g.fillStyle(0x6b4a2b, 1);
  g.fillEllipse(16, 12, 28, 16);
  // cola
  g.lineStyle(2, 0x6b4a2b, 1);
  g.beginPath();
  g.moveTo(28, 12);
  g.lineTo(38, 6);
  g.strokePath();
  // orejas
  g.fillStyle(0x8a6440, 1);
  g.fillCircle(6, 4, 4);
  g.fillCircle(12, 3, 4);
  // ojo
  g.fillStyle(0x000000, 1);
  g.fillCircle(6, 10, 2);
  // nariz
  g.fillStyle(0xdb7093, 1);
  g.fillCircle(2, 12, 2);
  g.generateTexture("rat", 40, 22);

  // ---------- MOSQUITO GIGANTE ----------
  g.clear();
  // alas
  g.fillStyle(0xcfe8ff, 0.6);
  g.fillEllipse(14, 6, 20, 10);
  g.fillEllipse(24, 6, 20, 10);
  // cuerpo
  g.fillStyle(0x4a4a55, 1);
  g.fillEllipse(20, 16, 26, 14);
  g.fillStyle(0x2f2f38, 1);
  g.fillEllipse(20, 16, 14, 8);
  // trompa
  g.lineStyle(2, 0x2f2f38, 1);
  g.beginPath();
  g.moveTo(34, 16);
  g.lineTo(44, 16);
  g.strokePath();
  // patas
  g.lineStyle(1, 0x2f2f38, 1);
  g.beginPath();
  g.moveTo(12, 22); g.lineTo(6, 30);
  g.moveTo(20, 24); g.lineTo(18, 32);
  g.moveTo(28, 22); g.lineTo(32, 30);
  g.strokePath();
  // ojo
  g.fillStyle(0xff3b3b, 1);
  g.fillCircle(26, 12, 2);
  g.generateTexture("mosquito", 48, 34);

  // ---------- PALOMA BOMBARDERA ----------
  g.clear();
  g.fillStyle(0x8892a0, 1);
  g.fillEllipse(14, 12, 22, 14);
  g.fillStyle(0x6b7480, 1);
  g.fillEllipse(10, 10, 12, 8);
  g.fillStyle(0xff8c42, 1);
  g.fillTriangle(24, 12, 30, 10, 24, 15);
  g.fillStyle(0x000000, 1);
  g.fillCircle(18, 8, 2);
  g.generateTexture("pigeon", 30, 22);

  // ---------- MANCHA (ataque de la paloma) ----------
  g.clear();
  g.fillStyle(0x5a4a3a, 0.85);
  g.fillCircle(5, 5, 5);
  g.generateTexture("stain", 10, 10);

  // ---------- PERRO DEL BASURERO ----------
  g.clear();
  g.fillStyle(0x7a6a55, 1);
  g.fillEllipse(24, 18, 32, 16);
  g.fillCircle(42, 13, 9);
  g.fillStyle(0x5a4a3a, 1);
  g.fillTriangle(38, 4, 44, 2, 42, 11);
  g.fillTriangle(6, 14, 0, 10, 6, 20);
  g.fillStyle(0x000000, 1);
  g.fillCircle(45, 11, 1.5);
  g.fillStyle(0x5a4a3a, 1);
  g.fillRect(12, 25, 4, 6);
  g.fillRect(22, 25, 4, 6);
  g.fillRect(32, 25, 4, 6);
  g.generateTexture("trashDog", 48, 32);

  // ---------- PAVIMENTO (suelo urbano) ----------
  g.clear();
  g.fillStyle(0x4a4a52, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x5c5c66, 1);
  g.fillRect(0, 0, 64, 10);
  g.fillStyle(0xdddddd, 0.4);
  g.fillRect(28, 0, 8, 4);
  g.generateTexture("pavement", 64, 64);

  // ---------- EDIFICIO (fondo decorativo) ----------
  g.clear();
  g.fillStyle(0x35405a, 1);
  g.fillRect(0, 0, 120, 300);
  g.fillStyle(0x2a3348, 0.9);
  for (let wy = 20; wy < 280; wy += 36) {
    for (let wx = 12; wx < 100; wx += 28) {
      g.fillRect(wx, wy, 16, 20);
    }
  }
  g.generateTexture("building", 120, 300);

  // ---------- CHARCO (decorativo) ----------
  g.clear();
  g.fillStyle(0x3a5a6b, 0.55);
  g.fillEllipse(24, 8, 48, 12);
  g.generateTexture("puddle", 48, 16);

  // ---------- BASURERO ----------
  g.clear();
  g.fillStyle(0x6b7280, 1);
  g.fillRoundedRect(2, 6, 20, 24, 3);
  g.fillStyle(0x4b5260, 1);
  g.fillRect(0, 2, 24, 6);
  g.generateTexture("trashCan", 24, 30);

  // ---------- CAJA ----------
  g.clear();
  g.fillStyle(0x9a6a3a, 1);
  g.fillRect(0, 0, 28, 24);
  g.lineStyle(2, 0x6b4226, 1);
  g.strokeRect(0, 0, 28, 24);
  g.lineBetween(0, 0, 28, 24);
  g.lineBetween(28, 0, 0, 24);
  g.generateTexture("crate", 28, 24);

  // ---------- SEÑAL CAÍDA ----------
  g.clear();
  g.fillStyle(0xffb703, 1);
  g.fillRoundedRect(0, 0, 36, 16, 2);
  g.fillStyle(0x333333, 1);
  g.fillRect(36, 4, 6, 4);
  g.generateTexture("fallenSign", 42, 16);

  // ---------- ALCANTARILLA (salida) ----------
  g.clear();
  g.fillStyle(0x2a2a2a, 1);
  g.fillEllipse(35, 20, 70, 26);
  g.fillStyle(0x111111, 1);
  g.fillEllipse(35, 20, 58, 18);
  g.lineStyle(2, 0x2a2a2a, 1);
  g.lineBetween(10, 20, 60, 20);
  g.lineBetween(35, 8, 35, 32);
  g.generateTexture("manhole", 70, 40);

  // ---------- RATA MUTANTE (alcantarillas) ----------
  g.clear();
  g.fillStyle(0x5a7a3a, 1);
  g.fillEllipse(20, 15, 36, 20);
  g.lineStyle(3, 0x5a7a3a, 1);
  g.beginPath();
  g.moveTo(36, 15);
  g.lineTo(48, 7);
  g.strokePath();
  g.fillStyle(0x74985a, 1);
  g.fillCircle(8, 5, 5);
  g.fillCircle(16, 4, 5);
  g.fillStyle(0xff0000, 1);
  g.fillCircle(8, 13, 2.5);
  g.fillStyle(0xdb7093, 1);
  g.fillCircle(2, 15, 2.5);
  g.fillStyle(0x3a5a2a, 1);
  g.fillTriangle(20, 2, 24, 2, 22, 8);
  g.generateTexture("ratMutant", 52, 28);

  // ---------- BABA TÓXICA (alcantarillas) ----------
  g.clear();
  g.fillStyle(0x6fcf3a, 0.9);
  g.fillEllipse(15, 12, 28, 16);
  g.fillStyle(0x9be86b, 0.8);
  g.fillCircle(10, 7, 4);
  g.fillStyle(0x000000, 1);
  g.fillCircle(9, 10, 1.5);
  g.fillCircle(17, 10, 1.5);
  g.generateTexture("toxicSlime", 30, 18);

  // ---------- PLATAFORMA METÁLICA (alcantarillas) ----------
  g.clear();
  g.fillStyle(0x6b7280, 1);
  g.fillRect(0, 0, 64, 18);
  g.lineStyle(1, 0x4b5260, 1);
  g.strokeRect(0, 0, 64, 18);
  g.fillStyle(0x9aa3ad, 1);
  g.fillCircle(8, 9, 2);
  g.fillCircle(32, 9, 2);
  g.fillCircle(56, 9, 2);
  g.generateTexture("metalPlatform", 64, 18);

  // ---------- AGUA TÓXICA (peligro) ----------
  g.clear();
  g.fillStyle(0x4a7a3a, 0.85);
  g.fillRect(0, 0, 64, 20);
  g.fillStyle(0x6fae4a, 0.5);
  g.fillRect(0, 0, 64, 6);
  g.generateTexture("toxicWater", 64, 20);

  // ---------- VAPOR (decorativo) ----------
  g.clear();
  g.fillStyle(0xe8e8e8, 0.5);
  g.fillCircle(8, 8, 8);
  g.fillCircle(4, 10, 5);
  g.fillCircle(12, 10, 5);
  g.generateTexture("steamPuff", 16, 18);

  // ---------- GOTERA (decorativa) ----------
  g.clear();
  g.fillStyle(0x6fbfe0, 0.8);
  g.fillCircle(3, 6, 3);
  g.fillTriangle(0, 4, 6, 4, 3, 0);
  g.generateTexture("waterDrip", 6, 9);

  // ---------- TUBERÍA (fondo decorativo) ----------
  g.clear();
  g.fillStyle(0x4a5568, 1);
  g.fillRect(0, 0, 40, 300);
  g.fillStyle(0x3a4556, 1);
  g.fillRect(0, 0, 40, 10);
  g.fillRect(0, 140, 40, 14);
  g.fillRect(0, 280, 40, 10);
  g.generateTexture("pipeBackground", 40, 300);

  // ---------- SUELO METÁLICO (alcantarillas) ----------
  g.clear();
  g.fillStyle(0x3a4048, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x2a3038, 1);
  for (let i = 0; i < 64; i += 8) {
    g.fillRect(i, 0, 2, 64);
  }
  g.fillStyle(0x50565e, 1);
  g.fillRect(0, 0, 64, 6);
  g.generateTexture("sewerFloor", 64, 64);

  // ---------- HONGO SALTARÍN (bosque tóxico) ----------
  g.clear();
  g.fillStyle(0x8a4fae, 1);
  g.fillEllipse(12, 10, 22, 14);
  g.fillStyle(0xd6a3ff, 0.8);
  g.fillCircle(7, 7, 2.5);
  g.fillCircle(16, 8, 2);
  g.fillCircle(12, 5, 2);
  g.fillStyle(0xe8d9b0, 1);
  g.fillRect(8, 16, 8, 8);
  g.generateTexture("hoppingMushroom", 24, 24);

  // ---------- MOSCA MUTANTE (bosque tóxico) ----------
  g.clear();
  g.fillStyle(0x4a6b2f, 1);
  g.fillEllipse(10, 8, 14, 9);
  g.fillStyle(0xcfe8ff, 0.5);
  g.fillEllipse(6, 4, 10, 6);
  g.fillEllipse(14, 4, 10, 6);
  g.fillStyle(0xff0000, 1);
  g.fillCircle(14, 7, 1.8);
  g.generateTexture("mutantFly", 20, 14);

  // ---------- PLANTA CARNÍVORA (bosque tóxico) ----------
  g.clear();
  g.fillStyle(0x2d6b2d, 1);
  g.fillRect(10, 16, 6, 20);
  g.fillStyle(0x3f9142, 1);
  g.fillTriangle(2, 16, 24, 16, 13, 4);
  g.fillStyle(0xff4d6d, 0.8);
  g.fillTriangle(6, 14, 18, 14, 13, 7);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(6, 14, 9, 14, 7.5, 10);
  g.fillTriangle(17, 14, 20, 14, 18.5, 10);
  g.generateTexture("carnivorousPlant", 26, 36);

  // ---------- JABALÍ APESTOSO (bosque tóxico) ----------
  g.clear();
  g.fillStyle(0x6b5a4a, 1);
  g.fillEllipse(20, 16, 34, 18);
  g.fillCircle(38, 11, 8);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(44, 14, 48, 18, 44, 18);
  g.fillStyle(0x000000, 1);
  g.fillCircle(40, 9, 1.5);
  g.fillStyle(0x4a3d30, 1);
  g.fillRect(8, 24, 4, 4);
  g.fillRect(20, 24, 4, 4);
  g.fillRect(30, 24, 4, 4);
  g.generateTexture("stinkyBoar", 50, 30);

  // ---------- NUBE TÓXICA (ataque del hongo) ----------
  g.clear();
  g.fillStyle(0x8a4fae, 0.6);
  g.fillCircle(15, 12, 12);
  g.fillCircle(6, 14, 7);
  g.fillCircle(24, 14, 7);
  g.generateTexture("toxicCloud", 30, 24);

  // ---------- ESPINAS (peligro) ----------
  g.clear();
  g.fillStyle(0x3a5a2a, 1);
  for (let i = 0; i < 40; i += 8) {
    g.fillTriangle(i, 16, i + 8, 16, i + 4, 2);
  }
  g.generateTexture("thornPatch", 40, 16);

  // ---------- RAMA CAÍDA (peligro) ----------
  g.clear();
  g.fillStyle(0x6b4226, 1);
  g.fillRoundedRect(0, 3, 34, 6, 3);
  g.fillStyle(0x4a2f1a, 1);
  g.fillCircle(6, 6, 3);
  g.fillCircle(26, 6, 3);
  g.generateTexture("fallingBranch", 34, 10);

  // ---------- HONGO TRAMPOLÍN ----------
  g.clear();
  g.fillStyle(0xff6f6f, 1);
  g.fillEllipse(15, 8, 30, 14);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(8, 5, 3);
  g.fillCircle(22, 5, 3);
  g.fillCircle(15, 10, 3);
  g.fillStyle(0xe8d9b0, 1);
  g.fillRect(10, 13, 10, 5);
  g.generateTexture("mushroomTrampoline", 30, 18);

  // ---------- ÁRBOL DEFORMADO (fondo decorativo) ----------
  g.clear();
  g.fillStyle(0x2a1f14, 1);
  g.fillRect(45, 120, 20, 160);
  g.fillRect(40, 150, 10, 40);
  g.fillRect(60, 100, 10, 50);
  g.fillStyle(0x2d4a2d, 1);
  g.fillEllipse(55, 90, 90, 70);
  g.fillEllipse(30, 60, 50, 50);
  g.fillEllipse(80, 55, 55, 50);
  g.fillStyle(0x8a4fae, 0.5);
  g.fillCircle(40, 80, 10);
  g.fillCircle(70, 70, 8);
  g.generateTexture("forestTree", 110, 280);

  // ---------- NIEBLA TÓXICA (decorativa) ----------
  g.clear();
  g.fillStyle(0x5fae4a, 0.25);
  g.fillRect(0, 0, 200, 60);
  g.generateTexture("toxicFog", 200, 60);

  // ---------- PUERTA DE SEGURIDAD (salida) ----------
  g.clear();
  g.fillStyle(0x556270, 1);
  g.fillRoundedRect(0, 0, 70, 100, 4);
  g.fillStyle(0x2f3640, 1);
  g.fillRect(0, 0, 70, 10);
  g.fillRect(0, 90, 70, 10);
  g.fillStyle(0xffd93d, 1);
  g.fillCircle(35, 20, 6);
  g.fillStyle(0x2f3640, 1);
  g.fillRect(30, 50, 10, 30);
  g.generateTexture("securityDoor", 70, 100);

  // ---------- POZO TÓXICO (peligro) ----------
  g.clear();
  g.fillStyle(0x1f3d1f, 1);
  g.fillEllipse(20, 8, 40, 14);
  g.fillStyle(0x5fae4a, 0.6);
  g.fillEllipse(20, 8, 30, 10);
  g.generateTexture("toxicPit", 40, 16);

  // ---------- CIENTÍFICO LOCO (laboratorio) ----------
  g.clear();
  g.fillStyle(0xf1c27d, 1);
  g.fillCircle(13, 8, 7);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(4, 15, 18, 20, 3);
  g.fillStyle(0x2d6b8a, 1);
  g.fillRect(6, 5, 14, 4);
  g.fillStyle(0x4a3d2a, 1);
  g.fillRect(6, 1, 14, 4);
  g.fillStyle(0x8a8a8a, 1);
  g.fillRect(6, 35, 6, 5);
  g.fillRect(14, 35, 6, 5);
  g.generateTexture("madScientist", 26, 40);

  // ---------- ROBOT ASPIRADORA (laboratorio) ----------
  g.clear();
  g.fillStyle(0x6b7280, 1);
  g.fillEllipse(17, 14, 32, 16);
  g.fillStyle(0x2f3640, 1);
  g.fillCircle(17, 10, 6);
  g.fillStyle(0xff3b3b, 1);
  g.fillCircle(17, 7, 2);
  g.fillStyle(0x1f2630, 1);
  g.fillRect(4, 19, 4, 3);
  g.fillRect(13, 19, 4, 3);
  g.fillRect(22, 19, 4, 3);
  g.generateTexture("robotVacuum", 34, 24);

  // ---------- MUTANTE DE LABORATORIO ----------
  g.clear();
  g.fillStyle(0x5aae5a, 1);
  g.fillRoundedRect(4, 10, 22, 22, 4);
  g.fillCircle(15, 7, 8);
  g.fillStyle(0xff0000, 1);
  g.fillCircle(12, 6, 1.8);
  g.fillCircle(18, 6, 1.8);
  g.fillStyle(0x3a7a3a, 1);
  g.fillRect(0, 12, 5, 14);
  g.fillRect(25, 12, 5, 14);
  g.fillRect(6, 30, 7, 6);
  g.fillRect(17, 30, 7, 6);
  g.generateTexture("labMutant", 30, 36);

  // ---------- DRON DESODORANTE (laboratorio) ----------
  g.clear();
  g.fillStyle(0x8892a0, 1);
  g.fillEllipse(13, 10, 24, 14);
  g.fillStyle(0x4a90d9, 1);
  g.fillCircle(13, 8, 3);
  g.fillStyle(0x2f3640, 1);
  g.fillRect(22, 9, 6, 4);
  g.generateTexture("deodorantDrone", 28, 20);

  // ---------- TUBO DE ENSAYO (ataque del científico) ----------
  g.clear();
  g.fillStyle(0xcfe8ff, 0.7);
  g.fillRoundedRect(1, 0, 6, 14, 3);
  g.fillStyle(0x7fff7f, 1);
  g.fillRoundedRect(1, 6, 6, 8, 3);
  g.generateTexture("testTube", 8, 16);

  // ---------- NUBE RALENTIZADORA (ataque del dron) ----------
  g.clear();
  g.fillStyle(0x4a90d9, 0.6);
  g.fillCircle(10, 8, 8);
  g.fillCircle(4, 10, 5);
  g.fillCircle(16, 10, 5);
  g.generateTexture("slowCloud", 20, 16);

  // ---------- RAYO LÁSER (peligro) ----------
  g.clear();
  g.fillStyle(0xff3b3b, 0.85);
  g.fillRect(0, 0, 6, 120);
  g.fillStyle(0xffb3b3, 0.6);
  g.fillRect(2, 0, 2, 120);
  g.generateTexture("laserBeam", 6, 120);

  // ---------- PUERTA TEMPORIZADA ----------
  g.clear();
  g.fillStyle(0x556270, 1);
  g.fillRect(0, 0, 20, 90);
  g.fillStyle(0xffd93d, 1);
  g.fillRect(2, 40, 16, 6);
  g.generateTexture("timedDoorClosed", 20, 90);

  // ---------- LÍQUIDO EXPERIMENTAL (peligro) ----------
  g.clear();
  g.fillStyle(0x8a4fae, 0.85);
  g.fillRect(0, 0, 64, 18);
  g.fillStyle(0xd6a3ff, 0.5);
  g.fillCircle(16, 6, 4);
  g.fillCircle(40, 8, 3);
  g.fillCircle(52, 5, 3);
  g.generateTexture("experimentalLiquid", 64, 18);

  // ---------- INTERRUPTOR (apagado / encendido) ----------
  g.clear();
  g.fillStyle(0x4b5260, 1);
  g.fillRoundedRect(0, 0, 18, 18, 3);
  g.fillStyle(0xff3b3b, 1);
  g.fillCircle(9, 9, 5);
  g.generateTexture("switchOff", 18, 18);

  g.clear();
  g.fillStyle(0x4b5260, 1);
  g.fillRoundedRect(0, 0, 18, 18, 3);
  g.fillStyle(0x5aff5a, 1);
  g.fillCircle(9, 9, 5);
  g.generateTexture("switchOn", 18, 18);

  // ---------- PORTAL DE LABORATORIO (salida) ----------
  g.clear();
  g.fillStyle(0x2f3640, 1);
  g.fillRoundedRect(0, 0, 70, 100, 6);
  g.fillStyle(0x4ad9d9, 0.8);
  g.fillEllipse(35, 50, 50, 80);
  g.fillStyle(0xffffff, 0.4);
  g.fillEllipse(35, 50, 30, 60);
  g.generateTexture("labPortal", 70, 100);

  // ---------- COMPUTADORA (fondo decorativo) ----------
  g.clear();
  g.fillStyle(0x2f3640, 1);
  g.fillRect(0, 0, 60, 80);
  g.fillStyle(0x4ad9d9, 0.7);
  g.fillRect(6, 6, 48, 40);
  g.fillStyle(0xff3b3b, 1);
  g.fillCircle(52, 58, 4);
  g.generateTexture("labComputer", 60, 80);

  // ---------- SUELO DEL LABORATORIO ----------
  g.clear();
  g.fillStyle(0x3a4048, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x50565e, 1);
  g.fillRect(0, 0, 64, 8);
  g.lineStyle(1, 0x2a3038, 1);
  g.strokeRect(0, 0, 64, 64);
  g.generateTexture("labFloor", 64, 64);

  // ---------- GUARDIA DEL RETRETE (castillo) ----------
  g.clear();
  g.fillStyle(0x6b7280, 1);
  g.fillRoundedRect(6, 14, 16, 20, 3);
  g.fillStyle(0xf1c27d, 1);
  g.fillCircle(14, 8, 7);
  g.fillStyle(0xe8e8e8, 1);
  g.fillEllipse(2, 20, 10, 18);
  g.fillStyle(0x000000, 1);
  g.fillCircle(16, 7, 1.5);
  g.generateTexture("toiletGuard", 28, 36);

  // ---------- FANTASMA OLOROSO (castillo) ----------
  g.clear();
  g.fillStyle(0x9be86b, 0.85);
  g.fillEllipse(13, 12, 24, 20);
  g.fillTriangle(2, 18, 8, 18, 5, 28);
  g.fillTriangle(10, 20, 16, 20, 13, 29);
  g.fillTriangle(18, 18, 24, 18, 21, 28);
  g.fillStyle(0x000000, 1);
  g.fillCircle(9, 10, 2);
  g.fillCircle(17, 10, 2);
  g.generateTexture("ghostEnemy", 26, 30);

  // ---------- CABALLERO DEL PAPEL HIGIÉNICO (castillo) ----------
  g.clear();
  g.fillStyle(0xb0b8c0, 1);
  g.fillRoundedRect(6, 14, 16, 22, 3);
  g.fillStyle(0xf1c27d, 1);
  g.fillCircle(14, 8, 6);
  g.fillStyle(0x8a8a8a, 1);
  g.fillRect(6, 2, 16, 6);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(22, 16, 5);
  g.fillStyle(0xdedede, 1);
  g.fillCircle(22, 16, 2);
  g.generateTexture("toiletKnight", 30, 38);

  // ---------- HECHICERO DE LAS FLATULENCIAS (castillo) ----------
  g.clear();
  g.fillStyle(0x5a3d8a, 1);
  g.fillTriangle(13, 10, 2, 36, 24, 36);
  g.fillStyle(0xf1c27d, 1);
  g.fillCircle(13, 10, 6);
  g.fillStyle(0x2a1d4a, 1);
  g.fillRect(5, 2, 16, 8);
  g.fillStyle(0x9be86b, 0.6);
  g.fillCircle(13, 26, 10);
  g.generateTexture("fartWizard", 26, 36);

  // ---------- PAPEL HIGIÉNICO (cura un corazón) ----------
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, 8, 8);
  g.fillStyle(0xdedede, 1);
  g.fillCircle(8, 8, 3);
  g.generateTexture("toiletPaper", 16, 16);

  // ---------- NUBE VERDE (ataque del hechicero) ----------
  g.clear();
  g.fillStyle(0x6fcf3a, 0.75);
  g.fillCircle(13, 10, 10);
  g.fillCircle(5, 12, 6);
  g.fillCircle(21, 12, 6);
  g.generateTexture("fartCloud", 26, 20);

  // ---------- PINCHOS (peligro) ----------
  g.clear();
  g.fillStyle(0x8a8a8a, 1);
  for (let i = 0; i < 40; i += 8) {
    g.fillTriangle(i, 16, i + 8, 16, i + 4, 0);
  }
  g.generateTexture("spikes", 40, 16);

  // ---------- CHORRO DE AGUA (peligro alterna) ----------
  g.clear();
  g.fillStyle(0x6fbfe0, 0.8);
  g.fillRect(0, 0, 14, 100);
  g.fillStyle(0xffffff, 0.4);
  g.fillRect(4, 0, 4, 100);
  g.generateTexture("waterJet", 14, 100);

  // ---------- BOLA DE PIEDRA (obstáculo rodante) ----------
  g.clear();
  g.fillStyle(0x7a7a7a, 1);
  g.fillCircle(14, 14, 14);
  g.fillStyle(0x5a5a5a, 1);
  g.fillCircle(10, 10, 4);
  g.generateTexture("stoneBall", 28, 28);

  // ---------- ANTORCHA VERDE (decorativa) ----------
  g.clear();
  g.fillStyle(0x6b4226, 1);
  g.fillRect(5, 18, 6, 12);
  g.fillStyle(0x3fae3f, 0.9);
  g.fillCircle(8, 12, 7);
  g.fillStyle(0x9be86b, 0.8);
  g.fillCircle(8, 8, 4);
  g.generateTexture("castleTorch", 16, 30);

  // ---------- BANDERA DEL CASTILLO (decorativa) ----------
  g.clear();
  g.fillStyle(0x6b1f1f, 1);
  g.fillRect(0, 0, 30, 50);
  g.fillStyle(0xffffff, 0.8);
  g.fillEllipse(15, 25, 16, 20);
  g.fillStyle(0x6b1f1f, 1);
  g.fillEllipse(15, 25, 9, 13);
  g.generateTexture("castleBanner", 30, 50);

  // ---------- ESTATUA RIDÍCULA (fondo decorativo) ----------
  g.clear();
  g.fillStyle(0x4a4a52, 1);
  g.fillRect(15, 0, 20, 90);
  g.fillCircle(25, 10, 14);
  g.fillRect(5, 90, 40, 20);
  g.generateTexture("castleStatue", 50, 110);

  // ---------- PUERTA DEL SALÓN DEL TRONO (salida) ----------
  g.clear();
  g.fillStyle(0x8a5a30, 1);
  g.fillRoundedRect(0, 0, 80, 110, 8);
  g.fillStyle(0xffd93d, 1);
  g.fillRoundedRect(6, 6, 68, 98, 6);
  g.fillStyle(0x8a5a30, 1);
  g.fillRoundedRect(12, 12, 56, 86, 4);
  g.fillStyle(0xffd93d, 1);
  g.fillCircle(64, 55, 4);
  g.generateTexture("throneDoor", 80, 110);

  // ---------- SUELO DEL CASTILLO ----------
  g.clear();
  g.fillStyle(0x3a3a42, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x2a2a32, 1);
  g.fillRect(0, 0, 64, 10);
  g.lineStyle(1, 0x2a2a32, 1);
  g.strokeRect(0, 0, 32, 32);
  g.strokeRect(32, 32, 32, 32);
  g.generateTexture("castleFloor", 64, 64);

  // ---------- INODORO GIGANTE (jefe final) ----------
  g.clear();
  g.fillStyle(0xe8e8e8, 1);
  g.fillRoundedRect(30, 10, 100, 60, 6);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(20, 60, 120, 90, 20);
  g.fillStyle(0xcfcfcf, 1);
  g.fillRoundedRect(30, 140, 100, 16, 4);
  // boca (tapa) enojada
  g.fillStyle(0xd6432b, 1);
  g.fillEllipse(80, 95, 70, 34);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(50, 84, 60, 84, 55, 96);
  g.fillTriangle(68, 84, 78, 84, 73, 96);
  g.fillTriangle(86, 84, 96, 84, 91, 96);
  g.fillTriangle(104, 84, 114, 84, 109, 96);
  g.fillTriangle(58, 110, 68, 110, 63, 99);
  g.fillTriangle(80, 110, 90, 110, 85, 99);
  g.fillTriangle(102, 110, 112, 110, 107, 99);
  // ojos
  g.fillStyle(0xffffff, 1);
  g.fillCircle(50, 50, 14);
  g.fillCircle(105, 50, 14);
  g.fillStyle(0xff0000, 1);
  g.fillCircle(52, 52, 7);
  g.fillCircle(103, 52, 7);
  // cejas grandes
  g.fillStyle(0x8a5a30, 1);
  g.fillTriangle(30, 28, 62, 34, 30, 42);
  g.fillTriangle(130, 28, 98, 34, 130, 42);
  // brazos de tuberías
  g.fillStyle(0x8892a0, 1);
  g.fillRect(4, 70, 16, 50);
  g.fillCircle(12, 122, 10);
  g.fillRect(140, 70, 16, 50);
  g.fillCircle(148, 122, 10);
  g.generateTexture("bossToilet", 160, 160);

  // ---------- MINI-INODORO ----------
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(2, 2, 20, 18, 6);
  g.fillStyle(0xcfcfcf, 1);
  g.fillRect(4, 18, 4, 6);
  g.fillRect(16, 18, 4, 6);
  g.fillStyle(0x000000, 1);
  g.fillCircle(8, 10, 2);
  g.fillCircle(16, 10, 2);
  g.generateTexture("miniToilet", 24, 26);

  // ---------- CHORRO DE AGUA DEL JEFE (horizontal) ----------
  g.clear();
  g.fillStyle(0x6fbfe0, 0.85);
  g.fillEllipse(25, 11, 50, 18);
  g.fillStyle(0xffffff, 0.5);
  g.fillEllipse(25, 11, 30, 10);
  g.generateTexture("bossWaterJet", 50, 22);

  // ---------- INDICADOR DE GOTERA (aviso previo) ----------
  g.clear();
  g.fillStyle(0xff3b3b, 0.9);
  g.fillTriangle(12, 0, 24, 24, 0, 24);
  g.fillStyle(0xffffff, 1);
  g.fillRect(10, 8, 4, 10);
  g.fillCircle(12, 20, 2);
  g.generateTexture("warningMarker", 24, 24);

  // ---------- GOTA DESDE EL TECHO (jefe) ----------
  g.clear();
  g.fillStyle(0x6fbfe0, 0.9);
  g.fillCircle(8, 10, 7);
  g.fillTriangle(2, 7, 14, 7, 8, 0);
  g.generateTexture("ceilingDrop", 16, 16);

  // ---------- GRAN OLA (descarga real) ----------
  g.clear();
  g.fillStyle(0x4a90d9, 0.85);
  g.fillRect(0, 10, 200, 30);
  g.fillStyle(0x6fbfe0, 0.7);
  for (let i = 0; i < 200; i += 20) {
    g.fillCircle(i + 10, 10, 12);
  }
  g.generateTexture("bossWave", 200, 42);

  // ---------- SEGMENTO DE VIDA DEL JEFE ----------
  g.clear();
  g.fillStyle(0xff3b3b, 1);
  g.fillRoundedRect(0, 0, 30, 16, 3);
  g.generateTexture("bossHealthFull", 30, 16);

  // ---------- SUELO DE LA ARENA DEL JEFE ----------
  g.clear();
  g.fillStyle(0x2a3a4a, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x3a5568, 1);
  g.fillRect(0, 0, 64, 8);
  g.lineStyle(1, 0x1f2a35, 1);
  g.strokeRect(0, 0, 32, 32);
  g.strokeRect(32, 32, 32, 32);
  g.generateTexture("bossArenaFloor", 64, 64);

  // ---------- CONFETI (pantalla de victoria) ----------
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 8, 8);
  g.generateTexture("confettiPiece", 8, 8);

  // ---------- BANDERA DE CHECKPOINT ----------
  g.clear();
  g.fillStyle(0x8a8a8a, 1);
  g.fillRect(3, 0, 3, 40);
  g.fillStyle(0xffd93d, 1);
  g.fillTriangle(6, 4, 26, 10, 6, 16);
  g.generateTexture("checkpointFlag", 30, 40);

  // ---------- BOTÓN TÁCTIL (fondo genérico) ----------
  g.clear();
  g.fillStyle(0x000000, 0.35);
  g.fillCircle(32, 32, 32);
  g.lineStyle(3, 0xffffff, 0.7);
  g.strokeCircle(32, 32, 29);
  g.generateTexture("touchButtonBg", 64, 64);

  // ---------- SUELO DEL BOSQUE (musgo tóxico) ----------
  g.clear();
  g.fillStyle(0x3a2f1a, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x5a7a3a, 1);
  g.fillRect(0, 0, 64, 12);
  g.fillStyle(0x4a6b2f, 1);
  g.fillRect(0, 8, 64, 6);
  g.generateTexture("forestFloor", 64, 64);

  // ---------- TUBERÍA GIGANTE (salida) ----------
  g.clear();
  g.fillStyle(0x4a5568, 1);
  g.fillRoundedRect(0, 0, 90, 90, 10);
  g.fillStyle(0x111111, 1);
  g.fillEllipse(45, 45, 60, 60);
  g.generateTexture("pipeExit", 90, 90);

  // ---------- MONEDA ----------
  g.clear();
  g.fillStyle(0xffd700, 1);
  g.fillCircle(10, 10, 10);
  g.lineStyle(2, 0xb8860b, 1);
  g.strokeCircle(10, 10, 8);
  g.fillStyle(0xfff3b0, 1);
  g.fillCircle(7, 7, 2);
  g.generateTexture("coin", 20, 20);

  // ---------- NUBE DE ATAQUE (verde cómica) ----------
  g.clear();
  g.fillStyle(0x4caf50, 0.85);
  g.fillCircle(18, 18, 14);
  g.fillCircle(6, 20, 10);
  g.fillCircle(30, 20, 10);
  g.fillCircle(12, 10, 9);
  g.fillCircle(24, 10, 9);
  g.fillStyle(0x8bd992, 0.8);
  g.fillCircle(18, 14, 6);
  g.generateTexture("attackCloud", 36, 36);

  // ---------- PUFF DE ENEMIGO DERROTADO ----------
  g.clear();
  g.fillStyle(0xdddddd, 0.85);
  g.fillCircle(14, 14, 10);
  g.fillCircle(6, 16, 7);
  g.fillCircle(22, 16, 7);
  g.generateTexture("poof", 28, 28);

  // ---------- SUELO ----------
  g.clear();
  g.fillStyle(0x6b4226, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x4caf50, 1);
  g.fillRect(0, 0, 64, 12);
  g.fillStyle(0x3d8b40, 1);
  g.fillRect(0, 8, 64, 6);
  g.generateTexture("ground", 64, 64);

  // ---------- PLATAFORMA (madera) ----------
  g.clear();
  g.fillStyle(0x8a5a30, 1);
  g.fillRect(0, 0, 64, 18);
  g.lineStyle(1, 0x6b4226, 1);
  g.strokeRect(0, 0, 64, 18);
  g.lineBetween(21, 0, 21, 18);
  g.lineBetween(42, 0, 42, 18);
  g.generateTexture("platform", 64, 18);

  // ---------- BANDERA (meta) ----------
  g.clear();
  g.fillStyle(0x8a8a8a, 1);
  g.fillRect(6, 0, 6, 160);
  g.generateTexture("flagPole", 16, 160);

  g.clear();
  g.fillStyle(0xe63946, 1);
  g.fillTriangle(0, 0, 40, 8, 0, 16);
  g.generateTexture("flagCloth", 40, 16);

  // ---------- CORAZÓN (vidas) ----------
  g.clear();
  g.fillStyle(0xe63946, 1);
  g.fillCircle(7, 7, 7);
  g.fillCircle(15, 7, 7);
  g.fillTriangle(0, 9, 22, 9, 11, 22);
  g.generateTexture("heart", 22, 22);

  // ---------- NUBE DE FONDO (decorativa) ----------
  g.clear();
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(20, 16, 16);
  g.fillCircle(38, 12, 14);
  g.fillCircle(56, 16, 16);
  g.fillRect(14, 16, 48, 12);
  g.generateTexture("bgCloud", 76, 32);

  g.destroy();
}

// Recorta la foto real (cargada como "marlonFace") en un círculo, tal cual,
// sin cartoonizarla, y la deja lista como textura "marlonFaceCircle" para
// usarse igual que cualquier otra imagen del juego. Si la foto no cargó,
// no genera nada y quien la use debe recurrir a "marlonFaceFallback".
function bakeCircularFaceTexture(scene, sourceKey, outputKey) {
  if (scene.textures.exists(outputKey)) return;
  if (!scene.textures.exists(sourceKey)) return;

  const size = 128; // resolución alta para que se vea nítida al escalar
  const source = scene.textures.get(sourceKey).getSourceImage();

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const scale = Math.max(size / source.width, size / source.height);
  const drawW = source.width * scale;
  const drawH = source.height * scale;
  ctx.drawImage(source, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
  ctx.restore();

  scene.textures.addCanvas(outputKey, canvas);
}

function getPlayerFaceKey(scene) {
  return scene.textures.exists("marlonFaceCircle") ? "marlonFaceCircle" : "marlonFaceFallback";
}

// Pantalla de créditos sencilla, mostrada al pulsar "VER CRÉDITOS" desde la
// pantalla de victoria. Los campos de datos reales del propietario del
// proyecto (estudio, nombre, año, etc.) quedan como constantes fácilmente
// editables aquí arriba; no se inventa ningún nombre de desarrollador.
const CREDITS_CONFIG = {
  studioOrDeveloper: "", // ej. "Tu nombre o estudio" — déjalo vacío si no quieres mostrarlo
  year: "",
};

const CREDITS_JOKES = [
  "Ningún inodoro real fue maltratado durante el desarrollo.",
  "Las piscinas afectadas permanecen bajo investigación.",
  "Los árboles de Navidad se negaron a declarar.",
];

class CreditsScene extends Phaser.Scene {
  constructor() {
    super("CreditsScene");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#2b2b52");
    const cx = width / 2;

    this.add
      .text(cx, 40, "EL CAGÓN MARLON", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "34px",
        color: "#ffd93d",
        stroke: "#1a1a33",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const rows = [
      ["Protagonista", "Marlon"],
      ["Villano derrotado", "Rey Maloliente"],
      ["Título oficial", "Cagón Número Uno"],
    ];
    if (CREDITS_CONFIG.studioOrDeveloper) rows.push(["Desarrollado por", CREDITS_CONFIG.studioOrDeveloper]);
    if (CREDITS_CONFIG.year) rows.push(["Año", CREDITS_CONFIG.year]);

    const rowsText = rows.map(([label, value]) => label + ":\n" + value).join("\n\n");
    this.add
      .text(cx, 110, rowsText, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "16px",
        color: "#ffffff",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(cx, height - 150, CREDITS_JOKES.join("\n"), {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "12px",
        color: "#9be86b",
        fontStyle: "italic",
        align: "center",
        lineSpacing: 6,
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5, 0);

    const backButton = this.add
      .text(cx, height - 40, "VOLVER", {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#e63946",
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    backButton.on("pointerover", () => backButton.setScale(1.06));
    backButton.on("pointerout", () => backButton.setScale(1));
    backButton.on("pointerdown", () => this.scene.start("MenuScene"));
  }
}

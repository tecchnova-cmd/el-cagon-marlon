// Controles táctiles: solo se crean en dispositivos con pantalla táctil
// (móvil/tablet). En escritorio no aparecen y el teclado sigue funcionando
// exactamente igual, ya que los botones de mover/saltar simplemente
// simulan las mismas teclas (cursors.left/right/up) que ya lee Player.

function createTouchControls(scene) {
  const isTouch = scene.sys.game.device.input.touch;
  if (!isTouch) return;

  const { width, height } = scene.scale;
  scene.touchButtons = [];

  const makeButton = (x, y, label, size, fontSize) => {
    const bg = scene.add
      .image(x, y, "touchButtonBg")
      .setDisplaySize(size, size)
      .setScrollFactor(0)
      .setDepth(50)
      .setAlpha(0.75)
      .setInteractive({ useHandCursor: true });
    const text = scene.add
      .text(x, y, label, {
        fontFamily: "Comic Sans MS, sans-serif",
        fontSize: fontSize + "px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(51);
    scene.touchButtons.push(bg, text);
    return bg;
  };

  const bindHold = (btn, key) => {
    btn.on("pointerdown", () => {
      key.isDown = true;
    });
    btn.on("pointerup", () => {
      key.isDown = false;
    });
    btn.on("pointerout", () => {
      key.isDown = false;
    });
  };

  // Movimiento (izquierda/derecha) y salto: abajo a la izquierda / derecha.
  const leftBtn = makeButton(50, height - 55, "◀", 62, 26);
  const rightBtn = makeButton(130, height - 55, "▶", 62, 26);
  bindHold(leftBtn, scene.cursors.left);
  bindHold(rightBtn, scene.cursors.right);

  const jumpBtn = makeButton(width - 50, height - 55, "▲", 62, 26);
  bindHold(jumpBtn, scene.cursors.up);

  // Ataques: un toque = un ataque (no mantener pulsado).
  const poopBtn = makeButton(width - 135, height - 55, "CACA", 62, 13);
  poopBtn.on("pointerdown", () => scene.player.throwPoop(scene.poopGroup));

  const bottleBtn = makeButton(width - 135, height - 140, "BOTELLA", 56, 11);
  bottleBtn.on("pointerdown", () => scene.player.throwBottle(scene.bottleGroup));

  // Pausa: mismo efecto que ESC.
  const pauseBtn = makeButton(width - 50, height - 140, "❚❚", 44, 18);
  pauseBtn.on("pointerdown", () => openPauseMenu(scene));
}

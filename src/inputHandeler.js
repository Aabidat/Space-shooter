// Bridges keyboard, mouse, and touch input to paddle movement.
export default class InputHanderler {
  constructor(paddle, GameWidth, gameScreen, GameHeight) {
    const canvas = gameScreen || document.getElementById("GameScreen");
    let isMouseDown = false;
    let isTouchActive = false;

    function getCanvasCoords(clientX, clientY) {
      if (!canvas) return { x: paddle.position.x, y: paddle.position.y };
      // Convert browser pixels into canvas coordinates.
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    }

    function setPaddleFromPointer(clientX, clientY) {
      const { x: canvasX, y: canvasY } = getCanvasCoords(clientX, clientY);
      // Use live bounds so control remains correct after viewport/canvas resize.
      const liveWidth = canvas ? canvas.width : (paddle.gameWidth || GameWidth);
      const liveHeight = canvas ? canvas.height : (paddle.gameHeight || GameHeight);
      // Clamp movement inside game bounds.
      const x = Math.max(0, Math.min(canvasX - paddle.width / 2, liveWidth - paddle.width));
      const y = Math.max(0, Math.min(canvasY - paddle.height / 2, liveHeight - paddle.height));
      paddle.position.x = x;
      paddle.position.y = y;
      paddle.speed = 0;
      paddle.speedY = 0;
    }

    document.addEventListener("mousemove", (event) => {
      if (!canvas || !isMouseDown) return;
      setPaddleFromPointer(event.clientX, event.clientY);
    });

    canvas.addEventListener("mousedown", (event) => {
      isMouseDown = true;
      setPaddleFromPointer(event.clientX, event.clientY);
    });

    document.addEventListener("mouseup", () => {
      isMouseDown = false;
      paddle.speed = 0;
      paddle.speedY = 0;
    });

    document.addEventListener("touchmove", (event) => {
      if (!canvas || !event.touches.length || !isTouchActive) return;
      event.preventDefault();
      const touch = event.touches[0];
      setPaddleFromPointer(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener("touchstart", (event) => {
      if (!canvas || !event.touches.length) return;
      isTouchActive = true;
      const touch = event.touches[0];
      setPaddleFromPointer(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener("touchend", () => {
      isTouchActive = false;
      paddle.speed = 0;
      paddle.speedY = 0;
    });

    document.addEventListener("keydown", (event) => {
      switch (event.keyCode) {
        case 37:
          paddle.moveLeft();
          break;
        case 39:
          paddle.moveRight();
          break;
        case 38:
          paddle.moveUp();
          break;
        case 40:
          paddle.moveDown();
          break;
      }
    });

    document.addEventListener("keyup", (event) => {
      switch (event.keyCode) {
        case 37:
          if (paddle.speed < 0) paddle.stop();
          break;
        case 39:
          if (paddle.speed > 0) paddle.stop();
          break;
        case 38:
          if (paddle.speedY < 0) paddle.stopY();
          break;
        case 40:
          if (paddle.speedY > 0) paddle.stopY();
          break;
      }
    });
  }
}

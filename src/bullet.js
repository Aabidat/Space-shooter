import { drawStylizedBullet } from "/src/bulletVisual.js";

export default class Bullet {
  constructor(paddle, img, style = {}) {
    const scale = Math.max(0.6, style.scale ?? 1);
    this.width = 30 * scale;
    this.height = 30 * scale;

    this.top = {
      width: 4,

      height: 2.5,
    };

    this.smallTop = {
      width: 2,

      height: 1.5,
    };

    this.speed = 80;

    this.position = {
      x: paddle.position.x + paddle.width / 2 - this.width / 2,

      y: paddle.position.y - 25,
    };

    this.img = img;
    this.style = { ...style };

  }

  draw(ctx) {
    drawStylizedBullet(ctx, this);
  }

  update(deltaTime) {
    if (!deltaTime) return;

    this.position.y -= this.speed / deltaTime;
  }
}

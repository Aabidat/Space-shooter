import { drawStylizedBullet } from "/src/bulletVisual.js";

export default class SLBullet {
  constructor(bullet, img, style = {}) {
    const scale = Math.max(0.6, style.scale ?? 0.8);
    this.width = 20 * scale;
    this.height = 20 * scale;
    this.speed = 80;
    this.position = {
      x: bullet.position.x + bullet.width / 2 - this.width / 2 - 18,
      y: bullet.position.y + bullet.height / 2 - this.height / 2,
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

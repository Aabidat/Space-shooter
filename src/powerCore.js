export default class PowerCore {
  constructor(gameWidth) {
    this.width = 34;
    this.height = 34;
    this.position = {
      x: Math.floor(Math.random() * (gameWidth - 60)) + 20,
      y: -this.height,
    };
    this.speed = 85 + Math.random() * 35;
  }

  draw(ctx) {
    const cx = this.position.x + this.width / 2;
    const cy = this.position.y + this.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "rgba(255, 210, 64, 0.95)";
    ctx.shadowColor = "rgba(255, 210, 64, 0.7)";
    ctx.shadowBlur = 12;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 250, 200, 0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, -12, 24, 24);
    ctx.restore();
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.position.y += this.speed * (deltaTime / 1000);
  }
}

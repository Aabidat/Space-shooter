/**
 * Blast effect at a position: expanding circles that fade out.
 */
export default class Explosion {
  constructor(x, y, size = 1) {
    this.position = { x, y };
    this.radius = 0;
    this.maxRadius = 40 * size;
    this.duration = 400;
    this.elapsed = 0;
    this.finished = false;
  }

  draw(ctx) {
    if (this.finished) return;
    const t = this.elapsed / this.duration;
    const r = this.radius;
    const alpha = 1 - t;
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, r
    );
    gradient.addColorStop(0, "rgba(255, 200, 80, 0.9)");
    gradient.addColorStop(0.3, "rgba(255, 120, 40, 0.6)");
    gradient.addColorStop(0.6, "rgba(255, 60, 20, 0.3)");
    gradient.addColorStop(1, "rgba(255, 40, 0, 0)");

    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  update(deltaTime) {
    if (this.finished) return;
    this.elapsed += deltaTime;
    const t = Math.min(1, this.elapsed / this.duration);
    this.radius = this.maxRadius * (1 - Math.pow(1 - t, 2));
    if (this.elapsed >= this.duration) this.finished = true;
  }
}

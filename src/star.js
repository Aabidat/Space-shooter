/**
 * Parallax star: layer 0 = far (small, dim, slow), 1 = mid, 2 = near (bright, fast).
 * Optional twinkle for a more live feel.
 */
export default class Star {
  constructor(isTop, gameWidth, gameHeight, layer) {
    this.layer = layer === undefined ? Math.floor(Math.random() * 3) : layer;
    const sizeByLayer = [1, 1.5, 2.5];
    const speedByLayer = [0.015, 0.025, 0.04];
    const alphaByLayer = [0.4, 0.7, 1];
    this.width = sizeByLayer[this.layer];
    this.height = sizeByLayer[this.layer];
    this.baseSpeed = speedByLayer[this.layer] * (4 + Math.random() * 6);
    this.alpha = alphaByLayer[this.layer] * (0.85 + Math.random() * 0.15);
    this.position = { x: Math.random() * gameWidth };
    if (isTop) {
      this.position.y = -10 - Math.random() * 30;
    } else {
      this.position.y = Math.random() * gameHeight;
    }
    this.twinklePhase = Math.random() * Math.PI * 2;
  }

  draw(ctx) {
    const twinkle = 0.7 + 0.3 * Math.sin(Date.now() * 0.003 + this.twinklePhase);
    const a = this.alpha * twinkle;
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.fillRect(
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.position.y += this.baseSpeed * deltaTime;
  }
}

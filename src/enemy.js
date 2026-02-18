export default class Enemy {
  constructor(gameWidth, img, options = {}) {
    this.width = options.width || 40;
    this.height = options.height || 40;
    this.health = options.health ?? 1;
    this.maxHealth = this.health;
    this.img = img;
    this.position = {
      x: Math.max(0, Math.random() * (gameWidth - this.width)),
      y: -this.height - 10,
    };
    this.speed = (options.speed ?? 80) + Math.random() * (options.speedRange || 40);
  }

  draw(ctx) {
    if (this.img && this.img.complete) {
      ctx.drawImage(
        this.img,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    } else {
      ctx.fillStyle = "#f44";
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.position.y += this.speed * (deltaTime / 1000);
  }
}

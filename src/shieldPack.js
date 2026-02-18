export default class ShieldPack {
  constructor(gameWidth, img) {
    this.width = 40;
    this.height = 40;
    this.position = {
      x: Math.floor(Math.random() * (gameWidth - 60)) + 20,
      y: -20,
    };
    this.speed = Math.floor(Math.random() * 9) + 19;
    this.img = img || null;
  }

  draw(ctx) {
    if (this.img) {
      ctx.drawImage(
        this.img,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    } else {
      ctx.strokeStyle = "#0af";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        this.position.x + 2,
        this.position.y + 2,
        this.width - 4,
        this.height - 4
      );
      ctx.fillStyle = "rgba(0, 170, 255, 0.3)";
      ctx.fillRect(
        this.position.x + 4,
        this.position.y + 4,
        this.width - 8,
        this.height - 8
      );
    }
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.position.y += this.speed / deltaTime;
  }
}

export default class HealthPack {
  constructor(GameWidth, img) {
    this.width = 40;
    this.height = 40;
    this.position = {
      x: Math.floor(Math.random() * (GameWidth - 60)) + 20,
      y: -this.height,
    };
    this.speed = 90 + Math.random() * 40;
    this.img = img;
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
      ctx.fillStyle = "#0f8";
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.position.y += this.speed * (deltaTime / 1000);
  }
}

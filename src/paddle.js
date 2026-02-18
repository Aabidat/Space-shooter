export default class Paddle {
  constructor(GameWidth, GameHeight, img) {
    this.gameWidth = GameWidth;
    this.gameHeight = GameHeight;
    this.width = 64;
    this.height = 64;
    this.img = img;
    this.maxSpeed = 20;
    this.speed = 0;
    this.speedY = 0;
    this.position = {
      x: GameWidth / 2 - this.width / 2,
      y: GameHeight - this.height - 10,
    };
  }

  moveLeft() {
    this.speed = -this.maxSpeed;
  }

  moveRight() {
    this.speed = this.maxSpeed;
  }

  moveUp() {
    this.speedY = -this.maxSpeed;
  }

  moveDown() {
    this.speedY = this.maxSpeed;
  }

  stop() {
    this.speed = 0;
  }

  stopY() {
    this.speedY = 0;
  }

  draw(ctx) {
    ctx.drawImage(
      this.img,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.position.x += this.speed;
    this.position.y += this.speedY;
    this.position.x = Math.max(0, Math.min(this.position.x, this.gameWidth - this.width));
    this.position.y = Math.max(0, Math.min(this.position.y, this.gameHeight - this.height));
  }
}

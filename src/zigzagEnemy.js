import Enemy from "/src/enemy.js";

export default class ZigzagEnemy extends Enemy {
  constructor(gameWidth, img, level = 1) {
    super(gameWidth, img, {
      width: 36,
      height: 36,
      health: 1,
      speed: 70,
      speedRange: 30,
      level,
    });
    this.gameWidth    = gameWidth;
    this.wobbleSpeed  = 2.5;
    this.wobbleAmount = 80;
    this.time = Math.random() * Math.PI * 2;
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.time += (deltaTime / 1000) * this.wobbleSpeed;
    this.position.y += this.speed * (deltaTime / 1000);
    this.position.x += Math.sin(this.time) * this.wobbleAmount * (deltaTime / 1000);
    this.position.x = Math.max(0, Math.min(this.position.x, this.gameWidth - this.width));
  }
}
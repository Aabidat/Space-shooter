import Enemy from "/src/enemy.js";

export default class TankEnemy extends Enemy {
  constructor(gameWidth, img, level = 1) {
    super(gameWidth, img, {
      width: 52,
      height: 52,
      health: 3,
      speed: 45,
      speedRange: 20,
      level,
    });
    this.maxHealth = this.health;
  }

  draw(ctx) {
    super.draw(ctx);
    // Health bar above the enemy
    const barW = this.width;
    const barH = 5;
    const bx = this.position.x;
    const by = this.position.y - 10;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = this.health > this.maxHealth * 0.5 ? "#0c0" : "#fa0";
    ctx.fillRect(bx, by, barW * (this.health / this.maxHealth), barH);
  }
}
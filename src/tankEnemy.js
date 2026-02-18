import Enemy from "/src/enemy.js";

export default class TankEnemy extends Enemy {
  constructor(gameWidth, img) {
    super(gameWidth, img, {
      width: 48,
      height: 48,
      health: 3,
      speed: 45,
      speedRange: 20,
    });
  }

  draw(ctx) {
    super.draw(ctx);
    const barW = this.width;
    const barH = 4;
    const bx = this.position.x;
    const by = this.position.y - 8;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "#0c0";
    ctx.fillRect(bx, by, barW * (this.health / this.maxHealth), barH);
  }
}

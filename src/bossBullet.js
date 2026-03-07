export default class BossBullet {
  constructor(boss, target) {
    this.width = 10;
    this.height = 10;

    this.position = {
      x: boss.position.x + boss.width / 2 - this.width / 2,
      y: boss.position.y + boss.height * 0.7,
    };

    const dx = target.position.x + target.width / 2 - (boss.position.x + boss.width / 2);
    const dy = target.position.y + target.height / 2 - (boss.position.y + boss.height / 2);
    const len = Math.max(1, Math.hypot(dx, dy));
    this.vx = dx / len;
    this.vy = dy / len;

    this.speed = boss.bulletSpeed ?? (boss.isFinal ? 140 : 110);
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#ff5577";
    ctx.shadowColor = "rgba(255,85,119,0.7)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  update(deltaTime) {
    if (!deltaTime) return;
    const step = this.speed / deltaTime;
    this.position.x += this.vx * step;
    this.position.y += this.vy * step;
  }
}

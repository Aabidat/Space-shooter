const BULLET_BOOSTER_VARIANTS = [
  {
    id: "prismatic",
    title: "Prismatic Surge",
    duration: 12000,
    color: "#ff66ff",
    style: { shape: "shard", hue: 320, sat: 92, lit: 58, glow: 20, scale: 1.2 },
  },
  {
    id: "solar",
    title: "Solar Lance",
    duration: 11000,
    color: "#ffc94b",
    style: { shape: "lance", hue: 42, sat: 94, lit: 64, glow: 18, scale: 1.1 },
  },
  {
    id: "aurora",
    title: "Aurora Bloom",
    duration: 14000,
    color: "#66ffe3",
    style: { shape: "orb", hue: 170, sat: 94, lit: 65, glow: 22, scale: 1.15 },
  },
  {
    id: "vortex",
    title: "Vortex Fang",
    duration: 13000,
    color: "#66a4ff",
    style: { shape: "diamond", hue: 215, sat: 90, lit: 55, glow: 16, scale: 1.05 },
  },
];

export default class BulletBooster {
  constructor(gameWidth) {
    this.variant = BULLET_BOOSTER_VARIANTS[Math.floor(Math.random() * BULLET_BOOSTER_VARIANTS.length)];
    this.width = 32;
    this.height = 32;
    this.position = {
      x: Math.floor(Math.random() * (gameWidth - 60)) + 30,
      y: -this.height,
    };
    this.speed = 72 + Math.random() * 28;
    this.rotation = Math.random() * Math.PI * 2;
    this.spinSpeed = 0.01 + Math.random() * 0.02;
  }

  draw(ctx) {
    const cx = this.position.x + this.width / 2;
    const cy = this.position.y + this.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.strokeStyle = this.variant.color;
    ctx.lineWidth = 2.4;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.rotation += this.spinSpeed * deltaTime;
    this.position.y += this.speed * (deltaTime / 1000);
  }
}

/**
 * Glassmorphic galactic background: deep gradient, drifting nebula clouds,
 * and soft glowing orbs. Uses gameTime for smooth movement.
 */
export default class Background {
  constructor(gameWidth, gameHeight) {
    this.width = gameWidth;
    this.height = gameHeight;
    this.time = 0;

    this.nebulas = [];
    const nebulaCount = 6;
    for (let i = 0; i < nebulaCount; i++) {
      this.nebulas.push({
        x: Math.random() * gameWidth,
        y: Math.random() * gameHeight,
        radius: 120 + Math.random() * 200,
        driftX: (Math.random() - 0.5) * 0.02,
        driftY: (Math.random() - 0.5) * 0.015,
        hue: 240 + Math.random() * 60,
        alpha: 0.04 + Math.random() * 0.06,
      });
    }

    this.orbs = [];
    const orbCount = 8;
    for (let i = 0; i < orbCount; i++) {
      this.orbs.push({
        x: Math.random() * gameWidth,
        y: Math.random() * gameHeight,
        radius: 40 + Math.random() * 80,
        driftX: (Math.random() - 0.5) * 0.03,
        driftY: (Math.random() - 0.5) * 0.02,
        hue: 250 + Math.random() * 40,
        alpha: 0.06 + Math.random() * 0.08,
        blur: 25 + Math.random() * 40,
      });
    }
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.time += deltaTime * 0.001;

    this.nebulas.forEach((n) => {
      n.x += n.driftX * deltaTime;
      n.y += n.driftY * deltaTime;
      if (n.x < -n.radius) n.x += this.width + n.radius * 2;
      if (n.x > this.width + n.radius) n.x -= this.width + n.radius * 2;
      if (n.y < -n.radius) n.y += this.height + n.radius * 2;
      if (n.y > this.height + n.radius) n.y -= this.height + n.radius * 2;
    });

    this.orbs.forEach((o) => {
      o.x += o.driftX * deltaTime;
      o.y += o.driftY * deltaTime;
      if (o.x < -o.radius) o.x += this.width + o.radius * 2;
      if (o.x > this.width + o.radius) o.x -= this.width + o.radius * 2;
      if (o.y < -o.radius) o.y += this.height + o.radius * 2;
      if (o.y > this.height + o.radius) o.y -= this.height + o.radius * 2;
    });
  }

  draw(ctx) {
    const w = this.width;
    const h = this.height;

    const pulse = 0.98 + 0.04 * Math.sin(this.time * 0.5);

    const bgGrad = ctx.createLinearGradient(0, 0, w * 0.5, h);
    bgGrad.addColorStop(0, `rgba(8, 6, 24, ${pulse})`);
    bgGrad.addColorStop(0.4, "rgba(12, 10, 32, 1)");
    bgGrad.addColorStop(0.7, "rgba(18, 8, 42, 1)");
    bgGrad.addColorStop(1, "rgba(5, 4, 18, 1)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const centerGrad = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, w * 0.8);
    centerGrad.addColorStop(0, "rgba(60, 40, 120, 0.12)");
    centerGrad.addColorStop(0.5, "rgba(30, 20, 80, 0.06)");
    centerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = centerGrad;
    ctx.fillRect(0, 0, w, h);

    this.nebulas.forEach((n) => {
      const ng = ctx.createRadialGradient(
        n.x, n.y, 0,
        n.x, n.y, n.radius
      );
      ng.addColorStop(0, `hsla(${n.hue}, 70%, 60%, ${n.alpha})`);
      ng.addColorStop(0.4, `hsla(${n.hue}, 60%, 50%, ${n.alpha * 0.6})`);
      ng.addColorStop(0.8, `hsla(${n.hue}, 50%, 40%, ${n.alpha * 0.2})`);
      ng.addColorStop(1, "hsla(240, 30%, 20%, 0)");
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.save();
    this.orbs.forEach((o) => {
      const og = ctx.createRadialGradient(
        o.x - o.radius * 0.3, o.y - o.radius * 0.3, 0,
        o.x, o.y, o.radius
      );
      og.addColorStop(0, `hsla(${o.hue}, 80%, 75%, ${o.alpha})`);
      og.addColorStop(0.3, `hsla(${o.hue}, 70%, 55%, ${o.alpha * 0.7})`);
      og.addColorStop(0.7, `hsla(${o.hue}, 60%, 40%, ${o.alpha * 0.3})`);
      og.addColorStop(1, "hsla(240, 40%, 25%, 0)");
      ctx.fillStyle = og;
      ctx.shadowColor = `hsla(${o.hue}, 80%, 70%, 0.5)`;
      ctx.shadowBlur = o.blur;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.restore();

    const glassStrip = ctx.createLinearGradient(0, 0, 0, h);
    glassStrip.addColorStop(0, "rgba(120, 100, 200, 0.03)");
    glassStrip.addColorStop(0.2, "rgba(80, 60, 160, 0.02)");
    glassStrip.addColorStop(0.5, "rgba(40, 30, 100, 0.01)");
    glassStrip.addColorStop(1, "rgba(20, 15, 60, 0.02)");
    ctx.fillStyle = glassStrip;
    ctx.fillRect(0, 0, w, h);
  }

  resize(gameWidth, gameHeight) {
    this.width = gameWidth;
    this.height = gameHeight;
  }
}

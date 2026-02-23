/**
 * Cinematic explosion: shockwave ring, fireball, sparks, smoke puffs, debris shards.
 * size: scale multiplier (1 = normal enemy, 2+ = boss)
 * color: accent hue (0-360) for level-themed tinting
 */
export default class Explosion {
  constructor(x, y, size = 1, colorHue = 25) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.hue = colorHue;
    this.duration = 600 + size * 180;
    this.elapsed = 0;
    this.finished = false;

    // Sparks
    this.sparks = [];
    const sparkCount = Math.floor(10 + size * 14);
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 5) * size;
      this.sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        size: 1.5 + Math.random() * 2.5 * size,
        hue: colorHue + (Math.random() - 0.5) * 40,
      });
    }

    // Debris shards
    this.debris = [];
    const debrisCount = Math.floor(4 + size * 5);
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1 + Math.random() * 3) * size;
      this.debris.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        len: (4 + Math.random() * 8) * size,
        life: 0.4 + Math.random() * 0.4,
      });
    }

    // Smoke puffs
    this.smokes = [];
    const smokeCount = Math.floor(3 + size * 3);
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 1.5) * size;
      this.smokes.push({
        x: x + (Math.random() - 0.5) * 20 * size,
        y: y + (Math.random() - 0.5) * 20 * size,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        radius: (8 + Math.random() * 12) * size,
        life: 0.5 + Math.random() * 0.5,
      });
    }
  }

  update(deltaTime) {
    if (this.finished) return;
    const dt = deltaTime / 1000;
    this.elapsed += deltaTime;

    this.sparks.forEach(s => {
      s.x += s.vx; s.y += s.vy;
      s.vy += 0.12 * this.size; // gravity
      s.vx *= 0.96; s.vy *= 0.96;
    });
    this.debris.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      d.vy += 0.06 * this.size;
      d.rot += d.rotSpeed;
    });
    this.smokes.forEach(s => {
      s.x += s.vx; s.y += s.vy;
      s.radius += 1.2 * this.size * dt * 60;
    });

    if (this.elapsed >= this.duration) this.finished = true;
  }

  draw(ctx) {
    if (this.finished) return;
    const t = Math.min(1, this.elapsed / this.duration);
    const maxR = 50 * this.size;

    ctx.save();

    // ── Smoke puffs (behind everything) ──────────────────────────────────
    this.smokes.forEach(s => {
      const sLife = Math.max(0, s.life - t);
      if (sLife <= 0) return;
      const alpha = sLife * 0.22;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
      g.addColorStop(0, `rgba(160,160,160,${alpha})`);
      g.addColorStop(1, `rgba(80,80,80,0)`);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });

    // ── Shockwave ring ────────────────────────────────────────────────────
    if (t < 0.45) {
      const ringT = t / 0.45;
      const ringR = maxR * 1.8 * ringT;
      const ringAlpha = (1 - ringT) * 0.7;
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${this.hue}, 100%, 80%, ${ringAlpha})`;
      ctx.lineWidth = (4 - ringT * 3) * this.size;
      ctx.stroke();

      // inner ring
      if (t < 0.25) {
        const ir = maxR * 0.8 * (t / 0.25);
        ctx.beginPath();
        ctx.arc(this.x, this.y, ir, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${(1 - t / 0.25) * 0.5})`;
        ctx.lineWidth = 2 * this.size;
        ctx.stroke();
      }
    }

    // ── Core fireball ─────────────────────────────────────────────────────
    if (t < 0.7) {
      const fireT = t / 0.7;
      const r = maxR * (1 - Math.pow(1 - Math.min(fireT * 1.4, 1), 2));
      const alpha = t < 0.15 ? t / 0.15 : 1 - (fireT - 0.3) / 0.7;
      const fg = ctx.createRadialGradient(
        this.x - r * 0.2, this.y - r * 0.2, 0,
        this.x, this.y, Math.max(r, 1)
      );
      fg.addColorStop(0, `rgba(255,255,220,${Math.max(0, alpha)})`);
      fg.addColorStop(0.2, `hsla(${this.hue + 20}, 100%, 70%, ${Math.max(0, alpha * 0.9)})`);
      fg.addColorStop(0.5, `hsla(${this.hue}, 100%, 50%, ${Math.max(0, alpha * 0.7)})`);
      fg.addColorStop(0.8, `hsla(${this.hue - 10}, 80%, 30%, ${Math.max(0, alpha * 0.4)})`);
      fg.addColorStop(1, `hsla(${this.hue}, 60%, 20%, 0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(r, 1), 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();
    }

    // ── Flash (very start) ────────────────────────────────────────────────
    if (t < 0.08) {
      const flashA = (1 - t / 0.08) * 0.85;
      ctx.beginPath();
      ctx.arc(this.x, this.y, maxR * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${flashA})`;
      ctx.fill();
    }

    // ── Sparks ────────────────────────────────────────────────────────────
    this.sparks.forEach(s => {
      const sLife = Math.max(0, s.life - t * 1.2);
      if (sLife <= 0) return;
      const alpha = sLife * 0.9;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * sLife, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue}, 100%, 75%, ${alpha})`;
      ctx.fill();

      // spark trail
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 3, s.y - s.vy * 3);
      ctx.strokeStyle = `hsla(${s.hue}, 100%, 85%, ${alpha * 0.5})`;
      ctx.lineWidth = s.size * 0.6 * sLife;
      ctx.stroke();
    });

    // ── Debris shards ─────────────────────────────────────────────────────
    this.debris.forEach(d => {
      const dLife = Math.max(0, d.life - t);
      if (dLife <= 0) return;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.globalAlpha = dLife * 0.8;
      ctx.fillStyle = `hsla(${this.hue + 30}, 60%, 50%, 1)`;
      ctx.fillRect(-d.len / 2, -1.5 * this.size, d.len, 3 * this.size);
      ctx.restore();
    });

    ctx.restore();
  }
}
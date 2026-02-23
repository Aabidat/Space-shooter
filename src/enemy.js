/**
 * Enemy — procedurally drawn. Shape, color, and glow change with level.
 * No sprite required. Looks more alien/unique at higher levels.
 */
export default class Enemy {
  constructor(gameWidth, img, options = {}) {
    this.width  = options.width  || 40;
    this.height = options.height || 40;
    this.health    = options.health  ?? 1;
    this.maxHealth = this.health;
    this.img    = img; // kept for compatibility but we draw procedurally
    this.level  = options.level || 1;
    this.position = {
      x: Math.max(0, Math.random() * (gameWidth - this.width)),
      y: -this.height - 10,
    };
    this.speed = (options.speed ?? 80) + Math.random() * (options.speedRange || 40);

    // Visual identity seeded per-instance
    this.seed       = Math.random() * 1000;
    this.pulseOffset = Math.random() * Math.PI * 2;

    // Compute color from level
    this._computeAppearance();
  }

  _computeAppearance() {
    const l = this.level;
    // Hue cycles through dramatic colors as level increases
    const hues = [200, 160, 120, 0, 280, 30, 185, 310, 20, 220, 55, 155, 345, 38, 200];
    this.hue  = hues[Math.min(l - 1, hues.length - 1)];
    this.sat  = 80 + Math.min(l * 2, 20);      // more saturated at higher levels
    this.lit  = Math.max(40, 65 - l * 2);       // darker at higher levels
    this.glowSize = 8 + l * 2;
    // Shape tier: 0 = simple, 1 = medium, 2 = complex alien
    this.shapeTier = l <= 4 ? 0 : l <= 9 ? 1 : 2;
  }

  /** Draw an alien ship hull procedurally */
  _drawHull(ctx, cx, cy, w, h, t) {
    const tier = this.shapeTier;
    const hue  = this.hue;
    const sat  = this.sat;
    const lit  = this.lit;
    const pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.003 + this.pulseOffset);

    // ── Glow halo ────────────────────────────────────────────────────────
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.7);
    glow.addColorStop(0, `hsla(${hue}, ${sat}%, ${lit + 20}%, ${0.25 * pulse})`);
    glow.addColorStop(1, `hsla(${hue}, ${sat}%, ${lit}%, 0)`);
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    if (tier === 0) {
      // Simple invader-style saucer
      this._drawSaucer(ctx, cx, cy, w, h, hue, sat, lit, pulse);
    } else if (tier === 1) {
      // Fighter jet / angular craft
      this._drawFighter(ctx, cx, cy, w, h, hue, sat, lit, pulse);
    } else {
      // Alien bio-mech horror
      this._drawAlien(ctx, cx, cy, w, h, hue, sat, lit, pulse);
    }
  }

  _drawSaucer(ctx, cx, cy, w, h, hue, sat, lit, pulse) {
    // Main body ellipse
    ctx.save();
    const bodyGrad = ctx.createRadialGradient(cx, cy - h * 0.1, 1, cx, cy, w * 0.5);
    bodyGrad.addColorStop(0, `hsl(${hue}, ${sat}%, ${lit + 25}%)`);
    bodyGrad.addColorStop(0.6, `hsl(${hue}, ${sat}%, ${lit}%)`);
    bodyGrad.addColorStop(1, `hsl(${hue - 20}, ${sat}%, ${lit - 15}%)`);

    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.48, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Cockpit dome
    const domeGrad = ctx.createRadialGradient(cx - w * 0.08, cy - h * 0.18, 1, cx, cy - h * 0.1, w * 0.2);
    domeGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
    domeGrad.addColorStop(0.4, `hsla(${hue + 40}, 90%, 80%, 0.5)`);
    domeGrad.addColorStop(1, `hsla(${hue}, 80%, 50%, 0.1)`);
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.1, w * 0.2, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = domeGrad;
    ctx.fill();

    // Engine glow dots
    [-w * 0.28, 0, w * 0.28].forEach(ox => {
      ctx.beginPath();
      ctx.arc(cx + ox, cy + h * 0.12, 3 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue + 60}, 100%, 80%)`;
      ctx.fill();
    });
    ctx.restore();
  }

  _drawFighter(ctx, cx, cy, w, h, hue, sat, lit, pulse) {
    ctx.save();
    // Main fuselage (pointing downward = toward player)
    const fg = ctx.createLinearGradient(cx - w * 0.3, cy, cx + w * 0.3, cy);
    fg.addColorStop(0, `hsl(${hue - 10}, ${sat}%, ${lit - 10}%)`);
    fg.addColorStop(0.5, `hsl(${hue}, ${sat}%, ${lit + 15}%)`);
    fg.addColorStop(1, `hsl(${hue - 10}, ${sat}%, ${lit - 10}%)`);

    ctx.beginPath();
    ctx.moveTo(cx, cy + h * 0.5);             // nose (down)
    ctx.lineTo(cx - w * 0.18, cy);
    ctx.lineTo(cx - w * 0.38, cy - h * 0.1);
    ctx.lineTo(cx - w * 0.22, cy - h * 0.45);
    ctx.lineTo(cx, cy - h * 0.35);
    ctx.lineTo(cx + w * 0.22, cy - h * 0.45);
    ctx.lineTo(cx + w * 0.38, cy - h * 0.1);
    ctx.lineTo(cx + w * 0.18, cy);
    ctx.closePath();
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.strokeStyle = `hsl(${hue + 40}, 100%, 80%)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.05, w * 0.1, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue + 60}, 100%, 85%, 0.7)`;
    ctx.fill();

    // Engine flames (top)
    const flameLen = h * 0.25 * pulse;
    const fg2 = ctx.createLinearGradient(cx, cy - h * 0.4, cx, cy - h * 0.4 - flameLen);
    fg2.addColorStop(0, `hsla(${hue + 20}, 100%, 70%, 0.9)`);
    fg2.addColorStop(1, `hsla(${hue + 40}, 100%, 85%, 0)`);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.1, cy - h * 0.4);
    ctx.lineTo(cx + w * 0.1, cy - h * 0.4);
    ctx.lineTo(cx, cy - h * 0.4 - flameLen);
    ctx.closePath();
    ctx.fillStyle = fg2;
    ctx.fill();

    ctx.restore();
  }

  _drawAlien(ctx, cx, cy, w, h, hue, sat, lit, pulse) {
    ctx.save();
    const t = Date.now() * 0.002 + this.pulseOffset;

    // Organic blob body using bezier curves (animate slightly)
    const wobble = Math.sin(t) * 3;
    const bodyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    bodyGrad.addColorStop(0, `hsl(${hue + 30}, ${sat}%, ${lit + 20}%)`);
    bodyGrad.addColorStop(0.5, `hsl(${hue}, ${sat}%, ${lit}%)`);
    bodyGrad.addColorStop(1, `hsl(${hue - 20}, ${sat}%, ${lit - 20}%)`);

    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.45);
    ctx.bezierCurveTo(
      cx + w * 0.5 + wobble, cy - h * 0.3,
      cx + w * 0.48 - wobble, cy + h * 0.25,
      cx, cy + h * 0.48
    );
    ctx.bezierCurveTo(
      cx - w * 0.48 + wobble, cy + h * 0.25,
      cx - w * 0.5 - wobble, cy - h * 0.3,
      cx, cy - h * 0.45
    );
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Pulsating eye(s)
    const eyeR = w * 0.14 * pulse;
    const eyeGrad = ctx.createRadialGradient(cx - eyeR * 0.3, cy - eyeR * 0.3, 0, cx, cy, eyeR);
    eyeGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    eyeGrad.addColorStop(0.3, `hsl(${hue + 90}, 100%, 70%)`);
    eyeGrad.addColorStop(1, `hsl(${hue + 90}, 80%, 30%)`);
    ctx.beginPath();
    ctx.arc(cx, cy, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = eyeGrad;
    ctx.fill();

    // Pupil
    ctx.beginPath();
    ctx.arc(cx, cy, eyeR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fill();

    // Tentacle-like appendages
    const numTentacles = 4;
    for (let i = 0; i < numTentacles; i++) {
      const angle = (i / numTentacles) * Math.PI * 2 + t * 0.5;
      const tx1 = cx + Math.cos(angle) * w * 0.45;
      const ty1 = cy + Math.sin(angle) * h * 0.45;
      const tx2 = cx + Math.cos(angle + 0.4) * w * 0.7;
      const ty2 = cy + Math.sin(angle + 0.4) * h * 0.7;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * w * 0.3, cy + Math.sin(angle) * h * 0.3);
      ctx.quadraticCurveTo(tx1, ty1, tx2, ty2);
      ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${lit + 10}%, 0.7)`;
      ctx.lineWidth = 3 * pulse;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tip glow
      ctx.beginPath();
      ctx.arc(tx2, ty2, 3 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue + 60}, 100%, 80%)`;
      ctx.fill();
    }

    ctx.restore();
  }

  draw(ctx) {
    const cx = this.position.x + this.width / 2;
    const cy = this.position.y + this.height / 2;

    ctx.save();
    ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;
    ctx.shadowBlur = this.glowSize;
    this._drawHull(ctx, cx, cy, this.width, this.height, 0);
    ctx.restore();
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.position.y += this.speed * (deltaTime / 1000);
  }
}
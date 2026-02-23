/**
 * Paddle — player spaceship drawn procedurally.
 * Architecture evolves with level: basic fighter → armored cruiser → battle-mech.
 * Engine trails, cockpit, hull details all change.
 */
export default class Paddle {
  constructor(GameWidth, GameHeight, img) {
    this.gameWidth  = GameWidth;
    this.gameHeight = GameHeight;
    this.width  = 64;
    this.height = 64;
    this.img    = img; // kept for compat, not used for draw
    this.maxSpeed = 20;
    this.speed  = 0;
    this.speedY = 0;
    this.level  = 1;
    this.position = {
      x: GameWidth / 2 - this.width / 2,
      y: GameHeight - this.height - 10,
    };
    this._thrustPhase = 0;
    this._trailParticles = [];
  }

  moveLeft()  { this.speed  = -this.maxSpeed; }
  moveRight() { this.speed  =  this.maxSpeed; }
  moveUp()    { this.speedY = -this.maxSpeed; }
  moveDown()  { this.speedY =  this.maxSpeed; }
  stop()      { this.speed  = 0; }
  stopY()     { this.speedY = 0; }

  /** Call this from main.js when level changes */
  setLevel(lvl) { this.level = lvl; }

  draw(ctx) {
    const cx = this.position.x + this.width / 2;
    const cy = this.position.y + this.height / 2;
    const w  = this.width;
    const h  = this.height;
    const t  = Date.now() * 0.001;
    const thrustPulse = 0.7 + 0.3 * Math.sin(t * 18);

    const tier = this.level <= 4 ? 0 : this.level <= 9 ? 1 : 2;
    const theme = this._getTheme();

    ctx.save();

    // ── Engine thrust flame (behind ship) ────────────────────────────────
    this._drawThrust(ctx, cx, cy, w, h, thrustPulse, theme, tier);

    // ── Hull ─────────────────────────────────────────────────────────────
    if      (tier === 0) this._drawTier0(ctx, cx, cy, w, h, theme, thrustPulse);
    else if (tier === 1) this._drawTier1(ctx, cx, cy, w, h, theme, thrustPulse);
    else                  this._drawTier2(ctx, cx, cy, w, h, theme, thrustPulse);

    ctx.restore();
  }

  _getTheme() {
    const l = this.level;
    const themes = [
      { hull: '#4488ff', accent: '#88ccff', cockpit: '#aaeeff', engine: '#00aaff' }, // L1-4
      { hull: '#22cc66', accent: '#66ffaa', cockpit: '#ccffee', engine: '#00ff88' }, // L5-9
      { hull: '#cc3344', accent: '#ff6677', cockpit: '#ffccdd', engine: '#ff2255' }, // L10+
    ];
    return themes[Math.min(l <= 4 ? 0 : l <= 9 ? 1 : 2, themes.length - 1)];
  }

  _drawThrust(ctx, cx, cy, w, h, pulse, theme, tier) {
    const nozzles = tier === 0 ? [[0, 0]] :
                    tier === 1 ? [[-w * 0.22, 0], [w * 0.22, 0]] :
                                 [[-w * 0.3, 0], [0, 0], [w * 0.3, 0]];

    nozzles.forEach(([ox]) => {
      const flameH = (h * 0.5 + h * 0.3 * pulse) * (1 + tier * 0.3);
      const flameW = w * 0.13 * (1 + tier * 0.1);
      const baseY  = cy + h * 0.42;

      // Outer flame
      const fg = ctx.createRadialGradient(cx + ox, baseY, 0, cx + ox, baseY + flameH * 0.5, flameH * 0.6);
      fg.addColorStop(0, `hsla(${this._engineHue()}, 100%, 85%, 0.95)`);
      fg.addColorStop(0.3, `hsla(${this._engineHue()}, 100%, 60%, 0.7)`);
      fg.addColorStop(0.7, `hsla(${this._engineHue() + 30}, 100%, 50%, 0.3)`);
      fg.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.moveTo(cx + ox - flameW, baseY);
      ctx.quadraticCurveTo(cx + ox, baseY + flameH * 1.1, cx + ox + flameW, baseY);
      ctx.fillStyle = fg;
      ctx.fill();

      // Inner hot core
      const ig = ctx.createLinearGradient(cx + ox, baseY, cx + ox, baseY + flameH * 0.4);
      ig.addColorStop(0, 'rgba(255,255,255,0.9)');
      ig.addColorStop(1, `hsla(${this._engineHue()}, 100%, 70%, 0)`);
      ctx.beginPath();
      ctx.moveTo(cx + ox - flameW * 0.4, baseY);
      ctx.quadraticCurveTo(cx + ox, baseY + flameH * 0.55, cx + ox + flameW * 0.4, baseY);
      ctx.fillStyle = ig;
      ctx.fill();

      // Glow
      ctx.save();
      ctx.shadowColor = theme.engine;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx + ox, baseY + 2, flameW * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this._engineHue()}, 100%, 80%, 0.4)`;
      ctx.fill();
      ctx.restore();
    });
  }

  _engineHue() {
    const hues = [200, 160, 120, 0, 130, 30, 185, 310, 20, 220, 55, 155, 345, 38, 200];
    return hues[Math.min(this.level - 1, hues.length - 1)];
  }

  // ── Tier 0: Basic fighter (Levels 1-4) ───────────────────────────────────
  _drawTier0(ctx, cx, cy, w, h, theme, pulse) {
    // Hull body
    const hg = ctx.createLinearGradient(cx - w * 0.4, cy, cx + w * 0.4, cy);
    hg.addColorStop(0, shadeHex(theme.hull, -30));
    hg.addColorStop(0.5, theme.hull);
    hg.addColorStop(1, shadeHex(theme.hull, -30));

    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.48);           // nose
    ctx.lineTo(cx + w * 0.36, cy + h * 0.28);
    ctx.lineTo(cx + w * 0.22, cy + h * 0.42);
    ctx.lineTo(cx - w * 0.22, cy + h * 0.42);
    ctx.lineTo(cx - w * 0.36, cy + h * 0.28);
    ctx.closePath();
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Wing flares
    [[1], [-1]].forEach(([s]) => {
      ctx.beginPath();
      ctx.moveTo(cx + s * w * 0.28, cy + h * 0.1);
      ctx.lineTo(cx + s * w * 0.5,  cy + h * 0.38);
      ctx.lineTo(cx + s * w * 0.22, cy + h * 0.42);
      ctx.fillStyle = `${theme.hull}bb`;
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Cockpit
    const cg = ctx.createRadialGradient(cx - 4, cy - h * 0.1, 1, cx, cy, h * 0.18);
    cg.addColorStop(0, 'rgba(255,255,255,0.9)');
    cg.addColorStop(0.4, `${theme.cockpit}cc`);
    cg.addColorStop(1, `${theme.hull}44`);
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.08, w * 0.11, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();

    // Hull stripe
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.45);
    ctx.lineTo(cx, cy + h * 0.42);
    ctx.strokeStyle = `${theme.accent}66`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ── Tier 1: Armored cruiser (Levels 5-9) ─────────────────────────────────
  _drawTier1(ctx, cx, cy, w, h, theme, pulse) {
    // Main fuselage
    const hg = ctx.createLinearGradient(cx - w * 0.5, cy, cx + w * 0.5, cy);
    hg.addColorStop(0, shadeHex(theme.hull, -25));
    hg.addColorStop(0.35, theme.hull);
    hg.addColorStop(0.65, theme.hull);
    hg.addColorStop(1, shadeHex(theme.hull, -25));

    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.5);             // nose
    ctx.lineTo(cx + w * 0.16, cy - h * 0.2);
    ctx.lineTo(cx + w * 0.44, cy + h * 0.1);
    ctx.lineTo(cx + w * 0.44, cy + h * 0.35);
    ctx.lineTo(cx + w * 0.28, cy + h * 0.48);
    ctx.lineTo(cx - w * 0.28, cy + h * 0.48);
    ctx.lineTo(cx - w * 0.44, cy + h * 0.35);
    ctx.lineTo(cx - w * 0.44, cy + h * 0.1);
    ctx.lineTo(cx - w * 0.16, cy - h * 0.2);
    ctx.closePath();
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Armor plates
    [[1], [-1]].forEach(([s]) => {
      ctx.beginPath();
      ctx.moveTo(cx + s * w * 0.16, cy - h * 0.05);
      ctx.lineTo(cx + s * w * 0.44, cy + h * 0.1);
      ctx.lineTo(cx + s * w * 0.44, cy + h * 0.35);
      ctx.lineTo(cx + s * w * 0.18, cy + h * 0.35);
      ctx.closePath();
      ctx.fillStyle = shadeHex(theme.hull, -15) + 'cc';
      ctx.fill();
      ctx.strokeStyle = theme.accent + '88';
      ctx.lineWidth = 1; ctx.stroke();

      // Cannon nubs
      ctx.beginPath();
      ctx.rect(cx + s * w * 0.36, cy - h * 0.04, s * w * 0.12, h * 0.22);
      ctx.fillStyle = shadeHex(theme.hull, -20);
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1; ctx.stroke();
    });

    // Cockpit (larger + more detailed)
    const cg = ctx.createRadialGradient(cx - 5, cy - h * 0.15, 1, cx, cy - h * 0.05, h * 0.22);
    cg.addColorStop(0, 'rgba(255,255,255,0.95)');
    cg.addColorStop(0.3, `${theme.cockpit}ee`);
    cg.addColorStop(1, `${theme.hull}33`);
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.08, w * 0.14, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();

    // Panel lines
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.48); ctx.lineTo(cx, cy + h * 0.45);
    ctx.strokeStyle = `${theme.accent}44`;
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.35, cy + h * 0.15); ctx.lineTo(cx + w * 0.35, cy + h * 0.15);
    ctx.stroke();
    ctx.setLineDash([]);

    // Side guns glow
    [[-w * 0.44, cy - h * 0.05], [w * 0.44, cy - h * 0.05]].forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(cx + ox, oy, 4, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  // ── Tier 2: Battle-mech dreadnought (Levels 10-15) ───────────────────────
  _drawTier2(ctx, cx, cy, w, h, theme, pulse) {
    const t = Date.now() * 0.001;
    const warpPulse = 0.92 + 0.08 * Math.sin(t * 6);

    // Lower thruster pods
    [[1], [-1]].forEach(([s]) => {
      ctx.beginPath();
      ctx.roundRect(cx + s * w * 0.28, cy + h * 0.28, s * w * 0.24, h * 0.22, 4);
      ctx.fillStyle = shadeHex(theme.hull, -30);
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1; ctx.stroke();
    });

    // Main hull — wide angular body
    const hg = ctx.createLinearGradient(cx - w * 0.55, cy, cx + w * 0.55, cy);
    hg.addColorStop(0, shadeHex(theme.hull, -20));
    hg.addColorStop(0.25, theme.hull);
    hg.addColorStop(0.5, shadeHex(theme.hull, 20));
    hg.addColorStop(0.75, theme.hull);
    hg.addColorStop(1, shadeHex(theme.hull, -20));

    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.52);
    ctx.lineTo(cx + w * 0.14, cy - h * 0.3);
    ctx.lineTo(cx + w * 0.55, cy - h * 0.1);
    ctx.lineTo(cx + w * 0.55, cy + h * 0.2);
    ctx.lineTo(cx + w * 0.38, cy + h * 0.5);
    ctx.lineTo(cx - w * 0.38, cy + h * 0.5);
    ctx.lineTo(cx - w * 0.55, cy + h * 0.2);
    ctx.lineTo(cx - w * 0.55, cy - h * 0.1);
    ctx.lineTo(cx - w * 0.14, cy - h * 0.3);
    ctx.closePath();
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2; ctx.stroke();

    // Heavy shoulder armor
    [[1], [-1]].forEach(([s]) => {
      const ag = ctx.createLinearGradient(cx + s * w * 0.2, cy - h * 0.2, cx + s * w * 0.55, cy);
      ag.addColorStop(0, theme.hull);
      ag.addColorStop(1, shadeHex(theme.hull, -25));
      ctx.beginPath();
      ctx.moveTo(cx + s * w * 0.14, cy - h * 0.28);
      ctx.lineTo(cx + s * w * 0.55, cy - h * 0.1);
      ctx.lineTo(cx + s * w * 0.55, cy + h * 0.2);
      ctx.lineTo(cx + s * w * 0.22, cy + h * 0.2);
      ctx.closePath();
      ctx.fillStyle = ag;
      ctx.fill();
      ctx.strokeStyle = theme.accent + '88';
      ctx.lineWidth = 1.2; ctx.stroke();

      // Weapon barrel
      ctx.beginPath();
      ctx.roundRect(cx + s * w * 0.44, cy - h * 0.18, s * w * 0.16, h * 0.5, 3);
      ctx.fillStyle = shadeHex(theme.hull, -35);
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1; ctx.stroke();

      // Muzzle glow
      ctx.beginPath();
      ctx.arc(cx + s * w * (s > 0 ? 0.6 : 0.6), cy - h * 0.12, 5 * warpPulse, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Energy core / cockpit
    const pct = 0.8 + 0.2 * warpPulse;
    const cg = ctx.createRadialGradient(cx - 6, cy - h * 0.16, 1, cx, cy - h * 0.05, h * 0.26 * pct);
    cg.addColorStop(0, 'rgba(255,255,255,0.98)');
    cg.addColorStop(0.25, `${theme.cockpit}ff`);
    cg.addColorStop(0.6, `${theme.accent}aa`);
    cg.addColorStop(1, `${theme.hull}22`);
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.07, w * 0.16 * pct, h * 0.24 * pct, 0, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();

    // Energy ring around cockpit
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.07, w * 0.22 * pct, 0, Math.PI * 2);
    ctx.strokeStyle = `${theme.accent}${Math.round(warpPulse * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Panel grid lines
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.5); ctx.lineTo(cx, cy + h * 0.48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - w * 0.5, cy + h * 0.05); ctx.lineTo(cx + w * 0.5, cy + h * 0.05); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - w * 0.5, cy - h * 0.05); ctx.lineTo(cx + w * 0.5, cy - h * 0.05); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Corner rivets
    [[-w * 0.48, cy - h * 0.06], [w * 0.48, cy - h * 0.06],
     [-w * 0.38, cy + h * 0.44], [w * 0.38, cy + h * 0.44]].forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(cx + ox, oy, 3, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent + 'cc';
      ctx.fill();
    });
  }

  update(deltaTime) {
    if (!deltaTime) return;
    this.position.x += this.speed;
    this.position.y += this.speedY;
    this.position.x = Math.max(0, Math.min(this.position.x, this.gameWidth - this.width));
    this.position.y = Math.max(0, Math.min(this.position.y, this.gameHeight - this.height));
  }
}

/** Lighten/darken a hex color by amt (-255 to +255) */
function shadeHex(hex, amt) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
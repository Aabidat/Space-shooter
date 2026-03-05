import Paddle from "/src/paddle.js";
import InputHanderler from "/src/inputHandeler.js";
import Enemy from "/src/enemy.js";
import FastEnemy from "/src/fastEnemy.js";
import TankEnemy from "/src/tankEnemy.js";
import ZigzagEnemy from "/src/zigzagEnemy.js";
import MEnemy from "/src/mEnemy.js";
import HealthPack from "/src/healthPack.js";
import Star from "/src/star.js";
import Bullet from "/src/bullet.js";
import SLBullet from "/src/sLBullet.js";
import SRBullet from "/src/sRBullet.js";
import Load from "/src/load.js";
import ShieldPack from "/src/shieldPack.js";
import Background from "/src/background.js";
import Explosion from "/src/explosion.js";
import { playShoot, playExplosion, playCollect, playGameOver, playBossExplosion, playLevelUp, playVictory, startEngine, stopEngine } from "/src/sounds.js";

// ─── Canvas Setup ────────────────────────────────────────────────────────────
const GameScreen = document.getElementById("GameScreen");
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("selectstart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());
if (GameScreen) {
  GameScreen.addEventListener("contextmenu", (e) => e.preventDefault());
  GameScreen.addEventListener("dblclick", (e) => e.preventDefault());
}

GameScreen.width = innerWidth;
GameScreen.height = innerHeight;
const ctx = GameScreen.getContext("2d");

let GameWidth = innerWidth;
let GameHeight = innerHeight;

// ─── Level Theme Palettes ────────────────────────────────────────────────────
const LEVEL_THEMES = [
  { bgHue: 240, accent: "#00d4ff", name: "SECTOR ALPHA" },
  { bgHue: 180, accent: "#00ffcc", name: "NEBULA BETA" },
  { bgHue: 130, accent: "#00ff88", name: "VOID GAMMA" },
  { bgHue: 0,   accent: "#ff4444", name: "CRIMSON SECTOR" },
  { bgHue: 270, accent: "#cc44ff", name: "DARK FRONTIER" },
  { bgHue: 30,  accent: "#ff8800", name: "ORBITAL RIFT" },
  { bgHue: 190, accent: "#44ddff", name: "SILICON BELT" },
  { bgHue: 310, accent: "#ff44cc", name: "SPECTRAL REACH" },
  { bgHue: 15,  accent: "#ff6633", name: "EMBER FIELD" },
  { bgHue: 225, accent: "#6688ff", name: "OBSIDIAN VALE" },
  { bgHue: 55,  accent: "#ffee00", name: "RADIANT PIERS" },
  { bgHue: 155, accent: "#00ffaa", name: "NEURAL ARCHIVE" },
  { bgHue: 345, accent: "#ff2244", name: "SINGULARIS" },
  { bgHue: 38,  accent: "#ffaa00", name: "OMEGA FORGE" },
  { bgHue: 200, accent: "#ffffff", name: "ASCENSION CORE" },
];

function getTheme(lvl) {
  return LEVEL_THEMES[Math.min(lvl - 1, LEVEL_THEMES.length - 1)];
}

// ─── Images ──────────────────────────────────────────────────────────────────
// FIX: Set onload/onerror BEFORE .src to avoid race conditions & hangs
let playerImg = new Image();
let enemyImg  = new Image();
let bossImg   = new Image();
let bulletImg = new Image();
let healthImg = new Image();

let imagesResolved = 0;
const totalImages = 5;

function onImageSettled() {
  imagesResolved++;
  if (imagesResolved >= totalImages) gameState = "start";
}

[playerImg, enemyImg, bossImg, bulletImg, healthImg].forEach((img) => {
  img.onload  = onImageSettled;
  img.onerror = onImageSettled;
});

// Hard timeout: never hang longer than 4 seconds
setTimeout(() => { if (gameState === "loading") gameState = "start"; }, 4000);

playerImg.src = 'https://i.ibb.co/TYHmXbK/player.png';
enemyImg.src  = 'https://i.ibb.co/Hd3LbdZ/enemy.png';
bossImg.src   = 'https://i.ibb.co/J2bZS2n/boss.png';
bulletImg.src = 'https://i.ibb.co/HYLzSLV/bullet.png';
healthImg.src = 'https://i.ibb.co/PhqgB2G/health.png';

// ─── Game State ───────────────────────────────────────────────────────────────
let health = 300;
let score = 0;
let bullets = [], sLBullets = [], sRBullets = [];
let enemies = [], mEnemies = [];
let healthPacks = [], shieldPacks = [], explosions = [], stars = [];
let shooterPower = 1.0;
let enemiesKilled = 0;

let galacticBackground = new Background(GameWidth, GameHeight);
let died = false;
let gameState = "loading";
let gameTime = 0;
let highScore = parseInt(localStorage.getItem("spaceShooterHighScore") || "0", 10);
let shieldActive = false;
let shieldEndTime = 0;
const SHIELD_DURATION_MS = 12000;
let shootIntervalId = null;
const SHOOT_INTERVAL_MS = 200;
let level = 1;
let scoreForNextLevel = 1000;
let zoneBannerUntil = 0;
const FINAL_LEVEL = LEVEL_THEMES.length;
let finalBossSpawned = false;
let gameWon = false;
let paused = false;

// ─── Paddle & Input ───────────────────────────────────────────────────────────
let paddle = new Paddle(GameWidth, GameHeight, playerImg);
new InputHanderler(paddle, GameWidth, GameScreen, GameHeight);

// ─── Pause Button ─────────────────────────────────────────────────────────────
function createPauseButton() {
  if (document.getElementById("pauseBtn")) return;
  const btn = document.createElement("button");
  btn.id = "pauseBtn";
  btn.innerHTML = getPauseIcon();
  btn.title = "Pause (P / Esc)";
  Object.assign(btn.style, {
    position: "fixed", top: "16px", right: "16px", zIndex: "100",
    width: "44px", height: "44px", borderRadius: "12px",
    border: "1.5px solid rgba(255,255,255,0.16)",
    background: "rgba(8,6,24,0.76)", backdropFilter: "blur(14px)",
    color: "rgba(255,255,255,0.82)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.16s ease",
    boxShadow: "0 4px 22px rgba(0,0,0,0.45)", outline: "none",
  });
  btn.addEventListener("mouseenter", () => {
    btn.style.background = "rgba(0,212,255,0.16)";
    btn.style.borderColor = "rgba(0,212,255,0.55)";
    btn.style.color = "#00d4ff";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "rgba(8,6,24,0.76)";
    btn.style.borderColor = "rgba(255,255,255,0.16)";
    btn.style.color = "rgba(255,255,255,0.82)";
  });
  btn.addEventListener("click", (e) => { e.stopPropagation(); togglePause(); });
  document.body.appendChild(btn);
}

function removePauseButton() {
  const btn = document.getElementById("pauseBtn");
  if (btn) btn.remove();
}

function getPauseIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="1" width="4" height="14" rx="1.5" fill="currentColor"/>
    <rect x="10" y="1" width="4" height="14" rx="1.5" fill="currentColor"/>
  </svg>`;
}

function getPlayIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 1.5L14 8L4 14.5V1.5Z" fill="currentColor"/>
  </svg>`;
}

function togglePause() {
  if (gameState === "playing") {
    paused = true; gameState = "paused"; stopHoldShoot();
    const btn = document.getElementById("pauseBtn");
    if (btn) { btn.innerHTML = getPlayIcon(); btn.title = "Resume (P / Esc)"; }
  } else if (gameState === "paused") {
    paused = false; gameState = "playing";
    const btn = document.getElementById("pauseBtn");
    if (btn) { btn.innerHTML = getPauseIcon(); btn.title = "Pause (P / Esc)"; }
  }
}

// ─── Screen-transition listeners ─────────────────────────────────────────────
function handleStartTransition(e) {
  if (e && e.target && e.target.id === "pauseBtn") return;
  if (gameState === "start")    { gameState = "playing"; startEngine(); createPauseButton(); return; }
  if (gameState === "gameover") { restartGame(); gameState = "playing"; startEngine(); createPauseButton(); return; }
  if (gameState === "won")      { restartGame(); gameState = "playing"; startEngine(); createPauseButton(); return; }
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" || e.key === "p" || e.key === "P") {
    if (gameState === "playing" || gameState === "paused") { togglePause(); return; }
  }
  handleStartTransition(e);
});
document.addEventListener("click",      handleStartTransition);
document.addEventListener("touchstart", handleStartTransition, { passive: true });

// ─── Initial star field ───────────────────────────────────────────────────────
for (let i = 0; i < GameWidth; i += 40)
  for (let x = 0; x < GameHeight; x += 40)
    stars.push(new Star(false, GameWidth, GameHeight));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function collision(a, b) {
  return a.position.x < b.position.x + b.width  &&
         a.position.x + a.width  > b.position.x &&
         a.position.y < b.position.y + b.height &&
         a.position.y + a.height > b.position.y;
}
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function updateShooterPower() {
  shooterPower = Math.min(3.0, 1.0 + (level - 1) * 0.15 + enemiesKilled * 0.02);
}

// ─── Spawn helpers ────────────────────────────────────────────────────────────
let lastEnemySpawn  = 0;
let lastBossSpawn   = 0;
let lastHealthSpawn = 0;
let lastShieldSpawn = 0;
let lastStarSpawn   = 0;

// FIX: Dynamic spawn interval — slower at low levels, scales up gradually
function getSpawnInterval() {
  return Math.max(350, 900 - (level - 1) * 40);
}

function spawnEnemy() {
  if (gameState !== "playing") return;
  // FIX: Hard cap on screen enemies to keep game playable
  const maxOnScreen = Math.min(6 + level * 2, 22);
  if (enemies.length >= maxOnScreen) return;
  if (level <= 2 && Math.random() > 0.55) return;

  // FIX: Always spawn 1, occasionally 2 — never the old "spawn level count"
  const count = (level >= 4 && Math.random() < 0.35) ? 2 : 1;

  for (let i = 0; i < count; i++) {
    if (enemies.length >= maxOnScreen) break;
    const roll = Math.random();
    let enemy;
    if      (level <= 2)  enemy = roll < 0.25 ? new FastEnemy(GameWidth, enemyImg, level) : new Enemy(GameWidth, enemyImg, { level });
    else if (level <= 5)  enemy = roll < 0.50 ? new TankEnemy(GameWidth, enemyImg, level) : new Enemy(GameWidth, enemyImg, { level });
    else if (level <= 8)  {
      if      (roll < 0.40) enemy = new FastEnemy(GameWidth, enemyImg, level);
      else if (roll < 0.65) enemy = new ZigzagEnemy(GameWidth, enemyImg, level);
      else                  enemy = new Enemy(GameWidth, enemyImg, { level });
    } else if (level <= 11) {
      if      (roll < 0.35) enemy = new TankEnemy(GameWidth, enemyImg, level);
      else if (roll < 0.65) enemy = new ZigzagEnemy(GameWidth, enemyImg, level);
      else                  enemy = new Enemy(GameWidth, enemyImg, { level });
    } else {
      if      (roll < 0.25) enemy = new FastEnemy(GameWidth, enemyImg, level);
      else if (roll < 0.45) enemy = new TankEnemy(GameWidth, enemyImg, level);
      else if (roll < 0.70) enemy = new ZigzagEnemy(GameWidth, enemyImg, level);
      else                  enemy = new Enemy(GameWidth, enemyImg, { level });
    }
    enemies.push(enemy);
  }
}

function spawnMEnemy() {
  if (gameState !== "playing") return;
  if (level === FINAL_LEVEL) {
    if (!finalBossSpawned) {
      let boss = new MEnemy(GameWidth, bossImg);
      boss.health = 200; boss.maxHealth = 200;
      boss.width = 220; boss.height = 220; boss.speed = 20; boss.isFinal = true;
      mEnemies.push(boss); finalBossSpawned = true;
    }
    return;
  }
  if (level === 1 || mEnemies.length >= 2) return;
  mEnemies.push(new MEnemy(GameWidth, bossImg));
}

function spawnHealth() { if (gameState === "playing") healthPacks.push(new HealthPack(GameWidth, healthImg)); }
function spawnShield() { if (gameState === "playing") shieldPacks.push(new ShieldPack(GameWidth)); }

// ─── Shooting ─────────────────────────────────────────────────────────────────
function fire() {
  if (gameState !== "playing") return;
  playShoot();
  const bullet = new Bullet(paddle, bulletImg);
  bullets.push(bullet);
  sLBullets.push(new SLBullet(bullet, bulletImg));
  sRBullets.push(new SRBullet(bullet, bulletImg));
}
function startHoldShoot() {
  if (gameState !== "playing") return;
  fire();
  if (!shootIntervalId)
    shootIntervalId = setInterval(() => { if (gameState === "playing") fire(); }, SHOOT_INTERVAL_MS);
}
function stopHoldShoot() {
  if (shootIntervalId) { clearInterval(shootIntervalId); shootIntervalId = null; }
}
GameScreen.addEventListener("mousedown",  startHoldShoot);
GameScreen.addEventListener("mouseup",    stopHoldShoot);
GameScreen.addEventListener("mouseleave", stopHoldShoot);
document.addEventListener("mouseup",      stopHoldShoot);
GameScreen.addEventListener("touchstart", startHoldShoot, { passive: true });
GameScreen.addEventListener("touchend",   stopHoldShoot,  { passive: true });
document.addEventListener("touchend",     stopHoldShoot,  { passive: true });

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD(timestamp, theme) {
  const accent = theme.accent;
  const pad = 16;
  ctx.save();

  // ── Left panel: HP ────────────────────────────────────────────────────────
  const hasShield = shieldActive && timestamp < shieldEndTime;
  const panelH = hasShield ? 80 : 56;
  roundedRect(ctx, pad, pad, 204, panelH, 12);
  ctx.fillStyle = "rgba(4,3,18,0.78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = "rgba(160,160,210,0.65)";
  ctx.font = "600 9px Orbitron, sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillText("HULL INTEGRITY", pad + 12, pad + 17);
  ctx.letterSpacing = "0px";

  const barX = pad + 12, barY = pad + 22, barW = 180, barH = 11, barR = 4;
  roundedRect(ctx, barX, barY, barW, barH, barR);
  ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();

  const maxHealth = 400;
  const fillFrac = Math.max(0, Math.min(health, maxHealth) / maxHealth);
  if (fillFrac > 0) {
    const fc = health > maxHealth * 0.6 ? "#00e676" : health > maxHealth * 0.25 ? "#ffab00" : "#ff5252";
    roundedRect(ctx, barX + 1, barY + 1, (barW - 2) * fillFrac, barH - 2, barR - 1);
    ctx.fillStyle = fc;
    ctx.shadowColor = fc; ctx.shadowBlur = 7;
    ctx.fill(); ctx.shadowBlur = 0;
  }

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "700 10px Orbitron, sans-serif";
  ctx.fillText(Math.max(0, Math.ceil(health)) + " / " + maxHealth, barX, barY + barH + 14);

  if (hasShield) {
    const left = (shieldEndTime - timestamp) / SHIELD_DURATION_MS;
    const sY = barY + barH + 22;
    ctx.fillStyle = accent + "66";
    ctx.font = "600 8px Orbitron, sans-serif";
    ctx.fillText("SHIELD", barX, sY);
    roundedRect(ctx, barX, sY + 4, barW, 6, 3);
    ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();
    roundedRect(ctx, barX + 1, sY + 5, (barW - 2) * left, 4, 2);
    ctx.fillStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = 8;
    ctx.fill(); ctx.shadowBlur = 0;
  }

  // ── Score strip — bottom center ───────────────────────────────────────────
  ctx.font = "700 14px Orbitron, sans-serif";
  const scoreStr = score.toLocaleString();
  const sW = ctx.measureText("SCORE  " + scoreStr).width + 40;
  const sCX = GameWidth / 2;
  roundedRect(ctx, sCX - sW / 2, GameHeight - 44, sW, 28, 10);
  ctx.fillStyle = "rgba(4,3,18,0.82)"; ctx.fill();
  ctx.strokeStyle = accent + "28"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.shadowColor = accent; ctx.shadowBlur = 10;
  ctx.fillText("SCORE  " + scoreStr, sCX, GameHeight - 25);
  ctx.shadowBlur = 0;
  ctx.textAlign = "left";

  // ── Top right info panel ──────────────────────────────────────────────────
  const infoX = GameWidth - 168;
  roundedRect(ctx, infoX, pad, 152, 68, 12);
  ctx.fillStyle = "rgba(4,3,18,0.78)"; ctx.fill();
  ctx.strokeStyle = accent + "35"; ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = "800 12px Orbitron, sans-serif";
  ctx.shadowColor = accent; ctx.shadowBlur = 8;
  ctx.fillText("LV " + level, infoX + 12, pad + 18);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(200,200,235,0.5)";
  ctx.font = "500 9px Rajdhani, sans-serif";
  ctx.fillText(theme.name, infoX + 12, pad + 31);

  ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(infoX + 8, pad + 39); ctx.lineTo(infoX + 144, pad + 39); ctx.stroke();

  ctx.fillStyle = "rgba(255,200,55,0.75)";
  ctx.font = "600 10px Orbitron, sans-serif";
  ctx.fillText("BEST  " + highScore.toLocaleString(), infoX + 12, pad + 53);

  ctx.fillStyle = "rgba(160,160,210,0.55)";
  ctx.font = "600 9px Orbitron, sans-serif";
  ctx.fillText("PWR " + shooterPower.toFixed(1) + "×", infoX + 110, pad + 53);

  ctx.restore();
}

// ─── Zone Banner ──────────────────────────────────────────────────────────────
function drawZoneBanner(timestamp, theme) {
  if (timestamp >= zoneBannerUntil) return;
  const progress = 1 - (zoneBannerUntil - timestamp) / 2800;
  const alpha = progress < 0.12 ? progress / 0.12 : progress > 0.80 ? 1 - (progress - 0.80) / 0.20 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;

  const bH = 96, bY = GameHeight / 2 - bH / 2;
  ctx.fillStyle = "rgba(4,3,18,0.86)";
  ctx.fillRect(0, bY, GameWidth, bH);
  ctx.strokeStyle = theme.accent + "99"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, bY); ctx.lineTo(GameWidth, bY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, bY + bH); ctx.lineTo(GameWidth, bY + bH); ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = theme.accent + "77";
  ctx.font = "600 10px Orbitron, sans-serif";
  ctx.fillText("— ENTERING LEVEL " + level + " —", GameWidth / 2, bY + 26);

  ctx.fillStyle = "#fff";
  ctx.shadowColor = theme.accent; ctx.shadowBlur = 20;
  ctx.font = "900 30px Orbitron, sans-serif";
  ctx.fillText(theme.name, GameWidth / 2, bY + 62);
  ctx.shadowBlur = 0;

  ctx.textAlign = "left";
  ctx.restore();
}

// ─── Boss HP bars ─────────────────────────────────────────────────────────────
function drawBossHPBars() {
  for (const boss of mEnemies) {
    const bw = boss.isFinal ? 180 : 110, bh = boss.isFinal ? 12 : 8;
    const bx = boss.position.x + boss.width / 2 - bw / 2;
    const by = boss.position.y - 22;
    roundedRect(ctx, bx, by, bw, bh, 4);
    ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fill();
    const hp = Math.max(0, Math.min(boss.health, boss.maxHealth));
    if (hp > 0) {
      roundedRect(ctx, bx + 2, by + 2, ((bw - 4) * hp) / boss.maxHealth, bh - 4, 2);
      ctx.fillStyle = boss.isFinal ? "#ff2244" : "#ff5252";
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
      ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 1;
    roundedRect(ctx, bx, by, bw, bh, 4); ctx.stroke();
    if (boss.isFinal) {
      ctx.fillStyle = "#ff2244"; ctx.font = "700 9px Orbitron, sans-serif"; ctx.textAlign = "center";
      ctx.shadowColor = "#ff2244"; ctx.shadowBlur = 6;
      ctx.fillText("⚠ FINAL BOSS ⚠", bx + bw / 2, by - 5);
      ctx.shadowBlur = 0; ctx.textAlign = "left";
    }
  }
}

// ─── Pause Overlay ────────────────────────────────────────────────────────────
function drawPauseScreen() {
  ctx.save();
  ctx.fillStyle = "rgba(4,3,18,0.7)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);

  const cx = GameWidth / 2, cy = GameHeight / 2;
  roundedRect(ctx, cx - 190, cy - 110, 380, 220, 20);
  ctx.fillStyle = "rgba(8,6,26,0.92)"; ctx.fill();
  ctx.strokeStyle = "rgba(0,212,255,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.textAlign = "center";
  ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 22;
  ctx.fillStyle = "#00d4ff";
  ctx.font = "900 30px Orbitron, sans-serif";
  ctx.fillText("PAUSED", cx, cy - 38);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(190,190,235,0.65)";
  ctx.font = "500 13px Rajdhani, sans-serif";
  ctx.fillText("Press  P  or  Esc  to resume", cx, cy + 2);
  ctx.fillText("Or click the  ▶  button above", cx, cy + 22);

  ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 140, cy + 40); ctx.lineTo(cx + 140, cy + 40); ctx.stroke();

  ctx.fillStyle = "rgba(255,200,55,0.65)";
  ctx.font = "600 11px Orbitron, sans-serif";
  ctx.fillText("SCORE: " + score.toLocaleString() + "   |   LVL: " + level, cx, cy + 62);

  ctx.textAlign = "left";
  ctx.restore();
}

// ─── Static screens ───────────────────────────────────────────────────────────
function drawLoadingScreen() {
  ctx.fillStyle = "rgba(5,4,18,0.96)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2, cy = GameHeight / 2;

  ctx.textAlign = "center";
  ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 28;
  ctx.fillStyle = "#00d4ff";
  ctx.font = "900 40px Orbitron, sans-serif";
  ctx.fillText("SPACE SHOOTER", cx, cy - 82);
  ctx.shadowBlur = 0;

  const dots = "▪".repeat((Math.floor(Date.now() / 300) % 4) + 1);
  ctx.fillStyle = "rgba(170,170,225,0.7)";
  ctx.font = "500 15px Rajdhani, sans-serif";
  ctx.fillText("Initializing systems " + dots, cx, cy - 42);

  const bw = 300, bh = 10, bx = cx - bw / 2, by = cy - 22, br = 5;
  roundedRect(ctx, bx, by, bw, bh, br);
  ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();

  const frac = imagesResolved / totalImages;
  if (frac > 0) {
    roundedRect(ctx, bx + 1, by + 1, (bw - 2) * frac, bh - 2, br - 1);
    ctx.fillStyle = "#00d4ff"; ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 10;
    ctx.fill(); ctx.shadowBlur = 0;
  }

  ctx.fillStyle = "rgba(160,160,210,0.55)";
  ctx.font = "600 11px Orbitron, sans-serif";
  ctx.fillText(Math.round(frac * 100) + "%", cx, by + bh + 20);
  ctx.textAlign = "left";
}

function drawStartScreen() {
  ctx.fillStyle = "rgba(5,4,18,0.84)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2, cy = GameHeight / 2;

  const pW = Math.min(620, GameWidth - 48), pH = 292;
  roundedRect(ctx, cx - pW / 2, cy - pH / 2, pW, pH, 24);
  ctx.fillStyle = "rgba(7,5,22,0.92)"; ctx.fill();
  ctx.strokeStyle = "rgba(0,212,255,0.18)"; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.textAlign = "center";
  ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 28;
  ctx.fillStyle = "#00d4ff";
  ctx.font = "900 38px Orbitron, sans-serif";
  ctx.fillText("SPACE SHOOTER", cx, cy - 88);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(0,212,255,0.14)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - pW / 2 + 36, cy - 64); ctx.lineTo(cx + pW / 2 - 36, cy - 64); ctx.stroke();

  const lines = [
    ["🕹", "Hold & drag to move your ship"],
    ["🔫", "Hold mouse or touch to auto-fire"],
    ["❤",  "Collect health packs to restore hull"],
    ["🛡",  "Collect shield packs for protection"],
    ["🌌",  "15 unique sectors — Final boss awaits"],
  ];
  lines.forEach(([icon, text], i) => {
    const ly = cy - 38 + i * 27;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(160,160,210,0.55)";
    ctx.font = "400 14px Rajdhani, sans-serif";
    ctx.fillText(icon, cx - pW / 2 + 48, ly);
    ctx.fillStyle = "rgba(215,215,250,0.85)";
    ctx.font = "500 14px Rajdhani, sans-serif";
    ctx.fillText(text, cx - pW / 2 + 78, ly);
  });

  const pulse = 0.68 + 0.32 * Math.sin(Date.now() * 0.0028);
  ctx.globalAlpha = pulse;
  ctx.textAlign = "center";
  ctx.fillStyle = "#00d4ff";
  ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 14;
  ctx.font = "700 17px Orbitron, sans-serif";
  ctx.fillText("TAP OR PRESS ANY KEY TO LAUNCH", cx, cy + 118);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function drawGameOverScreen() {
  ctx.fillStyle = "rgba(8,3,16,0.95)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2, cy = GameHeight / 2;

  const pW = Math.min(540, GameWidth - 48), pH = 250;
  roundedRect(ctx, cx - pW / 2, cy - pH / 2, pW, pH, 22);
  ctx.fillStyle = "rgba(18,3,8,0.94)"; ctx.fill();
  ctx.strokeStyle = "rgba(255,80,80,0.28)"; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.textAlign = "center";
  ctx.shadowColor = "#ff5252"; ctx.shadowBlur = 28;
  ctx.fillStyle = "#ff5252";
  ctx.font = "900 36px Orbitron, sans-serif";
  ctx.fillText("GAME OVER", cx, cy - 64);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(255,80,80,0.12)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - pW / 2 + 36, cy - 38); ctx.lineTo(cx + pW / 2 - 36, cy - 38); ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "700 20px Rajdhani, sans-serif";
  ctx.fillText("SCORE  " + score.toLocaleString(), cx, cy + 2);
  ctx.fillStyle = "rgba(255,200,55,0.8)";
  ctx.font = "600 16px Rajdhani, sans-serif";
  ctx.fillText("BEST   " + highScore.toLocaleString(), cx, cy + 28);
  ctx.fillStyle = "rgba(170,170,220,0.6)";
  ctx.font = "400 12px Rajdhani, sans-serif";
  ctx.fillText("Reached: " + LEVEL_THEMES[Math.min(level - 1, LEVEL_THEMES.length - 1)].name, cx, cy + 52);

  const pulse = 0.68 + 0.32 * Math.sin(Date.now() * 0.0028);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#00d4ff";
  ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 12;
  ctx.font = "700 15px Orbitron, sans-serif";
  ctx.fillText("TAP OR PRESS ANY KEY TO RETRY", cx, cy + 98);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function drawWinScreen() {
  ctx.fillStyle = "rgba(2,8,14,0.97)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2, cy = GameHeight / 2;

  const pW = Math.min(640, GameWidth - 48), pH = 286;
  roundedRect(ctx, cx - pW / 2, cy - pH / 2, pW, pH, 24);
  ctx.fillStyle = "rgba(2,14,8,0.94)"; ctx.fill();
  ctx.strokeStyle = "rgba(0,255,160,0.22)"; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.textAlign = "center";
  ctx.shadowColor = "#00ffb2"; ctx.shadowBlur = 32;
  ctx.fillStyle = "#00ffb2";
  ctx.font = "900 38px Orbitron, sans-serif";
  ctx.fillText("YOU WIN!", cx, cy - 80);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(0,255,160,0.12)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - pW / 2 + 36, cy - 54); ctx.lineTo(cx + pW / 2 - 36, cy - 54); ctx.stroke();

  ctx.fillStyle = "rgba(190,240,215,0.78)";
  ctx.font = "500 15px Rajdhani, sans-serif";
  ctx.fillText("All 15 sectors cleared — Final Boss defeated!", cx, cy - 18);
  ctx.fillStyle = "#ffcc44";
  ctx.font = "700 22px Rajdhani, sans-serif";
  ctx.fillText("FINAL SCORE: " + score.toLocaleString(), cx, cy + 16);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "500 14px Rajdhani, sans-serif";
  ctx.fillText("BEST: " + highScore.toLocaleString(), cx, cy + 44);

  const pulse = 0.68 + 0.32 * Math.sin(Date.now() * 0.0028);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#00d4ff";
  ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 12;
  ctx.font = "700 15px Orbitron, sans-serif";
  ctx.fillText("TAP OR PRESS ANY KEY TO PLAY AGAIN", cx, cy + 102);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

// ─── Main game loop ───────────────────────────────────────────────────────────
let lastTime = null;

function gameLoop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  const deltaTime = Math.min(timestamp - lastTime, 100);
  lastTime = timestamp;

  ctx.clearRect(0, 0, GameWidth, GameHeight);
  galacticBackground.update(gameState === "playing" ? deltaTime : 16);
  galacticBackground.draw(ctx);

  if (gameState === "loading")  { drawLoadingScreen();  requestAnimationFrame(gameLoop); return; }
  if (gameState === "start")    { drawStartScreen();    requestAnimationFrame(gameLoop); return; }
  if (gameState === "gameover") { drawGameOverScreen(); requestAnimationFrame(gameLoop); return; }
  if (gameState === "won")      { drawWinScreen();      requestAnimationFrame(gameLoop); return; }

  if (gameState === "paused") {
    // Draw frozen world + overlay
    const theme = getTheme(level);
    ctx.fillStyle = `hsla(${theme.bgHue}, 70%, 30%, 0.07)`;
    ctx.fillRect(0, 0, GameWidth, GameHeight);
    stars.forEach(s => s.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    mEnemies.forEach(e => e.draw(ctx));
    healthPacks.forEach(h => h.draw(ctx));
    shieldPacks.forEach(s => s.draw(ctx));
    [bullets, sLBullets, sRBullets].forEach(arr => arr.forEach(b => b.draw(ctx)));
    explosions.forEach(ex => ex.draw(ctx));
    paddle.draw(ctx);
    drawHUD(performance.now(), theme);
    drawBossHPBars();
    drawPauseScreen();
    requestAnimationFrame(gameLoop);
    return;
  }

  // ── Playing ──────────────────────────────────────────────────────────────
  gameTime += deltaTime;
  const theme = getTheme(level);

  ctx.fillStyle = `hsla(${theme.bgHue}, 70%, 30%, 0.07)`;
  ctx.fillRect(0, 0, GameWidth, GameHeight);

  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].draw(ctx); stars[i].update(deltaTime);
    if (stars[i].position.y > GameHeight) stars.splice(i, 1);
  }
  if (timestamp - lastStarSpawn > 200) {
    stars.push(new Star(true, GameWidth, GameHeight));
    lastStarSpawn = timestamp;
  }

  const spawnInterval = getSpawnInterval();
  if (timestamp - lastEnemySpawn  > spawnInterval) { spawnEnemy();  lastEnemySpawn  = timestamp; }
  if (timestamp - lastBossSpawn   > 6000)           { spawnMEnemy(); lastBossSpawn   = timestamp; }
  if (timestamp - lastHealthSpawn > 7000)            { spawnHealth(); lastHealthSpawn = timestamp; }
  if (timestamp - lastShieldSpawn > 16000)           { spawnShield(); lastShieldSpawn = timestamp; }

  if (shieldActive && timestamp >= shieldEndTime) shieldActive = false;

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (i >= enemies.length) continue;
    enemies[i].draw(ctx); enemies[i].update(deltaTime);
    if (collision(paddle, enemies[i])) {
      explosions.push(new Explosion(enemies[i].position.x + enemies[i].width / 2, enemies[i].position.y + enemies[i].height / 2, 1.2, theme.bgHue));
      if (!shieldActive) health -= enemies[i].health === enemies[i].maxHealth ? 20 : 8;
      playExplosion(); enemies.splice(i, 1); continue;
    }
    if (enemies[i].position.y > GameHeight) {
      if (!shieldActive) health -= enemies[i].health === enemies[i].maxHealth ? 8 : 2;
      enemies.splice(i, 1); continue;
    }
    let killed = false;
    for (const [arr, mult] of [[sLBullets, 0.5], [sRBullets, 0.5], [bullets, 1.0]]) {
      if (killed || i >= enemies.length) break;
      for (let x = arr.length - 1; x >= 0; x--) {
        if (i >= enemies.length) break;
        if (collision(enemies[i], arr[x])) {
          enemies[i].health -= mult * shooterPower; arr.splice(x, 1);
          if (enemies[i].health <= 0) {
            explosions.push(new Explosion(enemies[i].position.x + enemies[i].width / 2, enemies[i].position.y + enemies[i].height / 2, 0.8, theme.bgHue));
            score += enemies[i].maxHealth >= 3 ? 25 : 10;
            enemiesKilled++; updateShooterPower(); playExplosion();
            enemies.splice(i, 1); killed = true;
          }
          break;
        }
      }
    }
  }

  for (let i = mEnemies.length - 1; i >= 0; i--) {
    if (i >= mEnemies.length) continue;
    mEnemies[i].draw(ctx); mEnemies[i].update(deltaTime);
    if (collision(paddle, mEnemies[i])) {
      explosions.push(new Explosion(mEnemies[i].position.x + mEnemies[i].width / 2, mEnemies[i].position.y + mEnemies[i].height / 2, 2, theme.bgHue));
      if (!shieldActive) health -= mEnemies[i].health === mEnemies[i].maxHealth ? 60 : 25;
      playBossExplosion(); mEnemies.splice(i, 1); continue;
    }
    if (mEnemies[i].position.y > GameHeight) {
      if (!shieldActive) health -= 50;
      mEnemies.splice(i, 1); continue;
    }
    for (const [arr, mult] of [[sLBullets, 0.25], [sRBullets, 0.25], [bullets, 1.0]]) {
      if (i >= mEnemies.length) break;
      for (let x = arr.length - 1; x >= 0; x--) {
        if (i >= mEnemies.length) break;
        if (collision(mEnemies[i], arr[x])) {
          mEnemies[i].health -= mult * shooterPower; arr.splice(x, 1);
          if (mEnemies[i].health <= 0) {
            explosions.push(new Explosion(mEnemies[i].position.x + mEnemies[i].width / 2, mEnemies[i].position.y + mEnemies[i].height / 2, 2.5, theme.bgHue));
            score += 100;
            const wasFinal = mEnemies[i].isFinal;
            playBossExplosion(); mEnemies.splice(i, 1); enemiesKilled++; updateShooterPower();
            if (wasFinal) {
              if (score > highScore) { highScore = score; localStorage.setItem("spaceShooterHighScore", String(highScore)); }
              gameState = "won"; gameWon = true; playVictory(); removePauseButton();
            }
          }
          break;
        }
      }
    }
  }

  for (let i = healthPacks.length - 1; i >= 0; i--) {
    if (i >= healthPacks.length) continue;
    healthPacks[i].draw(ctx); healthPacks[i].update(deltaTime);
    if (collision(paddle, healthPacks[i])) { health = Math.min(400, health + 50); playCollect(); healthPacks.splice(i, 1); continue; }
    if (healthPacks[i].position.y > GameHeight) { healthPacks.splice(i, 1); continue; }
    let eaten = false;
    for (const arr of [sLBullets, sRBullets, bullets]) {
      if (eaten || i >= healthPacks.length) break;
      for (let x = arr.length - 1; x >= 0; x--) {
        if (i >= healthPacks.length) break;
        if (collision(healthPacks[i], arr[x])) { health = Math.min(400, health + 25); playCollect(); arr.splice(x, 1); healthPacks.splice(i, 1); eaten = true; break; }
      }
    }
  }

  for (let i = shieldPacks.length - 1; i >= 0; i--) {
    if (i >= shieldPacks.length) continue;
    shieldPacks[i].draw(ctx); shieldPacks[i].update(deltaTime);
    if (collision(paddle, shieldPacks[i])) { shieldActive = true; shieldEndTime = timestamp + SHIELD_DURATION_MS; playCollect(); shieldPacks.splice(i, 1); continue; }
    if (shieldPacks[i].position.y > GameHeight) { shieldPacks.splice(i, 1); continue; }
    let eaten = false;
    for (const arr of [sLBullets, sRBullets, bullets]) {
      if (eaten || i >= shieldPacks.length) break;
      for (let x = arr.length - 1; x >= 0; x--) {
        if (i >= shieldPacks.length) break;
        if (collision(shieldPacks[i], arr[x])) { shieldActive = true; shieldEndTime = timestamp + SHIELD_DURATION_MS; playCollect(); arr.splice(x, 1); shieldPacks.splice(i, 1); eaten = true; break; }
      }
    }
  }

  for (const arr of [bullets, sLBullets, sRBullets]) {
    for (let i = arr.length - 1; i >= 0; i--) {
      arr[i].draw(ctx); arr[i].update(deltaTime);
      if (arr[i].position.y < 0) arr.splice(i, 1);
    }
  }

  if (shieldActive && timestamp < shieldEndTime) {
    ctx.save();
    ctx.strokeStyle = theme.accent + "cc";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = theme.accent; ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(paddle.position.x + paddle.width / 2, paddle.position.y + paddle.height / 2, paddle.width * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  paddle.draw(ctx);
  paddle.update(deltaTime);

  for (let e = explosions.length - 1; e >= 0; e--) {
    explosions[e].draw(ctx); explosions[e].update(deltaTime);
    if (explosions[e].finished) explosions.splice(e, 1);
  }

  drawHUD(timestamp, theme);
  drawBossHPBars();

  if (score >= scoreForNextLevel) {
    if (level < FINAL_LEVEL) {
      level++; paddle.setLevel(level);
      playLevelUp(); updateShooterPower();
      scoreForNextLevel += 1000;
      zoneBannerUntil = timestamp + 2800;
    } else {
      scoreForNextLevel += 999999;
      playLevelUp();
      zoneBannerUntil = timestamp + 2800;
    }
  }
  drawZoneBanner(timestamp, theme);

  if (health <= 0 && !died) {
    died = true;
    if (score > highScore) { highScore = score; localStorage.setItem("spaceShooterHighScore", String(highScore)); }
    gameState = "gameover"; stopHoldShoot(); stopEngine(); playGameOver(); removePauseButton();
  }

  requestAnimationFrame(gameLoop);
}

// ─── Restart ──────────────────────────────────────────────────────────────────
function restartGame() {
  health = 300; score = 0;
  bullets = []; sLBullets = []; sRBullets = [];
  enemies = []; mEnemies = []; healthPacks = []; shieldPacks = []; explosions = [];
  stars = [];
  for (let i = 0; i < GameWidth; i += 40)
    for (let x = 0; x < GameHeight; x += 40)
      stars.push(new Star(false, GameWidth, GameHeight));
  died = false;
  paddle.position.x = GameWidth / 2 - paddle.width / 2;
  paddle.position.y = GameHeight - paddle.height - 10;
  gameTime = 0; shieldActive = false; shieldEndTime = 0;
  level = 1; scoreForNextLevel = 1000; zoneBannerUntil = 0;
  shooterPower = 1.0; enemiesKilled = 0;
  finalBossSpawned = false; gameWon = false; paused = false;
  lastEnemySpawn = 0; lastBossSpawn = 0;
  lastHealthSpawn = 0; lastShieldSpawn = 0;
}

// ─── Kick it off ─────────────────────────────────────────────────────────────
requestAnimationFrame(gameLoop);
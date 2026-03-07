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
import BossBullet from "/src/bossBullet.js";
import PowerCore from "/src/powerCore.js";
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
let bullets = [], sLBullets = [], sRBullets = [], bossBullets = [];
let enemies = [], mEnemies = [];
let healthPacks = [], shieldPacks = [], powerCores = [], explosions = [], stars = [];
let shooterPower = 1.0;
let enemiesKilled = 0;
let levelKills = 0;
let damageBoostBase = 1.0;

let galacticBackground = new Background(GameWidth, GameHeight);
let died = false;
let gameState = "loading";
let gameTime = 0;
let highScore = parseInt(localStorage.getItem("spaceShooterHighScore") || "0", 10);
let shieldActive = false;
let shieldEndTime = 0;
let shieldDurationMs = 12000;
let powerBoostActive = false;
let powerBoostEndTime = 0;
let powerBoostMult = 1.35;
let fireBoostMult = 0.8;
let powerBoostDurationMs = 10000;
let shootIntervalId = null;
let baseShootIntervalMs = 200;
let level = 1;
let scoreForNextLevel = 1400;
let levelStartScore = 0;
let zoneBannerUntil = 0;
const FINAL_LEVEL = LEVEL_THEMES.length;
let finalBossSpawned = false;
let gameWon = false;
let paused = false;
let upgradeOptions = [];
let upgradeChoiceRects = [];
let objective = null;
let objectiveBannerUntil = 0;
let objectiveCompleteUntil = 0;
let shakeUntil = 0;
let shakeMagnitude = 0;
let hitFlashAlpha = 0;

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
  if (gameState === "upgrade") return;
  if (gameState === "start")    { gameState = "playing"; startEngine(); createPauseButton(); startLevel(performance.now()); return; }
  if (gameState === "gameover") { restartGame(); gameState = "playing"; startEngine(); createPauseButton(); startLevel(performance.now()); return; }
  if (gameState === "won")      { restartGame(); gameState = "playing"; startEngine(); createPauseButton(); startLevel(performance.now()); return; }
}
document.addEventListener("keydown", (e) => {
  if (gameState === "upgrade") {
    if (e.key === "1" || e.key === "2" || e.key === "3") {
      handleUpgradeChoice(parseInt(e.key, 10) - 1, performance.now());
    }
    return;
  }
  if (e.key === "Escape" || e.key === "p" || e.key === "P") {
    if (gameState === "playing" || gameState === "paused") { togglePause(); return; }
  }
  handleStartTransition(e);
});
document.addEventListener("click",      handleStartTransition);
document.addEventListener("touchstart", handleStartTransition, { passive: true });

GameScreen.addEventListener("click", (e) => {
  if (gameState !== "upgrade") return;
  const rect = GameScreen.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const hit = upgradeChoiceRects.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (hit) handleUpgradeChoice(upgradeOptions.findIndex(o => o.id === hit.id), performance.now());
});
GameScreen.addEventListener("touchstart", (e) => {
  if (gameState !== "upgrade") return;
  const t = e.touches[0];
  const rect = GameScreen.getBoundingClientRect();
  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;
  const hit = upgradeChoiceRects.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (hit) handleUpgradeChoice(upgradeOptions.findIndex(o => o.id === hit.id), performance.now());
}, { passive: true });

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
function getDamageMultiplier() {
  return shooterPower * damageBoostBase * (powerBoostActive ? powerBoostMult : 1);
}
function triggerHitFeedback(strength, timestamp) {
  shakeUntil = Math.max(shakeUntil, timestamp + 140);
  shakeMagnitude = Math.max(shakeMagnitude, strength);
  hitFlashAlpha = Math.min(0.35, hitFlashAlpha + 0.22);
}

function buildObjective(timestamp) {
  const isSurvive = level % 2 === 0;
  if (isSurvive) {
    const duration = Math.min(26000, 16000 + level * 800);
    return {
      type: "survive",
      text: "Survive " + Math.round(duration / 1000) + "s",
      target: duration,
      progress: 0,
      startTime: timestamp,
      endTime: timestamp + duration,
      completed: false,
    };
  }
  const target = 10 + Math.floor(level * 1.5);
  const duration = Math.min(26000, 20000 + level * 500);
  return {
    type: "kills",
    text: "Destroy " + target + " ships",
    target,
    progress: 0,
    startTime: timestamp,
    endTime: timestamp + duration,
    completed: false,
  };
}

function completeObjective(timestamp) {
  if (!objective || objective.completed) return;
  objective.completed = true;
  objective.progress = objective.target;
  objective.endTime = timestamp;
  objectiveCompleteUntil = timestamp + 1800;
  score += 250;
  spawnPowerCore();
}

function updateObjectiveProgress(timestamp) {
  if (!objective || objective.completed) return;
  if (objective.type === "survive") {
    objective.progress = Math.min(objective.target, timestamp - objective.startTime);
    if (timestamp >= objective.endTime) completeObjective(timestamp);
  } else if (objective.type === "kills") {
    if (timestamp >= objective.endTime) objective = null;
  }
}

function recordKill(delta, timestamp) {
  levelKills += delta;
  if (objective && !objective.completed && objective.type === "kills") {
    objective.progress = Math.min(objective.target, objective.progress + delta);
    if (objective.progress >= objective.target) completeObjective(timestamp);
  }
}

function startLevel(timestamp) {
  levelStartScore = score;
  levelKills = 0;
  objective = buildObjective(timestamp);
  objectiveBannerUntil = timestamp + 2200;
  objectiveCompleteUntil = 0;
  zoneBannerUntil = timestamp + 2800;
}

// ─── Spawn helpers ────────────────────────────────────────────────────────────
let lastEnemySpawn  = 0;
let lastBossSpawn   = 0;
let lastHealthSpawn = 0;
let lastShieldSpawn = 0;
let lastPowerSpawn  = 0;
let lastStarSpawn   = 0;

// FIX: Dynamic spawn interval — slower at low levels, scales up gradually
function getSpawnInterval() {
  const base = 980 - (level - 1) * 34;
  const jitter = Math.random() * 90;
  return Math.max(420, base + jitter);
}

function spawnEnemy() {
  if (gameState !== "playing") return;
  // FIX: Hard cap on screen enemies to keep game playable
  const maxOnScreen = Math.min(6 + level * 1.5, 18);
  if (enemies.length >= maxOnScreen) return;
  if (level <= 2 && Math.random() > 0.55) return;

  // FIX: Always spawn 1, occasionally 2 when the screen is calm
  const count = (level >= 6 && enemies.length < maxOnScreen - 2 && Math.random() < 0.25) ? 2 : 1;

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
function spawnPowerCore() { if (gameState === "playing") powerCores.push(new PowerCore(GameWidth)); }

// ─── Shooting ─────────────────────────────────────────────────────────────────
function fire() {
  if (gameState !== "playing") return;
  playShoot();
  const bullet = new Bullet(paddle, bulletImg);
  bullets.push(bullet);
  sLBullets.push(new SLBullet(bullet, bulletImg));
  sRBullets.push(new SRBullet(bullet, bulletImg));
}
function getShootIntervalMs() {
  return Math.max(110, baseShootIntervalMs * (powerBoostActive ? fireBoostMult : 1));
}
function startHoldShoot() {
  if (gameState !== "playing") return;
  fire();
  if (!shootIntervalId)
    shootIntervalId = setInterval(() => { if (gameState === "playing") fire(); }, getShootIntervalMs());
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
    const left = (shieldEndTime - timestamp) / shieldDurationMs;
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

  // ── Level progress bar ─────────────────────────────────────────────────
  const goalSpan = Math.max(1, scoreForNextLevel - levelStartScore);
  const prog = Math.max(0, Math.min(1, (score - levelStartScore) / goalSpan));
  const pW = 180, pH = 6;
  roundedRect(ctx, sCX - pW / 2, GameHeight - 58, pW, pH, 3);
  ctx.fillStyle = "rgba(255,255,255,0.09)"; ctx.fill();
  roundedRect(ctx, sCX - pW / 2 + 1, GameHeight - 57, (pW - 2) * prog, pH - 2, 2);
  ctx.fillStyle = accent + "aa"; ctx.fill();

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

  if (powerBoostActive) {
    const left = Math.max(0, (powerBoostEndTime - timestamp) / powerBoostDurationMs);
    roundedRect(ctx, infoX + 12, pad + 56, 120, 5, 2);
    ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fill();
    roundedRect(ctx, infoX + 13, pad + 57, 118 * left, 3, 2);
    ctx.fillStyle = "#ffd24d"; ctx.fill();
  }

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

// ─── Objective HUD ───────────────────────────────────────────────────────────
function drawObjective(timestamp, theme) {
  if (!objective) return;
  const active = timestamp < objective.endTime;
  const completed = objective.completed;
  const showComplete = timestamp < objectiveCompleteUntil;
  if (!active && !showComplete) return;

  ctx.save();
  const cx = GameWidth / 2;
  const y = 22;
  const label = completed ? "OBJECTIVE COMPLETE" : (timestamp < objectiveBannerUntil ? "NEW OBJECTIVE" : "OBJECTIVE");
  const value = completed ? "+250 SCORE + POWER CORE" : objective.text;

  ctx.textAlign = "center";
  ctx.fillStyle = completed ? "#ffd24d" : theme.accent;
  ctx.font = "700 10px Orbitron, sans-serif";
  ctx.fillText(label, cx, y);
  ctx.fillStyle = "rgba(220,220,245,0.8)";
  ctx.font = "500 12px Rajdhani, sans-serif";
  ctx.fillText(value, cx, y + 14);

  const w = 180, h = 4;
  roundedRect(ctx, cx - w / 2, y + 20, w, h, 2);
  ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fill();
  const prog = completed ? 1 : Math.max(0, Math.min(1, objective.progress / objective.target));
  roundedRect(ctx, cx - w / 2 + 1, y + 21, (w - 2) * prog, h - 2, 2);
  ctx.fillStyle = theme.accent + "aa"; ctx.fill();
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

function drawBossTelegraph(boss, timestamp, theme) {
  if (!boss.telegraphUntil || timestamp > boss.telegraphUntil) return;
  const left = Math.max(0, (boss.telegraphUntil - timestamp) / 320);
  const r = boss.width * (0.6 + 0.2 * (1 - left));
  ctx.save();
  ctx.strokeStyle = boss.isFinal ? "rgba(255,80,100,0.85)" : theme.accent + "cc";
  ctx.lineWidth = 2 + 2 * (1 - left);
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(boss.position.x + boss.width / 2, boss.position.y + boss.height / 2, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ─── Boss shooting ───────────────────────────────────────────────────────────
function bossFire(boss, target, timestamp) {
  if (!boss.nextShotAt) boss.nextShotAt = 0;
  if (!boss.pendingShots) boss.pendingShots = 0;
  const cadence = boss.isFinal ? 820 : 1300;
  if (timestamp >= boss.nextShotAt && boss.pendingShots === 0) {
    boss.telegraphUntil = timestamp + 320;
    boss.pendingShots = boss.isFinal && Math.random() < 0.5 ? 2 : 1;
    boss.nextShotAt = timestamp + cadence;
  }
  if (boss.pendingShots > 0 && timestamp >= boss.telegraphUntil) {
    const spread = boss.isFinal ? 60 : 35;
    for (let i = 0; i < boss.pendingShots; i++) {
      const offset = boss.pendingShots > 1 ? (i === 0 ? -spread : spread) : 0;
      const fakeTarget = {
        position: { x: target.position.x + offset, y: target.position.y },
        width: target.width,
        height: target.height,
      };
      bossBullets.push(new BossBullet(boss, fakeTarget));
    }
    boss.pendingShots = 0;
  }
}

// ─── Upgrade Screen ──────────────────────────────────────────────────────────
function drawUpgradeScreen() {
  ctx.save();
  ctx.fillStyle = "rgba(4,3,18,0.7)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);

  const cx = GameWidth / 2, cy = GameHeight / 2;
  const pW = Math.min(720, GameWidth - 48), pH = 320;
  roundedRect(ctx, cx - pW / 2, cy - pH / 2, pW, pH, 24);
  ctx.fillStyle = "rgba(8,6,26,0.94)"; ctx.fill();
  ctx.strokeStyle = "rgba(0,212,255,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.textAlign = "center";
  ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 20;
  ctx.fillStyle = "#00d4ff";
  ctx.font = "900 28px Orbitron, sans-serif";
  ctx.fillText("CHOOSE AN UPGRADE", cx, cy - 112);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(200,200,235,0.7)";
  ctx.font = "600 12px Rajdhani, sans-serif";
  ctx.fillText("LEVEL " + level + " REACHED", cx, cy - 88);

  upgradeChoiceRects = [];
  const cardW = Math.min(210, (pW - 80) / 3);
  const cardH = 170;
  const startX = cx - (cardW * 1.5) - 20;
  const y = cy - 42;
  upgradeOptions.forEach((opt, i) => {
    const x = startX + i * (cardW + 20);
    roundedRect(ctx, x, y, cardW, cardH, 16);
    ctx.fillStyle = "rgba(12,10,32,0.9)"; ctx.fill();
    ctx.strokeStyle = opt.color; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.fillStyle = opt.color;
    ctx.font = "800 12px Orbitron, sans-serif";
    ctx.fillText("[" + (i + 1) + "]", x + cardW / 2, y + 24);

    ctx.fillStyle = "#fff";
    ctx.font = "700 15px Rajdhani, sans-serif";
    ctx.fillText(opt.title, x + cardW / 2, y + 58);

    ctx.fillStyle = "rgba(200,200,235,0.75)";
    ctx.font = "500 12px Rajdhani, sans-serif";
    ctx.fillText(opt.desc, x + cardW / 2, y + 84);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 11px Rajdhani, sans-serif";
    ctx.fillText("Press " + (i + 1) + " or tap", x + cardW / 2, y + 138);
    upgradeChoiceRects.push({ x, y, w: cardW, h: cardH, id: opt.id });
  });

  ctx.textAlign = "left";
  ctx.restore();
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

  ctx.fillStyle = "rgba(255,200,55,0.75)";
  ctx.font = "700 12px Orbitron, sans-serif";
  ctx.fillText("SCORE  " + score.toLocaleString(), cx, cy + 60);

  ctx.fillStyle = "rgba(200,200,235,0.7)";
  ctx.font = "600 11px Rajdhani, sans-serif";
  ctx.fillText("LEVEL  " + level + "   |   HULL  " + Math.max(0, Math.ceil(health)) + " / 400", cx, cy + 80);

  if (objective && !objective.completed) {
    const oProg = Math.round((objective.progress / objective.target) * 100);
    ctx.fillStyle = "rgba(120,210,255,0.7)";
    ctx.font = "600 11px Rajdhani, sans-serif";
    ctx.fillText("OBJECTIVE  " + objective.text + "  (" + Math.min(100, Math.max(0, oProg)) + "%)", cx, cy + 100);
  }

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
    ["⚡",  "Power cores boost fire rate + damage"],
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

// ─── Upgrade Logic ───────────────────────────────────────────────────────────
function buildUpgradeOptions() {
  const pool = [
    { id: "rapid",   title: "Rapid Fire",  desc: "Fire rate +15%", color: "#00d4ff" },
    { id: "damage",  title: "Heavy Rounds", desc: "Damage +15%",   color: "#ffcc44" },
    { id: "shield",  title: "Shield Matrix", desc: "Shield +20%",  color: "#44ffcc" },
    { id: "reactor", title: "Reactor Core", desc: "Power core +25%", color: "#ff8877" },
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  upgradeOptions = pool.slice(0, 3);
}

function applyUpgrade(id, timestamp) {
  if (id === "rapid") {
    baseShootIntervalMs = Math.max(120, baseShootIntervalMs * 0.85);
  } else if (id === "damage") {
    damageBoostBase += 0.15;
  } else if (id === "shield") {
    shieldDurationMs = Math.min(20000, shieldDurationMs * 1.2);
  } else if (id === "reactor") {
    powerBoostDurationMs = Math.min(15000, powerBoostDurationMs * 1.25);
  }

  if (shootIntervalId) {
    clearInterval(shootIntervalId);
    shootIntervalId = setInterval(() => { if (gameState === "playing") fire(); }, getShootIntervalMs());
  }

  gameState = "playing";
  startLevel(timestamp);
}

function handleUpgradeChoice(index, timestamp) {
  if (gameState !== "upgrade") return;
  const opt = upgradeOptions[index];
  if (!opt) return;
  applyUpgrade(opt.id, timestamp);
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
  if (gameState === "upgrade") {
    const theme = getTheme(level);
    ctx.fillStyle = `hsla(${theme.bgHue}, 70%, 30%, 0.07)`;
    ctx.fillRect(0, 0, GameWidth, GameHeight);
    stars.forEach(s => s.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    mEnemies.forEach(e => e.draw(ctx));
    healthPacks.forEach(h => h.draw(ctx));
    shieldPacks.forEach(s => s.draw(ctx));
    powerCores.forEach(p => p.draw(ctx));
    [bullets, sLBullets, sRBullets].forEach(arr => arr.forEach(b => b.draw(ctx)));
    bossBullets.forEach(b => b.draw(ctx));
    explosions.forEach(ex => ex.draw(ctx));
    paddle.draw(ctx);
    drawHUD(performance.now(), theme);
    drawBossHPBars();
    drawUpgradeScreen();
    requestAnimationFrame(gameLoop);
    return;
  }

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
    powerCores.forEach(p => p.draw(ctx));
    [bullets, sLBullets, sRBullets].forEach(arr => arr.forEach(b => b.draw(ctx)));
    bossBullets.forEach(b => b.draw(ctx));
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

  const shakeActive = timestamp < shakeUntil;
  const shakeX = shakeActive ? (Math.random() * 2 - 1) * shakeMagnitude : 0;
  const shakeY = shakeActive ? (Math.random() * 2 - 1) * shakeMagnitude : 0;
  if (!shakeActive) shakeMagnitude = Math.max(0, shakeMagnitude - deltaTime * 0.04);
  hitFlashAlpha = Math.max(0, hitFlashAlpha - deltaTime * 0.0025);

  ctx.save();
  ctx.translate(shakeX, shakeY);

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
  if (timestamp - lastPowerSpawn  > 18000)           { spawnPowerCore(); lastPowerSpawn = timestamp; }

  if (shieldActive && timestamp >= shieldEndTime) shieldActive = false;
  if (powerBoostActive && timestamp >= powerBoostEndTime) powerBoostActive = false;
  updateObjectiveProgress(timestamp);

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (i >= enemies.length) continue;
    enemies[i].draw(ctx); enemies[i].update(deltaTime);
    if (collision(paddle, enemies[i])) {
      explosions.push(new Explosion(enemies[i].position.x + enemies[i].width / 2, enemies[i].position.y + enemies[i].height / 2, 1.2, theme.bgHue));
      if (!shieldActive) health -= enemies[i].health === enemies[i].maxHealth ? 20 : 8;
      triggerHitFeedback(6, timestamp);
      playExplosion(); enemies.splice(i, 1); continue;
    }
    if (enemies[i].position.y > GameHeight) {
      if (!shieldActive) health -= enemies[i].health === enemies[i].maxHealth ? 8 : 2;
      triggerHitFeedback(4, timestamp);
      enemies.splice(i, 1); continue;
    }
    let killed = false;
    for (const [arr, mult] of [[sLBullets, 0.5], [sRBullets, 0.5], [bullets, 1.0]]) {
      if (killed || i >= enemies.length) break;
      for (let x = arr.length - 1; x >= 0; x--) {
        if (i >= enemies.length) break;
        if (collision(enemies[i], arr[x])) {
          enemies[i].health -= mult * getDamageMultiplier(); arr.splice(x, 1);
          if (enemies[i].health <= 0) {
            explosions.push(new Explosion(enemies[i].position.x + enemies[i].width / 2, enemies[i].position.y + enemies[i].height / 2, 0.8, theme.bgHue));
            score += enemies[i].maxHealth >= 3 ? 25 : 10;
            enemiesKilled++; recordKill(1, timestamp); updateShooterPower(); playExplosion();
            enemies.splice(i, 1); killed = true;
          }
          break;
        }
      }
    }
  }

  for (let i = mEnemies.length - 1; i >= 0; i--) {
    if (i >= mEnemies.length) continue;
    mEnemies[i].draw(ctx); drawBossTelegraph(mEnemies[i], timestamp, theme); mEnemies[i].update(deltaTime);
    bossFire(mEnemies[i], paddle, timestamp);
    if (collision(paddle, mEnemies[i])) {
      explosions.push(new Explosion(mEnemies[i].position.x + mEnemies[i].width / 2, mEnemies[i].position.y + mEnemies[i].height / 2, 2, theme.bgHue));
      if (!shieldActive) health -= mEnemies[i].health === mEnemies[i].maxHealth ? 60 : 25;
      triggerHitFeedback(10, timestamp);
      playBossExplosion(); mEnemies.splice(i, 1); continue;
    }
    if (mEnemies[i].position.y > GameHeight) {
      if (!shieldActive) health -= 50;
      triggerHitFeedback(8, timestamp);
      mEnemies.splice(i, 1); continue;
    }
    for (const [arr, mult] of [[sLBullets, 0.25], [sRBullets, 0.25], [bullets, 1.0]]) {
      if (i >= mEnemies.length) break;
      for (let x = arr.length - 1; x >= 0; x--) {
        if (i >= mEnemies.length) break;
        if (collision(mEnemies[i], arr[x])) {
          mEnemies[i].health -= mult * getDamageMultiplier(); arr.splice(x, 1);
          if (mEnemies[i].health <= 0) {
            explosions.push(new Explosion(mEnemies[i].position.x + mEnemies[i].width / 2, mEnemies[i].position.y + mEnemies[i].height / 2, 2.5, theme.bgHue));
            score += 100;
            const wasFinal = mEnemies[i].isFinal;
            playBossExplosion(); mEnemies.splice(i, 1); enemiesKilled++; recordKill(3, timestamp); updateShooterPower();
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
    if (collision(paddle, shieldPacks[i])) { shieldActive = true; shieldEndTime = timestamp + shieldDurationMs; playCollect(); shieldPacks.splice(i, 1); continue; }
    if (shieldPacks[i].position.y > GameHeight) { shieldPacks.splice(i, 1); continue; }
    let eaten = false;
    for (const arr of [sLBullets, sRBullets, bullets]) {
      if (eaten || i >= shieldPacks.length) break;
      for (let x = arr.length - 1; x >= 0; x--) {
        if (i >= shieldPacks.length) break;
        if (collision(shieldPacks[i], arr[x])) { shieldActive = true; shieldEndTime = timestamp + shieldDurationMs; playCollect(); arr.splice(x, 1); shieldPacks.splice(i, 1); eaten = true; break; }
      }
    }
  }

  for (let i = powerCores.length - 1; i >= 0; i--) {
    if (i >= powerCores.length) continue;
    powerCores[i].draw(ctx); powerCores[i].update(deltaTime);
    if (collision(paddle, powerCores[i])) {
      powerBoostActive = true;
      powerBoostEndTime = timestamp + powerBoostDurationMs;
      playCollect();
      if (shootIntervalId) {
        clearInterval(shootIntervalId);
        shootIntervalId = setInterval(() => { if (gameState === "playing") fire(); }, getShootIntervalMs());
      }
      powerCores.splice(i, 1); continue;
    }
    if (powerCores[i].position.y > GameHeight) { powerCores.splice(i, 1); continue; }
  }

  for (const arr of [bullets, sLBullets, sRBullets]) {
    for (let i = arr.length - 1; i >= 0; i--) {
      arr[i].draw(ctx); arr[i].update(deltaTime);
      if (arr[i].position.y < 0) arr.splice(i, 1);
    }
  }

  for (let i = bossBullets.length - 1; i >= 0; i--) {
    bossBullets[i].draw(ctx); bossBullets[i].update(deltaTime);
    if (collision(paddle, bossBullets[i])) {
      if (!shieldActive) health -= 12;
      triggerHitFeedback(7, timestamp);
      bossBullets.splice(i, 1);
      continue;
    }
    if (bossBullets[i].position.y > GameHeight + 40 || bossBullets[i].position.x < -40 || bossBullets[i].position.x > GameWidth + 40) {
      bossBullets.splice(i, 1);
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

  ctx.restore();

  if (hitFlashAlpha > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255,80,100,${hitFlashAlpha})`;
    ctx.fillRect(0, 0, GameWidth, GameHeight);
    ctx.restore();
  }

  drawHUD(timestamp, theme);
  drawBossHPBars();
  drawObjective(timestamp, theme);

  if (score >= scoreForNextLevel) {
    if (level < FINAL_LEVEL) {
      level++; paddle.setLevel(level);
      playLevelUp(); updateShooterPower();
      scoreForNextLevel += 1100;
      buildUpgradeOptions();
      stopHoldShoot();
      gameState = "upgrade";
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
  bullets = []; sLBullets = []; sRBullets = []; bossBullets = [];
  enemies = []; mEnemies = []; healthPacks = []; shieldPacks = []; powerCores = []; explosions = [];
  stars = [];
  for (let i = 0; i < GameWidth; i += 40)
    for (let x = 0; x < GameHeight; x += 40)
      stars.push(new Star(false, GameWidth, GameHeight));
  died = false;
  paddle.position.x = GameWidth / 2 - paddle.width / 2;
  paddle.position.y = GameHeight - paddle.height - 10;
  gameTime = 0; shieldActive = false; shieldEndTime = 0;
  powerBoostActive = false; powerBoostEndTime = 0;
  level = 1; scoreForNextLevel = 1400; levelStartScore = 0; zoneBannerUntil = 0;
  shooterPower = 1.0; enemiesKilled = 0;
  levelKills = 0;
  damageBoostBase = 1.0;
  baseShootIntervalMs = 200;
  shieldDurationMs = 12000;
  powerBoostDurationMs = 10000;
  finalBossSpawned = false; gameWon = false; paused = false;
  objective = null; objectiveBannerUntil = 0; objectiveCompleteUntil = 0;
  shakeUntil = 0; shakeMagnitude = 0; hitFlashAlpha = 0;
  lastEnemySpawn = 0; lastBossSpawn = 0;
  lastHealthSpawn = 0; lastShieldSpawn = 0; lastPowerSpawn = 0;
}

// ─── Kick it off ─────────────────────────────────────────────────────────────
requestAnimationFrame(gameLoop);

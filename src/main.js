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
// Each zone has a distinct color accent, bg tint, and name.
const LEVEL_THEMES = [
  { bgHue: 240, accent: "#00d4ff", name: "SECTOR ALPHA" },       // L1  - ice blue
  { bgHue: 180, accent: "#00ffcc", name: "NEBULA BETA" },        // L2  - teal
  { bgHue: 130, accent: "#00ff88", name: "VOID GAMMA" },         // L3  - green
  { bgHue: 0,   accent: "#ff4444", name: "CRIMSON SECTOR" },     // L4  - red
  { bgHue: 270, accent: "#cc44ff", name: "DARK FRONTIER" },      // L5  - purple
  { bgHue: 30,  accent: "#ff8800", name: "ORBITAL RIFT" },       // L6  - orange
  { bgHue: 190, accent: "#44ddff", name: "SILICON BELT" },       // L7  - cyan
  { bgHue: 310, accent: "#ff44cc", name: "SPECTRAL REACH" },     // L8  - pink
  { bgHue: 15,  accent: "#ff6633", name: "EMBER FIELD" },        // L9  - ember
  { bgHue: 225, accent: "#6688ff", name: "OBSIDIAN VALE" },      // L10 - indigo
  { bgHue: 55,  accent: "#ffee00", name: "RADIANT PIERS" },      // L11 - yellow
  { bgHue: 155, accent: "#00ffaa", name: "NEURAL ARCHIVE" },     // L12 - mint
  { bgHue: 345, accent: "#ff2244", name: "SINGULARIS" },         // L13 - crimson
  { bgHue: 38,  accent: "#ffaa00", name: "OMEGA FORGE" },        // L14 - gold
  { bgHue: 200, accent: "#ffffff", name: "ASCENSION CORE" },     // L15 - white/final
];

function getTheme(lvl) {
  return LEVEL_THEMES[Math.min(lvl - 1, LEVEL_THEMES.length - 1)];
}

// ─── Images ──────────────────────────────────────────────────────────────────
let playerImg = new Image();
let enemyImg  = new Image();
let bossImg   = new Image();
let bulletImg = new Image();
let healthImg = new Image();

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
let gameState = "loading";   // ← always start in "loading", never "start"
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
const FINAL_LEVEL = LEVEL_THEMES.length;  // 15
let finalBossSpawned = false;
let gameWon = false;

// ─── Image Loading — move to "start" when all 5 settle (load OR error) ──────
let imagesResolved = 0;
const totalImages = 5;
function onImageSettled() {
  imagesResolved++;
  if (imagesResolved >= totalImages) gameState = "start";
}
[playerImg, enemyImg, bossImg, bulletImg, healthImg].forEach((img) => {
  img.onload  = onImageSettled;
  img.onerror = onImageSettled;  // never hang if a CDN image 404s
});

// ─── Paddle & Input ───────────────────────────────────────────────────────────
let paddle = new Paddle(GameWidth, GameHeight, playerImg);
new InputHanderler(paddle, GameWidth, GameScreen, GameHeight);

// ─── Screen-transition listeners ─────────────────────────────────────────────
function handleStartTransition() {
  if (gameState === "start")   { gameState = "playing"; startEngine(); return; }
  if (gameState === "gameover"){ restartGame(); gameState = "playing"; startEngine(); return; }
  if (gameState === "won")     { restartGame(); gameState = "playing"; startEngine(); return; }
}
document.addEventListener("keydown",    handleStartTransition);
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

// ─── Spawn helpers (called from the loop via elapsed timers) ─────────────────
let lastEnemySpawn  = 0;
let lastBossSpawn   = 0;
let lastHealthSpawn = 0;
let lastShieldSpawn = 0;
let lastStarSpawn   = 0;

function spawnEnemy() {
  if (gameState !== "playing") return;
  if (level <= 2 && Math.random() > 0.4) return;
  const count = Math.min(level, 3);
  for (let i = 0; i < count; i++) {
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
      mEnemies.push(boss);
      finalBossSpawned = true;
    }
    return;
  }
  if (level === 1) return;
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

  // HP bar
  const barW = 220, barH = 18, barX = 14, barY = 14, r = 8;
  roundedRect(ctx, barX, barY, barW, barH, r);
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1; ctx.stroke();
  const maxHealth = 400;
  const fillW = Math.max(0, (Math.min(health, maxHealth) / maxHealth) * (barW - 6));
  if (fillW > 0) {
    roundedRect(ctx, barX + 3, barY + 3, fillW, barH - 6, r - 2);
    ctx.fillStyle = health > maxHealth * 0.6 ? "#00e676" : health > maxHealth * 0.25 ? "#ffab00" : "#ff5252";
    ctx.fill();
  }
  ctx.fillStyle = "#fff";
  ctx.font = "600 13px Rajdhani, sans-serif";
  ctx.fillText("HP " + Math.max(0, Math.ceil(health)), barX + barW / 2 - 22, barY + barH - 4);

  // Shield timer bar
  if (shieldActive && timestamp < shieldEndTime) {
    const left = (shieldEndTime - timestamp) / SHIELD_DURATION_MS;
    roundedRect(ctx, barX, barY + barH + 8, barW, 8, 4);
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fill();
    if (left > 0.01) {
      roundedRect(ctx, barX + 2, barY + barH + 10, (barW - 4) * left, 4, 2);
      ctx.fillStyle = accent; ctx.fill();
    }
    ctx.fillStyle = accent;
    ctx.font = "600 10px Orbitron, sans-serif";
    ctx.fillText("SHIELD ACTIVE", barX, barY + barH + 30);
  }

  // Score / level panel — accent border matches the zone
  roundedRect(ctx, GameWidth - 158, 10, 148, 88, 10);
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fill();
  ctx.strokeStyle = accent + "55"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "700 14px Orbitron, sans-serif";
  ctx.fillText("SCORE " + score, GameWidth - 146, 30);
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.font = "600 12px Rajdhani, sans-serif";
  ctx.fillText("BEST  " + highScore, GameWidth - 146, 48);
  ctx.fillStyle = "#ffcc44";
  ctx.font = "600 12px Rajdhani, sans-serif";
  ctx.fillText("LVL " + level + "  " + theme.name, GameWidth - 146, 64);
  ctx.fillStyle = accent;
  ctx.font = "600 11px Orbitron, sans-serif";
  ctx.fillText("PWR " + shooterPower.toFixed(1) + "x", GameWidth - 146, 82);
}

// ─── Zone Banner ──────────────────────────────────────────────────────────────
function drawZoneBanner(timestamp, theme) {
  if (timestamp >= zoneBannerUntil) return;
  const progress = 1 - (zoneBannerUntil - timestamp) / 2800;
  const alpha = progress < 0.12 ? progress / 0.12 : progress > 0.80 ? 1 - (progress - 0.80) / 0.20 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0,0,0,0.80)";
  ctx.fillRect(0, GameHeight / 2 - 58, GameWidth, 116);
  ctx.strokeStyle = theme.accent + "cc";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, GameHeight / 2 - 58, GameWidth, 116);
  ctx.fillStyle = theme.accent;
  ctx.font = "700 13px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("— LEVEL " + level + " —", GameWidth / 2, GameHeight / 2 - 22);
  ctx.font = "900 34px Orbitron, sans-serif";
  ctx.fillText(theme.name, GameWidth / 2, GameHeight / 2 + 24);
  ctx.textAlign = "left";
  ctx.restore();
}

// ─── Boss HP bars ─────────────────────────────────────────────────────────────
function drawBossHPBars() {
  for (let b = 0; b < mEnemies.length; b++) {
    const boss = mEnemies[b];
    const bw = boss.isFinal ? 200 : 120;
    const bh = boss.isFinal ? 14  : 10;
    const bx = boss.position.x + boss.width / 2 - bw / 2;
    const by = boss.position.y - 24;
    roundedRect(ctx, bx, by, bw, bh, 4);
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fill();
    const hp = Math.max(0, Math.min(boss.health, boss.maxHealth));
    if (hp > 0) {
      roundedRect(ctx, bx + 2, by + 2, ((bw - 4) * hp) / boss.maxHealth, bh - 4, 2);
      ctx.fillStyle = boss.isFinal ? "#ff2244" : "#ff5252"; ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1;
    roundedRect(ctx, bx, by, bw, bh, 4); ctx.stroke();
    if (boss.isFinal) {
      ctx.fillStyle = "#fff"; ctx.font = "600 10px Orbitron, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("FINAL BOSS", bx + bw / 2, by - 5);
      ctx.textAlign = "left";
    }
  }
}

// ─── Static screens ───────────────────────────────────────────────────────────
function drawLoadingScreen() {
  ctx.fillStyle = "rgba(5,4,18,0.92)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2, cy = GameHeight / 2;
  ctx.fillStyle = "#00d4ff";
  ctx.font = "900 38px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SPACE SHOOTER", cx, cy - 70);
  const dots = ".".repeat(Math.floor(Date.now() / 380) % 4);
  ctx.fillStyle = "rgba(232,232,255,0.8)";
  ctx.font = "600 18px Rajdhani, sans-serif";
  ctx.fillText("Loading" + dots, cx, cy - 28);
  // progress bar
  const bw = 300, bh = 12, bx = cx - bw / 2, by = cy - 8;
  roundedRect(ctx, bx, by, bw, bh, 6);
  ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fill();
  const frac = imagesResolved / totalImages;
  if (frac > 0) {
    roundedRect(ctx, bx + 2, by + 2, (bw - 4) * frac, bh - 4, 4);
    ctx.fillStyle = "#00d4ff"; ctx.fill();
  }
  ctx.textAlign = "left";
}

function drawStartScreen() {
  ctx.fillStyle = "rgba(10,10,26,0.80)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2, cy = GameHeight / 2;
  roundedRect(ctx, cx - 310, cy - 120, 620, 250, 22);
  ctx.fillStyle = "rgba(0,0,0,0.42)"; ctx.fill();
  ctx.strokeStyle = "rgba(0,212,255,0.28)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "900 44px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SPACE SHOOTER", cx, cy - 55);
  ctx.fillStyle = "rgba(232,232,255,0.85)";
  ctx.font = "500 16px Rajdhani, sans-serif";
  ctx.fillText("Hold & drag to move  •  Hold mouse/touch to auto-fire", cx, cy - 14);
  ctx.fillText("Collect  ❤  health packs  •  Collect  🛡  shield packs", cx, cy + 12);
  ctx.fillText("15 unique sectors  •  5 enemy types  •  Final boss awaits", cx, cy + 38);
  ctx.fillStyle = "#00d4ff";
  ctx.font = "700 20px Orbitron, sans-serif";
  ctx.fillText("TAP OR PRESS ANY KEY TO LAUNCH", cx, cy + 88);
  ctx.textAlign = "left";
}

function drawGameOverScreen() {
  ctx.fillStyle = "rgba(8,6,24,0.92)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2, cy = GameHeight / 2;
  roundedRect(ctx, cx - 280, cy - 105, 560, 220, 22);
  ctx.fillStyle = "rgba(0,0,0,0.48)"; ctx.fill();
  ctx.strokeStyle = "rgba(255,82,82,0.5)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#ff5252";
  ctx.font = "900 40px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", cx, cy - 44);
  ctx.fillStyle = "#fff";
  ctx.font = "700 20px Rajdhani, sans-serif";
  ctx.fillText("SCORE  " + score, cx, cy + 2);
  ctx.fillText("BEST   " + highScore, cx, cy + 30);
  ctx.fillStyle = "#ffcc44";
  ctx.font = "600 15px Rajdhani, sans-serif";
  ctx.fillText("Reached: " + LEVEL_THEMES[Math.min(level - 1, LEVEL_THEMES.length - 1)].name, cx, cy + 58);
  ctx.fillStyle = "#00d4ff";
  ctx.font = "700 18px Orbitron, sans-serif";
  ctx.fillText("TAP OR PRESS ANY KEY TO PLAY AGAIN", cx, cy + 98);
  ctx.textAlign = "left";
}

function drawWinScreen() {
  ctx.fillStyle = "rgba(4,8,18,0.96)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2, cy = GameHeight / 2;
  roundedRect(ctx, cx - 330, cy - 135, 660, 270, 24);
  ctx.fillStyle = "rgba(0,0,0,0.52)"; ctx.fill();
  ctx.strokeStyle = "rgba(0,200,150,0.42)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#00ffb2";
  ctx.font = "900 40px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("YOU WIN!", cx, cy - 60);
  ctx.fillStyle = "#fff";
  ctx.font = "600 18px Rajdhani, sans-serif";
  ctx.fillText("All 15 sectors cleared — Final Boss defeated!", cx, cy - 18);
  ctx.fillStyle = "#ffcc44";
  ctx.font = "700 24px Rajdhani, sans-serif";
  ctx.fillText("FINAL SCORE: " + score, cx, cy + 18);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "600 15px Rajdhani, sans-serif";
  ctx.fillText("BEST: " + highScore, cx, cy + 48);
  ctx.fillStyle = "#00d4ff";
  ctx.font = "700 18px Orbitron, sans-serif";
  ctx.fillText("TAP OR PRESS ANY KEY TO PLAY AGAIN", cx, cy + 100);
  ctx.textAlign = "left";
}

// ─── Main game loop ───────────────────────────────────────────────────────────
let lastTime = null;

function gameLoop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  const deltaTime = Math.min(timestamp - lastTime, 100); // cap at 100ms to avoid huge jumps
  lastTime = timestamp;

  ctx.clearRect(0, 0, GameWidth, GameHeight);
  galacticBackground.update(gameState === "playing" ? deltaTime : 16);
  galacticBackground.draw(ctx);

  // ── Non-playing screens ──────────────────────────────────────────────────
  if (gameState === "loading") { drawLoadingScreen();  requestAnimationFrame(gameLoop); return; }
  if (gameState === "start")   { drawStartScreen();    requestAnimationFrame(gameLoop); return; }
  if (gameState === "gameover"){ drawGameOverScreen();  requestAnimationFrame(gameLoop); return; }
  if (gameState === "won")     { drawWinScreen();      requestAnimationFrame(gameLoop); return; }

  // ── Playing ──────────────────────────────────────────────────────────────
  gameTime += deltaTime;
  const theme = getTheme(level);

  // Zone color tint overlay
  ctx.fillStyle = `hsla(${theme.bgHue}, 70%, 30%, 0.07)`;
  ctx.fillRect(0, 0, GameWidth, GameHeight);

  // Stars
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].draw(ctx);
    stars[i].update(deltaTime);
    if (stars[i].position.y > GameHeight) stars.splice(i, 1);
  }
  if (timestamp - lastStarSpawn > 200) {
    stars.push(new Star(true, GameWidth, GameHeight));
    lastStarSpawn = timestamp;
  }

  // Timed spawns
  if (timestamp - lastEnemySpawn  > 300)   { spawnEnemy();  lastEnemySpawn  = timestamp; }
  if (timestamp - lastBossSpawn   > 5000)  { spawnMEnemy(); lastBossSpawn   = timestamp; }
  if (timestamp - lastHealthSpawn > 7000)  { spawnHealth(); lastHealthSpawn = timestamp; }
  if (timestamp - lastShieldSpawn > 15000) { spawnShield(); lastShieldSpawn = timestamp; }

  if (shieldActive && timestamp >= shieldEndTime) shieldActive = false;

  // ── Enemies ──────────────────────────────────────────────────────────────
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (i >= enemies.length) continue;
    enemies[i].draw(ctx);
    enemies[i].update(deltaTime);

    // Paddle collision
    if (collision(paddle, enemies[i])) {
      explosions.push(new Explosion(enemies[i].position.x + enemies[i].width / 2, enemies[i].position.y + enemies[i].height / 2, 1.2, getTheme(level).bgHue));
      if (!shieldActive) health -= enemies[i].health === enemies[i].maxHealth ? 20 : 8;
      playExplosion();
      enemies.splice(i, 1); continue;
    }
    if (enemies[i].position.y > GameHeight) {
      if (!shieldActive) health -= enemies[i].health === enemies[i].maxHealth ? 8 : 2;
      enemies.splice(i, 1); continue;
    }

    // Bullet collisions (all bullet arrays)
    let killed = false;
    for (const [arr, mult] of [[sLBullets, 0.5], [sRBullets, 0.5], [bullets, 1.0]]) {
      if (killed || i >= enemies.length) break;
      for (let x = arr.length - 1; x >= 0; x--) {
        if (i >= enemies.length) break;
        if (collision(enemies[i], arr[x])) {
          enemies[i].health -= mult * shooterPower;
          arr.splice(x, 1);
          if (enemies[i].health <= 0) {
            explosions.push(new Explosion(enemies[i].position.x + enemies[i].width / 2, enemies[i].position.y + enemies[i].height / 2, 0.8, getTheme(level).bgHue));
            score += enemies[i].maxHealth >= 3 ? 25 : 10;
            enemiesKilled++; updateShooterPower(); playExplosion();
            enemies.splice(i, 1); killed = true;
          }
          break;
        }
      }
    }
  }

  // ── Boss Enemies ─────────────────────────────────────────────────────────
  for (let i = mEnemies.length - 1; i >= 0; i--) {
    if (i >= mEnemies.length) continue;
    mEnemies[i].draw(ctx);
    mEnemies[i].update(deltaTime);

    if (collision(paddle, mEnemies[i])) {
      explosions.push(new Explosion(mEnemies[i].position.x + mEnemies[i].width / 2, mEnemies[i].position.y + mEnemies[i].height / 2, 2, getTheme(level).bgHue));
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
          mEnemies[i].health -= mult * shooterPower;
          arr.splice(x, 1);
          if (mEnemies[i].health <= 0) {
            explosions.push(new Explosion(mEnemies[i].position.x + mEnemies[i].width / 2, mEnemies[i].position.y + mEnemies[i].height / 2, 2.5, getTheme(level).bgHue));
            score += 100;
            const wasFinal = mEnemies[i].isFinal;
            playBossExplosion(); mEnemies.splice(i, 1); enemiesKilled++; updateShooterPower();
            if (wasFinal) {
              if (score > highScore) { highScore = score; localStorage.setItem("spaceShooterHighScore", String(highScore)); }
              gameState = "won"; gameWon = true; playVictory();
            }
          }
          break;
        }
      }
    }
  }

  // ── Health Packs ─────────────────────────────────────────────────────────
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
        if (collision(healthPacks[i], arr[x])) {
          health = Math.min(400, health + 25); playCollect(); arr.splice(x, 1); healthPacks.splice(i, 1); eaten = true; break;
        }
      }
    }
  }

  // ── Shield Packs ─────────────────────────────────────────────────────────
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
        if (collision(shieldPacks[i], arr[x])) {
          shieldActive = true; shieldEndTime = timestamp + SHIELD_DURATION_MS; playCollect(); arr.splice(x, 1); shieldPacks.splice(i, 1); eaten = true; break;
        }
      }
    }
  }

  // ── Bullets ──────────────────────────────────────────────────────────────
  for (const arr of [bullets, sLBullets, sRBullets]) {
    for (let i = arr.length - 1; i >= 0; i--) {
      arr[i].draw(ctx); arr[i].update(deltaTime);
      if (arr[i].position.y < 0) arr.splice(i, 1);
    }
  }

  // ── Shield visual ring around player ─────────────────────────────────────
  if (shieldActive && timestamp < shieldEndTime) {
    ctx.save();
    ctx.strokeStyle = theme.accent + "cc";
    ctx.lineWidth = 3;
    ctx.shadowColor = theme.accent; ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(paddle.position.x + paddle.width / 2, paddle.position.y + paddle.height / 2, paddle.width * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Draw player
  paddle.draw(ctx);
  paddle.update(deltaTime);

  // ── Explosions ───────────────────────────────────────────────────────────
  for (let e = explosions.length - 1; e >= 0; e--) {
    explosions[e].draw(ctx); explosions[e].update(deltaTime);
    if (explosions[e].finished) explosions.splice(e, 1);
  }

  // ── HUD & overlays ───────────────────────────────────────────────────────
  drawHUD(timestamp, theme);
  drawBossHPBars();

  // ── Level-up check ───────────────────────────────────────────────────────
  if (score >= scoreForNextLevel) {
    if (level < FINAL_LEVEL) {
      level++; paddle.setLevel(level);
      playLevelUp(); updateShooterPower();
      scoreForNextLevel += 1000;
      zoneBannerUntil = timestamp + 2800;
    } else {
      scoreForNextLevel += 999999; // prevent re-trigger
      playLevelUp();
      zoneBannerUntil = timestamp + 2800;
    }
  }
  drawZoneBanner(timestamp, theme);

  // ── Death check ──────────────────────────────────────────────────────────
  if (health <= 0 && !died) {
    died = true;
    if (score > highScore) { highScore = score; localStorage.setItem("spaceShooterHighScore", String(highScore)); }
    gameState = "gameover"; stopHoldShoot(); stopEngine(); playGameOver();
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
  finalBossSpawned = false; gameWon = false;
  lastEnemySpawn = 0; lastBossSpawn = 0;
  lastHealthSpawn = 0; lastShieldSpawn = 0;
}

// ─── Kick it off ─────────────────────────────────────────────────────────────
requestAnimationFrame(gameLoop);
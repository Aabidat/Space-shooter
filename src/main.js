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
import { playShoot, playExplosion, playCollect, playGameOver, playBossExplosion, playLevelUp, playVictory } from "/src/sounds.js";

const GameScreen = document.getElementById("GameScreen");

document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("selectstart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());
if (GameScreen) {
  GameScreen.addEventListener("contextmenu", (e) => e.preventDefault());
  GameScreen.addEventListener("dblclick", (e) => e.preventDefault());
}

let playerImg = new Image();

playerImg.src = 'https://i.ibb.co/TYHmXbK/player.png';

let enemyImg = new Image();

enemyImg.src = 'https://i.ibb.co/Hd3LbdZ/enemy.png';

let bossImg = new Image();

bossImg.src = 'https://i.ibb.co/J2bZS2n/boss.png';

let bulletImg = new Image();

bulletImg.src = 'https://i.ibb.co/HYLzSLV/bullet.png';

let healthImg = new Image();

healthImg.src = 'https://i.ibb.co/PhqgB2G/health.png';

GameScreen.width = innerWidth;

GameScreen.height = innerHeight;

const ctx = GameScreen.getContext("2d");

let GameWidth = innerWidth;

let GameHeight = innerHeight;

let health = 300;

let score = 0;

let bullets = [];

let sLBullets = [];

let sRBullets = [];

let enemies = [];

let mEnemies = [];

let healthPacks = [];

let shieldPacks = [];

let explosions = [];

let stars = [];

let shooterPower = 1.0;

let enemiesKilled = 0;

let load = new Load(GameWidth, GameHeight, 0);
let galacticBackground = new Background(GameWidth, GameHeight);

let died = false;

let loaded = false;

let progress = 0;

let gameState = "start";

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
// Expand to a longer campaign (15 unique zones) — final level is special
const ZONE_NAMES = [
  "SECTOR ALPHA",
  "NEBULA BETA",
  "VOID GAMMA",
  "CRIMSON SECTOR",
  "DARK FRONTIER",
  "ORBITAL RIFT",
  "SILICON BELT",
  "SPECTRAL REACH",
  "EMBER FIELD",
  "OBSIDIAN VALE",
  "RADIANT PIERS",
  "NEURAL ARCHIVE",
  "SINGULARIS",
  "OMEGA FORGE",
  "ASCENSION CORE",
];

const FINAL_LEVEL = ZONE_NAMES.length; // final campaign level (15)
let finalBossSpawned = false;
let gameWon = false;

function updateShooterPower() {
  // Power increases with level and per-enemy kills (small per-kill bonus)
  const perKillBonus = 0.02; // +0.02x power per enemy killed
  const basePower = 1.0 + (level - 1) * 0.15; // level-based scaling
  const maxPower = 3.0;
  shooterPower = Math.min(maxPower, basePower + enemiesKilled * perKillBonus);
}

if (died) {

}

playerImg.onload = function() {

  progress += 20;

}

enemyImg.onload = function() {

  progress += 20;

}

bulletImg.onload = function() {

  progress += 20;

}

healthImg.onload = function() {

  progress += 20;

}

bossImg.onload = function() {

  progress += 20;

}

let paddle = new Paddle(GameWidth, GameHeight, playerImg);

new InputHanderler(paddle, GameWidth, GameScreen, GameHeight);



document.addEventListener("keydown", (e) => {
  if (gameState === "start" && loaded) {
    gameState = "playing";
    return;
  }
  if (gameState === "gameover") {
    restartGame();
    gameState = "playing";
    return;
  }
});

document.addEventListener("click", (e) => {
  if (gameState === "start" && loaded) {
    gameState = "playing";
  }
  if (gameState === "gameover") {
    restartGame();
    gameState = "playing";
  }
});

document.addEventListener("touchstart", (e) => {
  if (gameState === "start" && loaded) {
    gameState = "playing";
  }
  if (gameState === "gameover") {
    restartGame();
    gameState = "playing";
  }
}, { passive: true });



let lastTime = 0;

for (let i = 0; i < GameWidth; i += 40) {
  for (var x = 0; x < GameHeight; x += 40) {
    let star = new Star(false, GameWidth, GameHeight);

    stars.push(star);
  }
}

function gameLoop(timestamp) {

  if (load.fill < progress) {
    load.fill += 5;
  }

  if (load.fill >= 100) {
    loaded = true;
  }

  if (gameState === "start" && loaded) {
    ctx.clearRect(0, 0, GameWidth, GameHeight);
    galacticBackground.update(16);
    galacticBackground.draw(ctx);
    drawStartScreen(ctx);
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === "gameover") {
    ctx.clearRect(0, 0, GameWidth, GameHeight);
    galacticBackground.update(16);
    galacticBackground.draw(ctx);
    drawGameOverScreen(ctx);
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === "won") {
    ctx.clearRect(0, 0, GameWidth, GameHeight);
    galacticBackground.update(16);
    galacticBackground.draw(ctx);
    drawWinScreen(ctx);
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === "playing") {

    let deltaTime = timestamp - lastTime;

    lastTime = timestamp;

    gameTime += deltaTime;

    ctx.clearRect(0, 0, GameWidth, GameHeight);

    galacticBackground.update(deltaTime);
    galacticBackground.draw(ctx);

    paddle.draw(ctx);

    paddle.update(deltaTime);

    if (shieldActive && timestamp >= shieldEndTime) shieldActive = false;

    for (var i in stars) {
      stars[i].draw(ctx);

      stars[i].update(deltaTime);

      if (stars[i].position.y > GameHeight) {
        stars.splice(i, 1);
      }
    }

    for (var i in enemies) {
      enemies[i].draw(ctx);

      enemies[i].update(deltaTime);

      if (collision(paddle, enemies[i])) {
        const ex = enemies[i].position.x + enemies[i].width / 2;
        const ey = enemies[i].position.y + enemies[i].height / 2;
        explosions.push(new Explosion(ex, ey, 1.2));
        // Unshot enemies deal more damage
        const damageAmount = enemies[i].health === enemies[i].maxHealth ? 20 : 8;
        if (!shieldActive || timestamp > shieldEndTime) health -= damageAmount;
        playExplosion();
        enemies.splice(i, 1);
      } else if (enemies[i].position.y > GameHeight) {
        // Unshot enemies that pass deal more damage
        const damageAmount = enemies[i].health === enemies[i].maxHealth ? 8 : 2;
        if (!shieldActive || timestamp > shieldEndTime) health -= damageAmount;
        enemies.splice(i, 1);
      }

      for (var x in sLBullets) {
        if (typeof enemies[i] !== "undefined") {
          if (typeof sLBullets[x] !== "undefined") {
            if (collision(enemies[i], sLBullets[x])) {
              const e = enemies[i];
              e.health -= 0.5 * shooterPower;
              sLBullets.splice(x, 1);
              if (e.health <= 0) {
                const ex = e.position.x + e.width / 2;
                const ey = e.position.y + e.height / 2;
                explosions.push(new Explosion(ex, ey, 0.6));
                enemies.splice(i, 1);
                score += e.maxHealth >= 3 ? 25 : 10;
                enemiesKilled++;
                updateShooterPower();
                playShoot();
              }
            }
          }
        }
      }

      for (var x in sRBullets) {
        if (typeof enemies[i] !== "undefined") {
          if (typeof sRBullets[x] !== "undefined") {
            if (collision(enemies[i], sRBullets[x])) {
              const e = enemies[i];
              e.health -= 0.5 * shooterPower;
              sRBullets.splice(x, 1);
              if (e.health <= 0) {
                const ex = e.position.x + e.width / 2;
                const ey = e.position.y + e.height / 2;
                explosions.push(new Explosion(ex, ey, 0.6));
                enemies.splice(i, 1);
                score += e.maxHealth >= 3 ? 25 : 10;
                enemiesKilled++;
                updateShooterPower();
                playShoot();
              }
            }
          }
        }
      }

      for (var x in bullets) {
        if (typeof enemies[i] !== "undefined") {
          if (typeof bullets[x] !== "undefined") {
            if (collision(enemies[i], bullets[x])) {
              const e = enemies[i];
              e.health -= 1 * shooterPower;
              bullets.splice(x, 1);
              if (e.health <= 0) {
                const ex = e.position.x + e.width / 2;
                const ey = e.position.y + e.height / 2;
                explosions.push(new Explosion(ex, ey, 0.7));
                enemies.splice(i, 1);
                score += e.maxHealth >= 3 ? 25 : 10;
                enemiesKilled++;
                updateShooterPower();
                playShoot();
              }
            }
          }
        }
      }
    }

    for (var i in mEnemies) {
      mEnemies[i].draw(ctx);

      mEnemies[i].update(deltaTime);

      if (collision(paddle, mEnemies[i])) {
        const ex = mEnemies[i].position.x + mEnemies[i].width / 2;
        const ey = mEnemies[i].position.y + mEnemies[i].height / 2;
        explosions.push(new Explosion(ex, ey, 2));
        // Unshot boss enemies deal more damage
        const damageAmount = mEnemies[i].health === mEnemies[i].maxHealth ? 60 : 25;
        if (!shieldActive || timestamp > shieldEndTime) health -= damageAmount;
        playBossExplosion();
        mEnemies.splice(i, 1);
      } else if (mEnemies[i].position.y > GameHeight) {
        mEnemies.splice(i, 1);
        // Unshot boss enemies that pass deal more damage
        const damageAmount = mEnemies[i] && mEnemies[i].health === mEnemies[i].maxHealth ? 50 : 20;
        if (!shieldActive || timestamp > shieldEndTime) health -= damageAmount;
      }

      for (var x in sLBullets) {
        if (typeof mEnemies[i] !== "undefined") {
          if (typeof sLBullets[x] !== "undefined") {
            if (collision(mEnemies[i], sLBullets[x])) {
                if (!(mEnemies[i].health <= 0)) {
                  sLBullets.splice(x, 1);
                  mEnemies[i].health -= 0.25 * shooterPower;
                } else {
                  const ex = mEnemies[i].position.x + mEnemies[i].width / 2;
                  const ey = mEnemies[i].position.y + mEnemies[i].height / 2;
                  explosions.push(new Explosion(ex, ey, 2));
                  score += 100;
                  // if this was the final boss, player wins
                  const wasFinal = mEnemies[i].isFinal;
                  mEnemies.splice(i, 1);
                  enemiesKilled++;
                  updateShooterPower();
                  playBossExplosion();
                  if (wasFinal) {
                    gameState = "won";
                    gameWon = true;
                  }
                }
            }
          }
        }
      }

      for (var x in sRBullets) {
        if (typeof mEnemies[i] !== "undefined") {
          if (typeof sRBullets[x] !== "undefined") {
            if (collision(mEnemies[i], sRBullets[x])) {
              if (!(mEnemies[i].health <= 0)) {
                sRBullets.splice(x, 1);
                mEnemies[i].health -= 0.25 * shooterPower;
              } else {
                const ex = mEnemies[i].position.x + mEnemies[i].width / 2;
                const ey = mEnemies[i].position.y + mEnemies[i].height / 2;
                explosions.push(new Explosion(ex, ey, 2));
                score += 100;
                const wasFinal = mEnemies[i].isFinal;
                mEnemies.splice(i, 1);
                enemiesKilled++;
                updateShooterPower();
                playBossExplosion();
                if (wasFinal) {
                  gameState = "won";
                  gameWon = true;
                }
              }
            }
          }
        }
      }

      for (var x in bullets) {
        if (typeof mEnemies[i] !== "undefined") {
          if (typeof bullets[x] !== "undefined") {
            if (collision(mEnemies[i], bullets[x])) {
              if (!(mEnemies[i].health <= 0)) {
                mEnemies[i].health -= 1 * shooterPower;
              } else {
                const ex = mEnemies[i].position.x + mEnemies[i].width / 2;
                const ey = mEnemies[i].position.y + mEnemies[i].height / 2;
                explosions.push(new Explosion(ex, ey, 2));
                score += 100;
                const wasFinal = mEnemies[i].isFinal;
                mEnemies.splice(i, 1);
                enemiesKilled++;
                updateShooterPower();
                playBossExplosion();
                if (wasFinal) {
                  gameState = "won";
                  gameWon = true;
                }
              }
              bullets.splice(x, 1);
            }
          }
        }
      }
    }

    for (var i in healthPacks) {
      healthPacks[i].draw(ctx);

      healthPacks[i].update(deltaTime);

      if (collision(paddle, healthPacks[i])) {
        health = Math.min(400, health + 50);
        playCollect();
        healthPacks.splice(i, 1);
      } else if (healthPacks[i].position.y > GameHeight) {
        healthPacks.splice(i, 1);
      }

      for (var x in sLBullets) {
        if (typeof healthPacks[i] != "undefined") {
          if (typeof sLBullets[x] != "undefined") {
            if (collision(healthPacks[i], sLBullets[x])) {
              healthPacks.splice(i, 1);
              sLBullets.splice(x, 1);
              health = Math.min(400, health + 25);
              playCollect();
            }
          }
        }
      }

      for (let x in sRBullets) {
        if (typeof healthPacks[i] != "undefined") {
          if (typeof sRBullets[x] != "undefined") {
            if (collision(healthPacks[i], sRBullets[x])) {
              healthPacks.splice(i, 1);
              sRBullets.splice(x, 1);
              health = Math.min(400, health + 25);
              playCollect();
            }
          }
        }
      }

      for (var x in bullets) {
        if (typeof healthPacks[i] != "undefined") {
          if (typeof bullets[x] != "undefined") {
            if (collision(healthPacks[i], bullets[x])) {
              healthPacks.splice(i, 1);
              bullets.splice(x, 1);
              health = Math.min(400, health + 25);
              playCollect();
            }
          }
        }
      }
    }

    for (var i in shieldPacks) {
      shieldPacks[i].draw(ctx);
      shieldPacks[i].update(deltaTime);
      if (shieldPacks[i].position.y > GameHeight) {
        shieldPacks.splice(i, 1);
      }
      for (var x in sLBullets) {
        if (typeof shieldPacks[i] !== "undefined" && typeof sLBullets[x] !== "undefined") {
          if (collision(shieldPacks[i], sLBullets[x])) {
            shieldPacks.splice(i, 1);
            sLBullets.splice(x, 1);
            shieldActive = true;
            shieldEndTime = timestamp + SHIELD_DURATION_MS;
            playCollect();
          }
        }
      }
      for (var x in sRBullets) {
        if (typeof shieldPacks[i] !== "undefined" && typeof sRBullets[x] !== "undefined") {
          if (collision(shieldPacks[i], sRBullets[x])) {
            shieldPacks.splice(i, 1);
            sRBullets.splice(x, 1);
            shieldActive = true;
            shieldEndTime = timestamp + SHIELD_DURATION_MS;
            playCollect();
          }
        }
      }
      for (var x in bullets) {
        if (typeof shieldPacks[i] !== "undefined" && typeof bullets[x] !== "undefined") {
          if (collision(shieldPacks[i], bullets[x])) {
            shieldPacks.splice(i, 1);
            bullets.splice(x, 1);
            shieldActive = true;
            shieldEndTime = timestamp + SHIELD_DURATION_MS;
            playCollect();
          }
        }
      }
    }

    for (var i in bullets) {
      bullets[i].draw(ctx);

      bullets[i].update(deltaTime);

      if (bullets[i].position.y < 0) {
        bullets.splice(i, 1);
      }
    }

    for (var i in sLBullets) {
      sLBullets[i].draw(ctx);

      sLBullets[i].update(deltaTime);

      if (sLBullets[i].position.y < 0) {
        sLBullets.splice(i, 1);
      }
    }

    for (var i in sRBullets) {
      sRBullets[i].draw(ctx);

      sRBullets[i].update(deltaTime);

      if (sRBullets[i].position.y < 0) {
        sRBullets.splice(i, 1);
      }
    }

    for (let e = explosions.length - 1; e >= 0; e--) {
      explosions[e].draw(ctx);
      explosions[e].update(deltaTime);
      if (explosions[e].finished) explosions.splice(e, 1);
    }

    const barW = 220;
    const barH = 18;
    const barX = 14;
    const barY = 14;
    const r = 8;
    roundedRect(ctx, barX, barY, barW, barH, r);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
    const maxHealth = 400;
    const fillW = Math.max(0, (Math.min(health, maxHealth) / maxHealth) * (barW - 6));
    if (fillW > 0) {
      roundedRect(ctx, barX + 3, barY + 3, fillW, barH - 6, r - 2);
      ctx.fillStyle = health > maxHealth * 0.6 ? "#00e676" : health > maxHealth * 0.25 ? "#ffab00" : "#ff5252";
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "600 14px Rajdhani, sans-serif";
    ctx.fillText("HP " + Math.max(0, Math.ceil(health)), barX + barW / 2 - 22, barY + barH - 5);

    roundedRect(ctx, GameWidth - 140, 10, 130, 62, 10);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();
    ctx.fillStyle = "#00d4ff";
    ctx.font = "700 18px Orbitron, sans-serif";
    ctx.fillText("SCORE " + score, GameWidth - 128, 30);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "600 14px Rajdhani, sans-serif";
    ctx.fillText("BEST " + highScore, GameWidth - 128, 48);
    ctx.fillStyle = "rgba(255, 200, 100, 0.95)";
    ctx.fillText("LV " + level, GameWidth - 128, 65);
    ctx.fillStyle = "rgba(100, 200, 255, 0.95)";
    ctx.font = "600 13px Orbitron, sans-serif";
    ctx.fillText("PWR " + shooterPower.toFixed(1) + "x", GameWidth - 128, 80);

    if (shieldActive && timestamp < shieldEndTime) {
      const left = (shieldEndTime - timestamp) / SHIELD_DURATION_MS;
      roundedRect(ctx, barX, barY + barH + 10, barW, 8, 4);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();
      if (left > 0.01) {
        roundedRect(ctx, barX + 2, barY + barH + 12, (barW - 4) * left, 4, 2);
        ctx.fillStyle = "rgba(0, 212, 255, 0.7)";
        ctx.fill();
      }
      ctx.fillStyle = "#00d4ff";
      ctx.font = "600 11px Orbitron, sans-serif";
      ctx.fillText("SHIELD", barX, barY + barH + 32);
    }

    for (var b = 0; b < mEnemies.length; b++) {
      const boss = mEnemies[b];
      const bw = 120;
      const bh = 10;
      const bx = boss.position.x + boss.width / 2 - bw / 2;
      const by = boss.position.y - 18;
      roundedRect(ctx, bx, by, bw, bh, 4);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fill();
      const maxH = 20;
      const hp = Math.max(0, Math.min(boss.health, maxH));
      if (hp > 0) {
        roundedRect(ctx, bx + 2, by + 2, ((bw - 4) * hp) / maxH, bh - 4, 2);
        ctx.fillStyle = "#ff5252";
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      roundedRect(ctx, bx, by, bw, bh, 4);
      ctx.stroke();
    }

    spawnCount = Math.min(level, 3);

    if (score >= scoreForNextLevel) {
      if (level < FINAL_LEVEL) {
        level++;
        playLevelUp();
        updateShooterPower();
        scoreForNextLevel += 1000;
        zoneBannerUntil = timestamp + 2500;
      } else {
        // already at final level — show banner briefly
        playLevelUp();
        zoneBannerUntil = timestamp + 2500;
      }
    }

    if (timestamp < zoneBannerUntil) {
      const zoneName = ZONE_NAMES[Math.min(level - 1, ZONE_NAMES.length - 1)];
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, GameHeight / 2 - 45, GameWidth, 90);
      ctx.strokeStyle = "rgba(0, 212, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, GameHeight / 2 - 45, GameWidth, 90);
      ctx.fillStyle = "#00d4ff";
      ctx.font = "700 14px Orbitron, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LEVEL " + level, GameWidth / 2, GameHeight / 2 - 15);
      ctx.font = "900 28px Orbitron, sans-serif";
      ctx.fillText(zoneName, GameWidth / 2, GameHeight / 2 + 25);
      ctx.textAlign = "left";
    }

    if (health <= 0) {
      if (!died) {
        died = true;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("spaceShooterHighScore", String(highScore));
        }
        gameState = "gameover";
        stopHoldShoot();
        playGameOver();
      }
    }

  }


  if (!loaded) {

    galacticBackground.update(16);

    galacticBackground.draw(ctx);

    load.draw(ctx);

  }

  requestAnimationFrame(gameLoop);
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

function drawStartScreen(ctx) {
  ctx.fillStyle = "rgba(10, 10, 26, 0.78)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2;
  const cy = GameHeight / 2;
  roundedRect(ctx, cx - 280, cy - 100, 560, 220, 20);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 212, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "900 42px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SPACE SHOOTER", cx, cy - 45);
  ctx.fillStyle = "rgba(232, 232, 255, 0.9)";
  ctx.font = "600 18px Rajdhani, sans-serif";
  ctx.fillText("Hold and drag to move • Click or hold to shoot", cx, cy);
  ctx.fillStyle = "#00d4ff";
  ctx.font = "700 22px Orbitron, sans-serif";
  ctx.fillText("TAP OR PRESS ANY KEY TO LAUNCH", cx, cy + 55);
  ctx.textAlign = "left";
}

function drawGameOverScreen(ctx) {
  ctx.fillStyle = "rgba(8, 6, 24, 0.88)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2;
  const cy = GameHeight / 2;
  roundedRect(ctx, cx - 260, cy - 95, 520, 200, 20);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 82, 82, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#ff5252";
  ctx.font = "900 38px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", cx, cy - 40);
  ctx.fillStyle = "#fff";
  ctx.font = "600 22px Rajdhani, sans-serif";
  ctx.fillText("SCORE " + score, cx, cy + 5);
  ctx.fillText("BEST " + highScore, cx, cy + 38);
  ctx.fillStyle = "#00d4ff";
  ctx.font = "700 18px Orbitron, sans-serif";
  ctx.fillText("TAP OR PRESS ANY KEY TO PLAY AGAIN", cx, cy + 85);
  ctx.textAlign = "left";
}

function drawWinScreen(ctx) {
  ctx.fillStyle = "rgba(4, 8, 18, 0.95)";
  ctx.fillRect(0, 0, GameWidth, GameHeight);
  const cx = GameWidth / 2;
  const cy = GameHeight / 2;
  roundedRect(ctx, cx - 300, cy - 120, 600, 240, 24);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 200, 150, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#00ffb2";
  ctx.font = "900 44px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CONGRATULATIONS", cx, cy - 20);
  ctx.fillStyle = "#fff";
  ctx.font = "600 20px Rajdhani, sans-serif";
  ctx.fillText("You conquered the campaign and defeated the Final Boss!", cx, cy + 18);
  ctx.fillStyle = "#00d4ff";
  ctx.font = "700 18px Orbitron, sans-serif";
  ctx.fillText("Press any key or tap to play again", cx, cy + 70);
  ctx.textAlign = "left";
}


function fire() {

  if (gameState === "playing") {

    playShoot();

    let bullet = new Bullet(paddle, bulletImg);

    let sLBullet = new SLBullet(bullet, bulletImg);

    let sRBullet = new SRBullet(bullet, bulletImg);

    bullets.push(bullet);

    sLBullets.push(sLBullet);

    sRBullets.push(sRBullet);

  }

}

let spawnCount = 1;

function spawnEnemy() {

  if (gameState === "playing") {

    // Level 1-2: Mostly basic enemies with some fast ones
    if (level <= 2 && Math.random() > 0.4) {
      return;
    }

    for (let i = 0; i < spawnCount; i++) {

      const roll = Math.random();
      let enemy;
      
      if (level >= 1 && level <= 2) {
        // Levels 1-2: Basic enemies + occasional Fast
        enemy = roll < 0.25 ? new FastEnemy(GameWidth, enemyImg) : new Enemy(GameWidth, enemyImg);
      } else if (level >= 3 && level <= 5) {
        // Levels 3-5: Tank enemies prominent
        enemy = roll < 0.5 ? new TankEnemy(GameWidth, enemyImg) : new Enemy(GameWidth, enemyImg);
      } else if (level >= 6 && level <= 8) {
        // Levels 6-8: Fast and Zigzag enemies
        if (roll < 0.4) {
          enemy = new FastEnemy(GameWidth, enemyImg);
        } else if (roll < 0.65) {
          enemy = new ZigzagEnemy(GameWidth, enemyImg);
        } else {
          enemy = new Enemy(GameWidth, enemyImg);
        }
      } else if (level >= 9 && level <= 11) {
        // Levels 9-11: Tank and Zigzag enemies
        if (roll < 0.35) {
          enemy = new TankEnemy(GameWidth, enemyImg);
        } else if (roll < 0.65) {
          enemy = new ZigzagEnemy(GameWidth, enemyImg);
        } else {
          enemy = new Enemy(GameWidth, enemyImg);
        }
      } else {
        // Levels 12-15: All types heavily mixed
        if (roll < 0.25) {
          enemy = new FastEnemy(GameWidth, enemyImg);
        } else if (roll < 0.45) {
          enemy = new TankEnemy(GameWidth, enemyImg);
        } else if (roll < 0.7) {
          enemy = new ZigzagEnemy(GameWidth, enemyImg);
        } else {
          enemy = new Enemy(GameWidth, enemyImg);
        }
      }
      
      enemies.push(enemy);

    }

  }

}

function spawnMEnemy() {

  if (gameState === "playing") {
    // For final campaign, spawn a one-time final boss at FINAL_LEVEL
    if (level === FINAL_LEVEL) {
      if (!finalBossSpawned) {
        let boss = new MEnemy(GameWidth, bossImg);
        // Make final boss beefier
        boss.health = 200;
        boss.maxHealth = boss.health;
        boss.width = 220;
        boss.height = 220;
        boss.speed = 20;
        boss.isFinal = true;
        mEnemies.push(boss);
        finalBossSpawned = true;
      }
      return;
    }

    // Don't spawn boss enemies in level 1
    if (level === 1) return;

    let mEnemy = new MEnemy(GameWidth, bossImg);
    mEnemies.push(mEnemy);

  }

}

function spawnHealth() {

  if (gameState === "playing") {

    let healthPack = new HealthPack(GameWidth, healthImg);

    healthPacks.push(healthPack);

  }

}

function spawnShield() {

  if (gameState === "playing") {

    let pack = new ShieldPack(GameWidth);

    shieldPacks.push(pack);

  }

}

function spawnStar() {

  if (gameState === "playing") {

    let star = new Star(true, GameWidth, GameHeight);

    stars.push(star);

  }

}

setInterval(spawnEnemy, 300);

setInterval(spawnMEnemy, 5000);

setInterval(spawnHealth, 7000);

setInterval(spawnShield, 15000);

function startHoldShoot() {
  if (gameState !== "playing") return;
  fire();
  if (!shootIntervalId) {
    shootIntervalId = setInterval(() => {
      if (gameState === "playing") fire();
    }, SHOOT_INTERVAL_MS);
  }
}

function stopHoldShoot() {
  if (shootIntervalId) {
    clearInterval(shootIntervalId);
    shootIntervalId = null;
  }
}

GameScreen.addEventListener("mousedown", () => startHoldShoot());

GameScreen.addEventListener("mouseup", () => stopHoldShoot());

GameScreen.addEventListener("mouseleave", () => stopHoldShoot());

document.addEventListener("mouseup", () => stopHoldShoot());

GameScreen.addEventListener("touchstart", (e) => startHoldShoot(), { passive: true });

GameScreen.addEventListener("touchend", () => stopHoldShoot(), { passive: true });

document.addEventListener("touchend", () => stopHoldShoot(), { passive: true });

setInterval(spawnStar, 200);

// Start the game immediately
gameLoop();

function collision(a, b) {
  return (
    a.position.x < b.position.x + b.width &&
    a.position.x + a.width > b.position.x &&
    a.position.y < b.position.y + b.height &&
    a.position.y + a.height > b.position.y
  );
}

function restartGame() {

  health = 300;

  score = 0;

  bullets = [];

  sLBullets = [];

  sRBullets = [];

  enemies = [];

  mEnemies = [];

  healthPacks = [];

  shieldPacks = [];

  explosions = [];

  stars = [];
  for (let i = 0; i < GameWidth; i += 40) {
    for (let x = 0; x < GameHeight; x += 40) {
      stars.push(new Star(false, GameWidth, GameHeight));
    }
  }

  died = false;

  paddle.position.x = GameWidth / 2 - paddle.width / 2;

  paddle.position.y = GameHeight - paddle.height - 10;

  gameTime = 0;

  shieldActive = false;

  shieldEndTime = 0;

  spawnCount = 1;

  level = 1;

  scoreForNextLevel = 1000;

  zoneBannerUntil = 0;

  shooterPower = 1.0;
  enemiesKilled = 0;
}

/*document.addEventListener("resize", function() {

  GameWidth = innerWidth;

  GameHeight = innerHeight;

  GameScreen.width = GameWidth;

  GameScreen.height = GameHeight;

});*/
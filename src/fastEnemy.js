import Enemy from "/src/enemy.js";

export default class FastEnemy extends Enemy {
  constructor(gameWidth, img, level = 1) {
    super(gameWidth, img, {
      width: 32,
      height: 32,
      health: 1,
      speed: 140,
      speedRange: 50,
      level,
    });
  }
}
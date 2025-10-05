const canvas = document.getElementById("myCanvas");
const render_pos = document.getElementById("plpos");
const render_HP = document.getElementById("plhp");
const render_BallNb = document.getElementById("nbballs");
const boostTimerDisplay = document.getElementById("boost-timer");

const ctx = canvas.getContext("2d");

const width = 1000;
const height = 1000;
const MAX_BALLS = 50;
const keys = {};

let isGameOver = false;

balls = [];

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " " && !e.repeat) {
    pl.boostBoost();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r" && isGameOver) {
    restartGame();
  }
});

function showBoostCooldown() {
  boostTimerDisplay.style.display = "block";
}

function hideBoostCooldown() {
  boostTimerDisplay.style.display = "none";
}

class Player {
  constructor(xpos, ypos, vx, vy, color) {
    this.xpos = xpos;
    this.ypos = ypos;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.hp = 100;
    this.w = 25;
    this.h = 25;
    this.lastTimeHit = 0;
    this.canBoost = true;
    this.isBoosting = false;
    this.boostDuration = 10 * 1000;
    this.boostCooldown = 60 * 1000;
    this.lastBoostTime = 0;
    this.StartVX = vx;
    this.StartVY = vy;
  }
  boostBoost() {
    const now = performance.now();
    if (this.canBoost) {
      this.vx = this.StartVX * 3;
      this.vy = this.StartVY * 3;
      this.isBoosting = true;
      this.canBoost = false;
      this.lastBoostTime = now;
      // rest the normal speed after boost
      setTimeout(() => {
        this.vx = this.StartVX;
        this.vy = this.StartVY;
        this.isBoosting = false;
      }, this.boostDuration);
      // allow boost again after 60sec
      setTimeout(() => {
        this.canBoost = true;
        hideBoostCooldown();
      }, this.boostCooldown);
      showBoostCooldown();
    }
  }

  leftBoostCooldown() {
    if (this.canBoost) return 0;
    const now = performance.now();
    return Math.max(0, this.boostCooldown - (now - this.lastBoostTime));
  }

  getHP() {
    return this.hp;
  }
  isInvincible() {
    return performance.now() - this.lastTimeHit < 500; // compare on ms scale
  }
  drawPlayer() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.xpos, this.ypos, this.w, this.h);
  }

  isCollidingWithBalls(ball) {
    const circleX = ball.posx;
    const circleY = ball.posy;
    const radius = ball.radius;

    const xx = Math.max(this.xpos, Math.min(circleX, this.xpos + this.w));
    const yy = Math.max(this.ypos, Math.min(circleY, this.ypos + this.h));

    const dx = circleX - xx;
    const dy = circleY - yy;

    return dx * dx + dy * dy < radius * radius;
  }

  checkCollForAllBalls(balls) {
    for (const ball in balls) {
      if (this.isCollidingWithBalls(ball)) {
        return true;
      }
    }

    return false;
  }

  updatePlayer(dt, balls) {
    const startX = this.xpos;
    const startY = this.ypos;

    if (keys["z"]) {
      this.ypos -= this.vy * dt;
    }
    if (keys["s"]) {
      this.ypos += this.vy * dt;
    }
    if (this.checkCollForAllBalls(balls)) {
      this.ypos = startY;
    }
    if (keys["q"]) {
      this.xpos -= this.vx * dt;
    }
    if (keys["d"]) {
      this.xpos += this.vx * dt;
    }
    if (this.checkCollForAllBalls(balls)) {
      this.xpos = startX;
    }

    if (this.xpos < 0) {
      this.xpos = 0;
    }
    if (this.ypos < 0) {
      this.ypos = 0;
    }
    if (this.xpos + this.w > width) {
      this.xpos = width - this.w;
    }
    if (this.ypos + this.h > height) {
      this.ypos = height - this.h;
    }
    render_pos.textContent = `Player-Postion :(${Math.floor(
      this.xpos
    )},${Math.floor(this.ypos)})`;
  }
}

class Ball {
  constructor(posx, posy, vx, vy, color, radius) {
    this.posx = posx;
    this.posy = posy;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.radius = radius;
    this.dmg = 5.0;
  }

  drawBall() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.posx, this.posy, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  updateBall(dt) {
    if (this.posx + this.radius >= width) {
      this.vx = -this.vx;
    }
    if (this.posx - this.radius <= 0) {
      this.vx = -this.vx;
    }

    if (this.posy + this.radius >= height) {
      this.vy = -this.vy;
    }

    if (this.posy - this.radius <= 0) {
      this.vy = -this.vy;
    }

    this.posx += this.vx * dt;
    this.posy += this.vy * dt;
  }

  isCollided(player) {
    for (const entity of balls) {
      if (this !== entity) {
        const dx = this.posx - entity.posx;
        const dy = this.posy - entity.posy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.radius + entity.radius) {
          // swap velocity
          const nVx = this.vx;
          const nVy = this.vy;

          this.vx = entity.vx;
          this.vy = entity.vy;

          entity.vx = nVx;
          entity.vy = nVy;
        }
      }
    }
    if (player) {
      const inithp = player.hp;
      if (player && this.isCircleToRect(player)) {
        const now = performance.now();
        if (!player.isInvincible()) {
          player.hp -= this.dmg;
          player.hp = Math.max(0, player.hp);
          player.lastTimeHit = now;

          if (player.hp === 0) {
            isGameOver = true;
          }

          render_HP.textContent = `Player-HP: ${player.hp}`;
          // it should bounce back from the player
          this.vx = -this.vx;
          this.vy = -this.vy;
        }
      }
    }
  }

  // check the collision between Ball and player
  isCircleToRect(player) {
    const radius = this.radius;
    const xx = Math.max(
      player.xpos,
      Math.min(this.posx, player.xpos + player.w)
    );
    const yy = Math.max(
      player.ypos,
      Math.min(this.posy, player.ypos + player.h)
    );
    const dx = this.posx - xx;
    const dy = this.posy - yy;
    return dx * dx + dy * dy < radius * radius;
  }

  chasePlayer(player) {
    const dx = player.xpos + player.w / 2 - this.posx;
    const dy = player.ypos + player.h / 2 - this.posy;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      const acceleration = 0.5;
      const directionX = dx / distance;
      const directionY = dy / distance;

      this.vx += directionX * acceleration;
      this.vy += directionY * acceleration;

      const maxSpeed = 100;
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
    }
  }
}

// FireBall class
class FireBall extends Ball {
  constructor(posx, posy, vx, vy, color, radius) {
    super(posx, posy, vx, vy, color, radius);
    this.DMG = 2.0;
    this.Destroyed = false;
  }

  // The idea is to check the flag:"Destroyed" to draw the fireball
  isCollided() {
    for (const entity of balls) {
      const dx = this.posx - entity.posx;
      const dy = this.posy - entity.posy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.radius + entity.radius) {
        this.Destroyed = true;
        break;
      }
    }
  }

  // the idea is to launch the fireball from the center of the rect (player)
  launchFireBall(targetX, targetY) {
    const dx = targetX - (Player.xpos + 37.5); // from center of player
    const dy = targetY - (Player.ypos + 37.5);
    const angle = Math.atan2(dy, dx);
    const velocityX = Math.sin(angle) * this.vx;
    const velocityY = Math.sin(angle) * this.vy;

    this.xpos = dx;
    this.ypos = dy;
    this.vx = velocityX;
    this.vy = velocityY;
  }
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function populate(player) {
  while (balls.length < MAX_BALLS) {
    const radius = 15;
    const ballX = random(0 + radius, width - radius);
    const ballY = random(0 + radius, height - radius);
    const buffer = 20;
    if (
      ballX > player.xpos - radius - buffer &&
      ballX < player.xpos + player.w + radius + buffer &&
      ballY > player.ypos - radius - buffer &&
      ballY < player.ypos + player.h + radius + buffer
    ) {
      continue;
    }

    const ball = new Ball(
      ballX,
      ballY,
      random(-6, 6),
      random(-6, -6),
      randomRGB(),
      radius
    );
    balls.push(ball);
  }
}

const pl = new Player(width / 2, height / 2, 60, 60, "rgb(255,255,255)");
let lasttime = performance.now();
function gameLoop() {
  ctx.fillStyle = "rgb(0 0 0 / 25%)";
  ctx.fillRect(0, 0, width, height);
  if (isGameOver) {
    displayGameOver();
    return;
  }
  render_BallNb.textContent = `Balls: ${balls.length}`;
  let currtime = performance.now();
  const dt = (currtime - lasttime) / 1000;
  lasttime = currtime;
  pl.updatePlayer(dt, balls);

  for (const ball of balls) {
    ball.chasePlayer(pl);
    ball.updateBall(dt);
    ball.isCollided(pl);
  }

  pl.drawPlayer();
  for (const ball of balls) {
    ball.drawBall();
  }
  if (!pl.canBoost) {
    const remaining = Math.ceil(pl.leftBoostCooldown() / 1000);
    boostTimerDisplay.textContent = `Boost Cooldown: ${remaining}s`;
  }
  requestAnimationFrame(gameLoop);
}
function displayGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "white";
  ctx.font = "48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Game Over - Your Mom", width / 2, height / 2 - 20);
  ctx.font = "24px sans-serif";
  ctx.fillText("Press R to Restart", width / 2, height / 2 + 30);
}
function restartGame() {
  isGameOver = false;
  balls.length = 0;
  populate(pl);

  pl.canBoost = true;
  pl.isBoosting = false;
  pl.vx = pl.defaultVx;
  pl.vy = pl.defaultVy;
  pl.xpos = width / 2;
  pl.ypos = height / 2;
  pl.hp = 100;
  hideBoostCooldown();
  lasttime = performance.now();
  gameLoop();
}

populate(pl);
gameLoop();

function randomRGB() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);

  return `rgb(${r}, ${g}, ${b})`;
}

const canvas = document.getElementById("myCanvas");
const render_pos = document.getElementById("plpos");
const render_HP = document.getElementById("plhp");
const render_BallNb = document.getElementById("nbballs");
const boostTimerDisplay = document.getElementById("boost-timer");
const render_fbdmg = document.getElementById("FB-Dmg");
const render_BossHP = document.getElementById("BOSS-HP");
const ctx = canvas.getContext("2d");

const width = 1000;
const height = 1000;
const MAX_BALLS = 30;
const keys = {};

let isGameOver = false;

balls = [];

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === " " && !e.repeat) {
    pl.boostBoost();
  }
  if (e.key.toLowerCase() === "r" && isGameOver) {
    restartGame();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

const fireArea = document.getElementById("fire-area");

fireArea.addEventListener("touchstart", (e) => {
  e.stopPropagation(); // Prevents event conflict with movement buttons

  if (isGameOver) return;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const targetX = touch.clientX - rect.left;
  const targetY = touch.clientY - rect.top;

  const fireball = new FireBall(
    pl.xpos + pl.w / 2,
    pl.ypos + pl.h / 2,
    0,
    0,
    "rgb(255, 68, 0)",
    3,
    targetX,
    targetY
  );
  fireballs.push(fireball);
});

function showBoostCooldown() {
  boostTimerDisplay.style.display = "block";
}
function hideBoostCooldown() {
  boostTimerDisplay.style.display = "none";
}

const bossFireballImg = new Image();
bossFireballImg.src = "./assets/throw.png";
bossFireballImg.onload = () => {
  console.log("Boss fireball image loaded");
};

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
    this.lastTimeHit = 0; // flag to prevent hitting multiple time per frame
    this.canBoost = true; // ability to boost if not used
    this.isBoosting = false; // FLAG if he is boosting now or not
    this.boostDuration = 10 * 1000; // duration of the boost (10sec)
    this.boostCooldown = 60 * 1000; // time needed to boost again (60sec)
    this.lastBoostTime = 0; // flag to keep on track on last time boosted
    this.StartVX = vx; // save initial vx to restore after boost ends
    this.StartVY = vy; // ............ vy ...........................
    this.criticDmg = 0; // initial value of crictic dmg (availaible on boost only)
    this.shield = 0; // initial value of shield (adds to hp value on boost only)
    this.BoostInfo = render_fbdmg;
    this.BoostInfoHp = render_HP;
  }
  boostBoost() {
    const now = performance.now();
    if (this.canBoost) {
      this.vx *= 3;
      this.vy *= 3;
      this.criticDmg = 2;
      this.shield = 100;
      this.hp += this.shield;
      this.isBoosting = true;
      this.canBoost = false;
      this.lastBoostTime = now;
      this.BoostInfo.textContent = `DMG:${this.criticDmg * 2}`;
      this.BoostInfoHp.textContent = `HP:${this.hp}`;
      // rest the normal speed after boost
      setTimeout(() => {
        this.vx = this.StartVX;
        this.vy = this.StartVY;
        this.criticDmg = 0;
        this.hp -= this.shield;
        this.shield = 0;

        this.isBoosting = false;
        this.BoostInfo.textContent = `DMG:${2}`;
        this.BoostInfoHp.textContent = `HP:${this.hp}`;
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
  // preventing dealing dmg to player per frame ()
  isInvincible() {
    return performance.now() - this.lastTimeHit < 500; // compare on ms scale
  }
  // drawing the player
  drawPlayer() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.xpos, this.ypos, this.w, this.h);
  }
  // helper function (1) collision between circle and ball
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
  // use of (1) to check for all balls stored in the vector(balls)
  // return 1 on collide
  checkCollForAllBalls(balls) {
    for (const ball in balls) {
      if (this.isCollidingWithBalls(ball)) {
        return true;
      }
    }

    return false;
  }
  // update the player postion( via keys)
  // keep on checking  if he collide while moving
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
    this.dmg = 2.5;
    this.hp = 4;
    this.isAlive = true;
    this.boosHP = render_BossHP;
    this.isBoss = false;
  }
  // ability to take dmg from player via fireball
  // if the player is on boost mode the dmg increase by critic dmg
  // decide the final dmg taken by the Ball
  // update the state of the ball to decied is it stays on frame
  // or being removed , splice from array of Balls
  takeDmg(player, amount) {
    const finalDMG = player.isBoosting ? amount * player.criticDmg : amount;

    this.hp -= finalDMG;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
      return true; // DEAD
    }

    return false; // alive
  }
  // for the bossonly
  drawBossBall(img, x, y) {
    const size = this.radius * 2;
    ctx.drawImage(img, x, y, size, size);
  }
  shootAtPlayer(player) {
    if (!this.isBoss) return;

    const fireball = new BossFireBall(
      this.posx,
      this.posy,
      player.xpos + player.w / 2,
      player.ypos + player.h / 2
    );
    bossFireballs.push(fireball);
  }

  // draw the ball
  drawBall() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.posx, this.posy, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
  // update the ball : movement on the canvas (factor : dt)
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
  // check the collosion between the ball and the player
  // if collide the dmg is done and supposed to bounce back via
  // swaping velocity
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
          player.BoostInfoHp.textContent = `HP:${player.hp}`;
          player.lastTimeHit = now;

          if (player.hp === 0) {
            isGameOver = true;
          }

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
  // chasing the player on the canvas
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
  constructor(posx, posy, vx, vy, color, radius, targetX, targetY) {
    super(posx, posy, vx, vy, color, radius);
    this.DMG = 2.0;
    this.Destroyed = false; // Flag : decide if we remove it or keep it
    this.speed = 200; // the speed of the fire ball

    // the direction toward the target via a velocity x,y
    const dx = targetX - this.posx;
    const dy = targetY - this.posy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / distance) * this.speed;
    this.vy = (dy / distance) * this.speed;
  }
  // another naive try : for calculating the total dmg done
  // checking the state of player if boosting now or no
  TotalDMG(player) {
    if (player.isBoosting) {
      const total = this.DMG * player.criticDmg;
      return total;
    }

    return this.DMG;
  }

  update(dt) {
    this.posx += this.vx * dt;
    this.posy += this.vy * dt;

    // Destroy it , if it collide with map borders (canvas w,h)
    if (
      this.posx < 0 ||
      this.posx > width ||
      this.posy < 0 ||
      this.posy > height
    ) {
      this.destroyed = true;
    }
  }
  // drawing the fireball
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.posx, this.posy, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
  // bullet (fireball) with the ball considerd as enemy
  // if collide : the Ball takes dmg , based on the player state : boosting or no
  checkCollisionWithBall(ball) {
    const dx = this.posx - ball.posx;
    const dy = this.posy - ball.posy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.radius + ball.radius) {
      const destroyed = ball.takeDmg(pl, this.DMG);
      this.destroyed = true;
      return destroyed;
    }
    return false;
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
}

class BossFireBall extends FireBall {
  constructor(posx, posy, targetX, targetY) {
    super(posx, posy, 0, 0, "rgb(255,0,0)", 5, targetX, targetY);
    this.dmg = 6.5;
    this.speed = 150;
    this.vx =
      ((targetX - posx) / Math.hypot(targetX - posx, targetY - posy)) *
      this.speed;
    this.vy =
      ((targetY - posy) / Math.hypot(targetX - posx, targetY - posy)) *
      this.speed;
  }
  draw() {
    const size = this.radius * 2;
    ctx.drawImage(
      bossFireballImg,
      this.posx - this.radius,
      this.posy - this.radius,
      size,
      size
    );
  }
  checkCollisionWithPlayer(player) {
    const dx = this.posx - (player.xpos + player.w / 2);
    const dy = this.posy - (player.ypos + player.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.radius + Math.min(player.w, player.h) / 2) {
      if (!player.isInvincible()) {
        player.hp -= this.DMG;
        player.hp = Math.max(0, player.hp);
        player.BoostInfoHp.textContent = `HP:${player.hp}`;
        player.lastTimeHit = performance.now();

        if (player.hp === 0) {
          isGameOver = true;
        }
      }
      return true;
    }

    return false;
  }
}

const fireballs = [];
const bossFireballs = [];

canvas.addEventListener("click", (e) => {
  if (isGameOver) return;

  const rect = canvas.getBoundingClientRect();
  const targetX = e.clientX - rect.left;
  const targetY = e.clientY - rect.top;

  const fireball = new FireBall(
    pl.xpos + pl.w / 2,
    pl.ypos + pl.h / 2,
    0,
    0,
    "rgb(255, 68, 0)",
    3,
    targetX,
    targetY
  );

  fireballs.push(fireball);
});

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
const bossImg = new Image();
bossImg.src = "./assets/taxi.png";
bossImg.onload = () => {
  console.log("Player image ready!");
};
const pl = new Player(width / 2, height / 2, 60, 60, "rgb(255,255,255)");
let lasttime = performance.now();

function gameLoop() {
  ctx.fillStyle = "rgb(0 0 0 / 25%)";
  ctx.fillRect(0, 0, width, height);

  let lastBossFire = 0;
  const bossFireRate = 7000; // every 2 seconds

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

  // Update Fireballs
  for (const fireball of fireballs) {
    fireball.update(dt);
    // remove enemy balls if their hp = 0
    for (let i = balls.length - 1; i >= 0; i--) {
      if (fireball.checkCollisionWithBall(balls[i])) {
        if (balls[i].hp <= 0) {
          balls.splice(i, 1);
        }
      }
    }
  }

  // Clean up destroyed fireballs
  for (let i = fireballs.length - 1; i >= 0; i--) {
    if (fireballs[i].destroyed) {
      fireballs.splice(i, 1);
    }
  }

  pl.drawPlayer();
  for (const ball of balls) {
    if (ball.isBoss) {
      ball.drawBossBall(
        bossImg,
        ball.posx - ball.radius,
        ball.posy - ball.radius
      );
      ball.boosHP.textContent = `TAXI:${ball.hp}`;
    } else {
      ball.drawBall();
    }
  }
  if (balls.length === 1 && !balls[0].isBoss) {
    beBoss();
  }
  const now = performance.now();
  const boss = balls.find((b) => b.isBoss);
  if (boss && now - lastBossFire > bossFireRate) {
    boss.shootAtPlayer(pl);
    lastBossFire = now;
  }
  for (let i = bossFireballs.length - 1; i >= 0; i--) {
    const fireball = bossFireballs[i];
    fireball.update(dt);

    // Check collision with player
    if (fireball.checkCollisionWithPlayer(pl)) {
      bossFireballs.splice(i, 1);
    }

    // Remove offscreen fireballs
    else if (
      fireball.posx < 0 ||
      fireball.posx > width ||
      fireball.posy < 0 ||
      fireball.posy > height
    ) {
      bossFireballs.splice(i, 1);
    }
  }

  // Draw boss fireballs
  for (const fireball of bossFireballs) {
    fireball.draw();
  }

  // draw the all the fireballs
  for (const fireball of fireballs) {
    fireball.draw();
  }
  if (!pl.canBoost) {
    const remaining = Math.ceil(pl.leftBoostCooldown() / 1000);
    boostTimerDisplay.textContent = `Boost Cooldown: ${remaining}s`;
  }

  requestAnimationFrame(gameLoop);
}

function beBoss() {
  if (balls.length === 1) {
    balls[0] = new Ball(width / 3, height / 3, 15, 15, "", 45);
    balls[0].hp = 100;
    balls[0].dmg = 22;
    balls[0].radius = 45;
    balls[0].isBoss = true;
  }
}

function displayGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "white";
  ctx.font = "48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Game Over- By moezgWall", width / 2, height / 2 - 20);
  ctx.font = "24px sans-serif";
  ctx.fillText("Press R to Restart", width / 2, height / 2 + 30);
}
// restart the game to init state
function restartGame() {
  isGameOver = false;
  balls.length = 0;
  populate(pl);
  pl.canBoost = true;
  pl.isBoosting = false;
  pl.vx = pl.StartVX;
  pl.vy = pl.StartVY;
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

function bindMobileControls() {
  const btnUp = document.getElementById("btn-up");
  const btnDown = document.getElementById("btn-down");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnBoost = document.getElementById("btn-boost");

  function handlePress(key) {
    keys[key] = true;
  }

  function handleRelease(key) {
    keys[key] = false;
  }

  btnUp.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handlePress("z");
  });
  btnUp.addEventListener("touchend", (e) => {
    e.preventDefault();
    handleRelease("z");
  });
  btnDown.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handlePress("s");
  });
  btnDown.addEventListener("touchend", (e) => {
    e.preventDefault();
    handleRelease("s");
  });
  btnLeft.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handlePress("q");
  });
  btnLeft.addEventListener("touchend", (e) => {
    e.preventDefault();
    handleRelease("q");
  });

  btnRight.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handlePress("d");
  });
  btnRight.addEventListener("touchend", (e) => {
    e.preventDefault();
    handleRelease("d");
  });

  btnBoost.addEventListener("touchstart", (e) => {
    e.preventDefault();
    pl.boostBoost();
  });
}

bindMobileControls();

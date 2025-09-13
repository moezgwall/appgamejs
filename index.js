
const div = document.getElementById("src");
const canvas = document.getElementById("canvas");

canvas.width = 800;
canvas.height = 800;

const ctx = canvas.getContext("2d");

const PlayerState = [];
const BallState = [];

const w_pl = 12;
const h_pl = 12;

const player = {
    xPos: 0,
    yPos: 0,
    speed: 10,
    isAlive: true,
    teamColor: "black",
    onMove: false,

};

const ball = {
    xPos: 0,
    yPos: 0,
    launchSpeed: 10,
    radius: 6,
    col_state: false,
    color : "red",

};


// func : drawing the player with it's initial x,y
function drawPlayer() {
    ctx.fillStyle = player.teamColor;
    ctx.fillRect(player.xPos, player.yPos, w_pl, h_pl);
}

// func : drawing the ball 
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.xPos, ball.yPos, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.teamColor;
    ctx.fill();
}

//todo : launch the ball to new mouse (x,y) postion (naive)
function launchBall(targetX, targetY) {

   // Start the ball at the center of the player
    ball.xPos = player.xPos + w_pl / 2;
    ball.yPos = player.yPos + h_pl / 2;

    // Calculate direction vector
    const dx = targetX - ball.xPos;
    const dy = targetY - ball.yPos;
    const angle = Math.atan2(dy, dx);

    const speed = ball.launchSpeed;
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;


}

function update() {
ctx.clearRect(0, 0, canvas.width, canvas.height);

    trackBall();
    drawPlayer();
    drawBall();

    requestAnimationFrame(update);
}

function trackBall() {
    ball.xPos += ball.vx;
    ball.yPos += ball.vy;

    

     // Bounce off left or right walls
    if (ball.xPos - ball.radius < 0) {
        ball.xPos = ball.radius; // reposition inside boundary
        ball.vx = -ball.vx;      // reverse velocity
    } else if (ball.xPos + ball.radius > canvas.width) {
        ball.xPos = canvas.width - ball.radius;
        ball.vx = -ball.vx;
    }

    // Bounce off top or bottom walls
    if (ball.yPos - ball.radius < 0) {
        ball.yPos = ball.radius;
        ball.vy = -ball.vy;
    } else if (ball.yPos + ball.radius > canvas.height) {
        ball.yPos = canvas.height - ball.radius;
        ball.vy = -ball.vy;
    }
}

function movePlayer(key) {
    // moving the player according to keyboard input
    switch (key) {
        case 'z': player.yPos -= player.speed;
            break;
        case 's': player.yPos += player.speed;
            break;
        case 'q': player.xPos -= player.speed;
            break;
        case 'd': player.xPos += player.speed;
            break;

    };

}

document.addEventListener('keydown', (e) => {
    movePlayer(e.key.toLowerCase());
});


canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    launchBall(mouseX, mouseY);
});

update();
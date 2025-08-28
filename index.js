
const div = document.getElementById("src");
const canvas = document.getElementById("canvas");

canvas.width = 800;
canvas.heigth = 800;

const ctx = canvas.getContext("2d");

const PlayerState = [];
const BallState = [];

const w_pl = 12;
const h_pl = 12;

const player = {
    "xPos": 0,
    "yPos": 0,
    "speed": 10,
    "isAlive": true,
    "teamColor": "black",
    "onMove": "false",

};

const ball = {
    "xPos": 0,
    "yPos": 0,
    "launchSpeed": 10,
    "radius": 6,
    "col_state": false,

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

    const dx = targetX - (player.xPos + w_pl / 2);
    const dy = targetY - (player.yPos + h_pl / 2);

    const angle = Math.atan2(dy, dx);

    const speed = ball.launchSpeed;

    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;


}

function updatePlayerState() {

}

function trackBall() {

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
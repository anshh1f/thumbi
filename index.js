const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Images
const bgImg = new Image();
bgImg.src = "bg.avif";
const dragonflyImg = new Image();
dragonflyImg.src = "dragonfly.png";
const stoneImg = new Image();
stoneImg.src = "stone1.png";
const bucketImg = new Image();
bucketImg.src = "bucket.png";
const frogImg = new Image();
frogImg.src = "frog.webp";

const frogSound = new Audio('frog-sound.mp3');  // Use your actual sound file name here
frogSound.volume = 0.5; // Set volume (0 to 1)
let lastJumpSin = 0;

// Dragonfly
const dragonfly = {
  x: 100,
  y: 100,
  width: 100,
  height: 60,
  speed: 5,
  carrying: null,
  dead: false
};

// Stones
const stones = [];
const stoneCount = 3;
function spawnStones() {
  for (let i = 0; i < stoneCount; i++) {
    stones.push({
      x: Math.random() * (canvas.width - 50) + 25,
      y: Math.random() * (canvas.height - 200) + 25,
      size: 25,
      taken: false,
      vy: 0,
      gravity: 0.5,
      bounce: 0.6
    });
  }
}

// Bucket
const bucket = {
  x: canvas.width - 150,
  y: canvas.height - 150,
  width: 100,
  height: 100
};

// Frog
const frog = {
  x: canvas.width + 150,
  y: canvas.height - 150,
  width: 120,
  height: 100,
  speed: 4,
  active: false
};

let jumpTime = 0;      // time counter for jump animation
const jumpHeight = 20; // max jump height in pixels
const jumpSpeed = 0.1;

// Rotation + facing
let rotationAngle = 10;
let facingLeft = false;
let score = 0;

// Controls
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
window.addEventListener("keydown", e => { if (e.key in keys) keys[e.key] = true; });
window.addEventListener("keyup", e => { if (e.key in keys) keys[e.key] = false; });

// Mouse wheel controls rotation
window.addEventListener("wheel", e => {
  rotationAngle += e.deltaY * -0.05;
  if (rotationAngle < 10) rotationAngle = 10;
  if (rotationAngle > 45) rotationAngle = 45;

  if (dragonfly.carrying !== null && Math.round(rotationAngle) !== 28) {
    let stone = stones[dragonfly.carrying];
    stone.taken = false;
    dragonfly.carrying = null;

    stone.x = dragonfly.x + dragonfly.width / 2;
    stone.y = dragonfly.y + dragonfly.height / 2;
    stone.vy = 0;

    if (
      stone.x > bucket.x &&
      stone.x < bucket.x + bucket.width &&
      stone.y > bucket.y &&
      stone.y < bucket.y + bucket.height
    ) {
      score++;
      stones.splice(stones.indexOf(stone), 1);
    }
  }
});

// Drawing functions
function drawBackground() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
}

function drawDragonfly() {
  if (dragonfly.dead) return;
  ctx.save();
  ctx.translate(dragonfly.x + dragonfly.width / 2, dragonfly.y + dragonfly.height / 2);
  if (facingLeft) ctx.scale(-1, 1);
  ctx.rotate((rotationAngle * Math.PI) / 180);
  ctx.translate(-dragonfly.width / 2, -dragonfly.height / 2);
  ctx.drawImage(dragonflyImg, 0, 0, dragonfly.width, dragonfly.height);
  ctx.restore();
}

function drawStone(stone) {
  ctx.drawImage(stoneImg, stone.x - stone.size, stone.y - stone.size, stone.size * 2, stone.size * 2);
}

function drawBucket() {
  ctx.drawImage(bucketImg, bucket.x, bucket.y, bucket.width, bucket.height);
}

function drawFrog() {
  if (frog.active) {
    // Calculate vertical jump offset using sine wave
    const jumpOffset = Math.sin(jumpTime) * jumpHeight;
    ctx.drawImage(frogImg, frog.x, frog.y + jumpOffset, frog.width, frog.height);
  }
}


// Movement
function moveDragonfly() {
  if (dragonfly.dead) return;
  if (keys.ArrowUp) dragonfly.y -= dragonfly.speed;
  if (keys.ArrowDown) dragonfly.y += dragonfly.speed;
  if (keys.ArrowLeft) { dragonfly.x -= dragonfly.speed; facingLeft = true; }
  if (keys.ArrowRight) { dragonfly.x += dragonfly.speed; facingLeft = false; }
}

function moveFrog() {
  if (!frog.active) return;

  const dx = dragonfly.x - frog.x;
  const dy = dragonfly.y - frog.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 1) {
    frog.x += (dx / dist) * frog.speed;
    frog.y += (dy / dist) * frog.speed;
  }

  if (dist < 60 && !dragonfly.dead) {
    gameOver();
  }
}

// Game mechanics
function checkCollision() {
  stones.forEach((stone, i) => {
    const dx = (dragonfly.x + dragonfly.width / 2) - stone.x;
    const dy = (dragonfly.y + dragonfly.height / 2) - stone.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (
      distance < dragonfly.width / 2 + stone.size &&
      !stone.taken &&
      dragonfly.carrying === null &&
      Math.abs(rotationAngle - 28) <= 5
    ) {
      stone.taken = true;
      dragonfly.carrying = i;
    }
  });
}

function applyPhysics() {
  stones.forEach(stone => {
    if (!stone.taken) {
      stone.vy += stone.gravity;
      stone.y += stone.vy;

      if (stone.y + stone.size > canvas.height) {
        stone.y = canvas.height - stone.size;
        stone.vy *= -stone.bounce;
      }

      if (
        stone.x > bucket.x &&
        stone.x < bucket.x + bucket.width &&
        stone.y > bucket.y &&
        stone.y < bucket.y + bucket.height
      ) {
        score++;
        stones.splice(stones.indexOf(stone), 1);
      }
    } else {
      stone.x = dragonfly.x + dragonfly.width / 2;
      stone.y = dragonfly.y + dragonfly.height / 2;
    }
  });
}


function gameOver() {
    
  dragonfly.dead = true;

  cancelAnimationFrame(animationId);
const modal = document.getElementById("missionFailedModal");
  modal.style.display = "block";
}

// Main loop
let animationId;
function loop() {
      if (dragonfly.dead) return;

  moveDragonfly();
  checkCollision();
  applyPhysics();

  if (stones.length === 0 && !frog.active) {
    frog.active = true;
  }
  moveFrog();

  if (frog.active) {
    jumpTime += jumpSpeed;

    const currentSin = Math.sin(jumpTime);
    if (lastJumpSin < 0 && currentSin >= 0) {
      frogSound.currentTime = 0;
      frogSound.play();
    }
    lastJumpSin = currentSin;
  }

  drawBackground();
  drawDragonfly();
  stones.forEach(drawStone);
  drawBucket();
  drawFrog();

  // Draw scoreboard rectangle
  const padding = 10;
  const rectWidth = 150;
  const rectHeight = 60;
  const rectX = 10;
  const rectY = 10;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Rotation: ${Math.round(rotationAngle)}°`, rectX + padding, rectY + 25);
  ctx.fillText(`Score: ${score}`, rectX + padding, rectY + 50);

  animationId = requestAnimationFrame(loop);
}

spawnStones();
loop();

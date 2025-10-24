const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');

// Game settings (configurable)
let settings = {
  rows: 5,
  cols: 8,
  ballSpeed: 4,
  paddleWidth: 100
};

// Game constants
const PADDLE_HEIGHT = 15;
const BALL_SIZE = 10;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 5;

// Game state
let gameStarted = false;
let score = 0;
let lives = 3;
let paddleX = canvas.width / 2 - settings.paddleWidth / 2;
let ball = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  vx: settings.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
  vy: -settings.ballSpeed
};
let bricks = [];

// Controls
let keys = {};
let touchControls = {
  left: false,
  right: false
};

// References
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('gameContainer');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

// Menu controls
document.getElementById('btnStart').addEventListener('click', () => {
  settings.rows = parseInt(document.getElementById('rowCount').value);
  settings.cols = parseInt(document.getElementById('colCount').value);
  settings.ballSpeed = parseInt(document.getElementById('ballSpeed').value);
  settings.paddleWidth = parseInt(document.getElementById('paddleSize').value);
  startGame();
});

document.getElementById('btnBackToMenu').addEventListener('click', () => {
  backToMenu();
});

// Keyboard controls
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// Touch controls
function setupTouchControls() {
  const leftBtn = document.getElementById('moveLeft');
  const rightBtn = document.getElementById('moveRight');

  leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.left = true;
  });
  leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.left = false;
  });
  
  rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.right = true;
  });
  rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.right = false;
  });

  // Mouse support for testing
  leftBtn.addEventListener('mousedown', () => touchControls.left = true);
  leftBtn.addEventListener('mouseup', () => touchControls.left = false);
  rightBtn.addEventListener('mousedown', () => touchControls.right = true);
  rightBtn.addEventListener('mouseup', () => touchControls.right = false);
}

setupTouchControls();

// Initialize bricks
function createBricks() {
  bricks = [];
  const brickWidth = (canvas.width - (settings.cols + 1) * BRICK_PADDING) / settings.cols;
  
  const colors = ['#f00', '#f80', '#ff0', '#0f0', '#00f', '#80f', '#f0f', '#0ff'];
  
  for (let row = 0; row < settings.rows; row++) {
    for (let col = 0; col < settings.cols; col++) {
      bricks.push({
        x: col * (brickWidth + BRICK_PADDING) + BRICK_PADDING,
        y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_PADDING + 50,
        width: brickWidth,
        height: BRICK_HEIGHT,
        active: true,
        color: colors[row % colors.length]
      });
    }
  }
}

// Start game
function startGame() {
  gameStarted = true;
  score = 0;
  lives = 3;
  paddleX = canvas.width / 2 - settings.paddleWidth / 2;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 50;
  ball.vx = settings.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = -settings.ballSpeed;
  
  createBricks();
  updateScore();
  
  menu.style.display = 'none';
  gameContainer.style.display = 'flex';
  
  loop();
}

// Back to menu
function backToMenu() {
  gameStarted = false;
  gameContainer.style.display = 'none';
  menu.style.display = 'block';
}

// Update score display
function updateScore() {
  scoreElement.textContent = score;
  livesElement.textContent = lives;
}

// Reset ball
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 50;
  ball.vx = settings.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = -settings.ballSpeed;
  paddleX = canvas.width / 2 - settings.paddleWidth / 2;
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw bricks
  bricks.forEach(brick => {
    if (brick.active) {
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    }
  });

  // Draw paddle
  ctx.fillStyle = '#0ff';
  ctx.fillRect(paddleX, canvas.height - 30, settings.paddleWidth, PADDLE_HEIGHT);

  // Draw ball
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
}

// Update game
function update() {
  // Move paddle
  const paddleSpeed = 8;
  if (keys['arrowleft'] || keys['a'] || touchControls.left) {
    paddleX -= paddleSpeed;
  }
  if (keys['arrowright'] || keys['d'] || touchControls.right) {
    paddleX += paddleSpeed;
  }
  paddleX = Math.max(0, Math.min(canvas.width - settings.paddleWidth, paddleX));

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collision
  if (ball.x <= BALL_SIZE / 2 || ball.x >= canvas.width - BALL_SIZE / 2) {
    ball.vx *= -1;
  }
  if (ball.y <= BALL_SIZE / 2) {
    ball.vy *= -1;
  }

  // Paddle collision
  if (
    ball.y + BALL_SIZE / 2 >= canvas.height - 30 &&
    ball.y + BALL_SIZE / 2 <= canvas.height - 30 + PADDLE_HEIGHT &&
    ball.x >= paddleX &&
    ball.x <= paddleX + settings.paddleWidth
  ) {
    ball.vy *= -1;
    // Add spin based on where ball hits paddle
    const hitPos = (ball.x - paddleX) / settings.paddleWidth;
    ball.vx = (hitPos - 0.5) * settings.ballSpeed * 2;
  }

  // Brick collision
  bricks.forEach(brick => {
    if (brick.active &&
        ball.x >= brick.x &&
        ball.x <= brick.x + brick.width &&
        ball.y >= brick.y &&
        ball.y <= brick.y + brick.height) {
      brick.active = false;
      ball.vy *= -1;
      score += 10;
      updateScore();
    }
  });

  // Ball out of bounds
  if (ball.y > canvas.height) {
    lives--;
    updateScore();
    
    if (lives <= 0) {
      alert('¡Game Over! Puntuación final: ' + score);
      backToMenu();
    } else {
      resetBall();
    }
  }

  // Check win condition
  const activeBricks = bricks.filter(b => b.active).length;
  if (activeBricks === 0) {
    alert('¡Felicidades! Has ganado. Puntuación: ' + score);
    backToMenu();
  }
}

// Game loop
function loop() {
  if (!gameStarted) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

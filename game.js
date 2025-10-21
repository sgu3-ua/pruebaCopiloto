const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PLAYER_X = 20;
const AI_X = canvas.width - PADDLE_WIDTH - 20;

// Game state
let playerY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let aiY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let ball = {
  x: canvas.width / 2 - BALL_SIZE / 2,
  y: canvas.height / 2 - BALL_SIZE / 2,
  vx: 6 * (Math.random() > 0.5 ? 1 : -1),
  vy: 3 * (Math.random() > 0.5 ? 1 : -1)
};

// Mouse control for player paddle
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  let mouseY = e.clientY - rect.top;
  playerY = mouseY - PADDLE_HEIGHT / 2;
  // Clamp paddle within bounds
  playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Middle line
  ctx.fillStyle = '#444';
  ctx.fillRect(canvas.width / 2 - 2, 0, 4, canvas.height);

  // Player paddle
  ctx.fillStyle = '#0ff';
  ctx.fillRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

  // AI paddle
  ctx.fillStyle = '#f00';
  ctx.fillRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

  // Ball
  ctx.fillStyle = '#fff';
  ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);
}

// Ball and game logic
function update() {
  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Ball collision with top/bottom
  if (ball.y <= 0 || ball.y + BALL_SIZE >= canvas.height) {
    ball.vy *= -1;
  }

  // Ball collision with player paddle
  if (
    ball.x <= PLAYER_X + PADDLE_WIDTH &&
    ball.y + BALL_SIZE >= playerY &&
    ball.y <= playerY + PADDLE_HEIGHT
  ) {
    ball.vx *= -1;
    ball.x = PLAYER_X + PADDLE_WIDTH; // prevent sticking
  }

  // Ball collision with AI paddle
  if (
    ball.x + BALL_SIZE >= AI_X &&
    ball.y + BALL_SIZE >= aiY &&
    ball.y <= aiY + PADDLE_HEIGHT
  ) {
    ball.vx *= -1;
    ball.x = AI_X - BALL_SIZE; // prevent sticking
  }

  // Ball out of bounds (reset)
  if (ball.x < 0 || ball.x > canvas.width) {
    ball.x = canvas.width / 2 - BALL_SIZE / 2;
    ball.y = canvas.height / 2 - BALL_SIZE / 2;
    ball.vx = 6 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
  }

  // Simple AI: move toward ball center
  let aiCenter = aiY + PADDLE_HEIGHT / 2;
  let ballCenter = ball.y + BALL_SIZE / 2;
  if (aiCenter < ballCenter - 10) {
    aiY += 4;
  } else if (aiCenter > ballCenter + 10) {
    aiY -= 4;
  }
  // Clamp AI paddle
  aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

// Main loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

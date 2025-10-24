const canvas = document.getElementById('snake');
const ctx = canvas.getContext('2d');

// Game settings (configurable)
let settings = {
  gridSize: 20,
  speed: 150,
  walls: true
};

// Game constants
let cellSize;

// Game state
let gameStarted = false;
let score = 0;
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let gameLoop = null;

// References
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('gameContainer');
const scoreElement = document.getElementById('score');

// Menu controls
document.getElementById('btnStart').addEventListener('click', () => {
  settings.speed = parseInt(document.getElementById('speed').value);
  settings.gridSize = parseInt(document.getElementById('boardSize').value);
  settings.walls = document.getElementById('walls').checked;
  startGame();
});

document.getElementById('btnBackToMenu').addEventListener('click', () => {
  backToMenu();
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (direction.y === 0) nextDirection = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      if (direction.y === 0) nextDirection = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (direction.x === 0) nextDirection = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (direction.x === 0) nextDirection = { x: 1, y: 0 };
      break;
  }
});

// Touch controls
document.getElementById('upBtn').addEventListener('click', () => {
  if (direction.y === 0) nextDirection = { x: 0, y: -1 };
});
document.getElementById('downBtn').addEventListener('click', () => {
  if (direction.y === 0) nextDirection = { x: 0, y: 1 };
});
document.getElementById('leftBtn').addEventListener('click', () => {
  if (direction.x === 0) nextDirection = { x: -1, y: 0 };
});
document.getElementById('rightBtn').addEventListener('click', () => {
  if (direction.x === 0) nextDirection = { x: 1, y: 0 };
});

// Initialize snake
function initSnake() {
  const startX = Math.floor(settings.gridSize / 2);
  const startY = Math.floor(settings.gridSize / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
}

// Generate food
function generateFood() {
  let validPosition = false;
  while (!validPosition) {
    food.x = Math.floor(Math.random() * settings.gridSize);
    food.y = Math.floor(Math.random() * settings.gridSize);
    validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid (optional)
  ctx.strokeStyle = '#333';
  for (let i = 0; i <= settings.gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }

  // Draw snake
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#0f0' : '#0a0';
    ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
  });

  // Draw food
  ctx.fillStyle = '#f00';
  ctx.fillRect(food.x * cellSize + 1, food.y * cellSize + 1, cellSize - 2, cellSize - 2);
}

// Update game
function update() {
  direction = nextDirection;

  // Move snake
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Check walls
  if (settings.walls) {
    if (head.x < 0 || head.x >= settings.gridSize || head.y < 0 || head.y >= settings.gridSize) {
      gameOver();
      return;
    }
  } else {
    // Wrap around
    if (head.x < 0) head.x = settings.gridSize - 1;
    if (head.x >= settings.gridSize) head.x = 0;
    if (head.y < 0) head.y = settings.gridSize - 1;
    if (head.y >= settings.gridSize) head.y = 0;
  }

  // Check self collision
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Check food
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreElement.textContent = score;
    generateFood();
  } else {
    snake.pop();
  }

  draw();
}

// Game over
function gameOver() {
  clearInterval(gameLoop);
  setTimeout(() => {
    alert(`¡Game Over! Puntuación final: ${score}`);
    backToMenu();
  }, 100);
}

// Start game
function startGame() {
  gameStarted = true;
  score = 0;
  scoreElement.textContent = score;
  
  cellSize = canvas.width / settings.gridSize;
  
  initSnake();
  generateFood();
  draw();
  
  menu.style.display = 'none';
  gameContainer.style.display = 'flex';
  
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(update, settings.speed);
}

// Back to menu
function backToMenu() {
  gameStarted = false;
  if (gameLoop) clearInterval(gameLoop);
  gameContainer.style.display = 'none';
  menu.style.display = 'block';
}

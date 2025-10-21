const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Constantes
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PLAYER_X = 20;
const RIGHT_X = canvas.width - PADDLE_WIDTH - 20;
const PADDLE_SPEED = 7;
const AI_SPEED = 5; // IA es un poco más lenta

// Estado de juego
let gameMode = null; // '1player' o '2player'
let gameStarted = false;
let leftY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let rightY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let leftScore = 0;
let rightScore = 0;
let ball = {
  x: canvas.width / 2 - BALL_SIZE / 2,
  y: canvas.height / 2 - BALL_SIZE / 2,
  vx: 6 * (Math.random() > 0.5 ? 1 : -1),
  vy: 3 * (Math.random() > 0.5 ? 1 : -1)
};

// Teclas presionadas
let keys = {};

// Referencias a elementos DOM
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('gameContainer');
const leftScoreElement = document.getElementById('leftScore');
const rightScoreElement = document.getElementById('rightScore');

// Botones del menú
document.getElementById('btn1Player').addEventListener('click', () => {
  startGame('1player');
});

document.getElementById('btn2Players').addEventListener('click', () => {
  startGame('2player');
});

document.getElementById('btnBackToMenu').addEventListener('click', () => {
  backToMenu();
});

// Eventos de teclado
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// Inicia el juego
function startGame(mode) {
  gameMode = mode;
  gameStarted = true;
  leftScore = 0;
  rightScore = 0;
  updateScore();
  menu.style.display = 'none';
  gameContainer.style.display = 'flex';
  resetBall();
  loop();
}

// Vuelve al menú principal
function backToMenu() {
  gameStarted = false;
  gameMode = null;
  leftScore = 0;
  rightScore = 0;
  leftY = canvas.height / 2 - PADDLE_HEIGHT / 2;
  rightY = canvas.height / 2 - PADDLE_HEIGHT / 2;
  gameContainer.style.display = 'none';
  menu.style.display = 'block';
}

// Resetea la pelota
function resetBall() {
  ball.x = canvas.width / 2 - BALL_SIZE / 2;
  ball.y = canvas.height / 2 - BALL_SIZE / 2;
  ball.vx = 6 * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
}

// IA para la pala derecha
function updateAI() {
  const ballCenterY = ball.y + BALL_SIZE / 2;
  const paddleCenterY = rightY + PADDLE_HEIGHT / 2;
  
  // Solo sigue la pelota si viene hacia la IA
  if (ball.vx > 0) {
    if (ballCenterY < paddleCenterY - 10) {
      rightY -= AI_SPEED;
    } else if (ballCenterY > paddleCenterY + 10) {
      rightY += AI_SPEED;
    }
  }
  
  rightY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightY));
}

// Actualiza marcador
function updateScore() {
  leftScoreElement.textContent = leftScore;
  rightScoreElement.textContent = rightScore;
}

// Dibuja todo
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Línea central
  ctx.fillStyle = '#444';
  ctx.fillRect(canvas.width / 2 - 2, 0, 4, canvas.height);

  // Palas
  ctx.fillStyle = '#0ff';
  ctx.fillRect(PLAYER_X, leftY, PADDLE_WIDTH, PADDLE_HEIGHT);

  ctx.fillStyle = '#f00';
  ctx.fillRect(RIGHT_X, rightY, PADDLE_WIDTH, PADDLE_HEIGHT);

  // Pelota
  ctx.fillStyle = '#fff';
  ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);
}

// Actualiza el juego
function update() {
  // Movimiento pala izquierda (W/S)
  if (keys['w']) leftY -= PADDLE_SPEED;
  if (keys['s']) leftY += PADDLE_SPEED;
  leftY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, leftY));

  // Movimiento pala derecha
  if (gameMode === '2player') {
    // En modo 2 jugadores, flechas controlan la pala derecha
    if (keys['arrowup']) rightY -= PADDLE_SPEED;
    if (keys['arrowdown']) rightY += PADDLE_SPEED;
    rightY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightY));
  } else if (gameMode === '1player') {
    // En modo 1 jugador, la IA controla la pala derecha
    updateAI();
  }

  // Mueve pelota
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Rebote arriba/abajo
  if (ball.y <= 0 || ball.y + BALL_SIZE >= canvas.height) {
    ball.vy *= -1;
  }

  // Colisión pala izquierda
  if (
    ball.x <= PLAYER_X + PADDLE_WIDTH &&
    ball.y + BALL_SIZE >= leftY &&
    ball.y <= leftY + PADDLE_HEIGHT
  ) {
    ball.vx *= -1;
    ball.x = PLAYER_X + PADDLE_WIDTH;
  }

  // Colisión pala derecha
  if (
    ball.x + BALL_SIZE >= RIGHT_X &&
    ball.y + BALL_SIZE >= rightY &&
    ball.y <= rightY + PADDLE_HEIGHT
  ) {
    ball.vx *= -1;
    ball.x = RIGHT_X - BALL_SIZE;
  }

  // Pelota fuera - actualiza marcador
  if (ball.x < 0) {
    // Salió por la izquierda, punto para el jugador derecho
    rightScore++;
    updateScore();
    resetBall();
  } else if (ball.x > canvas.width) {
    // Salió por la derecha, punto para el jugador izquierdo
    leftScore++;
    updateScore();
    resetBall();
  }
}

// Bucle principal
function loop() {
  if (!gameStarted) return;
  update();
  draw();
  requestAnimationFrame(loop);
}


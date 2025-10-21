const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Constantes
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PLAYER_X = 20;
const RIGHT_X = canvas.width - PADDLE_WIDTH - 20;
const PADDLE_SPEED = 7;

// Estado de juego
let leftY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let rightY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let ball = {
  x: canvas.width / 2 - BALL_SIZE / 2,
  y: canvas.height / 2 - BALL_SIZE / 2,
  vx: 6 * (Math.random() > 0.5 ? 1 : -1),
  vy: 3 * (Math.random() > 0.5 ? 1 : -1)
};

// Teclas presionadas
let keys = {};

// Eventos de teclado
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

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
  // Movimiento palas izquierda (W/S)
  if (keys['w']) leftY -= PADDLE_SPEED;
  if (keys['s']) leftY += PADDLE_SPEED;
  leftY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, leftY));

  // Movimiento palas derecha (Flechas)
  if (keys['arrowup']) rightY -= PADDLE_SPEED;
  if (keys['arrowdown']) rightY += PADDLE_SPEED;
  rightY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightY));

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

  // Pelota fuera, reinicia
  if (ball.x < 0 || ball.x > canvas.width) {
    ball.x = canvas.width / 2 - BALL_SIZE / 2;
    ball.y = canvas.height / 2 - BALL_SIZE / 2;
    ball.vx = 6 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
  }
}

// Bucle principal
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Constantes
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PLAYER_X = 20;
const RIGHT_X = canvas.width - PADDLE_WIDTH - 20;
const PADDLE_SPEED = 7;
const BASE_AI_SPEED = 5;
const BASE_BALL_SPEED = 6;
const SPEED_INCREMENT = 0.3; // Incremento de velocidad tras cada gol en modo IA

// Estado de juego
let gameMode = null; // '1player', '2player', 'online-host', 'online-guest'
let gameStarted = false;
let leftY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let rightY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let leftScore = 0;
let rightScore = 0;
let currentBallSpeed = BASE_BALL_SPEED;
let currentPaddleSpeed = PADDLE_SPEED;
let currentAISpeed = BASE_AI_SPEED;
let aiReactionDelay = 0; // Para hacer la IA imperfecta
let ball = {
  x: canvas.width / 2 - BALL_SIZE / 2,
  y: canvas.height / 2 - BALL_SIZE / 2,
  vx: BASE_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
  vy: 3 * (Math.random() > 0.5 ? 1 : -1)
};

// Variables para multijugador en línea
let peer = null;
let connection = null;
let isHost = false;
let sessionId = null;

// Teclas presionadas
let keys = {};

// Estado de controles táctiles
let touchControls = {
  leftUp: false,
  leftDown: false,
  rightUp: false,
  rightDown: false
};

// Referencias a elementos DOM
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('gameContainer');
const leftScoreElement = document.getElementById('leftScore');
const rightScoreElement = document.getElementById('rightScore');
const onlineSetup = document.getElementById('onlineSetup');
const hostSetup = document.getElementById('hostSetup');
const joinSetup = document.getElementById('joinSetup');
const sessionCodeDisplay = document.getElementById('sessionCode');
const sessionCodeInput = document.getElementById('sessionCodeInput');
const connectionStatus = document.getElementById('connectionStatus');

// Botones del menú
document.getElementById('btn1Player').addEventListener('click', () => {
  startGame('1player');
});

document.getElementById('btn2Players').addEventListener('click', () => {
  startGame('2player');
});

document.getElementById('btnOnlineHost').addEventListener('click', () => {
  showOnlineSetup('host');
});

document.getElementById('btnOnlineJoin').addEventListener('click', () => {
  showOnlineSetup('join');
});

document.getElementById('btnConnect').addEventListener('click', () => {
  const code = sessionCodeInput.value.trim().toUpperCase();
  if (code) {
    connectToSession(code);
  }
});

document.getElementById('btnCancelOnline').addEventListener('click', () => {
  cancelOnlineSetup();
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

// Eventos táctiles para controles móviles
function setupTouchControls() {
  const leftUpBtn = document.getElementById('leftUp');
  const leftDownBtn = document.getElementById('leftDown');
  const rightUpBtn = document.getElementById('rightUp');
  const rightDownBtn = document.getElementById('rightDown');

  // Controles izquierdos
  leftUpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.leftUp = true;
  });
  leftUpBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.leftUp = false;
  });
  leftDownBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.leftDown = true;
  });
  leftDownBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.leftDown = false;
  });

  // Controles derechos
  rightUpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.rightUp = true;
  });
  rightUpBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.rightUp = false;
  });
  rightDownBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.rightDown = true;
  });
  rightDownBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.rightDown = false;
  });

  // También soportar clics de mouse para testing
  leftUpBtn.addEventListener('mousedown', () => touchControls.leftUp = true);
  leftUpBtn.addEventListener('mouseup', () => touchControls.leftUp = false);
  leftDownBtn.addEventListener('mousedown', () => touchControls.leftDown = true);
  leftDownBtn.addEventListener('mouseup', () => touchControls.leftDown = false);
  rightUpBtn.addEventListener('mousedown', () => touchControls.rightUp = true);
  rightUpBtn.addEventListener('mouseup', () => touchControls.rightUp = false);
  rightDownBtn.addEventListener('mousedown', () => touchControls.rightDown = true);
  rightDownBtn.addEventListener('mouseup', () => touchControls.rightDown = false);
}

setupTouchControls();

// Funciones de multijugador en línea
function showOnlineSetup(type) {
  menu.style.display = 'none';
  onlineSetup.style.display = 'block';
  
  if (type === 'host') {
    document.getElementById('setupTitle').textContent = 'Crear Partida en Línea';
    hostSetup.style.display = 'block';
    joinSetup.style.display = 'none';
    createSession();
  } else {
    document.getElementById('setupTitle').textContent = 'Unirse a Partida';
    hostSetup.style.display = 'none';
    joinSetup.style.display = 'block';
    sessionCodeInput.value = '';
    connectionStatus.textContent = '';
  }
}

function generateSessionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function createSession() {
  sessionId = generateSessionCode();
  sessionCodeDisplay.textContent = sessionId;
  
  // Crear peer con el código de sesión
  peer = new Peer('pong-' + sessionId, {
    debug: 0
  });
  
  peer.on('open', (id) => {
    console.log('Sesión creada:', id);
    isHost = true;
  });
  
  peer.on('connection', (conn) => {
    connection = conn;
    setupConnection();
    document.getElementById('waitingMessage').textContent = '¡Oponente conectado!';
    setTimeout(() => {
      startGame('online-host');
    }, 1000);
  });
  
  peer.on('error', (err) => {
    console.error('Error en peer:', err);
    alert('Error al crear la sesión. Intenta de nuevo.');
    cancelOnlineSetup();
  });
}

function connectToSession(code) {
  connectionStatus.textContent = 'Conectando...';
  
  peer = new Peer({
    debug: 0
  });
  
  peer.on('open', () => {
    connection = peer.connect('pong-' + code);
    setupConnection();
    
    connection.on('open', () => {
      connectionStatus.textContent = '¡Conectado!';
      isHost = false;
      setTimeout(() => {
        startGame('online-guest');
      }, 1000);
    });
  });
  
  peer.on('error', (err) => {
    console.error('Error al conectar:', err);
    connectionStatus.textContent = 'Error: No se pudo conectar. Verifica el código.';
  });
}

function setupConnection() {
  connection.on('data', (data) => {
    handleRemoteData(data);
  });
  
  connection.on('close', () => {
    alert('La conexión se ha perdido.');
    backToMenu();
  });
}

function handleRemoteData(data) {
  if (data.type === 'paddle') {
    // Actualizar posición de la pala del oponente
    if (isHost) {
      rightY = data.y;
    } else {
      leftY = data.y;
    }
  } else if (data.type === 'ball' && !isHost) {
    // El invitado reconcilia su pelota local con la del host (autoridad)
    // Interpolación suave para evitar saltos bruscos
    const lerpFactor = 0.3; // Factor de interpolación (0 = local, 1 = host)
    ball.x = ball.x + (data.x - ball.x) * lerpFactor;
    ball.y = ball.y + (data.y - ball.y) * lerpFactor;
    ball.vx = data.vx;
    ball.vy = data.vy;
  } else if (data.type === 'score') {
    leftScore = data.left;
    rightScore = data.right;
    updateScore();
  }
}

function sendPaddlePosition(y) {
  if (connection && connection.open) {
    connection.send({
      type: 'paddle',
      y: y
    });
  }
}

function sendBallState() {
  if (connection && connection.open && isHost) {
    connection.send({
      type: 'ball',
      x: ball.x,
      y: ball.y,
      vx: ball.vx,
      vy: ball.vy
    });
  }
}

function sendScore() {
  if (connection && connection.open && isHost) {
    connection.send({
      type: 'score',
      left: leftScore,
      right: rightScore
    });
  }
}

function cancelOnlineSetup() {
  if (peer) {
    peer.destroy();
    peer = null;
  }
  if (connection) {
    connection.close();
    connection = null;
  }
  onlineSetup.style.display = 'none';
  menu.style.display = 'block';
}

// Inicia el juego
function startGame(mode) {
  gameMode = mode;
  gameStarted = true;
  leftScore = 0;
  rightScore = 0;
  currentBallSpeed = BASE_BALL_SPEED;
  currentPaddleSpeed = PADDLE_SPEED;
  currentAISpeed = BASE_AI_SPEED;
  updateScore();
  menu.style.display = 'none';
  onlineSetup.style.display = 'none';
  gameContainer.style.display = 'flex';
  
  // Mostrar/ocultar controles derechos según el modo
  const rightControls = document.getElementById('rightControls');
  if (mode === '1player' || mode === 'online-host') {
    rightControls.style.display = 'none';
  } else {
    rightControls.style.display = 'flex';
  }
  
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
  currentBallSpeed = BASE_BALL_SPEED;
  currentPaddleSpeed = PADDLE_SPEED;
  currentAISpeed = BASE_AI_SPEED;
  
  // Cerrar conexiones P2P si existen
  if (connection) {
    connection.close();
    connection = null;
  }
  if (peer) {
    peer.destroy();
    peer = null;
  }
  
  gameContainer.style.display = 'none';
  menu.style.display = 'block';
}

// Resetea la pelota
function resetBall() {
  ball.x = canvas.width / 2 - BALL_SIZE / 2;
  ball.y = canvas.height / 2 - BALL_SIZE / 2;
  ball.vx = currentBallSpeed * (Math.random() > 0.5 ? 1 : -1);
  ball.vy = (currentBallSpeed / 2) * (Math.random() > 0.5 ? 1 : -1);
}

// Incrementa la dificultad en modo IA
function increaseDifficulty() {
  if (gameMode === '1player') {
    currentBallSpeed += SPEED_INCREMENT;
    currentPaddleSpeed += SPEED_INCREMENT * 0.5;
    currentAISpeed += SPEED_INCREMENT * 0.4;
  }
}

// IA para la pala derecha (imperfecta)
function updateAI() {
  const ballCenterY = ball.y + BALL_SIZE / 2;
  const paddleCenterY = rightY + PADDLE_HEIGHT / 2;
  
  // Agregar retraso en la reacción para hacer la IA imperfecta
  if (aiReactionDelay > 0) {
    aiReactionDelay--;
    return;
  }
  
  // Solo sigue la pelota si viene hacia la IA
  if (ball.vx > 0) {
    // Agregar error aleatorio a la predicción de la IA (20% de probabilidad de error)
    let targetY = ballCenterY;
    if (Math.random() < 0.2) {
      targetY += (Math.random() - 0.5) * 100; // Error aleatorio
      aiReactionDelay = Math.floor(Math.random() * 5) + 3; // Retraso aleatorio de 3-7 frames
    }
    
    if (targetY < paddleCenterY - 15) {
      rightY -= currentAISpeed;
    } else if (targetY > paddleCenterY + 15) {
      rightY += currentAISpeed;
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
  // Movimiento pala izquierda (W/S o controles táctiles)
  const prevLeftY = leftY;
  if (keys['w'] || touchControls.leftUp) leftY -= currentPaddleSpeed;
  if (keys['s'] || touchControls.leftDown) leftY += currentPaddleSpeed;
  leftY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, leftY));
  
  // Enviar posición de la pala en modo online
  if (gameMode === 'online-host' && prevLeftY !== leftY) {
    sendPaddlePosition(leftY);
  }

  // Movimiento pala derecha
  const prevRightY = rightY;
  if (gameMode === '2player') {
    // En modo 2 jugadores, flechas o controles táctiles controlan la pala derecha
    if (keys['arrowup'] || touchControls.rightUp) rightY -= currentPaddleSpeed;
    if (keys['arrowdown'] || touchControls.rightDown) rightY += currentPaddleSpeed;
    rightY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightY));
  } else if (gameMode === '1player') {
    // En modo 1 jugador, la IA controla la pala derecha
    updateAI();
  } else if (gameMode === 'online-guest') {
    // En modo online como invitado, enviar posición de la pala derecha
    if (keys['arrowup'] || touchControls.rightUp) rightY -= currentPaddleSpeed;
    if (keys['arrowdown'] || touchControls.rightDown) rightY += currentPaddleSpeed;
    rightY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightY));
    if (prevRightY !== rightY) {
      sendPaddlePosition(rightY);
    }
  }

  // Física de la pelota
  if (gameMode === 'online-guest') {
    // El invitado también simula la física localmente para mejor respuesta
    // pero el host sigue siendo la autoridad y corregirá desviaciones
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Rebote arriba/abajo
    if (ball.y <= 0 || ball.y + BALL_SIZE >= canvas.height) {
      ball.vy *= -1;
    }

    // Colisión pala izquierda (del host)
    if (
      ball.x <= PLAYER_X + PADDLE_WIDTH &&
      ball.y + BALL_SIZE >= leftY &&
      ball.y <= leftY + PADDLE_HEIGHT
    ) {
      ball.vx *= -1;
      ball.x = PLAYER_X + PADDLE_WIDTH;
    }

    // Colisión pala derecha (del invitado)
    if (
      ball.x + BALL_SIZE >= RIGHT_X &&
      ball.y + BALL_SIZE >= rightY &&
      ball.y <= rightY + PADDLE_HEIGHT
    ) {
      ball.vx *= -1;
      ball.x = RIGHT_X - BALL_SIZE;
    }
  } else if (gameMode !== 'online-guest') {
    // Host y modos locales calculan la física normalmente
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

    // Pelota fuera - actualiza marcador (solo host en modo online)
    if (ball.x < 0) {
      // Salió por la izquierda, punto para el jugador derecho
      rightScore++;
      updateScore();
      increaseDifficulty(); // Incrementar dificultad en modo IA
      resetBall();
      if (gameMode === 'online-host') {
        sendScore();
      }
    } else if (ball.x > canvas.width) {
      // Salió por la derecha, punto para el jugador izquierdo
      leftScore++;
      updateScore();
      increaseDifficulty(); // Incrementar dificultad en modo IA
      resetBall();
      if (gameMode === 'online-host') {
        sendScore();
      }
    }
    
    // Enviar estado de la pelota en modo online (host)
    if (gameMode === 'online-host') {
      sendBallState();
    }
  }
}

// Bucle principal
function loop() {
  if (!gameStarted) return;
  update();
  draw();
  requestAnimationFrame(loop);
}


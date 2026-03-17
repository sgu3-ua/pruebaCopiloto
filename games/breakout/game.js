const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');

// ── Settings ────────────────────────────────────────────────────────────────
let settings = {
  rows: 5,
  cols: 8,
  ballSpeed: 4,
  paddleWidth: 100,
  powerMode: false
};

// ── Constants ───────────────────────────────────────────────────────────────
const PADDLE_HEIGHT = 15;
const BALL_RADIUS   = 5;
const BRICK_HEIGHT  = 20;
const BRICK_PADDING = 5;

// Power-up types
const PU_TYPES = ['MULTI_BALL','WIDE_PADDLE','SLOW_BALL','EXTRA_LIFE','FIREBALL','LASER'];
const PU_INFO = {
  MULTI_BALL:  { label: '+BOLAS',  color: '#f0f', textColor: '#fff' },
  WIDE_PADDLE: { label: 'PALETA',  color: '#0f0', textColor: '#000' },
  SLOW_BALL:   { label: 'LENTO',   color: '#0ff', textColor: '#000' },
  EXTRA_LIFE:  { label: 'VIDA',    color: '#f00', textColor: '#fff' },
  FIREBALL:    { label: 'FUEGO',   color: '#f80', textColor: '#000' },
  LASER:       { label: 'LASER',   color: '#ff0', textColor: '#000' }
};
const PU_W = 70, PU_H = 20, PU_SPEED = 2.5;

// ── Game state ───────────────────────────────────────────────────────────────
let gameStarted = false;
let score       = 0;
let lives       = 3;
let paddleX     = canvas.width / 2 - settings.paddleWidth / 2;
let paddleW     = settings.paddleWidth;
let balls       = [];
let bricks      = [];
let powerups    = [];
let lasers      = [];
let frameCount  = 0;
let activePU    = { WIDE_PADDLE: 0, SLOW_BALL: 0, FIREBALL: 0, LASER: 0 };
let hudMessages = [];

// Controls
let keys          = {};
let touchControls = { left: false, right: false };

// DOM
const menu          = document.getElementById('menu');
const gameContainer = document.getElementById('gameContainer');
const scoreElement  = document.getElementById('score');
const livesElement  = document.getElementById('lives');

// ── Menu ─────────────────────────────────────────────────────────────────────
document.getElementById('btnStart').addEventListener('click', () => {
  settings.rows        = parseInt(document.getElementById('rowCount').value);
  settings.cols        = parseInt(document.getElementById('colCount').value);
  settings.ballSpeed   = parseFloat(document.getElementById('ballSpeed').value);
  settings.paddleWidth = parseInt(document.getElementById('paddleSize').value);
  settings.powerMode   = document.getElementById('powerMode').checked;
  startGame();
});

document.getElementById('btnBackToMenu').addEventListener('click', backToMenu);

// ── Keyboard ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if ((e.key === ' ' || e.key.toLowerCase() === 'f') && gameStarted) fireLaser();
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// ── Touch ─────────────────────────────────────────────────────────────────────
function setupTouchControls() {
  const leftBtn  = document.getElementById('moveLeft');
  const rightBtn = document.getElementById('moveRight');
  const fireBtn  = document.getElementById('fireBtn');

  const bind = (btn, prop) => {
    if (!btn) return;
    btn.addEventListener('touchstart', e => { e.preventDefault(); touchControls[prop] = true; });
    btn.addEventListener('touchend',   e => { e.preventDefault(); touchControls[prop] = false; });
    btn.addEventListener('mousedown',  () => touchControls[prop] = true);
    btn.addEventListener('mouseup',    () => touchControls[prop] = false);
  };
  bind(leftBtn,  'left');
  bind(rightBtn, 'right');
  if (fireBtn) {
    fireBtn.addEventListener('touchstart', e => { e.preventDefault(); fireLaser(); });
    fireBtn.addEventListener('mousedown',  () => fireLaser());
  }
}
setupTouchControls();

// ── Brick colours (darken when damaged) ──────────────────────────────────────
const ROW_PALETTE = ['#f00','#f80','#ff0','#8f0','#0f0','#0ff','#00f','#80f','#f0f'];

function damagedColor(base, hp, maxHp) {
  if (hp >= maxHp) return base;
  const f   = 0.35 + 0.65 * (hp / maxHp);
  const hex = parseInt(base.slice(1), 16);
  const r   = Math.round(((hex >> 16) & 255) * f);
  const g   = Math.round(((hex >>  8) & 255) * f);
  const b   = Math.round(( hex        & 255) * f);
  return `rgb(${r},${g},${b})`;
}

function createBricks() {
  bricks = [];
  const bw = (canvas.width - (settings.cols + 1) * BRICK_PADDING) / settings.cols;
  for (let row = 0; row < settings.rows; row++) {
    const base  = ROW_PALETTE[row % ROW_PALETTE.length];
    // Power mode: top rows harder (more hp), bottom rows easiest
    const maxHp = settings.powerMode
      ? Math.max(1, settings.rows - row)   // row 0 = most hp
      : 1;
    for (let col = 0; col < settings.cols; col++) {
      bricks.push({
        x: col * (bw + BRICK_PADDING) + BRICK_PADDING,
        y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_PADDING + 50,
        width: bw,
        height: BRICK_HEIGHT,
        active: true,
        base,
        hp: maxHp,
        maxHp
      });
    }
  }
}

// ── Ball factory ──────────────────────────────────────────────────────────────
function makeBall(speed) {
  const angle = (Math.random() * 50 - 25) * Math.PI / 180;
  return {
    x: canvas.width / 2,
    y: canvas.height - 50,
    vx: Math.sin(angle) * speed,
    vy: -Math.cos(angle) * speed,
    fireball: false
  };
}

function currentSpeed() {
  // Auto-accelerate in power mode: +1% per 10 s (600 frames @ 60 fps)
  if (!settings.powerMode) return settings.ballSpeed;
  return settings.ballSpeed * (1 + Math.floor(frameCount / 600) * 0.01);
}

// ── Power-up helpers ──────────────────────────────────────────────────────────
function spawnPowerup(cx, y) {
  const type = PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)];
  powerups.push({ x: cx - PU_W / 2, y, type, active: true });
}

function applyPowerup(type) {
  const FPS = 60;
  switch (type) {
    case 'MULTI_BALL':
      for (let i = 0; i < 2; i++) balls.push(makeBall(currentSpeed()));
      addMsg('+2 BOLAS', '#f0f');
      break;
    case 'WIDE_PADDLE':
      activePU.WIDE_PADDLE = 15 * FPS;
      addMsg('SUPER PALETA', '#0f0');
      break;
    case 'SLOW_BALL':
      activePU.SLOW_BALL = 10 * FPS;
      addMsg('BOLAS LENTAS', '#0ff');
      break;
    case 'EXTRA_LIFE':
      lives++;
      updateScore();
      addMsg('VIDA EXTRA ♥', '#f00');
      break;
    case 'FIREBALL':
      activePU.FIREBALL = 8 * FPS;
      balls.forEach(b => b.fireball = true);
      addMsg('BOLA DE FUEGO', '#f80');
      break;
    case 'LASER':
      activePU.LASER = 10 * FPS;
      addMsg('LASER (F/Space)', '#ff0');
      break;
  }
}

function addMsg(text, color) {
  hudMessages.push({ text, color, frames: 150 });
}

// ── Laser fire ────────────────────────────────────────────────────────────────
function fireLaser() {
  if (!gameStarted || !settings.powerMode || activePU.LASER <= 0) return;
  lasers.push({ x: paddleX + paddleW * 0.3, y: canvas.height - 32, vy: -12 });
  lasers.push({ x: paddleX + paddleW * 0.7, y: canvas.height - 32, vy: -12 });
}

// ── Start / back ──────────────────────────────────────────────────────────────
function startGame() {
  gameStarted = true;
  score       = 0;
  lives       = 3;
  frameCount  = 0;
  paddleX     = canvas.width / 2 - settings.paddleWidth / 2;
  paddleW     = settings.paddleWidth;
  balls       = [makeBall(settings.ballSpeed)];
  powerups    = [];
  lasers      = [];
  hudMessages = [];
  activePU    = { WIDE_PADDLE: 0, SLOW_BALL: 0, FIREBALL: 0, LASER: 0 };

  createBricks();
  updateScore();

  menu.style.display          = 'none';
  gameContainer.style.display = 'flex';

  const fireBtn = document.getElementById('fireBtn');
  if (fireBtn) fireBtn.style.display = settings.powerMode ? 'inline-flex' : 'none';

  loop();
}

function backToMenu() {
  gameStarted = false;
  gameContainer.style.display = 'none';
  menu.style.display          = 'block';
}

function updateScore() {
  scoreElement.textContent = score;
  livesElement.textContent = lives;
}

function resetBall() {
  balls   = [makeBall(settings.ballSpeed)];
  paddleX = canvas.width / 2 - settings.paddleWidth / 2;
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bricks
  bricks.forEach(b => {
    if (!b.active) return;
    ctx.fillStyle   = damagedColor(b.base, b.hp, b.maxHp);
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth   = 1;
    ctx.strokeRect(b.x, b.y, b.width, b.height);
    // HP pips for multi-hp bricks
    if (b.maxHp > 1) {
      for (let i = 0; i < b.hp; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(b.x + 4 + i * 7, b.y + 7, 5, 5);
      }
    }
  });

  // Falling power-ups
  powerups.forEach(pu => {
    if (!pu.active) return;
    const info = PU_INFO[pu.type];
    ctx.fillStyle   = info.color;
    ctx.fillRect(pu.x, pu.y, PU_W, PU_H);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(pu.x, pu.y, PU_W, PU_H);
    ctx.fillStyle = info.textColor;
    ctx.font      = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(info.label, pu.x + PU_W / 2, pu.y + 14);
    ctx.textAlign = 'left';
  });

  // Lasers
  lasers.forEach(l => {
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = '#ff0';
    ctx.fillRect(l.x - 2, l.y - 10, 4, 12);
    ctx.shadowBlur  = 0;
  });

  // Paddle
  paddleW = (settings.powerMode && activePU.WIDE_PADDLE > 0)
    ? settings.paddleWidth * 2
    : settings.paddleWidth;
  // Clamp paddle to canvas
  paddleX = Math.max(0, Math.min(canvas.width - paddleW, paddleX));

  const paddleColor = (settings.powerMode && activePU.LASER > 0)       ? '#ff0' :
                      (settings.powerMode && activePU.WIDE_PADDLE > 0)  ? '#0f0' : '#0ff';
  ctx.shadowColor = paddleColor;
  ctx.shadowBlur  = 12;
  ctx.fillStyle   = paddleColor;
  ctx.fillRect(paddleX, canvas.height - 30, paddleW, PADDLE_HEIGHT);
  ctx.shadowBlur  = 0;

  // Balls
  balls.forEach(ball => {
    ctx.shadowColor = ball.fireball ? '#f80' : '#8ff';
    ctx.shadowBlur  = ball.fireball ? 18 : 8;
    ctx.fillStyle   = ball.fireball ? '#f80' : '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Active power-up timers bar
  if (settings.powerMode) drawTimerBar();

  // Floating messages
  hudMessages.forEach((m, i) => {
    const alpha = Math.min(1, m.frames / 60);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = m.color;
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = m.color;
    ctx.font        = 'bold 22px Arial';
    ctx.textAlign   = 'center';
    ctx.fillText(m.text, canvas.width / 2, 80 + i * 30);
    m.frames--;
  });
  hudMessages = hudMessages.filter(m => m.frames > 0);
  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;
  ctx.textAlign   = 'left';
}

function drawTimerBar() {
  const FPS = 60;
  const items = [
    { key: 'WIDE_PADDLE', label: 'PALETA', color: '#0f0', max: 15 * FPS },
    { key: 'SLOW_BALL',   label: 'LENTO',  color: '#0ff', max: 10 * FPS },
    { key: 'FIREBALL',    label: 'FUEGO',  color: '#f80', max:  8 * FPS },
    { key: 'LASER',       label: 'LASER',  color: '#ff0', max: 10 * FPS }
  ];
  let xi = 6;
  items.forEach(it => {
    if (activePU[it.key] <= 0) return;
    const pct  = activePU[it.key] / it.max;
    const secs = Math.ceil(activePU[it.key] / FPS);
    ctx.fillStyle = '#444';
    ctx.fillRect(xi, canvas.height - 52, 80, 14);
    ctx.fillStyle = it.color;
    ctx.fillRect(xi, canvas.height - 52, 80 * pct, 14);
    ctx.strokeStyle = '#888';
    ctx.lineWidth   = 1;
    ctx.strokeRect(xi, canvas.height - 52, 80, 14);
    ctx.fillStyle = '#000';
    ctx.font      = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${it.label} ${secs}s`, xi + 40, canvas.height - 41);
    ctx.textAlign = 'left';
    xi += 88;
  });
}

// ── Update ────────────────────────────────────────────────────────────────────
function update() {
  frameCount++;

  // Paddle move
  const pSpeed = 8;
  if (keys['arrowleft']  || keys['a'] || touchControls.left)  paddleX -= pSpeed;
  if (keys['arrowright'] || keys['d'] || touchControls.right) paddleX += pSpeed;
  paddleX = Math.max(0, Math.min(canvas.width - paddleW, paddleX));

  // Tick active PU timers
  if (settings.powerMode) {
    for (const k in activePU) if (activePU[k] > 0) activePU[k]--;
    if (activePU.FIREBALL === 0) balls.forEach(b => b.fireball = false);
  }

  // Lasers
  lasers.forEach(l => { l.y += l.vy; });
  lasers.forEach(l => {
    bricks.forEach(b => {
      if (!b.active) return;
      if (l.x >= b.x && l.x <= b.x + b.width && l.y >= b.y && l.y <= b.y + b.height) {
        l.y = -9999;
        hitBrick(b);
      }
    });
  });
  lasers = lasers.filter(l => l.y > 0);

  // Balls
  const spd = currentSpeed();
  // Apply slow multiplier
  const spdEff = (settings.powerMode && activePU.SLOW_BALL > 0) ? spd * 0.6 : spd;

  balls.forEach(ball => {
    // Normalise speed each frame
    const mag = Math.hypot(ball.vx, ball.vy);
    if (mag > 0.01) {
      ball.vx = (ball.vx / mag) * spdEff;
      ball.vy = (ball.vy / mag) * spdEff;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collisions
    if (ball.x - BALL_RADIUS <= 0) {
      ball.x  = BALL_RADIUS;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x + BALL_RADIUS >= canvas.width) {
      ball.x  = canvas.width - BALL_RADIUS;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y - BALL_RADIUS <= 0) {
      ball.y  = BALL_RADIUS;
      ball.vy = Math.abs(ball.vy);
    }

    // Paddle collision
    if (
      ball.vy > 0 &&
      ball.y + BALL_RADIUS >= canvas.height - 30 &&
      ball.y - BALL_RADIUS <= canvas.height - 30 + PADDLE_HEIGHT &&
      ball.x >= paddleX &&
      ball.x <= paddleX + paddleW
    ) {
      ball.y  = canvas.height - 30 - BALL_RADIUS;
      ball.vy = -Math.abs(ball.vy);
      const hitPos = (ball.x - paddleX) / paddleW;
      ball.vx = (hitPos - 0.5) * spdEff * 2;
    }

    // Brick collisions
    for (const b of bricks) {
      if (!b.active) continue;
      // AABB overlap check
      const overlapX = ball.x > b.x - BALL_RADIUS && ball.x < b.x + b.width  + BALL_RADIUS;
      const overlapY = ball.y > b.y - BALL_RADIUS && ball.y < b.y + b.height + BALL_RADIUS;
      if (!overlapX || !overlapY) continue;

      const fromLeft  = ball.x - (b.x + b.width);
      const fromRight = b.x - ball.x;
      const fromTop   = ball.y - (b.y + b.height);
      const fromBot   = b.y - ball.y;
      const minOverlap = Math.min(
        Math.abs(fromLeft), Math.abs(fromRight),
        Math.abs(fromTop),  Math.abs(fromBot)
      );

      if (!ball.fireball) {
        if (minOverlap === Math.abs(fromLeft) || minOverlap === Math.abs(fromRight)) {
          ball.vx *= -1;
        } else {
          ball.vy *= -1;
        }
      }
      hitBrick(b);
      break; // one brick per frame per ball
    }
  });

  // Remove fallen balls
  balls = balls.filter(b => b.y < canvas.height + 30);
  if (balls.length === 0) {
    lives--;
    updateScore();
    if (lives <= 0) {
      gameStarted = false;
      setTimeout(() => { alert('¡Game Over! Puntuación final: ' + score); backToMenu(); }, 50);
      return;
    }
    resetBall();
  }

  // Falling power-ups
  if (settings.powerMode) {
    powerups.forEach(pu => {
      if (!pu.active) return;
      pu.y += PU_SPEED;
      if (
        pu.y + PU_H >= canvas.height - 30 &&
        pu.y         <= canvas.height - 30 + PADDLE_HEIGHT &&
        pu.x + PU_W  >= paddleX &&
        pu.x         <= paddleX + paddleW
      ) {
        pu.active = false;
        score += 50;
        updateScore();
        applyPowerup(pu.type);
      }
      if (pu.y > canvas.height) pu.active = false;
    });
    powerups = powerups.filter(p => p.active);
  }

  // Win check
  if (bricks.every(b => !b.active)) {
    gameStarted = false;
    setTimeout(() => { alert('¡Felicidades! Has ganado. Puntuación: ' + score); backToMenu(); }, 50);
  }
}

function hitBrick(b) {
  b.hp--;
  if (b.hp <= 0) {
    b.active = false;
    score += 10;
    if (settings.powerMode && Math.random() < 0.22) {
      spawnPowerup(b.x + b.width / 2, b.y + b.height);
    }
  } else {
    score += 5;
  }
  updateScore();
}

// ── Loop ──────────────────────────────────────────────────────────────────────
function loop() {
  if (!gameStarted) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

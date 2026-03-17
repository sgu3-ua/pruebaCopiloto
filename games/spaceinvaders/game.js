/**
 * Space Invaders – con Modo Furia Cósmica (UFO jefe + poderes especiales)
 *
 * Características:
 *  • Formación clásica 5×11 de alienígenas (3 tipos visuales)
 *  • Movimiento lateral y descenso
 *  • Aliens disparan de vuelta (probabilidad creciente con nivel)
 *  • 4 escudos destructibles
 *  • UFO jefe periódico que otorga poderes al ser destruido:
 *      – Disparo rápido (3 s)
 *      – Mega Bomba (destruye una fila aleatoria)
 *      – Restaurar escudo (rellena un escudo)
 *  • Sistema de niveles con velocidad creciente
 *  • Récord local (sessionStorage)
 */

// ── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('siCanvas');
const ctx    = canvas.getContext('2d');

// ── Constants ─────────────────────────────────────────────────────────────────
const W  = canvas.width;   // 800
const H  = canvas.height;  // 560

const ALIEN_COLS  = 11;
const ALIEN_ROWS  = 5;
const ALIEN_W     = 36;
const ALIEN_H     = 28;
const ALIEN_PAD_X = 8;
const ALIEN_PAD_Y = 10;
const ALIEN_OFFSET_X = (W - ALIEN_COLS * (ALIEN_W + ALIEN_PAD_X)) / 2;
const ALIEN_OFFSET_Y = 60;

const PLAYER_W    = 40;
const PLAYER_H    = 22;
const PLAYER_SPEED = 6;

const BULLET_W  = 4;
const BULLET_H  = 14;
const BULLET_SPD = 10;
const ABUL_SPD   = 5;

const SHIELD_ROWS  = 4;  // cells tall
const SHIELD_COLS  = 8;  // cells wide
const SHIELD_CELL  = 8;
const SHIELD_Y     = H - 100;
const SHIELD_COUNT = 4;

const UFO_W    = 52;
const UFO_H    = 22;
const UFO_SPD  = 2.5;

// Alien sprites (simple pixel-art using canvas)
const ALIEN_SPRITES = [
  // row 0-1: top aliens (small)
  (x, y, frame, color) => {
    ctx.fillStyle = color;
    // Body
    if (frame % 2 === 0) {
      // Frame A
      const pts = [[4,0],[8,0],[2,2],[10,2],[0,4],[12,4],[2,6],[4,6],[8,6],[10,6],
                   [0,8],[4,8],[8,8],[12,8],[2,10],[10,10]];
      for (const [px,py] of pts) ctx.fillRect(x+px*2, y+py*1.5, 2, 1.5);
    } else {
      // Frame B
      const pts = [[4,0],[8,0],[2,2],[10,2],[0,4],[12,4],[0,6],[12,6],[2,8],[10,8],
                   [4,10],[8,10]];
      for (const [px,py] of pts) ctx.fillRect(x+px*2, y+py*1.5, 2, 1.5);
    }
  },
  // row 2-3: medium aliens (crab)
  (x, y, frame, color) => {
    ctx.fillStyle = color;
    if (frame % 2 === 0) {
      const pts = [[2,0],[4,0],[8,0],[10,0],[3,2],[5,2],[7,2],[9,2],
                   [2,4],[4,4],[6,4],[8,4],[10,4],[1,6],[3,6],[9,6],[11,6],
                   [0,8],[2,8],[4,8],[8,8],[10,8],[12,8]];
      for (const [px,py] of pts) ctx.fillRect(x+px*2, y+py*1.5, 2, 1.5);
    } else {
      const pts = [[2,0],[4,0],[8,0],[10,0],[3,2],[5,2],[7,2],[9,2],
                   [1,4],[3,4],[5,4],[7,4],[9,4],[11,4],[0,6],[4,6],[8,6],[12,6],
                   [0,8],[12,8]];
      for (const [px,py] of pts) ctx.fillRect(x+px*2, y+py*1.5, 2, 1.5);
    }
  },
  // row 4: bottom aliens (octopus)
  (x, y, frame, color) => {
    ctx.fillStyle = color;
    if (frame % 2 === 0) {
      const pts = [[4,0],[5,0],[7,0],[8,0],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],
                   [2,4],[4,4],[6,4],[8,4],[10,4],[1,6],[3,6],[9,6],[11,6],
                   [1,8],[3,8],[9,8],[11,8]];
      for (const [px,py] of pts) ctx.fillRect(x+px*2, y+py*1.5, 2, 1.5);
    } else {
      const pts = [[4,0],[5,0],[7,0],[8,0],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],
                   [2,4],[4,4],[6,4],[8,4],[10,4],[2,6],[4,6],[8,6],[10,6],
                   [1,8],[11,8]];
      for (const [px,py] of pts) ctx.fillRect(x+px*2, y+py*1.5, 2, 1.5);
    }
  }
];

// Alien colours per row
const ALIEN_COLORS = ['#f80','#f80','#0ff','#0ff','#f0f'];

// ── Game state ─────────────────────────────────────────────────────────────────
let gameStarted = false;
let score  = 0;
let hiScore = parseInt(sessionStorage.getItem('si_hiscore') || '0');
let lives  = 3;
let level  = 1;

let aliens       = [];
let playerBullets = [];
let alienBullets  = [];
let shields      = [];
let ufo          = null;
let stars        = [];
let explosions   = [];
let messages     = [];

let player = { x: W/2 - PLAYER_W/2, y: H - 40 };
let alienDir   = 1;    // 1 = right, -1 = left
let alienStepY = 0;    // how many pixels descended this level
let alienFrame = 0;    // animation frame (flips each alien step)
let alienMoveTimer = 0;
let alienMoveInterval = 60; // frames between alien steps (decreases per level)

let alienFireTimer = 0;
let alienFireInterval = 90; // frames between alien shots (decreases per level)

let ufoTimer     = 0;
let ufoInterval  = 800; // frames between UFO appearances

// Power-up state
let rapidFireFrames = 0;   // remaining frames of rapid fire
let rapidFireTimer  = 0;   // cooldown between shots during rapid fire
let normalFireCooldown = 0; // normal shot cooldown

// Keys / touch
let keys          = {};
let touchControls = { left: false, right: false, fire: false };

// ── DOM refs ──────────────────────────────────────────────────────────────────
const menuEl       = document.getElementById('menu');
const gameContEl   = document.getElementById('gameContainer');
const scoreEl      = document.getElementById('scoreDisp');
const levelEl      = document.getElementById('levelDisp');
const livesEl      = document.getElementById('livesDisp');
const hiScoreEl    = document.getElementById('hiScoreDisp');

// ── Input ──────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if ((e.key === ' ' || e.key.toLowerCase() === 'z') && gameStarted) tryFire();
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

['btnLeft','btnRight','btnFire'].forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;
  const prop = id === 'btnLeft' ? 'left' : id === 'btnRight' ? 'right' : 'fire';
  btn.addEventListener('touchstart', e => { e.preventDefault(); touchControls[prop] = true; if (prop==='fire') tryFire(); });
  btn.addEventListener('touchend',   e => { e.preventDefault(); touchControls[prop] = false; });
  btn.addEventListener('mousedown',  () => { touchControls[prop] = true; if (prop==='fire') tryFire(); });
  btn.addEventListener('mouseup',    () => touchControls[prop] = false);
});

// ── Menu start ────────────────────────────────────────────────────────────────
document.getElementById('btnStart').addEventListener('click', () => startGame(1));

// ── Helpers ───────────────────────────────────────────────────────────────────
function rectOverlap(ax,ay,aw,ah, bx,by,bw,bh) {
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

function addExplosion(x, y, color, size) {
  explosions.push({ x, y, color, size, frames: 30 });
}

function addMessage(text, color, y) {
  messages.push({ text, color, y, alpha: 1, frames: 120 });
}

// ── Stars (background) ────────────────────────────────────────────────────────
function createStars() {
  stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.3,
      spd: Math.random()*0.3+0.1 });
  }
}

// ── Shields ───────────────────────────────────────────────────────────────────
function createShields() {
  shields = [];
  const totalW = SHIELD_COUNT * (SHIELD_COLS * SHIELD_CELL + 40);
  const startX = (W - totalW) / 2 + 20;
  for (let s = 0; s < SHIELD_COUNT; s++) {
    const sx = startX + s * ((SHIELD_COLS * SHIELD_CELL) + 40);
    const cells = [];
    for (let r = 0; r < SHIELD_ROWS; r++) {
      for (let c = 0; c < SHIELD_COLS; c++) {
        // Classic arch shape: cut bottom-center
        const skipBotCenter = (r >= SHIELD_ROWS-2) && (c >= 2 && c <= SHIELD_COLS-3);
        if (!skipBotCenter) cells.push({ r, c, hp: 3 });
      }
    }
    shields.push({ x: sx, y: SHIELD_Y, cells });
  }
}

function restoreOneShield() {
  // Find most-damaged shield and restore it
  let worst = null, worstHp = Infinity;
  shields.forEach(sh => {
    const totalHp = sh.cells.reduce((a, c) => a + c.hp, 0);
    if (totalHp < worstHp) { worstHp = totalHp; worst = sh; }
  });
  if (!worst) return;
  // Reset all cells hp
  worst.cells.forEach(c => c.hp = 3);
  addMessage('¡ESCUDO RESTAURADO!', '#0f0', H/2 - 40);
}

// ── Aliens ─────────────────────────────────────────────────────────────────────
function createAliens() {
  aliens = [];
  for (let row = 0; row < ALIEN_ROWS; row++) {
    for (let col = 0; col < ALIEN_COLS; col++) {
      const spriteIdx = row <= 1 ? 0 : row <= 3 ? 1 : 2;
      aliens.push({
        row, col, spriteIdx,
        x: ALIEN_OFFSET_X + col * (ALIEN_W + ALIEN_PAD_X),
        y: ALIEN_OFFSET_Y + row * (ALIEN_H + ALIEN_PAD_Y),
        alive: true,
        color: ALIEN_COLORS[row]
      });
    }
  }
}

function alienColumnAlive(col) {
  return aliens.some(a => a.alive && a.col === col);
}
function alienRowAlive(row) {
  return aliens.some(a => a.alive && a.row === row);
}

function lowestAlienInColumn(col) {
  let lowest = null;
  aliens.forEach(a => {
    if (!a.alive || a.col !== col) return;
    if (!lowest || a.y > lowest.y) lowest = a;
  });
  return lowest;
}

// ── UFO ────────────────────────────────────────────────────────────────────────
function spawnUfo() {
  const dir = Math.random() > 0.5 ? 1 : -1;
  ufo = {
    x: dir > 0 ? -UFO_W : W + UFO_W,
    y: 28,
    dir,
    hp: 3
  };
}

function drawUfo() {
  if (!ufo) return;
  ctx.fillStyle = ufo.hp > 2 ? '#f00' : ufo.hp > 1 ? '#f80' : '#ff0';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur  = 15;
  // Dome
  ctx.beginPath();
  ctx.ellipse(ufo.x + UFO_W/2, ufo.y + 5, UFO_W*0.3, UFO_H*0.5, 0, Math.PI, 0);
  ctx.fill();
  // Body
  ctx.beginPath();
  ctx.ellipse(ufo.x + UFO_W/2, ufo.y + 12, UFO_W/2, UFO_H*0.35, 0, 0, Math.PI*2);
  ctx.fill();
  // Windows
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(ufo.x + 12 + i*14, ufo.y + 12, 3, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  // HP pips
  for (let i = 0; i < ufo.hp; i++) {
    ctx.fillStyle = '#f00';
    ctx.fillRect(ufo.x + UFO_W/2 - ufo.hp*4 + i*8, ufo.y - 8, 6, 4);
  }
}

const UFO_POWERS = ['RAPID_FIRE', 'MEGA_BOMB', 'SHIELD_RESTORE'];

function ufoDestroyed() {
  addExplosion(ufo.x + UFO_W/2, ufo.y + UFO_H/2, '#f00', 40);
  score += 500;
  updateHUD();
  const power = UFO_POWERS[Math.floor(Math.random() * UFO_POWERS.length)];
  applyUFOPower(power);
  ufo = null;
}

function applyUFOPower(power) {
  switch (power) {
    case 'RAPID_FIRE':
      rapidFireFrames = 180;
      addMessage('⚡ DISPARO RÁPIDO (3s)!', '#ff0', H/2);
      break;
    case 'MEGA_BOMB':
      megaBomb();
      addMessage('💥 ¡MEGA BOMBA!', '#f80', H/2);
      break;
    case 'SHIELD_RESTORE':
      restoreOneShield();
      break;
  }
}

function megaBomb() {
  // Destroy all aliens in a random alive row
  const aliveRows = [...new Set(aliens.filter(a => a.alive).map(a => a.row))];
  if (aliveRows.length === 0) return;
  const targetRow = aliveRows[Math.floor(Math.random() * aliveRows.length)];
  let killed = 0;
  aliens.forEach(a => {
    if (a.alive && a.row === targetRow) {
      a.alive = false;
      score += 20;
      addExplosion(a.x + ALIEN_W/2, a.y + ALIEN_H/2, a.color, 20);
      killed++;
    }
  });
  updateHUD();
}

// ── Player draw ───────────────────────────────────────────────────────────────
function drawPlayer() {
  const x = player.x, y = player.y;
  ctx.fillStyle = '#0f0';
  ctx.shadowColor = '#0f0';
  ctx.shadowBlur  = 8;
  // Base
  ctx.fillRect(x, y + 14, PLAYER_W, 8);
  // Mid body
  ctx.fillRect(x + 8, y + 8, PLAYER_W - 16, 6);
  // Cannon
  ctx.fillRect(x + PLAYER_W/2 - 3, y, 6, 10);
  ctx.shadowBlur = 0;

  // Rapid fire indicator
  if (rapidFireFrames > 0) {
    ctx.fillStyle = `rgba(255,255,0,${0.3 + 0.4*(rapidFireFrames%20)/20})`;
    ctx.fillRect(x - 4, y - 4, PLAYER_W + 8, PLAYER_H + 8);
  }
}

// ── Shields draw ──────────────────────────────────────────────────────────────
function drawShields() {
  shields.forEach(sh => {
    sh.cells.forEach(cell => {
      const cx = sh.x + cell.c * SHIELD_CELL;
      const cy = sh.y + cell.r * SHIELD_CELL;
      const colors = ['#0f0','#8f0','#ff0'];
      ctx.fillStyle = colors[Math.min(cell.hp - 1, 2)];
      ctx.fillRect(cx, cy, SHIELD_CELL - 1, SHIELD_CELL - 1);
    });
  });
}

// ── Bullets draw ──────────────────────────────────────────────────────────────
function drawBullets() {
  // Player bullets
  playerBullets.forEach(b => {
    ctx.fillStyle   = '#0f0';
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur  = 6;
    ctx.fillRect(b.x - BULLET_W/2, b.y - BULLET_H, BULLET_W, BULLET_H);
  });
  // Alien bullets
  alienBullets.forEach(b => {
    ctx.fillStyle   = '#f00';
    ctx.shadowColor = '#f00';
    ctx.shadowBlur  = 6;
    ctx.fillRect(b.x - BULLET_W/2, b.y, BULLET_W, BULLET_H);
  });
  ctx.shadowBlur = 0;
}

// ── Explosions & messages draw ────────────────────────────────────────────────
function drawExplosions() {
  explosions.forEach(e => {
    const progress = 1 - e.frames / 30;
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle   = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur  = 12;
    const r = e.size * progress;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;
}

function drawMessages() {
  messages.forEach(m => {
    ctx.globalAlpha = m.alpha;
    ctx.fillStyle   = m.color;
    ctx.font        = 'bold 28px "Courier New"';
    ctx.textAlign   = 'center';
    ctx.shadowColor = m.color;
    ctx.shadowBlur  = 12;
    ctx.fillText(m.text, W/2, m.y);
    m.y -= 0.5;
    m.frames--;
    m.alpha = m.frames / 120;
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;
  ctx.textAlign   = 'left';
}

// ── Draw stars ────────────────────────────────────────────────────────────────
function drawStars() {
  stars.forEach(s => {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + s.r/2})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
    s.y += s.spd;
    if (s.y > H) { s.y = 0; s.x = Math.random()*W; }
  });
}

// ── Main draw ─────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, W, H);
  drawStars();
  drawShields();

  // Draw aliens
  aliens.forEach(a => {
    if (!a.alive) return;
    ALIEN_SPRITES[a.spriteIdx](a.x, a.y, alienFrame, a.color);
  });

  drawUfo();
  drawPlayer();
  drawBullets();
  drawExplosions();
  drawMessages();

  // Rapid fire bar
  if (rapidFireFrames > 0) {
    const pct = rapidFireFrames / 180;
    ctx.fillStyle = '#222';
    ctx.fillRect(10, H - 22, 120, 8);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(10, H - 22, 120 * pct, 8);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, H - 22, 120, 8);
    ctx.fillStyle = '#ff0';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('DISPARO RÁPIDO', 10, H - 26);
  }
}

// ── Player fire ────────────────────────────────────────────────────────────────
function tryFire() {
  if (!gameStarted) return;
  if (rapidFireFrames > 0) {
    if (rapidFireTimer > 0) return;
    rapidFireTimer = 5;
    playerBullets.push({ x: player.x + PLAYER_W/2, y: player.y });
  } else {
    if (normalFireCooldown > 0) return;
    normalFireCooldown = 25;
    playerBullets.push({ x: player.x + PLAYER_W/2, y: player.y });
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update() {
  // Player movement
  const spd = PLAYER_SPEED;
  if (keys['arrowleft']  || keys['a'] || touchControls.left)  player.x -= spd;
  if (keys['arrowright'] || keys['d'] || touchControls.right) player.x += spd;
  player.x = Math.max(0, Math.min(W - PLAYER_W, player.x));

  // Fire cooldowns
  if (rapidFireFrames > 0) {
    rapidFireFrames--;
    if (rapidFireTimer > 0) rapidFireTimer--;
    if (keys[' '] || keys['z'] || touchControls.fire) tryFire();
  } else {
    if (normalFireCooldown > 0) normalFireCooldown--;
  }

  // Stars (already updated in draw; nothing else needed)

  // ── Alien movement
  alienMoveTimer++;
  if (alienMoveTimer >= alienMoveInterval) {
    alienMoveTimer = 0;
    alienFrame ^= 1; // toggle animation

    // Check if any alive alien would hit the edge
    let minX = Infinity, maxX = -Infinity;
    aliens.forEach(a => {
      if (!a.alive) return;
      if (a.x < minX) minX = a.x;
      if (a.x + ALIEN_W > maxX) maxX = a.x + ALIEN_W;
    });

    if ((alienDir > 0 && maxX + 12 >= W) || (alienDir < 0 && minX - 12 <= 0)) {
      alienDir *= -1;
      aliens.forEach(a => { if (a.alive) a.y += 16; });
      alienStepY += 16;
    } else {
      aliens.forEach(a => { if (a.alive) a.x += alienDir * 10; });
    }
  }

  // ── Alien fire
  alienFireTimer++;
  if (alienFireTimer >= alienFireInterval) {
    alienFireTimer = 0;
    // Pick a random alive column that has a bottom alien
    const aliveCols = [...new Set(aliens.filter(a => a.alive).map(a => a.col))];
    if (aliveCols.length > 0) {
      const col = aliveCols[Math.floor(Math.random() * aliveCols.length)];
      const shooter = lowestAlienInColumn(col);
      if (shooter) {
        alienBullets.push({ x: shooter.x + ALIEN_W/2, y: shooter.y + ALIEN_H });
      }
    }
  }

  // ── UFO
  ufoTimer++;
  if (ufoTimer >= ufoInterval && !ufo) {
    ufoTimer = 0;
    ufoInterval = 600 + Math.floor(Math.random() * 400);
    spawnUfo();
  }
  if (ufo) {
    ufo.x += ufo.dir * UFO_SPD;
    if (ufo.x > W + UFO_W || ufo.x < -UFO_W*2) ufo = null;
  }

  // ── Move player bullets
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const b = playerBullets[i];
    b.y -= BULLET_SPD;
    if (b.y < 0) { playerBullets.splice(i, 1); continue; }

    // Hit alien
    let hitAlien = false;
    for (const a of aliens) {
      if (!a.alive) continue;
      if (rectOverlap(b.x-2, b.y-BULLET_H, BULLET_W, BULLET_H, a.x, a.y, ALIEN_W, ALIEN_H)) {
        a.alive = false;
        addExplosion(a.x + ALIEN_W/2, a.y + ALIEN_H/2, a.color, 18);
        const pts = a.row <= 1 ? 30 : a.row <= 3 ? 20 : 10;
        score += pts * level;
        updateHUD();
        playerBullets.splice(i, 1);
        hitAlien = true;
        break;
      }
    }
    if (hitAlien) continue;

    // Hit UFO
    if (ufo && rectOverlap(b.x-2, b.y-BULLET_H, BULLET_W, BULLET_H, ufo.x, ufo.y, UFO_W, UFO_H)) {
      ufo.hp--;
      addExplosion(b.x, b.y, '#f00', 10);
      playerBullets.splice(i, 1);
      if (ufo.hp <= 0) ufoDestroyed();
      continue;
    }

    // Hit shield
    if (checkBulletShields(b)) { playerBullets.splice(i, 1); }
  }

  // ── Move alien bullets
  for (let i = alienBullets.length - 1; i >= 0; i--) {
    const b = alienBullets[i];
    b.y += ABUL_SPD;
    if (b.y > H) { alienBullets.splice(i, 1); continue; }

    // Hit player
    if (rectOverlap(b.x-2, b.y, BULLET_W, BULLET_H, player.x, player.y, PLAYER_W, PLAYER_H)) {
      alienBullets.splice(i, 1);
      playerHit();
      continue;
    }

    // Hit shield
    if (checkBulletShields(b)) { alienBullets.splice(i, 1); }
  }

  // ── Shield vs aliens (aliens destroy shields when touching)
  aliens.forEach(a => {
    if (!a.alive) return;
    shields.forEach(sh => {
      sh.cells = sh.cells.filter(cell => {
        const cx = sh.x + cell.c * SHIELD_CELL;
        const cy = sh.y + cell.r * SHIELD_CELL;
        return !rectOverlap(a.x, a.y, ALIEN_W, ALIEN_H, cx, cy, SHIELD_CELL, SHIELD_CELL);
      });
    });
  });

  // ── Explosions tick
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].frames--;
    if (explosions[i].frames <= 0) explosions.splice(i, 1);
  }

  // ── Messages tick
  messages = messages.filter(m => m.frames > 0);

  // ── Win check
  if (aliens.every(a => !a.alive)) {
    nextLevel();
    return;
  }

  // ── Alien reach bottom
  const lowestY = Math.max(...aliens.filter(a => a.alive).map(a => a.y + ALIEN_H));
  if (lowestY >= player.y) {
    gameOver(false);
  }
}

// ── Shield bullet collision ────────────────────────────────────────────────────
function checkBulletShields(b) {
  for (const sh of shields) {
    for (let i = sh.cells.length - 1; i >= 0; i--) {
      const cell = sh.cells[i];
      const cx = sh.x + cell.c * SHIELD_CELL;
      const cy = sh.y + cell.r * SHIELD_CELL;
      if (rectOverlap(b.x-2, b.y, BULLET_W, BULLET_H, cx, cy, SHIELD_CELL, SHIELD_CELL)) {
        cell.hp--;
        if (cell.hp <= 0) sh.cells.splice(i, 1);
        return true;
      }
    }
  }
  return false;
}

// ── Player hit ────────────────────────────────────────────────────────────────
function playerHit() {
  addExplosion(player.x + PLAYER_W/2, player.y + PLAYER_H/2, '#0f0', 25);
  lives--;
  updateHUD();
  if (lives <= 0) {
    gameOver(false);
  } else {
    player.x = W/2 - PLAYER_W/2;
    playerBullets = [];
  }
}

// ── Level up ──────────────────────────────────────────────────────────────────
function nextLevel() {
  level++;
  addMessage(`NIVEL ${level}`, '#0f0', H/2);
  // Speed up aliens
  alienMoveInterval  = Math.max(10, Math.round(60 / (1 + (level-1)*0.15)));
  alienFireInterval  = Math.max(25, Math.round(90 / (1 + (level-1)*0.2)));
  alienStepY         = 0;
  createAliens();
  createShields();
  playerBullets      = [];
  alienBullets       = [];
  rapidFireFrames    = 0;
  updateHUD();
}

// ── Game over / win ───────────────────────────────────────────────────────────
function gameOver(win) {
  gameStarted = false;
  if (score > hiScore) {
    hiScore = score;
    sessionStorage.setItem('si_hiscore', hiScore);
  }
  setTimeout(() => {
    const msg = win
      ? `¡VICTORIA! Puntuación: ${score}`
      : `¡GAME OVER!\nPuntuación: ${score}\nRécord: ${hiScore}`;
    alert(msg);
    backToMenu();
  }, 300);
}

function backToMenu() {
  gameStarted            = false;
  gameContEl.style.display = 'none';
  menuEl.style.display     = 'block';
}

// ── HUD update ────────────────────────────────────────────────────────────────
function updateHUD() {
  scoreEl.textContent   = score;
  levelEl.textContent   = level;
  livesEl.textContent   = '♥ '.repeat(lives).trim();
  hiScoreEl.textContent = Math.max(score, hiScore);
}

// ── Start game ────────────────────────────────────────────────────────────────
function startGame(lvl) {
  gameStarted       = true;
  score             = 0;
  lives             = 3;
  level             = lvl || 1;
  alienDir          = 1;
  alienStepY        = 0;
  alienFrame        = 0;
  alienMoveTimer    = 0;
  alienMoveInterval = 60;
  alienFireTimer    = 0;
  alienFireInterval = 90;
  ufoTimer          = 0;
  ufoInterval       = 800;
  ufo               = null;
  playerBullets     = [];
  alienBullets      = [];
  explosions        = [];
  messages          = [];
  rapidFireFrames   = 0;
  rapidFireTimer    = 0;
  normalFireCooldown = 0;
  player            = { x: W/2 - PLAYER_W/2, y: H - 40 };

  createStars();
  createAliens();
  createShields();
  updateHUD();

  menuEl.style.display     = 'none';
  gameContEl.style.display = 'flex';

  loop();
}

// ── Game loop ─────────────────────────────────────────────────────────────────
function loop() {
  if (!gameStarted) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

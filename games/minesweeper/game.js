// Game settings
let settings = {
  rows: 16,
  cols: 16,
  mines: 40
};

// Game state
let gameStarted = false;
let gameOver = false;
let board = [];
let revealedCount = 0;
let flagCount = 0;
let timeElapsed = 0;
let timerInterval = null;

// References
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('gameContainer');
const boardElement = document.getElementById('board');
const mineCountElement = document.getElementById('mineCount');
const timerElement = document.getElementById('timer');

// Menu controls
document.getElementById('difficulty').addEventListener('change', (e) => {
  const customSettings = document.getElementById('customSettings');
  if (e.target.value === 'custom') {
    customSettings.style.display = 'block';
  } else {
    customSettings.style.display = 'none';
    switch(e.target.value) {
      case 'easy':
        settings = { rows: 9, cols: 9, mines: 10 };
        break;
      case 'medium':
        settings = { rows: 16, cols: 16, mines: 40 };
        break;
      case 'hard':
        settings = { rows: 16, cols: 30, mines: 99 };
        break;
    }
  }
});

document.getElementById('btnStart').addEventListener('click', () => {
  if (document.getElementById('difficulty').value === 'custom') {
    settings.rows = parseInt(document.getElementById('rows').value);
    settings.cols = parseInt(document.getElementById('cols').value);
    settings.mines = parseInt(document.getElementById('mines').value);
  }
  startGame();
});

document.getElementById('btnBackToMenu').addEventListener('click', () => {
  backToMenu();
});

document.getElementById('btnRestart').addEventListener('click', () => {
  startGame();
});

// Initialize board
function createBoard() {
  board = [];
  for (let row = 0; row < settings.rows; row++) {
    board[row] = [];
    for (let col = 0; col < settings.cols; col++) {
      board[row][col] = {
        mine: false,
        revealed: false,
        flagged: false,
        neighborMines: 0
      };
    }
  }
}

// Place mines randomly
function placeMines() {
  let minesPlaced = 0;
  while (minesPlaced < settings.mines) {
    const row = Math.floor(Math.random() * settings.rows);
    const col = Math.floor(Math.random() * settings.cols);
    if (!board[row][col].mine) {
      board[row][col].mine = true;
      minesPlaced++;
    }
  }
}

// Calculate neighbor mines
function calculateNeighbors() {
  for (let row = 0; row < settings.rows; row++) {
    for (let col = 0; col < settings.cols; col++) {
      if (!board[row][col].mine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < settings.rows && nc >= 0 && nc < settings.cols) {
              if (board[nr][nc].mine) count++;
            }
          }
        }
        board[row][col].neighborMines = count;
      }
    }
  }
}

// Render board
function renderBoard() {
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${settings.cols}, 30px)`;
  
  for (let row = 0; row < settings.rows; row++) {
    for (let col = 0; col < settings.cols; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      
      const cellData = board[row][col];
      
      if (cellData.flagged) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
      } else if (cellData.revealed) {
        cell.classList.add('revealed');
        if (cellData.mine) {
          cell.classList.add('mine');
          cell.textContent = '💣';
        } else if (cellData.neighborMines > 0) {
          cell.textContent = cellData.neighborMines;
          cell.classList.add(`number-${cellData.neighborMines}`);
        }
      }
      
      cell.addEventListener('click', () => handleCellClick(row, col));
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handleCellRightClick(row, col);
      });
      
      boardElement.appendChild(cell);
    }
  }
}

// Handle cell click
function handleCellClick(row, col) {
  if (gameOver || board[row][col].revealed || board[row][col].flagged) return;
  
  revealCell(row, col);
  
  if (board[row][col].mine) {
    gameOver = true;
    revealAllMines();
    stopTimer();
    setTimeout(() => alert('¡Game Over! Has tocado una mina.'), 100);
  } else {
    checkWin();
  }
  
  renderBoard();
}

// Handle right click (flag)
function handleCellRightClick(row, col) {
  if (gameOver || board[row][col].revealed) return;
  
  board[row][col].flagged = !board[row][col].flagged;
  flagCount += board[row][col].flagged ? 1 : -1;
  updateMineCount();
  renderBoard();
}

// Reveal cell
function revealCell(row, col) {
  if (board[row][col].revealed || board[row][col].flagged) return;
  
  board[row][col].revealed = true;
  revealedCount++;
  
  // If empty cell, reveal neighbors
  if (board[row][col].neighborMines === 0 && !board[row][col].mine) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < settings.rows && nc >= 0 && nc < settings.cols) {
          revealCell(nr, nc);
        }
      }
    }
  }
}

// Reveal all mines (game over)
function revealAllMines() {
  for (let row = 0; row < settings.rows; row++) {
    for (let col = 0; col < settings.cols; col++) {
      if (board[row][col].mine) {
        board[row][col].revealed = true;
      }
    }
  }
}

// Check win condition
function checkWin() {
  const totalCells = settings.rows * settings.cols;
  if (revealedCount === totalCells - settings.mines) {
    gameOver = true;
    stopTimer();
    setTimeout(() => alert(`¡Felicidades! Has ganado en ${timeElapsed} segundos.`), 100);
  }
}

// Update mine count display
function updateMineCount() {
  mineCountElement.textContent = settings.mines - flagCount;
}

// Timer functions
function startTimer() {
  timeElapsed = 0;
  updateTimer();
  timerInterval = setInterval(() => {
    timeElapsed++;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimer() {
  timerElement.textContent = String(timeElapsed).padStart(3, '0');
}

// Start game
function startGame() {
  gameStarted = true;
  gameOver = false;
  revealedCount = 0;
  flagCount = 0;
  
  createBoard();
  placeMines();
  calculateNeighbors();
  renderBoard();
  updateMineCount();
  startTimer();
  
  menu.style.display = 'none';
  gameContainer.style.display = 'flex';
}

// Back to menu
function backToMenu() {
  gameStarted = false;
  gameOver = false;
  stopTimer();
  gameContainer.style.display = 'none';
  menu.style.display = 'block';
}

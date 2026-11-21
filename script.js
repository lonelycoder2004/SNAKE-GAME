const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const message = document.getElementById("message");
const startBtn = document.getElementById("start");

const cols = 30;
const rows = 20;
const cell = 8;
const baseSpeed = 145;

let snake;
let food;
let dir;
let nextDir;
let score;
let highScore = Number(localStorage.getItem("nokiaSnakeHighScore") || 0);\nconst prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let running = false;
let paused = false;
let timer = null;
let audioContext;

function resetGame() {
  snake = [
    { x: 15, y: 10 },
    { x: 14, y: 10 },
    { x: 13, y: 10 },
    { x: 12, y: 10 }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  food = randomFood();
  paused = false;
  updateScore();
  draw();
}

function randomFood() {
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } while (snake?.some(part => part.x === position.x && part.y === position.y));
  return position;
}

function updateScore() {
  scoreEl.textContent = String(score).padStart(4, "0");
}

function speed() {
  return Math.max(55, baseSpeed - Math.floor(score / 5) * 8);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#9bbc0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#243d0b";
  snake.forEach((part, index) => {
    ctx.fillRect(part.x * cell, part.y * cell, cell - 1, cell - 1);
    if (index === 0) {
      ctx.fillRect(part.x * cell + 2, part.y * cell + 2, 2, 2);
    }
  });

  ctx.fillRect(food.x * cell + 1, food.y * cell + 1, 6, 6);
  ctx.fillRect(food.x * cell + 3, food.y * cell - 1, 2, 2);
}

function startGame() {
  initAudio();
  resetGame();
  running = true;
  message.hidden = true;
  scheduleTick();
  beep(440, 55);
}

function scheduleTick() {
  clearTimeout(timer);
  if (!running || paused) return;
  timer = setTimeout(tick, prefersReducedMotion ? Math.max(speed(), 120) : speed());
}

function tick() {
  if (!running || paused) return;

  dir = nextDir;
  const head = {
    x: snake[0].x + dir.x,
    y: snake[0].y + dir.y
  };

  const hitWall = head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
  const hitSelf = snake.some(part => part.x === head.x && part.y === head.y);

  if (hitWall || hitSelf) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    updateScore();
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("nokiaSnakeHighScore", String(highScore));
    }
    food = randomFood();
    beep(660, 65);
  } else {
    snake.pop();
  }

  draw();
  scheduleTick();
}

function setDirection(x, y) {
  if (!running) return;
  if (dir.x === -x && dir.y === -y) return;
  nextDir = { x, y };
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  message.hidden = !paused;
  message.textContent = paused ? "PAUSED" : "";
  if (paused) {
    clearTimeout(timer);
  } else {
    scheduleTick();
  }
}

function gameOver() {
  running = false;
  clearTimeout(timer);
  message.hidden = false;
  message.textContent = "GAME OVER";
  beep(180, 180);
}

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function beep(frequency, duration) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "square";
  gain.gain.setValueAtTime(0.035, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

const directions = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
};

document.addEventListener("keydown", event => {
  if (directions[event.key]) {
    event.preventDefault();
    setDirection(...directions[event.key]);
    return;
  }

  if (event.key === " ") {
    event.preventDefault();
    if (!running) startGame();
  }

  if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    togglePause();
  }
});

document.querySelectorAll("[data-dir]").forEach(button => {
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    const map = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0]
    };
    setDirection(...map[button.dataset.dir]);
  });
});

startBtn.addEventListener("click", startGame);

resetGame();

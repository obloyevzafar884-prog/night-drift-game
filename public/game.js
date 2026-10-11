const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const speedEl = document.getElementById("speed");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");

const state = {
  started: false,
  gameOver: false,
  score: 0,
  lives: 3,
  speed: 260,
  difficulty: 1,
  distance: 0,
  spawnTimer: 1.1,
  roadCurve: 0,
  playerX: 0,
  obstacles: [],
  lastTime: 0,
  keys: { left: false, right: false }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnObstacle() {
  const lanes = [-1, 0, 1];
  const lane = lanes[Math.floor(Math.random() * lanes.length)];

  state.obstacles.push({
    lane,
    z: -0.2,
    width: rand(0.4, 0.8),
    height: rand(0.5, 1.1),
    color: Math.random() > 0.5 ? "#ff4d4d" : "#ffa500"
  });
}

function resetGame() {
  state.started = false;
  state.gameOver = false;
  state.score = 0;
  state.lives = 3;
  state.speed = 260;
  state.difficulty = 1;
  state.distance = 0;
  state.spawnTimer = 1.1;
  state.roadCurve = 0;
  state.playerX = 0;
  state.obstacles = [];
  gameOverScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  startScreen.classList.add("visible");
  updateHud();
}

function startGame() {
  if (state.started && !state.gameOver) return;

  state.started = true;
  state.gameOver = false;
  startScreen.classList.add("hidden");
  startScreen.classList.remove("visible");
  gameOverScreen.classList.add("hidden");
  state.lastTime = 0;
}

function endGame() {
  state.started = false;
  state.gameOver = true;
  finalScore.textContent = `Score: ${Math.floor(state.score)}`;
  gameOverScreen.classList.remove("hidden");
  gameOverScreen.classList.add("visible");
}

function updateHud() {
  scoreEl.textContent = Math.floor(state.score);
  livesEl.textContent = state.lives;
  speedEl.textContent = (state.speed / 260).toFixed(1) + "x";
}

function update(dt) {
  if (!state.started || state.gameOver) return;

  state.distance += dt * state.speed * 0.35;
  state.score += dt * 24;
  state.speed = 260 + state.distance * 0.16;
  state.difficulty = 1 + state.distance * 0.0008;

  if (state.keys.left) state.playerX -= dt * 2.1;
  if (state.keys.right) state.playerX += dt * 2.1;
  state.playerX = clamp(state.playerX, -1.4, 1.4);

  state.roadCurve = Math.sin(state.distance * 0.012) * 0.9;

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnObstacle();
    state.spawnTimer = Math.max(0.75, 1.35 - state.distance * 0.0015);
  }

  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const obstacle = state.obstacles[i];
    obstacle.z += dt * (state.speed / 260) * 0.8;

    const sameLane = Math.abs(obstacle.lane - state.playerX) < 0.42;
    const sameDepth = obstacle.z > 0.82 && obstacle.z < 1.18;

    if (sameDepth && sameLane) {
      state.lives -= 1;
      state.obstacles.splice(i, 1);

      if (state.lives <= 0) {
        endGame();
        return;
      }
      continue;
    }

    if (obstacle.z > 1.4) {
      state.obstacles.splice(i, 1);
      state.score += 15;
    }
  }

  updateHud();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#071929");
  gradient.addColorStop(0.4, "#0e1d35");
  gradient.addColorStop(1, "#121c2a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 185, 64, 0.9)";
  ctx.beginPath();
  ctx.arc(canvas.width * 0.8, 110, 36, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + (state.distance * 0.8)) % (canvas.width + 100) - 50;
    const y = 40 + (i * 17) % 180;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawRoad() {
  const horizon = canvas.height * 0.23;
  const bottomY = canvas.height - 30;

  for (let i = 0; i < 28; i++) {
    const t0 = i / 28;
    const t1 = (i + 1) / 28;

    const y0 = lerp(horizon, bottomY, t0);
    const y1 = lerp(horizon, bottomY, t1);

    const roadWidth0 = lerp(70, canvas.width * 0.72, t0);
    const roadWidth1 = lerp(70, canvas.width * 0.72, t1);

    const cx0 = canvas.width / 2 + state.roadCurve * (1 - t0) * 220;
    const cx1 = canvas.width / 2 + state.roadCurve * (1 - t1) * 220;

    ctx.beginPath();
    ctx.moveTo(cx0 - roadWidth0 / 2, y0);
    ctx.lineTo(cx0 + roadWidth0 / 2, y0);
    ctx.lineTo(cx1 + roadWidth1 / 2, y1);
    ctx.lineTo(cx1 - roadWidth1 / 2, y1);
    ctx.closePath();

    const shade = lerp(35, 180, t0);
    ctx.fillStyle = `rgb(${shade}, ${shade + 10}, ${shade + 15})`;
    ctx.fill();

    if (i % 2 === 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lerp(cx0 - roadWidth0 / 6, cx0 - roadWidth0 / 2, 0.55), y0);
      ctx.lineTo(lerp(cx1 - roadWidth1 / 6, cx1 - roadWidth1 / 2, 0.55), y1);
      ctx.moveTo(lerp(cx0 + roadWidth0 / 6, cx0 + roadWidth0 / 2, 0.55), y0);
      ctx.lineTo(lerp(cx1 + roadWidth1 / 6, cx1 + roadWidth1 / 2, 0.55), y1);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 25; i++) {
    const t = i / 25;
    const y = lerp(horizon, bottomY, t);
    const width = lerp(70, canvas.width * 0.72, t);
    const cx = canvas.width / 2 + state.roadCurve * (1 - t) * 220;

    ctx.strokeStyle = "rgba(255, 220, 70, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - width / 2 - 10, y);
    ctx.lineTo(cx - width / 2 - 10, y + 8);
    ctx.moveTo(cx + width / 2 + 10, y);
    ctx.lineTo(cx + width / 2 + 10, y + 8);
    ctx.stroke();
  }
}

function drawObstacle(obstacle) {
  const z = clamp(obstacle.z, 0, 1.2);
  const horizon = canvas.height * 0.23;
  const bottomY = canvas.height - 80;

  const y = lerp(horizon, bottomY, z);
  const roadWidth = lerp(70, canvas.width * 0.72, z);
  const cx = canvas.width / 2 + state.roadCurve * (1 - z) * 220;

  const laneX = cx + obstacle.lane * roadWidth * 0.35;
  const carScale = lerp(0.25, 1.2, z);

  ctx.save();
  ctx.translate(laneX, y);
  ctx.scale(carScale, carScale);

  ctx.fillStyle = obstacle.color;
  ctx.fillRect(-20, -28, 40, 56);

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(-17, -15, 34, 18);

  ctx.fillStyle = "#fff";
  ctx.fillRect(-6, -30, 12, 8);

  ctx.fillStyle = "#111";
  ctx.fillRect(-22, -22, 6, 18);
  ctx.fillRect(16, -22, 6, 18);
  ctx.fillRect(-22, 8, 6, 18);
  ctx.fillRect(16, 8, 6, 18);

  ctx.restore();
}

function drawPlayerCar() {
  const x = canvas.width / 2 + state.playerX * (canvas.width * 0.19);
  const y = canvas.height - 74;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#1fd0ff";
  ctx.fillRect(-34, -22, 68, 44);

  ctx.fillStyle = "#0f5d93";
  ctx.fillRect(-24, -15, 48, 24);

  ctx.fillStyle = "#111";
  ctx.fillRect(-42, -17, 10, 18);
  ctx.fillRect(32, -17, 10, 18);
  ctx.fillRect(-42, 10, 10, 18);
  ctx.fillRect(32, 10, 10, 18);

  ctx.fillStyle = "#fff";
  ctx.fillRect(-10, -26, 20, 8);

  ctx.restore();
}

function render() {
  drawSky();
  drawRoad();

  for (const obstacle of state.obstacles) {
    drawObstacle(obstacle);
  }

  drawPlayerCar();

  if (!state.started && !state.gameOver) {
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";
    ctx.fillText("READY", canvas.width / 2, canvas.height / 2 - 20);
  }
}

function gameLoop(ts) {
  if (!state.lastTime) state.lastTime = ts;
  const dt = Math.min((ts - state.lastTime) / 1000, 0.033);
  state.lastTime = ts;

  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "arrowleft" || key === "a") state.keys.left = true;
  if (key === "arrowright" || key === "d") state.keys.right = true;

  if (event.code === "Space" || event.key === "Enter") {
    if (!state.started && !state.gameOver) {
      startGame();
    }
  }

  if (key === "r" && state.gameOver) {
    resetGame();
    startGame();
  }
});

document.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();

  if (key === "arrowleft" || key === "a") state.keys.left = false;
  if (key === "arrowright" || key === "d") state.keys.right = false;
});

resetGame();
requestAnimationFrame(gameLoop);

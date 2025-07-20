const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const gameOverScreen = document.getElementById("gameOverScreen");
const finalStats = document.getElementById("finalStats");
const restartBtn = document.getElementById("restartBtn");
let slingshotLevel = 1;
const maxSlingshotLevel = 5;
const upgradeBtn = document.getElementById("upgradeBtn");
let proveTokens = 0; // Prove token sayısı
let eggs = [];
let tokens = [];
let score = 0;
let shots = 0;
let proveScale = 1;
let tokenFallSpeedMultiplier = 1;
let lastBoxTime = 100;
let specialShotReady = false;
let canShoot = true;
let launcherAngleVertical = Math.PI / 4;  // 45 derece yukarı/aşağı
let goldenMessageTimer = 0;
let goldenMessageAlpha = 1;
const minAngleVertical = 0;               // yatay
const maxAngleVertical = Math.PI / 2;    // dikey
const uiPower = document.getElementById("uiPower");
let launcherAngleHorizontal = 0;          // 0 ortada, -45° sol, +45° sağ
const maxAngleHorizontal = Math.PI / 4;   // 45 derece sağ-sol sınırı
let confettis = []; // 🎉 Eksik olan bu
let power = 0;                           // basınç gücü (0 - maxPower)
const maxPower = 25;
let chargeStartTime = null;
let isCharging = false;                  // fare basılı mı?
const eggSprites = {};
const eggColors = ['blue', 'pink', 'purple', 'green', 'orange'];
let wallObstacles = [];
const MAX_STAGE = 5;
const WALL_X = canvasWidth - 40;
const uiProveTokens = document.getElementById("proveTokens");
let wallSpawnTimer = 0;
// Yeni: Yumurtanın fırlatıldığı top pozisyonu ve açısı
const launcherPos = { x: 100, y: canvasHeight - 100 };
let launcherAngle = Math.PI / 4;  // Başlangıç 45 derece
const minAngle = 0;               // Yatay
const maxAngle = Math.PI / 2;    // Dikey
let goldenSpawnTimer = 0;
let gameTime = 180; 
let gameOver = false;
const startOverlay = document.getElementById("startOverlay");
const startGameBtn = document.getElementById("startGameBtn");
let gameStarted = false;  // oyun başlamadı henüz
const uiTime = document.getElementById("time");
const uiScore = document.getElementById("score");
const uiShots = document.getElementById("shots");
let tokenSpawnMultiplier = 1;
// Yükseltme butonu
const costs = [0, 5, 15, 25, 50, 100];
const updateUpgradeButtonText = () => {
  const nextLevel = slingshotLevel + 1;
  if (nextLevel > maxSlingshotLevel) {
    upgradeBtn.textContent = `Maximum Level (${slingshotLevel})`;
    upgradeBtn.disabled = true;
    upgradeBtn.classList.remove("upgrade-glow");
  } else {
    const nextCost = costs[nextLevel];
    upgradeBtn.textContent = `Upgrade Launcher (Lv: ${slingshotLevel}) - Cost: ${nextCost}`;
  }
};

upgradeBtn.addEventListener("click", () => {
  const nextLevel = slingshotLevel + 1;

  if (nextLevel <= maxSlingshotLevel) {
    const cost = costs[nextLevel];
    if (proveTokens >= cost) {
      proveTokens -= cost;
      slingshotLevel = nextLevel;
 tokenSpawnMultiplier = 1 + 0.2 * (slingshotLevel - 1);
      uiProveTokens.textContent = proveTokens;
      updateUpgradeButtonGlow();
    }
  }

  updateUpgradeButtonText();
});


function glowCounter(id) {
  const el = document.getElementById(id);
  el.classList.add("glow-anim");

  setTimeout(() => {
    el.classList.remove("glow-anim");
  }, 1000);
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

function startCharge(e) {
  if (gameOver || !canShoot) return;
  isCharging = true;
  power = 0;
  chargeStartTime = performance.now();
  updateAim(e);
}
function lerp(start, end, t) {
  return start + (end - start) * t;
}
function updateAim(e) {
  const pos = getPointerPos(e);
  const dx = pos.x - launcherPos.x;
  const dy = launcherPos.y - pos.y;

  // Yatay açı hesapla
  const targetAngleH = Math.min(maxAngleHorizontal, Math.max(-maxAngleHorizontal, Math.atan2(0, dx)));
  // Dikey açı hesapla
  let targetAngleV = Math.atan2(dy, dx);
  if (targetAngleV < minAngleVertical) targetAngleV = minAngleVertical;
  if (targetAngleV > maxAngleVertical) targetAngleV = maxAngleVertical;

  // Yumuşak geçiş için lerp uygula, t parametresi (0-1 arası) yumuşatma miktarıdır
  const smoothing = 0.15; // %15 oranında yumuşatıyor, ihtiyaca göre ayarla
  launcherAngleHorizontal = lerp(launcherAngleHorizontal, targetAngleH, smoothing);
  launcherAngleVertical = lerp(launcherAngleVertical, targetAngleV, smoothing);
}

function releaseShot(e) {
  if (gameOver || !canShoot || !isCharging) return;

  isCharging = false;
  canShoot = false;

  let count = specialShotReady ? 5 : slingshotLevel;
  specialShotReady = false;

  for (let i = 0; i < count; i++) {
    const angleOffsetVertical = (i - (count - 1) / 2) * 0.05;
    const angleOffsetHorizontal = (i - (count - 1) / 2) * 0.05;

    const angleV = launcherAngleVertical + angleOffsetVertical;
    const angleH = launcherAngleHorizontal + angleOffsetHorizontal;

    const speed = Math.min(power, maxPower);

    const vx = speed * Math.cos(angleV) * Math.cos(angleH);
    const vy = -speed * Math.sin(angleV);

    const barrelLength = 100;
    drawLauncher();
    const launchX = barrelEnd.x;
    const launchY = barrelEnd.y;

    eggs.push(new Egg(launchX, launchY, vx, vy, previewEggColor));
  }

  shots++;
  uiShots.textContent = 60 - shots;
  glowCounter("shots");

  score -= count;
  if (score < 0) score = 0;
  uiScore.textContent = score;

  power = 0;
  previewEggColor = eggColors[Math.floor(Math.random() * eggColors.length)];
  setTimeout(() => canShoot = true, 300);
}

function updateUpgradeButtonGlow() {
  const costs = [0, 5, 15, 25, 50, 100];
  const nextLevel = slingshotLevel + 1;

  if (nextLevel <= maxSlingshotLevel && proveTokens >= costs[nextLevel]) {
    // Yeterli token varsa butonu yanıp söndür
    upgradeBtn.classList.add("upgrade-glow");
  } else {
    // Yeterli token yoksa veya max levelde yanıp sönmeyi kapat
    upgradeBtn.classList.remove("upgrade-glow");
  }
}

class Egg {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.active = true;
    this.radius = 15;
    this.stage = 1;
    this.hitWall = false;
this.confettiSpawned = false;
  }

update() {
  if (!this.active) return;

  if (this.x + this.radius > WALL_X) {
    // Her duvara çarpmada stage artacak, max 5'e kadar
    if (!this.hitWall || this.stage < MAX_STAGE) {
      this.stage = Math.min(this.stage + 1, MAX_STAGE);
      this.spawnConfetti();
      this.hitWall = true;
    }

    // Hızı ters ve azalan yap
    this.vx *= -0.2;
    this.vy *= 0.3;
  } else {
    // Duvara çarpılmamışsa tekrar false yap ki sonraki çarpmada tetiklesin
    this.hitWall = false;
  }

  this.x += this.vx;
  this.vy += 0.3; // yerçekimi etkisi
  this.y += this.vy;
for (let wall of wallObstacles) {
  if (wall.active && wall.collidesWith(this)) {
    // Yeni: normal vektörü al
    const normal = wall.getNormalVector(this);

    // Hızı normal vektörüne göre yansıt
    this.reflectVelocity(normal);

    // Sürtünme ve enerji kaybı (isteğe bağlı, daha gerçekçi)
    this.vx *= 0.8;  // yatay hız azalır
    this.vy *= 0.8;  // düşey hız azalır

    // Yumurtanın engelin içine girmemesi için konumu ayarla
    this.x = wall.x - this.radius - 1;

    break;  // Bir engelle çarpınca diğerlerini kontrol etme
  }
}
// Ekran dışına çıkınca veya duvarla temas kesilince sıfırla
if (!wallObstacles.some(w => w.active && w.collidesWith(this))) {
  this.confettiSpawned = false;
}
// Eğer artık hiçbir duvarla temas yoksa, konfeti flag'ini sıfırla
const touchingWall = wallObstacles.some(w => w.active && w.collidesWith(this));
if (!touchingWall) {
  this.confettiSpawned = false;
}
  // Ekranın altına inince yumurtayı pasif yap
  if (this.hitWall && Math.abs(this.vx) < 0.5 && this.y > canvasHeight - 10) {
    this.active = false;
  }
}
reflectVelocity(normal) {
  // normal vektörünün uzunluğunu normalize eder
  const length = Math.sqrt(normal.x*normal.x + normal.y*normal.y);
  const nx = normal.x / length;
  const ny = normal.y / length;

  // hız ile normal vektörünün skaler çarpımı
  const dot = this.vx * nx + this.vy * ny;

  // yansıyan hız vektörü hesapla
  let rvx = this.vx - 2 * dot * nx;
  let rvy = this.vy - 2 * dot * ny;

  // Enerji kaybı (hızın %50'si kalır)
  const energyLossFactor = 0.5;

  this.vx = rvx * energyLossFactor;
  this.vy = rvy * energyLossFactor;
}
breakBasedOnSpeed(speed) {
if (speed > 25) {
    this.stage = 5;
}
  else if (speed > 20) this.stage = 4;
  else if (speed > 15) this.stage = 3;
  else if (speed > 10) this.stage = 2;
  else this.stage = 1;
}

  spawnConfetti() {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = 2 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      confettis.push(new Confetti(this.x, this.y, vx, vy));
    }
  }

  draw() {
    const sprite = eggSprites[this.color]?.[Math.min(this.stage, MAX_STAGE)];
    if (sprite) ctx.drawImage(sprite, this.x - 20, this.y - 20, 40, 40);
  }
}

class Token {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = (1 + Math.random()) * tokenFallSpeedMultiplier;
    this.radius = 35 * proveScale;
    this.active = true;
  }
  update() {
    this.y += this.vy;
    if (this.y > canvasHeight) this.active = false;
  }
  draw() {
    const sprite = eggSprites["prove"];
    if (sprite) ctx.drawImage(sprite, this.x - 15 * proveScale, this.y - 15 * proveScale, 80 * proveScale, 60 * proveScale);
  }
}
class GoldenToken {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = 2;
    this.radius = 40 * 0.5;
    this.active = true;
  }

  update() {
    this.y += this.vy;
    if (this.y > canvasHeight) this.active = false;
  }

  draw() {
    const sprite = eggSprites["golden"];
    if (sprite) ctx.drawImage(sprite, this.x - 30, this.y - 30, 40, 60);
  }
}
class Confetti {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = 60 + Math.random() * 30; // Kaç frame yaşar
    this.active = true;
    this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // yerçekimi
    this.life--;
    if (this.life <= 0) this.active = false;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 4, 4);
  }
}




function loadImages(callback) {
  let loaded = 0;
  const total = eggColors.length * MAX_STAGE + 3;

  for (const color of eggColors) {
    eggSprites[color] = {};
    for (let stage = 1; stage <= MAX_STAGE; stage++) {
      const img = new Image();
      img.src = `assets/egg_${color}_${stage}.png`;
      img.onload = () => {
        loaded++;
        if (loaded === total) callback();
      };
      eggSprites[color][stage] = img;
    }
  }

  function loadSimple(name, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loaded++;
      if (loaded === total) callback();
    };
    eggSprites[name] = img;
  }
 loadSimple("launcher_base", "assets/cannon_base.png");
  loadSimple("launcher_barrel", "assets/cannon_barrel.png");
  loadSimple("prove", "assets/prove.png");
loadSimple("golden", "assets/golden.png");
  loadSimple("egg_notr", "assets/egg_notr.png");
  
}

function spawnTokenGroup() {
  const baseCount = 3 + Math.floor(Math.random() * 4);
  const count = Math.floor(baseCount * tokenSpawnMultiplier);

  // Minimum 1 token olacak şekilde kontrol edelim:
  const finalCount = Math.max(1, count);

  const centerX = 600 + Math.random() * 300;
  const spread = 100 + finalCount * 20;

  for (let i = 0; i < finalCount; i++) {
    const ratio = (i / (finalCount - 1)) * 2 - 1;
    const x = centerX + ratio * spread;

    const heightFactor = 1 - ratio * ratio;
    const y = -40 - heightFactor * 100;

    tokens.push(new Token(x, y));
  }
}
function spawnWallObstacle() {
  const shouldSpawnRight = Math.random() < 0.66;

  let x;
  if (shouldSpawnRight) {
    // Sağ bölge: canvas'ın sağındaki duvara daha yakın (örneğin 650px - 750px)
    x = canvasWidth - 150 + Math.random() * 50;
  } else {
    // Sol bölge: mevcut sistemdeki gibi
    x = 250 + Math.random() * 300;
  }

  const currentSpeed = 2 + (Math.floor((180 - gameTime) / 30)) * 0.5;
  wallObstacles.push(new WallObstacle(x, currentSpeed));
}

const COLLISION_TOLERANCE = 12;

function checkCollision(egg, token) {
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    const eggX = egg.x - egg.vx * t;
    const eggY = egg.y - egg.vy * t;

    const tokenX = token.x;
    const tokenY = token.y - token.vy * t;

    const dx = eggX - tokenX;
    const dy = eggY - tokenY;
    const distanceSquared = dx * dx + dy * dy;

    const combinedRadius = egg.radius + token.radius;

    if (distanceSquared <= combinedRadius * combinedRadius) {
      return true;
    }
  }
  return false;
}

canvas.addEventListener("mousedown", startCharge);
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); startCharge(e); }, { passive: false });

canvas.addEventListener("mousemove", updateAim);
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); updateAim(e); }, { passive: false });

canvas.addEventListener("mouseup", releaseShot);
canvas.addEventListener("touchend", (e) => { e.preventDefault(); releaseShot(e); }, { passive: false });
// 🎯 Yeni: Fırlatma işlemi fare tıklamasıyla olacak


function updateGame() {
if (!gameStarted) return;  // oyun başlamadıysa çık
// 2. Power artışı (updateGame içinden)
if (isCharging) {
  // Lineer olmayan artış: başlangıçta hızlı, sonlarda yavaş
const now = performance.now();
const elapsed = (now - chargeStartTime) / 1000; // saniye cinsinden
power = Math.min(elapsed * 150, maxPower); // saniyede 5 birim artış
}
  uiPower.textContent = Math.floor(power);

  if (!gameOver) {
    gameTime -= 1 / 60;

// Kademeli hız artışı: her 30 saniyede artar
const elapsedTime = 180 - gameTime;
const level = Math.floor(elapsedTime / 30); // 0'dan başlar, 5'e kadar gider

tokenFallSpeedMultiplier = 1 + level * 0.5; // seviye başına %50 hız artışı

    wallSpawnTimer += 1 / 60;

    const spawnInterval = Math.max(5, 20 - (180 - gameTime) / 10);

    if (wallSpawnTimer >= spawnInterval) {
      spawnWallObstacle();
      wallSpawnTimer = 0;
    }

if (gameTime <= 0 || shots >= 61) {
  gameTime = 0;
  gameOver = true;
}
goldenSpawnTimer += 1 / 60;
    if (goldenSpawnTimer >= 15) {
      spawnGoldenToken();
      goldenSpawnTimer = 0;
    }
if (gameOver) {
  gameOverScreen.style.display = "block";
  const finalScore = proveTokens * score;

  finalStats.innerHTML = `
    <style>
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
      }
    </style>

    <div style="
      text-align: center; 
      font-family: 'Poppins', sans-serif;
      color: #ad1457; 
      background: #fce4ec;
      padding: 20px 25px;
      border-radius: 12px;
      box-shadow: 0 0 12px rgba(173, 20, 87, 0.4);
      max-width: 320px;
      margin: 0 auto;
    ">
      <h2 style="color: #c2185b; font-size: 24px; margin-bottom: 20px;">
        🎉EGGCELLENT!🎉
      </h2>
      
      <div style="font-size: 16px; margin-bottom: 8px;">
        🪙 <strong>Tokens:</strong> 
        <span style="color: #d81b60;">${proveTokens}</span>
      </div>
      <div style="font-weight: bold; font-size: 22px; color: #c2185b; margin-bottom: 8px;">
        ✖
      </div>

      <div style="font-size: 16px; margin-bottom: 8px;">
        🏆 <strong>Points:</strong> 
        <span style="color: #d81b60;">${score}</span>
      </div>
      <div style="font-weight: bold; font-size: 22px; color: #c2185b; margin-bottom: 15px;">
        =
      </div>

      <div style="
        font-size: 20px; 
        font-weight: 700; 
        color: #ec407a; 
        margin-bottom: 20px; 
        animation: blink 1s infinite;
      ">
        💥 FINAL SCORE: <span style="font-size: 26px;">${finalScore}</span>
      </div>

      <div style="font-style: italic; color: #f8bbd0; font-size: 13px;">
        📸 Thanks for playing!
      </div>
    </div>
  `;
upgradeBtn.disabled = true;
upgradeBtn.classList.remove("upgrade-glow");
}

const timeLeft = Math.ceil(gameTime);
glowCounter("time");
uiTime.textContent = timeLeft;
if (timeLeft <= 15) {
  uiTime.style.color = '#d32f2f'; // kırmızı
  uiTime.style.fontWeight = 'bold';
} else {
  uiTime.style.color = '#880e4f'; // varsayılan pembe ton
  uiTime.style.fontWeight = 'normal';
}
  }


const spawnRate = Math.max(1.5, 4 - (180 - gameTime) / 60); // oyun ilerledikçe daha hızlı spawn

if (!gameOver) {
  if (!spawnTokenGroup.nextTime) {
    spawnTokenGroup.nextTime = gameTime;
  }
  if (gameTime <= spawnTokenGroup.nextTime) {
    spawnTokenGroup();
    spawnTokenGroup.nextTime = gameTime - spawnRate;
  }
}

// Gökyüzü efekti: zamanla koyulaşan degrade geçiş
const darkness = Math.min(1, (180 - gameTime) / 180); // 0 → 1

const startR = 200 - 50 * darkness; // 200 → 150
const startG = 230 - 80 * darkness; // 230 → 150
const startB = 255 - 75 * darkness; // 255 → 180

const endR = 255 - 50 * darkness; // 255 → 205
const endG = 255 - 50 * darkness; // 255 → 205
const endB = 255 - 50 * darkness; // 255 → 205

const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
gradient.addColorStop(0, `rgb(${startR}, ${startG}, ${startB})`);
gradient.addColorStop(1, `rgb(${endR}, ${endG}, ${endB})`);

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, canvasWidth, canvasHeight);

ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#888";
  ctx.fillRect(WALL_X, 0, 20, canvasHeight);

eggs.forEach(e => e.update());
tokens.forEach(t => t.update());
goldenTokens.forEach(g => g.update());
confettis.forEach(c => c.update());
wallObstacles.forEach(w => w.update());
wallObstacles = wallObstacles.filter(w => w.active);  

eggs.forEach(egg => {
  // Token çarpışmaları
  tokens.forEach(token => {
    if (egg.active && token.active && checkCollision(egg, token)) {
      token.active = false;
      score += 10;
      uiScore.textContent = score;
      glowCounter("score");
      proveTokens++;
      glowCounter("proveTokens");
      uiProveTokens.textContent = proveTokens;
      updateUpgradeButtonGlow();
    }
  });

  // 🟡 Golden Token çarpışması — ayrı forEach!
  goldenTokens.forEach(golden => {
    if (egg.active && golden.active && checkCollision(egg, golden)) {
      golden.active = false;
      shots = Math.max(0, shots - 5);
      uiShots.textContent = 60 - shots;
      goldenMessageTimer = 90;
      goldenMessageAlpha = 1;
    }
  });
});

eggs = eggs.filter(e => e.active);
tokens = tokens.filter(t => t.active);
goldenTokens = goldenTokens.filter(g => g.active);
confettis = confettis.filter(c => c.active);
  

tokens.forEach(t => t.draw());
goldenTokens.forEach(g => g.draw());
eggs.forEach(e => e.draw());
confettis.forEach(c => c.draw());
wallObstacles.forEach(w => w.draw());
  // 🎯 Yeni: Yumurtayı atan topu ve namlusunu çiz
  drawLauncher();
if (goldenMessageTimer > 0) {
  goldenMessageTimer--;
  goldenMessageAlpha = goldenMessageTimer / 90;

  ctx.fillStyle = `rgba(255, 215, 0, ${goldenMessageAlpha})`;
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("+5 Shots!", canvasWidth / 2, canvasHeight / 2 - 50);
}
  if (!gameOver) {
    requestAnimationFrame(updateGame);
  }
}

// Yeni fonksiyon: top + namlu çizimi
// 1. Namlu çizimi (drawLauncher) — daha gerçekçi
let barrelEnd = { x: 0, y: 0 }; // namlu ucu (global değişken olsun)
class WallObstacle {
  constructor(x, speed) {
    this.x = x;
    this.y = -200;
    this.width = 20;
    this.height = 80 + Math.random() * 50;
    this.speed = speed; // dışardan hız alacak
    this.active = true;
  }
  update() {
    this.y += this.speed;
    if (this.y > canvasHeight) {
      this.active = false;
    }
  }
getNormalVector(egg) {
  // Sağ taraftaki duvar için basit normal vektör (x negatif, y sıfır)
  return { x: -1, y: 0 };
}
draw() {
  // Koyu pembe ana dolgu
  ctx.fillStyle = "#880e4f";  // koyu pembe
  ctx.fillRect(this.x, this.y, this.width, this.height);

  // Sol tarafta ince açık pembe çizgi
  ctx.strokeStyle = "#f8bbd0"; // açık pembe
  ctx.lineWidth = 2;           // ince çizgi
  ctx.beginPath();
  ctx.moveTo(this.x + 1, this.y);
  ctx.lineTo(this.x + 1, this.y + this.height);
  ctx.stroke();
}

  // Basit çarpışma kontrolü (yumurta ile)
  collidesWith(egg) {
    return (
      egg.x + egg.radius > this.x &&
      egg.x - egg.radius < this.x + this.width &&
      egg.y + egg.radius > this.y &&
      egg.y - egg.radius < this.y + this.height
    );
  }
}

let goldenTokens = [];

function spawnGoldenToken() {
  const x = 100 + Math.random() * (canvasWidth - 200);
  goldenTokens.push(new GoldenToken(x, -40));
}
function drawLauncher() {
  const baseImg = eggSprites["launcher_base"];
  const barrelImg = eggSprites["launcher_barrel"];

  if (!baseImg || !barrelImg) return;

  const barrelWidth = 120;
  const barrelHeight = 100;
  const baseWidth = 80;
  const baseHeight = 80;

  // Gövde sabit çizilir
  ctx.drawImage(baseImg, launcherPos.x - baseWidth / 2, launcherPos.y - baseHeight / 2, baseWidth, baseHeight);

  // Namlu çizimi ve namlu ucunu hesapla
  ctx.save();
  ctx.translate(launcherPos.x, launcherPos.y);
  ctx.rotate(-launcherAngleHorizontal);
  ctx.rotate(-launcherAngleVertical);

  const barrelOffsetX = -1;
  const barrelOffsetY = -barrelHeight / 1.1;

  ctx.drawImage(barrelImg, barrelOffsetX, barrelOffsetY, barrelWidth, barrelHeight);

  // Namlu ucunu hesapla (barrel görüntüsünün ucundaki bir nokta)
  const endLocalX = barrelOffsetX + barrelWidth - 10; // biraz içeriden
  const endLocalY = barrelOffsetY + barrelHeight * 0.25;

  const angle = -launcherAngleHorizontal - launcherAngleVertical;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  barrelEnd.x = launcherPos.x + endLocalX * cos - endLocalY * sin;
  barrelEnd.y = launcherPos.y + endLocalX * sin + endLocalY * cos;

  ctx.restore();
}

startGameBtn.addEventListener("click", () => {
  startOverlay.style.display = "none"; // Başlat ekranını gizle
  gameStarted = true;                   // Oyunu başlat
  updateGame();                        // Oyun döngüsünü başlat
});


let previewEggColor = eggColors[0];

loadImages(() => {
updateUpgradeButtonGlow();
});

restartBtn.addEventListener("click", () => {
  slingshotLevel = 1;
  proveTokens = 0;
  eggs = [];
  tokens = [];
  goldenTokens = [];
  confettis = [];
  wallObstacles = [];
  score = 0;
  shots = 0;
  proveScale = 1;
  tokenFallSpeedMultiplier = 1;
  lastBoxTime = 100;
  specialShotReady = false;
  canShoot = true;
  gameTime = 180;
  gameOver = false;

  spawnTokenGroup.nextTime = undefined;

  // Ek olarak sıfırlanması iyi olur:
  isCharging = false;
  chargeStartTime = null;
  power = 0;
  launcherAngleVertical = Math.PI / 4;
  launcherAngleHorizontal = 0;
  goldenMessageTimer = 0;
  goldenMessageAlpha = 1;
tokenSpawnMultiplier = 1;
  // UI Güncellemeleri
  uiScore.textContent = score;
  uiShots.textContent = 60 - shots;
  uiTime.textContent = Math.ceil(gameTime);
  uiProveTokens.textContent = proveTokens;
 
  updateUpgradeButtonGlow();
 updateUpgradeButtonText();
  previewEggColor = eggColors[Math.floor(Math.random() * eggColors.length)];
upgradeBtn.disabled = false;
  finalStats.innerHTML = "";
  gameOverScreen.style.display = "none";

  gameStarted = true;
  startOverlay.style.display = "none";
  updateGame();
});

'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// Distancia de un punto al segmento AB (colisiones contra objetos muy rapidos)
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
const SKIN_STORAGE_KEY = 'asteroids-skin';
const SKIN_TOAST_TIME  = 1.2;   // segundos que se muestra el aviso de skin

// Poligonos con la nariz en +x; el fuego sale por flameX
const SHIP_SKINS = [
  {
    name: 'CLÁSICA', color: '#fff', width: 1.5, flameX: -8,
    points: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
  },
  {
    name: 'NEÓN', color: '#00e5ff', width: 1.5, flameX: -7,
    points: [[22, 0], [0, -7], [-10, -12], [-6, 0], [-10, 12], [0, 7]],
  },
  {
    name: 'INTERCEPTOR', color: '#ff5c8a', width: 1.6, flameX: -5,
    points: [[18, 0], [4, -8], [-9, -11], [-4, 0], [-9, 11], [4, 8]],
  },
  {
    name: 'BALLENA', color: '#7dff9b', width: 1.5, flameX: -10,
    points: [[16, 0], [6, -9], [-8, -10], [-13, 0], [-8, 10], [6, 9]],
  },
];

let currentSkin = loadSkin();
let skinToast   = 0;

function loadSkin() {
  try {
    const stored = Number(localStorage.getItem(SKIN_STORAGE_KEY));
    return Number.isInteger(stored) && stored >= 0 && stored < SHIP_SKINS.length ? stored : 0;
  } catch {
    return 0;
  }
}

function saveSkin(index) {
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, String(index));
  } catch {
    // almacenamiento no disponible (modo privado): la skin solo dura la sesion
  }
}

function currentSkinDef() {
  return SHIP_SKINS[currentSkin];
}

function cycleSkin() {
  currentSkin = (currentSkin + 1) % SHIP_SKINS.length;
  skinToast = SKIN_TOAST_TIME;
  saveSkin(currentSkin);
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const BOOST_MULTIPLIER = 2;   // factor de velocidad del turbo
const BOOST_DURATION   = 8;   // segundos de turbo activo
const BOOST_COOLDOWN   = 12;  // segundos de recarga antes de volver a usarlo
const MAX_SPEED        = 700; // px/s, tope de velocidad con el impulso instantaneo
const TRIPLE_DURATION  = 5;   // segundos de disparo triple
const TRIPLE_SPREAD    = Math.PI / 18; // 10 grados a cada lado

const SHIELD_DURATION = 8;    // segundos de escudo activo
const SHIELD_RADIUS   = 22;   // radio del anillo que intercepta impactos
const SHIELD_COLOR    = '120, 180, 255';

class Ship {
  constructor() {
    // Los efectos temporales NO se reinician en reset(): pasar de nivel no los cancela
    this.boostState  = 'off';   // 'off' | 'active' | 'cooling'
    this.boostTimer  = 0;
    this.tripleTimer = 0;
    this.shieldTimer = 0;
    this.shieldFlash = 0;
    this.reset();
  }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;
    if (this.shieldFlash   > 0) this.shieldFlash   -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   = Math.max(0, this.tripleTimer - dt);
    this.updateBoost(dt);

    const ROT   = 3.5;   // rad/s
    const THRUST = 260 * this.boostFactor(); // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    // Drag dependiente del tiempo: el tope de velocidad no depende del framerate
    const dragFactor = Math.pow(DRAG, dt * 60);
    this.vx *= dragFactor;
    this.vy *= dragFactor;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  updateBoost(dt) {
    if (this.boostState === 'off') return;

    this.boostTimer -= dt;
    if (this.boostTimer > 0) return;

    if (this.boostState === 'active') {
      this.boostState = 'cooling';
      this.boostTimer = BOOST_COOLDOWN;
    } else {
      this.boostState = 'off';
      this.boostTimer = 0;
    }
  }

  boostFactor() {
    return this.boostState === 'active' ? BOOST_MULTIPLIER : 1;
  }

  hasShield() {
    return this.shieldTimer > 0;
  }

  // Punto unico de proteccion: sirve tambien para futuros proyectiles enemigos
  isProtected() {
    return this.invincible > 0 || this.hasShield();
  }

  activateShield() {
    this.shieldTimer = SHIELD_DURATION;
    this.shieldFlash = 0;
  }

  // Evita repetir el destello mientras un asteroide sigue dentro del anillo
  absorbHit() {
    const fresh = this.shieldFlash <= 0;
    this.shieldFlash = 0.25;
    return fresh;
  }

  activateBoost() {
    this.boostState = 'active';
    this.boostTimer = BOOST_DURATION;

    // Impulso instantaneo al recoger el power-up
    this.vx *= BOOST_MULTIPLIER;
    this.vy *= BOOST_MULTIPLIER;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SPEED) {
      this.vx = (this.vx / speed) * MAX_SPEED;
      this.vy = (this.vy / speed) * MAX_SPEED;
    }
  }

  activateTriple() {
    this.tripleTimer = TRIPLE_DURATION;
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      return [-TRIPLE_SPREAD, 0, TRIPLE_SPREAD]
        .map(offset => new Bullet(ox, oy, this.angle + offset));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  drawShield() {
    const pulse = 1 + Math.sin((SHIELD_DURATION - this.shieldTimer) * 6) * 0.06;
    const warning = this.shieldTimer < 2;
    // Parpadeo final del escudo, independiente del parpadeo de reaparicion
    const alpha = warning && Math.floor(this.shieldTimer * 8) % 2 === 0 ? 0.25 : 0.8;
    const flashing = this.shieldFlash > 0;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, SHIELD_RADIUS * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${SHIELD_COLOR}, ${flashing ? 1 : alpha})`;
    ctx.lineWidth = flashing ? 3 : 1.5;
    ctx.stroke();
    ctx.fillStyle = `rgba(${SHIELD_COLOR}, ${flashing ? 0.16 : 0.05})`;
    ctx.fill();
    ctx.restore();
  }

  draw() {
    if (this.dead) return;

    // El escudo se dibuja aunque la nave parpadee por invencibilidad
    if (this.hasShield()) this.drawShield();

    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = currentSkinDef();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.color;
    ctx.lineWidth   = skin.width;
    ctx.lineJoin    = 'round';

    ctx.beginPath();
    ctx.moveTo(skin.points[0][0], skin.points[0][1]);
    for (let i = 1; i < skin.points.length; i++)
      ctx.lineTo(skin.points[i][0], skin.points[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      const boosted = this.boostState === 'active';
      ctx.beginPath();
      ctx.moveTo(skin.flameX, -4);
      ctx.lineTo(skin.flameX - rand(6, 14) * (boosted ? 1.6 : 1), 0);
      ctx.lineTo(skin.flameX,  4);
      ctx.strokeStyle = boosted ? 'rgba(0, 229, 255, 0.9)' : 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '255,255,255') {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.color = color;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${this.color},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups (velocidad x2, escudo y disparo triple) ─────────────────────────
const CYAN  = '0, 229, 255';
const AMBER = '255, 170, 0';
const POWERUP_LIFE = 14;   // segundos antes de desaparecer si no se recoge

class PowerUp {
  constructor(x, y, type = 'boost') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = type === 'triple' ? AMBER : type === 'shield' ? SHIELD_COLOR : CYAN;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 11;
    this.ttl = POWERUP_LIFE;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    this.age += dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const r = this.radius * (1 + Math.sin(this.age * 6) * 0.12);

    ctx.fillStyle = `rgba(${this.color}, 0.12)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgb(${this.color})`;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    if (this.type === 'triple') {
      // Tres trayectorias divergentes
      for (const spread of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + r * 0.55);
        ctx.lineTo(this.x + spread * r, this.y - r * 0.55);
        ctx.stroke();
      }
      return;
    }

    if (this.type === 'boost') {
      // Chevrones hacia adelante
      for (const offset of [-5, 5]) {
        ctx.beginPath();
        ctx.moveTo(this.x - r * 0.5, this.y + offset - r * 0.45);
        ctx.lineTo(this.x + r * 0.45, this.y + offset);
        ctx.lineTo(this.x - r * 0.5, this.y + offset + r * 0.45);
        ctx.stroke();
      }
      return;
    }

    // Hexagono giratorio para el escudo
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.age * 1.5);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * r * 0.65;
      const py = Math.sin(a) * r * 0.65;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const STAR_COLOR        = '255, 214, 120';  // dorado calido, distinto del cian del turbo
const STAR_SPEED        = 800;              // px/s (los asteroides van de 32 a 100)
const STAR_MIN_INTERVAL = 15;               // segundos entre apariciones
const STAR_MAX_INTERVAL = 30;
const STAR_TRAIL_STEP   = 12;               // px entre muestras de la estela
const STAR_TRAIL_LENGTH = 22;               // muestras -> ~260 px de estela
const STAR_RADIUS       = 5;                // nucleo (hitbox)
const STAR_MARGIN       = 80;               // margen fuera de pantalla antes de morir

class ShootingStar {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    const speed = STAR_SPEED * rand(0.9, 1.1);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.trail = [];
    this.dead = false;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // La estela se muestrea por distancia, no por frame: su largo no depende del framerate
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(this.x - last.x, this.y - last.y) >= STAR_TRAIL_STEP) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > STAR_TRAIL_LENGTH) this.trail.shift();
    }

    // No es toroidal: muere al salir de la pantalla
    if (this.x < -STAR_MARGIN || this.x > W + STAR_MARGIN ||
        this.y < -STAR_MARGIN || this.y > H + STAR_MARGIN) this.dead = true;
  }

  draw() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';   // la estela es luz, no pintura

    // Estela: polilinea que se estrecha y se desvanece hacia la cola
    const n = this.trail.length;
    ctx.lineCap = 'round';
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const from = this.trail[i - 1];
      const to   = this.trail[i];
      ctx.strokeStyle = `rgba(${STAR_COLOR},${(0.08 + t * 0.62).toFixed(3)})`;
      ctx.lineWidth = STAR_RADIUS * 1.5 * t;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // Nucleo brillante
    const glow = STAR_RADIUS * 3.2;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glow);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, `rgba(${STAR_COLOR},0.85)`);
    g.addColorStop(1, `rgba(${STAR_COLOR},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glow, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, shootingStars;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let destroyedAsteroids;
let starTimer;
let nextPowerUpType;

const POWERUP_EVERY = 3;   // asteroides destruidos por power-up de turbo
const SHIELD_EVERY  = 5;   // asteroides destruidos por power-up de escudo

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  destroyedAsteroids = 0;
  starTimer = rand(STAR_MIN_INTERVAL, STAR_MAX_INTERVAL);
  nextPowerUpType = 'boost';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, color = '255,255,255') {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function spawnPowerUp(x, y) {
  let type;

  // El escudo tiene prioridad cuando coincide con el turno de turbo/triple
  if (destroyedAsteroids % SHIELD_EVERY === 0 && !ship.hasShield()) {
    type = 'shield';
  } else if (destroyedAsteroids % POWERUP_EVERY === 0) {
    type = nextPowerUpType;
    nextPowerUpType = type === 'boost' ? 'triple' : 'boost';

    // El turbo no aparece si ya esta activo o en recarga
    if (type === 'boost' && ship.boostState !== 'off') return;
  } else {
    return;
  }

  powerups.push(new PowerUp(x, y, type));
}

// Entra por un borde al azar y cruza la pantalla en diagonal
function spawnShootingStar() {
  const m = 60;
  const edge = randInt(0, 3);
  let x, y, tx, ty;
  switch (edge) {
    case 0:  x = rand(0, W); y = -m;    tx = rand(0, W); ty = H + m; break;  // por arriba
    case 1:  x = rand(0, W); y = H + m; tx = rand(0, W); ty = -m;    break;  // por abajo
    case 2:  x = -m;      y = rand(0, H); tx = W + m;  ty = rand(0, H); break;  // por izquierda
    default: x = W + m;   y = rand(0, H); tx = -m;     ty = rand(0, H); break;  // por derecha
  }
  shootingStars.push(new ShootingStar(x, y, Math.atan2(ty - y, tx - x)));
}

function collectPowerUp(powerUp) {
  powerUp.dead = true;
  if (powerUp.type === 'boost') ship.activateBoost();
  else if (powerUp.type === 'shield') ship.activateShield();
  else ship.activateTriple();

  explode(powerUp.x, powerUp.y, 14, powerUp.color);
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // La skin se puede cambiar en cualquier estado, incluso en game over
  if (skinToast > 0) skinToast -= dt;
  if (pressed('KeyS')) cycleSkin();

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  // Estrellas fugaces: aparecen de vez en cuando y cruzan la pantalla
  starTimer -= dt;
  if (starTimer <= 0) {
    spawnShootingStar();
    starTimer = rand(STAR_MIN_INTERVAL, STAR_MAX_INTERVAL);
  }
  shootingStars.forEach(s => s.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        destroyedAsteroids++;
        spawnPowerUp(a.x, a.y);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (!ship.isProtected()) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  } else if (ship.hasShield()) {
    // Con escudo el impacto se detiene en el anillo y solo genera un destello
    for (const a of asteroids) {
      if (dist(ship, a) < SHIELD_RADIUS + a.radius * 0.82) {
        if (ship.absorbHit()) explode(ship.x, ship.y, 6, SHIELD_COLOR);
        break;
      }
    }
  }

  // Nave vs estrella fugaz: se usa el segmento recorrido para no hacer tunneling
  if (!ship.dead) {
    if (!ship.isProtected()) {
      for (const s of shootingStars) {
        if (distToSegment(ship.x, ship.y, s.prevX, s.prevY, s.x, s.y) < ship.radius + STAR_RADIUS) {
          killShip();
          break;
        }
      }
    } else if (ship.hasShield()) {
      for (const s of shootingStars) {
        if (distToSegment(ship.x, ship.y, s.prevX, s.prevY, s.x, s.y) < SHIELD_RADIUS + STAR_RADIUS) {
          if (ship.absorbHit()) explode(ship.x, ship.y, 6, SHIELD_COLOR);
          break;
        }
      }
    }
  }

  // Nave vs power-up (cada tipo comprueba si su efecto sigue disponible)
  for (const p of powerups) {
    if (p.dead || dist(ship, p) >= ship.radius + p.radius) continue;
    if (p.type === 'boost' && ship.boostState !== 'off') continue;
    if (p.type === 'shield' && ship.hasShield()) continue;
    collectPowerUp(p);
    break;
  }
  powerups = powerups.filter(p => !p.dead);

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = currentSkinDef();
  const SCALE = 0.45;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(SCALE, SCALE);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = skin.width / SCALE;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.points[0][0], skin.points[0][1]);
  for (let i = 1; i < skin.points.length; i++)
    ctx.lineTo(skin.points[i][0], skin.points[i][1]);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawSkinToast() {
  if (skinToast <= 0) return;
  const skin = currentSkinDef();

  // Desvanecido en el ultimo tramo del aviso
  ctx.globalAlpha = Math.min(1, skinToast / 0.4);
  ctx.textAlign = 'center';
  ctx.font = '14px monospace';
  ctx.fillStyle = skin.color;
  ctx.fillText(`SKIN: ${skin.name}`, W / 2, H - 22);
  ctx.globalAlpha = 1;
}

function drawMeter(label, ratio, color, y) {
  const width = 110;
  const height = 5;

  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  ctx.fillText(label, 14, y - 4);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(14, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(14, y, width * Math.max(0, Math.min(1, ratio)), height);
}

function drawPowerUpMeters() {
  let y = 42;

  if (ship.boostState !== 'off') {
    const active = ship.boostState === 'active';
    const total = active ? BOOST_DURATION : BOOST_COOLDOWN;
    drawMeter(
      active ? 'TURBO x2' : 'RECARGA',
      ship.boostTimer / total,
      active ? `rgb(${CYAN})` : 'rgba(255,255,255,0.45)',
      y
    );
    y += 30;
  }

  if (ship.hasShield()) {
    drawMeter('ESCUDO', ship.shieldTimer / SHIELD_DURATION, `rgb(${SHIELD_COLOR})`, y);
    y += 30;
  }

  if (ship.tripleTimer > 0)
    drawMeter('TRIPLE', ship.tripleTimer / TRIPLE_DURATION, `rgb(${AMBER})`, y);
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  drawPowerUpMeters();
  drawSkinToast();
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  shootingStars.forEach(s => s.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO REINICIA   —   [S] SKIN`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);

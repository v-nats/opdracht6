import './style.css';

window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

document.onselectstart = function () {
  return false;
};

const c = document.getElementById('c');
const ctx = c.getContext('2d');
const dpr = window.devicePixelRatio;
const cw = window.innerWidth;
const ch = window.innerHeight;

c.width = cw * dpr;
c.height = ch * dpr;
ctx.scale(dpr, dpr);

const rand = (rMi, rMa) => ~~((Math.random() * (rMa - rMi + 1)) + rMi);
ctx.lineCap = 'round';

let orbs = [];
let particles = [];
let isDragging = false;
const trailCB = document.getElementById('trail');
let trail = trailCB.checked;
const clearer = document.getElementById('clear');

function createOrb(mx, my) {
  const dx = cw / 2 - mx;
  const dy = ch / 2 - my;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  orbs.push({
    x: mx,
    y: my,
    lastX: mx,
    lastY: my,
    colorAngle: 0,
    angle: angle + Math.PI / 2,
    size: rand(1, 3) / 2,
    centerX: cw / 2,
    centerY: ch / 2,
    radius: dist,
    speed: (rand(5, 10) / 1000) * (dist / 750) + 0.015,
    draw: function () {
      ctx.strokeStyle = `hsla(${this.colorAngle}, 100%, 50%, 1)`;
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(this.lastX, this.lastY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      if (Math.random() < 0.1) {
        for (let i = 0; i < 3; i++) {
          createParticle(this.x + rand(-5, 5), this.y + rand(-5, 5), `hsla(${this.colorAngle}, 100%, 50%, 1)`);
        }
      }
    },
    update: function () {
      this.lastX = this.x;
      this.lastY = this.y;
      const x1 = cw / 2;
      const y1 = ch / 2;
      const x2 = this.x;
      const y2 = this.y;
      const rise = y1 - y2;
      const run = x1 - x2;
      const slope = -(rise / run);
      let radian = Math.atan(slope);
      let angleH = Math.floor(radian * (180 / Math.PI));
      if (x2 < x1 && y2 < y1) {
        angleH += 180;
      }
      if (x2 < x1 && y2 > y1) {
        angleH += 180;
      }
      if (x2 > x1 && y2 > y1) {
        angleH += 360;
      }
      if (y2 < y1 && slope === '-Infinity') {
        angleH = 90;
      }
      if (y2 > y1 && slope === 'Infinity') {
        angleH = 270;
      }
      if (x2 < x1 && slope === '0') {
        angleH = 180;
      }
      if (isNaN(angleH)) {
        angleH = 0;
      }

      this.colorAngle = angleH;
      this.x = this.centerX + Math.sin(this.angle * -1) * this.radius;
      this.y = this.centerY + Math.cos(this.angle * -1) * this.radius;
      this.angle += this.speed;
    },
  });
}

function createParticle(x, y, color) {
  particles.push({
    x,
    y,
    vx: rand(-2, 2),
    vy: rand(-5, -1),
    size: rand(0.1, 0.3),
    color: color || `hsla(${rand(0, 360)}, 100%, 50%, 1)`,
    life: 50,
    draw: function () {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    },
    update: function () {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1;
      this.life--;
    },
  });
}

function handleMouseMove(e) {
  const mx = e.pageX - c.offsetLeft;
  const my = e.pageY - c.offsetTop;
  if (isDragging) {
    for (let i = 0; i < 5; i++) {
      createParticle(mx, my);
    }
    createOrb(mx, my);
  }
}

function handleMouseDown() {
  isDragging = true;
}

function handleMouseUp() {
  isDragging = false;
}

function toggleTrails() {
  trail = trailCB.checked;
}

function clearCanvas() {
  orbs = [];
  particles = [];
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, cw, ch);
  initOrbs();
}

c.addEventListener('mousemove', handleMouseMove, false);
c.addEventListener('mousedown', handleMouseDown, false);
c.addEventListener('mouseup', handleMouseUp, false);
trailCB.addEventListener('change', toggleTrails, false);
clearer.addEventListener('click', clearCanvas, false);

function initOrbs() {
  for (let i = 0; i < 100; i++) {
    createOrb(cw / 2, ch / 2 + i * 2);
  }
}

initOrbs();

function loop() {
  window.requestAnimFrame(loop);
  if (trail) {
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, cw, ch);
  } else {
    ctx.clearRect(0, 0, cw, ch);
  }

  orbs.forEach((orb) => {
    orb.update();
    orb.draw();
  });

  particles = particles.filter((particle) => particle.life > 0);
  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });
}

loop();
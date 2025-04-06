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
let faces = [];
const faceCount = 10;
const faceRadius = 20;

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
      this.colorAngle = (Math.atan2(this.y - this.centerY, this.x - this.centerX) * 180) / Math.PI + 180;
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

function createFaces() {
  faces = [];
  for (let i = 0; i < faceCount; i++) {
    faces.push({
      x: rand(faceRadius, cw - faceRadius),
      y: rand(faceRadius, ch - faceRadius),
    });
  }
}

function handleMouseMove(e) {
  const mx = e.pageX - c.offsetLeft;
  const my = e.pageY - c.offsetTop;

  if (isDragging) {
    for (let i = 0; i < 5; i++) {
      createParticle(mx, my);
    }
    createOrb(mx, my);

    // Collision detection met gezichtjes
    faces.forEach((face, index) => {
      const dx = mx - face.x;
      const dy = my - face.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < faceRadius) {
        for (let i = 0; i < 15; i++) {
          createParticle(face.x, face.y, 'orange');
        }
        faces.splice(index, 1);
        // Nieuw gezichtje genereren
        faces.push({
          x: rand(faceRadius, cw - faceRadius),
          y: rand(faceRadius, ch - faceRadius),
        });
      }
      
    });
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
  createFaces();
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

function drawFaces() {
  faces.forEach((face) => {
    // hoofd
    ctx.beginPath();
    ctx.arc(face.x, face.y, faceRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();

    // ogen
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(face.x - 5, face.y - 5, 2, 0, Math.PI * 2);
    ctx.arc(face.x + 5, face.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // mond
    ctx.beginPath();
    ctx.arc(face.x, face.y + 5, 7, 0, Math.PI);
    ctx.strokeStyle = 'black';
    ctx.stroke();
  });
}

function loop() {
  window.requestAnimFrame(loop);
  if (trail) {
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, cw, ch);
  } else {
    ctx.clearRect(0, 0, cw, ch);
  }

  drawFaces();

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

initOrbs();
createFaces();
loop();

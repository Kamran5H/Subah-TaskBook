// High Performance Canvas Confetti Engine for Subah Task Book
// Zero-dependency, colorful celebratory bursts with stars, ribbons, and sparkles.

class SubahConfetti {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
    this.colors = [
      "#ffd700", // Gold
      "#ff6b6b", // Coral Rose
      "#4facfe", // Cyan
      "#00f2fe", // Aqua
      "#a18cd1", // Soft Purple
      "#fbc2eb", // Pink
      "#38ef7d", // Emerald Green
      "#ffffff"  // Diamond White
    ];
  }

  init() {
    if (this.canvas) return;
    this.canvas = document.createElement("canvas");
    this.canvas.id = "confetti-canvas";
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "99999";
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(originX, originY, count = 90) {
    this.init();
    const ox = originX || window.innerWidth / 2;
    const oy = originY || window.innerHeight * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 5 + Math.random() * 12;
      const shapeType = Math.random() > 0.4 ? "rect" : (Math.random() > 0.5 ? "circle" : "star");

      this.particles.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - (3 + Math.random() * 4), // upward pop
        size: 5 + Math.random() * 7,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        shape: shapeType,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        gravity: 0.28 + Math.random() * 0.15,
        drag: 0.95 + Math.random() * 0.03
      });
    }

    if (!this.animId) {
      this.animate();
    }
  }

  animate() {
    if (!this.ctx || this.particles.length === 0) {
      this.animId = null;
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.009;

      if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else if (p.shape === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === "star") {
        this.drawStar(this.ctx, 0, 0, 5, p.size * 0.8, p.size * 0.4);
      }

      this.ctx.restore();
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
}

window.subahConfetti = new SubahConfetti();

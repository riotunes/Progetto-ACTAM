// visuals.js – GRAPHIC RESPONSE
// parameters:
//    node: the audio node (mic input or playback)
//    nPalle: number of particles
//    sensitivity: sensitivity to sound intensity
function visualizeSound(node, nPalle, sensitivity) {
  // === Canvas Setup ===
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");

  // Resize the canvas to fill the window.
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Audio Analyser Setup
  const analyser = c.createAnalyser();
  analyser.fftSize = 512;
  node.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const prevDataArray = new Uint8Array(bufferLength);
  let timeElapsed = 0;

  // Particle Class
  class Particle {
    constructor(x, y, size, hue, speedFactor) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.baseSize = size;
      this.hue = hue;
      this.opacity = Math.random();
      this.speedFactor = speedFactor;
      this.speedX = (Math.random() - 0.5) * speedFactor;
      this.speedY = (Math.random() - 0.5) * speedFactor;
      this.angle = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.3;
    }

    update(intensity, derivative, timbre) {
      const scaledIntensity = Math.log1p(intensity) * 10;
      const sizeChange = sensitivity * (scaledIntensity / 10 + derivative / 20 + timbre * 1.5);
      this.size = Math.max(this.baseSize + sizeChange, 5);
      this.x += this.speedX * (scaledIntensity / 100 + timbre / 5);
      this.y += this.speedY * (scaledIntensity / 100 + timbre / 5);
      this.angle += this.rotationSpeed;
      if (this.x < 0) this.x = canvas.width;
      else if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      else if (this.y > canvas.height) this.y = 0;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const gradient = ctx.createRadialGradient(
        0,
        0,
        this.size * 0.2,
        0,
        0,
        this.size
      );
      gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, ${this.opacity})`);
      gradient.addColorStop(1, `hsla(${this.hue}, 80%, 30%, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Particle Initialization
  const particles = [];
  const particleCount = nPalle;
  const createParticle = () => {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 20 + 5;
    const hue = Math.random() * 300 + 30;
    const speedFactor = Math.random() * 3 + 1;
    return new Particle(x, y, size, hue, speedFactor);
  };
  for (let i = 0; i < particleCount; i++) {
    particles.push(createParticle());
  }

  // Background Drawing
  const drawBackground = (avgIntensity) => {
    // Draw a semi-transparent black for a trail effect.
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const overlayAlpha = avgIntensity / 255;
    ctx.fillStyle = `rgba(0, 255, 204, ${overlayAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Particle Explosion
  const particleExplosion = (avgIntensity, avgTimbre) => {
    // Create a burst of extra particles.
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 30 + 10;
      const hue = Math.random() * 300 + 30;
      const burstParticle = new Particle(x, y, size, hue, 5);
      burstParticle.update(avgIntensity * 2, 0, avgTimbre);
      burstParticle.draw();
    }
  };

  let animationFrameId;
  // Main Animation Loop
  function draw() {
    analyser.getByteFrequencyData(dataArray);
    const avgIntensity =
      dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    drawBackground(avgIntensity);
    const avgTimbre =
      dataArray.reduce((sum, value, index) => sum + value * index, 0) /
      (bufferLength * 128);
    const derivativeArray = new Uint8Array(bufferLength);
    for (let i = 0; i < bufferLength; i++) {
      const prevValue = prevDataArray[i] || 0;
      derivativeArray[i] = dataArray[i] - prevValue;
    }
    prevDataArray.set(dataArray);
    timeElapsed++;
    particles.forEach((particle, index) => {
      const intensity = dataArray[index % bufferLength] || avgIntensity;
      const derivative = derivativeArray[index % bufferLength] || 0;
      particle.update(intensity, derivative, avgTimbre);
      particle.draw();
    });
    if (timeElapsed % 200 === 0 && avgIntensity > 20) {
      particleExplosion(avgIntensity, avgTimbre);
    }
    animationFrameId = requestAnimationFrame(draw);
  }
  draw();

  // Return a cancellation function that disconnects the node from the analyser,
  // then cancels the animation.
  return function cancel() {
    cancelAnimationFrame(animationFrameId);
    // Safely disconnect the node from the analyser.
    try {
      node.disconnect(analyser);
    } catch (e) {
      // Sometimes the node may have been disconnected already.
      console.warn("Node disconnect error:", e);
    }
  };
}

// GRAPHIC RESPONSE

// parameters:
// audio node
// number of particles
// sensitivity to intensity of the sound

function visualizeSound(node, nPalle, sensitivity) {
  // === Canvas Setup ===
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");

  // Helper: Resize the canvas to fill the window
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
      // Scale intensity logarithmically to moderate large values.
      const scaledIntensity = Math.log1p(intensity) * 10;
      const sizeChange = sensitivity * (scaledIntensity / 10 + derivative / 20 + timbre * 1.5);
      this.size = Math.max(this.baseSize + sizeChange, 5);

      // Update position with influence from intensity and timbre.
      this.x += this.speedX * (scaledIntensity / 100 + timbre / 5);
      this.y += this.speedY * (scaledIntensity / 100 + timbre / 5);
      this.angle += this.rotationSpeed;

      // Wrap around the screen edges.
      if (this.x < 0) this.x = canvas.width;
      else if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      else if (this.y > canvas.height) this.y = 0;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // Create a radial gradient for a glowing effect.
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
    // Choose a hue in the range [30, 330] to avoid red hues.
    const hue = Math.random() * 300 + 30;
    const speedFactor = Math.random() * 3 + 1;
    return new Particle(x, y, size, hue, speedFactor);
  };
  for (let i = 0; i < particleCount; i++) {
    particles.push(createParticle());
  }

  // Background Drawing
  const drawBackground = (avgIntensity) => {
    // Draw the trail: a mostly transparent black fill.
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate overlay opacity based on average intensity.
    const overlayAlpha = avgIntensity / 255;
    ctx.fillStyle = `rgba(0, 255, 204, ${overlayAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Particle Explosion
  const particleExplosion = (avgIntensity, avgTimbre) => {
    // Create and render a burst of 50 extra particles.
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

  // Main Animation Loop
  function draw() {
    analyser.getByteFrequencyData(dataArray);

    // Calculate the average intensity from the frequency data.
    const avgIntensity =
      dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

    // Draw the dynamic background.
    drawBackground(avgIntensity);

    // Calculate a weighted average for timbre.
    const avgTimbre =
      dataArray.reduce((sum, value, index) => sum + value * index, 0) /
      (bufferLength * 128);

    // Compute the derivative of the frequency data.
    const derivativeArray = new Uint8Array(bufferLength);
    for (let i = 0; i < bufferLength; i++) {
      const prevValue = prevDataArray[i] || 0;
      derivativeArray[i] = dataArray[i] - prevValue;
    }
    prevDataArray.set(dataArray);

    timeElapsed++;
    // Update and draw each particle.
    particles.forEach((particle, index) => {
      const intensity = dataArray[index % bufferLength] || avgIntensity;
      const derivative = derivativeArray[index % bufferLength] || 0;
      particle.update(intensity, derivative, avgTimbre);
      particle.draw();
    });

    // Trigger a burst of particles every 200 frames if the intensity is high enough.
    if (timeElapsed % 200 === 0 && avgIntensity > 20) {
      particleExplosion(avgIntensity, avgTimbre);
    }

    requestAnimationFrame(draw);
  }
  draw();
}

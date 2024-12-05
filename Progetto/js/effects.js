--> per testarle gli ho fatto prendere in input direttamente il microfono
  
// DELAY

function delay () {
  navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(stream) {
  c = new AudioContext();
  c.resume();
  const mic = c.createMediaStreamSource(stream);
  
  const d = c.createDelay();
  d.delayTime.value = 0.5;
  dg = c.createGain();
  dg.gain.value = 0.5;
  mic.connect(d);
  d.connect(dg);
  dg.connect(d);
  d.connect(c.destination);
})
}

// REVERB

function createImpulse(context, dur, decay) {
  const sampleRate = context.sampleRate;
  const length = sampleRate * dur;
  const impulse = context.createBuffer(2, length, sampleRate);
  const impulseL = impulse.getChannelData(0);
  const impulseR = impulse.getChannelData(1);
  
  for (let i = 0; i < length; i++) {
    const n = length - i;
    impulseL[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    impulseR[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
  }
  return impulse;
}

function reverb () {
  navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(stream) {
  c = new AudioContext();
  c.resume();
  const mic = c.createMediaStreamSource(stream);
  const impulseBuffer = createImpulse(c, 2, 2);
  const r = c.createConvolver();
  r.buffer = impulseBuffer;
  mic.connect(r);
  r.connect(c.destination);
})
}


// SATURATION

function makeDistortionCurve(g) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = i * 2 / samples - 1;
    curve[i] = ((3 + g) * x * 20 * (Math.PI / 180)) / (Math.PI + g + Math.abs(x));
  }
  return curve;
}

function saturation() {
   navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(stream) {
  c = new AudioContext();
  c.resume();
  const mic = c.createMediaStreamSource(stream);
  const dist = c.createWaveShaper();
  dist.curve = makeDistortionCurve(500);
  dist.oversample = '4x';
  mic.connect(dist);
  dist.connect(c.destination);
   })
}


// LFO



function lfoeffect() {
navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(stream) {
  c = new AudioContext();
  c.resume();
  const mic = c.createMediaStreamSource(stream);
  lfo = c.createOscillator();
  lfo.frequency.value = 50;
  lfog = c.createGain();
  lfo.start();
  mic.connect(lfog);
  lfog.connect(c.destination);
  lfo.connect(lfog.gain);
})
}
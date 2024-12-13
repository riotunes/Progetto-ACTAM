c = new AudioContext

// DELAY

function delay_function (sound) {
  const d = c.createDelay();
  d.delayTime.value = 0.5;
  dg = c.createGain();
  dg.gain.value = 0.5;
  sound.connect(d);
  d.connect(dg);
  dg.connect(d);
  return d;
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

function reverb_function (sound) {
  const impulseBuffer = createImpulse(c, 2, 2);
  const r = c.createConvolver();
  r.buffer = impulseBuffer;
  sound.connect(r);
  return r;
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

function saturation_function(sound) {
  const dist = c.createWaveShaper();
  dist.curve = makeDistortionCurve(500);
  dist.oversample = '4x';
  sound.connect(dist);
  return dist;
}


// LFO

function lfoeffect_function(sound) {
  lfo = c.createOscillator();
  lfo.frequency.value = 50;
  lfog = c.createGain();
  lfo.start();
  sound.connect(lfog);
  lfo.connect(lfog.gain);
  return lfog;
}


const link_effects = {
  delay_function,
  createImpulse,
  reverb_function,
  saturation_function,
  makeDistortionCurve,
  lfoeffect_function
};

export default link_effects;

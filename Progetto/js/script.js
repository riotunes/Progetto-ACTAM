function recordinfo() {
    document.getElementById("help-window").innerHTML = "This is the record button! Press it to start and stop the recording of your sounds!";
}
function playinfo() {
  document.getElementById("help-window").innerHTML = "This is the play button! Press it to listen to your recording with the effects you chose!";
}
function stopinfo() {
  document.getElementById("help-window").innerHTML = "This is the stop button! Press it to stop the replay of your recording!";
}
function settingsinfo() {
  document.getElementById("help-window").innerHTML = "This is the settings button! Press it to access the setting menu and choose your audio input!";
}
function exportinfo() {
  document.getElementById("help-window").innerHTML = "This is the export button! Press it to export the sounds you recorded and share them with the world!";
}
function reverbinfo() {
  document.getElementById("help-window").innerHTML = "This is the reverb button! Press it to add a reverb to your sound! Double click on it to access the effect’s specific settings!";
}
function delayinfo() {
  document.getElementById("help-window").innerHTML = "This is the delay button! Press it to add a delay to your sound! Double click on it to access the effect’s specific settings!";
}
function saturatorinfo() {
  document.getElementById("help-window").innerHTML = "This is the saturator button! Press it to add saturation to your sound! Double click on it to access the effect’s specific settings!";
}
function lfoinfo() {
  document.getElementById("help-window").innerHTML = "This is the LFO button! Press it to add an LFO to your sound! Double click on it to access the effect’s specific settings!";
}


// Keep track of the currently open menu
let openMenu = null;

function toggleCurtain(menuId) {
  const menu = document.getElementById(menuId);
  
  // Close any previously open menu
  if (openMenu && openMenu !== menu) {
    openMenu.style.display = 'none';
  }

  // Toggle the current menu
  if (menu.style.display === 'block') {
    menu.style.display = 'none';
    openMenu = null; // No menu is open
  } else {
    menu.style.display = 'block';
    openMenu = menu; // Set the open menu
  }
}

// Close the menu if clicking outside
document.addEventListener('click', (event) => {
  if (openMenu && !openMenu.contains(event.target) && !event.target.matches('.effect-button')) {
    openMenu.style.display = 'none';
    openMenu = null; // No menu is open
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Select all buttons with the 'on' toggling behavior
  const toggleButtons = document.querySelectorAll('#record, #reverb, #delay, #saturator, #lfo');

  // Add click event listeners to toggle the "on" class
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      button.classList.toggle('on'); // Add or remove the "on" class
    });
  });
});


// EFFECTS

c = new AudioContext

// DELAY

function delay_function(sound) {
  const d = c.createDelay();
  d.delayTime.value = 0.5; // PAR
  dg = c.createGain();
  dg.gain.value = 0.5; // PAR
  sound.connect(d);
  d.connect(dg);
  dg.connect(d);
  return d;
}

// REVERB

function createImpulse(context, dur, decay) { // PAR 1 E 2
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

function reverb_function(sound) {
  const impulseBuffer = createImpulse(c, 2, 2);
  const r = c.createConvolver();
  r.buffer = impulseBuffer;
  sound.connect(r);
  return r;
}


// SATURATION

function makeDistortionCurve(g) { // PAR
  const samples = 44100;  // std
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
  dist.oversample = '4x'; // PAR
  sound.connect(dist);
  return dist;
}


// LFO



function lfoeffect_function(sound) {
  lfo = c.createOscillator();
  lfo.frequency.value = 50; // PAR
  lfog = c.createGain();
  lfo.start();
  sound.connect(lfog);
  lfo.connect(lfog.gain);
  return lfog;
}


// RECORD

let mediaRecorder;
let audioChunks = [];
let audioUrl;
let started = false; // serve perché il pulsante rec fa sia start che stop

const record = document.getElementById('record');
const play = document.getElementById('play')
let audio

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, {type: 'audio/wav' }); // che è un blob non l'ho ancora capito
        audioUrl = URL.createObjectURL(audioBlob);
        fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => c.decodeAudioData(arrayBuffer))
        .then(buffer => {
            audioBuffer = buffer; // a quanto pare bisogna fare un buffer per l'audio registrato
        });
        audioChunks = [];
    }
});

// funzione per la registrazione
startstop_function = function() {
    if(!started) {
        mediaRecorder.start();
        started = true;
        document.getElementById("help-window").innerHTML = "recording...";
    }
    else {
        mediaRecorder.stop();
        started = false;
        document.getElementById("help-window").innerHTML = audio recorded!";
    }
    
}


const effectButtons = document.querySelectorAll('#reverb, #delay, #saturator, #lfo');


// funzione per riprodurre, a seconda degli effetti selezionati
play_function = function() {
    source = c.createBufferSource();
    source.buffer = audioBuffer;
  
    let lastNode = source;
    effectButtons.forEach(effectButton => {
        if(effectButton.classList.contains('on')) {
             if(effectButton.id === 'delay'){
                lastNode = delay_functionlastNode);
            }
            else if(effectButton.id === 'reverb'){
                lastNode = reverb_function(lastNode);
            }
            else if(effectButton.id === 'saturator'){
                lastNode = saturation_function(lastNode);
            }
            else if(effectButton.id === 'lfo') {
                lastNode = lfoeffect_function(lastNode);
            }
        }
    })
    lastNode.connect(c.destination); // se tutti gli effetti sono spenti riproduce il segnale originale
    source.start();
}


record.onclick = startstop_function
play.onclick = play_function

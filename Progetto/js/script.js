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
  document.getElementById("help-window").innerHTML = "This is the settings button! Click it to access the setting menu and choose your audio input!";
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

// Apply settings logic
let midiInput
let micInput

function applySettings() {
  const midiInput = document.getElementById('midi-input').checked;
  const micInput = document.getElementById('mic-input').checked;

  if (midiInput) {
    console.log('MIDI input selected');
    alert('MIDI input selected');
    playMIDI(); // chiama la funzione dal file midi.js
  } else if (micInput) {
    console.log('Microphone input selected');
    alert('Audio input selected');
    playMic(); // chiama la funzione dal file mic.js
  } else {
    alert('Please select an input method!');
  }

  // Close the settings menu
  const settingsMenu = document.getElementById('settings-menu');
  settingsMenu.style.display = 'none';
  openMenu = null;
}

// Close the menu if clicking outside
document.addEventListener('click', (event) => {
  if (
    openMenu &&
    !openMenu.contains(event.target) &&
    !event.target.matches('.effect-button') &&
    !event.target.closest('#settings')
  ) {
    openMenu.style.display = 'none';
    openMenu = null;
  }
});

//Arming buttons
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

const c = new (window.AudioContext || window.webkitAudioContext)();
let delay_par1 = 0.5, delay_par2 = 0.5;
let dur = 2, decay = 2;
let g = 250;
let lfo_par1 = 50;
// DELAY

function delay_function(sound) {
  const d = c.createDelay();
  d.delayTime.value = delay_par1; // PAR
  const dg = c.createGain();
  dg.gain.value = delay_par2; // PAR
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
  const impulseBuffer = createImpulse(c, dur, decay);
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
    curve[i] = ((3 + g) * x * 20 * (Math.PI / 180)) / (Math.PI + g * Math.abs(x));
  }
  return curve;
}

function saturation_function(sound) {
  const dist = c.createWaveShaper();
  dist.curve = makeDistortionCurve(g);
  dist.oversample = '4x'; // PAR
  sound.connect(dist);
  return dist;
}


// LFO



function lfoeffect_function(sound) {
  const lfo = c.createOscillator();
  lfo.frequency.value = lfo_par1; // PAR
  const lfog = c.createGain();
  lfo.start();
  sound.connect(lfog);
  lfo.connect(lfog.gain);
  return lfog;
}
/* js/full.js */
document.addEventListener('DOMContentLoaded', function() {
  const fullScreenButton = document.getElementById('fullscreen');
  const canvas = document.getElementById('visualizer');
  const appContainer = document.querySelector('.app-container');

  function enterFullScreen() {
    if (canvas.requestFullscreen) {
      canvas.requestFullscreen();
    } else if (canvas.webkitRequestFullscreen) {
      canvas.webkitRequestFullscreen();
    } else if (canvas.msRequestFullscreen) {
      canvas.msRequestFullscreen();
    }
    appContainer.classList.add('fullscreen-mode');
  }

  function exitFullScreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    appContainer.classList.remove('fullscreen-mode');
  }

  if (fullScreenButton && canvas && appContainer) {
    fullScreenButton.addEventListener('click', function() {
      enterFullScreen();
    });
  }

  document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement) {
      appContainer.classList.remove('fullscreen-mode');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.fullscreenElement) {
      exitFullScreen();
    }
  });
});
/* js/keyboard.js */
document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('keydown', function(e) {
    // Ignore keystrokes when focused on inputs or textareas.
    const tagName = e.target.tagName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;

    // For debugging, you can uncomment the next line:
    // console.log('Key pressed:', e.code);

    // Spacebar triggers pause (simulate clicking the "stop" button)
    if (e.code === 'Space') {
      e.preventDefault(); // Prevent default scrolling behavior.
      const stopButton = document.getElementById('play');
      if (stopButton) {
        stopButton.click();
      }
    }

    // R key triggers record
    if (e.code === 'KeyR') {
      e.preventDefault();
      const recordButton = document.getElementById('record');
      if (recordButton) {
        recordButton.click();
      }
    }

    // F key triggers full screen mode
    if (e.code === 'KeyF') {
      e.preventDefault();
      const fullScreenButton = document.getElementById('fullscreen');
      if (fullScreenButton) {
        fullScreenButton.click();
      }
    }
  });
});

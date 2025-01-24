document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("visualizer") // Canvas dove disegniamo
  const ctx = canvas.getContext("2d") 

  canvas.width = window.innerWidth // Larghezza canvas = larghezza finestra
  canvas.height = window.innerHeight // Altezza canvas = altezza finestra

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth // Aggiorna larghezza canvas se finestra cambia
    canvas.height = window.innerHeight // Aggiorna altezza canvas se finestra cambia
  })

  // Chiede accesso al microfono
  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)() // Audio context per leggere audio
    const analyser = audioContext.createAnalyser() // Analyser 
    analyser.fftSize = 512 

    const source = audioContext.createMediaStreamSource(stream) // Microfono 
    source.connect(analyser) // Analyser legge il segnale dal microfono

    const bufferLength = analyser.frequencyBinCount // Numero di frequenze analizzate
    const dataArray = new Uint8Array(bufferLength) // Dati del segnale audio attuale
    const prevDataArray = new Uint8Array(bufferLength) // Dati del segnale audio precedente (per confronti)

    let timeElapsed = 0 // Contatore del tempo passato

    // Classe delle palle
    class Particle {
      constructor(x, y, size, hue, speedFactor) {
        this.x = x // Posizione iniziale in larghezza
        this.y = y // Posizione iniziale in altezza
        this.size = size // Grandezza iniziale della particella
        this.baseSize = size // Grandezza di partenza, per non farla mai troppo piccola
        this.hue = hue // Colore della particella 
        this.opacity = Math.random() // Quanto è trasparente la particella
        this.speedFactor = speedFactor // Velocità base della particella
        this.speedX = (Math.random() - 0.5) * speedFactor // Velocità in orizzontale
        this.speedY = (Math.random() - 0.5) * speedFactor // Velocità in verticale
        this.angle = Math.random() * Math.PI * 2 // Rotazione iniziale della particella
        this.rotationSpeed = (Math.random() - 0.5) * 0.3 // Velocità di rotazione
      }

      // Funzione per aggiornare la particella
      update(intensity, derivative, timbre) {
        // Cambia grandezza della particella in base a intensità, variazione (derivative) e timbro
        const scaledIntensity = Math.log1p(intensity) * 10 // Logaritmo dell'intensità per ridurre valori troppo alti
        const sizeChange = scaledIntensity / 10 + derivative / 20 + timbre * 1.5 // Effetto combinato: intensità ingrandisce, derivative rende più reattivo, timbro aggiunge movimento

        this.size = Math.max(this.baseSize + sizeChange, 5) // Assicura che la particella non diventi troppo piccola

        // Movimento della particella influenzato da intensità e timbro
        this.x += this.speedX * (scaledIntensity / 100 + timbre / 5) // Più intensità/timbro = più velocità
        this.y += this.speedY * (scaledIntensity / 100 + timbre / 5)

        this.angle += this.rotationSpeed // Rotazione costante

        // Se la particella esce dallo schermo, ricompare dall'altro lato
        if (this.x < 0) this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.y < 0) this.y = canvas.height
        if (this.y > canvas.height) this.y = 0
      }

      // Funzione per disegnare la particella
      draw() {
        ctx.save() // Salva stato attuale del pennello
        ctx.translate(this.x, this.y) // Sposta pennello dove c'è la particella
        ctx.rotate(this.angle) // Ruota il pennello (particella ruotata)

        // Sfumatura del colore basata sul timbro e colore della particella
        const gradient = ctx.createRadialGradient(0, 0, this.size * 0.2, 0, 0, this.size)
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, ${this.opacity})`) // Parte centrale luminosa
        gradient.addColorStop(1, `hsla(${this.hue}, 80%, 30%, 0)`) // Bordo sfumato

        ctx.fillStyle = gradient // Applica colore sfumato
        ctx.beginPath()
        ctx.arc(0, 0, this.size, 0, Math.PI * 2) // Disegna cerchio
        ctx.fill() // Riempi cerchio con colore
        ctx.restore() // Ripristina stato precedente
      }
    }

    const particles = [] // Lista di tutte le particelle
    const particleCount = 400 // Quante particelle creare

    // Crea particelle con posizioni, grandezze e colori casuali
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width // Posizione X casuale
      const y = Math.random() * canvas.height // Posizione Y casuale
      const size = Math.random() * 20 + 5 // Grandezza casuale
      const hue = Math.random() * 360 // Colore casuale
      const speedFactor = Math.random() * 3 + 1 // Velocità casuale
      particles.push(new Particle(x, y, size, hue, speedFactor)) // Aggiungi particella alla lista
    }

    // Funzione che aggiorna e disegna tutto continuamente
    function draw() {
      analyser.getByteFrequencyData(dataArray) // Ottieni dati dello spettro audio attuale

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)" // Sfondo trasparente per effetto scia
      ctx.fillRect(0, 0, canvas.width, canvas.height) // Riempie il canvas per "pulire"

      const avgIntensity = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength // Intensità media del suono
      const avgTimbre = dataArray.reduce(
        (sum, value, index) => sum + value * index, 0
      ) / (bufferLength * 128) // Timbro medio (peso del suono nelle frequenze alte)

      const derivativeArray = dataArray.map((value, index) => {
        const prevValue = prevDataArray[index] || 0 // Frequenza precedente
        return value - prevValue // Differenza tra frequenze attuale e precedente
      })

      prevDataArray.set(dataArray) // Salva dati correnti per il prossimo ciclo

      timeElapsed += 1 // Incrementa il tempo passato

      particles.forEach((particle, index) => {
        const intensity = dataArray[index % bufferLength] // Prendi intensità per particella
        const derivative = derivativeArray[index % bufferLength] // Cambiamento per particella
        particle.update(intensity || avgIntensity, derivative || 0, avgTimbre || 0) // Aggiorna particella
        particle.draw() // Disegna particella
      })

      if (timeElapsed % 200 === 0 && avgIntensity > 20) { // Ogni tot tempo crea un'esplosione
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * canvas.width // Posizione X esplosione
          const y = Math.random() * canvas.height // Posizione Y esplosione
          const size = Math.random() * 30 + 10 // Grandezza esplosione
          const hue = Math.random() * 360 // Colore esplosione
          const burstParticle = new Particle(x, y, size, hue, 5) // Particella esplosione
          burstParticle.update(avgIntensity * 2, 0, avgTimbre) // Aggiorna velocemente
          burstParticle.draw() // Disegna esplosione
        }
      }

      requestAnimationFrame(draw) // Richiama animazione continuamente
    }

    draw() // Parte tutto
  }).catch((err) => {
    console.error("Microfono negato", err) // Se microfono non funziona
  })
})

//INTERFACCIA

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
  document.getElementById("help-window").innerHTML = "This is the settings button! Double click it to access the setting menu and choose your audio input!";
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
function applySettings() {
  const midiInput = document.getElementById('midi-input').checked;
  const micInput = document.getElementById('mic-input').checked;

  if (midiInput) {
    console.log('MIDI input selected');
    alert('MIDI input selected');
  } else if (micInput) {
    console.log('Microphone input selected');
    alert('Microphone input selected');
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
  if (openMenu && !openMenu.contains(event.target) && !event.target.matches('.effect-button')) {
    openMenu.style.display = 'none';
    openMenu = null; // No menu is open
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

// RECORD

document.addEventListener('DOMContentLoaded', () => {
  let mediaRecorder;
  let audioChunks = [];
  let audioBuffer;
  let audioUrl;
  let started = false; // serve perché il pulsante rec fa sia start che stop

  const recordButton = document.getElementById('record');
  const playButton = document.getElementById('play');
  const stopButton = document.getElementById('stop');
  let audio;
  let startTime;
  let currentTime = 0;

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
  const effectButtons = document.querySelectorAll('#reverb, #delay, #saturator, #lfo');

  // funzione per riprodurre, a seconda degli effetti selezionati
  function startstop_function(event) {

    button = event.target
    if(!button.recordingStated) {
        mediaRecorder.start();
        button.recordingStated = true;
        document.getElementById("help-window").innerHTML = "recording...";
    }
    else {
        mediaRecorder.stop();
        button.recordingStated = false;
        document.getElementById("help-window").innerHTML = "audio recorded!";
    }
  }
  recordButton.recordingStated = false
  recordButton.onclick = startstop_function

  // funzione per la registrazione
  function play_function() {
    source = c.createBufferSource();
    source.buffer = audioBuffer;
  
    let lastNode = source;
    effectButtons.forEach(effectButton => {
        if(effectButton.classList.contains('on')) {
             if(effectButton.id === 'delay'){
                lastNode = delay_function(lastNode);
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
    
    if (currentTime >= audioBuffer.duration) {
      currentTime = 0; 
    }

    startTime = c.currentTime - currentTime; // tempo d'inizio è tempo attuale assoluto - tempo attuale di riproduzione
    source.start(0, currentTime);
  }

  function pause_function() {
    currentTime += c.currentTime - startTime;
    source.stop();
  }
  
    playButton.onclick = play_function;
    stopButton.onclick = pause_function;
});

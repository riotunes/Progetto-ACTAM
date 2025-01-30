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
  })
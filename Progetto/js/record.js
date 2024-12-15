let mediaRecorder;
let audioChunks = [];
let audioUrl;
let started = false;

const record = document.getElementById('record');
const play = document.getElementById('play')
let audio

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, {type: 'audio/wav' }); // che è un blob non l'ho ancora capito bene vabbè
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
      document.getElementById("help-window").innerHTML = "audio recorded!";
    }
    
}


const effectButtons = document.querySelectorAll('#reverb, #delay, #saturator, #lfo');

// funzione per riprodurre l'audio a seconda degli effetti selezionati
play_function = function() {
    source = c.createBufferSource();
    source.buffer = audioBuffer;
    let lastNode = source;
    effectButtons.forEach(effectButton => {
        if(effectButton.classList.contains('on')) {
             if(effectButton.id === 'delay'){
                lastNode = delay_function(lastNode);
            }
            if(effectButton.id === 'reverb'){
                lastNode = reverb_function(lastNode);
            }
            if(effectButton.id === 'saturator'){
                lastNode = saturation_function(lastNode);
            }
            if(effectButton.id === 'lfo') {
                lastNode = lfoeffect_function(lastNode);
            }
        }
    })
    lastNode.connect(c.destination); // se tutti gli effetti sono spenti riproduce il segnale originale
    source.start();
}

record.onclick = startstop_function
play.onclick = play_function

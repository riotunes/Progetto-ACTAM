let mediaRecorder;
let audioChunks = [];
let audioUrl;
let started = false;

const record = document.getElementById('record');
const play = document.getElementById('play')
const audioPlayback = document.getElementById('audioPlayback');

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, {type: 'audio/wav' });
        audioUrl = URL.createObjectURL(audioBlob);
        audioPlayback.src = audioUrl;
        audioChunks = [];
    }
});

startstop_function = function() {
    if(!started) {
        mediaRecorder.start();
        started = true;
        record.classList.toggle("on");
    }
    else {
        mediaRecorder.stop();
        started = false;
        record.classList.toggle("on");
    }
    
}

play_function = function() {
    audioPlayback.play();
}

record.onclick = startstop_function
play.onclick = play_function

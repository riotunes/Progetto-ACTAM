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
        const audioBlob = new Blob(audioChunks, {type: 'audio/wav' });
        audioUrl = URL.createObjectURL(audioBlob);
        audio = new Audio(audioUrl);
        audioChunks = [];
    }
});

startstop_function = function() {
    if(!started) {
        mediaRecorder.start();
        started = true;
        record.classList.toggle("on");
        document.getElementById("help-window").innerHTML = "recording...";
    }
    else {
        mediaRecorder.stop();
        started = false;
        record.classList.toggle("on");
        document.getElementById("help-window").innerHTML = "audio recorded!";
    }
    
}

play_function = function() {
    audio.play();
}

record.onclick = startstop_function
play.onclick = play_function

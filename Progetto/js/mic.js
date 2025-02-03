// mic.js – INPUT: MICROFONO
function playMic() {
    let mediaRecorder;
    let audioChunks = [];
    let audioBuffer;
    let audioUrl;
    let started = false; // used to toggle record button state
  
    const recordButton = document.getElementById('record');
    const playButton   = document.getElementById('play');
    const stopButton   = document.getElementById('stop');
    let startTime;
    let currentTime = 0;
    let source;      // will hold the BufferSource for playback
    let micSource;   // the live microphone source
    let cancelVisuals; // function to cancel the current visualizer
    let isPlayingRecording = false; // flag for which audio is driving the visuals
  
    // Assume an AudioContext "c" exists, e.g.:
    // const c = new AudioContext();
  
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      // Set up the media recorder for recording audio.
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(audioBlob);
        fetch(audioUrl)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => c.decodeAudioData(arrayBuffer))
          .then(buffer => {
            audioBuffer = buffer;
          });
        audioChunks = [];
      };
  
      // Create the mic source for real–time processing.
      micSource = c.createMediaStreamSource(stream);
      // Start visualizing the live mic input.
      cancelVisuals = visualizeSound(micSource, 10, 1);
    });
  
    // Effect buttons, if any.
    const effectButtons = document.querySelectorAll('#reverb, #delay, #saturator, #lfo');
  
    // Toggle recording on/off.
    function startstop_function(event) {
      const button = event.target;
      if (!button.recordingStated) {
        mediaRecorder.start();
        button.recordingStated = true;
        document.getElementById("help-window").innerHTML = "recording...";
      } else {
        mediaRecorder.stop();
        button.recordingStated = false;
        document.getElementById("help-window").innerHTML = "audio recorded!";
      }
    }
    recordButton.recordingStated = false;
    recordButton.onclick = startstop_function;
  
    // Play the recorded audio with any selected effects.
    function play_function() {
      if (!audioBuffer) {
        document.getElementById("help-window").innerHTML = "No audio recorded yet!";
        return;
      }
      // Cancel the mic visualization before starting playback.
      if (cancelVisuals) {
        cancelVisuals();
      }
      source = c.createBufferSource();
      source.buffer = audioBuffer;
  
      // *** New: Automatically stop (simulate stop button) when playback ends ***
      source.onended = function() {
        // Call pause_function automatically when playback finishes.
        pause_function();
      };
  
      // Apply any selected effects.
      let lastNode = source;
      effectButtons.forEach(effectButton => {
        if (effectButton.classList.contains('on')) {
          if (effectButton.id === 'delay') {
            lastNode = delay_function(lastNode);
          } else if (effectButton.id === 'reverb') {
            lastNode = reverb_function(lastNode);
          } else if (effectButton.id === 'saturator') {
            lastNode = saturation_function(lastNode);
          } else if (effectButton.id === 'lfo') {
            lastNode = lfoeffect_function(lastNode);
          }
        }
      });
      lastNode.connect(c.destination);
  
      // Reset currentTime if needed.
      if (currentTime >= audioBuffer.duration) {
        currentTime = 0;
      }
      startTime = c.currentTime - currentTime;
      source.start(0, currentTime);
      isPlayingRecording = true;
  
      // Visualize the playback audio.
      cancelVisuals = visualizeSound(lastNode, 10, 1);
    }
  
    // Pause the recording playback and resume mic input visualization.
    function pause_function() {
      if (!isPlayingRecording) return;
  
      // Try to stop the source (if it's still playing).
      try {
        source.stop();
      } catch (e) {
        // It might already be ended.
      }
      currentTime += c.currentTime - startTime;
      isPlayingRecording = false;
  
      // Cancel the playback visualization.
      if (cancelVisuals) {
        cancelVisuals();
      }
      // Resume visualization of the live mic input.
      if (micSource) {
        cancelVisuals = visualizeSound(micSource, 10, 1);
      }
    }
  
    playButton.onclick = play_function;
    stopButton.onclick = pause_function;
  }
  

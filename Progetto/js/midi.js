// midi.js – INPUT: MIDI DA TASTIERA
function playMIDI() {
    // Make sure the browser supports the Web MIDI API
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else {
      alert("Web MIDI API not supported.");
    }
  
    // Grab the record, play, and stop buttons (assumed to be in your HTML)
    const recordButton = document.getElementById('record');
    const playButton   = document.getElementById('play');
    const stopButton   = document.getElementById('stop');
    // Get any effect buttons
    const effectButtons = document.querySelectorAll('#reverb, #delay, #saturator, #lfo');
  
    // ----- Variables for Recording/Playback -----
    let mediaRecorder;
    let audioChunks = [];
    let audioBuffer;
    let audioUrl;
    let source;           // used for playback of the recorded audio
    let startTime;
    let currentTime = 0;
    let isPlayingRecording = false;
    let cancelVisuals;    // to cancel any running visualizer
  
    // Create a MediaStreamDestination node to capture MIDI output
    const recordDestination = c.createMediaStreamDestination();
    
    // Set up a MediaRecorder on the destination's stream
    mediaRecorder = new MediaRecorder(recordDestination.stream);
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      audioUrl = URL.createObjectURL(audioBlob);
      // Decode the recorded blob into an AudioBuffer for playback
      fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => c.decodeAudioData(arrayBuffer))
        .then(buffer => {
          audioBuffer = buffer;
        });
      audioChunks = [];
    };
  
    // ----- Recording Button Functionality -----
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
  
    // ----- Playback Functionality for the Recorded Audio -----
    function play_function() {
      if (!audioBuffer) {
        document.getElementById("help-window").innerHTML = "No audio recorded yet!";
        return;
      }
      // Cancel any current visualization (if running)
      if (cancelVisuals) {
        cancelVisuals();
      }
      source = c.createBufferSource();
      source.buffer = audioBuffer;
      // Automatically stop (simulate stop button) when playback ends.
      source.onended = function() {
        pause_function();
      };
  
      // Apply any selected effects to the playback
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
  
      // Visualize the playback audio using the enlarged-ball settings (MIDI mode)
      cancelVisuals = visualizeSound(lastNode, 1, 60);
    }
  
    // Pause the playback (simulate the Stop button)
    function pause_function() {
      if (!isPlayingRecording) return;
      try {
        source.stop();
      } catch (e) {
        // It may have already ended.
      }
      currentTime += c.currentTime - startTime;
      isPlayingRecording = false;
      if (cancelVisuals) {
        cancelVisuals();
      }
      // (Optionally, you can resume a live visualization here.)
    }
  
    playButton.onclick = play_function;
    stopButton.onclick  = pause_function;
  
    // ----- MIDI Setup -----
    function onMIDISuccess(midiAccess) {
      midiAccess.inputs.forEach(function(input) {
        input.onmidimessage = onMIDIMessage;
      });
    }
    function onMIDIFailure() {
      console.error("Could not access MIDI ports.");
    }
  
    // Create a single oscillator for MIDI synthesis (monophonic)
    const o = c.createOscillator();
    o.start();
  
    // Convert a MIDI note number to frequency (440Hz = A4, note 69)
    function convertMIDIToFrequency(note) {
      return Math.pow(2, (note - 69) / 12) * 440;
    }
  
    // Create an envelope–controlled gain node for a note.
    function sourcewEnvelope(note, velocity) {
      const g = c.createGain();
      // Set the oscillator frequency according to the MIDI note
      o.frequency.value = convertMIDIToFrequency(note);
      // Route the oscillator through the gain envelope:
      o.connect(g);
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(1, c.currentTime + 0.1);
      g.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
      return g;
    }
  
    // Handle incoming MIDI messages.
    function onMIDIMessage(event) {
      const [command, note, velocity] = event.data;
      let lastNode;
      if (command === 144 && velocity > 0) {
        // For note-on events, create a note with an envelope.
        lastNode = sourcewEnvelope(note, velocity);
        // Immediately connect the note’s output to our recording destination.
        lastNode.connect(recordDestination);
      }
      // Process any effect buttons that are active.
      effectButtons.forEach(effectButton => {
        if (effectButton.classList.contains('on')) {
          if (effectButton.id === 'delay') {
            lastNode = delay_function(lastNode);
          } else if (effectButton.id === 'reverb') {
            lastNode = reverb_function(lastNode);
          } else if (effectButton.id === 'saturator') {
            // Example: add an extra oscillator for a “saturator” effect.
            const sq = c.createOscillator();
            sq.type = 'square';
            sq.frequency.setValueAtTime(o.frequency.value, c.currentTime);
            const sqg = c.createGain();
            sqg.gain.setValueAtTime(0, c.currentTime);
            sqg.gain.linearRampToValueAtTime(1, c.currentTime + 0.1);
            sqg.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
            sq.connect(sqg);
            lastNode = sqg;
            sq.start();
          } else if (effectButton.id === 'lfo') {
            lastNode = lfoeffect_function(lastNode);
          }
        }
      });
      // Route the final node both to the speakers and to the recorder.
      lastNode.connect(c.destination);
      lastNode.connect(recordDestination);
      // Visualize the sound for feedback using the enlarged-ball settings (MIDI mode)
      visualizeSound(lastNode, 1, 60);
    }
  }
  

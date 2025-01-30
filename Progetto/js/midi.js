document.addEventListener('DOMContentLoaded', () => {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    }
    else {
        alert("Web MIDI API non supportata dal tuo browser.");
    }
    
    function onMIDISuccess(midiAccess) {
        midiAccess.inputs.forEach(function(input) {
            input.onmidimessage = onMIDIMessage;
        });
    }

    function onMIDIFailure() {
        console.error("Impossibile accedere alle porte MIDI.");
    }

    const effectButtons = document.querySelectorAll('#reverb, #delay, #saturator, #lfo');
    let source
    const o = c.createOscillator();

    function sourcewEnvelope(note, velocity) {
        g = c.createGain();
        o.frequency.value = convertMIDIToFrequency(note);
        o.connect(g);
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(1, c.currentTime + 0.1);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 0.1 + 0.2);
        source = g
        return source
    }

    function convertMIDIToFrequency(note) {
        return Math.pow(2, (note - 69) / 12) * 440; // La nota 69 corrisponde al La4 (440Hz)
    }

    function onMIDIMessage(event) {
        const [command, note, velocity] = event.data;
        if (command === 144 && velocity > 0) {
            lastNode = sourcewEnvelope(note, velocity);
        }
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
        lastNode.connect(c.destination);
        o.start()
    }
});
// RISPOSTA GRAFICA

function visualizeSound(node) {
  const canvas = document.getElementById("visualizer") // Canvas dove disegniamo
  const ctx = canvas.getContext("2d") 

  canvas.width = window.innerWidth // Larghezza canvas = larghezza finestra
  canvas.height = window.innerHeight // Altezza canvas = altezza finestra

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth // Aggiorna larghezza canvas se finestra cambia
    canvas.height = window.innerHeight // Aggiorna altezza canvas se finestra cambia
  })

  const analyser = c.createAnalyser() // Analyser 
  analyser.fftSize = 512 
  node.connect(analyser) // Analyser legge il segnale dal lastNode

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
}
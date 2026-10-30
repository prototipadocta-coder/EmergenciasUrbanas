/**
 * Web Audio API synthesizer for realistic machinery, rain, radio and UI sound effects
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVol: number = 0.8;
  private sfxVol: number = 0.8;
  private ambientVol: number = 0.6;
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, sfx: number, ambient: number, muted: boolean = false) {
    this.masterVol = master / 100;
    this.sfxVol = sfx / 100;
    this.ambientVol = ambient / 100;
    this.isMuted = muted;

    if (this.rainGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.masterVol * this.ambientVol * 0.35;
      this.rainGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }
    if (this.engineGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.masterVol * this.sfxVol * 0.25;
      this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }
  }

  // Play metallic UI hover beep
  public playHover() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(720, this.ctx.currentTime + 0.04);

      const vol = this.masterVol * this.sfxVol * 0.15;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignore audio error if gesture blocked
    }
  }

  // Play heavy metallic button click
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Click thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      const vol = this.masterVol * this.sfxVol * 0.4;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }

  // Play radio CB chirp
  public playRadioChirp() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.setValueAtTime(1900, now + 0.04);
      osc.frequency.setValueAtTime(1200, now + 0.08);

      const vol = this.masterVol * this.sfxVol * 0.18;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }

  // Play hydraulic piston hiss
  public playHydraulics() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.35);
      filter.Q.value = 3.5;

      const gain = this.ctx.createGain();
      const vol = this.masterVol * this.sfxVol * 0.3;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Ignore
    }
  }

  // Play rock / debris impact
  public playRockImpact() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Heavy low frequency boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 450;

      const vol = this.masterVol * this.sfxVol * 0.45;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.28);
    } catch {
      // Ignore
    }
  }

  // Play authentic locomotive train air horn (Nathan K5LA 5-chime chord)
  public playTrainHorn() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 1.4;

      // Authentic train horn chord frequencies (D#4, F#4, G#4, B4, D#5)
      const chimes = [311.13, 369.99, 415.30, 493.88, 622.25];

      const masterGain = this.ctx.createGain();
      const vol = this.masterVol * this.sfxVol * 0.55;
      
      // Fast pneumatic attack, sustained roar, gradual air dump release
      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.linearRampToValueAtTime(vol, now + 0.05);
      masterGain.gain.setValueAtTime(vol, now + duration - 0.3);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Low-pass filter for massive brass air cavity resonance
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.linearRampToValueAtTime(2200, now + 0.1);
      filter.frequency.linearRampToValueAtTime(1400, now + duration);

      masterGain.connect(this.ctx.destination);
      filter.connect(masterGain);

      chimes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const chimeGain = this.ctx!.createGain();

        // Rich harmonic sawtooth with slight micro-detuning
        osc.type = 'sawtooth';
        const detune = (idx - 2) * 5 + (Math.random() * 4 - 2);
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);

        // Lower chimes slightly louder than high ones
        const chimeVol = 0.22 - idx * 0.02;
        chimeGain.gain.setValueAtTime(chimeVol, now);

        osc.connect(chimeGain);
        chimeGain.connect(filter);

        osc.start(now);
        osc.stop(now + duration);
      });

      // Air hiss / pneumatic release noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1200;
      noiseFilter.Q.value = 2.0;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.setValueAtTime(vol * 0.15, now + duration - 0.4);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseSource.start(now + duration - 0.4);
      noiseSource.stop(now + duration + 0.1);
    } catch {
      // Ignore
    }
  }

  // Play heavy machinery pneumatic gear shift sound
  public playGearShift() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Mechanical metal clack + pneumatic air release
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.value = 600;

      const vol = this.masterVol * this.sfxVol * 0.4;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);

      // Pneumatic hiss chirp
      const pOsc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      pOsc.type = 'sawtooth';
      pOsc.frequency.setValueAtTime(800, now + 0.02);
      pOsc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

      pGain.gain.setValueAtTime(0.001, now);
      pGain.gain.setValueAtTime(vol * 0.35, now + 0.02);
      pGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      pOsc.connect(pGain);
      pGain.connect(this.ctx.destination);

      pOsc.start(now + 0.02);
      pOsc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }

  // Play heavy diesel engine compression brake (Jake Brake / Freno Motor)
  public playEngineBrake() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 0.55;

      // Pulse oscillator for compression release clicks
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Deep compression cylinder pulse
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.linearRampToValueAtTime(38, now + duration);

      // Lowpass rumble filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.linearRampToValueAtTime(300, now + duration);

      // Rapid amplitude modulation (staccato jake brake chop)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(26, now); // 26 chops per second
      lfoGain.gain.setValueAtTime(0.4, now);

      const vol = this.masterVol * this.sfxVol * 0.45;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.linearRampToValueAtTime(vol * 0.8, now + duration - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      // Decompression air hiss burst
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * (i % 800 < 300 ? 1 : 0.2);
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.value = 850;
      nFilter.Q.value = 1.8;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(vol * 0.25, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  // Play industrial reverse beeper
  public playReverseBeep() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1250, now);

      const vol = this.masterVol * this.sfxVol * 0.25;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.setValueAtTime(vol, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  // Play heavy truck horn / siren
  public playHorn() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(320, now);
      osc2.frequency.setValueAtTime(380, now);

      const vol = this.masterVol * this.sfxVol * 0.35;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {
      // Ignore
    }
  }

  // Play emergency tow truck siren sweep
  public playSiren() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Two-tone rising wail
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.25);
      osc.frequency.linearRampToValueAtTime(650, now + 0.5);

      const vol = this.masterVol * this.sfxVol * 0.28;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.55);
    } catch {
      // Ignore
    }
  }

  // Play mechanical winch cable ratcheting sound
  public playWinch() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      for (let i = 0; i < 4; i++) {
        const clickTime = now + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(1100 + i * 60, clickTime);
        osc.frequency.exponentialRampToValueAtTime(200, clickTime + 0.04);

        const vol = this.masterVol * this.sfxVol * 0.2;
        gain.gain.setValueAtTime(vol, clickTime);
        gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(clickTime);
        osc.stop(clickTime + 0.04);
      }
    } catch {
      // Ignore
    }
  }

  // Play cheerful rescue confirmation chime
  public playSuccessRescue() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        const noteTime = now + idx * 0.1;
        const vol = this.masterVol * this.sfxVol * 0.3;
        gain.gain.setValueAtTime(vol, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  // Play kinetic energy shield activation / powerup sound
  public playShieldActivate() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Resonant rising frequency sweep + electric hum
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.35);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
      filter.Q.value = 4.0;

      const vol = this.masterVol * this.sfxVol * 0.45;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);

      // Secondary shimmer chime
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(880, now + 0.05);
      chime.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
      chimeGain.gain.setValueAtTime(vol * 0.5, now + 0.05);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      chime.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chime.start(now + 0.05);
      chime.stop(now + 0.4);
    } catch {
      // Ignore
    }
  }

  // Play kinetic shield boulder deflection (electric repulse boom)
  public playShieldDeflect() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.18);

      const vol = this.masterVol * this.sfxVol * 0.5;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  // Play shield battery / powerup pickup sound
  public playShieldPickup() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const noteTime = now + idx * 0.06;
        const vol = this.masterVol * this.sfxVol * 0.35;
        gain.gain.setValueAtTime(vol, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });
    } catch {
      // Ignore
    }
  }

  // Toggle ambient rain sound loop
  public startAmbientRain() {
    if (this.rainNode || this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02; // Pink-ish noise
        lastOut = data[i];
      }

      this.rainNode = this.ctx.createBufferSource();
      this.rainNode.buffer = buffer;
      this.rainNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;

      this.rainGain = this.ctx.createGain();
      const vol = this.masterVol * this.ambientVol * 0.3;
      this.rainGain.gain.setValueAtTime(vol, this.ctx.currentTime);

      this.rainNode.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);

      this.rainNode.start();
    } catch {
      // Ignore
    }
  }

  public stopAmbientRain() {
    if (this.rainNode) {
      try {
        this.rainNode.stop();
        this.rainNode.disconnect();
      } catch {
        // Ignore
      }
      this.rainNode = null;
      this.rainGain = null;
    }
  }
}

export const sound = new SoundEngine();

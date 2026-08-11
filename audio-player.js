/**
 * Romantic Audio Player & Sound Generator using Web Audio API
 * Provides ambient romantic background music and sound effects (kisses, pop, chime)
 */
class RomanticAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.volume = 0.3;
    this.intervalId = null;
    this.noteStep = 0;
    
    // Pentatonic romantic chord progression frequencies (C major / A minor romantic scale)
    this.notes = [
      261.63, 329.63, 392.00, 493.88, 523.25, // C4, E4, G4, B4, C5
      587.33, 659.25, 783.99, 880.00, 987.77, // D5, E5, G5, A5, B5
      1046.50                                  // C6
    ];

    this.chords = [
      [261.63, 329.63, 392.00, 493.88], // C maj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 349.23], // F maj7
      [196.00, 246.94, 293.66, 392.00]  // G7
    ];
  }

  initCtx() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playMelodyNote() {
    if (!this.isPlaying || !this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Soft sine wave for dreamy music box tone
      osc.type = 'sine';

      // Pick melodic note
      const noteIndex = (this.noteStep + Math.floor(Math.random() * 3)) % this.notes.length;
      osc.frequency.setValueAtTime(this.notes[noteIndex], now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 2.6);

      // Play soft bass chord every 8 steps
      if (this.noteStep % 4 === 0) {
        const chordIndex = Math.floor(this.noteStep / 4) % this.chords.length;
        const chord = this.chords[chordIndex];
        chord.forEach(freq => {
          const chordOsc = this.audioCtx.createOscillator();
          const chordGain = this.audioCtx.createGain();
          chordOsc.type = 'triangle';
          chordOsc.frequency.setValueAtTime(freq / 2, now);
          chordGain.gain.setValueAtTime(0, now);
          chordGain.gain.linearRampToValueAtTime(this.volume * 0.08, now + 0.3);
          chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
          chordOsc.connect(chordGain);
          chordGain.connect(this.audioCtx.destination);
          chordOsc.start(now);
          chordOsc.stop(now + 3.6);
        });
      }

      this.noteStep = (this.noteStep + 1) % 32;
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  togglePlay() {
    this.initCtx();
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.playMelodyNote();
      this.intervalId = setInterval(() => this.playMelodyNote(), 750);
      this.startMusicNotesEffect();
    } else {
      if (this.intervalId) clearInterval(this.intervalId);
      this.stopMusicNotesEffect();
    }
    return this.isPlaying;
  }

  setVolume(vol) {
    this.volume = parseFloat(vol);
  }

  // Play sound effect for Kiss 💋
  playKissSound() {
    this.initCtx();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // Play sound effect for Hug 🫂 / Save
  playChimeSound() {
    this.initCtx();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2 * this.volume, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch (e) {}
  }

  startMusicNotesEffect() {
    if (this.musicNotesInterval) return;
    const symbols = ['🎵', '🎶', '🎼', '💖', '✨'];
    this.musicNotesInterval = setInterval(() => {
      if (!this.isPlaying) return;
      const note = document.createElement('div');
      note.className = 'floating-music-note';
      note.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      note.style.left = (Math.random() * 80 + 10) + 'vw';
      note.style.bottom = '20px';
      note.style.fontSize = (Math.random() * 12 + 18) + 'px';
      document.body.appendChild(note);
      setTimeout(() => note.remove(), 4000);
    }, 1500);
  }

  stopMusicNotesEffect() {
    if (this.musicNotesInterval) {
      clearInterval(this.musicNotesInterval);
      this.musicNotesInterval = null;
    }
  }
}

export const audioEngine = new RomanticAudioEngine();

// Auto setup music player widget UI if container exists or create dynamically
export function initMusicPlayerWidget() {
  if (document.getElementById('musicPlayerWidget')) return;

  const widget = document.createElement('div');
  widget.id = 'musicPlayerWidget';
  widget.className = 'music-player-widget';
  widget.innerHTML = `
    <button id="musicToggleBtn" class="music-toggle-btn" title="Toggle Romantic Ambiance Music">
      <span class="music-icon">🎵</span>
      <span class="music-text">Romantic Music</span>
    </button>
    <div class="music-controls-popover">
      <label>Volume:
        <input id="musicVolumeSlider" type="range" min="0" max="1" step="0.05" value="0.3" />
      </label>
    </div>
  `;
  document.body.appendChild(widget);

  const toggleBtn = document.getElementById('musicToggleBtn');
  const volumeSlider = document.getElementById('musicVolumeSlider');

  toggleBtn.addEventListener('click', () => {
    const playing = audioEngine.togglePlay();
    toggleBtn.classList.toggle('playing', playing);
    toggleBtn.querySelector('.music-icon').textContent = playing ? '🎶' : '🎵';
  });

  volumeSlider.addEventListener('input', (e) => {
    audioEngine.setVolume(e.target.value);
  });
}

// Auto initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPlayerWidget);
} else {
  initMusicPlayerWidget();
}

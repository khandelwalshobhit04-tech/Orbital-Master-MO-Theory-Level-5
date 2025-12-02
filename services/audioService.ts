
export class AudioService {
    private context: AudioContext | null = null;
    private masterGain: GainNode | null = null;
  
    private getContext() {
      if (!this.context) {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3; // Master volume
        this.masterGain.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
      return this.context;
    }
  
    private createOscillator(type: OscillatorType, freq: number, duration: number, startTime: number = 0) {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      return { osc, gain, ctx };
    }
  
    playOrbitalAdd() {
      const { osc, gain, ctx } = this.createOscillator('sine', 600, 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
  
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  
    playOrbitalRemove() {
      const { osc, gain, ctx } = this.createOscillator('sine', 400, 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
  
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  
    playSuccess() {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      
      // Arpeggio
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        const startTime = now + i * 0.08;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    }
  
    playError() {
      const { osc, gain, ctx } = this.createOscillator('sawtooth', 150, 0.3);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
  
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  
    playLimitReached() {
      const { osc, gain, ctx } = this.createOscillator('square', 200, 0.15);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.15);
  
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  
    playUndo() {
      const { osc, gain, ctx } = this.createOscillator('sine', 200, 0.2);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.2);
  
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }

    playSwitch() {
        const { osc, gain, ctx } = this.createOscillator('sine', 800, 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }
  }
  
  export const audioService = new AudioService();
    
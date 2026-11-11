// Audio must be unlocked by a user gesture on each page load.
export class NotificationSounds {
  private context: AudioContext | null = null;
  private enabled = false;
  private ringing = false;
  private ringTimer: ReturnType<typeof setInterval> | null = null;
  private nodes = new Set<OscillatorNode>();
  private listeners = new Set<() => void>();

  isEnabled = () => this.enabled && this.context?.state === 'running';
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private changed = () => this.listeners.forEach(listener => listener());

  async enable() {
    const Audio = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) throw new Error('Sound alerts are not supported in this browser.');
    if (!this.context || this.context.state === 'closed') {
      this.context = new Audio();
      this.context.onstatechange = this.changed;
    }
    await this.context.resume();
    if (this.context.state !== 'running') throw new Error('Tap Enable sounds again to allow audio.');
    this.enabled = true;
    this.changed();
    if (this.ringing) this.ringPulse(); else this.message();
  }
  disable() {
    this.enabled = false;
    this.silence();
    this.changed();
  }
  private tone(frequency: number, offset: number, duration: number) {
    if (!this.isEnabled() || !this.context) return;
    const context = this.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + offset;
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
    gain.gain.setValueAtTime(0.12, start + duration - 0.03);
    gain.gain.linearRampToValueAtTime(0, start + duration);
    oscillator.connect(gain); gain.connect(context.destination);
    this.nodes.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.nodes.delete(oscillator); };
    oscillator.start(start); oscillator.stop(start + duration);
  }
  message() {
    if (this.ringing) return;
    this.tone(660, 0, 0.12);
    this.tone(880, 0.15, 0.18);
  }
  private ringPulse = () => {
    this.tone(440, 0, 0.35); this.tone(554, 0, 0.35);
    this.tone(440, 0.5, 0.35); this.tone(554, 0.5, 0.35);
  };
  startRinging() {
    if (this.ringing) return;
    this.ringing = true;
    this.ringPulse();
    this.ringTimer = setInterval(this.ringPulse, 2200);
  }
  stopRinging() {
    this.ringing = false;
    if (this.ringTimer) clearInterval(this.ringTimer);
    this.ringTimer = null;
    this.silence();
  }
  private silence() {
    this.nodes.forEach(node => { try { node.stop(); } catch { /* Already stopped. */ } });
    this.nodes.clear();
  }
}
export const notificationSounds = new NotificationSounds();

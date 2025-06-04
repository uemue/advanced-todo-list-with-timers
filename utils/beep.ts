export function playBeep(duration: number = 200, frequency: number = 880) {
  if (typeof window === 'undefined') return;
  const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.1;

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration / 1000);
  oscillator.onended = () => ctx.close();
}

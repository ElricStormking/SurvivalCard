type AudioCue =
  | 'uiOpen'
  | 'skillSpend'
  | 'weaponSwing'
  | 'combatHit'
  | 'cast'
  | 'gatherStart'
  | 'gatherHerb'
  | 'gatherChop'
  | 'gatherMine'
  | 'gatherComplete'
  | 'pickup'
  | 'deviceQueued'
  | 'deviceComplete'
  | 'outputPickup'
  | 'siegeWave'
  | 'coreDamage';

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let audioContext: AudioContext | undefined;
let unlockInstalled = false;

export function installAudioUnlock(): void {
  if (typeof window === 'undefined' || unlockInstalled) return;
  unlockInstalled = true;
  const unlock = () => {
    const context = getAudioContext();
    if (context?.state === 'suspended') void context.resume();
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

export function playAudioCue(cue: AudioCue, intensity = 1): void {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') {
    void context.resume();
    return;
  }

  const level = Math.max(0.25, Math.min(1.6, intensity));
  switch (cue) {
    case 'uiOpen':
      tone(360, 0.035, 0.045 * level, 'triangle');
      tone(540, 0.055, 0.026 * level, 'triangle', 0.035);
      break;
    case 'skillSpend':
      tone(440, 0.05, 0.04 * level, 'sine');
      tone(660, 0.07, 0.038 * level, 'sine', 0.045);
      tone(880, 0.09, 0.032 * level, 'sine', 0.09);
      break;
    case 'weaponSwing':
      sweep(620, 260, 0.09, 0.034 * level, 'sawtooth');
      noise(0.08, 0.026 * level, 900);
      break;
    case 'combatHit':
      noise(0.09, 0.075 * level, 180);
      tone(95, 0.08, 0.035 * level, 'square');
      break;
    case 'cast':
      sweep(220, 780, 0.18, 0.045 * level, 'sine');
      tone(930, 0.08, 0.025 * level, 'triangle', 0.09);
      break;
    case 'gatherStart':
      tone(180, 0.05, 0.026 * level, 'triangle');
      noise(0.06, 0.022 * level, 420);
      break;
    case 'gatherHerb':
      noise(0.07, 0.028 * level, 1200);
      tone(520, 0.04, 0.018 * level, 'triangle');
      break;
    case 'gatherChop':
      noise(0.055, 0.054 * level, 260);
      tone(145, 0.07, 0.028 * level, 'square');
      break;
    case 'gatherMine':
      tone(260, 0.035, 0.05 * level, 'triangle');
      tone(1140, 0.055, 0.02 * level, 'sine', 0.018);
      noise(0.035, 0.028 * level, 1700);
      break;
    case 'gatherComplete':
      tone(460, 0.055, 0.034 * level, 'triangle');
      tone(690, 0.08, 0.034 * level, 'triangle', 0.055);
      break;
    case 'pickup':
      tone(720, 0.045, 0.024 * level, 'sine');
      tone(960, 0.055, 0.018 * level, 'sine', 0.04);
      break;
    case 'deviceQueued':
      tone(240, 0.04, 0.035 * level, 'triangle');
      tone(420, 0.05, 0.025 * level, 'triangle', 0.04);
      break;
    case 'deviceComplete':
      tone(520, 0.08, 0.042 * level, 'sine');
      tone(780, 0.11, 0.034 * level, 'sine', 0.08);
      break;
    case 'outputPickup':
      tone(620, 0.055, 0.03 * level, 'triangle');
      tone(840, 0.07, 0.025 * level, 'triangle', 0.045);
      break;
    case 'siegeWave':
      sweep(130, 65, 0.42, 0.055 * level, 'sawtooth');
      tone(210, 0.24, 0.03 * level, 'square', 0.05);
      break;
    case 'coreDamage':
      noise(0.12, 0.075 * level, 100);
      sweep(120, 58, 0.18, 0.04 * level, 'square');
      break;
  }
}

function getAudioContext(): AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  if (audioContext) return audioContext;
  const audioWindow = window as AudioWindow;
  const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextCtor) return undefined;
  audioContext = new AudioContextCtor();
  return audioContext;
}

function tone(frequency: number, duration: number, volume: number, type: OscillatorType, delay = 0): void {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.025);
}

function sweep(from: number, to: number, duration: number, volume: number, type: OscillatorType): void {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.025);
}

function noise(duration: number, volume: number, filterFrequency: number): void {
  const context = getAudioContext();
  if (!context) return;
  const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = filterFrequency;
  gain.gain.value = volume;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start();
}

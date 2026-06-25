import type { GameSave } from '../types';

export type WeatherId = 'clear' | 'mountainRain' | 'coldMist' | 'spiritWind' | 'dryHeat';
export type MoonPhaseId = 'new' | 'waxing' | 'full' | 'waning';

export interface DailyCondition {
  weatherId: WeatherId;
  weatherName: string;
  moonPhase: MoonPhaseId;
  moonName: string;
  summary: string;
  dangerMultiplier: number;
  gatheringMultiplier: number;
  regenerationMultiplier: number;
  tint: number;
  tintAlpha: number;
}

const WEATHER: Record<WeatherId, Omit<DailyCondition, 'weatherId' | 'moonPhase' | 'moonName'>> = {
  clear: {
    weatherName: 'Clear Mountain Air',
    summary: 'Stable travel and normal recovery.',
    dangerMultiplier: 1,
    gatheringMultiplier: 1,
    regenerationMultiplier: 1,
    tint: 0xf4d28b,
    tintAlpha: 0.02
  },
  mountainRain: {
    weatherName: 'Mountain Rain',
    summary: 'Wet ground muffles danger but slows tool work.',
    dangerMultiplier: 0.88,
    gatheringMultiplier: 1.14,
    regenerationMultiplier: 1.05,
    tint: 0x6f8fa6,
    tintAlpha: 0.12
  },
  coldMist: {
    weatherName: 'Cold Mist',
    summary: 'Visibility drops and hostile spirits approach faster.',
    dangerMultiplier: 1.22,
    gatheringMultiplier: 1.06,
    regenerationMultiplier: 0.92,
    tint: 0xa7b8b7,
    tintAlpha: 0.16
  },
  spiritWind: {
    weatherName: 'Spirit Wind',
    summary: 'Qi flows sharply. Recovery improves, but expeditions draw attention.',
    dangerMultiplier: 1.16,
    gatheringMultiplier: 0.94,
    regenerationMultiplier: 1.14,
    tint: 0x8fb6d6,
    tintAlpha: 0.1
  },
  dryHeat: {
    weatherName: 'Dry Heat',
    summary: 'Work is faster, hunger pressure and fatigue feel harsher.',
    dangerMultiplier: 1.05,
    gatheringMultiplier: 0.9,
    regenerationMultiplier: 0.86,
    tint: 0xd6a45f,
    tintAlpha: 0.1
  }
};

const MOON_PHASES: Record<MoonPhaseId, { name: string; danger: number; regeneration: number }> = {
  new: { name: 'New Moon', danger: 0.95, regeneration: 0.98 },
  waxing: { name: 'Waxing Moon', danger: 1, regeneration: 1 },
  full: { name: 'Full Moon', danger: 1.12, regeneration: 1.04 },
  waning: { name: 'Waning Moon', danger: 1.03, regeneration: 0.98 }
};

export function dailyCondition(save: GameSave): DailyCondition {
  const weatherId = weatherForDay(save.seed, save.world.day, save.world.siegeCyclesSurvived ?? 0);
  const moonPhase = moonPhaseForDay(save.world.day, save.world.siegeCyclesSurvived ?? 0);
  const weather = WEATHER[weatherId];
  const moon = MOON_PHASES[moonPhase];
  return {
    weatherId,
    weatherName: weather.weatherName,
    moonPhase,
    moonName: moon.name,
    summary: weather.summary,
    dangerMultiplier: round2(weather.dangerMultiplier * moon.danger),
    gatheringMultiplier: weather.gatheringMultiplier,
    regenerationMultiplier: round2(weather.regenerationMultiplier * moon.regeneration),
    tint: weather.tint,
    tintAlpha: weather.tintAlpha
  };
}

export function conditionHudLine(save: GameSave): string {
  const condition = dailyCondition(save);
  return `${condition.weatherName} / ${condition.moonName}  Danger x${condition.dangerMultiplier.toFixed(2)}  Gather x${condition.gatheringMultiplier.toFixed(2)}`;
}

function weatherForDay(seed: number, day: number, cyclesSurvived: number): WeatherId {
  if (day >= 14) return 'spiritWind';
  const roll = seededRoll(seed, day, cyclesSurvived);
  if (roll < 0.28) return 'clear';
  if (roll < 0.46) return 'mountainRain';
  if (roll < 0.64) return 'coldMist';
  if (roll < 0.82) return 'dryHeat';
  return 'spiritWind';
}

function moonPhaseForDay(day: number, cyclesSurvived: number): MoonPhaseId {
  const phases: MoonPhaseId[] = ['new', 'waxing', 'full', 'waning'];
  return phases[Math.abs(day + cyclesSurvived) % phases.length];
}

function seededRoll(seed: number, day: number, cyclesSurvived: number): number {
  return Math.abs(Math.sin(seed * 0.017 + day * 7.733 + cyclesSurvived * 2.371) * 10000) % 1;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

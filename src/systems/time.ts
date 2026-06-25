import type { GameSave } from '../types';
import { tickProduction } from './production';
import { resolveNightEvent } from './nightEvents';

export function tickWorld(save: GameSave, realDeltaMs: number): void {
  const deltaSeconds = (realDeltaMs / 1000) * save.world.timeScale;
  save.world.minutes += deltaSeconds;
  tickProduction(save, deltaSeconds);
  while (save.world.minutes >= 24 * 60) {
    save.world.minutes -= 24 * 60;
    const completedDay = save.world.day;
    save.world.day += 1;
    if (save.world.day < 15) resolveNightEvent(save, completedDay);
  }
}

export function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
  const minute = Math.floor(minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

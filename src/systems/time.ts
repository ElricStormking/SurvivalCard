import type { GameSave } from '../types';
import { tickProduction } from './production';

export function tickWorld(save: GameSave, realDeltaMs: number): void {
  const deltaSeconds = (realDeltaMs / 1000) * save.world.timeScale;
  save.world.minutes += deltaSeconds;
  tickProduction(save, deltaSeconds);
  while (save.world.minutes >= 24 * 60) {
    save.world.minutes -= 24 * 60;
    save.world.day += 1;
  }
}

export function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
  const minute = Math.floor(minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

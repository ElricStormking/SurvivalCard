import type { GameSave } from '../types';
import { createNewSave, ensureSaveShape, loadGame, saveGame } from '../systems/save';

class GameStoreImpl {
  save: GameSave;

  constructor() {
    this.save = ensureSaveShape(loadGame() ?? createNewSave());
  }

  replace(save: GameSave): void {
    this.save = ensureSaveShape(save);
    saveGame(this.save);
  }

  persist(): void {
    this.save = ensureSaveShape(this.save);
    saveGame(this.save);
  }

  hydrate(): void {
    this.save = ensureSaveShape(this.save);
  }
}

export const GameStore = new GameStoreImpl();

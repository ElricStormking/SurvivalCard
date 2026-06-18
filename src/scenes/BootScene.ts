import Phaser from 'phaser';
import { validateContentRegistry } from '../data/contentRegistry';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    const validation = validateContentRegistry();
    if (!validation.valid) {
      throw new Error(`Content validation failed:\n${validation.errors.join('\n')}`);
    }
    this.scene.start('PreloadScene');
  }
}

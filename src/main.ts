import Phaser from 'phaser';
import './styles.css';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { CharacterCreateScene } from './scenes/CharacterCreateScene';
import { FarmScene } from './scenes/FarmScene';
import { ForestScene } from './scenes/ForestScene';
import { SiegeScene } from './scenes/SiegeScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#10130f',
  pixelArt: false,
  roundPixels: false,
  scene: [BootScene, PreloadScene, CharacterCreateScene, FarmScene, ForestScene, SiegeScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: true,
    powerPreference: 'high-performance'
  }
};

new Phaser.Game(config);

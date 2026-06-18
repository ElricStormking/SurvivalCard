import { SIEGE_WAVES } from '../data/enemies';
import { addItems } from '../systems/inventory';
import { BasePlayScene } from './BasePlayScene';
import { GameStore } from '../state/GameStore';

export class SiegeScene extends BasePlayScene {
  private waveIndex = -1;
  private waveDelay = 1200;

  constructor() {
    super('SiegeScene');
  }

  create(): void {
    GameStore.save.world.scene = 'siege';
    GameStore.save.world.day = Math.max(15, GameStore.save.world.day);
    GameStore.save.world.objectives.startedSiege = true;
    this.add.rectangle(960, 700, 1920, 1400, 0x171315);
    this.add.circle(960, 700, 82, 0x7fd6d1, 0.5).setStrokeStyle(4, 0xf2d77e);
    this.add.text(870, 590, 'Formation Core', { fontFamily: 'Georgia', fontSize: '18px', color: '#ffe9a8' });
    this.createPlayer(960, 820);
    this.createControls();
    this.createHud();
    this.input.keyboard?.on('keydown-TAB', () => this.scene.start('FarmScene'));
    this.applyDefenseOpening();
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.waveDelay -= delta;
    if (this.enemies.length === 0 && this.waveDelay <= 0) this.nextWave();
    for (const enemy of this.enemies) {
      if (Phaser.Math.Distance.Between(enemy.actor.x, enemy.actor.y, 960, 700) < 70) {
        GameStore.save.world.formationCoreHp -= 10 * delta / 1000;
      }
    }
    if (GameStore.save.world.formationCoreHp <= 0) {
      GameStore.save.world.formationCoreHp = 50;
      GameStore.save.world.day = 1;
      this.scene.start('FarmScene');
    }
  }

  private applyDefenseOpening(): void {
    const defenses = GameStore.save.world.defenses;
    if (defenses.spikeTrap > 0) {
      this.time.delayedCall(1500, () => this.flashDamage(960, 640, `Spike traps ready x${defenses.spikeTrap}`, '#f5d071'));
    }
    if (defenses.fireTalismanTrap > 0) {
      this.time.delayedCall(2200, () => this.flashDamage(960, 610, `Fire talismans ready x${defenses.fireTalismanTrap}`, '#ff8f50'));
    }
  }

  private nextWave(): void {
    this.waveIndex += 1;
    if (this.waveIndex >= SIEGE_WAVES.length) {
      GameStore.save.world.siegeWon = true;
      GameStore.save.world.objectives.wonSiege = true;
      GameStore.save.world.day = 1;
      GameStore.save.world.minutes = 7 * 60;
      addItems(GameStore.save.player.storage, { spiritPaper: 4, ore: 3, herb: 3 });
      this.scene.start('FarmScene');
      return;
    }

    const wave = SIEGE_WAVES[this.waveIndex];
    wave.forEach((id, i) => {
      const x = 640 + i * 170;
      const y = 220 + (i % 2) * 70;
      this.spawnEnemy(id, x, y);
    });

    const defenses = GameStore.save.world.defenses;
    const bonusDamage = defenses.spikeTrap * 14 + defenses.fireTalismanTrap * 18;
    if (bonusDamage > 0) {
      for (const enemy of this.enemies.slice(0, Math.max(1, defenses.spikeTrap + defenses.fireTalismanTrap))) {
        this.damageEnemy(enemy, bonusDamage, new Phaser.Math.Vector2(960, 700), '#f5d071', 18);
      }
    }
    GameStore.save.world.formationCoreHp += defenses.barricade * 8;
    this.waveDelay = 2500;
  }

  protected refreshHud(): void {
    super.refreshHud();
    this.prompt.setText([
      `Siege wave ${Math.max(0, this.waveIndex + 1)}/3`,
      `Core ${Math.ceil(GameStore.save.world.formationCoreHp)}`,
      'Defeat all attackers.',
      'I Inventory. K Skills. 1-8 Hotbar.',
      'TAB retreat to farm after resolution.'
    ].join('\n'));
  }
}

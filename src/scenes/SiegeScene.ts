import Phaser from 'phaser';
import { ENEMIES, SIEGE_WAVES } from '../data/enemies';
import { playAudioCue } from '../systems/audio';
import { beginNextSiegeCycle, resolveSiegeDefeat, resolveSiegeVictory } from '../systems/siegeCycle';
import { scaledSiegeWave, siegeScalingProfile } from '../systems/siegeScaling';
import { saveGame } from '../systems/save';
import { BasePlayScene } from './BasePlayScene';
import { GameStore } from '../state/GameStore';
import type { EnemyId, Inventory } from '../types';
import type { SiegeResolution } from '../systems/siegeCycle';

export class SiegeScene extends BasePlayScene {
  private waveIndex = -1;
  private waveDelay = 1200;
  private coreDamageCueTimer = 0;
  private siegePanel?: Phaser.GameObjects.Container;
  private coreFill?: Phaser.GameObjects.Rectangle;
  private waveFill?: Phaser.GameObjects.Rectangle;
  private panelWaveText?: Phaser.GameObjects.Text;
  private panelStateText?: Phaser.GameObjects.Text;
  private panelEnemyText?: Phaser.GameObjects.Text;
  private panelDefenseText?: Phaser.GameObjects.Text;
  private panelTimerText?: Phaser.GameObjects.Text;
  private panelObjectiveText?: Phaser.GameObjects.Text;
  private resolved = false;
  private resolution?: SiegeResolution;
  private aftermathPanel?: Phaser.GameObjects.Container;

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
    this.createSiegeStatePanel();
    this.input.keyboard?.on('keydown-ENTER', () => this.continueAftermath());
    this.input.keyboard?.on('keydown-TAB', () => {
      if (this.resolved) this.continueAftermath();
    });
    this.applyDefenseOpening();
    playAudioCue('siegeWave', 0.72);
  }

  update(time: number, delta: number): void {
    if (this.resolved) {
      this.updateSiegeStatePanel();
      return;
    }
    super.update(time, delta);
    this.waveDelay -= delta;
    this.coreDamageCueTimer -= delta;
    if (this.enemies.length === 0 && this.waveDelay <= 0) this.nextWave();
    let coreTakingDamage = false;
    for (const enemy of this.enemies) {
      if (Phaser.Math.Distance.Between(enemy.actor.x, enemy.actor.y, 960, 700) < 70) {
        GameStore.save.world.formationCoreHp -= 10 * delta / 1000;
        coreTakingDamage = true;
      }
    }
    if (coreTakingDamage && this.coreDamageCueTimer <= 0) {
      playAudioCue('coreDamage');
      this.coreDamageCueTimer = 650;
    }
    if (GameStore.save.world.formationCoreHp <= 0) {
      this.resolveSiege('defeat');
    }
    this.updateSiegeStatePanel();
  }

  private createSiegeStatePanel(): void {
    const panel = this.add.container(878, 184).setScrollFactor(0).setDepth(10_070);
    const bg = this.add.rectangle(0, 0, 382, 258, 0x15110c, 0.82)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xd0ad61, 0.92);
    const title = this.add.text(16, 12, 'Siege State', {
      fontFamily: 'Georgia',
      fontSize: '21px',
      color: '#f8e7b8'
    });
    this.panelWaveText = this.add.text(16, 44, '', {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: '#f5e2b2'
    });
    const waveBarBg = this.add.rectangle(16, 72, 344, 9, 0x24180f, 0.95)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x674c28, 0.9);
    this.waveFill = this.add.rectangle(16, 72, 0, 9, 0xd0ad61, 0.95).setOrigin(0, 0.5);
    this.panelStateText = this.add.text(16, 88, '', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#d7c595',
      wordWrap: { width: 340 }
    });

    const coreLabel = this.add.text(16, 124, 'Formation Core', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#e8ddba'
    });
    const coreBarBg = this.add.rectangle(16, 150, 344, 13, 0x24180f, 0.95)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x674c28, 0.9);
    this.coreFill = this.add.rectangle(16, 150, 344, 13, 0x77d6ce, 0.95).setOrigin(0, 0.5);
    this.panelTimerText = this.add.text(16, 164, '', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#f0cf78'
    });
    this.panelEnemyText = this.add.text(16, 188, '', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#f5e2b2',
      wordWrap: { width: 340 }
    });
    this.panelDefenseText = this.add.text(16, 214, '', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#cdbb91',
      wordWrap: { width: 340 }
    });
    this.panelObjectiveText = this.add.text(16, 236, '', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#dff0a8',
      wordWrap: { width: 340 }
    });

    panel.add([
      bg,
      title,
      this.panelWaveText,
      waveBarBg,
      this.waveFill,
      this.panelStateText,
      coreLabel,
      coreBarBg,
      this.coreFill,
      this.panelTimerText,
      this.panelEnemyText,
      this.panelDefenseText,
      this.panelObjectiveText
    ]);
    this.siegePanel = panel;
    this.updateSiegeStatePanel();
  }

  private updateSiegeStatePanel(): void {
    if (!this.siegePanel || !this.coreFill || !this.waveFill) return;
    const waveNumber = Phaser.Math.Clamp(this.waveIndex + 1, 0, SIEGE_WAVES.length);
    const coreHp = Math.max(0, GameStore.save.world.formationCoreHp);
    const coreRatio = Phaser.Math.Clamp(coreHp / 150, 0, 1);
    const waveRatio = Phaser.Math.Clamp(waveNumber / SIEGE_WAVES.length, 0, 1);
    this.coreFill.width = 344 * coreRatio;
    this.coreFill.setFillStyle(coreRatio > 0.55 ? 0x77d6ce : coreRatio > 0.25 ? 0xd0ad61 : 0xc74434, 0.95);
    this.waveFill.width = 344 * waveRatio;

    const currentWave = this.waveIndex >= 0 && this.waveIndex < SIEGE_WAVES.length ? SIEGE_WAVES[this.waveIndex] : undefined;
    const nextWave = this.waveIndex + 1 < SIEGE_WAVES.length ? SIEGE_WAVES[Math.max(0, this.waveIndex + 1)] : undefined;
    const scaling = siegeScalingProfile(GameStore.save);
    const enemiesAlive = this.enemies.filter((enemy) => !enemy.defeated && enemy.actor.active && enemy.actor.hp > 0);
    const timerSeconds = Math.max(0, Math.ceil(this.waveDelay / 1000));
    const waveName = currentWave ? this.waveCompositionText(scaledSiegeWave(currentWave, this.waveIndex, GameStore.save)) : 'Opening defenses';
    const nextName = nextWave ? this.waveCompositionText(scaledSiegeWave(nextWave, Math.max(0, this.waveIndex + 1), GameStore.save)) : 'No further wave';

    this.panelWaveText?.setText(`Wave ${waveNumber}/${SIEGE_WAVES.length}: ${waveName}`);
    this.panelStateText?.setText(this.resolved ? 'Aftermath report open. Press Enter to return to the farm.' : enemiesAlive.length > 0 ? `Threats active. Hold the core and finish the wave.` : `Next: ${nextName}`);
    this.panelTimerText?.setText(`Core ${Math.ceil(coreHp)}/150   ${scaling.pressureLabel}   ${enemiesAlive.length === 0 ? `Next wave in ${timerSeconds}s` : 'Wave engaged'}`);
    this.panelEnemyText?.setText(`Enemies left ${enemiesAlive.length}   ${this.liveEnemyText(enemiesAlive.map((enemy) => enemy.id))}`);
    const defenses = GameStore.save.world.defenses;
    this.panelDefenseText?.setText(`Defenses: Barricade ${defenses.barricade}  Spikes ${defenses.spikeTrap}  Fire Talismans ${defenses.fireTalismanTrap}`);
    this.panelObjectiveText?.setText(this.resolved ? `Cycle result: ${this.resolution?.outcome ?? 'resolved'}.` : coreHp > 0 ? 'Objective: survive all three waves while the core remains standing.' : 'Objective failed: core breached.');
  }

  private waveCompositionText(wave: EnemyId[]): string {
    const counts = this.countEnemies(wave);
    return Object.entries(counts)
      .map(([id, count]) => `${ENEMIES[id as EnemyId].name} x${count}`)
      .join(', ');
  }

  private liveEnemyText(enemies: EnemyId[]): string {
    if (enemies.length === 0) return 'clear';
    const counts = this.countEnemies(enemies);
    return Object.entries(counts)
      .map(([id, count]) => `${ENEMIES[id as EnemyId].name} x${count}`)
      .join(', ');
  }

  private countEnemies(enemies: EnemyId[]): Partial<Record<EnemyId, number>> {
    return enemies.reduce((counts, enemy) => {
      counts[enemy] = (counts[enemy] ?? 0) + 1;
      return counts;
    }, {} as Partial<Record<EnemyId, number>>);
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
      this.resolveSiege('victory');
      return;
    }

    const scaling = siegeScalingProfile(GameStore.save);
    const wave = scaledSiegeWave(SIEGE_WAVES[this.waveIndex], this.waveIndex, GameStore.save);
    playAudioCue('siegeWave', 1 + this.waveIndex * 0.18);
    wave.forEach((id, i) => {
      const x = 560 + (i % 5) * 150;
      const y = 220 + Math.floor(i / 5) * 86 + (i % 2) * 46;
      this.spawnEnemy(id, x, y, {
        hpMultiplier: scaling.hpMultiplier,
        damageMultiplier: scaling.damageMultiplier,
        labelSuffix: scaling.cycle > 0 ? ` C${scaling.cycle + 1}` : ''
      });
    });
    if (scaling.cycle > 0) this.flashDamage(960, 560, scaling.pressureSummary, '#ffcf9c');

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

  private resolveSiege(outcome: SiegeResolution['outcome']): void {
    if (this.resolved) return;
    this.resolved = true;
    this.movementLocked = true;
    for (const enemy of this.enemies) {
      enemy.actor.destroy();
    }
    this.enemies = [];
    this.resolution = outcome === 'victory' ? resolveSiegeVictory(GameStore.save) : resolveSiegeDefeat(GameStore.save);
    saveGame(GameStore.save);
    playAudioCue(outcome === 'victory' ? 'deviceComplete' : 'coreDamage', outcome === 'victory' ? 1.2 : 0.95);
    this.renderAftermathPanel(this.resolution);
    this.updateSiegeStatePanel();
  }

  private renderAftermathPanel(report: SiegeResolution): void {
    this.aftermathPanel?.destroy(true);
    const panel = this.add.container(430, 220).setScrollFactor(0).setDepth(10_120);
    const bg = this.add.rectangle(0, 0, 640, 420, 0x130f0a, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(3, report.outcome === 'victory' ? 0xd6bd72 : 0xb35a4b, 0.95);
    const title = this.add.text(28, 24, report.title, {
      fontFamily: 'Georgia',
      fontSize: '34px',
      color: report.outcome === 'victory' ? '#f6e8b8' : '#f0b49c'
    });
    const summary = this.add.text(28, 76, report.summary, {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#eadbb4',
      wordWrap: { width: 580 }
    });
    const core = this.add.text(28, 150, `Formation Core ${Math.ceil(report.coreHp)}/150   Cycles survived ${report.cyclesSurvived}`, {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#d7c595'
    });
    const rewards = this.add.text(28, 190, `Rewards: ${this.inventorySummary(report.rewards)}`, {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#dff0a8',
      wordWrap: { width: 580 }
    });
    const losses = this.add.text(28, 232, `Aftermath: ${report.losses.join(' ')}`, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#cdbb91',
      wordWrap: { width: 580 }
    });
    const next = this.add.text(28, 354, 'Enter / TAB  Return to farm for the next cycle', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#f6e8b8'
    });
    panel.add([bg, title, summary, core, rewards, losses, next]);
    this.aftermathPanel = panel;
  }

  private inventorySummary(inventory: Inventory): string {
    const entries = Object.entries(inventory).filter(([, count]) => Number(count) > 0);
    return entries.length ? entries.map(([id, count]) => `${id} x${count}`).join(', ') : 'none';
  }

  private continueAftermath(): void {
    if (!this.resolved) return;
    beginNextSiegeCycle(GameStore.save);
    saveGame(GameStore.save);
    this.scene.start('FarmScene');
  }

  protected refreshHud(): void {
    super.refreshHud();
    this.prompt.setText(this.resolved ? [
      'Siege aftermath',
      this.resolution?.summary ?? 'The cycle has resolved.',
      'Enter / TAB return to farm.'
    ].join('\n') : [
      `Siege wave ${Math.max(0, this.waveIndex + 1)}/3`,
      `Core ${Math.ceil(GameStore.save.world.formationCoreHp)}`,
      'Defeat all attackers.',
      'Right Click/Ctrl dodge. I Inventory. K Skills. 1-8 Hotbar.',
      'TAB retreat to farm after resolution.'
    ].join('\n'));
  }
}

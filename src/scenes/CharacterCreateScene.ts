import Phaser from 'phaser';
import { PROFESSIONS } from '../data/professions';
import { createBackgroundRolls } from '../systems/professionRolls';
import { createNewSave } from '../systems/save';
import { GameStore } from '../state/GameStore';

export class CharacterCreateScene extends Phaser.Scene {
  private professionIndex = 0;
  private rollIndex = 0;
  private seed = Date.now();
  private info!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterCreateScene');
  }

  create(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x15170f);
    this.add.image(220, 388, 'avatar').setDisplaySize(300, 400).setAlpha(0.92);
    this.add.rectangle(220, 388, 340, 470, 0x231b13, 0.45).setStrokeStyle(2, 0xd3b36a);
    this.add.text(48, 36, 'Mountain Hermit: Path of Immortality', { fontFamily: 'Georgia', fontSize: '32px', color: '#f4e4b3' });
    this.add.text(50, 82, 'Create an avatar card, choose a profession, compare three bounded records, then enter the ruined farm.', {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#d9caa4'
    });

    const controls = [
      ['A/D', 'Profession'],
      ['W/S', 'Background roll'],
      ['Enter', 'Confirm'],
      ['L', 'Load save']
    ];
    controls.forEach(([key, label], i) => {
      const control = this.add.text(470, 94 + i * 28, `${key}  ${label}`, { fontFamily: 'Georgia', fontSize: '17px', color: '#efe3bd' });
      if (key === 'Enter' || key === 'L') {
        control.setInteractive({ useHandCursor: true });
        control.on('pointerdown', () => {
          if (key === 'Enter') this.confirm();
          else this.scene.start('FarmScene');
        });
      }
    });

    this.info = this.add.text(470, 230, '', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#f8eed0',
      lineSpacing: 8,
      wordWrap: { width: 680 }
    });

    this.input.keyboard?.on('keydown-A', () => this.changeProfession(-1));
    this.input.keyboard?.on('keydown-D', () => this.changeProfession(1));
    this.input.keyboard?.on('keydown-W', () => this.changeRoll(-1));
    this.input.keyboard?.on('keydown-S', () => this.changeRoll(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.confirm());
    this.input.keyboard?.on('keydown-L', () => this.scene.start('FarmScene'));
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x >= 460 && pointer.x <= 650 && pointer.y >= 140 && pointer.y <= 176) this.confirm();
      if (pointer.x >= 460 && pointer.x <= 650 && pointer.y > 176 && pointer.y <= 208) this.scene.start('FarmScene');
    });
    this.refresh();
  }

  private changeProfession(delta: number): void {
    this.professionIndex = Phaser.Math.Wrap(this.professionIndex + delta, 0, PROFESSIONS.length);
    this.rollIndex = 0;
    this.refresh();
  }

  private changeRoll(delta: number): void {
    this.rollIndex = Phaser.Math.Wrap(this.rollIndex + delta, 0, 3);
    this.refresh();
  }

  private refresh(): void {
    const profession = PROFESSIONS[this.professionIndex];
    const roll = createBackgroundRolls(profession, this.seed)[this.rollIndex];
    const attrs = Object.entries(roll.attributes).map(([k, v]) => `${k}+${v}`).join('  ');
    const affinities = Object.entries(roll.affinities).map(([k, v]) => `${k}+${v}`).join('  ');
    const items = Object.entries(roll.items).map(([k, v]) => `${k} x${v}`).join(', ');
    this.info.setText(
      [
        `${profession.name}  [${profession.emblem}]`,
        `Record ${this.rollIndex + 1}/3  Seed ${roll.seed}`,
        '',
        attrs,
        `Affinities: ${affinities}`,
        `Skill familiarity: ${Object.entries(roll.skillFamiliarity).map(([k, v]) => `${k} Lv${v}`).join(', ')}`,
        `Starting items: ${items}`,
        `Recipe unlocks: ${roll.recipes.join(', ')}`,
        `Trait: ${roll.positiveTrait}`,
        `Drawback: ${roll.drawback}`
      ].join('\n')
    );
  }

  private confirm(): void {
    GameStore.replace(createNewSave('Mountain Hermit', this.professionIndex, this.rollIndex, this.seed));
    this.scene.start('FarmScene');
  }
}

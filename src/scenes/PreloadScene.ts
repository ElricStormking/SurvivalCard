import Phaser from 'phaser';

const farmBgUrl = new URL('../../assets/backgrounds/mountain_farm_daylight.png', import.meta.url).href;
const avatarUrl = new URL('../../assets/charactercards/avatars/youngman.png', import.meta.url).href;
const enemyBoarUrl = new URL('../../assets/charactercards/enemies/monster_wild_boar.png', import.meta.url).href;
const enemyWolfUrl = new URL('../../assets/charactercards/enemies/monster_demon_wolf.png', import.meta.url).href;
const enemyGhostUrl = new URL('../../assets/charactercards/enemies/monster_wandering_ghost.png', import.meta.url).href;
const petDogUrl = new URL('../../assets/charactercards/pets/pet_dog.png', import.meta.url).href;
const iconGrilledMeatUrl = new URL('../../assets/icons/items/icon_grilled_meat_ds.png', import.meta.url).href;
const iconSteakUrl = new URL('../../assets/icons/items/icon_steak_ds.png', import.meta.url).href;
const iconHerbUrl = new URL('../../assets/icons/materials/icon_herb_ds.png', import.meta.url).href;
const iconIronOreUrl = new URL('../../assets/icons/materials/icon_iron_ore_ds.png', import.meta.url).href;
const iconLogUrl = new URL('../../assets/icons/materials/icon_log_ds.png', import.meta.url).href;
const iconRawMeatUrl = new URL('../../assets/icons/materials/icon_raw_meat_ds.png', import.meta.url).href;
const iconResinUrl = new URL('../../assets/icons/materials/icon_resin_ds.png', import.meta.url).href;
const iconAxeUrl = new URL('../../assets/icons/tools/icon_axe_ds.png', import.meta.url).href;
const iconPickaxeUrl = new URL('../../assets/icons/tools/icon_pickaxe_ds.png', import.meta.url).href;
const iconSwordUrl = new URL('../../assets/icons/weapons/icon_sword_ds.png', import.meta.url).href;

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.load.image('farmBg', farmBgUrl);
    this.load.image('avatar', avatarUrl);
    this.load.image('enemyBoar', enemyBoarUrl);
    this.load.image('enemyWolf', enemyWolfUrl);
    this.load.image('enemyGhost', enemyGhostUrl);
    this.load.image('petDog', petDogUrl);
    this.load.image('iconGrilledMeat', iconGrilledMeatUrl);
    this.load.image('iconSteak', iconSteakUrl);
    this.load.image('iconHerb', iconHerbUrl);
    this.load.image('iconIronOre', iconIronOreUrl);
    this.load.image('iconLog', iconLogUrl);
    this.load.image('iconRawMeat', iconRawMeatUrl);
    this.load.image('iconResin', iconResinUrl);
    this.load.image('iconAxe', iconAxeUrl);
    this.load.image('iconPickaxe', iconPickaxeUrl);
    this.load.image('iconSword', iconSwordUrl);
  }

  create(): void {
    this.scene.start('CharacterCreateScene');
  }
}

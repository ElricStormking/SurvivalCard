> **Core Promise:** Explore and extract during the preparation period, rebuild a ruined mountain farm, cultivate through practice, and survive a major supernatural siege every fifteen days.


# 山居修仙錄

## Mountain Hermit: Path of Immortality

**Main Game Design Document — Version 1.1**


# Document Control

| Field | Value |

| --- | --- |

| Working Title | 山居修仙錄 / Mountain Hermit: Path of Immortality |

| Genre | Survival Crafting, Incremental Cultivation, Extraction Adventure, Base Defense |

| Perspective | 2D isometric world with camera-facing card avatars |

| Primary Platform | PC / Steam |

| Mode | Single-player |

| Business Model | Premium base game; optional future expansions |

| Prototype Target | 30–60 minute vertical slice; one compressed 15-day cycle |

| Source of Truth | This document supersedes earlier daily-defense, Spine-animation, and warmth/mental-stability concepts. |



# Table of Contents

- 1. Executive Summary

- 2. Product Vision and Design Pillars

- 3. Audience, Experience, and Scope

- 4. Character Creation and Early-Life Professions

- 5. Core Gameplay Loop and Fifteen-Day Cycle

- 6. World Time, Risk, and Pacing

- 7. Player Controls, Camera, and Card-Avatar Presentation

- 8. Combat System

- 9. Player Resources, Attributes, and Elemental Affinities

- 10. Skills, Practice, and Cultivation Progression

- 11. Exploration, Extraction, and Gathering

- 12. Farm, Building, and Defense

- 13. Recipe, Crafting, and Production Devices

- 14. Companions and Pets

- 15. World Content: Regions, Enemies, Factions, and Narrative

- 16. User Interface and Information Design

- 17. Art, Audio, and Visual Effects

- 18. Difficulty, Accessibility, Economy, and Replayability

- 19. Prototype and Vertical Slice

- 20. Technical and Data Architecture

- 21. Production Roadmap, Risks, and Definition of Done

- Appendix A. Default Controls

- Appendix B. Initial Content Targets

- Appendix C. Glossary

# 1. Executive Summary

山居修仙錄 is a single-player survival and incremental cultivation game set on an isolated Chinese fantasy mountain. The player controls a poor young man who inherits a broken farmhouse, a damaged spiritual formation, and an incomplete cultivation manual. He is not a chosen immortal. He must earn power through work, practice, preparation, and repeated survival.

During the preparation period, the player explores forests, mines, herb valleys, burial grounds, and ancient ruins. Expeditions use a 搜打撤 structure: search for resources, fight or avoid threats, decide how deeply to continue, and extract before danger, time, injuries, or carry weight become unmanageable. Unsecured expedition loot is at risk until the player returns to the farm.

At home, raw materials are turned into equipment, food, medicine, talismans, traps, and formation components through data-driven recipes and timed production devices. The player rebuilds the farm, assigns companions and pets, trains skills, and investigates the next threat. On Day 15 of each cycle, a major supernatural siege attacks the farm. Normal nights may contain small events, but full defense is not a daily requirement.

At the beginning of a new game, the player creates a personalized avatar card and chooses an early-life profession. The profession provides a bounded random package of starting attributes, affinity tendencies, skill familiarity, equipment, and passive traits containing both advantages and drawbacks. It establishes an early identity without permanently locking the character out of any cultivation path.

The game does not use Spine or skeletal character animation. Player characters, companions, pets, and enemies appear as illustrated cards inside a 2D isometric environment. Cards move through procedural wobble steps, tilts, slides, squash-and-stretch, and hit reactions. Equipped weapon icons travel toward targets to represent attacks, while projectiles, trails, impact FX, ground telegraphs, and status icons communicate combat.

Progression combines six basic attributes, eleven elemental or Dao affinities, cultivation realms, skill points, and practice-based mastery. Spending skill points unlocks techniques and branches; meaningful use raises skill levels and contributes slow growth to related attributes and affinities. The design goal is a visible journey from a weak survivor using improvised tools to a cultivator commanding flying swords, auras, formations, companions, and an automated mountain sanctuary.

Explore → gather → extract → process → craft → cultivate → investigate → prepare → defend → recover.

## 1.1 One-Sentence Pitch

Explore, cultivate, and rebuild a ruined mountain farm while preparing for a massive supernatural siege every fifteen days in a card-animated Chinese fantasy survival adventure.

## 1.2 Key Differentiators

- Chinese cultivation fantasy presented through grounded survival and farm restoration.

- Daytime extraction expeditions linked directly to home production and siege preparation.

- A predictable fifteen-day macro-cycle that provides both freedom and long-term pressure.

- Character creation with ten early-life professions, bounded random starting bonuses, and profession-specific passive buffs and drawbacks.

- Practice-based progression: the skills and attributes used by the player become stronger.

- Card avatars, equipment-icon attacks, and FX replace expensive skeletal animation.

- Companions and pets transform an isolated ruin into a living cultivation sanctuary.

- All items are created through recipes, processing chains, devices, and production time.

- Late-game passive swords, auras, and auto-attacks create power fantasy without removing manual movement and targeting.

# 2. Product Vision and Design Pillars

## 2.1 Player Fantasy

- A poor but determined young cultivator who begins with almost nothing.

- A mountain survivor who personally gathers food, herbs, timber, ore, hides, and spirit materials.

- A treasure hunter who must judge risk, route, inventory space, time, and extraction safety.

- A homestead builder who turns a broken house into a protected, productive sanctuary.

- A practitioner who learns techniques through manuals and masters them through meaningful use.

- A leader supported by independent companions, pets, spirits, and automated production.

- A mortal who eventually controls flying swords, elemental domains, spatial formations, and time-related techniques.

The emotional progression should move from “I can barely survive the next attack” to “This mountain is my domain.”

## 2.2 Design Pillars

| Pillar | Design Meaning |

| --- | --- |

| Survive and Prepare | Basic needs, injuries, equipment condition, time, and farm safety create pressure. Preparation should matter more than reflexes alone. |

| Search, Fight, Extract | Expeditions offer increasing reward and increasing danger. Returning safely is a meaningful decision, not an automatic ending. |

| Cultivate Through Practice | Skill points unlock possibilities; repeated meaningful use transforms those possibilities into mastery and attribute growth. |

| Build a Living Sanctuary | The farm becomes visually, mechanically, and socially richer through devices, defenses, companions, pets, fields, and formations. |

| Readable Low-Cost Animation | Card motion, icons, and FX must deliver responsive combat and personality without skeletal animation. |

| Fifteen-Day Strategic Rhythm | The next siege provides a clear long-term objective while leaving enough time for exploration, story, farming, and experimentation. |



## 2.3 Design Non-Negotiables

- No mandatory full farm defense every night. Major sieges occur every fifteenth day.

- No Warmth or Mental Stability core attributes.

- No Spine or skeletal avatar animation.

- WASD movement, mouse aiming, and Left Click or Spacebar basic attack are primary controls.

- All craftable items use recipes; complex products require devices and production time.

- Combat and visual representation remain separate so hit logic can be balanced independently.

- Common production becomes increasingly automated, but rare materials still require active expeditions.

- Companions are characters with work roles, combat roles, goals, and relationships—not passive collectibles.

# 3. Audience, Experience, and Scope

## 3.1 Target Audience

- Players who enjoy survival crafting, base development, extraction risk, and long-term progression.

- Players interested in Chinese cultivation fiction, magical skill trees, elemental combinations, and farm life.

- Players who prefer single-player planning and exploration over competitive multiplayer.

- Players who enjoy visually distinctive indie games and can accept stylized card characters instead of conventional animated sprites.

## 3.2 Intended Session Structure

| Session Length | Likely Activity |

| --- | --- |

| 10–20 minutes | Farm maintenance, production collection, short expedition, training, or story event. |

| 30–60 minutes | One or more expeditions plus crafting, cultivation, and preparation progress. |

| 60–120 minutes | A substantial part of a fifteen-day cycle or a complete compressed prototype cycle. |



## 3.3 Scope Boundaries

The main game is designed as an indie premium title, not an MMO. The system architecture may support extensive content, but the base game should launch with a finite set of regions, companions, pets, cultivation realms, and siege families. New content should primarily reuse data-driven systems rather than require new bespoke code.

# 4. Character Creation and Early-Life Professions

## 4.1 Character Creation Goals

At the beginning of a new game, the player creates a personal young cultivator rather than selecting a permanent combat class. Character creation establishes visual identity, early strengths, practical experience, and a small set of background traits.

The player chooses:

- Character name.

- Avatar-card portrait base.

- Face, hair, and expression options supported by the layered portrait system.

- Clothing color and starting card-frame style.

- Early-life profession.

- One generated background record from a bounded set of profession-based rolls.

Because the game uses card avatars rather than skeletal characters, appearance customization is implemented through portrait layers, palette swaps, card frames, profession emblems, and optional alternate card illustrations. Equipment remains represented mainly through equipment icons, frame ornaments, and FX.

## 4.2 Early-Life Profession Rules

An early-life profession represents the work the protagonist performed before arriving at the mountain farmhouse. It is a starting background, not a permanent class.

Every profession grants:

- A bounded random package of six basic-attribute bonuses.

- Small starting progress toward one or two elemental affinities.

- Starting familiarity in one or two practical skills.

- One profession-related item or tool package.

- One starting recipe or device-related knowledge unlock.

- One fixed positive passive trait.

- One additional positive trait selected from a small profession-specific pool.

- One meaningful passive drawback.

All weapons, skills, recipes, cultivation paths, and affinities remain obtainable by every profession. Background choice changes the opening strategy and early efficiency rather than defining the entire playthrough.

## 4.3 Random Bonus Generation

Each profession uses a weighted attribute profile instead of fully unrestricted randomness.

Recommended starting model:

- Eight basic-attribute bonus points are distributed among the profession's favored attributes.

- A favored attribute normally receives between +1 and +4.

- Unfavored attributes may receive +0 or +1, preventing extreme min-max rolls.

- Two affinity-progress points are distributed among the profession's listed elemental tendencies.

- Starting skill familiarity is equivalent to approximately Skill Level 2–4, subject to final balance.

- Passive values shown in this section are initial tuning targets rather than final numbers.

To preserve randomness without encouraging endless rerolling, the game generates three background records after the player selects a profession. The player chooses one record and then confirms the character.

Each record displays:

- Exact attribute bonuses.

- Affinity tendencies.

- Starting skill familiarity.

- Starting equipment and recipe.

- Positive traits and drawback.

A difficulty or accessibility option may allow unrestricted rerolling for players who prefer precise build planning.

## 4.4 Initial Profession Roster

| Profession | Weighted Attributes | Affinity Tendencies | Starting Familiarity and Equipment |

| --- | --- | --- | --- |

| Miner / 礦工 | Strength, Constitution, Intelligence | Earth, Metal | Mining familiarity, worn pickaxe, ore pouch, basic smelting knowledge. |

| Lumberjack / 樵夫 | Strength, Constitution, Agility | Wood, Wind | Lumbering familiarity, wood axe, rope, timber-processing recipe. |

| Herbalist / 採藥人 | Intelligence, Spirit, Luck | Wood, Water | Herbalism familiarity, herb basket, dried herbs, basic healing-medicine recipe. |

| Farmer / 農夫 | Constitution, Strength, Luck | Wood, Earth | Farming familiarity, hoe, seed bundle, compost or fertilizer recipe. |

| Hunter / 獵人 | Agility, Intelligence, Luck | Wind, Metal | Hunting familiarity, simple bow, skinning knife, preserved-meat recipe. |

| Trapper / 陷阱師 | Intelligence, Agility, Luck | Earth, Wood | Trapping familiarity, trap components, bait, basic spike-trap recipe. |

| Runner / Mountain Courier / 山路信差 | Agility, Constitution, Luck | Wind | Running familiarity, light shoes, travel food, basic route-marker knowledge. |

| Alchemist Apprentice / 煉丹學徒 | Intelligence, Spirit, Luck | Fire, Wood | Alchemy familiarity, medicine tools, starter ingredients, basic pill recipe. |

| Blacksmith Apprentice / 鐵匠學徒 | Strength, Intelligence, Constitution | Metal, Fire | Forging familiarity, smithing hammer, scrap metal, iron-mechanism recipe. |

| Talisman Scribe / 符籙學徒 | Intelligence, Spirit, Luck | Light, Fire | Talisman familiarity, brush and ink, paper seals, basic Fire Talisman recipe. |

Additional professions may be added later through the same data-driven framework, such as Fisher, Carpenter, Scholar, Cook, Beast Keeper, Merchant Assistant, Temple Attendant, or Village Healer.

## 4.5 Profession Passive Traits

| Profession | Fixed Positive Trait | Additional Positive Trait Pool | Passive Drawback |

| --- | --- | --- | --- |

| Miner | **Stone Sense:** nearby ore nodes and weak walls are easier to detect; mining yield is slightly improved. | **Calloused Hands:** reduced Physical Energy cost while mining; or **Pack Mule:** increased carry capacity. | **Dust-Worn Lungs:** slightly slower Physical Energy regeneration while sprinting. |

| Lumberjack | **Clean Cut:** increased Log yield and reduced tool durability loss while chopping. | **Axe Rhythm:** slightly faster axe attacks; or **Resin Collector:** chance to gain extra resin and bark. | **Heavy Step:** slightly shorter dodge distance. |

| Herbalist | **Herb Eye:** nearby herbs are easier to identify and uncommon herbs have improved visibility. | **Gentle Hands:** chance for an extra herb; or **Toxicology:** increased poison resistance. | **Frail Frame:** slightly reduced maximum Health. |

| Farmer | **Green Thumb:** crops grow faster and are less likely to produce a poor harvest. | **Seed Saver:** chance to preserve seeds; or **Hearty Meals:** food buffs last longer. | **Untrained Fighter:** reduced combat-skill experience until any weapon skill reaches an early milestone. |

| Hunter | **Track Prey:** tracks, wounded animals, and nearby huntable creatures are easier to locate. | **First Shot:** bonus damage against unaware targets; or **Clean Kill:** improved meat and hide yield. | **Field Habit:** slightly slower production progress when personally operating stationary devices. |

| Trapper | **Efficient Mechanisms:** basic traps require fewer common materials or deploy faster. | **Patient Ambush:** increased trap damage after remaining undetected; or **Salvager:** chance to recover trap components. | **Weak Duelist:** slightly reduced direct basic-weapon damage. |

| Runner | **Mountain Legs:** sprinting consumes less Physical Energy. | **Quick Extraction:** reduced extraction-channel time; or **Sure Footing:** reduced terrain-slow penalties. | **Light Load:** reduced maximum carry capacity. |

| Alchemist Apprentice | **Furnace Familiarity:** reduced production time for basic medicine and pills. | **Material Saver:** small chance to preserve an ingredient; or **Stable Flame:** reduced Alchemy failure chance. | **Smoke-Weakened:** slightly reduced maximum Physical Energy. |

| Blacksmith Apprentice | **Tempered Craft:** improved quality floor for basic metal tools and weapons. | **Field Repair:** improved repair efficiency; or **Heat Endurance:** reduced Fire damage and furnace accidents. | **Slow Footwork:** small movement penalty while using heavy weapons or heavy armor. |

| Talisman Scribe | **Steady Brush:** improved quality and success rate for basic talismans. | **Ink Saver:** chance to preserve ink; or **Quick Seal:** slightly reduced cooldown for talisman-based active skills. | **Weak Grip:** slightly reduced direct melee-weapon damage. |

## 4.6 Trait Progression and Overcoming Drawbacks

Profession traits are passive modifiers and should be implemented as data-driven status effects with conditions, values, tags, and optional upgrade states.

Positive traits may improve when the player reaches related skill milestones. Examples include Stone Sense becoming Deep Vein Sense or Green Thumb becoming Spirit-Field Cultivation.

Drawbacks should remain meaningful during the opening but must not permanently ruin a preferred build. Each drawback can be reduced, replaced, or transformed through one or more of the following:

- Reaching a related skill milestone.

- Completing a profession-memory quest.

- Constructing a suitable training facility.

- Receiving training from a companion.

- Using a rare medicine or cultivation method.

- Reaching a cultivation-realm breakthrough.

Example: Dust-Worn Lungs may be removed through a lung-cleansing pill or transformed into **Deep Breath**, granting resistance to mine gas and poisonous fog.

## 4.7 Narrative and World Integration

The selected profession may influence:

- Opening dialogue and internal monologue.

- One introductory objective.

- Reactions from villagers, merchants, companions, and faction members.

- Small profession-specific opportunities during expeditions.

- Alternative solutions to selected quests.

- A limited number of unique recipes or early shortcuts.

Profession choice should not lock major companions, factions, cultivation realms, endings, or core regions. Its narrative purpose is to make the character's past visible while preserving long-term player freedom.

## 4.8 Profession Balance Principles

- All profession rolls use an equal total starting-power budget.

- Randomness changes distribution and flavor, not total value.

- No profession should be mandatory for a core system.

- Early bonuses should be noticeable during the first cycles but gradually become a smaller part of total power.

- Drawbacks must create an adaptation problem, not invalidate the profession's main strength.

- Profession traits, skill familiarity, starting items, and recipes must be defined through external data.

- The profession system should support future backgrounds without requiring changes to character-controller or combat code.

# 5. Core Gameplay Loop and Fifteen-Day Cycle

## 5.1 Moment-to-Moment Loop

1. Move through an isometric map and identify resources, enemies, routes, and points of interest.

2. Gather, fight, hunt, mine, or avoid danger using tools, weapons, active skills, passive attacks, companions, and pets.

3. Manage Health, Physical Energy, Hunger, Spiritual Energy, inventory capacity, durability, and time.

4. Extract to the farm and secure loot.

5. Process materials through devices and production queues.

6. Craft equipment, food, medicine, talismans, defenses, and farm upgrades.

7. Practice skills, spend skill points, cultivate, and prepare for the next objective.

## 5.2 Fifteen-Day Macro-Cycle

| Cycle Phase | Days | Primary Goals |

| --- | --- | --- |

| Development | 1–5 | Gather common resources, repair the farm, establish food, complete short quests, and begin production. |

| Expansion | 6–10 | Explore deeper zones, collect rare materials, improve devices, train skills, and investigate vague threat signs. |

| Warning | 11–13 | Reveal enemy element, route, objective, and likely boss through scouting, divination, tracks, and quests. |

| Final Preparation | 14 | Prioritize emergency production, repair defenses, assign companions, secure valuables, and select combat loadouts. |

| Major Siege | 15 | Defend the farm through waves, objectives, structures, formations, pets, companions, and direct combat. |

| Aftermath | Post-siege | Treat injuries, salvage defenses, process enemy remains, receive insights and rewards, then begin the next cycle. |



## 5.3 Normal Night Events

Most nights are not full sieges. Small events maintain atmosphere and uncertainty without exhausting the player.

- One or two wandering ghosts, a wild beast, a thief, or an enemy scout.

- A wounded traveler, merchant, spirit, villager, or faction messenger.

- A rare moonlit herb, unusual weather, spiritual anomaly, or companion scene.

- Sabotage or theft attempts that advanced guards, pets, formations, and patrols can handle automatically.

## 5.4 Siege Outcomes

Victory grants monster materials, cultivation resources, manuals, recipes, reputation, companion progress, and access to stronger content. Defeat is consequential but not automatically a game-over: buildings may be damaged, resources stolen, crops destroyed, companions injured, pets captured, or a section of the farm corrupted. Recovery quests can reclaim losses. Repeated failure may eventually threaten the Formation Core or cause occupation of part of the farm.

# 6. World Time, Risk, and Pacing

## 6.1 Daily Schedule

| Phase | Main Activity |

| --- | --- |

| Early Morning | Meditation, breakthroughs, skill study, and recovery. |

| Morning | Harvesting, feeding pets, collecting production, repairs, and expedition planning. |

| Daytime | Exploration, extraction, hunting, mining, logging, herb gathering, and quests. |

| Dusk | Return, secure loot, process materials, and review threat information. |

| Evening | Crafting, building, companion assignment, farm management, and social scenes. |

| Late Night | Cultivation, Alchemy, manuals, research, rest, and occasional supernatural events. |



The final game should tune a day to support meaningful travel and production planning. A suggested starting target is 12–20 real-time minutes per day, with configurable time scale and pausing rules. The vertical slice uses a shorter test cycle.

## 6.2 Risk Escalation During Expeditions

- Danger increases with time spent, distance from extraction, noise generated, local threat level, lunar conditions, and valuable loot carried.

- High-value discoveries can trigger hunters, rival cultivators, unstable weather, or stronger enemy spawns.

- Weight, injury, low food, low energy, and damaged equipment make retreat increasingly difficult.

- Players can reduce risk through maps, scouts, shortcuts, return talismans, pets, portals, mounts, and improved extraction routes.

# 7. Player Controls, Camera, and Card-Avatar Presentation

## 7.1 Default Movement and Interaction

| Input | Action |

| --- | --- |

| WASD | Screen-relative eight-direction movement in the isometric world. |

| Shift | Sprint; consumes Physical Energy and produces more noise. |

| Left Mouse Button | Basic attack, selected primary attack, or precise target interaction. |

| Spacebar | Basic attack with nearest-enemy assistance; keyboard-friendly alternative. |

| Right Mouse Button | Dodge or equipped defensive action. |

| E | Interact, gather, loot, talk, use device, or confirm contextual action. |

| Q | Quick-use item. |

| 1–4 | Active skills or assigned consumables. |

| F | Contextual companion command; hold for command wheel. |

| Tab | Inventory and equipment. |

| M | Map and expedition information. |



Diagonal speed is normalized. Movement is based on screen direction so WASD remains intuitive in the isometric view. The player card faces or tilts toward the cursor while aiming and toward movement while not attacking.

## 7.2 Camera

- Smooth player follow with configurable delay and map boundaries.

- Small look-ahead toward the cursor to improve aiming and exploration visibility.

- Optional zoom levels for accessibility and testing.

- Controlled screen shake for heavy impacts, bosses, and siege events.

- Foreground scenery fades when it blocks the player or important objectives.

## 7.3 Card Avatar Structure

- Portrait or half-body illustration, frame, Health bar, optional Spiritual Energy bar, level or realm marker, status icons, and faction marker.

- A ground anchor at the bottom center controls position, collision, sorting, attack range, aura range, and pathfinding.

- The visible card is not the collision box. Cards can overlap scenery while ground anchors remain accurate.

- Cards mostly face the camera, with horizontal mirroring, small rotation, tilt, and scale changes to communicate direction.

## 7.4 Procedural Movement

| State | Card Motion |

| --- | --- |

| Idle | Subtle floating, breathing scale, occasional tilt, and low-intensity elemental particles. |

| Walk | Alternating 2–5 degree tilt, 3–8 pixel bounce, slight sway, and soft ground dust. |

| Sprint | Faster wobble, forward lean, longer dust trail, afterimages, and wind lines. |

| Sneak | Compressed card, reduced wobble, lowered position, quieter FX. |

| Injured | Uneven timing, occasional shake, reduced bounce, status overlays. |

| Overloaded | Slow cycle, stronger downward squash, weight icon. |

| Supernatural Move | Afterimage, smoke, lightning streak, portal collapse, or floating sword FX replaces the normal wobble. |



## 7.5 Rendering and Layering

The recommended order is ground tiles, ground decals and formations, low props, shadows, cards, equipment icons, projectiles, combat FX, damage numbers, and foreground scenery. Character sorting uses ground-anchor Y position. Large cards, pets, and bosses use separate collision radii and shadows.

# 8. Combat System

## 8.1 Combat Goals

- Immediate, readable WASD-and-mouse combat that works with static illustrated cards.

- Manual movement, dodging, targeting, and priority decisions remain important at every power level.

- Basic melee combat evolves into a cultivation “bullet-heaven” layer of orbiting swords, auras, and auto-attacks.

- Preparation, elemental counters, companions, traps, and formations are as important as raw damage.

- Visual icon paths are presentation only; authoritative hitboxes and timing are data-driven.

## 8.2 Basic Attack Flow

1. The card tilts toward the cursor or assisted target.

2. A short anticipation squash or backward lean signals the attack.

3. The equipped weapon icon appears, enlarges, or moves from its resting position.

4. The icon follows a slash, thrust, spin, overhead, or projectile path.

5. Gameplay hit logic checks an arc, cone, line, circle, rectangle, or target.

6. Impact FX, damage, knockback, status, and enemy-card reaction occur.

7. The weapon returns or fades and the player enters a brief recovery state.

## 8.3 Weapon Families

| Weapon | Identity | Icon Motion |

| --- | --- | --- |

| Sword | Balanced speed, counters, criticals, Sword Qi, flying-sword compatibility. | Rapid curved slash or short launch and return. |

| Saber | Wide sweeps, bleeding, armor breaking, committed finishers. | Large slow arc with strong recoil. |

| Spear | Long narrow range, thrusts, control, mounted potential. | Straight line toward cursor. |

| Staff | Defense, knockback, area control, formation synergy. | Rotating sweep or ground slam. |

| Daggers | High speed, mobility, poison, back attacks. | Two icons strike from opposite angles. |

| Axe | Heavy stagger and early gathering utility. | Raised overhead then dropped with debris. |

| Pickaxe | Armor penetration and mining utility. | Short metallic overhead strike. |

| Bow | Range, precision, hunting, Wind synergy. | Bow icon compresses; arrow projectile launches. |

| Unarmed | Body cultivation, fast movement, Chi strikes. | Fist, palm, seal, or animal-shaped energy icons. |



## 8.4 Defensive Actions

- Default Right Click performs a directional dodge with Physical Energy cost, cooldown, brief invulnerability, card slide, afterimage, and transparency.

- Equipment and skills may replace dodge with block, parry, counter, smoke escape, Earth barrier, Spirit shield, or short teleport.

- Perfect parries knock aside enemy weapon icons, trigger a strong impact flash, briefly slow time, and open a counter window.

- Enemy attacks require wind-ups, ground telegraphs, directional indicators, card anticipation, and sound cues.

## 8.5 Primary, Active, Passive, and Aura Skills

| Category | Function | Examples |

| --- | --- | --- |

| Primary Attack | Frequently used manual attack that replaces or enhances basic attacks. | Sword Qi Slash, Flame Talisman, Spirit Arrow. |

| Active Technique | High-impact manually triggered skill with cost and cooldown. | Earth Prison, Sword Rain, Firestorm. |

| Movement Technique | Repositions or avoids damage. | Wind Step, Shadow Dash, Space Shift. |

| Passive Attack | Automatically targets, orbits, retaliates, or triggers under conditions. | Orbiting Sword, Spirit Needle, Lightning Seal. |

| Aura | Persistent ground-centered effect that reserves or consumes Spiritual Energy. | Flame Aura, Healing Lotus, Sword Intent. |

| Ultimate | Large battlefield effect tied to cultivation, equipment, or Dao. | Nine Heavens Sword Formation, Time Domain. |



## 8.6 Orbiting Swords and Auto-Attacks

Orbiting sword icons can damage on contact, block weak projectiles, launch at enemies, return, change formation, or prioritize defense. Upgrades increase sword count, orbit size, speed, elemental properties, target rules, and special formation attacks. Auto-attacks may target the nearest enemy, strongest enemy, lowest Health target, ranged attacker, marked target, or enemy threatening the Formation Core.

Automatic abilities must have cooldowns, range, line-of-sight, Spiritual Energy cost or reservation, and lower precision than manual attacks. Their purpose is to express cultivation growth and manage weak enemies—not to eliminate all player decisions.

## 8.7 Combat Feedback

- Enemy-card recoil, shake, rotation, flash, squash, frame crack, and knockback indicate impact.

- Critical hits use larger numbers, hit-stop, enlarged icons, stronger trails, and distinct sounds.

- Status effects use icons, frame overlays, ground FX, and tint: burning, poison, frozen, bleeding, cursed, shielded, stunned, and temporal slow.

- Defeated cards fall, desaturate, burn, crack, dissolve, shrink, or become mist before dropping loot icons.

- Day 15 readability takes priority over spectacle: telegraphs render above decorative FX and minor numbers combine.

## 8.8 Combat Loadouts

| Stage | Suggested Slots |

| --- | --- |

| Early Game | One weapon, basic attack, one active technique, one defensive action, one consumable. |

| Mid Game | Modified basic attack, three active techniques, movement/defense, one passive, one aura, three consumables. |

| Late Game | Main and secondary equipment, four active techniques, movement, defense, three passives, two auras, ultimate, four consumables. |



# 9. Player Resources, Attributes, and Elemental Affinities

## 9.1 Core Resources

| Resource | Purpose |

| --- | --- |

| Health | Physical life. Reduced by attacks, poison, bleeding, traps, starvation, hazards, and cultivation backlash. |

| Physical Energy | Spent on sprinting, dodging, gathering, heavy attacks, carrying, and selected martial techniques. |

| Hunger | Low Hunger reduces recovery, work efficiency, practice efficiency, and breakthrough stability. |

| Spiritual Energy | Spent or reserved by elemental techniques, flying swords, auras, talismans, formations, healing, and summons. |

| Cultivation Experience | Long-term progress toward realm stages, gained through meditation, combat, manuals, insights, pills, and major challenges. |



> **Removed Systems:** Warmth and Mental Stability are not core attributes. Environmental cold, fear, curses, possession, and corruption are handled through conditions, equipment, resistances, elements, and specific mechanics instead.


## 9.2 Six Basic Attributes

| Attribute | Primary Effects | Practice Sources |

| --- | --- | --- |

| Strength | Melee and heavy damage, carrying, knockback, armor breaking, mining, logging, repair. | Heavy weapons, mining, logging, carrying, strength training. |

| Constitution | Maximum Health and Physical Energy, recovery, injury, poison, bleeding, hunger tolerance. | Meaningful endurance, blocking, harsh expeditions, body cultivation, recovery. |

| Agility | Movement, attack speed, dodge, precision, critical chance, bow/dagger use, stealth. | Dodging real attacks, fast weapons, hunting, movement skills. |

| Luck | Rare drops, material quality, events, Alchemy bonus outcomes, taming, treasure. | Offerings, divination, hidden finds, fate events, companion bonuses; slow growth. |

| Intelligence | Learning speed, manuals, recipes, Alchemy, crafting quality, formations, analysis. | Reading, research, crafting, Alchemy, talismans, puzzles. |

| Spirit | Spiritual Energy, regeneration, elemental output, healing, aura/passive power, soul resistance. | Meditation, elemental skills, flying swords, formations, rituals, breakthroughs. |



## 9.3 Elemental and Dao Affinities

| Affinity | Core Identity | Typical Benefits |

| --- | --- | --- |

| 金 Metal | Sharpness, weapons, discipline, cutting force. | Sword/saber damage, armor penetration, flying swords, forging. |

| 木 Wood | Life, growth, herbs, poison, healing. | Farming, regeneration, poison, plant skills, medicine. |

| 水 Water | Flow, adaptation, cold, purification. | Healing, recovery, slow, Ice skills, Fire resistance. |

| 火 Fire | Destruction, heat, purification, Alchemy. | Burning, explosions, cooking, furnace control, ghost damage. |

| 土 Earth | Defense, stability, stone, construction. | Armor, barriers, building, knockback resistance, formation stability. |

| 雷 Lightning | Speed, burst, judgment, tribulation. | Chain attacks, Shock, movement bursts, tribulation resistance. |

| 光 Light | Healing, truth, Yang, protection. | Barriers, curse removal, ghost/undead damage, support. |

| 闇 Dark | Yin, shadows, curses, soul manipulation. | Stealth, drain, fear, ghost arts, corruption synergy. |

| 風 Wind | Movement, range, projectiles, freedom. | Speed, projectile velocity, dodge, knockback, flying swords. |

| 空間 Space | Distance, storage, portals, positioning. | Teleport, storage, extraction, portal attacks, formation range. |

| 時間 Time | Prediction, duration, slowing, acceleration. | Cooldown control, buffs, temporal fields, repeated or delayed effects. |



## 9.4 Affinity Stages and Interactions

Affinity stages are Dormant, Awakened, Familiar, Attuned, Mastered, Dao Resonance, and Domain. A player can use multiple elements, but specializing provides efficiency, evolution choices, and domain-level effects.

- Five-Element generation: Wood strengthens Fire; Fire creates Earth; Earth produces Metal; Metal gathers Water; Water nourishes Wood.

- Five-Element control: Wood controls Earth; Earth controls Water; Water controls Fire; Fire controls Metal; Metal controls Wood.

- Advanced examples: Water spreads Lightning, Wind expands Fire, Light purifies Dark, Space redirects or extends attacks, and Time changes duration or sequence.

- Element charts should be introduced through enemy information, recipe hints, and skill tooltips rather than requiring memorization.

# 10. Skills, Practice, and Cultivation Progression

## 10.1 Progression Model

Character progression uses four linked layers: cultivation realm, skill points, individual skill levels, and practice-driven attribute/affinity growth. Skill points unlock what the character can attempt. Meaningful practice determines how well the character performs it.

Discover → unlock → practice → raise skill → grow related attributes and affinities → choose evolution → create build synergy.

## 10.2 Skill Categories

- Weapon skills: Swordsmanship, Saber, Spear, Bow, Daggers, Staff, Unarmed.

- Gathering skills: Mining, Lumbering, Herbalism, Hunting, Fishing.

- Production skills: Crafting, Forging, Cooking, Alchemy, Tailoring, Talisman Arts, Formation Arts.

- Survival and movement: Dodge, Sprint, Tracking, Stealth, Extraction, Medicine.

- Cultivation techniques: active attacks, auras, passives, movement arts, defenses, summons, Dao skills.

- Companion and pet skills: Command, Taming, Training, Bond, Breeding, Support.

## 10.3 Skill Levels and Meaningful Use

| Level | Stage | Typical Unlock |

| --- | --- | --- |

| 1–9 | Novice | Basic function and first efficiency gains. |

| 10–24 | Practiced | Reduced cost, stable execution, first specialization requirement. |

| 25–49 | Skilled | Additional properties, better quality, skill-point milestone. |

| 50–74 | Expert | Major evolution node and advanced interactions. |

| 75–99 | Master | Strong passive effect, teaching, personal variants. |

| 100 | Grandmaster | Signature technique, inheritance, sect teaching, or New Game Plus legacy. |



Experience is only awarded for meaningful use. Attacking empty space, blocking harmless damage, repeatedly mining trivial stone, or spamming a movement skill in safety provides no or sharply reduced progress. Difficulty, danger, successful effect, resource rarity, and skill level influence experience.

## 10.4 Practice-to-Attribute Mapping

| Activity | Primary Growth | Secondary Growth |

| --- | --- | --- |

| Mining | Strength | Constitution, Earth |

| Lumbering | Strength | Constitution, Wood |

| Sprinting | Agility | Constitution, Wind |

| Dodge | Agility | Spirit, Wind |

| Swordsmanship | Agility or Strength | Metal, Spirit |

| Heavy Saber | Strength | Constitution, Metal |

| Bow | Agility | Intelligence, Wind |

| Alchemy | Intelligence | Spirit, Fire, Wood |

| Healing | Spirit | Intelligence, Wood or Light |

| Formation Construction | Intelligence | Spirit, Earth or Space |

| Meditation | Spirit | Intelligence and selected affinity |

| Hunting | Agility | Intelligence, Luck |



## 10.5 Skill Points

Skill points are earned through cultivation breakthroughs, skill milestones, manuals, major bosses, Day 15 victories, Dao insights, companion teaching, and important achievements. They unlock active skills, passives, auras, recipe families, combinations, loadout slots, and skill evolution nodes. Spending points does not directly raise a skill level.

Example: Sword Qi Slash requires Qi Gathering, Swordsmanship 10, Awakened Metal, a manual, and one skill point. Its damage, cost, speed, and evolution then improve through use. At skill milestones, the player may choose wider, piercing, rapid, returning, or multi-wave variants.

## 10.6 Cultivation Realms

| Realm | Combat and System Identity |

| --- | --- |

| Mortal | Improvised tools, food, traps, basic melee, and ordinary physical limits. |

| Body Tempering | Improved Health, Physical Energy, unarmed combat, heavy tools, and resistance. |

| Qi Gathering | Basic elemental techniques, Sword Qi, talismans, spiritual senses, first passive. |

| Foundation Establishment | Orbiting weapon, aura, improved movement, combination builds, advanced devices. |

| Golden Core | Multiple flying swords, strong automatic attacks, large formations, major area skills. |

| Nascent Soul | Remote control, spiritual avatar effects, advanced companions and domains. |

| Spirit Transformation | Large battlefield control, rare Space/Time access, advanced sect-level production. |

| Dao Integration | Personal Dao path and domain-level modification of multiple systems. |

| Tribulation Transcendence | Heavenly trials, extreme crafting, region-level threats. |

| Immortal Ascension | Endgame outcome and legacy systems. |



## 10.7 Training, Soft Caps, and Fatigue

- Farm facilities include training dummy, strength yard, agility course, meditation formation, Alchemy study, and elemental chambers.

- Safe training provides limited experience; dangerous real use remains the fastest path.

- Each realm has recommended attribute ranges. Training beyond the soft cap requires better manuals, facilities, pills, teachers, or a breakthrough.

- Repeating one activity for too long causes practice fatigue that lowers progression speed but not combat power.

- Companion training grants relationship progress, combination techniques, and specialty bonuses.

# 11. Exploration, Extraction, and Gathering

## 11.1 Expedition Structure

1. Select a destination and review known danger, travel time, extraction routes, weather, and recommended supplies.

2. Choose weapon, tools, food, medicine, talismans, active skills, passives, companion, pet, and carrying capacity.

3. Enter a fixed or procedural region, reveal routes, gather materials, investigate points of interest, and fight or avoid enemies.

4. Decide whether to extract, take a shortcut, enter a deeper layer, or risk a high-value objective.

5. Return through an extraction route and secure loot at the farm.

## 11.2 Defeat and Unsecured Loot

Items collected during an expedition are unsecured until extraction. Defeat returns the player home injured and causes partial loss of unsecured items. Bound equipment remains. Lost materials may form a recoverable bag at the defeat location, be taken by enemies, or trigger a rescue event. Time advances, and returning late may reduce preparation time before Day 15.

## 11.3 Gathering Activities

| Activity | Outputs and Decisions |

| --- | --- |

| Lumbering | Branches, firewood, timber, resin, spiritual wood. Noise can attract enemies; overlogging may affect spirits or regrowth. |

| Mining | Stone, copper, iron, silver, jade, spirit stones, elemental ore. Deeper layers offer better ore and stronger enemies. |

| Herbalism | Food plants, medicine, poison, incense, catalysts. Some herbs require moonlight, rain, Yin, seasons, or specific soil. |

| Farming | Transplanted herbs and food crops; growth depends on seed, soil, water, season, aura, and companion care. |

| Hunting | Meat, hide, bone, blood, cores, feathers. Tracking, bait, traps, bow use, pets, and population pressure matter. |

| Scavenging | Manuals, artifacts, scrap, tools, faction items, formation fragments, and clues. |



## 11.4 Extraction Methods

- Return to the entrance or reach a regional path.

- Activate an old teleport formation or later build an anchor.

- Use a consumable Return Talisman with interruption and cost.

- Open river, cave, mount, flying beast, or companion-assisted routes.

- Unlock permanent shortcuts from the dangerous side of a region.

# 12. Farm, Building, and Defense

## 12.1 Farm Transformation

The game begins with one damaged house, broken fence, small field, dry well, ruined shed, and inactive Formation Core. The long-term visual reward is transformation into a productive cultivation sanctuary with specialized rooms, companion homes, pet facilities, fields, workshops, defensive layers, and magical infrastructure.

## 12.2 Core Structures

| Structure | Function |

| --- | --- |

| Main House | Bed, storage, cooking, manuals, cultivation room, companion rooms, trophies. |

| Herb Garden | Medicinal and spiritual plant cultivation. |

| Workshop | Tools, components, repairs, traps, woodworking, basic assembly. |

| Forge Area | Smelting, metalworking, weapons, armor, mechanisms. |

| Alchemy Room | Medicine, pills, extracts, elemental control. |

| Meditation Chamber | Cultivation speed, Spirit practice, breakthrough support. |

| Spirit Beast Pen | Housing, feeding, training, healing, breeding, evolution. |

| Formation Core | Farm power, defenses, detection, barriers, advanced device network. |

| Watchtower | Threat detection, ranged defense, route visibility. |

| Underground Shelter | Emergency retreat, protected storage, recovery. |

| Companion Houses | Personal stories, morale, rest, specialization improvements. |



## 12.3 Defense Layers and Enemy Objectives

| Layer | Examples |

| --- | --- |

| Outer | Fence, wall, barricade, trench, warning bell, guard pets, bait. |

| Middle | Towers, spike traps, Fire traps, talisman posts, assigned companions, elemental formations. |

| Inner | Reinforced house, Formation Core, healing area, protected storage, emergency seal. |



Siege enemies may kill defenders, steal food, burn buildings, destroy crops, capture pets, possess companions, corrupt the spiritual vein, free sealed monsters, or attack the Formation Core. Objective variety prevents every siege from becoming simple elimination.

## 12.4 Siege Types

- Elimination: defeat all waves.

- Survival: remain alive and protect critical structures until sunrise.

- Protection: defend a companion, egg, refugee group, herb garden, or Formation Core.

- Ritual Disruption: leave the defensive line to interrupt an enemy ritual.

- Theft Raid: prevent enemies from escaping with supplies.

- Corruption Siege: cleanse poison, Yin, fire, or curses during combat.

- Boss Hunt: a powerful monster with elite support.

- Multi-Direction Siege: assign companions and automation to several approaches.

## 12.5 Threat Forecast

At the start of a cycle, the threat category is vague. Investigation through tracks, captured scouts, companion abilities, villagers, ruins, and divination reveals element, numbers, approach direction, special abilities, boss identity, and objective. By Days 11–14, a prepared player should understand which defenses, talismans, medicine, and elements are useful.

# 13. Recipe, Crafting, and Production Devices

## 13.1 Production Philosophy

All craftable items are defined by recipes. Simple items may be hand-crafted, but advanced products require raw materials, processed components, devices, fuel or energy, skill requirements, and production time. Devices continue working while the player explores, sleeps, cultivates, or fights.

Gather raw materials → process basic materials → create components → queue device production → collect output → assemble or upgrade final items.

## 13.2 Recipe Data

| Property | Description |

| --- | --- |

| Inputs | Exact items or flexible material tags, quantities, catalysts, tools, and intermediate components. |

| Device | Required workstation and minimum upgrade level. |

| Time | In-game production duration, from minutes to several days. |

| Power | Firewood, charcoal, water, Spiritual Energy, or specific elemental energy. |

| Requirements | Skill, skill level, attributes, affinity, realm, manual, environment, or companion. |

| Outputs | Main quantity, quality range, by-products, residue, and possible failure result. |

| Mastery | Repeated production reduces time and failure, improves quality, output, and automation. |



## 13.3 Device Interaction

1. Open a device and select an unlocked recipe.

2. Insert inputs, catalyst, fuel, or connect farm energy.

3. Select quantity and review total time, cost, worker, bonuses, and output capacity.

4. Start production; inputs are reserved or consumed according to recipe rules.

5. Production progresses through world time and pauses only if fuel, power, condition, environment, or output space fails.

6. Collect the output or route it to storage after automation is unlocked.

## 13.4 Core Devices

| Device | Main Outputs | Key Stats/Elements |

| --- | --- | --- |

| Workbench | Tools, timber parts, traps, furniture, repair kits, assembly. | Strength, Intelligence, Crafting, Wood. |

| Cooking Stove | Meals, preserved food, travel supplies, pet food. | Intelligence, Luck, Fire. |

| Drying Rack | Dried herbs, meat, hides, organs, talisman ingredients. | Weather, Wind, time. |

| Millstone | Flour, herb powder, bone powder, mineral powder. | Strength or Intelligence. |

| Smelting Furnace | Ingots, refined jade, elemental metal, slag. | Fire, Metal, Earth. |

| Forge and Anvil | Weapons, armor, mechanisms, tools, formation plates. | Strength, Intelligence, Metal, Fire. |

| Alchemy Furnace | Medicine, pills, elixirs, pet evolution items. | Intelligence, Spirit, Luck, Fire/Wood/Water. |

| Talisman Table | Attack, healing, detection, return, barrier, elemental talismans. | Intelligence, Spirit, associated affinity. |

| Formation Workshop | Flags, nodes, wards, barriers, portals, siege devices. | Intelligence, Spirit, Earth, Space. |

| Spirit Forge | Flying swords, artifacts, spiritual armor, high-level cores. | Advanced Metal, Fire, Spirit, elemental catalysts. |

| Loom | Clothes, robes, bags, banners, spirit-thread armor. | Agility, Intelligence. |

| Fermentation Jar | Pickles, vinegar, medicine wine, spirit wine, gifts. | Time and low supervision. |



## 13.5 Input, Queue, Output, and Failure

- Devices have input slots, optional fuel/catalyst slots, one or more processing slots, and output storage.

- Early devices support one order; upgrades add three, five, ten, or repeating queue entries.

- Production stops if output is full, fuel is empty, energy is unavailable, condition is zero, or required environment changes.

- Failure may create low-quality output, residue, partial loss, device damage, fire, gas, corruption, or an unexpected item. Mastered common recipes should rarely fail.

- Devices lose condition gradually and can be repaired through materials, kits, companions, and Metal/Earth techniques.

## 13.6 Flexible Recipes and Material Tags

Some recipes accept categories such as Healing, Liquid, Binding, Wood, Metal, Cloth, Fire, Water, Spiritual, Beast, Undead, Light, or Dark. Substitutes change output strength, duration, side effects, quality, time, and element. Important artifacts and story items still use exact ingredients.

## 13.7 Multi-Step Example: Iron Sword

1. Mine Iron Ore and gather fuel.

2. Smelt ore and charcoal in the furnace to create Iron Ingots.

3. Forge ingots into a Sword Blade.

4. Process timber and leather into a Sword Handle at the workbench.

5. Combine blade, handle, and binding at the forge to produce an Iron Sword.

6. Later use the Iron Sword, Spirit Metal, and a Beast Core as inputs for a spiritual upgrade.

## 13.8 Production and the Siege Cycle

| Days | Production Focus |

| --- | --- |

| 1–5 | Gather raw resources and repair basic devices. |

| 6–10 | Process timber, ingots, leather, powders, preserved food, and spiritual components. |

| 11–13 | Produce weapons, medicine, talismans, traps, ammunition, and counter-items. |

| 14 | Use urgent queues for repairs, healing, enemy-specific counters, and companion equipment. |

| 15 | Consume, damage, and test prepared items during the siege; salvage and process enemy remains afterward. |



## 13.9 Automation and Storage Routing

Early play requires manual carrying. Mid-game devices draw from nearby room storage. Late-game spatial storage and farm networks route materials, collect outputs, repeat common recipes, and obey priority and reserve rules. Automation handles routine production but cannot replace rare expeditions, experimentation, high-level breakthroughs, or strategic queue decisions.

# 14. Companions and Pets

## 14.1 Companion Principles

Companions have personal goals, routines, preferences, strengths, weaknesses, combat roles, farm specialties, relationship stages, and personal quests. Romance is optional and not required to access core utility. Companions should be able to disagree with the player and react to faction, moral, and cultivation choices.

## 14.2 Example Companions

| Character | Role and Specialty | Personal Conflict |

| --- | --- | --- |

| 荷仙子 — Lotus Spirit | Healing, herbs, Water purification, Wood/Water production, barriers. | Her divine nature is fading because the mountain water is corrupted. |

| 狐月 — Three-Tailed Fox | Scouting, illusions, trade, treasure, Luck, night patrol. | A powerful clan hunts her for her demon core. |

| 沈青璃 — Wandering Sword Cultivator | Sword combat, patrol, forging support, training, expeditions. | She seeks revenge but risks being consumed by hatred. |

| 墨铃 — Ghost Formation Scholar | Formations, talismans, ghost research, Dark/Space devices. | Her memories are sealed in lost formation fragments. |



## 14.3 Relationship Stages

Stranger → Guest → Trusted Ally → Close Friend → Dao Companion. Progress comes from shared work, training, gifts with personal meaning, protection, conversations, quest decisions, and cultivation. Companions unlock combination attacks, recipes, work bonuses, story outcomes, and training methods.

## 14.4 Companion Work and Siege Roles

| Preparation Roles | Siege Roles |

| --- | --- |

| Repair, craft medicine, produce arrows, patrol, investigate, train pets, gather basics, improve formations. | Defend gate, operate tower, heal, protect Formation Core, fight with player, control pets, extinguish fire, repair structures. |



## 14.5 Pets

| Pet | Functions |

| --- | --- |

| Spirit Dog | Detects ghosts, follows, attacks marked targets, guards gates or Formation Core. |

| Medicine Rabbit | Finds herbs, improves gardens, supports healing. |

| Stone-Shell Tortoise | Guards positions, stabilizes formations, provides defense. |

| Fire Crow | Ranged Fire attacks, furnace heat, lighting, aerial scouting. |

| Bamboo Mouse | Finds hidden items, collects by-products, enters small spaces. |

| Cloud Deer | Fast late-game mount and route support. |

| Demon Wolf Cub | Powerful combat pet with loyalty and training risks. |



Pets grow through feeding, training, combat, bonding, evolution materials, and bloodline awakening. Suggested stages are Young, Mature, Awakened, Spiritual, and Mythical. Commands are Follow, Attack, Guard, Search, and Retreat.

# 15. World Content: Regions, Enemies, Factions, and Narrative

## 15.1 Regions

| Region | Resources and Threats |

| --- | --- |

| Whispering Pine Forest | Wood, herbs, animals, shrines; boars, wolves, tree spirits, ghosts, bandits. |

| Blackstone Mine | Ore, spirit stones, ruins; spiders, corpse miners, stone spirits, burrowing beasts. |

| Hundred Herb Valley | Rare plants, poisons, water; snakes, insects, plant spirits, rival collectors. |

| Forgotten Burial Ground | Yin materials, relics; corpses, hungry ghosts, possessed armor, curses. |

| Fallen Immortal Ruins | Artifacts, formation knowledge, spatial materials; guardians, puppets, fractures, sealed demons. |

| Heavenly Beast Mountain | Mythical materials and endgame creatures; beast kings, extreme weather, elemental spirits. |



## 15.2 Enemy Roles

- Melee pressure units that surround the player.

- Ranged units that reposition and punish stationary play.

- Defensive units that block routes or shield elites.

- Ambushers hidden in trees, underground, fog, or scenery.

- Support units that heal, buff, revive, curse, or control.

- Siege units that ignore the player and attack structures.

- Assassins that target healers, companions, pets, or formation operators.

- Bosses with phase changes, summons, objective attacks, and card-frame transformations.

## 15.3 Factions

| Faction | Function |

| --- | --- |

| Mountain Villagers | Trade, rumors, local needs, workers, and consequences of supernatural activity. |

| Azure Cloud Sect | Traditional cultivation mentors who may protect, recruit, or control the player. |

| Black Lotus Cult | Curses, blood rituals, Dark techniques, infiltration, and forbidden bargains. |

| Hundred Beast Hall | Spirit-beast capture, training, trade, and conflict over pet ethics. |

| Wandering Merchant Alliance | Rare materials, caravans, contracts, and economic opportunities. |

| Spirit Court | Mountain gods, ghosts, and nature spirits judging ecological and spiritual choices. |

| Corpse Refining Sect | Undead production and interest in what is sealed beneath the farm. |

| Imperial Demon Bureau | Government cultivators who investigate threats and regulate dangerous arts. |



## 15.4 Main Narrative Structure

| Act | Focus |

| --- | --- |

| Act I — The Broken House | Repair shelter, establish food, survive early threats, discover the incomplete manual and first companion. |

| Act II — Secrets Beneath the Mountain | Restore the Formation Core, explore deeper regions, learn of the damaged spiritual vein and ruined sect. |

| Act III — The Returning Calamity | A sealed demon influences the mountain; alliances, large invasions, and companion conflicts intensify. |

| Act IV — Sect or Solitude | Decide whether the farm becomes a hidden sanctuary, sect, beast refuge, forbidden laboratory, or settlement. |

| Act V — Heavenly Tribulation | Prepare for ascension; ending depends on Dao, companions, factions, mountain state, and forbidden techniques. |



## 15.5 Dynamic Events

- Wounded cultivator, trapped caravan, missing villager, or mysterious immortal visitor.

- Ghost child at the well, spirit beast leaving its young, or companion disappearance.

- One-night herb bloom, meteor fall, blood moon, ghost fog, thunder event, or temporal anomaly.

- Roof damage, field curse, theft, faction demand, truce offer, or accusation from villagers.

# 16. User Interface and Information Design

## 16.1 Main HUD

- Health, Physical Energy, Hunger, Spiritual Energy, day, time, weather, and siege countdown.

- Equipped weapon icon, active skills, cooldowns, aura/passive states, quick item, companion and pet status.

- Contextual interaction prompt, target marker, carry weight, and unsecured-loot state.

- Formation Core Health, wave, enemy count, and objective during siege.

## 16.2 Character and Skill Screen

- Six basic attributes and their practice progress.

- Eleven affinity stages and related bonuses.

- Skill levels, familiarity, recent practice, soft caps, fatigue, and available skill points.

- Cultivation realm, meridian or breakthrough requirements, Dao insights, and loadout slots.

## 16.3 Recipe and Production Interfaces

- Recipe filters by category, device, material, element, siege use, available ingredients, and new discovery.

- Each page shows input alternatives, time, power, requirements, output quality, by-products, mastery, and capable devices.

- Device screen shows queue, missing inputs, fuel, worker, condition, progress, output, priority, and warnings.

- Tracked recipes show owned and missing quantities, intermediate steps, known gathering sources, and enemy drops.

## 16.4 Expedition and Farm Management

- Expedition map displays known routes, extraction points, danger, weather, travel time, and selected loadout.

- Farm overview displays device status, production priorities, workers, defenses, structure condition, storage, and threat forecast.

- Information should use icons and concise tooltips first, with detailed explanations available on demand.

# 17. Art, Audio, and Visual Effects

## 17.1 Art Direction

The environment uses a hand-painted 2D isometric style inspired by Chinese ink, storybook texture, damaged rural architecture, talismans, paper, timber, stone, fog, and strong silhouettes. It may capture the readable roughness and survival mood associated with hand-drawn genre games, but it must not reproduce another game’s exact proportions, line treatment, assets, or visual identity.

- Muted natural palette with high-contrast elemental and magical FX.

- Uneven ink outlines, paper textures, exaggerated architecture, layered weather, and seasonal transformation.

- Card portraits use approximately three-head-tall stylized character proportions when full figures are shown.

- Farm upgrades visually blend mortal repairs with increasingly supernatural construction.

## 17.2 Card and Equipment Asset Model

| Asset Type | Required Assets |

| --- | --- |

| Character | Main card illustration, frame, portrait icon, shadow, selection outline, optional injured/empowered or expression variants. |

| Weapon | Inventory icon, larger combat icon, motion pattern, trail, impact FX, optional elemental variations. |

| Skill | Activation icon, projectile or attack FX, impact FX, ground marker, status icon, sound cue. |

| Enemy | Card portrait, frame category, hit/death configuration, weapon or attack icons, telegraphs. |

| Boss | Large card, phase portraits or overlays, breakable icons, special frame, large ground effects. |



## 17.3 Reusable Motion Components

Idle Float, Walk Wobble, Sprint Lean, Hit Shake, Knockback Slide, Attack Anticipation, Attack Recoil, Heavy Squash, Dodge Afterimage, Death Collapse, Cast Float, Charge Pulse, Stun Shake, Frozen Lock, and Boss Phase Transform should be parameterized components. Equipment motion patterns include Straight Thrust, Curved Slash, Wide Sweep, Overhead Strike, Spin, Boomerang Return, Orbit, Target Launch, Ground Slam, Projectile Fire, Multi-Target Bounce, Rain from Above, and Portal Entry/Exit.

## 17.4 Audio

- Music uses guqin, dizi, erhu, pipa, wood percussion, ritual drums, natural ambience, and supernatural vocal textures.

- Morning is peaceful; exploration is curious; dusk is tense; siege is ritualistic and percussive; cultivation is meditative.

- Important sounds include tools, ore, paper talismans, formation hum, roof movement, animal warnings, distant ghosts, device completion, and spiritual flow.

- Audio cues must communicate off-screen threats and attack timing.

# 18. Difficulty, Accessibility, Economy, and Replayability

## 18.1 Difficulty Modes

| Mode | Intent |

| --- | --- |

| Peaceful Hermit | Reduced survival pressure, lighter loss, and easier sieges. |

| Mountain Survivor | Intended standard experience. |

| Ruthless Cultivation | More injuries, scarcity, enemy pressure, and extraction loss. |

| Heavenly Calamity | Aggressive enemies, limited recovery, and demanding preparation. |



## 18.2 Accessibility

- Remappable controls, Left Click/Spacebar attack alternatives, hold/toggle sprint and lock, adjustable aim assistance.

- Adjustable day length, reduced Hunger, reduced item loss, pause options, simplified crafting, automatic companion abilities.

- Large UI text, cursor size, colorblind support, telegraph intensity, damage-number options, reduced shake and flashing.

- FX-density control, combined damage numbers, simplified passive visuals, and strong player/ally outlines.

## 18.3 Economy Principles

- Common resources support routine survival and building; rare resources come from deeper expeditions, bosses, events, and faction trade.

- Material sinks include device upgrades, consumables, repair, defensive losses, experimentation, companion equipment, and breakthroughs.

- By-products, recycling, dismantling, and salvage reduce total waste and connect production chains.

- Automation reduces repetitive labor but consumes infrastructure, energy, workers, and setup resources.

## 18.4 Replayability

- Different elemental, weapon, production, companion, faction, and Dao builds.

- Procedural expedition variants, randomized manuals, artifacts, weather, and siege objectives.

- Multiple sanctuary outcomes and endings.

- New Game Plus may retain one Dao insight, one inherited artifact, a pet bloodline, selected recipes, cosmetics, or origin options.

# 19. Prototype and Vertical Slice

## 19.1 Prototype Goal

The first vertical slice must prove the integrated loop rather than isolated systems: card movement, icon combat, exploration, unsecured loot, recipes, timed devices, practice progression, farm preparation, and one compressed fifteen-day siege. Target playtime is 30–60 minutes.

## 19.2 Required Experience

1. Create an avatar card, choose one of the ten early-life professions, review three bounded background rolls, and confirm a starting record.

2. Start at the broken farmhouse with profession-based equipment plus the shared workbench, cooking fire, damaged furnace, storage, and basic survival supplies.

3. Explore one forest map, gather resources, fight enemies, and extract.

4. Process ore, herbs, food, and wood through devices.

5. Craft medicine, an improved sword, barricades, traps, and talismans.

6. Gain skill experience and spend a skill point on Sword Qi Slash.

7. Use one passive Orbiting Sword and one Minor Flame Aura.

8. Prepare and survive a three-wave Day 15 siege protecting the Formation Core.

9. Save, reload, and verify all progression, profession traits, and timers.

## 19.3 P0 Systems

- Character-creation screen, layered avatar-card customization, ten profession definitions, bounded background-roll generation, starting traits, items, skills, and recipes.

- Farm and forest maps, isometric collision, card sorting, camera, WASD movement, wobble, sprint, dodge.

- Equipment-icon attacks with sword, axe, pickaxe; hitboxes, damage, Health, telegraphs, enemy AI, loot.

- Health, Physical Energy, Hunger, Spiritual Energy, inventory, storage, equipment, carry weight.

- Gathering, unsecured loot, extraction, partial defeat loss.

- Data-driven items, recipes, Workbench, Cooking Fire, Furnace, Alchemy Furnace, Talisman Table, timers, output collection.

- World clock, day number, warning stages, Day 15 trigger, defenses, Formation Core, three siege waves.

- Sword Qi Slash, skill levels, skill points, meditation, basic save/load, debug tools, HUD and device UI.

## 19.4 P1 Systems

- Orbiting Sword passive, Minor Flame Aura, four prototype affinities: Metal, Wood, Fire, Light.

- Six basic attributes with slow practice growth.

- Spirit Dog commands: Follow, Attack, Guard, Retreat.

- Three-position device queues, worker assignment hook, improved UI, audio, and FX polish.

## 19.5 Prototype Content

| Category | Target |

| --- | --- |

| Maps | One farm and one forest expedition area. |

| Player/Pet | One customizable player card and one Spirit Dog. |

| Professions | Ten early-life professions with bounded rolls and passive traits. |

| Enemies | Wild Boar, Demon Wolf, Wandering Ghost, Siege Corpse, Ghost Captain. |

| Equipment | Wooden Axe, Stone Pickaxe, Rusted Sword, Iron Sword. |

| Skills | Basic Dodge, Sword Qi Slash, Orbiting Sword, Minor Flame Aura. |

| Resources | Approximately 10–15 raw materials. |

| Recipes | Approximately 15–25 recipes. |

| Devices | Workbench, Cooking Fire, Furnace, Alchemy Furnace, Talisman Table. |

| Defenses | Wooden Barricade, Spike Trap, Fire Talisman Trap, Repair Kit. |



## 19.6 Prototype Siege

| Wave | Purpose |

| --- | --- |

| Wave 1: Wandering Ghosts | Teach targeting and Fire/Light counters. |

| Wave 2: Wolves and Corpses | Mix player pressure with structure targeting and barricade testing. |

| Wave 3: Ghost Captain | Prototype boss card, objectives, skill usage, and final reward. |



The player wins by defeating all waves and the Ghost Captain while keeping the Formation Core alive. Fast-test controls must support time multipliers, skip to Day 14, start siege, spawn enemies, complete production, show hitboxes, show AI states, grant items, grant skills, and toggle invulnerability.

## 19.7 Excluded from the First Prototype

Procedural world generation, multiple regions, full seasons, romance, multiple humanoid companions, pet breeding, sect management, multiplayer, online services, full Space/Time trees, multiple siege families, advanced artifact networks, offline progression, full controller/mobile support, localization, voice acting, branching campaign, and New Game Plus are out of prototype scope.

# 20. Technical and Data Architecture

## 20.1 Data-Driven Definitions

Designers must be able to change content without editing system code. Data definitions are required for avatar options, professions, background rolls, passive traits, items, weapons, tools, recipes, devices, skills, attributes, affinities, enemies, attacks, resource nodes, loot tables, status effects, siege waves, production times, and companion roles. JSON, engine resources, Scriptable Objects, CSV, or database tables may be used depending on engine choice.

## 20.2 Required System Boundaries

- Combat logic is separate from icon animation and FX.

- World time is a shared service used by days, production, farming, meditation, events, and siege triggers.

- Inventory and item definitions are shared by loot, recipes, devices, storage, trade, and rewards.

- Gameplay actions emit events used by skill and attribute practice.

- AI targets abstract combat entities and objectives, not specific card artwork.

- Save data stores stable IDs and state, not direct scene references.

## 20.3 Save Data

- Character name, avatar-card customization, selected profession, background-roll seed, profession traits, starting unlocks, player position, map, day/time, resources, inventory, equipment, storage, skills, points, attributes, affinities, and realm.

- Recipe unlocks, device queues, production progress, fuel, output, condition, worker assignment.

- Farm structures, placement, Health, defenses, crops, Formation Core, siege state.

- Companion and pet states, relationships, assignments, injuries, commands.

- Quest, faction, region, extraction, lost-loot, and dynamic-event states.

## 20.4 Performance Targets

- Stable 60 FPS on primary PC target; minimum acceptable 30 FPS on low-end test hardware.

- Prototype stress test with at least 40 enemy cards, 30 projectile/equipment icons, 100 simple FX objects, and several production timers.

- Object pooling for projectiles, damage numbers, hit FX, enemy cards, loot icons, weapon icons, and telegraphs.

- No persistent memory growth after repeated map transitions and siege restarts.

- FX density, transparency layers, card resolution, and dynamic lighting are scalable settings.

## 20.5 Recommended Implementation Order

| Phase | Systems |

| --- | --- |

| 1. Foundation | Project structure, data loader, character creation, profession/trait definitions, input, time, save foundation, debug console. |

| 2. World | Isometric map, ground anchors, collision, sorting, movement, wobble, camera. |

| 3. Combat | Stats, equipment, icon attacks, hitboxes, damage, AI, dodge, loot, active skills. |

| 4. Exploration | Resource nodes, gathering, inventory, storage, transitions, unsecured loot, extraction. |

| 5. Production | Recipes, hand craft, device base, inputs/outputs, fuel, timer, unlocks, UI, persistence. |

| 6. Progression | Skill XP, levels, points, attributes, affinities, tree, meditation, passives, auras. |

| 7. Siege | Fifteen-day state machine, warning, placement, structures, waves, boss, rewards, reset. |

| 8. Polish | Pet, UI, audio, FX, performance, onboarding, balance, bug fixing. |



# 21. Production Roadmap, Risks, and Definition of Done

## 21.1 Development Phases

| Phase | Outcome |

| --- | --- |

| Prototype | Prove card movement, icon combat, extraction, recipes/devices, progression, and one siege. |

| Vertical Slice Polish | Final-quality example environment, UI direction, audio/FX language, onboarding, and balance. |

| Core Production | Additional regions, enemies, recipes, devices, companions, pets, siege families, narrative. |

| Content Expansion | Cultivation realms, factions, seasonal events, procedural layers, advanced automation, endings. |

| Release Preparation | Optimization, accessibility, localization, QA, achievements, store assets, controller support as scoped. |



## 21.2 Main Design Risks and Responses

| Risk | Response |

| --- | --- |

| Too Many Systems | Every system must support exploration, production, cultivation, sanctuary growth, or siege. Cut features that do not strengthen the loop. |

| Repetitive Cycle | Use dynamic events, threat variants, weather, companion stories, procedural layers, and different siege objectives. |

| Excessive Punishment | Use partial loss, recoverable bags, bound equipment, rescue events, recovery cycles, and difficulty options. |

| Passive Skills Remove Play | Keep manual attacks stronger for priority targets; require movement, energy, objectives, telegraphs, and positioning. |

| Production Becomes Waiting | Run timers during exploration, automate common recipes, reserve long times for powerful outputs, provide queues and priorities. |

| Card Combat Feels Cheap | Invest in timing, icon motion, sound, hit-stop, telegraphs, ground anchors, reactions, and high-quality portrait/icon art. |

| Siege Interrupts Preferred Play | Only every fifteenth day; minor threats become automatable; provide clear forecast and preparation agency. |

| Content Cost Grows | Use data-driven enemies, motion components, icon patterns, reusable FX, tags, and recipe templates. |



## 21.3 Vertical Slice Definition of Done

1. A new tester can customize an avatar card, choose a profession, compare three bounded background records, confirm the character, then move with WASD and understand card wobble, ground position, and camera behavior.

2. The tester equips a sword, attacks with Left Click or Spacebar, dodges, reads telegraphs, and defeats enemies.

3. The tester chops, mines, gathers, hunts, manages inventory, extracts, and understands unsecured loot.

4. The tester starts production on multiple devices, leaves the farm, returns, and collects correct outputs.

5. The tester gains skill levels through meaningful use, spends a skill point, and uses Sword Qi Slash, Orbiting Sword, and Flame Aura.

6. The tester places defenses and survives the Day 15 three-wave siege.

7. Save/load preserves items, queues, timers, skills, attributes, defenses, pet, and cycle state without duplication.

8. Performance meets the prototype stress target and debug tools can reproduce major states quickly.

# Appendix A. Default Controls

| Action | Default |

| --- | --- |

| Move | WASD |

| Sprint | Shift |

| Basic Attack | Left Mouse Button / Spacebar |

| Charged Attack | Hold attack input |

| Dodge / Block | Right Mouse Button |

| Interact / Gather | E |

| Quick Item | Q |

| Skills | 1–4 |

| Companion Command | F |

| Defensive Structure | G |

| Pet Follow / Attack | Z |

| Pet Guard | X |

| Retreat Command | C |

| Formation Core Ability | V |

| Target Lock | Middle Mouse Button |

| Inventory | Tab |

| Map | M |

| Pause | Esc |



# Appendix B. Initial Content Targets

| System | Prototype | Base-Game Direction |

| --- | --- | --- |

| Professions | Ten early-life professions | Ten or more backgrounds with expandable trait pools and narrative hooks. |

| Regions | Farm + Pine Forest | Six major regions with layers and events. |

| Enemies | 5 | Role-based families plus bosses and siege variants. |

| Companions | 0–1 humanoid placeholder + Spirit Dog | Four or more major companions. |

| Pets | Spirit Dog | Multiple utility/combat pets with growth. |

| Recipes | 15–25 | Large interconnected recipe network. |

| Devices | 5 | Basic, advanced, and cultivation devices with upgrades. |

| Elements | Metal, Wood, Fire, Light active | All eleven affinities. |

| Cultivation | Early Mortal/Qi concepts | Mortal through Immortal Ascension. |

| Sieges | One mixed ghost/beast siege | Multiple enemy families, objectives, bosses, and forecasts. |



# Appendix C. Glossary

| Term | Definition |

| --- | --- |

| 搜打撤 | Search, fight, and extract: enter a risky region, gather value, and return safely. |

| Card Avatar | Static illustrated character card moved and reacted through procedural transforms. |

| Ground Anchor | The world-space point used for position, collision, sorting, range, and pathfinding. |

| Equipment-Icon Attack | Weapon or tool icon moves through an attack pattern while hidden hit logic determines damage. |

| Early-Life Profession | A starting background that grants bounded random attributes, skill familiarity, items, recipes, and passive advantages and drawbacks without class-locking the character. |

| Profession Trait | A data-driven passive buff or drawback granted by the selected early-life profession. |

| Practice | Meaningful action experience that raises a skill and slowly contributes to attributes or affinity. |

| Skill Point | Currency used to unlock techniques, passives, auras, recipes, and evolution nodes. |

| Affinity | Mastery and compatibility with Metal, Wood, Water, Fire, Earth, Lightning, Light, Dark, Wind, Space, or Time. |

| Formation Core | Central magical infrastructure and primary siege objective of the farm. |

| Unsecured Loot | Expedition items that can be partially lost until successful extraction. |

| Production Device | Farm workstation that accepts recipe inputs and produces outputs after in-game time. |



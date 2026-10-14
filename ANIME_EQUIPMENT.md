# 🗡️ Slop Dungeon — Complete Item & Equipment Encyclopedia

This document contains the **comprehensive master catalog of all items, weapons, armor, consumables, and anime set bonuses** featured in **Slop Dungeon**.

Every item features unique procedural statistics, customized 2D Canvas rendering parameters, tailored Web Audio synthesizers, and dedicated scrap values when sold to **The Slop Merchant**.

---

## 📑 Table of Contents
1. [Rarity Tiers & Slop Scrap Values](#-rarity-tiers--slop-scrap-values)
2. [Master Item Catalog Table](#-master-item-catalog-table)
3. [Anime Equipment Sets](#-anime-equipment-sets)
   - [The Honored One (Cursed Sorcerer)](#1-the-honored-one-cursed-sorcerer)
   - [King of Curses (Cursed Sovereign)](#2-king-of-curses-cursed-sovereign)
   - [The Sorcerer Killer (Heavenly Restriction)](#3-the-sorcerer-killer-heavenly-restriction)
   - [The Black Swordsman (The Berserker)](#4-the-black-swordsman-the-berserker)
   - [Humanity's Strongest Soldier (Titan Hunter)](#5-humanitys-strongest-soldier-titan-hunter)
   - [Night City Legend (Cyber Sandevistan)](#6-night-city-legend-cyber-sandevistan)
4. [Baseline Dungeon Fantasy Gear](#-baseline-dungeon-fantasy-gear)
   - [Weapons](#weapons)
   - [Off-Hand & Shields](#off-hand--shields)
   - [Helmets](#helmets)
   - [Chest Armor](#chest-armor)
   - [Pants & Greaves](#pants--greaves)
   - [Boots](#boots)
5. [Consumables & Supplies](#-consumables--supplies)
6. [Economy, Trade-Up Forge & Gacha Wheel](#-economy-trade-up-forge--gacha-wheel)
7. [Future Equipment Roadmap](#-future-equipment-roadmap)

---

## 💎 Rarity Tiers & Slop Scrap Values

Every equipment piece belongs to one of five distinct rarity tiers. Scrap sell prices at The Slop Merchant are automatically determined by rarity:

| Rarity | UI Color | Border Hex | Scrap Value | Drop Pool & Power Profile |
| :--- | :--- | :--- | :--- | :--- |
| **COMMON** | `#94a3b8` (Slate Gray) | `#475569` | **5 Slops** 🪙 | Baseline gear & starter dungeon drops |
| **RARE** | `#38bdf8` (Sky Blue) | `#0284c7` | **15 Slops** 🪙 | Mid-tier equipment with specialized secondary stats |
| **EPIC** | `#c084fc` (Mystic Purple) | `#9333ea` | **35 Slops** 🪙 | High-tier dungeon gear & Sorcerer Killer components |
| **LEGENDARY** | `#fbbf24` (Amber Gold) | `#d97706` | **75 Slops** 🪙 | Lower body anime armor & high-tier weapons |
| **MYTHIC** | `#ff2a5f` (Neon Crimson) | `#e11d48` | **150 Slops** 🪙 | Signature anime relics, iconic cloaks & jackpots |

---

## 📊 Master Item Catalog Table

Summary table of all 54 active items registered in `ITEM_CATALOG`:

| No | Item ID | Item Name | Slot | Hands | Rarity | Set Archetype | Key Stats & Special Abilities | Scrap Value |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: |
| 1 | `gojo_blindfold` | Blindfold of the Six Eyes | Helmet | 1H | MYTHIC | The Honored One | HP +35, Armor +6, CDR -20% | 150 🪙 |
| 2 | `gojo_tunic` | High-Collar Jujutsu Tunic | Chest | 1H | MYTHIC | The Honored One | HP +55, Armor +15, Base Q: Limitless Barrier | 150 🪙 |
| 3 | `gojo_slacks` | Sorcerer Black Slacks | Pants | 1H | LEGENDARY | The Honored One | HP +25, Armor +8, Move Speed +22 | 75 🪙 |
| 4 | `gojo_loafers` | Polished Black Loafers | Boots | 1H | LEGENDARY | The Honored One | Move Speed +30, Dash Stamina -12 | 75 🪙 |
| 5 | `lapse_blue` | Cursed Technique: Lapse Blue | Weapon | 1H | MYTHIC | The Honored One | Dmg 42, Spd 1.15, Gravity Suction Pulses | 150 🪙 |
| 6 | `reversal_red` | Cursed Technique: Reversal Red | Off-Hand | 1H | MYTHIC | The Honored One | Dmg Buff +18, Armor +10, Repulsion Blast | 150 🪙 |
| 7 | `sukuna_crown` | Crown of the Disgraced One | Helmet | 1H | MYTHIC | King of Curses | HP +30, Crit Chance +25%, 4 Glowing Scarlet Eyes | 150 🪙 |
| 8 | `sukuna_robe` | Robe of Malevolence | Chest | 1H | MYTHIC | King of Curses | HP +50, Armor +18, Base Q: Dismantle | 150 🪙 |
| 9 | `sukuna_hakama` | Baggy Hakama Trousers | Pants | 1H | LEGENDARY | King of Curses | HP +30, Armor +12, Stamina Regen +10/s | 75 🪙 |
| 10 | `sukuna_zori` | Cursed Straw Zori | Boots | 1H | LEGENDARY | King of Curses | Move Speed +28 | 75 🪙 |
| 11 | `sukuna_kamutoke` | Kamutoke Vajra Dagger | Weapon | 1H | MYTHIC | King of Curses | Dmg 48, Spd 1.35, Arcing Lightning Sparks | 150 🪙 |
| 12 | `sukuna_cleaver` | Malevolent Cleaver | Weapon | **2H** | MYTHIC | King of Curses | Dmg 88, Spd 0.85, Reach 82, Crimson Cleave Arc | 150 🪙 |
| 13 | `sukuna_hiten` | Hiten Cursed Spear | Off-Hand | 1H | MYTHIC | King of Curses | Armor +12, Dmg Buff +15, Scorching Fire Thrust | 150 🪙 |
| 14 | `sukuna_finger` | Sealed Cursed Finger | Off-Hand | 1H | MYTHIC | King of Curses | Max HP +50, Dmg Buff +35, Armor +18 | 150 🪙 |
| 15 | `toji_worm` | Coiled Inventory Curse | Helmet | 1H | EPIC | Sorcerer Killer | HP +20, Armor +8 | 35 🪙 |
| 16 | `toji_shirt` | Compression Combat Shirt | Chest | 1H | EPIC | Sorcerer Killer | HP +45, Armor +14, Base Q: Spartan Kick | 35 🪙 |
| 17 | `toji_pants` | Baggy Gi Training Pants | Pants | 1H | EPIC | Sorcerer Killer | HP +25, Armor +10, Stamina Regen +12/s | 35 🪙 |
| 18 | `toji_slippers` | Heavenly Restriction Slippers | Boots | 1H | EPIC | Sorcerer Killer | Sprint Speed +35, Silent Steps | 35 🪙 |
| 19 | `inverted_spear_chain` | Inverted Spear & 1000-Mile Chain | Weapon | **2H** | MYTHIC | Sorcerer Killer | Dmg 75, Spd 0.95, Shield Nullifier, 360° Spin | 150 🪙 |
| 20 | `guts_beast_helm` | Berserker Beast Helm | Helmet | 1H | MYTHIC | The Black Swordsman | HP +40, Armor +16, Crit Chance +18% | 150 🪙 |
| 21 | `guts_berserker_plate`| Berserker Armor Plate | Chest | 1H | MYTHIC | The Black Swordsman | HP +85, Armor +28, Base Q: Cannon Arm | 150 🪙 |
| 22 | `guts_greaves` | Black Iron Greaves | Pants | 1H | LEGENDARY | The Black Swordsman | HP +35, Armor +18, Knockback Resistance | 75 🪙 |
| 23 | `guts_sollerets` | Heavy War Sollerets | Boots | 1H | LEGENDARY | The Black Swordsman | Move Speed +15, Armor +12, Trap Immunity | 75 🪙 |
| 24 | `dragon_slayer` | Dragon Slayer | Weapon | **2H** | MYTHIC | The Black Swordsman | Dmg 105, Spd 0.65, Reach 92, Heavy Cleave | 150 🪙 |
| 25 | `scout_hood` | Survey Corps Hooded Cloak | Helmet | 1H | MYTHIC | Humanity's Strongest | HP +30, Armor +8, Speed +16, CDR -15% | 150 🪙 |
| 26 | `odm_harness` | 3D Maneuver Gear & Gas Tanks | Chest | 1H | MYTHIC | Humanity's Strongest | HP +55, Armor +14, Stamina +15, Base Q: Gas | 150 🪙 |
| 27 | `scout_trousers` | Scout Cavalry Trousers | Pants | 1H | LEGENDARY | Humanity's Strongest | HP +25, Armor +10, Speed +18, Roll Cost -25%| 75 🪙 |
| 28 | `scout_boots` | Scout Knee-High Riding Boots | Boots | 1H | LEGENDARY | Humanity's Strongest | Move Speed +32, Armor +8 | 75 🪙 |
| 29 | `dual_snap_blades` | Dual Ultrahard Steel Snap Blades| Weapon | **2H** | MYTHIC | Humanity's Strongest | Dmg 48, Spd 1.25, Dual Slices, Crit +25% | 150 🪙 |
| 30 | `david_kiroshi` | Kiroshi Optics Mk. 4 | Helmet | 1H | MYTHIC | Night City Legend | HP +30, Crit Chance +25%, Tactical Lock-on HUD | 150 🪙 |
| 31 | `david_jacket` | High-Vis Cyber EMT Jacket | Chest | 1H | MYTHIC | Night City Legend | HP +45, Armor +14, Base Q: Overcharge | 150 🪙 |
| 32 | `david_pants` | Streetkid Cargo Pants | Pants | 1H | LEGENDARY | Night City Legend | HP +20, Armor +8, Speed +20, Stamina +15 | 75 🪙 |
| 33 | `david_sneakers` | Chrome Cyber-Sneakers | Boots | 1H | LEGENDARY | Night City Legend | Speed +28, Dash Cost -12% | 75 🪙 |
| 34 | `david_shotgun` | Carnage Shotgun | Weapon | 1H | MYTHIC | Night City Legend | Dmg 14x6 (84 dmg), Spd 0.45, 4 Shells Pump | 150 🪙 |
| 35 | `david_gorilla_arms` | Gorilla Arms Cyberware | Off-Hand | 1H | MYTHIC | Night City Legend | Dmg Buff +20, Punch Dmg 50, Armor Pen 35% | 150 🪙 |
| 36 | `rusty_sword` | Rusty Shortsword | Weapon | 1H | COMMON | — | Dmg 22, Spd 1.0, Reach 58 | 5 🪙 |
| 37 | `crystal_blade` | Crystal Scimitar | Weapon | 1H | RARE | — | Dmg 34, Spd 1.25, Reach 64 | 15 🪙 |
| 38 | `titan_greatsword` | Titan Greatsword | Weapon | **2H** | EPIC | — | Dmg 68, Spd 0.72, Reach 84, Sweeping Cleave| 35 🪙 |
| 39 | `thunder_warhammer` | Thunder Warhammer | Weapon | **2H** | LEGENDARY | — | Dmg 92, Spd 0.65, Reach 78, Concussive Slam| 75 🪙 |
| 40 | `wooden_buckler` | Wooden Buckler | Off-Hand | 1H | COMMON | — | Armor +5, Block Mitigation 50% | 5 🪙 |
| 41 | `iron_tower_shield` | Iron Tower Shield | Off-Hand | 1H | RARE | — | Armor +14, Block Mitigation 85% | 15 🪙 |
| 42 | `arcane_tome` | Arcane Grimoire | Off-Hand | 1H | EPIC | — | Armor +2, CDR -20%, Dmg Buff +12 | 35 🪙 |
| 43 | `iron_visor` | Iron Visor Helm | Helmet | 1H | COMMON | — | HP +15, Armor +4 | 5 🪙 |
| 44 | `horned_barbarian_helm`| Horned War Helm | Helmet | 1H | RARE | — | HP +30, Armor +8, Heavy Knockback Bonus | 15 🪙 |
| 45 | `shadow_hood` | Shadow Cowl | Helmet | 1H | EPIC | — | HP +20, Crit Chance +15% | 35 🪙 |
| 46 | `leather_tunic` | Leather Tunic | Chest | 1H | COMMON | — | HP +20, Armor +6, Base Q: War Cry | 5 🪙 |
| 47 | `spiked_cuirass` | Spiked Steel Cuirass | Chest | 1H | RARE | — | HP +45, Armor +16, Base Q: Iron Bastion | 15 🪙 |
| 48 | `celestial_mantle` | Celestial Mantle | Chest | 1H | LEGENDARY | — | HP +75, Armor +24, HP Regen +3/s, Base Q: Heal| 75 🪙 |
| 49 | `cloth_pants` | Padded Leggings | Pants | 1H | COMMON | — | HP +10, Stamina Regen +4 | 5 🪙 |
| 50 | `plated_greaves` | Heavy Plate Greaves | Pants | 1H | RARE | — | HP +25, Armor +10, Stamina Regen +8 | 15 🪙 |
| 51 | `travel_boots` | Worn Leather Boots | Boots | 1H | COMMON | — | Move Speed +15 | 5 🪙 |
| 52 | `wind_striders` | Wind Striders | Boots | 1H | RARE | — | Move Speed +35, Dash Stamina -10% | 15 🪙 |
| 53 | `health_flask` | Health Flask | Consumable| — | COMMON | — | Instantly restores +50 HP | 25 Slops (Buy) |
| 54 | `stamina_tonic` | Stamina Tonic | Consumable| — | RARE | — | Full stamina + 8s Unlimited Stamina | 20 Slops (Buy) |

---

## 🥋 Anime Equipment Sets

### 1. The Honored One (Cursed Sorcerer)
> *"Throughout Heaven and Earth, I alone am the honored one."*

* **Visual Theme**: High-collar dark midnight uniform, jet-black blindfold with glowing cyan eye slits, and orbiting Blue & Red energy spheres.
* **Set Components (6 Pieces)**:
  1. **Helmet**: `Blindfold of the Six Eyes` (`gojo_blindfold`, Mythic) — HP +35, Armor +6, CDR -20%.
  2. **Chest**: `High-Collar Jujutsu Tunic` (`gojo_tunic`, Mythic) — HP +55, Armor +15.
     - *Base Q*: **Limitless Barrier** — Spawns a tight spatial distortion field for 3.5s that slows nearby enemies and reflects enemy projectiles.
  3. **Pants**: `Sorcerer Black Slacks` (`gojo_slacks`, Legendary) — HP +25, Armor +8, Move Speed +22.
  4. **Boots**: `Polished Black Loafers` (`gojo_loafers`, Legendary) — Move Speed +30, Dash Roll Stamina Cost -12.
  5. **Weapon (1H)**: `Cursed Technique: Lapse Blue` (`lapse_blue`, Mythic) — Floating azure gravity vortex. Left-Click (42 Dmg) pulls enemies inward.
  6. **Off-Hand**: `Cursed Technique: Reversal Red` (`reversal_red`, Mythic) — Floating crimson repulsion sphere (+18 Dmg Buff, +10 Armor). Right-Click triggers a concussive shockwave blast.
* 🔮 **FULL SET BONUS — Hollow Purple**:
  - Replaces `[Q]` with the screen-clearing **Hollow Purple** singularity!
  - **Cinematic FX**: Screen collapses into a dark violet vignette vortex, firing a colossal 160px purple sphere that obliterates everything along its trajectory for **320 True Damage** with intense screen shake.

---

### 2. King of Curses (Cursed Sovereign)
> *"Know your place, fool."*

* **Visual Theme**: Flowing white ceremonial kimono with dark cursed markings, 4 glowing scarlet eyes, and choices between lightning vajra or heavy executioner cleaver.
* **Set Components (5 Required + Weapon Option)**:
  1. **Helmet**: `Crown of the Disgraced One` (`sukuna_crown`, Mythic) — HP +30, Critical Strike Chance +25%, manifests 4 glowing scarlet forehead eyes.
  2. **Chest**: `Robe of Malevolence` (`sukuna_robe`, Mythic) — HP +50, Armor +18.
     - *Base Q*: **Dismantle** — Launches 3 fan-shaped razor wind blades (75 Dmg each).
  3. **Pants**: `Baggy Hakama Trousers` (`sukuna_hakama`, Legendary) — HP +30, Armor +12, Stamina Regen +10/s.
  4. **Boots**: `Cursed Straw Zori` (`sukuna_zori`, Legendary) — Move Speed +28.
  5. **Weapon Options (Either satisfies set requirement)**:
     - `Kamutoke Vajra Dagger` (`sukuna_kamutoke`, 1H, Mythic) — Dmg 48, Spd 1.35. Lightning stabs arc into nearby enemies.
     - `Malevolent Cleaver` (`sukuna_cleaver`, **2H**, Mythic) — Dmg 88, Spd 0.85, Reach 82. Heavy two-handed butcher cleaves with crossing X slashes.
  6. **Optional Off-Hand**:
     - `Hiten Cursed Spear` (`sukuna_hiten`, Mythic) — Flaming cursed trident (+15 Dmg Buff, +12 Armor).
     - `Sealed Cursed Finger` (`sukuna_finger`, Mythic) — Wax-mummified talisman finger granting Max HP +50, Damage Buff +35, Armor +18.
* 💀 **FULL SET BONUS — World Cutting Slash**:
  - Replaces `[Q]` with reality-bisecting **World Cutting Slash**!
  - **Cinematic FX**: Viewport freezes in monochrome gray for 0.35s before a crimson-black fault line shears across the entire display, dealing **350 True Damage** to all intersected enemies.

---

### 3. The Sorcerer Killer (Heavenly Restriction)
> *"Zero cursed energy. Pure physical perfection."*

* **Visual Theme**: Fitted black compression shirt, coiled inventory curse wrapped over the shoulder, and a thousand-mile iron chain.
* **Set Components (5 Pieces)**:
  1. **Helmet**: `Coiled Inventory Curse` (`toji_worm`, Epic) — HP +20, Armor +8.
  2. **Chest**: `Compression Combat Shirt` (`toji_shirt`, Epic) — HP +45, Armor +14.
     - *Base Q*: **Spartan Kick** — Heavy forward boot launch that sends targets flying with extreme knockback and stun.
  3. **Pants**: `Baggy Gi Training Pants` (`toji_pants`, Epic) — HP +25, Armor +10, Stamina Regen +12/s.
  4. **Boots**: `Heavenly Restriction Slippers` (`toji_slippers`, Epic) — Sprint Speed +35, silent footsteps.
  5. **Weapon (2H)**: `Inverted Spear of Heaven & Thousand-Mile Chain` (`inverted_spear_chain`, Mythic) — Two-handed special grade cursed weapon (occupies both hand slots).
     - Left-Click: Long piercing spear thrust that nullifies enemy shields (75 Dmg).
     - Right-Click: Sweeps the heavy iron chain in a full 360° circle.
* ⛓️ **FULL SET BONUS — Inverted Chain Rampage**:
  - Replaces `[Q]` with a high-velocity rotating chain storm that shreds all surrounding foes and deflects incoming attacks.

---

### 4. The Black Swordsman (The Berserker)
> *"Even if we painstakingly piece together something lost, it doesn't mean things will ever go back to how they were."*

* **Visual Theme**: Jagged black steel plate armor, demonic beast wolf helmet with glowing red eye slits, and the massive slab-like Dragon Slayer.
* **Set Components (5 Pieces)**:
  1. **Helmet**: `Berserker Beast Helm` (`guts_beast_helm`, Mythic) — HP +40, Armor +16, Crit Chance +18%.
  2. **Chest**: `Berserker Armor Plate` (`guts_berserker_plate`, Mythic) — HP +85, Armor +28.
     - *Base Q*: **Cannon Arm** — Left arm prosthetic pivots open, firing an explosive artillery shell (130 Dmg AoE).
  3. **Pants**: `Black Iron Greaves` (`guts_greaves`, Legendary) — HP +35, Armor +18, knockback immunity.
  4. **Boots**: `Heavy War Sollerets` (`guts_sollerets`, Legendary) — Move Speed +15, Armor +12, ground spike trap immunity.
  5. **Weapon (2H)**: `Dragon Slayer` (`dragon_slayer`, Mythic) — 92px slab of dark iron (Dmg 105, Spd 0.65, Reach 92). Devastating 180° sweep with molten ember sparks.
* 🩸 **FULL SET BONUS — Berserker Beast Armor Unleashed**:
  - Replaces `[Q]` with **Berserker Rage**!
  - **Cinematic FX**: Crimson pulsating veins frame the screen border. Grants **100% total invulnerability** for 6.0 seconds, +85% attack speed, +50% movement speed, stun/knockback immunity, 35% lifesteal, and comic `CLANG!` impacts.

---

### 5. Humanity's Strongest Soldier (Titan Hunter)
> *"If you don't fight, you can't win."*

* **Visual Theme**: Deep green Scout hooded cloak with wings of freedom insignia, leather thigh harnesses, hip gas canisters, and twin snap blades.
* **Set Components (5 Pieces)**:
  1. **Helmet**: `Survey Corps Hooded Cloak` (`scout_hood`, Mythic) — HP +30, Armor +8, Move Speed +16, CDR -15%.
  2. **Chest**: `3D Maneuver Gear & Gas Canisters` (`odm_harness`, Mythic) — HP +55, Armor +14, Stamina Regen +15, active ODM gas gauge.
     - *Base Q*: **ODM Gas Boost** — Lunges forward with high-pressure steam propulsion.
  3. **Pants**: `Scout Cavalry Trousers` (`scout_trousers`, Legendary) — HP +25, Armor +10, Move Speed +18, Dash Cost -25%.
  4. **Boots**: `Scout Knee-High Riding Boots` (`scout_boots`, Legendary) — Move Speed +32, Armor +8.
  5. **Weapon (2H / Dual-wield)**: `Dual Ultrahard Steel Snap Blades` (`dual_snap_blades`, Mythic) — Dmg 48, Spd 1.25, Crit +25%. High-velocity twin cross-slashes.
* ⚔️ **FULL SET BONUS — ODM Grapple Whirlwind**:
  - Pressing `[Q]` activates **Full 3D ODM Maneuver Mode**:
  - Left-Click fires twin grapple cables with infinite range toward walls or targets.
  - The player accelerates supersonically, gliding through enemies with **zero collision (pass-through)**, spinning 360° for **80 Damage per slice**!
  - Gas tanks refill upon touching the ground.

---

### 6. Night City Legend (Cyber Sandevistan)
> *"I'm built different."*

* **Visual Theme**: Oversized fluorescent yellow EMT jacket with reflective safety bands, spinal Sandevistan chassis, and chrome cyber-sneakers.
* **Set Components (6 Pieces)**:
  1. **Helmet**: `Kiroshi Optics Mk. 4` (`david_kiroshi`, Mythic) — HP +30, Crit Chance +25%, tactical enemy lock-on analysis overlay.
  2. **Chest**: `High-Vis Cyber EMT Jacket` (`david_jacket`, Mythic) — HP +45, Armor +14.
     - *Base Q*: **Overcharge Boost** — Grants +35% sprint speed for 3.0 seconds.
  3. **Pants**: `Streetkid Cargo Pants` (`david_pants`, Legendary) — HP +20, Armor +8, Move Speed +20, Stamina +15.
  4. **Boots**: `Chrome Cyber-Sneakers` (`david_sneakers`, Legendary) — Move Speed +28, Dash Stamina Cost -12%.
  5. **Weapon (1H)**: `Carnage Shotgun` (`david_shotgun`, Mythic) — 4-shell pump shotgun. Fires a 6-pellet buckshot spread (14 Dmg per pellet = 84 total) with 22° spread. Auto-reloads after 4 shells.
  6. **Off-Hand**: `Gorilla Arms Cyberware` (`david_gorilla_arms`, Mythic) — Hydraulic titanium fist. Right-Click unleashes a 50 Dmg piston punch with 35% armor penetration (+20 passive Dmg Buff).
* ⚡ **FULL SET BONUS — Sandevistan Time Dilation**:
  - Replaces `[Q]` with military-grade **Sandevistan**!
  - **Cinematic FX**: Digital boot chord sounds (`BWEEEEE-SHOOOM`). Global time slows down to **10% of normal speed** for all monsters, projectiles, and teammates for 4.0 seconds, while the wearer moves at 100% full speed with persistent neon cyan and lime ghost-trails.

---

## 🛡️ Baseline Dungeon Fantasy Gear

### Weapons
1. **`rusty_sword` — Rusty Shortsword** *(Common, 1-Handed)*
   - Damage: **22** | Attack Speed: **1.00s** | Reach: **58px** | Scrap: **5 Slops**
2. **`crystal_blade` — Crystal Scimitar** *(Rare, 1-Handed)*
   - Damage: **34** | Attack Speed: **1.25s** | Reach: **64px** | Scrap: **15 Slops**
3. **`titan_greatsword` — Titan Greatsword** *(Epic, 2-Handed)*
   - Damage: **68** | Attack Speed: **0.72s** | Reach: **84px** | Scrap: **35 Slops**
4. **`thunder_warhammer` — Thunder Warhammer** *(Legendary, 2-Handed)*
   - Damage: **92** | Attack Speed: **0.65s** | Reach: **78px** | Scrap: **75 Slops**

### Off-Hand & Shields
1. **`wooden_buckler` — Wooden Buckler** *(Common)*
   - Armor: **+5** | Block Mitigation: **50%** | Scrap: **5 Slops**
2. **`iron_tower_shield` — Iron Tower Shield** *(Rare)*
   - Armor: **+14** | Block Mitigation: **85%** | Scrap: **15 Slops**
3. **`arcane_tome` — Arcane Grimoire** *(Epic)*
   - Armor: **+2** | Cooldown Reduction: **-20%** | Damage Buff: **+12** | Scrap: **35 Slops**

### Helmets
1. **`iron_visor` — Iron Visor Helm** *(Common)*: HP **+15**, Armor **+4** | Scrap: **5 Slops**
2. **`horned_barbarian_helm` — Horned War Helm** *(Rare)*: HP **+30**, Armor **+8**, Heavy Melee Knockback | Scrap: **15 Slops**
3. **`shadow_hood` — Shadow Cowl** *(Epic)*: HP **+20**, Crit Chance **+15%** | Scrap: **35 Slops**

### Chest Armor
1. **`leather_tunic` — Leather Tunic** *(Common)*: HP **+20**, Armor **+6**, Base Q: War Cry | Scrap: **5 Slops**
2. **`spiked_cuirass` — Spiked Steel Cuirass** *(Rare)*: HP **+45**, Armor **+16**, Base Q: Iron Bastion | Scrap: **15 Slops**
3. **`celestial_mantle` — Celestial Mantle** *(Legendary)*: HP **+75**, Armor **+24**, Health Regen **+3/s**, Base Q: Celestial Heal | Scrap: **75 Slops**

### Pants & Greaves
1. **`cloth_pants` — Padded Leggings** *(Common)*: HP **+10**, Stamina Regen **+4/s** | Scrap: **5 Slops**
2. **`plated_greaves` — Heavy Plate Greaves** *(Rare)*: HP **+25**, Armor **+10**, Stamina Regen **+8/s** | Scrap: **15 Slops**

### Boots
1. **`travel_boots` — Worn Leather Boots** *(Common)*: Move Speed **+15** | Scrap: **5 Slops**
2. **`wind_striders` — Wind Striders** *(Rare)*: Move Speed **+35**, Dash Stamina Cost **-10%** | Scrap: **15 Slops**

---

## 🧪 Consumables & Supplies

Purchasable from **The Slop Merchant** or discovered inside dungeon treasure chambers:

1. **`health_flask` — Health Flask** *(Common)*: Instantly restores **+50 HP** upon consumption (Cost: **25 Slops**).
2. **`stamina_tonic` — Stamina Tonic** *(Rare)*: Refills stamina instantly and grants **8 seconds of Unlimited Stamina** for continuous dodge rolls (Cost: **20 Slops**).

---

## 💰 Economy, Trade-Up Forge & Gacha Wheel

### 1. Shared Slops Vault & Homing Coins
- All players in a co-op room pool their currency into a single **Shared Party Slops Vault**.
- Defeated monsters and smashed pots drop physical coins that linger on the ground for 1 second before automatically **homing directly into the killer's position**.

### 2. The Slop Merchant & Spelunky RPG Retaliation
- Stations in the luxurious carpeted Merchant Chamber on every floor.
- Buys unwanted gear (*Scrap for Slops*) and sells essential potions.
- **RPG Retaliation Mechanic**: If struck or slapped by a player, the merchant shoulders a military rocket launcher, locks on with a red laser for **1.8s**, and fires high-velocity AoE rockets!

### 3. Trade-Up Forge (3-for-1 Recipe)
- Deposit **3 items of the exact same rarity** into the forge.
- Consumes all 3 items to produce **1 random item of the next higher rarity tier**:
  - `3 Common` ➔ **1 Random Rare**
  - `3 Rare` ➔ **1 Random Epic**
  - `3 Epic` ➔ **1 Random Legendary**
  - `3 Legendary` ➔ **1 Random Mythic**

### 4. Spin-a-Wheel Gacha Altar
- Wager any equipment piece on the altar wheel.
- **Probabilities (Strictly Zero Pity System)**:
  - 💥 **50% — Shattered**: Item disintegrates into worthless ash.
  - ⬆️ **45% — Upgrade**: Item is promoted to the next higher rarity tier.
  - 🎰 **5% — Jackpot**: Grants a secret **Anime Mythic** drop!

---

## 🔮 Future Equipment Roadmap

Planned sets currently scheduled for upcoming content expansions:

1. **The Caped Baldy (One-Punch Hero)**
   - Components: *Hero's Polished Scalp*, *Yellow Hero Suit & Cape*, *Hero Tights*, *Red Rubber Boots*, *Red Hero Glove*, *Grocery Bag*.
   - **Ultimate Q**: **Serious Punch** — High-contrast monochrome manga panel blast dealing **350 True Damage**.
2. **Devil's Footprints (Flame Ignition Soldier)**
   - Components: *Fire Brigade Visor*, *Bunker Coat*, *Turnout Pants*, *Devil's Ignition Boots*, *Flame Claws*.
   - **Ultimate Q**: **Adolla Flight & Light-Speed Kick** — Supersonic flame streak explosion.
3. **The Knight King (Plasma Paladin)**
   - Components: *Knight's Circlet*, *White Surcoat*, *Paladin Breeches*, *Excalibur (Plasma Blade)*.
   - **Ultimate Q**: **Violet Flash: Earth Divider** — Massive horizontal plasma blade sweep.
4. **True Demon Lord (Slime Sovereign)**
   - Components: *Anti-Magic Mask*, *Demon Lord Coat*, *Demon Katana*, *Water Orb*.
   - **Ultimate Q**: **Beelzebuth** — Black hole gravity vortex that swallows all projectiles and heals the caster.
5. **The God of Judgment (Kira)**
   - Components: *Judgment Spectacles*, *School Uniform Blazer*, *Dress Shoes*, *The Death Note*.
   - **Ultimate Q**: **Heart Attack Judgment (40s)** — Timed instant-death judgment against room bosses.
6. **The Death Returner & The Oni Maid**
   - Components: *Legendary Tracksuit*, *Return by Death* (Passive rewind on death) & *Spiked Morningstar Flail*.

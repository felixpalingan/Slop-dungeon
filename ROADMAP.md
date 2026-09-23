# Dungeon Slop — Development Roadmap & Implementation Plan

A 1 to 6 player cooperative top-down dungeon crawler designed for chaotic friend-group fun. Delve as deep into procedural roguelike dungeon floors as possible — loot, gamble, and survive!

All visuals are **100% procedural 2D shapes** (zero sprite art needed), networking runs serverlessly via **WebRTC (PeerJS)** with room codes, and the game features a full 6-slot gear system, shared ground loot trading, anime full-screen cinematic ultimates, a gambling/transmutation merchant, downed/revive co-op mechanics, and escalating procedural dungeon floors with traps and enemy variety.

---

## Phased Development Roadmap

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          Dungeon Slop Phase Gates                          │
├────────────────────────────────────────────────────────────────────────────┤
│  Phase 1: Foundation, Procedural 2D Character & Movement [DONE ✅]         │
│      ▼                                                                     │
│  Phase 2: WebRTC Multiplayer, In-World Wardrobe & Slap Physics [DONE ✅]   │
│      ▼                                                                     │
│  Phase 3: Equipment System, Ground Loot Trading & Anime Gear Batches       │
│    ├── Step 3.1: 6-Slot Gear Catalog & Procedural Visuals [DONE ✅]        │
│    ├── Step 3.2: Real-Time Combat & Shield Blocking [DONE ✅]              │
│    ├── Step 3.3: Ground Loot Entities & Inventory UI [DONE ✅]             │
│    ├── Step 3.4: Anime Batch 1 (Jujutsu Kaisen & Berserk) [DONE ✅]        │
│    ├── Step 3.5: Anime Batch 2 (AoT, Cyberpunk) [DONE ✅]                  │
│    │     • Levi Ackerman — ODM Gear & Dual Snap Blades [DONE ✅]           │
│    │     • David Martinez — Sandevistan & Carnage Shotgun [DONE ✅]        │
│    │     • Saitama (One Punch Man) [UPCOMING]                              │
│    └── Step 3.6: Anime Batch 3 (Fire Force, Tensura, Death Note, Re:Zero) [UPCOMING]
│      ▼                                                                     │
│  Phase 4: Procedural Dungeon, Monster AI, Themed Floors & Boss Fights      │
│    ├── Step 4.1: Procedural Room Generation & Cardinal Doors [DONE ✅]     │
│    ├── Step 4.2: 3 Monster Archetypes (Swarmer/Ranged/Brute) [DONE ✅]     │
│    ├── Step 4.3: Floor 1 — JJK Detention Center (Finger Bearer Boss) [DONE ✅] │
│    ├── Step 4.4: Floor 2 — Cyberpunk Arasaka Sublevel (Adam Smasher) [DONE ✅]  │
│    ├── Step 4.5: Floor 3 — AoT Wall Maria Crypts (Armored Titan) [DONE ✅] │
│    ├── Step 4.6: Boss Multi-Phase Attacks & Phase 2 Enrage [DONE ✅]       │
│    └── Step 4.7: Floor Selector & Dev Test Hub [DONE ✅]                   │
│      ▼                                                                     │
│  Phase 5: Gameplay Refinement & Content Depth [IN PROGRESS 🔧]             │
│    ├── Step 5.1: Downed / Revive Co-op System [UPCOMING]                   │
│    ├── Step 5.2: Game Over / Party Wipe & Victory Summary Screen [UPCOMING]│
│    ├── Step 5.3: New Enemy Types (Kamikaze / Shaman Buffer) [UPCOMING]     │
│    ├── Step 5.4: Room Hazards & Traps (Spike / Flame Pillar) [UPCOMING]    │
│    ├── Step 5.5: Merchant Room + Gacha Gambling Altar [UPCOMING]           │
│    ├── Step 5.6: Restore True Roguelike Procedural Layout [UPCOMING]       │
│    └── Step 5.7: Lobby Dev Mode Cleanup (Dev Armory Chest) [UPCOMING]     │
│      ▼                                                                     │
│  Phase 6: Anime Batch 3, Polish & Public-Ready Build [PLANNED]             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Phases & Progress

### Phase 1: Foundation, Procedural 2D Character & Movement `[COMPLETED ✅]`
- Canvas setup, viewport resize listeners, high-DPI rendering.
- Vector circle character with directional aim facing mouse cursor.
- WASD directional movement with normalized diagonals.
- Left Shift Dodge Roll with after-image ghost trails and stamina gauge.
- Web Audio API procedural audio framework.

---

### Phase 2: WebRTC Multiplayer, In-World Wardrobe & Slap Physics `[COMPLETED ✅]`
- Serverless peer-to-peer room hosting and joining using PeerJS (`SLOP-XXXX`).
- Automatic host migration / client state synchronization at 20 ticks/sec.
- In-world wardrobe dressing mirror: custom name input and hex color palette dye picker.
- Comic slap physics on Right-Click with knockback impulse and `BONK!` comic text popups.
- Training Dummy with physics spring recoil, damage numbers, and health bars.

---

### Phase 3: Equipment System, Ground Loot & Anime Gear Batches `[PARTIALLY COMPLETE]`

- **Step 3.1–3.4: Core Gear, Combat, Loot UI, Batch 1** `[COMPLETED ✅]`
  - 6-slot gear system (Helmet, Chest, Pants, Boots, Weapon, Off-hand) with full stat recalculation.
  - Real-time weapon arc combat, shield blocking (up to 85% mitigation), critical hits.
  - Ground loot entities with rarity glow beams, proximity `[E]` pickup, and 10-slot backpack.
  - **JJK Set**: Gojo (*Hollow Purple* ultimate), Sukuna (*World Cutting Slash*), Toji (*Chain Rampage*).
  - **Berserk Set**: Guts (*Berserker Rage* invulnerability + lifesteal).

- **Step 3.5: Anime Batch 2 — AoT & Cyberpunk** `[PARTIALLY COMPLETE]`
  - **Levi Ackerman** `[DONE ✅]`: ODM Dual Grapple Cables (Fanny MLBB-style), 360° Blade Whirlwind.
  - **David Martinez** `[DONE ✅]`: Sandevistan Global Slow-Mo (10% speed for all, David full speed), Carnage Shotgun 6-pellet cone.
  - **Saitama (One Punch Man)** `[UPCOMING]`: Bald Hero Suit, Consecutive Normal Punches, *Serious Punch* black-and-white manga cinematic.

- **Step 3.6: Anime Batch 3** `[UPCOMING]`
  - Shinra & Arthur (Fire Force), Rimuru (Tensura), Light Yagami (Death Note), Subaru & Rem (Re:Zero).

---

### Phase 4: Procedural Dungeon, Monster AI & Themed Floor Descent `[COMPLETED ✅]`

- **Room Generation**: Isaac-style discrete room graph, door transitions with physics-correct portal spawning.
- **3 Monster Archetypes**: Swarmer (fast, swarm AI), Ranged (kiting + projectiles), Brute (telegraphed AoE ground slam).
- **Door Lockdown System**: Rooms lock when player enters; all enemies must die before doors reopen.
- **3 Themed Floors** with unique mob squads, music, palette, and boss encounters:
  - **Floor 1 — JJK Detention Center**: Fly Heads, Masked Ino, Cursed Brutes → **Finger Bearer Boss** (3-attack phases + Phase 2 enrage).
  - **Floor 2 — Cyberpunk Arasaka Sublevel**: Maelstrom Cyberpsychos, Tyger Claw Snipers, Arasaka Drones → **Adam Smasher Prototype** (Hydraulic Slam / Missile Salvo / Laser Sweep + Phase 2 Sandevistan Overclock).
  - **Floor 3 — AoT Wall Maria Crypts**: Crawler Titans, Marleyan Riflemen, Hardened Brutes → **Armored Titan** (Crystal Fist / Bull Rush / Steam Vent + Phase 2 Crystal Shatter & Steam Geyser death).
- **Multi-Phase Bosses**: Unique visuals, 3 distinct attack patterns per floor, Phase 2 enrage at 50% HP, unique death animations, Legendary loot explosion on kill.
- **Exit Portal with Countdown**: All players must stand in portal together; 3-second group countdown before descent.
- **Floor Selector (Dev Tool)**: `[F]` hotkey + HUD badge click + in-lobby Dimensional Gateway Altar for instant floor warping during development.

---

### Phase 5: Gameplay Refinement & Content Depth `[IN PROGRESS 🔧]`

> Core goal: Make the dungeon feel dangerous, tense, rewarding, and adictively replayable.

- **Step 5.1: Downed / Revive Co-op System** `[UPCOMING]`
  - HP reaching 0 triggers *Downed* crawl state (30s bleed-out, 60% speed penalty, cannot attack).
  - Teammates hold `[E]` for 2.5s to revive (interruptible by incoming damage).
  - Solo death → Ghost Spectator mode until team clears floor or descends.
  - Full Party Wipe → **Game Over Screen**.

- **Step 5.2: Game Over / Victory Summary Screen** `[UPCOMING]`
  - Party Wipe triggers dramatic screen shake + blood-red vignette fade into **Wipe Screen**.
  - Stats: Total Kills, Damage Dealt, Floors Reached, Time Survived, and top MVP player.
  - Buttons: *Restart to Lobby* / *Try Again from Floor 1*.
  - Boss-clear victory banner and "Descend Deeper?" prompt after Floor 3 (cycle loop or final fanfare).

- **Step 5.3: New Enemy Types** `[UPCOMING]`
  - **Kamikaze Exploder** (`cursed_bomb` / `suicide_drone`): Sprints toward player, flashes red, detonates with a 1-second AoE warning circle and a massive explosion. Reward: large loot drop.
  - **Shaman / Buffer** (`curse_chanter`): Kites away while emitting an aura shield or HP regen to nearby allies. Priority target — players must hunt this one first or fight unkillable mobs.

- **Step 5.4: Room Hazards & Traps** `[UPCOMING]`
  - **Spike Trap**: Floor tiles that surge upward periodically (or 0.5s after being stepped on). Enemies can be lured into them.
  - **Cursed Flame Pillar / Gas Vent**: Rotating jets of cursed fire/steam in arena center, forcing positional combat.

- **Step 5.5: Merchant Room + Gacha Gambling Altar** `[UPCOMING]`
  - New room type: **Merchant Den (💰🎲)** — placed as a mid-floor branch in the procedural layout.
  - **Standard Shop**: Purchase Health Potions (+50 HP), Stamina Elixirs, or Throwable Bombs using dropped Soul Coins.
  - **Trade-Up Forge (3-for-1)**: Sacrifice 3 items of the same rarity → receive 1 item of the next tier (animated forge blast VFX).
  - **Cursed Dice (The Gamble)**: Sacrifice 1 item + Soul Coins → spin the roulette:
    - 🎰 *Jackpot (15%)*: Mythic / secret Anime Legendary item!
    - ✅ *Win (50%)*: Item one tier higher.
    - 💥 *Bust (35%)*: Item shatters — only ash and a comic `SHATTERED! 💥` popup remain.

- **Step 5.6: Restore True Roguelike Procedural Layout** `[UPCOMING]`
  - Remove the fixed cardinal hub layout from `dungeon.generate()`.
  - Restore random-walk expansion (7–10 rooms) with BFS-assigned Boss and Treasure dead-ends.
  - Add new room types to the graph: `merchant` and `trap` variants.
  - **Dev Toggle**: Floor Selector modal keeps a `[x] Test Hub Mode` checkbox for development-only fixed layouts.

- **Step 5.7: Lobby Dev Mode Cleanup** `[UPCOMING]`
  - In **live mode**: Lobby spawns only with default starter gear (Rusty Sword / Leather Tunic).
  - Move all Batch 1/2 demo gear into a **Dev Armory Chest** prop in the lobby corner, only visible in dev/test mode.
  - Players must earn anime gear through dungeon loot progression.

---

### Phase 6: Anime Batch 3, Final Polish & Public Build `[PLANNED]`
- Complete Saitama set (*Serious Punch* manga cinematic).
- Anime Batch 3: Shinra (Fire Force), Rimuru (Tensura), Light (Death Note), Subaru/Rem (Re:Zero).
- Performance optimization and production release packaging.
- Victory / wipe run statistics screen with damage, revive, and floor depth stats.

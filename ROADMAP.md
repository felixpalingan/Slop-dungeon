# Slop Dungeon 🗡️🎲 — Development Roadmap & Implementation Plan

> **Repository**: [https://github.com/felixpalingan/Slop-dungeon](https://github.com/felixpalingan/Slop-dungeon)

A 1 to 6 player cooperative top-down dungeon crawler designed for chaotic friend-group fun. Delve as deep into procedural roguelike dungeon floors as possible — loot, gamble, and survive!

All visuals are **100% procedural 2D shapes** (zero sprite art needed), networking runs serverlessly via **WebRTC (PeerJS)** with room codes, and the game features a full 6-slot gear system, shared ground loot trading, anime full-screen cinematic ultimates, a shared-wallet Slop economy with the Slop Merchant, a spin-a-wheel gacha altar, downed/revive co-op mechanics, and escalating procedural dungeon floors with traps and enemy variety.

---

## Phased Development Roadmap

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          Slop Dungeon Phase Gates                          │
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
│    ├── Step 5.5: Slop Merchant, Economy, Spin-a-Wheel Gacha & Trade-Up [UPCOMING] │
│    ├── Step 5.6: Random Grid Dungeon Map Generation with Guaranteed Rooms [DONE ✅] │
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

> Core goal: Make the dungeon feel dangerous, tense, rewarding, and addictively replayable with maximum friend-group chaos.

- **Step 5.1: Downed / Revive Co-op System** `[UPCOMING]`
  - HP reaching 0 triggers *Downed* crawl state (30s bleed-out, 60% speed penalty, cannot attack).
  - Teammates hold `[E]` for 2.5s to revive (interruptible by incoming damage).
  - Solo death → Ghost Spectator mode until team clears floor or descends.
  - Full Party Wipe → **Game Over Screen**.

- **Step 5.2: Game Over / Victory Summary Screen** `[UPCOMING]`
  - Party Wipe triggers dramatic screen shake + blood-red vignette fade into **Wipe Screen**.
  - Stats: Total Kills, Damage Dealt, Floors Reached, Time Survived, and top MVP player.
  - Buttons: *Restart to Lobby* / *Try Again from Floor 1*.
  - Boss-clear victory banner and "Descend Deeper?" prompt after Floor 3.

- **Step 5.3: New Enemy Types** `[UPCOMING]`
  - **Kamikaze Exploder** (`cursed_bomb` / `suicide_drone`): Sprints toward player, flashes red, detonates with a 1-second AoE warning circle and a massive explosion. Reward: large Slops drop.
  - **Shaman / Buffer** (`curse_chanter`): Kites away while emitting an aura shield or HP regen to nearby allies. Priority target — players must hunt this one first or fight unkillable mobs.

- **Step 5.4: Room Hazards & Traps** `[UPCOMING]`
  - **Spike Trap**: Floor tiles that surge upward periodically (or 0.5s after being stepped on). Enemies can be lured into them.
  - **Cursed Flame Pillar / Gas Vent**: Rotating jets of cursed fire/steam in arena center, forcing positional combat.

- **Step 5.5: Slop Merchant, Economy, Spin-a-Wheel Gacha & Trade-Up** `[COMPLETED ✅]`
  - **Currency**: **Slops** (in-run currency).
  - **Shared Party Wallet**: 1 shared Slops balance for all connected players — maximum co-op communication and chaotic spending!
  - **The Slop Merchant**:
    - Appears in dedicated Merchant Rooms.
    - Sells survival consumables (Health Flask +50 HP, Stamina Tonic).
    - **Item Buyback / Scrap**: Unwanted items can ONLY be sold/scrapped directly to the Slop Merchant for Slops.
    - **Spelunky RPG Retaliation Mechanic**: If a player attacks, damages, or slaps the Slop Merchant, he does *not* go on an endless party-wiping rampage. Instead, he shoulders an RPG rocket launcher, locks on with a red dashed laser sight and crosshair for a dramatic 1.8-second windup delay, and fires a single high-damage explosive rocket directly at the culprit! Features an AoE splash blast that can damage teammates caught nearby.
    - **Homing Slop Coins**: Defeated monsters drop Slop coins that initially scatter and can be picked up; if uncollected after 1 second, they automatically accelerate and fly directly towards the player who made the kill.
    - **Clean Uniform Trader UI**: Redesigned modal with equal-sized tab buttons, standardized action buttons, uniform card heights, and structured grids preventing elements from covering or overlapping each other.
    - *No throwables* (focused strictly on core gear, potions, and upgrades).
  - **Trade-Up Forge (3-for-1)**:
    - Must sacrifice **3 items of the exact same rarity** (e.g. 3 Rares).
    - Guarantees 1 random item of the **next higher rarity tier** (e.g. 1 random Epic).
  - **Spin-a-Wheel Gacha Altar**:
    - Bet 1 item + Slops fee → spins a dramatic fortune wheel.
    - **Strict Probabilities** (No pity system):
      - 💥 **Ancur / Shattered (50%)**: Item is completely destroyed into ash.
      - ⬆️ **Upgrade (45%)**: Item upgrades to the next rarity tier with boosted stats.
      - 🎰 **Jackpot (5%)**: Secret Anime Mythic / Legendary item drop!

- **Step 5.6: Random Grid Dungeon Map Generation with Guaranteed Rooms** `[COMPLETED ✅]`
  - Procedural grid layout (e.g., dynamic grid graph of rooms).
  - Layout shape and room placements are randomized each run.
  - Room contents are randomized: `battle`, `treasure`, `merchant`, or `boss`.
  - **Guarantee Rule**: Every floor is guaranteed to contain at least one of each room type:
    - At least 1 **Battle** room
    - At least 1 **Treasure** room
    - At least 1 **Merchant** room
    - At least 1 **Boss** room

- **Step 5.7: Lobby Dev Mode Cleanup (Dev Armory Chest)** `[UPCOMING]`
  - In **live mode**: Lobby spawns only with default starter gear (Rusty Sword / Leather Tunic).
  - Move all Batch 1/2 demo gear into a **Dev Armory Chest** prop in the lobby corner, only visible in dev/test mode.
  - Players must earn anime gear through dungeon loot progression and the Slop Merchant / Gacha.

---

### Phase 6: Anime Batch 3, Final Polish & Public Build `[PLANNED]`
- Complete Saitama set (*Serious Punch* manga cinematic).
- Anime Batch 3: Shinra (Fire Force), Rimuru (Tensura), Light (Death Note), Subaru/Rem (Re:Zero).
- Performance optimization and production release packaging.
- Victory / wipe run statistics screen with damage, revive, and floor depth stats.

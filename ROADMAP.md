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
│    ├── Step 3.5: Anime Batch 2 (AoT, Cyberpunk, OPM) [DONE ✅]             │
│    │     • Levi Ackerman — ODM Gear & Dual Snap Blades [DONE ✅]           │
│    │     • David Martinez — Sandevistan & Carnage Shotgun [DONE ✅]        │
│    │     • Saitama — Bald Hero Suit & Serious Punch [DONE ✅]              │
│    └── Step 3.6: Anime Batch 3 (Fire Force, Tensura, Death Note, Re:Zero) [UPCOMING]
│      ▼                                                                     │
│  Phase 4: Procedural Dungeon, Monster AI, 5 Themed Floors & Bosses [DONE ✅]│
│    ├── Step 4.1: Procedural Room Generation & Cardinal Doors [DONE ✅]     │
│    ├── Step 4.2: 4 Monster Archetypes (Swarmer/Ranged/Brute/Exploder) [DONE ✅]│
│    ├── Step 4.3: Floor 1 — JJK Detention Center (Finger Bearer) [DONE ✅]  │
│    ├── Step 4.4: Floor 2 — Cyberpunk Arasaka Sublevel (Adam Smasher) [DONE ✅] │
│    ├── Step 4.5: Floor 3 — AoT Wall Maria Crypts (Armored Titan) [DONE ✅] │
│    ├── Step 4.6: Floor 4 — Berserk Eclipse Ruins (Nosferatu Zodd) [DONE ✅]│
│    ├── Step 4.7: Floor 5 — OPM House of Evolution (Carnage Kabuto) [DONE ✅]│
│    ├── Step 4.8: Boss Multi-Phase Attacks & Phase 2 Enrage [DONE ✅]       │
│    └── Step 4.9: Floor Selector & Dev Test Hub [DONE ✅]                   │
│      ▼                                                                     │
│  Phase 5: Gameplay Refinement & Content Depth [ACTIVE ✅]                   │
│    ├── Step 5.1: Downed / Revive Co-op System [DONE ✅]                    │
│    ├── Step 5.2: Game Over / Party Wipe & Summary Screen [DONE ✅]         │
│    ├── Step 5.3: New Enemy Types (Kamikaze / Shaman Buffer) [DONE ✅]      │
│    ├── Step 5.4: Room Hazards & Traps (Spike / Flame Pillar) [UPCOMING]    │
│    ├── Step 5.5: Slop Merchant, Economy, In-World Wheel & Blackjack [DONE ✅]│
│    ├── Step 5.6: Random Grid Dungeon Map Generation with Guaranteed Rooms [DONE ✅] │
│    ├── Step 5.7: Lobby Dev Mode Cleanup (Dev Armory Chest) [DONE ✅]       │
│    └── Step 5.8: Procedural BGM Engine (Lobby/Dungeon/Boss Web Audio) [DONE ✅] │
│      ▼                                                                     │
│  Phase 6: Anime Batch 3, Polish & Public-Ready Build [PLANNED]             │
│      ▼                                                                     │
│  Phase 7: Multi-Discipline Engineering & Security Remediation [COMPLETED ✅]   │
│    ├── P0: Critical Security Hardening (XSS, CSP, WebRTC Sanity) [COMPLETED ✅]
│    ├── P1: Test Automation (Vitest, Playwright E2E) & Seeded PRNG [COMPLETED ✅]
│    ├── P1: UX Architecture (LIFO Modal Stack & Backdrop Dismiss) [COMPLETED ✅]
│    ├── P2: Visual Design System (4px Spacing Grid & WCAG AA Contrast) [COMPLETED ✅]
│    ├── P2: Frontend Modularization & Canvas Performance [COMPLETED ✅]     │
│    ├── P3: Backend & Networking Evolution (Host Migration & Schemas) [COMPLETED ✅]
│    └── P3: Architectural Evolution (DDD EventBus Decoupling) [COMPLETED ✅] │
│      ▼                                                                     │
│  Phase 8: Mobile Support & Touch HUD Overhaul [COMPLETED ✅]               │
│    ├── Step 8.1: Mobile Viewport, SafeArea & Fullscreen Controller [COMPLETED ✅]
│    ├── Step 8.2: Virtual Movement Joystick (Floating/Fixed, Analog Clamp) [COMPLETED ✅]
│    ├── Step 8.3: Ergonomic Action Cluster & Touch Aim Assist [COMPLETED ✅]│
│    ├── Step 8.4: Touch-Friendly Modals & Backdrop Dismiss [COMPLETED ✅]   │
│    └── Step 8.5: Contextual Controls Hint & Mobile Orientation Lock [COMPLETED ✅]
│      ▼                                                                     │
│  Phase 9: Boss Battle Cinematic Overhaul & Anime Animations [COMPLETED ✅]   │
│    ├── Step 9.1: Boss Phase 2 Anime Cut-In & Time Freeze (0.5s) [COMPLETED ✅] │
│    ├── Step 9.2: Ground Telegraph Danger Zones (Cone/Corridor/Nova) [COMPLETED ✅]
│    ├── Step 9.3: Boss Visual Evolutions & Anime Sprite Overhaul [COMPLETED ✅] │
│    └── Step 9.4: Boss Audio Stingers & Multiplayer Sync [COMPLETED ✅]         │
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

- **Step 3.5: Anime Batch 2 — AoT, Cyberpunk & OPM** `[COMPLETED ✅]`
  - **Levi Ackerman** `[DONE ✅]`: ODM Dual Grapple Cables (Fanny MLBB-style), 360° Blade Whirlwind.
  - **David Martinez** `[DONE ✅]`: Sandevistan Global Slow-Mo (10% speed for all, David full speed), Carnage Shotgun 6-pellet cone.
  - **Saitama (One Punch Man)** `[DONE ✅]`: Bald Hero Suit, Consecutive Normal Punches flurry, *Serious Punch* black-and-white monochrome manga cinematic (400 True Damage).

- **Step 3.6: Anime Batch 3** `[UPCOMING]`
  - Shinra & Arthur (Fire Force), Rimuru (Tensura), Light Yagami (Death Note), Subaru & Rem (Re:Zero).

---

### Phase 4: Procedural Dungeon, Monster AI & 5 Themed Floors `[COMPLETED ✅]`

- **Room Generation**: Isaac-style discrete room graph, door transitions with physics-correct portal spawning.
- **4 Monster Archetypes**: Swarmer (fast swarm AI), Ranged (kiting + projectiles), Brute (telegraphed AoE ground slam), Exploder (kamikaze suicide bombers).
- **Door Lockdown System**: Rooms lock when player enters; all enemies must die before doors reopen.
- **5 Themed Floors** with unique mob squads, music, palette, and boss encounters:
  - **Floor 1 — JJK Detention Center**: Fly Heads, Masked Ino, Cursed Brutes → **Finger Bearer Boss** (Cursed Claws, Divergent Beams, Cursed Maelstrom + Phase 2 Domain Awakening).
  - **Floor 2 — Cyberpunk Arasaka Sublevel**: Maelstrom Cyberpsychos, Tyger Claw Snipers, Arasaka Drones → **Adam Smasher Prototype** (Hydraulic Slam, Micro-Missile Salvo, Laser Sweep + Phase 2 Sandevistan Overclock).
  - **Floor 3 — AoT Wall Maria Crypts**: Crawler Titans, Marleyan Riflemen, Hardened Brutes → **Armored Titan** (Crystal Fist, Wall Maria Rush, Scalding Steam Vent + Phase 2 Armor Shed Blitz).
  - **Floor 4 — Berserk Eclipse Ruins**: Eclipse Heretics, Executioner Brutes, Possessed Souls → **Nosferatu Zodd (The Immortal Apostle)** (Scimitar Cleave, Flying Cleaver, 4-way Stomp + Phase 2 Winged Apostle Dive & Eclipse Nova).
  - **Floor 5 — OPM House of Evolution**: Black Sperm Cells, Rhino Wrestler (70% frontal deflection armor), Fuhrer Ugly → **Carnage Kabuto** (Beetle Dash, Air Cannon Sneeze, Seismic Horn Uppercut + Phase 2 Carnage Mode Rampage).
- **Multi-Phase Bosses**: Unique visuals, 3 distinct attack patterns per floor, Phase 2 enrage at 50% HP, unique death animations, Legendary loot explosion on kill.
- **Exit Portal with Countdown**: All players must stand in portal together; 3-second group countdown before descent.
- **Floor Selector (Dev Tool)**: `[F]` hotkey + HUD badge click + in-lobby Dimensional Gateway Altar for instant floor warping during development.

---

### Phase 5: Gameplay Refinement & Content Depth `[IN PROGRESS 🔧]`

> Core goal: Make the dungeon feel dangerous, tense, rewarding, and addictively replayable with maximum friend-group chaos.

- **Step 5.1: Downed / Revive Co-op System** `[COMPLETED ✅]`
  - **Fatal Damage Overhaul**: Eliminated 1 HP immortality cap; player enters *Downed* crawl state at 0 HP.
  - **Downed Crawl State**: 30-second bleed-out countdown, 35% crawl speed, blood pool, and actions locked (cannot roll, attack, or block).
  - **Bleed-Out Acceleration**: Taking damage while downed deducts 3.0s per hit. If timer reaches 0s, player transitions to `isDead = true`.
  - **Teammate Revive Channeling**: Living teammates within 75px can hold `[E]` for 2.5s to revive the downed player with 40% Max HP and 2.0s invulnerability i-frames.
  - **Multiplayer WebRTC Sync**: State (`isDowned`, `downedTimer`, `isDead`, `reviveProgress`) synced in real-time across peers with `REVIVE_PROGRESS` and `PLAYER_REVIVED` packets.
  - **Procedural Audio & Visual Cues**: Dramatic downed impact groan, looping revive energy pulse, triumphant arpeggio fanfare, overhead bleed-out gauge, green radial channel ring, and screen-space red vignette.
  - **Monster AI De-prioritization**: Monsters prioritize standing players over downed crawlers with +400 distance penalty, allowing teammates to mount a rescue.

- **Step 5.2: Game Over / Party Wipe & Summary Screen** `[COMPLETED ✅]`
  - Party Wipe triggers dramatic screen shake + blood-red vignette fade into **Wipe Screen**.
  - Stats: Total Kills, Damage Dealt, Floors Reached, Time Survived, and top MVP player.
  - Buttons: *Restart to Lobby* / *Try Again from Floor 1*.
  - Pure roguelike loop: Endless descent until total party wipe.

- **Step 5.3: New Enemy Types** `[COMPLETED ✅]`
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
    - Sells survival consumables (Health Flask +50 HP, Stamina Tonic) and tier-appropriate gear.
    - **Paid Shop Refresh**: Pay 25 Slops to reroll the merchant's wares on demand.
    - **Item Buyback / Scrap**: Unwanted items can ONLY be sold/scrapped directly to the Slop Merchant for Slops.
    - **Spelunky RPG Retaliation Mechanic**: If attacked or slapped, the merchant shoulders an RPG with a 1.8s lock-on laser windup and launches an explosive rocket at the culprit!
    - **Homing Slop Coins**: Defeated monsters drop Slop coins that scatter, then accelerate toward the killer after 1 second.
  - **Trade-Up Forge (3-for-1)**:
    - Sacrifice 3 items of the exact same rarity → guarantees 1 random item of the next higher tier.
  - **In-World Wheel of Slop Prop (Sequential Turns / Gantian)**:
    - Physical fortune wheel prop placed in the Merchant Room.
    - Full party can gather around and watch spins live in real-time on the dungeon floor with ticking SFX.
    - Sequential turn rule: Only 1 player can spin at a time while others watch; wheel locks with "In Use" status until the spin concludes.
    - Outcomes: 💥 **Shattered (50%)**, ⬆️ **Upgrade (45%)**, 🎰 **Jackpot (5%)**.
  - **In-World Blackjack Table (Bet Slops)**:
    - Semicircular green-felt casino blackjack table prop in the Merchant Room.
    - Interactive `[E] PLAY BLACKJACK` — players bet Slops against the Dealer (the Slop Merchant).
    - Features: Hit, Stand, Double Down, standard 52-card deck, Dealer stands on 17+, Blackjack pays 3:2.
    - Dealer quips overhead based on player wins and busts; party members can watch nearby!

- **Step 5.6: Random Grid Dungeon Map Generation with Guaranteed Rooms** `[COMPLETED ✅]`
  - Procedural grid layout (e.g., dynamic grid graph of rooms).
  - Layout shape and room placements are randomized each run.
  - Room contents are randomized: `battle`, `treasure`, `merchant`, or `boss`.
  - **Guarantee Rule**: Every floor is guaranteed to contain at least one of each room type:
    - At least 1 **Battle** room
    - At least 1 **Treasure** room
    - At least 1 **Merchant** room
    - At least 1 **Boss** room

- **Step 5.7: Lobby Dev Mode Cleanup (Dev Armory Chest)** `[COMPLETED ✅]`
  - In **live mode**: Lobby spawns with clean starter gear (Rusty Sword / Leather Tunic / Cloth Pants / Travel Boots / Wooden Buckler).
  - Demo gear organized into an in-world golden **Dev Armory Chest** prop in the lobby corner, with `[G]` hotkey, HUD button, and quick set selectors.
  - Players earn anime gear naturally through dungeon loot progression and the Slop Merchant / Gacha.

---

### Phase 6: Anime Batch 3, Final Polish & Public Build `[PLANNED]`
- Complete Saitama set (*Serious Punch* manga cinematic).
- Anime Batch 3: Shinra (Fire Force), Rimuru (Tensura), Light (Death Note), Subaru/Rem (Re:Zero).
- Performance optimization and production release packaging.
- Victory / wipe run statistics screen with damage, revive, and floor depth stats.

---

### Phase 7: Multi-Discipline Engineering & Security Remediation `[COMPLETED ✅]`
*Synthesized from the comprehensive 7-agent engineering audit (`/agency-ui-designer`, `/agency-ux-architect`, `/agency-backend-architect`, `/agency-frontend-developer`, `/agency-application-security-engineer`, `/agency-software-architect`, `/agency-test-automation-engineer`).*

- **P0: Critical Security Hardening** `[COMPLETED ✅]`:
  - Remediate Stored DOM XSS in Lobby player list (`remote.name` innerHTML injection in `src/main.js`).
  - Add strict Content Security Policy (`CSP`) `<meta>` tag in `index.html`.
  - Implement host-side sanity validation for WebRTC damage, speedhack movement, and item drop packets.
- **P1: Testing & Determinism** `[COMPLETED ✅]`:
  - Install `vitest` for domain/combat math unit tests and `@playwright/test` for critical E2E browser flows.
  - Implement seeded PRNG (`seedrandom` / `RandomProvider`) to enable deterministic, replayable dungeon generation and testing.
  - Add `data-testid` attributes across all interactive HUD, inventory, and modal elements.
  - Suite with 38 unit tests covering PRNG determinism, item catalog, trade-up, gacha odds, combat mitigation, and security sanitization.
- **P1: UX & Modal Management** `[COMPLETED ✅]`:
  - Implement unified LIFO `ModalManager` with universal backdrop dismiss across all 10 modal surfaces.
  - Eliminate modal layering bugs, hotkey collisions, and trapped pointer events with ESC key handling.
  - Implement mobile & tablet touch strategy with virtual movement joystick and action buttons cluster.
- **P2: Visual Design System & Tokens** `[COMPLETED ✅]`:
  - Complete CSS design tokens in `style.css` (4px spatial scale `--space-0-5` to `--space-16`, typography scale `--text-2xs` to `--text-3xl`, standardized border-radius tokens `--radius-xs` to `--radius-full`, and elevation shadows).
  - WCAG 2.1 AA compliant color contrast: upgraded `--text-dim` from `#8b949e` (3.8:1) to `#94a3b8` (5.4:1), added `--text-muted: #cbd5e1;` (8.6:1), and eliminated all low-contrast `#64748b` text across CSS and DOM templates.
  - Interactive states: universal `:focus-visible` styling (`outline: var(--focus-ring); outline-offset: var(--focus-ring-offset);`), 44×44px minimum tap targets, and smooth hover/active micro-interaction transforms.
- **P2: Frontend Modularization & Canvas Performance** `[COMPLETED ✅]`:
  - Modularized controller architecture with `src/controllers/modalController.js` and `src/controllers/stationController.js`.
  - Implemented dynamic code-splitting via `import('./blackjack.js')`, offloading non-critical casino logic into an asynchronous chunk and reducing initial bundle size.
  - Implemented OffscreenCanvas floor & wall caching in `src/renderer.js` (`getOrCreateRoomStaticCanvas` and lobby floor caching), cutting thousands of redundant draw calls per frame for butter-smooth 60+ FPS on all devices.
  - Test suite expanded to 51 passing unit tests across 7 test files.
- **P3: Backend & Networking Evolution** `[COMPLETED ✅]`:
  - Implemented deterministic WebRTC Host Migration protocol in `src/network.js`: automatically elects the surviving peer with the lowest PeerID, promotes authority, and transfers monster simulation smoothly.
  - Expanded room code entropy from 4 to 6 characters (`SLOP-XXXXXX`), reducing collision probability by 1,024× across >1 Billion combinations.
  - Standardized packet validation & schemas in `src/packetSchemas.js` (validating positions, clamped combat damage, and game synchronization).
  - Total test coverage expanded to 60 passing unit tests across 8 test files.
- **P3: Architectural Evolution (DDD EventBus Decoupling)** `[COMPLETED ✅]`:
  - Implemented decoupled in-memory `EventBus` (`src/eventBus.js`) providing resilient pub/sub mechanics (`on`, `off`, `once`, `emit`, `clear`, error boundary isolation).
  - Adopted ADR-001: Decoupled core domain entities (`Player`, `CombatSystem`, `Monster`) from direct browser Presentation/Infrastructure APIs (DOM and Web Audio).
  - Entities emit domain events (`player:hudSync`, `player:healthChanged`, `player:staminaChanged`, `player:itemEquipped`, `player:itemUnequipped`, `player:downed`, `player:revived`, `player:died`, `combat:attackLanded`, `combat:abilityUsed`, `monster:hit`, `monster:died`, `monster:phase2`).
  - Implemented `src/presenters/hudPresenter.js` adapter subscribing to `player:hudSync` to update browser HUD bars and badges with zero domain coupling.
  - Enabled 100% headless automated testing of domain entities in pure Node.js environments.
  - Comprehensive unit test suites expanded to **203 passing tests across 25 test files** in Vitest.

---

### Phase 8: Mobile Support & Touch HUD Overhaul `[COMPLETED ✅]`

- **Step 8.1: Viewport & Layout Adaptation** `[COMPLETED ✅]`:
  - Added CSS environment variables (`env(safe-area-inset-*)`) and viewport-fit=cover meta tag for notch and home-indicator protection.
  - Added PWA mobile web app capable meta tags for fullscreen web app execution.
  - Implemented universal fullscreen controller (`toggleFullscreen`) supporting cross-browser prefixes (`webkitRequestFullscreen`, `mozRequestFullScreen`, `msRequestFullscreen`).
  - Added automatic landscape orientation lock via `screen.orientation.lock('landscape')` with fallback toast instructions.
- **Step 8.2: Virtual Movement Joystick** `[COMPLETED ✅]`:
  - Implemented dual-ring analog touch joystick in `src/mobileHUD.js` (`#mobile-joystick-container`).
  - Supports both dynamic floating (spawns under left-thumb touch) and fixed modes.
  - 10% deadzone filtering and 360° circular vector clamping (`Math.hypot`, `Math.atan2`).
- **Step 8.3: Ergonomic Action Cluster** `[COMPLETED ✅]`:
  - Built radial action buttons cluster in lower right viewport (`#mobile-actions-container`).
  - Big Primary Attack button (`#btn-mobile-attack`) with satellite clusters: Slap, Block, Roll, Interact, Ultimate [Q], Dev Armory [G], and Backpack.
  - Implemented proximity auto-aim target lock against monsters, allowing seamless mobile combat navigation.
- **Step 8.4: Touch-Friendly Modals & Backdrop Dismiss** `[COMPLETED ✅]`:
  - Optimized all 10 modal interfaces with minimum 44×44px tap targets (`--min-tap-target`).
  - Added explicit close buttons (`#btn-inventory-close`, etc.) and backdrop touch dismissals.
  - Orientation warning prompt (`#mobile-orientation-modal`) guiding players to hold their device in landscape orientation.
- **Step 8.5: Contextual Controls Hint** `[COMPLETED ✅]`:
  - Controls keyboard guide (`#hud-controls-hint`) only shows on desktop/laptop in the Base Camp lobby (`currentFloor === 0`).
  - Automatically hidden during dungeon floor descent (`currentFloor >= 1`) and completely hidden on all touch/mobile viewports.
  - Covered by 5 dedicated mobile unit test suites (`mobile-responsive.test.js`, `mobile-touch.test.js`, `mobile-action-cluster.test.js`, `mobile-phase4.test.js`, `mobile-e2e-integration.test.js`).

---

### Phase 9: Boss Battle Cinematic Overhaul & Anime Animations `[COMPLETED ✅]`

> Core Goal: Elevate all 5 Floor Guardian Boss battles into dramatic, anime-accurate cinematic encounters with manga cut-ins, time freezes, telegraph hazard zones, and dedicated animations.

- **Step 9.1: Boss Phase 2 Anime Cut-In & Time Freeze (0.5s)** `[COMPLETED ✅]`:
  - Trigger time freeze and screen shake when any boss drops to $\le 50\%$ HP (`cinematics.triggerBossPhase2(boss)`).
  - Full-screen high-contrast screentone overlay, diagonal speed lines, kanji boss title banner, and iconic anime dialogue quotes.
  - Boss audio stingers, roars, and shockwave bursts.
- **Step 9.2: Dynamic Ground Telegraph Hazard Zones** `[COMPLETED ✅]`:
  - Visual floor indicators during `windupTimer` before attacks fire:
    - *Corridor Rush*: Dashed warning lines projecting dash path, animated chevron arrows (`>>>`), and leading wavefront bar.
    - *Danger Cone*: Arced conical sector displaying projectile scatter with trajectory guide rays.
    - *Radial Nova*: Pulsing circular hazard zone with 8 cardinal/diagonal tick marks and countdown progress ring.
- **Step 9.3: Boss Visual Evolutions & Enhanced Animations** `[COMPLETED ✅]`:
  - *Adam Smasher*: Sandevistan green trailing after-images, targeting optical red laser with holographic HUD reticle `[ + ] TARGET LOCKED`, open shoulder missile pods with exhaust venting smoke puffs.
  - *Armored Titan*: Boiling steam cloud reactor aura, cracked gold armor fissures with molten magma veins, crystal fist diamond hardening glow.
  - *Nosferatu Zodd*: Articulated bat wings unfolding and flapping with skeletal phalanges, serrated horns with smoldering embers, blood smoke eye trails, blood-soaked scimitar with dripping gore drops.
  - *Finger Bearer*: Swirling cursed swamp domain pool on the floor, Black Flash red-black lightning sparks, needle teeth jagged grin, cursed singularity core.
  - *Carnage Kabuto*: Shell color shift to iridescent red & radioactive green stripes (Carnage Mode), hypersonic motion jitter, air pressure cyclone shockwave rings around trident horn.
- **Step 9.4: Unit Tests & WebRTC State Sync** `[COMPLETED ✅]`:
  - Full Vitest suite for boss phase triggers, telegraph data structures, network batch synchronization, and cinematic overlays (17 tests in `tests/unit/boss-cinematics.test.js`, 220 tests total).
  - Double redundancy WebRTC synchronization (`BOSS_PHASE2_TRIGGER` packet broadcast & `applyNetworkState` snapshot restoration).

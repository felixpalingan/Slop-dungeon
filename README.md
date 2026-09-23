# Dungeon Slop 🗡️🎲

A **1–6 player cooperative top-down dungeon crawler** designed for chaotic friend-group fun. Delve into randomised, procedural dungeon floors, gear up with iconic anime-themed equipment, trigger flashy full-screen cinematic ultimates, gamble your loot at the Cursed Merchant, and survive boss fights with unique multi-phase attack patterns — all directly in the browser, no install required.

---

## 🎮 Core Features

| Feature | Status |
|---|---|
| Serverless WebRTC P2P multiplayer (PeerJS room codes) | ✅ Live |
| Procedural 2D characters — zero sprite art | ✅ Live |
| WASD movement + Dodge Roll + stamina gauge | ✅ Live |
| 6-slot gear system (Helmet / Chest / Pants / Boots / Weapon / Off-hand) | ✅ Live |
| Ground loot entities, rarity glow beams, proximity `[E]` pickup | ✅ Live |
| Real-time weapon arc combat, shield blocking, critical hits | ✅ Live |
| Anime ultimate cinematics (full-screen takeover, screen shake) | ✅ Live |
| Comic slap physics (`BONK!`) on Right-Click | ✅ Live |
| In-world wardrobe mirror — name + hex colour dye | ✅ Live |
| Procedural themed dungeon floors (3 complete) | ✅ Live |
| Multi-phase bosses with 3 distinct attack patterns each | ✅ Live |
| Floor exit portals — group countdown descent | ✅ Live |
| Floor Selector dev tool (`[F]` + HUD badge) | ✅ Live |
| **Downed / Revive co-op system** | 🔧 Upcoming |
| **Game Over & Victory Summary Screen** | 🔧 Upcoming |
| **Kamikaze Exploder & Shaman Buffer enemies** | 🔧 Upcoming |
| **Room Hazards & Traps (spikes / flame pillars)** | 🔧 Upcoming |
| **Merchant Room + Gacha Gambling Altar** | 🔧 Upcoming |
| **Roguelike procedural layout restore** | 🔧 Upcoming |

---

## 🗡️ Anime Equipment Roster

Equipment comes in sets tied to anime characters. Each set provides a **weapon**, **off-hand**, and 1–2 **armour pieces**, plus a signature visual style and a full-screen **ultimate cinematic**.

### Batch 1 — Jujutsu Kaisen & Berserk `[COMPLETE ✅]`
| Character | Signature Ultimate |
|---|---|
| **Gojo Satoru** (JJK) | *Hollow Purple* — void sphere obliterates all in a line |
| **Sukuna** (JJK) | *World Cutting Slash* — cross-shaped cleave that severs space |
| **Toji Fushiguro** (JJK) | *Chain Rampage* — chained spear sweeps the full arena |
| **Guts** (Berserk) | *Berserker Rage* — 5s invulnerability + lifesteal rampage |

### Batch 2 — Attack on Titan & Cyberpunk `[PARTIALLY COMPLETE]`
| Character | Signature Ultimate | Status |
|---|---|---|
| **Levi Ackerman** (AoT) | *360° Blade Whirlwind* — ODM grapple cables + dual blade sweep | ✅ |
| **David Martinez** (Cyberpunk 2077) | *Sandevistan Overclock* — global 10% speed, David full-speed | ✅ |
| **Saitama** (One Punch Man) | *Serious Punch* — monochrome manga-panel cinematic | 🔧 Upcoming |

### Batch 3 — Fire Force, Tensura, Death Note, Re:Zero `[PLANNED]`
| Character | Signature Ultimate |
|---|---|
| **Shinra Kusakabe** (Fire Force) | *Rapid Fire Ignition Kicks* — sonic flight kick combo |
| **Rimuru Tempest** (Tensura) | *Predator Absorption* — swallows all enemies into a black sphere |
| **Light Yagami** (Death Note) | *Judgment Notebook* — cursed names delete HP over time |
| **Subaru + Rem** (Re:Zero) | *Return by Death Echo* — revival cinematic buffs the party |

---

## 🏚️ Dungeon Floors

### Floor 1 — JJK Detention Center
- **Theme**: Crumbling cursed school halls, dark blue palette.
- **Enemies**: Fly Head Swarmers, Masked Ino Rangers, Cursed Brutes.
- **Boss**: **The Finger Bearer** — Phase 1: Shockwave Stomp / Claw Swipe / Cursed Leaping Slam. Phase 2 (50% HP): Cursed Arm Detonate + enraged speed.

### Floor 2 — Cyberpunk Arasaka Sublevel
- **Theme**: Neon-lit server vaults, electric blue & orange.
- **Enemies**: Maelstrom Cyberpsychos, Tyger Claw Snipers, Arasaka Combat Drones.
- **Boss**: **Adam Smasher Prototype** — Phase 1: Hydraulic Pile Driver / Missile Salvo / Laser Sweep. Phase 2: Sandevistan Overclock (rapid combo blitz).

### Floor 3 — AoT Wall Maria Crypts
- **Theme**: Ancient moss stone, dim torch light.
- **Enemies**: Crawler Titans, Marleyan Riflemen, Hardened Crystal Brutes.
- **Boss**: **The Armored Titan** — Phase 1: Crystal Fist / Armored Bull Rush / Steam Vent Nova. Phase 2: Crystal Shatter debris scatter + steam geyser pillars.

---

## 🎲 Planned Systems (Phase 5)

### Downed & Revive
- HP = 0 → **Downed crawl state** (30 second bleed-out timer, no attacks).
- Teammates hold `[E]` for 2.5 seconds to revive.
- Solo → Ghost Spectator. Full Party Wipe → **Game Over**.

### Room Hazards & Traps
- **Spike Trap** — floor tiles that surge upward; can be used offensively by luring enemies.
- **Cursed Flame Pillar** — rotating AoE jets in arena center forcing positional play.

### Merchant Room + Gacha Gambling Altar
- Mid-floor optional branch room reachable through the roguelike dungeon graph.
- **Trade-Up Forge (3-for-1)**: Sacrifice 3 same-rarity items → 1 next-tier item.
- **Cursed Dice (Gacha)**: Sacrifice 1 item → spin the roulette (15% Legendary / 50% Upgrade / 35% Shatter).

### New Enemy Types
- **Kamikaze Exploder** — sprints at players, flashes red, detonates with AoE warning circle.
- **Shaman Buffer** — kites away, projects shield aura or HP regen onto nearby allies; must be prioritised.

---

## 🌐 Tech Stack

| Layer | Technology |
|---|---|
| **Rendering** | HTML5 Canvas API (100% procedural shapes) |
| **Networking** | WebRTC via PeerJS (serverless P2P) |
| **Audio** | Web Audio API (procedural SFX synthesis) |
| **Build** | Vite |
| **Language** | JavaScript (ES Modules) |

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Share a `SLOP-XXXX` room code with friends to play co-op!

---

## 📋 Detailed Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full phased development plan with implementation details.

---

## 🎨 Anime Equipment Catalog

See [ANIME_EQUIPMENT.md](./ANIME_EQUIPMENT.md) for the full roster of planned anime-themed gear sets with stats, abilities, and cinematic ultimate descriptions.

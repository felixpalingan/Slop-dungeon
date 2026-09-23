# 🗡️ Slop Dungeon — Complete Item & Equipment Encyclopedia

Dokumen ini memuat **daftar lengkap seluruh item, senjata, armor, consumable, serta set bonus anime** yang ada di dalam game **Slop Dungeon**.

Setiap item memiliki stats unik, rendering grafis 2D prosedural, audio sound effect khusus, dan nilai jual (*sell price*) ke **Slop Merchant**.

---

## 📑 Daftar Isi
1. [Sistem Rarity & Nilai Jual Slops](#-sistem-rarity--nilai-jual-slops)
2. [Tabel Ringkasan Seluruh Item (Master List)](#-tabel-ringkasan-seluruh-item-master-list)
3. [Daftar Lengkap Anime Equipment Sets (Batch 1 & 2)](#-daftar-lengkap-anime-equipment-sets-batch-1--2)
   - [Gojo Satoru — The Honored One (JJK)](#1-gojo-satoru--the-honored-one-jujutsu-kaisen)
   - [Ryomen Sukuna — King of Curses (JJK)](#2-ryomen-sukuna--king-of-curses-jujutsu-kaisen)
   - [Toji Fushiguro — Sorcerer Killer (JJK)](#3-toji-fushiguro--sorcerer-killer-jujutsu-kaisen)
   - [Guts — The Black Swordsman (Berserk)](#4-guts--the-black-swordsman-berserk)
   - [Levi Ackerman — Humanity's Strongest (AoT)](#5-levi-ackerman--humanitys-strongest-soldier-attack-on-titan)
   - [David Martinez — Night City Legend (Cyberpunk)](#6-david-martinez--night-city-legend-cyberpunk-edgerunners)
4. [Daftar Lengkap Baseline / Dungeon Fantasy Gear](#-daftar-lengkap-baseline--dungeon-fantasy-gear)
   - [Senjata (Weapons)](#senjata-weapons)
   - [Tangan Kiri / Perisai (Off-Hand)](#tangan-kiri--perisai-off-hand)
   - [Pelindung Kepala (Helmets)](#pelindung-kepala-helmets)
   - [Zirah Dada (Chests)](#zirah-dada-chests)
   - [Celana / Pelindung Kaki (Pants)](#celana--pelindung-kaki-pants)
   - [Sepatu Bot (Boots)](#sepatu-bot-boots)
5. [Consumables & Supplies](#-consumables--supplies)
6. [Mekanik Ekonomi, Trade-Up Forge & Gacha Wheel](#-mekanik-ekonomi-trade-up-forge--gacha-wheel)
7. [Rencana Set Anime Mendatang (Batch 3 - Phase 6)](#-rencana-set-anime-mendatang-batch-3---phase-6)

---

## 💎 Sistem Rarity & Nilai Jual Slops

Setiap item dikategorikan ke dalam 5 tingkatan kelangkaan (*rarity*). Nilai jual ke Slop Merchant (*Item Scrap Value*) dihitung otomatis berdasarkan tingkatan ini:

| Rarity | Warna UI | Border Hex | Harga Jual (*Scrap Value*) | Drop Pool & Tingkat Kekuatan |
| :--- | :--- | :--- | :--- | :--- |
| **COMMON** | `#94a3b8` (Abu-abu Slate) | `#475569` | **5 Slops** 🪙 | Perlengkapan dasar / starter dungeon |
| **RARE** | `#38bdf8` (Biru Muda Langit) | `#0284c7` | **15 Slops** 🪙 | Mid-tier gear dengan stats khusus |
| **EPIC** | `#c084fc` (Ungu Mistik) | `#9333ea` | **35 Slops** 🪙 | High-tier dungeon gear & Toji set pieces |
| **LEGENDARY** | `#fbbf24` (Emas Amber) | `#d97706` | **75 Slops** 🪙 | Bagian armor bawah anime sets & high weapon |
| **MYTHIC** | `#ff2a5f` (Merah Cerah / Neon) | `#e11d48` | **150 Slops** 🪙 | Senjata pusaka anime, jubah ikonik & jackpot |

---

## 📊 Tabel Ringkasan Seluruh Item (Master List)

Berikut tabel ringkasan 54 item yang terdaftar secara aktif di dalam kode game (`ITEM_CATALOG`):

| No | Item ID | Nama Item | Slot | Hands | Rarity | Set Anime | Stat Utama / Efek Khusus | Harga Jual |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: |
| 1 | `gojo_blindfold` | Blindfold of the Six Eyes | Helmet | 1H | MYTHIC | Gojo | HP +35, Armor +6, CDR -20% | 150 🪙 |
| 2 | `gojo_tunic` | High-Collar Jujutsu Tunic | Chest | 1H | MYTHIC | Gojo | HP +55, Armor +15, Base Q: Limitless Barrier | 150 🪙 |
| 3 | `gojo_slacks` | Sorcerer Black Slacks | Pants | 1H | LEGENDARY | Gojo | HP +25, Armor +8, Move Speed +22 | 75 🪙 |
| 4 | `gojo_loafers` | Polished Black Loafers | Boots | 1H | LEGENDARY | Gojo | Move Speed +30, Dash Stamina -12 | 75 🪙 |
| 5 | `lapse_blue` | Cursed Technique: Lapse Blue | Weapon | 1H | MYTHIC | Gojo | Dmg 42, Spd 1.15, Gravity Suction Pulses | 150 🪙 |
| 6 | `reversal_red` | Cursed Technique: Reversal Red | Off-Hand | 1H | MYTHIC | Gojo | Dmg Buff +18, Armor +10, Repulsion Blast | 150 🪙 |
| 7 | `sukuna_crown` | Crown of the Disgraced One | Helmet | 1H | MYTHIC | Sukuna | HP +30, Crit Chance +25%, 4 Red Eyes | 150 🪙 |
| 8 | `sukuna_robe` | Robe of Malevolence | Chest | 1H | MYTHIC | Sukuna | HP +50, Armor +18, Base Q: Dismantle | 150 🪙 |
| 9 | `sukuna_hakama` | Baggy Hakama Trousers | Pants | 1H | LEGENDARY | Sukuna | HP +30, Armor +12, Stamina Regen +10 | 75 🪙 |
| 10 | `sukuna_zori` | Cursed Straw Zori | Boots | 1H | LEGENDARY | Sukuna | Move Speed +28 | 75 🪙 |
| 11 | `sukuna_kamutoke` | Kamutoke Vajra Dagger | Weapon | 1H | MYTHIC | Sukuna | Dmg 48, Spd 1.35, Arcing Lightning Sparks | 150 🪙 |
| 12 | `sukuna_cleaver` | Malevolent Cleaver | Weapon | **2H** | MYTHIC | Sukuna | Dmg 88, Spd 0.85, Reach 82, Cleave Arc | 150 🪙 |
| 13 | `sukuna_hiten` | Hiten Cursed Spear | Off-Hand | 1H | MYTHIC | Sukuna | Armor +12, Dmg Buff +15, Flame Thrust | 150 🪙 |
| 14 | `sukuna_finger` | Sukuna's Sealed Finger | Off-Hand | 1H | MYTHIC | Sukuna | Max HP +50, Dmg Buff +35, Armor +18 | 150 🪙 |
| 15 | `toji_worm` | Coiled Inventory Curse | Helmet | 1H | EPIC | Toji | HP +20, Armor +8 | 35 🪙 |
| 16 | `toji_shirt` | Compression Combat Shirt | Chest | 1H | EPIC | Toji | HP +45, Armor +14, Base Q: Spartan Kick | 35 🪙 |
| 17 | `toji_pants` | Baggy Gi Training Pants | Pants | 1H | EPIC | Toji | HP +25, Armor +10, Stamina Regen +12 | 35 🪙 |
| 18 | `toji_slippers` | Heavenly Restriction Slippers | Boots | 1H | EPIC | Toji | Sprint Speed +35, Silent Steps | 35 🪙 |
| 19 | `inverted_spear_chain` | Inverted Spear & 1000-Mile Chain | Weapon | **2H** | MYTHIC | Toji | Dmg 75, Spd 0.95, Shield Nullifier, 360° Spin | 150 🪙 |
| 20 | `guts_beast_helm` | Berserker Beast Helm | Helmet | 1H | MYTHIC | Guts | HP +40, Armor +16, Crit Chance +18% | 150 🪙 |
| 21 | `guts_berserker_plate`| Berserker Armor Plate | Chest | 1H | MYTHIC | Guts | HP +85, Armor +28, Base Q: Cannon Arm | 150 🪙 |
| 22 | `guts_greaves` | Black Iron Greaves | Pants | 1H | LEGENDARY | Guts | HP +35, Armor +18, Knockback Resistance | 75 🪙 |
| 23 | `guts_sollerets` | Heavy War Sollerets | Boots | 1H | LEGENDARY | Guts | Move Speed +15, Armor +12, Trap Immunity | 75 🪙 |
| 24 | `dragon_slayer` | Dragon Slayer | Weapon | **2H** | MYTHIC | Guts | Dmg 105, Spd 0.65, Reach 92, Heavy Cleave | 150 🪙 |
| 25 | `scout_hood` | Survey Corps Hooded Cloak | Helmet | 1H | MYTHIC | Levi | HP +30, Armor +8, Speed +16, CDR -15% | 150 🪙 |
| 26 | `odm_harness` | 3D Maneuver Gear & Gas Tanks | Chest | 1H | MYTHIC | Levi | HP +55, Armor +14, Stamina +15, Base Q: Gas | 150 🪙 |
| 27 | `scout_trousers` | Scout Cavalry Trousers | Pants | 1H | LEGENDARY | Levi | HP +25, Armor +10, Speed +18, Roll Cost -25%| 75 🪙 |
| 28 | `scout_boots` | Scout Knee-High Riding Boots | Boots | 1H | LEGENDARY | Levi | Move Speed +32, Armor +8 | 75 🪙 |
| 29 | `dual_snap_blades` | Dual Ultrahard Steel Snap Blades| Weapon | **2H** | MYTHIC | Levi | Dmg 48, Spd 1.25, Dual Slices, Crit +25% | 150 🪙 |
| 30 | `david_kiroshi` | Kiroshi Optics Mk. 4 | Helmet | 1H | MYTHIC | David | HP +30, Crit Chance +25%, Lock-on HUD | 150 🪙 |
| 31 | `david_jacket` | Gloria's High-Vis EMT Jacket | Chest | 1H | MYTHIC | David | HP +45, Armor +14, Base Q: Overcharge | 150 🪙 |
| 32 | `david_pants` | Streetkid Cargo Pants | Pants | 1H | LEGENDARY | David | HP +20, Armor +8, Speed +20, Stamina +15 | 75 🪙 |
| 33 | `david_sneakers` | Chrome Cyber-Sneakers | Boots | 1H | LEGENDARY | David | Speed +28, Dash Cost -12% | 75 🪙 |
| 34 | `david_shotgun` | Carnage Shotgun | Weapon | 1H | MYTHIC | David | Dmg 14x6 (84 dmg), Spd 0.45, 4 Shells Pump | 150 🪙 |
| 35 | `david_gorilla_arms` | Gorilla Arms Cyberware | Off-Hand | 1H | MYTHIC | David | Dmg Buff +20, Punch Dmg 50, Armor Pen 35% | 150 🪙 |
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
| 53 | `health_flask` | Health Flask | Consumable| — | COMMON | — | Memulihkan +50 HP secara instan | 25 Slops (Beli) |
| 54 | `stamina_tonic` | Stamina Tonic | Consumable| — | RARE | — | Stamina instan penuh + 8s Unlimited Stamina | 20 Slops (Beli) |

---

## 🥋 Daftar Lengkap Anime Equipment Sets (Batch 1 & 2)

### 1. Gojo Satoru — *The Honored One* (Jujutsu Kaisen)
> *"Throughout Heaven and Earth, I alone am the honored one."*

* **Tema Visual**: Seragam gelap berkerah tinggi khas SMA Jujutsu, visor penutup mata hitam dengan kilau cyan bercahaya, dan dua bola energi melayang (Biru & Merah).
* **Komponen Set (6 Bagian)**:
  1. **Helmet**: `Blindfold of the Six Eyes` (`gojo_blindfold`, Mythic) — HP +35, Armor +6, CDR -20%. Visor cyan bercahaya di kepala karakter.
  2. **Chest**: `High-Collar Jujutsu Tunic` (`gojo_tunic`, Mythic) — HP +55, Armor +15.
     - *Base Q*: **Limitless Barrier (無下限呪術)** — Menciptakan lingkaran distorsi spasial biru selama 3.5s yang memperlambat musuh di sekitar dan menangkis tembakan proyektil.
  3. **Pants**: `Sorcerer Black Slacks` (`gojo_slacks`, Legendary) — HP +25, Armor +8, Kecepatan Gerak +22.
  4. **Boots**: `Polished Black Loafers` (`gojo_loafers`, Legendary) — Kecepatan Gerak +30, Biaya Stamina Dash Roll -12.
  5. **Weapon (1H)**: `Cursed Technique: Lapse Blue` (`lapse_blue`, Mythic) — Bola pusaran azure melayang. Serangan Left-Click (42 Dmg) menarik musuh ke pusat pusaran (*gravitational pull*).
  6. **Off-Hand**: `Cursed Technique: Reversal Red` (`reversal_red`, Mythic) — Bola crimson energi positif. Serangan Right-Click memicu ledakan tolak balik berkekuatan tinggi (+18 Dmg Buff, +10 Armor).
* 🔮 **FULL SET BONUS — Hollow Purple (虚式「茈」)**:
  - Menggantikan tombol `Q` dengan jurus pamungkas **Hollow Purple**!
  - **Efek Sinematik Layar Penuh**:
    - Layar meredup dengan pusaran vignette ungu gelap.
    - Menembakkan bola singularitas ungu raksasa selebar 160px yang melaju searah kursor, melibas segala musuh dengan **320 True Damage** dan screen shake dahsyat.
    - Audio: Resonansi sub-bass yang bergemuruh disusul dentuman frekuensi harmonik tinggi.

---

### 2. Ryomen Sukuna — *King of Curses* (Jujutsu Kaisen)
> *"Know your place, fool."*

* **Tema Visual**: Kimono putih bertato kutukan hitam, 4 mata merah menyala di dahi, serta pilihan senjata petir atau golok algojo raksasa.
* **Komponen Set (5 Bagian Diperlukan + Opsi Senjata)**:
  1. **Helmet**: `Crown of the Disgraced One` (`sukuna_crown`, Mythic) — HP +30, Critical Strike Chance +25%. Memunculkan 4 mata merah menyala di dahi.
  2. **Chest**: `Robe of Malevolence` (`sukuna_robe`, Mythic) — HP +50, Armor +18.
     - *Base Q*: **Dismantle (解)** — Menembakkan 3 tebasan angin kutukan tajam berbentuk kipas (masing-masing 75 Dmg).
  3. **Pants**: `Baggy Hakama Trousers` (`sukuna_hakama`, Legendary) — HP +30, Armor +12, Regenerasi Stamina +10/s.
  4. **Boots**: `Cursed Straw Zori` (`sukuna_zori`, Legendary) — Kecepatan Gerak +28.
  5. **Pilihan Senjata (Salah Satu Diperlukan)**:
     - `Kamutoke Vajra Dagger` (`sukuna_kamutoke`, 1H, Mythic) — Dmg 48, Kecepatan 1.35. Menusuk secepat kilat dengan percikan listrik emas-merah yang merambat ke musuh di dekatnya.
     - `Malevolent Cleaver` (`sukuna_cleaver`, **2H**, Mythic) — Dmg 88, Kecepatan 0.85, Reach 82. Golok algojo dua tangan raksasa dengan tebasan sabit darah dan pola silang `X`.
  6. **Off-Hand Opsional**:
     - `Hiten Cursed Spear` (`sukuna_hiten`, Mythic) — Tombak trisula api kutukan. Right-Click meluncurkan tusukan bara api (+15 Dmg Buff, +12 Armor).
     - `Sukuna's Sealed Finger` (`sukuna_finger`, Mythic) — Jari mumi bertalisman terkutuk yang sangat langka. Meningkatkan Max HP +50, Damage Buff +35, dan Armor +18!
* 💀 **FULL SET BONUS — World Cutting Slash (世界を断つ斬撃)**:
  - Menggantikan tombol `Q` dengan **World Cutting Slash**!
  - **Efek Sinematik Layar Penuh**:
    - Waktu dan warna layar membeku menjadi monokrom abu-abu selama 0.35 detik.
    - Garis sayatan merah-hitam membelah **seluruh bentang layar**, membuat kedua belahan kanvas bergeser secara visual.
    - Menghasilkan **350 True Damage** secara instan kepada seluruh musuh yang terlalui garis potong.
    - Audio: Denting patahan dimensional yang memecah keheningan.

---

### 3. Toji Fushiguro — *Sorcerer Killer* (Jujutsu Kaisen)
> *"Zero cursed energy. Pure physical perfection."*

* **Tema Visual**: Baju kompresi hitam ketat, kutukan ulat inventaris melingkar di leher dan pundak, mengayunkan rantai besi seribu mil.
* **Komponen Set (5 Bagian)**:
  1. **Helmet**: `Coiled Inventory Curse` (`toji_worm`, Epic) — HP +20, Armor +8. Ulat kutukan melilit bahu karakter.
  2. **Chest**: `Compression Combat Shirt` (`toji_shirt`, Epic) — HP +45, Armor +14.
     - *Base Q*: **Spartan Kick** — Tendangan lurus bertenaga tinggi yang menerjang maju dan melempar musuh ke belakang dengan knockback ekstrem.
  3. **Pants**: `Baggy Gi Training Pants` (`toji_pants`, Epic) — HP +25, Armor +10, Regenerasi Stamina +12/s.
  4. **Boots**: `Heavenly Restriction Slippers` (`toji_slippers`, Epic) — Kecepatan Lari +35, langkah kaki tanpa suara.
  5. **Weapon (2H)**: `Inverted Spear of Heaven & Thousand-Mile Chain` (`inverted_spear_chain`, Mythic) — Senjata kutukan dua tangan (menempati slot Weapon & Off-hand).
     - Left-Click: Tusukan jarak jauh Inverted Spear yang menembus dan **menonaktifkan perisai musuh** (75 Dmg).
     - Right-Click: Mengayunkan rantai besi berputar 360 derajat.
* ⛓️ **FULL SET BONUS — Inverted Chain Rampage**:
  - Menggantikan tombol `Q` dengan pusaran badai rantai besi berkecepatan tinggi yang merobek seluruh musuh di sekeliling Toji tanpa henti, memantulkan serangan musuh.
  - Audio: Gemerincing rantai besi berat dan dentang tajam pisau jitte.

---

### 4. Guts — *The Black Swordsman* (Berserk)
> *"Even if we painstakingly piece together something lost, it doesn't mean things will ever go back to how they were."*

* **Tema Visual**: Pelindung baja hitam bersudut tajam (*Berserker Armor*), helm kepala serigala demonic dengan celah mata merah membara, serta pedang besi Dragon Slayer raksasa.
* **Komponen Set (5 Bagian)**:
  1. **Helmet**: `Berserker Beast Helm` (`guts_beast_helm`, Mythic) — HP +40, Armor +16, Crit Chance +18%.
  2. **Chest**: `Berserker Armor Plate` (`guts_berserker_plate`, Mythic) — HP +85, Armor +28.
     - *Base Q*: **Cannon Arm** — Membuka engsel lengan besi kiri, menembakkan peluru meriam artileri eksplosif (130 Dmg AOE) dengan kepulan asap mesiu tebal.
  3. **Pants**: `Black Iron Greaves` (`guts_greaves`, Legendary) — HP +35, Armor +18, kebal efek knockback.
  4. **Boots**: `Heavy War Sollerets` (`guts_sollerets`, Legendary) — Kecepatan Gerak +15, Armor +12, kebal jebakan duri lantai.
  5. **Weapon (2H)**: `Dragon Slayer` (`dragon_slayer`, Mythic) — Bongkahan besi setinggi 92px (Dmg 105, Kecepatan 0.65, Reach 92).
     - Serangan tebasan dua tangan 180° mematikan dengan busur tebal 12px, tepi merah membara, dan percikan gesekan api.
* 🩸 **FULL SET BONUS — Berserker Beast Armor Unleashed (狂戦士の甲冑)**:
  - Menggantikan tombol `Q` dengan **Berserker Rage**!
  - **Efek Sinematik Layar Penuh**:
    - Pembuluh darah aura merah berdenyut di sekujur tepi layar.
    - **Total Invulnerability**: Kebal 100% dari segala bentuk damage selama 6.0 detik!
    - Kecepatan serang +85%, kecepatan gerak +50%, kebal stun/knockback, lifesteal 35%, dan setiap ayunan pedang memicu getaran layar hebat serta teks komik `CLANG!` raksasa.
    - Audio: Raungan serigala iblis buas dan hantaman landasan besi legendaris `CLANG!`.

---

### 5. Levi Ackerman — *Humanity's Strongest Soldier* (Attack on Titan)
> *"If you don't fight, you can't win."*

* **Tema Visual**: Jubah hijau Survey Corps berlogo *Wings of Freedom*, sabuk pengikat harness kulit, tabung gas bertekanan tinggi di pinggang, dan sepasang bilah baja snap blade.
* **Komponen Set (5 Bagian)**:
  1. **Helmet**: `Survey Corps Hooded Cloak` (`scout_hood`, Mythic) — HP +30, Armor +8, Kecepatan Gerak +16, CDR -15%.
  2. **Chest**: `3D Maneuver Gear & Gas Canisters` (`odm_harness`, Mythic) — HP +55, Armor +14, Regenerasi Stamina +15, HUD Bar Gas ODM.
     - *Base Q*: **ODM Gas Boost** — Menerjang lurus ke depan dengan semburan uap gas bertekanan tinggi.
  3. **Pants**: `Scout Cavalry Trousers` (`scout_trousers`, Legendary) — HP +25, Armor +10, Kecepatan Gerak +18, Pengurangan Biaya Dash -25%.
  4. **Boots**: `Scout Knee-High Riding Boots` (`scout_boots`, Legendary) — Kecepatan Gerak +32, Armor +8.
  5. **Weapon (2H / Dual-wield)**: `Dual Ultrahard Steel Snap Blades` (`dual_snap_blades`, Mythic) — Dmg 48, Kecepatan 1.25, Crit Chance +25%. Menyerang dengan tebasan ganda menyilang secepat kilat.
* ⚔️ **FULL SET BONUS — Levi Grapple Whirlwind (ODM Mode)**:
  - Menekan `Q` mengaktifkan **Mode Manuver ODM 3D Penuh**:
  - Klik Kiri menembakkan kabel jangkar (*grapple cable*) berjarak tak terbatas ke arah kursor (dinding atau musuh).
  - Levi ditarik meluncur dengan akselerasi supersonik. **Kebal tabrakan (pass-through)** saat meluncur, berputar 360° mencincang musuh dengan **80 Dmg per putaran**!
  - Gas terisi kembali saat mendarat di tanah.
  - Audio: Desisan pneumatik gas bertekanan tinggi (`PSSSSHH!`) dan bunyi desingan bilah baja memotong udara.

---

### 6. David Martinez — *Night City Legend* (Cyberpunk: Edgerunners)
> *"I'm built different."*

* **Tema Visual**: Jaket EMT kuning neon milik Gloria, chassis cyberware Sandevistan di tulang punggung, dan sepatu sneakers cyber chrome.
* **Komponen Set (6 Bagian)**:
  1. **Helmet**: `Kiroshi Optics Mk. 4` (`david_kiroshi`, Mythic) — HP +30, Crit Chance +25%, menampilkan overlay analisis target taktis.
  2. **Chest**: `Gloria's High-Vis EMT Jacket` (`david_jacket`, Mythic) — HP +45, Armor +14.
     - *Base Q*: **Overcharge Boost** — Akselerasi sirkuit listrik memberikan +35% kecepatan lari selama 3.0 detik.
  3. **Pants**: `Streetkid Cargo Pants` (`david_pants`, Legendary) — HP +20, Armor +8, Kecepatan Gerak +20, Max Stamina +15.
  4. **Boots**: `Chrome Cyber-Sneakers` (`david_sneakers`, Legendary) — Kecepatan Gerak +28, Pengurangan Biaya Dash Roll -12%.
  5. **Weapon (1H)**: `Carnage Shotgun` (`david_shotgun`, Mythic) — Senapan shotgun pompa 4 peluru. Setiap tembakan menembakkan semburan 6 butir peluru buckshot (masing-masing 14 Dmg = total 84 Dmg) dengan sebaran 22°. Reload otomatis setelah 4 kali tembakan.
  6. **Off-Hand**: `Gorilla Arms Cyberware` (`david_gorilla_arms`, Mythic) — Lengan implan titanium hidrolik. Right-Click meluncurkan pukulan piston berkekuatan 50 Dmg dengan dorongan maju dan *armor penetration* 35% (+20 Dmg Buff pasif).
* ⚡ **FULL SET BONUS — Sandevistan Time Dilation (軍用サンデヴィスタン)**:
  - Menggantikan tombol `Q` dengan aktivasi **Sandevistan Militer**!
  - **Efek Sinematik Layar Penuh**:
    - Suara boot digital ikonik (`BWEEEEE-SHOOOM`) terdengar.
    - **Global Slow-Mo**: Waktu di seluruh dunia (semua monster, proyektil, dan pemain lain) melambat drastis menjadi **10% dari kecepatan normal** selama 4.0 detik!
    - **David adalah satu-satunya entitas yang bergerak dengan kecepatan 100% normal**!
    - Layar dibalut overlay grid matriks hijau cyberpunk dan bayangan ghost-trail berwarna cyan dan lime neon yang tertinggal saat David bermanuver bebas membantai musuh yang membeku.

---

## 🛡️ Daftar Lengkap Baseline / Dungeon Fantasy Gear

### Senjata (Weapons)
1. **`rusty_sword` — Rusty Shortsword** *(Common, 1-Handed)*
   - Damage: **22** | Kecepatan Serang: **1.00s** | Jangkauan: **58px** | Harga Jual: **5 Slops**
   - Senjata starter standar dengan tebasan besi cepat.
2. **`crystal_blade` — Crystal Scimitar** *(Rare, 1-Handed)*
   - Damage: **34** | Kecepatan Serang: **1.25s** | Jangkauan: **64px** | Harga Jual: **15 Slops**
   - Pedang kristal ringan yang ditempa dari prisma gua, memiliki ayunan sangat lincah.
3. **`titan_greatsword` — Titan Greatsword** *(Epic, 2-Handed)*
   - Damage: **68** | Kecepatan Serang: **0.72s** | Jangkauan: **84px** | Harga Jual: **35 Slops**
   - Pedang dua tangan besar dengan busur tebasan luas yang sanggup mengenai banyak musuh sekaligus.
4. **`thunder_warhammer` — Thunder Warhammer** *(Legendary, 2-Handed)*
   - Damage: **92** | Kecepatan Serang: **0.65s** | Jangkauan: **78px** | Harga Jual: **75 Slops**
   - Palu godam raksasa penghancur baja yang melepaskan gelombang kejut ke tanah saat mendarat.

### Tangan Kiri / Perisai (Off-Hand)
1. **`wooden_buckler` — Wooden Buckler** *(Common)*
   - Armor: **+5** | Block Mitigation: **50%** | Harga Jual: **5 Slops**
   - Perisai kayu sederhana. Menahan Right-Click menangkis 50% damage dari depan.
2. **`iron_tower_shield` — Iron Tower Shield** *(Rare)*
   - Armor: **+14** | Block Mitigation: **85%** | Harga Jual: **15 Slops**
   - Perisai pavise baja berat. Menahan 85% serangan frontal dan meniadakan knockback serangan musuh.
3. **`arcane_tome` — Arcane Grimoire** *(Epic)*
   - Armor: **+2** | Cooldown Reduction: **-20%** | Damage Buff: **+12** | Harga Jual: **35 Slops**
   - Kitab sihir kuno berenergi runik yang mempercepat jeda skill dan memperkuat daya rusak serangan.

### Pelindung Kepala (Helmets)
1. **`iron_visor` — Iron Visor Helm** *(Common)*
   - Max HP: **+15** | Armor: **+4** | Harga Jual: **5 Slops**
   - Helm besi prajurit infanteri standar.
2. **`horned_barbarian_helm` — Horned War Helm** *(Rare)*
   - Max HP: **+30** | Armor: **+8** | Efek: Meningkatkan daya dorong *melee knockback* | Harga Jual: **15 Slops**
   - Helm bertanduk banteng liar penambah kegarangan tempur jarak dekat.
3. **`shadow_hood` — Shadow Cowl** *(Epic)*
   - Max HP: **+20** | Critical Strike Chance: **+15%** | Harga Jual: **35 Slops**
   - Tudung gelap pengintai yang melipatgandakan peluang serangan kritikal.

### Zirah Dada (Chests)
1. **`leather_tunic` — Leather Tunic** *(Common)*
   - Max HP: **+20** | Armor: **+6** | Base Q: **War Cry** (+15% Dmg sementara) | Harga Jual: **5 Slops**
   - Rompi kulit berjahit untuk perlindungan dasar petualang.
2. **`spiked_cuirass` — Spiked Steel Cuirass** *(Rare)*
   - Max HP: **+45** | Armor: **+16** | Base Q: **Iron Bastion** (Mengurangi 50% damage selama 3s) | Harga Jual: **15 Slops**
   - Zirah lempeng baja tebal berlapis duri penangkis.
3. **`celestial_mantle` — Celestial Mantle** *(Legendary)*
   - Max HP: **+75** | Armor: **+24** | Pasif: **Regenerasi +3 HP/detik** | Base Q: **Celestial Heal** (Memulihkan 45 HP instan) | Harga Jual: **75 Slops**
   - Zirah suci berkilau emas yang terus-menerus menutup luka pengguna.

### Celana / Pelindung Kaki (Pants)
1. **`cloth_pants` — Padded Leggings** *(Common)*
   - Max HP: **+10** | Stamina Regen: **+4/s** | Harga Jual: **5 Slops**
   - Celana kain fleksibel untuk kemudahan melangkah.
2. **`plated_greaves` — Heavy Plate Greaves** *(Rare)*
   - Max HP: **+25** | Armor: **+10** | Stamina Regen: **+8/s** | Harga Jual: **15 Slops**
   - Pelindung lutut dan tulang kering baja tempa.

### Sepatu Bot (Boots)
1. **`travel_boots` — Worn Leather Boots** *(Common)*
   - Kecepatan Gerak: **+15** | Harga Jual: **5 Slops**
   - Sepatu kulit pengelana yang ringan.
2. **`wind_striders` — Wind Striders** *(Rare)*
   - Kecepatan Gerak: **+35** | Pengurangan Biaya Dash Stamina: **-10%** | Harga Jual: **15 Slops**
   - Sepatu bot bersayap magis yang membuat lari dan manuver berguling sangat hemat tenaga.

---

## 🧪 Consumables & Supplies

Item habis pakai ini dapat dibeli dari **The Slop Merchant** di Ruang Merchant menggunakan tabungan koin party (*Shared Slops*), atau ditemukan dari peti harta karun:

1. **`health_flask` — Health Flask (Ramuan Pemulihan)**
   - Rarity: **COMMON**
   - Harga Beli di Toko: **25 Slops**
   - Efek: Langsung memulihkan **+50 HP** secara seketika saat dibeli atau dikonsumsi.
2. **`stamina_tonic` — Stamina Tonic (Tonik Stamina)**
   - Rarity: **RARE**
   - Harga Beli di Toko: **20 Slops**
   - Efek: Mengisi penuh bar stamina seketika dan memberikan efek **Stamina Tak Terbatas selama 8 detik penuh**, memungkinkan dash roll tanpa henti!

---

## 💰 Mekanik Ekonomi, Trade-Up Forge & Gacha Wheel

### 1. Koin Slops & Dompet Bersama (Shared Party Vault)
- Seluruh pemain dalam satu room co-op berbagi **1 saldo dompet bersama** (*Shared Slops*).
- **Homing Coins**: Koin Slops yang dijatuhkan oleh monster/pot akan berhamburan di tanah selama 1 detik. Jika tidak diambil, koin akan **otomatis melesat terbang (homing)** langsung ke arah pemain yang melakukan kill tersebut!

### 2. The Slop Merchant & Retaliasi Spelunky RPG
- Muncul di Ruang Merchant berkarpet mewah.
- Menjual supply penting dan membeli kembali barang inventaris yang tidak terpakai (*Scrap for Slops*).
- **Mekanik RPG Retaliasi**: Jika merchant diserang oleh pemain, ia akan mengeluarkan peluncur roket RPG ke bahunya, mengunci sasaran dengan laser merah selama **1.8 detik**, lalu menembakkan roket berdaya ledak area (*AoE splash*) langsung ke penyerang!

### 3. Trade-Up Forge (Mekanik 3-untuk-1)
- Pemain memasukkan **3 item dengan Rarity yang PERSIS SAMA** ke dalam tungku tempa.
- Tungku akan melebur ketiga item tersebut dan menghasilkan **1 item acak dengan tingkat Rarity 1 level lebih tinggi**:
  - `3 Common` ➔ **1 Random Rare**
  - `3 Rare` ➔ **1 Random Epic**
  - `3 Epic` ➔ **1 Random Legendary**
  - `3 Legendary` ➔ **1 Random Mythic**

### 4. Spin-a-Wheel Gacha Altar
- Bertaruh 1 item perlengkapan di roda keberuntungan sang merchant.
- **Probabilitas Murni (Tanpa Pity System)**:
  - 💥 **50% — Ancur (Shattered)**: Item hancur lebur menjadi abu tak bernilai.
  - ⬆️ **45% — Upgrade**: Item dipromosikan ke satu tingkat kelangkaan lebih tinggi (*Next Rarity Tier*).
  - 🎰 **5% — Jackpot**: Memperoleh item rahasia berkategori **Anime Mythic**!

---

## 🔮 Rencana Set Anime Mendatang (Batch 3 - Phase 6)

Sesuai dengan dokumen roadmap game, set anime berikutnya yang akan segera ditambahkan meliputi:

1. **Saitama — The Caped Baldy (One Punch Man)**
   - Set: *Hero's Polished Bald Scalp*, *Yellow Hero Suit & Cape*, *Hero Tights*, *Red Rubber Boots*, *Red Hero Glove*, *Grocery Bag*.
   - **Full Set Bonus Q**: **Serious Punch (マジ殴り)** — Layar beralih ke gaya manga hitam-putih kontras tinggi, melepaskan hantaman udara kerucut raksasa berkekuatan **350 True Damage**.
2. **Shinra Kusakabe — Devil's Footprints (Fire Force)**
   - Set: *Fire Brigade Visor*, *Bunker Coat*, *Turnout Pants*, *Devil's Ignition Boots*, *Flame Claws*.
   - **Full Set Bonus Q**: **Adolla Flight & Light-Speed Kick** — Melesat dengan jejak api Adolla melintasi ruangan dan meledakkan musuh dalam ledakan hitam-oranye.
3. **Arthur Boyle — Knight King (Fire Force)**
   - Set: *Knight's Circlet*, *White Surcoat*, *Paladin Breeches*, *Excalibur (Plasma Blade)*.
   - **Full Set Bonus Q**: **Violet Flash: Earth Divider** — Memanjangkan pedang plasma ungu melintasi layar horizontal.
4. **Rimuru Tempest — True Demon Lord (Tensura)**
   - Set: *Shizu's Anti-Magic Mask*, *Demon Lord Coat*, *Demon Katana*, *Water Orb*.
   - **Full Set Bonus Q**: **Beelzebuth (Gluttony)** — Menghisap seluruh musuh dan proyektil ke dalam lubang hitam, memulihkan HP Rimuru.
5. **Light Yagami — Kira (Death Note)**
   - Set: *Kira's Glasses*, *School Uniform Blazer*, *Dress Shoes*, *The Death Note*.
   - **Full Set Bonus Q**: **Heart Attack Judgment (40 Seconds)** — Menjatuhkan vonis kematian instan pada target bos.
6. **Subaru Natsuki & Rem (Re:Zero)**
   - Set Subaru: *Legendary Tracksuit*, *Return by Death* (Passive rewind saat mati) & *Cor Leonis*.
   - Set Rem: *Maid Ribbon & Horn*, *Frilled Apron*, *Spiked Morningstar Flail (2H)*, *Oni Rampage*.

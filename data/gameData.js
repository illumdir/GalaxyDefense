/**
 * Galaxy Defense - Fortress TD
 * Données du jeu — v0.15.4
 * Sources : Wiki officiel (Fandom) + GD Database API (https://gd-database.vercel.app/api/db/cards)
 * Mode ciblé : ARK (Expedition - Project Ark: Rebuild)
 *
 * STRUCTURE DES CARTES PAR TOURELLE (12 cartes au total) :
 * ┌─────────┬────────────────────────────────────┬─────────────────────────┐
 * │ Palier  │ 3 cartes VERTES (choisir parmi)    │ 1 carte VIOLETTE        │
 * ├─────────┼────────────────────────────────────┼─────────────────────────┤
 * │   1     │ Normal (×3) + Chain T1 (×2)        │ Breakthrough T1 (×2-3)  │
 * │   2     │ Chain T2 (×2-3) + Combo ② (×0-1)  │ Breakthrough T2 (×2)    │
 * │   3     │ Chain T3 (×2) + Combo ③ (×2)       │ Breakthrough T3 (×0-1)  │
 * └─────────┴────────────────────────────────────┴─────────────────────────┘
 *
 * Cartes VERTES = Normal, Chain T1/T2/T3, Combo (require une autre tourelle)
 * Cartes VIOLETTES = Breakthrough (améliorations spéciales)
 *
 * EMPILABILITÉ (max_copies) :
 *   - Cartes Normal : max_copies = 3
 *   - Toutes les autres cartes (Chain, Combo, Breakthrough) : max_copies = 1
 *
 * Prérequis Chain : T2 nécessite T1, T3 nécessite T2 (même branche)
 * Prérequis Combo : la tourelle partenaire doit être dans la composition
 *                   requires_turret: null = toujours disponible (Fortress)
 */

// ============================================================
// TOURELLES DE COMBAT (11 au total)
// ============================================================
const TURRETS = [
  {
    id: "sky_guard",
    name: "Sky Guard",
    damageType: "Fire",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/1/19/Sky_Guard.png/revision/latest?cb=20250819232345",
    cards: {
      normal: [
        { name: "Volley Missile",    effect: "Sky Guard Missile +1, DMG -15%",  tier: 1, color: "green", max_copies: 3 },
        { name: "Sky Guard Boost",   effect: "Sky Guard Missile DMG +50%",       tier: 1, color: "green", max_copies: 3 },
        { name: "Explosion Spread",  effect: "Explosion range +30%",             tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        // Tier 1
        { name: "Ignition",              tier: 1, color: "green", effect: "Enemies hit by Sky Guard Missiles receive [Burn] effect" },
        { name: "Impact Reinforcement",  tier: 1, color: "green", effect: "After hitting the target, Missile launches 3 small Sky Guard Missiles that only deal impact DMG" },
        // Tier 2
        { name: "Ignition Amplification", tier: 2, color: "green", requires_chain: "Ignition",             effect: "[Burn] Damage +100%" },
        { name: "Missile Amplification",  tier: 2, color: "green", requires_chain: "Impact Reinforcement", effect: "Small Missiles +3" },
        { name: "Chain Reaction",         tier: 2, color: "green", requires_chain: "Impact Reinforcement", effect: "Small Sky Guard Missiles have a 60% chance to launch an additional Small Sky Guard Missile upon hitting an enemy" },
        // Tier 3
        { name: "Death Ignition", tier: 3, color: "green", requires_chain: "Ignition Amplification", effect: "Triggers an explosion when an enemy dies while under [Burn] effect" }
      ],
      combo: [
        { name: "Collapse Explosion",    tier: 2, color: "green", requires_turret: "gravity_vortex_gun", effect: "Creates a Small Black Hole after the Sky Guard Missile exploded" },
        { name: "Detonation Thunderbolt",tier: 3, color: "green", requires_turret: "thunderbolt",        effect: "Generates a stationary small Thunderbolt for 5s after Sky Guard missiles kill enemies" },
        { name: "Path Strike",           tier: 3, color: "green", requires_turret: null,                 effect: "Sky Guard Missiles deal DMG to enemies along their path" }
      ],
      breakthrough: [
        { name: "Burning Area",          tier: 1, color: "purple", effect: "Sky Guard Missiles leave a burning area that lasts for 5s after exploding" },
        { name: "Impact Multiplier",     tier: 1, color: "purple", effect: "All Sky Guard Missiles' impact DMG +200%" },
        { name: "Strong Impact",         tier: 2, color: "purple", effect: "Sky Guard Missile +2" },
        { name: "Close-range Explosion", tier: 2, color: "purple", effect: "After hitting a target, Sky Guard Missile triggers an additional strong explosion in the nearby area" },
        { name: "Fire Transmission",     tier: 3, color: "purple", effect: "Sky Guard Missiles apply [Burn] effect to enemies they pass through" }
      ]
    }
  },
  {
    id: "laser",
    name: "Laser",
    damageType: "Energy",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/a/a1/Laser.png/revision/latest?cb=20250819233505",
    cards: {
      normal: [
        { name: "Laser Amplification", effect: "Laser DMG +50%",                              tier: 1, color: "green", max_copies: 3 },
        { name: "Stable Energy",       effect: "Laser Duration +40%",                         tier: 1, color: "green", max_copies: 3 },
        { name: "Laser Reflection",    effect: "Laser reflection +1, DMG -20% per reflection", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Additional Sweep",           tier: 1, color: "green", effect: "Fires 1 additional Sweeping Laser" },
        { name: "Energy Surge",               tier: 1, color: "green", effect: "Fires 2 additional Deflected Lasers" },
        { name: "Vulnerable Laser",           tier: 2, color: "green", requires_chain: "Additional Sweep", effect: "Enemies hit by Sweeping Laser receive [Vulnerable] effect" },
        { name: "Slow Laser",                 tier: 2, color: "green", requires_chain: "Energy Surge",     effect: "Enemies hit by Deflected Lasers receive [Slow] effect" },
        { name: "Sweep Boost",                tier: 3, color: "green", requires_chain: "Vulnerable Laser", effect: "Sweeping Laser sweeps once again" },
        { name: "Deflected Laser Reflection", tier: 3, color: "green", requires_chain: "Slow Laser",       effect: "Deflected Laser Reflections +1" }
      ],
      combo: [
        { name: "Energy Paralysis",    tier: 2, color: "green", requires_turret: "thunderbolt",  effect: "Enemies hit by Laser receive [Paralyze] effect" },
        { name: "Energy Detonation",   tier: 3, color: "green", requires_turret: "sky_guard",    effect: "All Lasers hitting enemies with [Burn] effect will trigger an Ignition Explosion" },
        { name: "Convergence Trigger", tier: 3, color: "green", requires_turret: "beam",         effect: "30% chance to generate a Refracted Beam upon Laser hitting enemies" }
      ],
      breakthrough: [
        { name: "High-Energy Pulse", tier: 1, color: "purple", effect: "Laser width +100%" },
        { name: "Multi-Strike",      tier: 1, color: "purple", effect: "Laser duration +100%, cooldown speed +20%" },
        { name: "Energy Overload",   tier: 2, color: "purple", effect: "Debuff duration from all Lasers +100%" },
        { name: "Tear Explosion",    tier: 2, color: "purple", effect: "20% chance to trigger a Ripping Laser when hitting enemies with Laser" },
        { name: "Energy Boost",      tier: 2, color: "purple", effect: "Laser DMG +80% for each debuff on enemies (Max: 300%)" }
      ]
    }
  },
  {
    id: "disruption_drone",
    name: "Disruption Drone",
    damageType: "Force-field",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/e/e8/Disruption_Drone.png/revision/latest?cb=20250819234629",
    cards: {
      normal: [
        { name: "Field Amplification", effect: "Disruption Drone DMG +50%",         tier: 1, color: "green", max_copies: 3 },
        { name: "Field Duration",       effect: "Disruption Drone duration +30%",    tier: 1, color: "green", max_copies: 3 },
        { name: "Field Expansion",      effect: "Disruption Drone DMG Range +30%",   tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Random Disturbance",     tier: 1, color: "green", effect: "Enemies hit by Disruption Field have a 5% chance to be teleported back" },
        { name: "Disruption Force",       tier: 1, color: "green", effect: "Each time Disruption Field deals damage, it inflicts 1 stack of [Disruption] effect" },
        { name: "Rewind Teleport",        tier: 2, color: "green", requires_chain: "Random Disturbance", effect: "Enemies hit by Disruption Field have a 2.5% chance to be transported to start point" },
        { name: "Disruption Burst",       tier: 2, color: "green", requires_chain: "Disruption Force",   effect: "When [Disruption] reaches MAX stacks, deals 1 high burst DMG" },
        { name: "Teleport Damage",        tier: 3, color: "green", requires_chain: "Rewind Teleport",    effect: "Teleportation deals 3% of target's MAX HP as damage (Max: 60,000 × Attack)" },
        { name: "Area Disruption",        tier: 3, color: "green", requires_chain: "Disruption Burst",   effect: "When [Disruption] reaches MAX stacks, deals 1 high burst DMG in area" }
      ],
      combo: [
        { name: "Small Laser",       tier: 2, color: "green", requires_turret: "laser",          effect: "A Sweeping Laser is generated in the center of Disruption Drone Field" },
        { name: "Electric Field",    tier: 2, color: "green", requires_turret: "teslacoil",      effect: "Enemies hit by Disruption Field have a 30% chance to be inflicted [Paralyze]" },
        { name: "Fortress Support",  tier: 3, color: "green", requires_turret: null,             effect: "Launch an additional set of Disruption Drones above Fortress" },
        { name: "Field Replication", tier: 3, color: "green", requires_turret: "railgun",        effect: "When Railgun Shell enters Disruption Field first time, it 100% splits into +1 Shell" }
      ],
      breakthrough: [
        { name: "Final Blast",       tier: 1, color: "purple", effect: "Disruption Field causes explosion DMG when it ends" },
        { name: "Stasis Field",      tier: 1, color: "purple", effect: "Each time enemies take damage from Disruption Field, [Slow] effect +10% (MAX: 90%)" },
        { name: "Quick Cooldown",    tier: 2, color: "purple", effect: "Disruption Drone DMG interval -30%, cooldown speed +30%" },
        { name: "Field Suppression", tier: 2, color: "purple", effect: "Enemies in the Disruption Field take increased additional DMG based on reduced speed (MAX: 200%)" },
        { name: "Converging Field",  tier: 3, color: "purple", effect: "Disruption Drone DMG +100%, each DMG pulls enemies towards the center" }
      ]
    }
  },
  {
    id: "aeroblast",
    name: "Aeroblast",
    damageType: "Physical",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/9/98/Areoblast.png/revision/latest?cb=20250819233940",
    cards: {
      normal: [
        { name: "Powerful Blast",     effect: "Aeroblast Shell DMG +50%",              tier: 1, color: "green", max_copies: 3 },
        { name: "Multiple Blast",     effect: "Aeroblast Shell +1, DMG -15%",           tier: 1, color: "green", max_copies: 3 },
        { name: "Impact Enhancement", effect: "Aeroblast Shell knockback +50%, DMG +30%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Shotgun Barrage", tier: 1, color: "green", effect: "After Aeroblast fires, it launches 5 penetrating Shotgun Shells" },
        { name: "Floating Mine",   tier: 1, color: "green", effect: "Upon explosion, Aeroblast Shell leaves 2 Floating Mines in the explosion area" },
        { name: "Extra Loading",   tier: 2, color: "green", requires_chain: "Shotgun Barrage", effect: "For each enemy killed, Aeroblast fires 1 additional Shotgun Shell (MAX: 10)" },
        { name: "Wide Minefield",  tier: 2, color: "green", requires_chain: "Floating Mine",  effect: "Floating Mine +2, explosion DMG +25%" },
        { name: "Mine Shockwave",  tier: 2, color: "green", requires_chain: "Floating Mine",  effect: "Floating Mine +2, Knockback +100%" },
        { name: "Shotgun Penetration", tier: 3, color: "green", requires_chain: "Extra Loading", effect: "Penetrating Shotgun Shells penetration DMG +50%, range +70%" }
      ],
      combo: [
        { name: "Piercing Blast",   tier: 2, color: "green", requires_turret: "railgun",          effect: "Aeroblast shell Penetration +1" },
        { name: "Firewheel Summon", tier: 2, color: "green", requires_turret: "firewheel_drone",  effect: "For each enemy hit by Aeroblast Shell Explosion, it generates a small Firewheel Drone" },
        { name: "Gravity Bomb",     tier: 3, color: "green", requires_turret: "gravity_vortex_gun", effect: "Aeroblast shell DMG +100%, pulls enemies to the center before the explosion" }
      ],
      breakthrough: [
        { name: "Massive Explosion",   tier: 1, color: "purple", effect: "Aeroblast Shell explosion range +70%" },
        { name: "Central Blast",       tier: 1, color: "purple", effect: "Aeroblast Shells deal an additional high-energy explosion to the center area" },
        { name: "Chain Explosion",     tier: 2, color: "purple", effect: "For each enemy hit by Aeroblast Shell explosion, explosion DMG +20% (Max: 200%)" },
        { name: "Range Extension",     tier: 2, color: "purple", effect: "Aeroblast range +70%" },
        { name: "Secondary Explosion", tier: 3, color: "purple", effect: "Enemies hit by Aeroblast Shell will trigger an additional explosion after 1s" }
      ]
    }
  },
  {
    id: "thunderbolt",
    name: "Thunderbolt",
    damageType: "Electric",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/d/db/Thunderbolt.png/revision/latest?cb=20250819234221",
    cards: {
      normal: [
        { name: "Continuous Strike", effect: "Thunderbolt +1, Lightning Strike DMG -15%",      tier: 1, color: "green", max_copies: 3 },
        { name: "Swift Strike",      effect: "Lightning Strike cooldown speed +10%, DMG +30%",  tier: 1, color: "green", max_copies: 3 },
        { name: "Lightning Boost",   effect: "Lightning Strike DMG +50%",                       tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Chain Lightning",    tier: 1, color: "green", effect: "Lightning Strike triggers 1 Chain Lightning on hit (MAX: 5)" },
        { name: "Lightning Paralysis",tier: 1, color: "green", effect: "Enemies hit by Lightning Strike receive [Paralyze] effect" },
        { name: "Chain Expansion",    tier: 2, color: "green", requires_chain: "Chain Lightning",     effect: "Chain Lightning's target +4 (Changes MAX: 9)" },
        { name: "Paralysis Extension",tier: 2, color: "green", requires_chain: "Lightning Paralysis", effect: "Duration of [Paralyze] effect +100%" },
        { name: "Paralyzing Shock",   tier: 2, color: "green", requires_chain: "Lightning Paralysis", effect: "When Thunderbolt triggers [Paralyze], triggers a small lightning strike every second" },
        { name: "Chain Interference", tier: 3, color: "green", requires_chain: "Chain Expansion",    effect: "Enemies hit by Chain Lightning receive [Paralyze] effect, Chain Lightning DMG +100%" },
        { name: "Life Erosion",       tier: 3, color: "green", requires_chain: "Paralysis Extension", effect: "Lightning Strike deals 3% of target's MAX HP as damage when inflicting [Paralyze] (Max: 60,000 × Attack)" }
      ],
      combo: [
        { name: "Lightning Aftershock",    tier: 2, color: "green", requires_turret: "aeroblast",       effect: "50% chance to generate 1 Floating Mine as Thunderbolt hits enemies" },
        { name: "Lightning Trail",         tier: 2, color: "green", requires_turret: "firewheel_drone", effect: "After Lightning strike, leave a flame trail" },
        { name: "Lightning Teleportation", tier: 3, color: "green", requires_turret: "disruption_drone",effect: "Enemies hit by Strike or Chain Lightning have 50% chance to be teleported back" }
      ],
      breakthrough: [
        { name: "Lightning Expansion",    tier: 1, color: "purple", effect: "Lightning Strike width +100%" },
        { name: "Slaughtering Lightning", tier: 1, color: "purple", effect: "Lightning Strike has a 60% chance to trigger a Stationary small Thunderbolt when killing enemies" },
        { name: "Paralysis Chain",        tier: 1, color: "purple", effect: "Enemies paralyzed by Thunderbolt trigger a small chain Lightning each time they take damage (0.5s interval)" },
        { name: "Extra Strike",           tier: 2, color: "purple", effect: "Lightning Strike has a 50% chance to trigger 1 more time" },
        { name: "Chain Strike",           tier: 2, color: "purple", effect: "Enemies hit by Chain Lightning have a 25% chance to trigger a Small Lightning Strike" }
      ]
    }
  },
  {
    id: "beam",
    name: "Beam",
    damageType: "Energy",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/d/df/Beam.png/revision/latest?cb=20250820001541",
    cards: {
      normal: [
        { name: "Beam Amplifier",   effect: "Beam DMG +50%",            tier: 1, color: "green", max_copies: 3 },
        { name: "Beam Acceleration",effect: "Beam cooldown speed +30%", tier: 1, color: "green", max_copies: 3 },
        { name: "Beam Expansion",   effect: "Beam width +30%",          tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Refracted Beam",        tier: 1, color: "green", effect: "Beam splits into 2 smaller beams after hitting an enemy" },
        { name: "Charging Beam",         tier: 1, color: "green", effect: "Beam charges for 1s before firing, DMG +100%" },
        { name: "Refraction Enhancement",tier: 2, color: "green", requires_chain: "Refracted Beam",  effect: "Refracted beams split into 2 more mini beams" },
        { name: "Charged Burst",         tier: 2, color: "green", requires_chain: "Charging Beam",   effect: "Charging time +0.5s, DMG +150%" },
        { name: "Refraction Mastery",    tier: 3, color: "green", requires_chain: "Refraction Enhancement", effect: "All refracted beams deal full DMG" },
        { name: "Overcharged Beam",      tier: 3, color: "green", requires_chain: "Charged Burst",   effect: "Charging time +1s, DMG +300%, beam width +100%" }
      ],
      combo: [
        { name: "Energy Synergy",     tier: 2, color: "green", requires_turret: "laser",             effect: "Beam DMG +50% against enemies affected by Laser" },
        { name: "Conductive Beam",    tier: 2, color: "green", requires_turret: "thunderbolt",       effect: "Beam applies [Conductive] effect to enemies for 3s" },
        { name: "Spinning Energy",    tier: 3, color: "green", requires_turret: "laser",             effect: "Beam creates a spinning energy disk on hit that damages nearby enemies" },
        { name: "Gravitational Lens", tier: 3, color: "green", requires_turret: "gravity_vortex_gun",effect: "Beam bends toward nearby enemies after hitting a target" }
      ],
      breakthrough: [
        { name: "Penetrating Beam", tier: 1, color: "purple", effect: "Beam penetration +2" },
        { name: "Energy Overload",  tier: 1, color: "purple", effect: "Beam has a 20% chance to deal double DMG" },
        { name: "Beam Mastery",     tier: 2, color: "purple", effect: "Beam width +50%, DMG +30%" },
        { name: "Focused Energy",   tier: 2, color: "purple", effect: "Beam DMG increases the longer it hits the same target (MAX: +200%)" }
      ]
    }
  },
  {
    id: "firewheel_drone",
    name: "Firewheel Drone",
    damageType: "Fire",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/a/a8/Firewheel_Drone.png/revision/latest?cb=20250820004836",
    cards: {
      normal: [
        { name: "Firewheel Boost",   effect: "Firewheel Drone DMG +50%",       tier: 1, color: "green", max_copies: 3 },
        { name: "Size Boost",        effect: "Firewheel Drone size +25%",      tier: 1, color: "green", max_copies: 3 },
        { name: "Duration Extension",effect: "Firewheel Drone duration +30%",  tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Mini Drones",   tier: 1, color: "green", effect: "Firewheel Drone summons 2 Mini Firewheel Drones every 3 seconds" },
        { name: "Flame Trail",   tier: 1, color: "green", effect: "Firewheel Drone leaves a Flame Trail for 2 seconds during flight" },
        { name: "Killing Array", tier: 2, color: "green", requires_chain: "Mini Drones", effect: "For every 2 enemies directly killed, Summon 2 Mini Firewheel Drones" },
        { name: "Blazing Trail", tier: 2, color: "green", requires_chain: "Flame Trail",  effect: "Flame Trail DMG +60%" },
        { name: "Mini Size Boost",tier: 3, color: "green", requires_chain: "Killing Array", effect: "Mini Firewheel Drone DMG +50%, Duration +50%" },
        { name: "Extended Trail", tier: 3, color: "green", requires_chain: "Blazing Trail",  effect: "Flame Trail duration +2 seconds" }
      ],
      combo: [
        { name: "Firewheel Ignition", tier: 2, color: "green", requires_turret: "sky_guard",          effect: "Firewheel Drone has a 20% chance to inflict [Burn] effect" },
        { name: "Vortex Firewheel",   tier: 2, color: "green", requires_turret: "gravity_vortex_gun", effect: "Firewheel Drone creates a pull effect around it" },
        { name: "Extra Barrage",      tier: 3, color: "green", requires_turret: "aeroblast",          effect: "For every 15 hits dealt by Firewheel Drone, launch 1 ring of penetrating bullets" }
      ],
      breakthrough: [
        { name: "Smart Acceleration", tier: 1, color: "purple", effect: "Firewheel Drone DMG +60%, Speed +80%, when not dealing damage to enemies" },
        { name: "Hold the Ground",    tier: 1, color: "purple", effect: "Firewheel Drone stays for an additional 10 seconds after it ends" },
        { name: "Killing Charge",     tier: 2, color: "purple", effect: "For every 2 enemies directly killed, Firewheel Drone cooldown -0.5s (MAX: +5)" },
        { name: "Combo Boost",        tier: 2, color: "purple", effect: "For every 20 hits dealt by Firewheel Drone, DMG +20% (MAX: +200%)" },
        { name: "Blazing Overflow",   tier: 3, color: "purple", effect: "Additional Firewheel Drone enhancements at max stack" }
      ]
    }
  },
  {
    id: "hive",
    name: "Hive",
    damageType: "Force-field",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/c/c2/Hive.png/revision/latest?cb=20250820003025",
    cards: {
      normal: [
        { name: "Swarm Assault", effect: "Wasps DMG +50%",           tier: 1, color: "green", max_copies: 3 },
        { name: "Rapid Barrage", effect: "Wasps attack count +2",    tier: 1, color: "green", max_copies: 3 },
        { name: "Dense Swarm",   effect: "Wasps +2, DMG -15%",       tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Swarm Echo",   tier: 1, color: "green", effect: "Wasps spawn 1 Echo Wasp on kill (Max: 1)" },
        { name: "Contact Pulse",tier: 1, color: "green", effect: "Wasp releases 1 Pulse Wave on first hit" },
        { name: "Echo Upgrade II",  tier: 2, color: "green", requires_chain: "Swarm Echo",    effect: "Evolves echoes to Echo Wasp II" },
        { name: "Final Resonance",  tier: 2, color: "green", requires_chain: "Contact Pulse", effect: "Wasp releases 1 Pulse Wave when it ends" },
        { name: "Amplified Pulse",  tier: 2, color: "green", requires_chain: "Contact Pulse", effect: "Pulse Wave DMG range +30% and inflicts [Slow] effect on hit" },
        { name: "Echo Upgrade III", tier: 3, color: "green", requires_chain: "Echo Upgrade II", effect: "Evolves Echoes to Echo Wasp III" }
      ],
      combo: [
        { name: "Electro-Wasps",     tier: 2, color: "green", requires_turret: "teslacoil",  effect: "Each Wasp attack has 50% chance to release a High-voltage shock" },
        { name: "Projectile Fission",tier: 2, color: "green", requires_turret: null,          effect: "Wasps split into 7 sub-projectiles on hit" },
        { name: "Swarm Fury",        tier: 3, color: "green", requires_turret: "laser",       effect: "Wasps +30% DMG after each attack" }
      ],
      breakthrough: [
        { name: "Wasp Evolution II", tier: 1, color: "purple", effect: "Wasp I evolves to II after 3 attacks" },
        { name: "Hive Mutation II",  tier: 1, color: "purple", effect: "Hive launches Wasp II after 2 volleys" },
        { name: "Wasp Evolution III",tier: 2, color: "purple", effect: "Wasp II evolves to III after 3 attacks" },
        { name: "Wasp Retrieval",    tier: 2, color: "purple", effect: "Wasps have a 50% chance to return to the Hive when destroyed" },
        { name: "Hive Mutation III", tier: 2, color: "purple", effect: "Hive has a 50% chance to launch Wasp III after 2 volleys" }
      ]
    }
  },
  {
    id: "railgun",
    name: "Railgun",
    damageType: "Physical",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/a/ab/Railgun.png/revision/latest?cb=20250820000646",
    cards: {
      normal: [
        { name: "Ammo Boost",      effect: "Railgun Shell DMG +50%",                    tier: 1, color: "green", max_copies: 3 },
        { name: "Shell Salvo",     effect: "Railgun Shell +1, DMG -15%",                tier: 1, color: "green", max_copies: 3 },
        { name: "Railgun Upgrade", effect: "Railgun Shell DMG +30%, Penetration +1",    tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Basic Split",          tier: 1, color: "green", effect: "Railgun Shell splits into 2 small Shells on first hit, 20% chance to split into 2 more" },
        { name: "Explosive Shells",     tier: 1, color: "green", effect: "Railgun Shell explodes on hit" },
        { name: "Piercing Enhancement", tier: 2, color: "green", requires_chain: "Basic Split",      effect: "Small Railgun Shell splits further, 20% chance to split again" },
        { name: "Impact Spread",        tier: 2, color: "green", requires_chain: "Explosive Shells", effect: "Railgun Shell explosion range +20% for each penetration" },
        { name: "Impact Boost",         tier: 2, color: "green", requires_chain: "Explosive Shells", effect: "Railgun Shell explosion DMG +30% for each penetration" },
        { name: "Split Mastery",        tier: 3, color: "green", requires_chain: "Piercing Enhancement", effect: "All Railgun shells' split chance +40%" }
      ],
      combo: [
        { name: "Piercing Mark",       tier: 2, color: "green", requires_turret: null,             effect: "Enemies hit by all Railgun shells receive [Physical Vulnerable] effect" },
        { name: "Secondary Minefield", tier: 3, color: "green", requires_turret: "aeroblast",      effect: "Railgun Shell releases 1 Floating Mine on hit" },
        { name: "Piercing Ricochet",   tier: 3, color: "green", requires_turret: "firewheel_drone",effect: "All Railgun Shells penetration +1, reflection +1" }
      ],
      breakthrough: [
        { name: "Power Penetration",    tier: 1, color: "purple", effect: "Railgun Shell penetration +3, knock-back +100%" },
        { name: "Weak Spot Strike",     tier: 1, color: "purple", effect: "Railgun Shell DMG increases with target HP (MAX: 150%)" },
        { name: "Shell Crit Boost",     tier: 2, color: "purple", effect: "All Railgun Shells DMG +40%, Critical Rate +30%" },
        { name: "Execution Penetration",tier: 2, color: "purple", effect: "Railgun Shell penetration +1 on kill (MAX: 5)" },
        { name: "Rail Overcharge",      tier: 3, color: "purple", effect: "Ultimate railgun shell enhancement" }
      ]
    }
  },
  {
    id: "teslacoil",
    name: "Teslacoil",
    damageType: "Electric",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/f/f1/Teslacoil.png/revision/latest?cb=20250819235154",
    cards: {
      normal: [
        { name: "Electro Boost",        effect: "Teslacoil DMG +50%",              tier: 1, color: "green", max_copies: 3 },
        { name: "Electro Chain",        effect: "Teslacoil bounces +1, DMG -15%",  tier: 1, color: "green", max_copies: 3 },
        { name: "Electro Acceleration", effect: "Teslacoil cooldown speed +30%",   tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Charge Expansion",  tier: 1, color: "green", effect: "Teslacoil charge time +0.5s, DMG range increases with charge time" },
        { name: "Trap Matrix",       tier: 1, color: "green", effect: "Teslacoil releases Electric Matrix with additional DMG and [Slow] effect for 2s" },
        { name: "Enhanced Matrix",   tier: 2, color: "green", requires_chain: "Trap Matrix",       effect: "Electric Matrix DMG +100%, duration +1 second" },
        { name: "Charge Destruction",tier: 3, color: "green", requires_chain: "Charge Expansion",  effect: "Teslacoil charge time +0.5s, DMG increases with charge time" },
        { name: "Charge Delayed",    tier: 3, color: "green", requires_chain: "Charge Expansion",  effect: "Charge time +1 second" },
        { name: "Matrix Thunderbolt",tier: 3, color: "green", requires_chain: "Enhanced Matrix",   effect: "The Electric Matrix has a 30% chance to release a stationary Small Thunderbolt for 5s" }
      ],
      combo: [
        { name: "Electric Enhancement", tier: 2, color: "green", requires_turret: "thunderbolt", effect: "All Electric DMG +80%" },
        { name: "Cooperative Beam",     tier: 2, color: "green", requires_turret: "beam",        effect: "During charging, Teslacoil releases 2 Refracted Beams" },
        { name: "Spinning Laser",       tier: 3, color: "green", requires_turret: "laser",       effect: "Teslacoil releases 1 Spinning Laser on hit" }
      ],
      breakthrough: [
        { name: "Electric Chain Surge", tier: 1, color: "purple", effect: "Teslacoil releases up to 5 high-energy electric shocks on hit to nearby enemies" },
        { name: "Electro Interference", tier: 1, color: "purple", effect: "Teslacoil Explosion range +30%, Explosion and Electro Matrix inflict [Paralyze] effect" },
        { name: "Expanded Shockwave",   tier: 2, color: "purple", effect: "Teslacoil explosion range increased, outer DMG halved" },
        { name: "Charged Shock",        tier: 2, color: "purple", effect: "During Teslacoil charging, releases up to 2 high-energy electric shocks every 0.25s" }
      ]
    }
  },
  {
    id: "gravity_vortex_gun",
    name: "Gravity Vortex Gun",
    damageType: "Force-field",
    image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/d/d8/Gravity_Vortex_Gun.png/revision/latest?cb=20250820002337",
    cards: {
      normal: [
        { name: "High Power Field", effect: "Gravitational Field DMG +50%",             tier: 1, color: "green", max_copies: 3 },
        { name: "Wide Field",       effect: "Gravitational Field range +25%",           tier: 1, color: "green", max_copies: 3 },
        { name: "Extended Field",   effect: "Gravitational Field flight distance +30%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Small Black Hole",      tier: 1, color: "green", effect: "Creates a small black hole continuously pulling enemies for 5 seconds after the Gravitational Field disappears" },
        { name: "Static Wormhole",       tier: 1, color: "green", effect: "When Gravitational Field hits the first enemy, a portal is created to teleport enemies for 3 seconds" },
        { name: "Black Hole Expansion",  tier: 2, color: "green", requires_chain: "Small Black Hole",  effect: "Small Black Hole range +50%, pulling force +50%" },
        { name: "Wormhole Enhancement",  tier: 2, color: "green", requires_chain: "Static Wormhole",   effect: "Portal duration (entrance and exit) +100%" },
        { name: "Wormhole Expansion",    tier: 2, color: "green", requires_chain: "Static Wormhole",   effect: "Portal entry Range +100%" },
        { name: "Destructive Black Hole",tier: 3, color: "green", requires_chain: "Black Hole Expansion", effect: "Small Black Hole DMG +250%" }
      ],
      combo: [
        { name: "Field Reflection", tier: 2, color: "green", requires_turret: "firewheel_drone",  effect: "All Gravitational Fields can reflect" },
        { name: "Double Fission",   tier: 3, color: "green", requires_turret: "railgun",          effect: "Gravitational Field splits into two Gravitational small Fields at the end" },
        { name: "Field Disruption", tier: 3, color: "green", requires_turret: "disruption_drone", effect: "Gravitational Field inflicts [Disruption] effect on hit" }
      ],
      breakthrough: [
        { name: "Extended Pull",      tier: 1, color: "purple", effect: "The further the Gravitational Field flies, the larger the range" },
        { name: "Field Amplification",tier: 1, color: "purple", effect: "Gravitational Field DMG +80%, pulling force +100%" },
        { name: "Extra Field",        tier: 2, color: "purple", effect: "Gravitational Field +1" },
        { name: "Extended Range",     tier: 2, color: "purple", effect: "Gravitational Field flight distance doubled" },
        { name: "Gravity Overload",   tier: 3, color: "purple", effect: "Ultimate gravitational field enhancement" }
      ]
    }
  }
];

// ============================================================
// GARDIENS (20 au total)
// ============================================================
const GUARDIANS = {
  default: [
    {
      id: "adam", name: "Adam", fullName: "Adam - Heart of Iron",
      rarity: "Default", pairedTurret: null,
      image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/9/94/Adam.png/revision/latest?cb=20250819214020",
      note: "Gardien de départ. Aucun bonus de dégâts."
    }
  ],
  legendary: [
    { id: "cynthia",  name: "Cynthia",  rarity: "Legendary", pairedTurret: "sky_guard",       image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/5/5c/Cynthia.png/revision/latest?cb=20250819231202" },
    { id: "angelica", name: "Angelica", rarity: "Legendary", pairedTurret: "laser",            image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/7/7d/Angelica.png/revision/latest?cb=20250819233405" },
    { id: "jesse",    name: "Jesse",    rarity: "Legendary", pairedTurret: "aeroblast",        image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/7/78/Jesse.png/revision/latest?cb=20250819233827" },
    { id: "iris",     name: "Iris",     rarity: "Legendary", pairedTurret: "thunderbolt",      image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/5/5c/Iris.png/revision/latest?cb=20250819234117" },
    { id: "tracy",    name: "Tracy",    rarity: "Legendary", pairedTurret: "disruption_drone", image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/8/8e/Tracy.png/revision/latest?cb=20250819234546" }
  ],
  supreme: [
    { id: "jax",    name: "Jax",    rarity: "Supreme", pairedTurret: "firewheel_drone",   image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/f/fa/Jax.png/revision/latest?cb=20250820004758" },
    { id: "hedy",   name: "Hedy",   rarity: "Supreme", pairedTurret: "beam",              image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/4/44/Hedy.png/revision/latest?cb=20250820001503" },
    { id: "sk_zero",name: "SK-Zero",rarity: "Supreme", pairedTurret: "gravity_vortex_gun",image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/3/3c/SK-Zero.png/revision/latest?cb=20250820002221" },
    { id: "john_x", name: "John-X", rarity: "Supreme", pairedTurret: "hive",              image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/7/7a/John-X.png/revision/latest?cb=20250820002946" },
    { id: "capt",   name: "Capt.",  rarity: "Supreme", pairedTurret: "railgun",           image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/4/4f/Capt..png/revision/latest?cb=20250820000600" },
    { id: "hardy",  name: "Hardy",  rarity: "Supreme", pairedTurret: "teslacoil",         image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/b/b3/Hardy.png/revision/latest?cb=20250819235110" }
  ],
  ultimate: [
    { id: "clockwork", name: "Clockwork",           rarity: "Ultimate", pairedTurret: "railgun",           image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/b/b2/Clockwork.png/revision/latest?cb=20250820005517" },
    { id: "aurora",    name: "Aurora",              rarity: "Ultimate", pairedTurret: "laser",             image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/8/89/Aurora.png/revision/latest?cb=20250820013016" },
    { id: "linus",     name: "Linus",               rarity: "Ultimate", pairedTurret: "disruption_drone",  image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/3/31/Linus.png/revision/latest?cb=20250820013322" },
    { id: "victor",    name: "Victor",              rarity: "Ultimate", pairedTurret: "sky_guard",         image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/9/90/Victor.png/revision/latest?cb=20250923143246" },
    { id: "robin",     name: "Robin",               rarity: "Ultimate", pairedTurret: "thunderbolt",       image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/1/1b/Robin.png/revision/latest?cb=20250923144017" },
    { id: "cael_a",    name: "Cael-A",              rarity: "Ultimate", pairedTurret: "gravity_vortex_gun",image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/7/74/Cael-A.png/revision/latest?cb=20250923144424" },
    { id: "ampere",    name: "Ampere Mag Witch",    rarity: "Ultimate", pairedTurret: "teslacoil",         image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/1/10/Apmere.png/revision/latest?cb=20260126203358" },
    { id: "audric",    name: "Audric Glory Marchal", rarity: "Ultimate", pairedTurret: "firewheel_drone",  image: "https://static.wikia.nocookie.net/unofficial-gdftd-databanks/images/d/d8/Audric.png/revision/latest?cb=20260126203831" }
  ]
};

function getAvailableComboCards(turretId, selectedTurretIds) {
  const turret = TURRETS.find(t => t.id === turretId);
  if (!turret) return [];
  return turret.cards.combo.filter(card =>
    card.requires_turret === null || selectedTurretIds.includes(card.requires_turret)
  );
}

function getAllGuardians() {
  return [
    ...GUARDIANS.default,
    ...GUARDIANS.legendary,
    ...GUARDIANS.supreme,
    ...GUARDIANS.ultimate
  ];
}

if (typeof module !== "undefined") {
  module.exports = { TURRETS, GUARDIANS, getAvailableComboCards, getAllGuardians };
}

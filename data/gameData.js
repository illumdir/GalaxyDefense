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
        { name: "Explosion Spread", effect: "Explosion range +30%", tier: 1, color: "green", max_copies: 3 },
        { name: "Sky Guard Boost", effect: "Sky Guard Missile DMG +50%", tier: 1, color: "green", max_copies: 3 },
        { name: "Volley Missile", effect: "Sky Guard Missile +1, DMG -15%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Ignition", effect: "Enemies hit by Sky Guard Missiles receive [Burn] effect", tier: 1, color: "green" },
        { name: "Impact Reinforcement", effect: "After hitting the target, Sky Guard Missile launches 3 Small Sky Guard Missiles that only deal Impact DMG", tier: 1, color: "green" },
        { name: "Chain Reaction", effect: "Small Sky Guard Missiles have a 60% chance to launch an additional Small Sky Guard Missile upon hitting an enemy", tier: 2, color: "green", requires_chain: "Impact Reinforcement" },
        { name: "Ignition Amplification", effect: "[Burn] DMG +100% (Parent: Ignition)", tier: 2, color: "green", requires_chain: "Ignition" },
        { name: "Missile Amplification", effect: "Small Sky Guard Missiles +3", tier: 2, color: "green", requires_chain: "Impact Reinforcement" },
        { name: "Death Ignition", effect: "Triggers an explosion when an enemy dies while under [Burn] effect (Parent: Ignition)", tier: 3, color: "green", requires_chain: "Ignition Amplification" }
      ],
      combo: [
        { name: "Collapse Explosion", effect: "Creates a Small Black Hole after the Sky Guard Missile exploded", tier: 2, color: "green", requires_turret: "gravity_vortex_gun" },
        { name: "Detonation Thunderbolt", effect: "Generates a stationary small Thunderbolt for 5s after Sky Guard missiles kill enemies", tier: 3, color: "green", requires_turret: "thunderbolt" },
        { name: "Path Strike", effect: "Sky Guard Missiles deal DMG to enemies along their path", tier: 3, color: "green", requires_turret: null }
      ],
      breakthrough: [
        { name: "Burning Area", effect: "Sky Guard Missiles leave a burning area that lasts for 5s after exploding", tier: 1, color: "purple" },
        { name: "Impact Multiplier", effect: "All Sky Guard Missiles' impact DMG +200%", tier: 1, color: "purple" },
        { name: "Close-range Explosion", effect: "After hitting a target, Sky Guard Missile triggers an additional strong explosion in the nearby area", tier: 2, color: "purple" },
        { name: "Strong Impact", effect: "Sky Guard Missile +2", tier: 2, color: "purple" },
        { name: "Fire Transmission", effect: "Sky Guard Missiles apply [Burn] effect to enemies they pass through", tier: 3, color: "purple" }
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
        { name: "Laser Amplification", effect: "Laser DMG +50%", tier: 1, color: "green", max_copies: 3 },
        { name: "Laser Reflection", effect: "Laser reflection +1, DMG -20% per reflection", tier: 1, color: "green", max_copies: 3 },
        { name: "Stable Energy", effect: "Laser duration +40%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Additional Sweep", effect: "Fires 1 additional Sweeping Laser", tier: 1, color: "green" },
        { name: "Energy Surge", effect: "Fires 2 additional Deflected Lasers", tier: 1, color: "green" },
        { name: "Slow Laser", effect: "Enemies hit by Deflected Lasers receive [Slow] effect", tier: 2, color: "green", requires_chain: "Energy Surge" },
        { name: "Vulnerable Laser", effect: "Enemies hit by Sweeping Lasers receive [Vulnerable] effect", tier: 2, color: "green", requires_chain: "Additional Sweep" },
        { name: "Deflected Laser Reflection", effect: "Deflected Laser reflections +1", tier: 3, color: "green", requires_chain: "Slow Laser" },
        { name: "Sweep Boost", effect: "Sweeping Laser sweeps once again", tier: 3, color: "green", requires_chain: "Vulnerable Laser" }
      ],
      combo: [
        { name: "Energy Paralysis", effect: "Enemies hit by Laser receive [Paralyze] effect", tier: 2, color: "green", requires_turret: "thunderbolt" },
        { name: "Convergence Trigger", effect: "30% chance to generates a Refracted Laser upon Laser hitting enemies", tier: 3, color: "green", requires_turret: "laser" },
        { name: "Energy Detonation", effect: "All Lasers hitting enemies with [Burn] effect will trigger an Ignition Explosion", tier: 3, color: "green", requires_turret: "sky_guard" }
      ],
      breakthrough: [
        { name: "High-Energy Pulse", effect: "Laser width +100%", tier: 1, color: "purple" },
        { name: "Multi-Strike", effect: "Laser duration +100%, cooldown speed +20%", tier: 1, color: "purple" },
        { name: "Energy Boost", effect: "Laser DMG +80% for each debuff on enemies (MAX:300%)", tier: 2, color: "purple" },
        { name: "Energy Overload", effect: "Debuff duration from all Lasers +100%", tier: 2, color: "purple" },
        { name: "Tear Explosion", effect: "50% chance to trigger a Ripping Laser when hitting enemies with Laser", tier: 2, color: "purple" }
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
        { name: "Field Amplification", effect: "Disruption Field DMG +50%", tier: 1, color: "green", max_copies: 3 },
        { name: "Field Duration", effect: "Disruption Field duration +30%", tier: 1, color: "green", max_copies: 3 },
        { name: "Field Expansion", effect: "Disruption Field width +30%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Disruption Force", effect: "Each time Disruption Field deals damage to enemies, it inflicts 1 stack of [Disruption] effect", tier: 1, color: "green" },
        { name: "Random Disturbance", effect: "Enemies hit by Disruption Field have a 5% chance to be teleported back a certain distance", tier: 1, color: "green" },
        { name: "Disruption Burst", effect: "When [Disruption] effect reaches MAX stacks, deals 1 high burst DMG", tier: 2, color: "green", requires_chain: "Disruption Force" },
        { name: "Rewind Teleport", effect: "Enemies hit by Disruption Field have a 2.5% chance to be transported to start point", tier: 2, color: "green", requires_chain: "Random Disturbance" },
        { name: "Area Disruption", effect: "When [Disruption] effect reaches MAX stacks, deals 1 extra DMG", tier: 3, color: "green", requires_chain: "Disruption Burst" },
        { name: "Teleport Damage", effect: "Teleportation from the Disruption Field deals 3% of the target's MAX HP as DMG", tier: 3, color: "green", requires_chain: "Rewind Teleport" }
      ],
      combo: [
        { name: "Electric Field", effect: "Enemies hit by Disruption Field have a 30% chance to be inflicted [Paralyze]", tier: 2, color: "green", requires_turret: "teslacoil" },
        { name: "Small Laser", effect: "A Sweeping Laser is generated in the center of Disruption Drone", tier: 2, color: "green", requires_turret: "laser" },
        { name: "Field Replication", effect: "When Railgun Shell enters Disruption Field first time, it 100% splits into 1 additional Railgun Shell", tier: 3, color: "green", requires_turret: "railgun" },
        { name: "Fortress Support", effect: "Launch an additional set of Disruption Drones above Fortress", tier: 3, color: "green", requires_turret: null }
      ],
      breakthrough: [
        { name: "Final Blast", effect: "Disruption Field causes explosion DMG when it ends", tier: 1, color: "purple" },
        { name: "Stasis Field", effect: "Each time enemies take damage from Disruption Field, [Slow] effect +10% (MAX: 90%)", tier: 1, color: "purple" },
        { name: "Field Suppression", effect: "Enemies in the Disruption Field take increased additional DMG based on their reduced speed (MAX: 200% additional DMG)", tier: 2, color: "purple" },
        { name: "Quick Cooldown", effect: "Disruption Drone DMG interval -30%, cooldown speed +30%", tier: 2, color: "purple" },
        { name: "Converging Field", effect: "Disruption Drone DMG +100%, each DMG pulls enemies toward the center", tier: 3, color: "purple" }
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
        { name: "Impact Enhancement", effect: "Aeroblast Shell knockback +50%, DMG +30%", tier: 1, color: "green", max_copies: 3 },
        { name: "Multiple Blast", effect: "Aeroblast Shell +1, DMG -15%", tier: 1, color: "green", max_copies: 3 },
        { name: "Powerful Blast", effect: "Aeroblast Shell DMG +50%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Floating Mine", effect: "Upon explosion, Aeroblast Shell leaves 2 Floating Mines in the explosion area", tier: 1, color: "green" },
        { name: "Shotgun Barrage", effect: "After Aeroblast fires, it launches 5 penetrating Shotgun Shells", tier: 1, color: "green" },
        { name: "Extra Loading", effect: "For each enemy killed, Aeroblast fires 1 additional penetrating Shotgun Shell (MAX: 10)", tier: 2, color: "green", requires_chain: "Shotgun Barrage" },
        { name: "Mine Shockwave", effect: "Floating Mine +2, knockback +100%", tier: 2, color: "green", requires_chain: "Floating Mine" },
        { name: "Wide Minefield", effect: "Floating Mine +2, explosion DMG +25%", tier: 2, color: "green", requires_chain: "Floating Mine" },
        { name: "Shotgun Penetration", effect: "Penetrating Shotgun Shells penetration DMG +50%, range +70%", tier: 3, color: "green", requires_chain: "Extra Loading" }
      ],
      combo: [
        { name: "Firewheel Summon", effect: "For each enemy hit by Aeroblast Shell explosion, it generate a Small Firewheel Drone", tier: 2, color: "green", requires_turret: "firewheel_drone" },
        { name: "Piercing Blast", effect: "Aeroblast Shell Penetration +1", tier: 2, color: "green", requires_turret: "railgun" },
        { name: "Gravity Bomb", effect: "Aeroblast shell DMG +100%, pulls enemies to the center before the explosion", tier: 3, color: "green", requires_turret: "gravity_vortex_gun" }
      ],
      breakthrough: [
        { name: "Central Blast", effect: "Aeroblast Shells deal an additional high-energy explosion to the center area", tier: 1, color: "purple" },
        { name: "Massive Explosion", effect: "Aeroblast Shell explosion range +70%", tier: 1, color: "purple" },
        { name: "Chain Explosion", effect: "For each enemy hit by Aeroblast Shell explosion, explosion DMG +20% (MAX: 200%)", tier: 2, color: "purple" },
        { name: "Range Extension", effect: "Aeroblast range +70%", tier: 2, color: "purple" },
        { name: "Secondary Explosion", effect: "Enemies hit by Aeroblast Shell will trigger an additional explosion after 1s", tier: 2, color: "purple" }
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
        { name: "Continuous Strike", effect: "Thunderbolt +1, Lightning Strike DMG -15%", tier: 1, color: "green", max_copies: 3 },
        { name: "Lightning Boost", effect: "Lightning Strike DMG +50%", tier: 1, color: "green", max_copies: 3 },
        { name: "Swift Strike", effect: "Lightning Strike cooldown speed +10%, DMG +30%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Chain Lightning", effect: "Lightning Strike trigger 1 Chain Lightning on hit (MAX: 5)", tier: 1, color: "green" },
        { name: "Lightning Paralysis", effect: "Enemies hit by Lightning Strike receive [Paralyze] effect", tier: 1, color: "green" },
        { name: "Chain Expansion", effect: "Chain Lightning's target +4", tier: 2, color: "green", requires_chain: "Chain Lightning" },
        { name: "Paralysis Extension", effect: "Duration of [Paralyze] effect caused by the Thunderbolt +100%", tier: 2, color: "green", requires_chain: "Lightning Paralysis" },
        { name: "Chain Interference", effect: "Enemies hit by Chain Lightning receive [Paralyze] effect, Chain Lightning DMG +100%", tier: 3, color: "green", requires_chain: "Chain Expansion" },
        { name: "Life Erosion", effect: "Lightning Strike deals an additional 3% of the target's MAX HP as DMG when inflicting [Paralyze] effect", tier: 3, color: "green", requires_chain: "Paralysis Extension" }
      ],
      combo: [
        { name: "Lightning Aftershock", effect: "There is a 50% chance to generate 1 Floating Mine by Thunderbolt hits enemies", tier: 2, color: "green", requires_turret: "aeroblast" },
        { name: "Lightning Trail", effect: "After Lighting Strike, leaving a flame trail during flight", tier: 2, color: "green", requires_turret: "firewheel_drone" },
        { name: "Lightning Teleportation", effect: "Enemies hit by Lightning Strike or Chain Lightning have a 50% chance to be teleported back a certain distance", tier: 3, color: "green", requires_turret: "disruption_drone" }
      ],
      breakthrough: [
        { name: "Lightning Expansion", effect: "Lightning Strike width +100%", tier: 1, color: "purple" },
        { name: "Paralysis Chain", effect: "Enemies paralyzed by Thunderbolt trigger a small chain Lightning each time they take damage (0.5s interval)", tier: 1, color: "purple" },
        { name: "Slaughtering Lighting", effect: "Lightning Strike has a 60% chance to trigger a stationary small Thunderbolt when killing enemies", tier: 1, color: "purple" },
        { name: "Chain Strike", effect: "Enemies hit by Chain Lightning have a 25% chance to trigger a Small Lightning Strike", tier: 2, color: "purple" },
        { name: "Extra Strike", effect: "Lightning Strike has a 50% chance to trigger 1 more time", tier: 2, color: "purple" }
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
        { name: "Beam Acceleration", effect: "Beam cooldown speed +30%", tier: 1, color: "green", max_copies: 3 },
        { name: "Beam Amplifier", effect: "Beam DMG +50%", tier: 1, color: "green", max_copies: 3 },
        { name: "Beam Expansion", effect: "Beam width +30%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Charging Beam", effect: "Beam charges for 1s before firing, DMG +100%", tier: 1, color: "green" },
        { name: "Refracted Beam", effect: "Beam splits into 2 smaller beams after hitting an enemy", tier: 1, color: "green" },
        { name: "Charged Burst", effect: "Charging time +0.5s, DMG +150%", tier: 2, color: "green", requires_chain: "Charging Beam" },
        { name: "Refraction Enhancement", effect: "Refracted beams split into 2 more mini beams", tier: 2, color: "green", requires_chain: "Refracted Beam" },
        { name: "Overcharged Beam", effect: "Charging time +1s, DMG +300%, beam width +100%", tier: 3, color: "green", requires_chain: "Charged Burst" },
        { name: "Refraction Mastery", effect: "All refracted beams deal full DMG", tier: 3, color: "green", requires_chain: "Refraction Enhancement" }
      ],
      combo: [
        { name: "Conductive Beam", effect: "Beam applies [Conductive] effect to enemies for 3s", tier: 2, color: "green", requires_turret: "thunderbolt" },
        { name: "Energy Synergy", effect: "Beam DMG +50% against enemies affected by Laser", tier: 2, color: "green", requires_turret: "laser" },
        { name: "Gravitational Lens", effect: "Beam bends toward nearby enemies after hitting a target", tier: 3, color: "green", requires_turret: "gravity_vortex_gun" },
        { name: "Spinning Energy", effect: "Beam creates a spinning energy disk on hit that damages nearby enemies", tier: 3, color: "green", requires_turret: "laser" }
      ],
      breakthrough: [
        { name: "Energy Overload", effect: "Beam has a 20% chance to deal double DMG", tier: 1, color: "purple" },
        { name: "Penetrating Beam", effect: "Beam penetration +2", tier: 1, color: "purple" },
        { name: "Beam Mastery", effect: "Beam width +50%, DMG +30%", tier: 2, color: "purple" },
        { name: "Focused Energy", effect: "Beam DMG increases the longer it hits the same target (MAX: +200%)", tier: 2, color: "purple" }
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
        { name: "Duration Extension", effect: "Firewheel Drone duration +30%", tier: 1, color: "green", max_copies: 3 },
        { name: "Firewheel Boost", effect: "Firewheel Drone DMG +50%", tier: 1, color: "green", max_copies: 3 },
        { name: "Size Boost", effect: "Firewheel Drone size +25%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Flame Trail", effect: "Firewheel Drone leaves a Flame Trail for 2s during flight", tier: 1, color: "green" },
        { name: "Mini Drones", effect: "Firewheel Drone summons 2 Mini Firewheel Drones every 3s", tier: 1, color: "green" },
        { name: "Blazing Trail", effect: "Flame Trail DMG +60%", tier: 2, color: "green", requires_chain: "Flame Trail" },
        { name: "Killing Array", effect: "For every 2 enemies directly killed by Firewheel Drone, summon 2 Mini Firewheel Drones", tier: 2, color: "green", requires_chain: "Mini Drones" },
        { name: "Extended Trail", effect: "Flame Trail duration +2s", tier: 3, color: "green", requires_chain: "Blazing Trail" },
        { name: "Mini Size Boost", effect: "Mini Firewheel Drone DMG +50%, duration +50%", tier: 3, color: "green", requires_chain: "Killing Array" }
      ],
      combo: [
        { name: "Firewheel Ignition", effect: "Firewheel Drone has a 20% chance to inflict [Burning] effect", tier: 2, color: "green", requires_turret: "sky_guard" },
        { name: "Vortex Firewheel", effect: "Firewheel Drone creates a pull effect around it", tier: 2, color: "green", requires_turret: "gravity_vortex_gun" },
        { name: "Extra Barrage", effect: "For every 15 hits dealt by Firewheel Drone, launch 1 ring of penetrating bullets", tier: 3, color: "green", requires_turret: "aeroblast" }
      ],
      breakthrough: [
        { name: "Hold the Ground", effect: "Firewheel Drone stays for an additional 10s after it ends", tier: 1, color: "purple" },
        { name: "Smart Acceleration", effect: "Firewheel Drone DMG +60%, speed +80% when not dealing damage to enemies", tier: 1, color: "purple" },
        { name: "Combo Boost", effect: "For every 20 hits dealt by Firewheel Drone, Firewheel Drone DMG +20% (MAX: +200%)", tier: 2, color: "purple" },
        { name: "Killing Charge", effect: "For every 2 enemies directly killed by Firewheel Drone, Firewheel Drone CD -0.5s (MAX: 5s)", tier: 2, color: "purple" }
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
        { name: "Dense Swarm", effect: "Wasps +2, DMG -15%", tier: 1, color: "green", max_copies: 3 },
        { name: "Rapid Barrage", effect: "Wasps attack count +2", tier: 1, color: "green", max_copies: 3 },
        { name: "Swarm Assault", effect: "Wasps DMG +50%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Contact Pulse", effect: "Wasp Releases 1 Pulse Wave on first hit", tier: 1, color: "green" },
        { name: "Swarm Echo", effect: "Wasps spawn 1 Echo Wasp I on kill (Max: 1)", tier: 1, color: "green" },
        { name: "Amplified Pulse", effect: "Pulse Wave DMG range +30% and inflicts [Slow] effect on hit", tier: 2, color: "green", requires_chain: "Contact Pulse" },
        { name: "Echo Upgrade II", effect: "Evolves echoes to Echo Wasp II", tier: 2, color: "green", requires_chain: "Swarm Echo" },
        { name: "Final Resonance", effect: "Wasp releases 1 Pulse Wave when it ends", tier: 2, color: "green", requires_chain: "Contact Pulse" },
        { name: "Echo Upgrade III", effect: "Evolves echoes to Echo Wasp III", tier: 3, color: "green", requires_chain: "Echo Upgrade II" }
      ],
      combo: [
        { name: "Electro-Wasps", effect: "Each Wasp attack has a 50% chance to release a High-voltage shock at enemies in close range", tier: 2, color: "green", requires_turret: "teslacoil" },
        { name: "Projectile Fission", effect: "Wasps split into 7 sub-projectiles on hit", tier: 2, color: "green", requires_turret: null },
        { name: "Swarm Fury", effect: "Wasps +30% DMG after each attack", tier: 3, color: "green", requires_turret: "laser" }
      ],
      breakthrough: [
        { name: "Hive Mutation II", effect: "Hive launches Wasp II after 2 volleys", tier: 1, color: "purple" },
        { name: "Wasp Evolution II", effect: "Wasp I evolves to II after 3 attacks", tier: 1, color: "purple" },
        { name: "Hive Mutation III", effect: "Hive has a 50% chance to launch Wasp III after 2 volleys", tier: 2, color: "purple" },
        { name: "Wasp Evolution III", effect: "Wasp II evolves to III after 3 attacks", tier: 2, color: "purple" },
        { name: "Wasp Retrieval", effect: "Wasps have a 50% chance to return to Hive when destroyed", tier: 2, color: "purple" }
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
        { name: "Ammo Boost", effect: "Railgun Shell DMG +50%", tier: 1, color: "green", max_copies: 3 },
        { name: "Railgun Upgrade", effect: "Railgun Shell DMG +30%, Penetration +1", tier: 1, color: "green", max_copies: 3 },
        { name: "Shell Salvo", effect: "Railgun Shell +1, DMG -15%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Explosive Shells", effect: "Railgun Shell explodes on hit", tier: 1, color: "green" },
        { name: "Piercing Mark", effect: "Upon hitting the first enemy, Railgun Shell splits into 2 Small Railgun Shells, with a 20% chance to split into 2 more", tier: 1, color: "green" },
        { name: "Impact Boost", effect: "Railgun Shell explosion DMG +30% for each penetration", tier: 2, color: "green", requires_chain: "Explosive Shells" },
        { name: "Impact Spread", effect: "Railgun Shell explosion range +20% for each penetration", tier: 2, color: "green", requires_chain: "Explosive Shells" },
        { name: "Piercing Enhancement", effect: "Upon hitting the first enemy, Small Railgun Shell splits into 2 Mini Railgun Shells, with a 20% chance to split into 2 more", tier: 2, color: "green", requires_chain: "Piercing Mark" },
        { name: "Split Mastery", effect: "All Railgun shells' split chance +40%", tier: 3, color: "green", requires_chain: "Piercing Enhancement" }
      ],
      combo: [
        { name: "Piercing Mark", effect: "Enemies hit by all Railgun shells receive [Physical Vulnerable] effect", tier: 2, color: "green", requires_turret: null },
        { name: "Piercing Ricochet", effect: "All Railgun shells penetration +1, reflection +1 (Unlock at Lv.18)", tier: 3, color: "green", requires_turret: "firewheel_drone" },
        { name: "Secondary Minefield", effect: "Railgun Shell releases 1 Floating Mine on hit", tier: 3, color: "green", requires_turret: "aeroblast" }
      ],
      breakthrough: [
        { name: "Power Penetration", effect: "Railgun Shell penetration +3, knockback +100%", tier: 1, color: "purple" },
        { name: "Weak Spot Strike", effect: "Railgun Shell DMG increases with target HP (MAX: 150%)", tier: 1, color: "purple" },
        { name: "Execution Penetration", effect: "Railgun Shell penetration +1 on kill (MAX: +5)", tier: 2, color: "purple" },
        { name: "Shell Crit Boost", effect: "All Railgun Shells DMG +40%, Crit Rate +30%", tier: 2, color: "purple" }
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
        { name: "Electro Acceleration", effect: "Teslacoil cooldown speed +30%", tier: 1, color: "green", max_copies: 3 },
        { name: "Electro Boost", effect: "Teslacoil DMG +50%", tier: 1, color: "green", max_copies: 3 },
        { name: "Electro Chain", effect: "Teslacoil bounces +1, DMG -15%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Charge Expansion", effect: "Teslacoil charge time +0.5s, DMG range increases with charge time", tier: 1, color: "green" },
        { name: "Trap Matrix", effect: "Teslacoil releases Electric Matrix with additional DMG and [Slow] effect for 2s in explosion area", tier: 1, color: "green" },
        { name: "Charge Destruction", effect: "Teslacoil charge time +0.5s, DMG increases with charge time", tier: 2, color: "green", requires_chain: "Charge Expansion" },
        { name: "Enhanced Matrix", effect: "Electric Matrix DMG +100%, duration +1s", tier: 2, color: "green", requires_chain: "Trap Matrix" },
        { name: "Charge Delayed", effect: "Charge time +1s", tier: 3, color: "green", requires_chain: "Charge Destruction" },
        { name: "Matrix Thunderbolt", effect: "Electro Matrix has a 30% chance to release a stationary Small Thunderbolt for 5s", tier: 3, color: "green", requires_chain: "Enhanced Matrix" }
      ],
      combo: [
        { name: "Cooperative Beam", effect: "During charging, Teslacoil releases 2 Refracted Beams", tier: 2, color: "green", requires_turret: "beam" },
        { name: "Electric Enhancement", effect: "All Electric DMG +80%", tier: 2, color: "green", requires_turret: "thunderbolt" },
        { name: "Spinning Laser", effect: "Teslacoil releases 1 Spinning Laser on hit", tier: 3, color: "green", requires_turret: "laser" }
      ],
      breakthrough: [
        { name: "Electric Chain Surge", effect: "Teslacoil releases up to 5 high-energy electric shocks on hit to nearby enemies", tier: 1, color: "purple" },
        { name: "Electro Interference", effect: "Teslacoil Explosion range +30%, Railgun Explosion and Electro Matrix inflict [Paralyze] effect", tier: 1, color: "purple" },
        { name: "Charged Shock", effect: "During the Teslacoil charging time, it releases up to 2 high-energy electric shocks to nearby enemies every 0.25s", tier: 2, color: "purple" },
        { name: "Expanded Shockwave", effect: "Teslacoil explosion range increased, outer DMG halved", tier: 2, color: "purple" }
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
        { name: "Extended Field", effect: "Gravitational Field flight distance +30%", tier: 1, color: "green", max_copies: 3 },
        { name: "High Power Field", effect: "Gravitational Field DMG +50%", tier: 1, color: "green", max_copies: 3 },
        { name: "Wide Field", effect: "Gravitational Field range +25%", tier: 1, color: "green", max_copies: 3 }
      ],
      chain: [
        { name: "Small Black Hole", effect: "Creates a small black hole continuously pulling enemies for 5s after the Gravitational Field disappears", tier: 1, color: "green" },
        { name: "Static Wormhole", effect: "When Gravitational Field hits enemy, a portal is created to teleport enemies to the location where the field disappears for 3s", tier: 1, color: "green" },
        { name: "Black Hole Expansion", effect: "Small Black Hole range +50%, pulling force +50%", tier: 2, color: "green", requires_chain: "Small Black Hole" },
        { name: "Wormhole Enhancement", effect: "Portal duration (entrance and exit) +100%", tier: 2, color: "green", requires_chain: "Static Wormhole" },
        { name: "Wormhole Expansion", effect: "Portal entry range +100%", tier: 2, color: "green", requires_chain: "Static Wormhole" },
        { name: "Destructive Black Hole", effect: "Small Black Hole DMG +250%", tier: 3, color: "green", requires_chain: "Black Hole Expansion" }
      ],
      combo: [
        { name: "Field Reflection", effect: "All Gravitational Fields can reflect", tier: 2, color: "green", requires_turret: "firewheel_drone" },
        { name: "Double Fission", effect: "Gravitational Field splits into two small Gravitational Fields at the end", tier: 3, color: "green", requires_turret: "railgun" },
        { name: "Field Disruption", effect: "Gravitational Field inflicts [Disruption] effect on hit", tier: 3, color: "green", requires_turret: "disruption_drone" }
      ],
      breakthrough: [
        { name: "Extended Pull", effect: "The further the Gravitational Field flies, the larger the range", tier: 1, color: "purple" },
        { name: "Field Amplification", effect: "Gravitational Field DMG +80%, pulling force +100%", tier: 1, color: "purple" },
        { name: "Extended Range", effect: "Gravitational Field flight distance doubled", tier: 2, color: "purple" },
        { name: "Extra Field", effect: "Gravitational Field +1", tier: 2, color: "purple" }
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

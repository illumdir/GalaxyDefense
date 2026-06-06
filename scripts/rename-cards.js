/**
 * Renommage des images de cartes suite à la mise à jour v0.15.4
 * Usage: node scripts/rename-cards.js
 */

const fs   = require("fs");
const path = require("path");

const CARDS_DIR = path.join(__dirname, "..", "images", "cards");

const RENAMES = [
  // aeroblast
  ["aeroblast/shell_boost.png",          "aeroblast/powerful_blast.png"],
  ["aeroblast/shell_volley.png",         "aeroblast/multiple_blast.png"],
  ["aeroblast/shell_knockback.png",      "aeroblast/impact_enhancement.png"],

  // thunderbolt
  ["thunderbolt/thunderbolt_volley.png", "thunderbolt/continuous_strike.png"],
  ["thunderbolt/thunderbolt_speed.png",  "thunderbolt/swift_strike.png"],
  ["thunderbolt/thunderbolt_boost.png",  "thunderbolt/lightning_boost.png"],
  ["thunderbolt/thunder_chain.png",      "thunderbolt/paralysis_chain.png"],

  // laser
  ["laser/laser_boost.png",              "laser/laser_amplification.png"],
  ["laser/laser_duration.png",           "laser/stable_energy.png"],
  ["laser/tear_explosions.png",          "laser/tear_explosion.png"],

  // disruption_drone
  ["disruption_drone/disruption_boost.png",    "disruption_drone/field_amplification.png"],
  ["disruption_drone/disruption_duration.png", "disruption_drone/field_duration.png"],
  ["disruption_drone/disruption_range.png",    "disruption_drone/field_expansion.png"],

  // firewheel_drone
  ["firewheel_drone/firewheel_size.png",     "firewheel_drone/size_boost.png"],
  ["firewheel_drone/firewheel_duration.png", "firewheel_drone/duration_extension.png"],

  // hive
  ["hive/wasps_boost.png",       "hive/swarm_assault.png"],
  ["hive/wasps_count.png",       "hive/rapid_barrage.png"],
  ["hive/wasps_volley.png",      "hive/dense_swarm.png"],
  ["hive/wasp_evolution_2.png",  "hive/wasp_evolution_ii.png"],
  ["hive/hive_mutation_2.png",   "hive/hive_mutation_ii.png"],
  ["hive/wasp_evolution_3.png",  "hive/wasp_evolution_iii.png"],
  ["hive/hive_mutation_3.png",   "hive/hive_mutation_iii.png"],
  ["hive/volley_wasp.png",       "hive/projectile_fission.png"],

  // railgun
  ["railgun/shell_boost.png",          "railgun/ammo_boost.png"],
  ["railgun/shell_volley.png",         "railgun/shell_salvo.png"],
  ["railgun/shell_penetration.png",    "railgun/railgun_upgrade.png"],
  ["railgun/shell_critical_boost.png", "railgun/shell_crit_boost.png"],

  // teslacoil — ordre critique : expanded_shockwave en premier
  ["teslacoil/electro_interference.png", "teslacoil/expanded_shockwave.png"],
  ["teslacoil/surge.png",                "teslacoil/electro_interference.png"],
  ["teslacoil/teslacoil_boost.png",      "teslacoil/electro_boost.png"],
  ["teslacoil/teslacoil_bounce.png",     "teslacoil/electro_chain.png"],
  ["teslacoil/teslacoil_speed.png",      "teslacoil/electro_acceleration.png"],
  ["teslacoil/electric_chain.png",       "teslacoil/electric_chain_surge.png"],

  // gravity_vortex_gun
  ["gravity_vortex_gun/field_boost.png",    "gravity_vortex_gun/high_power_field.png"],
  ["gravity_vortex_gun/field_range.png",    "gravity_vortex_gun/wide_field.png"],
  ["gravity_vortex_gun/field_distance.png", "gravity_vortex_gun/extended_field.png"],
];

let ok = 0, skipped = 0, errors = 0;

for (const [from, to] of RENAMES) {
  const src  = path.join(CARDS_DIR, from);
  const dest = path.join(CARDS_DIR, to);
  if (!fs.existsSync(src)) {
    console.log(`  ⏭️  Introuvable (déjà renommé ?) : ${from}`);
    skipped++;
    continue;
  }
  if (fs.existsSync(dest)) {
    console.log(`  ⏭️  Destination existe déjà : ${to}`);
    skipped++;
    continue;
  }
  try {
    fs.renameSync(src, dest);
    console.log(`  ✅ ${from.padEnd(50)} → ${to.split("/")[1]}`);
    ok++;
  } catch (e) {
    console.error(`  ❌ ${from} : ${e.message}`);
    errors++;
  }
}

console.log(`\nTerminé : ${ok} renommés, ${skipped} ignorés, ${errors} erreurs.`);

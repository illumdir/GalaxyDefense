/**
 * Script de téléchargement et découpe des images de cartes
 * Galaxy Defense - Fortress TD
 *
 * Usage: node scripts/download-cards.js
 * Prérequis: npm install
 *
 * Ce script :
 * 1. Interroge l'API du wiki pour obtenir les URLs CDN de chaque image composite
 * 2. Télécharge chaque image
 * 3. Découpe horizontalement en cartes individuelles (2 ou 3 colonnes)
 * 4. Sauvegarde dans images/cards/{turret_id}/{card_slug}.png
 */

const Jimp = require("jimp");
const https = require("https");
const fs   = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION : metadata de toutes les images composites à découper
// ─────────────────────────────────────────────────────────────────────────────

const TURRET_CARDS_META = [
  {
    turretId: "sky_guard",
    wikiPrefix: "Sky Guard",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Volley Missile", "Sky Guard Boost", "Explosion Spread"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Ignition", "Impact Reinforcement"] },
      { type: "Chain Cards T2",       cols: 3, cards: ["Ignition Amplification", "Missile Amplification", "Chain Reaction"] },
      { type: "Chain Cards T3",       cols: 1, cards: ["Death Ignition"] },
      { type: "Combo Cards",          cols: 3, cards: ["Collapse Explosion", "Detonation Thunderbolt", "Path Strike"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["Burning Area", "Impact Multiplier"] },
      { type: "Breakthrough Cards T2",cols: 2, cards: ["Strong Impact", "Close-range Explosion"] },
      { type: "Breakthrough Cards T3",cols: 1, cards: ["Fire Transmission"] },
    ]
  },
  {
    turretId: "laser",
    wikiPrefix: "Laser",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Laser Amplification", "Stable Energy", "Laser Reflection"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Additional Sweep", "Energy Surge"] },
      { type: "Chain Cards T2",       cols: 2, cards: ["Vulnerable Laser", "Slow Laser"] },
      { type: "Chain Cards T3",       cols: 2, cards: ["Sweep Boost", "Deflected Laser Reflection"] },
      { type: "Combo Cards",          cols: 3, cards: ["Energy Paralysis", "Energy Detonation", "Convergence Trigger"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["High-Energy Pulse", "Multi-Strike"] },
      { type: "Breakthrough Cards T2",cols: 3, cards: ["Energy Overload", "Tear Explosion", "Energy Boost"] },
    ]
  },
  {
    turretId: "disruption_drone",
    wikiPrefix: "Disruption Drone",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Field Amplification", "Field Duration", "Field Expansion"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Random Disturbance", "Disruption Force"] },
      { type: "Chain Cards T2",       cols: 2, cards: ["Rewind Teleport", "Disruption Burst"] },
      { type: "Chain Cards T3",       cols: 2, cards: ["Teleport Damage", "Area Disruption"] },
      { type: "Combo Cards",          cols: 4, cards: ["Small Laser", "Electric Field", "Fortress Support", "Field Replication"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["Final Blast", "Stasis Field"] },
      { type: "Breakthrough Cards T2",cols: 2, cards: ["Quick Cooldown", "Field Suppression"] },
      { type: "Breakthrough Cards T3",cols: 1, cards: ["Converging Field"] },
    ]
  },
  {
    turretId: "aeroblast",
    wikiPrefix: "Aeroblast",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Powerful Blast", "Multiple Blast", "Impact Enhancement"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Shotgun Barrage", "Floating Mine"] },
      { type: "Chain Cards T2",       cols: 3, cards: ["Extra Loading", "Wide Minefield", "Mine Shockwave"] },
      { type: "Chain Cards T3",       cols: 1, cards: ["Shotgun Penetration"] },
      { type: "Combo Cards",          cols: 3, cards: ["Piercing Blast", "Firewheel Summon", "Gravity Bomb"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["Massive Explosion", "Central Blast"] },
      { type: "Breakthrough Cards T2",cols: 2, cards: ["Chain Explosion", "Range Extension"] },
      { type: "Breakthrough Cards T3",cols: 1, cards: ["Secondary Explosion"] },
    ]
  },
  {
    turretId: "thunderbolt",
    wikiPrefix: "Thunderbolt",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Continuous Strike", "Swift Strike", "Lightning Boost"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Chain Lightning", "Lightning Paralysis"] },
      { type: "Chain Cards T2",       cols: 3, cards: ["Chain Expansion", "Paralysis Extension", "Paralyzing Shock"] },
      { type: "Chain Cards T3",       cols: 2, cards: ["Chain Interference", "Life Erosion"] },
      { type: "Combo Cards",          cols: 3, cards: ["Lightning Aftershock", "Lightning Trail", "Lightning Teleportation"] },
      { type: "Breakthrough Cards T1",cols: 3, cards: ["Lightning Expansion", "Slaughtering Lightning", "Paralysis Chain"] },
      { type: "Breakthrough Cards T2",cols: 2, cards: ["Extra Strike", "Chain Strike"] },
    ]
  },
  {
    turretId: "beam",
    wikiPrefix: "Beam",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Beam Amplifier", "Beam Acceleration", "Beam Expansion"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Refracted Beam", "Charging Beam"] },
      { type: "Chain Cards T2",       cols: 2, cards: ["Refraction Enhancement", "Charged Burst"] },
      { type: "Chain Cards T3",       cols: 2, cards: ["Refraction Mastery", "Overcharged Beam"] },
      { type: "Combo Cards",          cols: 4, cards: ["Energy Synergy", "Conductive Beam", "Spinning Energy", "Gravitational Lens"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["Penetrating Beam", "Energy Overload"] },
      { type: "Breakthrough Cards T2",cols: 2, cards: ["Beam Mastery", "Focused Energy"] },
    ]
  },
  {
    turretId: "firewheel_drone",
    wikiPrefix: "Firewheel",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Firewheel Boost", "Size Boost", "Duration Extension"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Mini Drones", "Flame Trail"] },
      { type: "Chain Cards T2",       cols: 2, cards: ["Killing Array", "Blazing Trail"] },
      { type: "Chain Cards T3",       cols: 2, cards: ["Mini Size Boost", "Extended Trail"] },
      { type: "Combo Cards",          cols: 3, cards: ["Firewheel Ignition", "Vortex Firewheel", "Extra Barrage"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["Smart Acceleration", "Hold the Ground"] },
      { type: "Breakthrough Cards T2",cols: 2, cards: ["Killing Charge", "Combo Boost"] },
      { type: "Breakthrough Cards T3",cols: 1, cards: ["Blazing Overflow"] },
    ]
  },
  {
    turretId: "hive",
    wikiPrefix: "Hive",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Swarm Assault", "Rapid Barrage", "Dense Swarm"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Swarm Echo", "Contact Pulse"] },
      { type: "Chain Cards T2",       cols: 3, cards: ["Echo Upgrade II", "Final Resonance", "Amplified Pulse"] },
      { type: "Chain Cards T3",       cols: 1, cards: ["Echo Upgrade III"] },
      { type: "Combo Cards",          cols: 3, cards: ["Electro-Wasps", "Projectile Fission", "Swarm Fury"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["Wasp Evolution II", "Hive Mutation II"] },
      { type: "Breakthrough Cards T2",cols: 3, cards: ["Wasp Evolution III", "Wasp Retrieval", "Hive Mutation III"] },
    ]
  },
  {
    turretId: "railgun",
    wikiPrefix: "Railgun",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Ammo Boost", "Shell Salvo", "Railgun Upgrade"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Basic Split", "Explosive Shells"] },
      { type: "Chain Cards T2",       cols: 3, cards: ["Piercing Enhancement", "Impact Spread", "Impact Boost"] },
      { type: "Chain Cards T3",       cols: 1, cards: ["Split Mastery"] },
      { type: "Combo Cards",          cols: 3, cards: ["Piercing Mark", "Secondary Minefield", "Piercing Ricochet"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["Power Penetration", "Weak Spot Strike"] },
      { type: "Breakthrough Cards T2",cols: 2, cards: ["Shell Crit Boost", "Execution Penetration"] },
      { type: "Breakthrough Cards T3",cols: 1, cards: ["Rail Overcharge"] },
    ]
  },
  {
    turretId: "teslacoil",
    wikiPrefix: "Teslacoil",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["Electro Boost", "Electro Chain", "Electro Acceleration"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Charge Expansion", "Trap Matrix"] },
      { type: "Chain Cards T2",       cols: 1, cards: ["Enhanced Matrix"] },
      { type: "Chain Cards T3",       cols: 3, cards: ["Charge Destruction", "Charge Delayed", "Matrix Thunderbolt"] },
      { type: "Combo Cards",          cols: 3, cards: ["Electric Enhancement", "Cooperative Beam", "Spinning Laser"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["Electric Chain Surge", "Electro Interference"] },
      { type: "Breakthrough Cards T2",cols: 2, cards: ["Expanded Shockwave", "Charged Shock"] },
    ]
  },
  {
    turretId: "gravity_vortex_gun",
    wikiPrefix: "Gravity Vortex",
    images: [
      { type: "Normal Cards",         cols: 3, cards: ["High Power Field", "Wide Field", "Extended Field"] },
      { type: "Chain Cards T1",       cols: 2, cards: ["Small Black Hole", "Static Wormhole"] },
      { type: "Chain Cards T2",       cols: 3, cards: ["Black Hole Expansion", "Wormhole Enhancement", "Wormhole Expansion"] },
      { type: "Chain Cards T3",       cols: 1, cards: ["Destructive Black Hole"] },
      { type: "Combo Cards",          cols: 3, cards: ["Field Reflection", "Double Fission", "Field Disruption"] },
      { type: "Breakthrough Cards T1",cols: 2, cards: ["Extended Pull", "Field Amplification"] },
      { type: "Breakthrough Cards T2",cols: 2, cards: ["Extra Field", "Extended Range"] },
      { type: "Breakthrough Cards T3",cols: 1, cards: ["Gravity Overload"] },
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    https.get(url, { headers: { "User-Agent": "GalaxyDefenseBuilder/1.0" } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function fetchWikiImageUrls(fileNames) {
  const BATCH = 50;
  const result = {};
  for (let i = 0; i < fileNames.length; i += BATCH) {
    const batch = fileNames.slice(i, i + BATCH);
    const titles = batch.map(f => `File:${f}`).join("|");
    const apiUrl = `https://official-galaxy-defense-ftd-wiki.fandom.com/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&format=json`;
    const buf = await httpsGet(apiUrl);
    const json = JSON.parse(buf.toString("utf8"));
    for (const page of Object.values(json.query.pages)) {
      if (page.imageinfo && page.imageinfo[0]) {
        const title = page.title.replace(/^File:/, "");
        result[title] = page.imageinfo[0].url;
      }
    }
    // Petite pause pour ne pas spammer l'API
    await new Promise(r => setTimeout(r, 200));
  }
  return result;
}

async function cropCard(imageBuffer, colIndex, totalCols) {
  const img = await Jimp.read(imageBuffer);
  const cardWidth  = Math.floor(img.getWidth() / totalCols);
  const cardHeight = img.getHeight();
  const x = colIndex * cardWidth;
  return img.clone().crop(x, 0, cardWidth, cardHeight);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const OUTPUT_DIR = path.join(__dirname, "..", "images", "cards");

  // Collecte de tous les noms de fichiers à requêter
  const allFileNames = [];
  for (const turret of TURRET_CARDS_META) {
    for (const img of turret.images) {
      allFileNames.push(`${turret.wikiPrefix} ${img.type}.png`);
    }
  }

  console.log(`📋 ${allFileNames.length} images composites à récupérer…`);

  // Récupération des URLs via l'API du wiki
  console.log("🌐 Interrogation de l'API du wiki…");
  const urlMap = await fetchWikiImageUrls(allFileNames);
  console.log(`✅ ${Object.keys(urlMap).length} URLs trouvées`);

  let cardCount = 0;
  let errorCount = 0;

  for (const turret of TURRET_CARDS_META) {
    const turretDir = path.join(OUTPUT_DIR, turret.turretId);
    fs.mkdirSync(turretDir, { recursive: true });

    for (const imgMeta of turret.images) {
      const fileName = `${turret.wikiPrefix} ${imgMeta.type}.png`;
      const url = urlMap[fileName];

      if (!url) {
        console.warn(`  ⚠️  URL introuvable : ${fileName}`);
        errorCount++;
        continue;
      }

      console.log(`  ⬇️  ${fileName} (${imgMeta.cols} colonnes)`);

      let imageBuffer;
      try {
        imageBuffer = await httpsGet(url);
      } catch (e) {
        console.error(`  ❌ Erreur téléchargement ${fileName}: ${e.message}`);
        errorCount++;
        continue;
      }

      // Découpe chaque carte
      for (let col = 0; col < imgMeta.cols; col++) {
        const cardName = imgMeta.cards[col];
        if (!cardName) {
          console.warn(`    ⚠️  Pas de nom pour colonne ${col} de ${fileName}`);
          continue;
        }

        const outFile = path.join(turretDir, `${slugify(cardName)}.png`);

        // Skip si déjà généré
        if (fs.existsSync(outFile)) {
          console.log(`    ⏭️  Déjà existant : ${slugify(cardName)}.png`);
          cardCount++;
          continue;
        }

        try {
          let cropped;
          if (imgMeta.cols === 1) {
            // Image entière = 1 seule carte
            cropped = await Jimp.read(imageBuffer);
          } else {
            cropped = await cropCard(imageBuffer, col, imgMeta.cols);
          }
          await cropped.writeAsync(outFile);
          console.log(`    ✅ ${slugify(cardName)}.png`);
          cardCount++;
        } catch (e) {
          console.error(`    ❌ Erreur découpe ${cardName}: ${e.message}`);
          errorCount++;
        }
      }
    }
  }

  console.log(`\n🎉 Terminé ! ${cardCount} images de cartes générées, ${errorCount} erreurs.`);
  console.log(`📁 Images sauvegardées dans : ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});

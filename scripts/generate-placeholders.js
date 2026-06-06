/**
 * Génère des images placeholder pour les cartes dont l'image est manquante.
 * Fond sombre + nom de la carte en blanc — 512×861 px (même format que les vraies cartes).
 * Usage: node scripts/generate-placeholders.js
 */

const Jimp = require("jimp");
const fs   = require("fs");
const path = require("path");

// ─── Cartes manquantes ────────────────────────────────────────────────────────

const MISSING = [
  { turretId: "sky_guard",         card: "Fire Transmission" },
  { turretId: "laser",             card: "Energy Boost" },
  { turretId: "aeroblast",         card: "Secondary Explosion" },
  { turretId: "thunderbolt",       card: "Chain Strike" },
  // Beam — refonte complète v0.15.4
  { turretId: "beam",              card: "Beam Amplifier" },
  { turretId: "beam",              card: "Beam Acceleration" },
  { turretId: "beam",              card: "Beam Expansion" },
  { turretId: "beam",              card: "Refracted Beam" },
  { turretId: "beam",              card: "Charging Beam" },
  { turretId: "beam",              card: "Refraction Enhancement" },
  { turretId: "beam",              card: "Charged Burst" },
  { turretId: "beam",              card: "Refraction Mastery" },
  { turretId: "beam",              card: "Overcharged Beam" },
  { turretId: "beam",              card: "Energy Synergy" },
  { turretId: "beam",              card: "Conductive Beam" },
  { turretId: "beam",              card: "Spinning Energy" },
  { turretId: "beam",              card: "Gravitational Lens" },
  { turretId: "beam",              card: "Penetrating Beam" },
  { turretId: "beam",              card: "Energy Overload" },
  { turretId: "beam",              card: "Beam Mastery" },
  { turretId: "beam",              card: "Focused Energy" },
  { turretId: "firewheel_drone",   card: "Blazing Overflow" },
  { turretId: "railgun",           card: "Rail Overcharge" },
  { turretId: "teslacoil",         card: "Electric Enhancement" },
  { turretId: "teslacoil",         card: "Charged Shock" },
  { turretId: "gravity_vortex_gun",card: "Gravity Overload" },
];

// ─── Config visuelle ──────────────────────────────────────────────────────────

const W = 512;
const H = 861;
const BG_COLOR  = 0x1a1f2eff;  // bleu-gris foncé
const BDR_COLOR = 0xd97706ff;  // ambre (signal "placeholder")
const BDR_SIZE  = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function turretLabel(id) {
  return id.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Wrap text to fit within maxWidth using printText measurements
function wrapText(font, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (Jimp.measureText(font, test) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const CARDS_DIR = path.join(__dirname, "..", "images", "cards");

  const [fontLarge, fontSmall] = await Promise.all([
    Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
    Jimp.loadFont(Jimp.FONT_SANS_16_WHITE),
  ]);

  let ok = 0, skipped = 0;

  for (const { turretId, card } of MISSING) {
    const outDir  = path.join(CARDS_DIR, turretId);
    const outFile = path.join(outDir, slugify(card) + ".png");

    if (fs.existsSync(outFile)) {
      console.log(`  ⏭️  Déjà existant : ${turretId}/${slugify(card)}.png`);
      skipped++;
      continue;
    }

    fs.mkdirSync(outDir, { recursive: true });

    const img = new Jimp(W, H, BG_COLOR);

    // Bordure ambre (signal placeholder)
    for (let x = 0; x < W; x++) {
      for (let b = 0; b < BDR_SIZE; b++) {
        img.setPixelColor(BDR_COLOR, x, b);
        img.setPixelColor(BDR_COLOR, x, H - 1 - b);
      }
    }
    for (let y = 0; y < H; y++) {
      for (let b = 0; b < BDR_SIZE; b++) {
        img.setPixelColor(BDR_COLOR, b, y);
        img.setPixelColor(BDR_COLOR, W - 1 - b, y);
      }
    }

    // Étiquette turret (petit, haut)
    const label = turretLabel(turretId);
    const labelW = Jimp.measureText(fontSmall, label);
    img.print(fontSmall, Math.floor((W - labelW) / 2), 40, label);

    // Nom de la carte (grand, centré verticalement)
    const maxTextW = W - 60;
    const lines = wrapText(fontLarge, card, maxTextW);
    const lineH  = Jimp.measureTextHeight(fontLarge, "Ag", maxTextW);
    const totalH = lines.length * lineH;
    let y = Math.floor((H - totalH) / 2);
    for (const line of lines) {
      const lw = Jimp.measureText(fontLarge, line);
      img.print(fontLarge, Math.floor((W - lw) / 2), y, line);
      y += lineH;
    }

    // Mention "PLACEHOLDER" en bas
    const ph = "PLACEHOLDER";
    const phW = Jimp.measureText(fontSmall, ph);
    img.print(fontSmall, Math.floor((W - phW) / 2), H - 40, ph);

    await img.writeAsync(outFile);
    console.log(`  ✅ ${turretId}/${slugify(card)}.png`);
    ok++;
  }

  console.log(`\nTerminé : ${ok} générés, ${skipped} ignorés.`);
}

main().catch(err => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});

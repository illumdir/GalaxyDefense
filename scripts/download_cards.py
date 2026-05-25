"""
Script de téléchargement et découpe des images de cartes
Galaxy Defense - Fortress TD

Usage: python scripts/download_cards.py
Prérequis: pip install Pillow requests  (déjà installés)

Ce script :
1. Interroge l'API wiki pour obtenir les URLs CDN de chaque image composite
2. Télécharge chaque image
3. Découpe horizontalement en cartes individuelles (auto-détection : largeur/512)
4. Sauvegarde dans images/cards/{turret_id}/{card_slug}.png
"""

import os
import re
import json
import time
import requests
from io import BytesIO
from PIL import Image

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION : metadata de toutes les images composites à découper
# Règle de découpe : chaque carte = 512px de large → cols = width // 512
# ─────────────────────────────────────────────────────────────────────────────

TURRET_CARDS_META = [
    {
        "turretId": "sky_guard",
        "wikiPrefix": "Sky Guard",
        "images": [
            {"type": "Normal Cards",          "cards": ["Volley Missile", "Sky Guard Boost", "Explosion Spread"]},
            {"type": "Chain Cards T1",         "cards": ["Ignition", "Impact Reinforcement"]},
            {"type": "Chain Cards T2",         "cards": ["Ignition Amplification", "Missile Amplification", "Thermal Warhead"]},
            {"type": "Chain Cards T3",         "cards": ["Death Ignition", "Chain Reaction"]},
            {"type": "Combo Cards",            "cards": ["Collapse Explosion", "Detonation Thunderbolt", "Path Strike"]},
            {"type": "Breakthrough Cards T1",  "cards": ["Burning Area", "Impact Multiplier"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Strong Impact", "Close-range Explosion"]},
        ]
    },
    {
        "turretId": "laser",
        "wikiPrefix": "Laser",
        "images": [
            {"type": "Normal Cards",          "cards": ["Laser Boost", "Laser Duration", "Laser Reflection"]},
            {"type": "Chain Cards T1",         "cards": ["Additional Sweep", "Energy Surge"]},
            {"type": "Chain Cards T2",         "cards": ["Vulnerable Laser", "Slow Laser"]},
            {"type": "Chain Cards T3",         "cards": ["Sweep Boost", "Deflected Laser Reflection"]},
            {"type": "Combo Cards",            "cards": ["Energy Paralysis", "Graviton Laser", "Energy Detonation", "Convergence Trigger"]},
            {"type": "Breakthrough Cards T1",  "cards": ["High-Energy Pulse", "Multi-Strike"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Energy Overload", "Tear Explosions"]},
        ]
    },
    {
        "turretId": "disruption_drone",
        "wikiPrefix": "Disruption Drone",
        "images": [
            {"type": "Normal Cards",          "cards": ["Disruption Boost", "Disruption Duration", "Disruption Range"]},
            {"type": "Chain Cards T1",         "cards": ["Random Disturbance", "Disruption Force"]},
            {"type": "Chain Cards T2",         "cards": ["Rewind Teleport", "Disruption Burst", "Overcharged Disruption"]},
            {"type": "Chain Cards T3",         "cards": ["Teleport Damage", "Area Disruption"]},
            {"type": "Combo Cards",            "cards": ["Small Laser", "Electric Field", "Fortress Support", "Field Replication"]},
            {"type": "Breakthrough Cards T1",  "cards": ["Final Blast", "Stasis Field"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Quick Cooldown", "Field Suppression"]},
            {"type": "Breakthrough Cards T3",  "cards": ["Converging Field"]},
        ]
    },
    {
        "turretId": "aeroblast",
        "wikiPrefix": "Aeroblast",
        "images": [
            {"type": "Normal Cards",          "cards": ["Shell Boost", "Shell Volley", "Shell Knockback"]},
            {"type": "Chain Cards T1",         "cards": ["Shotgun Barrage", "Floating Mine"]},
            {"type": "Chain Cards T2",         "cards": ["Extra Loading", "Wide Minefield", "Mine Shockwave"]},
            {"type": "Chain Cards T3",         "cards": ["Shotgun Penetration"]},
            {"type": "Combo Cards",            "cards": ["Piercing Blast", "Firewheel Summon", "Gravity Bomb", "Shatter Impact"]},
            {"type": "Breakthrough Cards T1",  "cards": ["Massive Explosion", "Central Blast"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Chain Explosion", "Range Extension"]},
        ]
    },
    {
        "turretId": "thunderbolt",
        "wikiPrefix": "Thunderbolt",
        "images": [
            {"type": "Normal Cards",          "cards": ["Thunderbolt Volley", "Thunderbolt Speed", "Thunderbolt Boost"]},
            {"type": "Chain Cards T1",         "cards": ["Chain Lightning", "Lightning Paralysis"]},
            {"type": "Chain Cards T2",         "cards": ["Chain Expansion", "Paralysis Extension", "Paralyzing Shock", "Chain Strike"]},
            {"type": "Chain Cards T3",         "cards": ["Chain Interference", "Life Erosion"]},
            {"type": "Combo Cards",            "cards": ["Lightning Aftershock", "Lightning Trail", "Lightning Teleportation"]},
            {"type": "Breakthrough Cards T1",  "cards": ["Lightning Expansion", "Slaughtering Lightning"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Extra Strike", "Thunder Chain"]},
        ]
    },
    {
        "turretId": "beam",
        "wikiPrefix": "Beam",
        "images": [
            {"type": "Normal Cards",          "cards": ["Beam Boost", "Beam Speed", "Beam Duration"]},
            {"type": "Chain Cards T1",         "cards": ["Damage Increase", "Beam Refraction"]},
            {"type": "Chain Cards T2",         "cards": ["Stacking Damage", "Refraction Pull"]},
            {"type": "Chain Cards T3",         "cards": ["Extreme Focus", "Refraction Explosion"]},
            {"type": "Combo Cards",            "cards": ["Target Explosion", "Disruptive Beam", "Matrix Resonance", "Beam Lightning"]},
            {"type": "Breakthrough Cards T1",  "cards": ["DMG Multiplier", "Beam Penetration"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Slaughtering Beam", "Extra Beam"]},
        ]
    },
    {
        "turretId": "firewheel_drone",
        "wikiPrefix": "Firewheel",
        "images": [
            {"type": "Normal Cards",          "cards": ["Firewheel Boost", "Firewheel Size", "Firewheel Duration"]},
            {"type": "Chain Cards T1",         "cards": ["Mini Drones", "Flame Trail"]},
            {"type": "Chain Cards T2",         "cards": ["Killing Array", "Blazing Trail"]},
            {"type": "Chain Cards T3",         "cards": ["Mini Size Boost", "Extended Trail"]},
            {"type": "Combo Cards",            "cards": ["Firewheel Ignition", "Vortex Firewheel", "Extra Barrage", "Blazing Pulse"]},
            {"type": "Breakthrough Cards T1",  "cards": ["Smart Acceleration", "Hold the Ground"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Killing Charge", "Combo Boost"]},
        ]
    },
    {
        "turretId": "hive",
        "wikiPrefix": "Hive",
        "images": [
            {"type": "Normal Cards",          "cards": ["Wasps Boost", "Wasps Count", "Wasps Volley"]},
            {"type": "Chain Cards T1",         "cards": ["Swarm Echo", "Contact Pulse"]},
            {"type": "Chain Cards T2",         "cards": ["Echo Upgrade II", "Final Resonance", "Amplified Pulse"]},
            {"type": "Chain Cards T3",         "cards": ["Echo Upgrade III"]},
            {"type": "Combo Cards",            "cards": ["Aero Split", "Electro-Wasps", "Volley Wasp", "Swarm Fury"]},
            {"type": "Breakthrough Cards T1",  "cards": ["Wasp Evolution 2", "Hive Mutation 2"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Wasp Evolution 3", "Wasp Retrieval"]},
        ]
    },
    {
        "turretId": "railgun",
        "wikiPrefix": "Railgun",
        "images": [
            {"type": "Normal Cards",          "cards": ["Shell Boost Rail", "Shell Volley Rail", "Shell Penetration Rail"]},
            {"type": "Chain Cards T1",         "cards": ["Basic Split", "Explosive Shells"]},
            {"type": "Chain Cards T2",         "cards": ["Piercing Enhancement", "Impact Spread", "Impact Boost"]},
            {"type": "Chain Cards T3",         "cards": ["Split Mastery"]},
            {"type": "Combo Cards",            "cards": ["Piercing Mark", "Surge Pierce", "Secondary Minefield", "Piercing Ricochet"]},
            {"type": "Breakthrough Cards T1",  "cards": ["Power Penetration", "Weak Spot Strike"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Shell Critical Boost", "Execution Penetration"]},
        ]
    },
    {
        "turretId": "teslacoil",
        "wikiPrefix": "Teslacoil",
        "images": [
            {"type": "Normal Cards",          "cards": ["Teslacoil Boost", "Teslacoil Bounce", "Teslacoil Speed"]},
            {"type": "Chain Cards T1",         "cards": ["Charge Expansion", "Trap Matrix"]},
            {"type": "Chain Cards T2",         "cards": ["Charge Destruction", "Enhanced Matrix"]},
            {"type": "Chain Cards T3",         "cards": ["Charge Delayed", "Matrix Thunderbolt"]},
            {"type": "Combo Cards",            "cards": ["Cooperative Beam", "Wasp Mirage", "Highvolt Trigger", "Spinning Laser"]},
            {"type": "Breakthrough Cards T1",  "cards": ["Electric Chain", "Surge"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Electro Interference", "Expanded Shockwave"]},
        ]
    },
    {
        "turretId": "gravity_vortex_gun",
        "wikiPrefix": "Gravity Vortex",
        "images": [
            {"type": "Normal Cards",          "cards": ["Field Boost", "Field Range", "Field Distance"]},
            {"type": "Chain Cards T1",         "cards": ["Small Black Hole", "Static Wormhole"]},
            {"type": "Chain Cards T2",         "cards": ["Black Hole Expansion", "Wormhole Enhancement", "Wormhole Expansion"]},
            {"type": "Chain Cards T3",         "cards": ["Destructive Black Hole"]},
            {"type": "Combo Cards",            "cards": ["Field Reflection", "Field Disruption", "Double Fission", "Binary Stars"]},
            {"type": "Breakthrough Cards T1",  "cards": ["Extended Pull", "Field Amplification"]},
            {"type": "Breakthrough Cards T2",  "cards": ["Extra Field", "Extended Range"]},
        ]
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR  = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR   = os.path.join(PROJECT_DIR, "images", "cards")
WIKI_API     = "https://official-galaxy-defense-ftd-wiki.fandom.com/api.php"
HEADERS      = {"User-Agent": "GalaxyDefenseBuilder/1.0"}

def slugify(name: str) -> str:
    """Transforme un nom de carte en nom de fichier."""
    return re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')

def fetch_image_urls(file_names: list) -> dict:
    """Interroge l'API wiki par lots de 50 pour récupérer les URLs CDN."""
    result = {}
    batch_size = 50
    for i in range(0, len(file_names), batch_size):
        batch = file_names[i:i + batch_size]
        titles = "|".join(f"File:{fn}" for fn in batch)
        resp = requests.get(WIKI_API, params={
            "action": "query",
            "titles": titles,
            "prop": "imageinfo",
            "iiprop": "url|dimensions",
            "format": "json"
        }, headers=HEADERS, timeout=30)
        data = resp.json()
        for page in data["query"]["pages"].values():
            if "imageinfo" in page:
                title = page["title"].replace("File:", "")
                info = page["imageinfo"][0]
                result[title] = {
                    "url":    info["url"],
                    "width":  info.get("width", 0),
                    "height": info.get("height", 0),
                }
        time.sleep(0.2)   # pause pour ne pas surcharger l'API
    return result

def download_image(url: str) -> Image.Image:
    """Télécharge une image et retourne un objet PIL Image."""
    resp = requests.get(url, headers=HEADERS, timeout=60)
    resp.raise_for_status()
    return Image.open(BytesIO(resp.content)).convert("RGBA")

def crop_card(img: Image.Image, col_index: int, total_cols: int) -> Image.Image:
    """Découpe la colonne col_index d'une image composite."""
    card_w = img.width // total_cols
    x = col_index * card_w
    return img.crop((x, 0, x + card_w, img.height))

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Collecte de tous les noms de fichiers à requêter
    all_file_names = []
    for turret in TURRET_CARDS_META:
        for img_meta in turret["images"]:
            all_file_names.append(f"{turret['wikiPrefix']} {img_meta['type']}.png")

    print(f"[LIST] {len(all_file_names)} images composites a recuperer...")

    # Recuperation des URLs + dimensions via l'API du wiki
    print("[WEB] Interrogation de l'API du wiki...")
    url_map = fetch_image_urls(all_file_names)
    print(f"[OK] {len(url_map)} URLs trouvees\n")

    total_cards = 0
    errors = []

    for turret in TURRET_CARDS_META:
        turret_dir = os.path.join(OUTPUT_DIR, turret["turretId"])
        os.makedirs(turret_dir, exist_ok=True)
        print(f"[DIR] {turret['turretId']}")

        for img_meta in turret["images"]:
            file_name = f"{turret['wikiPrefix']} {img_meta['type']}.png"
            info = url_map.get(file_name)

            if not info:
                msg = f"   [WARN] URL introuvable : {file_name}"
                print(msg)
                errors.append(msg)
                continue

            # Auto-detection du nombre de colonnes : chaque carte = ~512px
            auto_cols = max(1, info["width"] // 512)
            expected_cols = len(img_meta["cards"])

            if auto_cols != expected_cols:
                print(f"   [WARN] {file_name} : attendu {expected_cols} cartes "
                      f"mais detecte {auto_cols} colonnes (largeur={info['width']})")

            cols = auto_cols   # on fait confiance a la detection auto
            print(f"   [DL] {img_meta['type']} ({cols} cartes, {info['width']}x{info['height']})")

            try:
                img = download_image(info["url"])
            except Exception as e:
                msg = f"   [ERR] Erreur telechargement {file_name}: {e}"
                print(msg)
                errors.append(msg)
                continue

            for col in range(cols):
                if col >= len(img_meta["cards"]):
                    print(f"      [WARN] Pas de nom pour colonne {col} -> ignoree")
                    continue

                card_name = img_meta["cards"][col]
                out_file  = os.path.join(turret_dir, f"{slugify(card_name)}.png")

                if os.path.exists(out_file):
                    total_cards += 1
                    continue   # deja genere

                try:
                    cropped = crop_card(img, col, cols)
                    # Sauvegarder en PNG (RGBA pour conserver la transparence)
                    cropped.save(out_file, "PNG")
                    print(f"      [OK] {slugify(card_name)}.png")
                    total_cards += 1
                except Exception as e:
                    msg = f"      [ERR] Erreur decoupe '{card_name}': {e}"
                    print(msg)
                    errors.append(msg)

        print()

    print(f"[DONE] {total_cards} images de cartes generees.")
    if errors:
        print(f"\n[WARN] {len(errors)} erreur(s) :")
        for err in errors:
            print(f"  {err}")
    print(f"[DIR] Images sauvegardees dans : {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

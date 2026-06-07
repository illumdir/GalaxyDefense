"""
sync-gamedata.py
================
Synchronise la section `cards` de chaque tourelle dans gameData.js
depuis la base SQLite gd.db (elle-même alimentée par l'API gd-database).

Ce qui est mis à jour  : noms, effets, types, tiers, requires_chain, requires_turret
Ce qui est PRÉSERVÉ    : metadata tourelle (damageType, image), section GUARDIANS,
                         cartes présentes dans l'app mais absentes de la DB

Usage :
    python scripts/sync-gamedata.py          # dry-run : affiche le diff
    python scripts/sync-gamedata.py --write  # écrit gameData.js
"""

import sqlite3, re, sys, os, json
from textwrap import indent

DRY_RUN  = "--write" not in sys.argv
BASE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH  = os.path.join(BASE_DIR, "data", "gd.db")
GD_PATH  = os.path.join(BASE_DIR, "data", "gameData.js")

# ── Mapping type DB → type gameData ────────────────────────────
TYPE_MAP = {
    "Normal": "normal",
    "Chain":  "chain",
    "Combo":  "combo",
    "Elite":  "breakthrough",   # Elite dans la DB = Breakthrough dans l'app
}
COLOR_MAP = {
    "Normal": "green",
    "Chain":  "green",
    "Combo":  "green",
    "Elite":  "purple",
}


def parse_tier(tier_str):
    """'T1' → 1"""
    return int(tier_str.replace("T", ""))


def slug(name):
    """'Gravity Vortex Gun' → 'gravity_vortex_gun'"""
    return re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')


# ── Lecture DB ──────────────────────────────────────────────────
def load_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row

    # Tourelles (UUID → slug + nom)
    turrets = {}
    for r in con.execute("SELECT id, name FROM turrets"):
        turrets[r["id"]] = {"name": r["name"], "slug": slug(r["name"])}

    # Cartes (toutes, avec résolution des relations)
    cards_by_id = {}
    for r in con.execute("SELECT id, name, type, tier, turret_id, combo_turret_id, parent_card_id, description FROM cards"):
        cards_by_id[r["id"]] = dict(r)

    # Résoudre parent_card_id → nom de la carte parente (requires_chain)
    # Résoudre combo_turret_id → slug local (requires_turret)
    for cid, c in cards_by_id.items():
        c["tier_int"]       = parse_tier(c["tier"])
        c["card_type"]      = TYPE_MAP.get(c["type"], c["type"].lower())
        c["color"]          = COLOR_MAP.get(c["type"], "green")
        c["requires_chain"] = cards_by_id[c["parent_card_id"]]["name"] if c["parent_card_id"] else None
        c["requires_turret"]= turrets[c["combo_turret_id"]]["slug"]    if c["combo_turret_id"] else None
        c["turret_slug"]    = turrets[c["turret_id"]]["slug"]           if c["turret_id"] in turrets else None

    con.close()
    return turrets, cards_by_id


# ── Construction du bloc cards d'une tourelle ───────────────────
def build_cards_block(turret_slug, cards_by_id):
    """Retourne un dict {normal:[], chain:[], combo:[], breakthrough:[]}"""
    # Filtrer les cartes de cette tourelle (sauf Guardian)
    turret_cards = [
        c for c in cards_by_id.values()
        if c["turret_slug"] == turret_slug
    ]

    buckets = {"normal": [], "chain": [], "combo": [], "breakthrough": []}

    for c in sorted(turret_cards, key=lambda x: (x["tier_int"], x["name"])):
        ct = c["card_type"]
        if ct not in buckets:
            continue

        entry = {
            "name":   c["name"],
            "effect": c["description"] or "",
            "tier":   c["tier_int"],
            "color":  c["color"],
        }

        if ct == "normal":
            entry["max_copies"] = 3

        if ct == "chain" and c["requires_chain"]:
            entry["requires_chain"] = c["requires_chain"]

        if ct == "combo":
            # requires_turret = None si combo avec Fortress (guardian slug)
            rt = c["requires_turret"]
            entry["requires_turret"] = None if rt == "guardian" else rt

        buckets[ct].append(entry)

    return buckets


# ── Sérialisation JS d'un bloc cards ───────────────────────────
def js_value(v):
    if v is None:   return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, int):  return str(v)
    # Échapper les guillemets simples dans les chaînes
    return '"' + str(v).replace('\\', '\\\\').replace('"', '\\"') + '"'


def serialize_card(c, card_type, pad="        "):
    fields = []
    fields.append(f'name: {js_value(c["name"])}')
    fields.append(f'effect: {js_value(c["effect"])}')
    fields.append(f'tier: {c["tier"]}')
    fields.append(f'color: {js_value(c["color"])}')

    if card_type == "normal":
        fields.append(f'max_copies: {c["max_copies"]}')
    if card_type == "chain" and c.get("requires_chain"):
        fields.append(f'requires_chain: {js_value(c["requires_chain"])}')
    if card_type == "combo":
        fields.append(f'requires_turret: {js_value(c.get("requires_turret"))}')

    return pad + "{ " + ", ".join(fields) + " }"


def serialize_cards_block(cards_block, pad="      "):
    lines = []
    order = ["normal", "chain", "combo", "breakthrough"]
    for ct in order:
        entries = cards_block.get(ct, [])
        if not entries:
            continue
        lines.append(f"{pad}{ct}: [")
        for c in entries:
            lines.append(serialize_card(c, ct) + ",")
        # Enlever la virgule du dernier élément
        if lines[-1].endswith(","):
            lines[-1] = lines[-1][:-1]
        lines.append(f"{pad}],")
    # Enlever la virgule du dernier bucket
    if lines and lines[-1].endswith(","):
        lines[-1] = lines[-1][:-1]
    return "\n".join(lines)


# ── Remplacement dans gameData.js ───────────────────────────────
# On repère chaque bloc `cards: { ... }` par tourelle et on le remplace.
# On utilise un compteur de parenthèses pour gérer les blocs imbriqués.

def find_cards_block_range(src, turret_id):
    """
    Cherche le bloc `cards: {` associé à la tourelle `turret_id`
    et retourne (start, end) des indices dans src.
    """
    # Trouver l'occurrence de l'id de tourelle
    id_pattern = f'id: "{turret_id}"'
    id_pos = src.find(id_pattern)
    if id_pos == -1:
        return None

    # Chercher `cards: {` après l'id
    cards_pos = src.find("cards: {", id_pos)
    if cards_pos == -1:
        return None

    # Trouver l'accolade ouvrante
    open_brace = src.index("{", cards_pos + len("cards: "))
    depth = 0
    i = open_brace
    while i < len(src):
        if src[i] == "{":
            depth += 1
        elif src[i] == "}":
            depth -= 1
            if depth == 0:
                return (open_brace, i + 1)
        i += 1
    return None


def sync(turret_id, cards_block, src):
    """Remplace le bloc cards d'une tourelle dans src."""
    bounds = find_cards_block_range(src, turret_id)
    if bounds is None:
        print(f"  WARN: tourelle '{turret_id}' non trouvée dans gameData.js")
        return src

    start, end = bounds
    new_block = "{\n" + serialize_cards_block(cards_block) + "\n    }"
    return src[:start] + new_block + src[end:]


# ── Main ────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Lecture de gd.db...")
    turrets, cards_by_id = load_db()

    # Tourelles jouables (hors Guardian)
    playable = [t for t in turrets.values() if t["slug"] != "guardian"]
    print(f"{len(playable)} tourelles, {len(cards_by_id)} cartes")

    print("\nChargement de gameData.js...")
    with open(GD_PATH, "r", encoding="utf-8") as f:
        src = f.read()

    updated = src
    for t in sorted(playable, key=lambda x: x["slug"]):
        s = t["slug"]
        cards_block = build_cards_block(s, cards_by_id)
        total = sum(len(v) for v in cards_block.values())
        print(f"  {s:<25} {total} cartes")
        updated = sync(s, cards_block, updated)

    if DRY_RUN:
        # Afficher un diff simplifié
        old_lines = src.split("\n")
        new_lines = updated.split("\n")
        changes = sum(1 for a, b in zip(old_lines, new_lines) if a != b)
        changes += abs(len(new_lines) - len(old_lines))
        print(f"\n[DRY-RUN] {changes} ligne(s) modifiée(s)")
        print("Pour appliquer : python scripts/sync-gamedata.py --write")
    else:
        # Backup + écriture
        backup = GD_PATH + ".bak"
        with open(backup, "w", encoding="utf-8") as f:
            f.write(src)
        with open(GD_PATH, "w", encoding="utf-8") as f:
            f.write(updated)
        print(f"\ngameData.js mis a jour  (backup -> gameData.js.bak)")

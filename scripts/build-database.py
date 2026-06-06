"""
Fetches turrets and cards from gd-database API and stores them in a SQLite database.
Relations: cards.turret_id → turrets.id, cards.combo_turret_id → turrets.id, cards.parent_card_id → cards.id
"""

import sqlite3
import urllib.request
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "gd.db")
TURRETS_URL = "https://gd-database.vercel.app/api/db/turrets"
CARDS_URL = "https://gd-database.vercel.app/api/db/cards"


def fetch(url):
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read())


def build(db_path):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    print("Fetching turrets...")
    turrets = fetch(TURRETS_URL)
    print(f"  {len(turrets)} turrets")

    print("Fetching cards...")
    cards = fetch(CARDS_URL)
    print(f"  {len(cards)} cards")

    if os.path.exists(db_path):
        os.remove(db_path)

    con = sqlite3.connect(db_path)
    cur = con.cursor()

    cur.executescript("""
        CREATE TABLE turrets (
            id           TEXT PRIMARY KEY,
            name         TEXT NOT NULL,
            description  TEXT,
            type         TEXT,
            dmg_type     TEXT,
            duration     REAL,
            cooldown     REAL,
            atk_range    TEXT,
            explosion_dmg REAL,
            dmg_range    TEXT,
            dmg_interval REAL,
            penetration  REAL,
            parent_id    TEXT REFERENCES turrets(id),
            submitted_by TEXT,
            image_url    TEXT,
            created_at   TEXT,
            updated_at   TEXT
        );

        CREATE TABLE cards (
            id              TEXT PRIMARY KEY,
            name            TEXT NOT NULL,
            type            TEXT,
            tier            TEXT,
            turret_id       TEXT REFERENCES turrets(id),
            combo_turret_id TEXT REFERENCES turrets(id),
            parent_card_id  TEXT REFERENCES cards(id),
            description     TEXT,
            created_at      TEXT,
            updated_at      TEXT
        );

        CREATE INDEX idx_cards_turret    ON cards(turret_id);
        CREATE INDEX idx_cards_combo     ON cards(combo_turret_id);
        CREATE INDEX idx_cards_parent    ON cards(parent_card_id);
    """)

    cur.executemany("""
        INSERT INTO turrets VALUES (
            :id, :name, :description, :type, :dmg_type, :duration, :cooldown,
            :atk_range, :explosion_dmg, :dmg_range, :dmg_interval, :penetration,
            :parent_id, :submitted_by, :image_url, :created_at, :updated_at
        )
    """, [{
        "id": t["id"], "name": t["name"], "description": t.get("description"),
        "type": t.get("type"), "dmg_type": t.get("dmg_type"), "duration": t.get("duration"),
        "cooldown": t.get("cooldown"), "atk_range": t.get("atk_range"),
        "explosion_dmg": t.get("explosion_dmg"), "dmg_range": t.get("dmg_range"),
        "dmg_interval": t.get("dmg_interval"), "penetration": t.get("penetration"),
        "parent_id": t.get("parent_id"), "submitted_by": t.get("submitted_by"),
        "image_url": t.get("image_url"), "created_at": t.get("created_at"),
        "updated_at": t.get("updated_at"),
    } for t in turrets])

    cur.executemany("""
        INSERT INTO cards VALUES (
            :id, :name, :type, :tier, :turret_id, :combo_turret_id,
            :parent_card_id, :description, :created_at, :updated_at
        )
    """, [{
        "id": c["id"], "name": c["name"], "type": c.get("type"), "tier": c.get("tier"),
        "turret_id": c.get("turret_id"), "combo_turret_id": c.get("combo_turret_id"),
        "parent_card_id": c.get("parent_card_id"), "description": c.get("description"),
        "created_at": c.get("created_at"), "updated_at": c.get("updated_at"),
    } for c in cards])

    con.commit()
    con.close()
    print(f"\nDatabase created: {db_path}")


def verify(db_path):
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    print("\n--- Verification ---")
    print(f"Turrets: {cur.execute('SELECT COUNT(*) FROM turrets').fetchone()[0]}")
    print(f"Cards:   {cur.execute('SELECT COUNT(*) FROM cards').fetchone()[0]}")

    print("\nCards per turret:")
    rows = cur.execute("""
        SELECT t.name, COUNT(c.id) as card_count
        FROM turrets t
        LEFT JOIN cards c ON c.turret_id = t.id
        GROUP BY t.id
        ORDER BY card_count DESC
    """).fetchall()
    for name, count in rows:
        print(f"  {name:<25} {count} cards")

    print("\nCombo cards (turret_id -> combo_turret_id):")
    rows = cur.execute("""
        SELECT c.name, t1.name as turret, t2.name as combo_with
        FROM cards c
        JOIN turrets t1 ON t1.id = c.turret_id
        JOIN turrets t2 ON t2.id = c.combo_turret_id
        LIMIT 10
    """).fetchall()
    for card, turret, combo in rows:
        print(f"  {card:<30} [{turret}] x [{combo}]")

    con.close()


if __name__ == "__main__":
    build(DB_PATH)
    verify(DB_PATH)

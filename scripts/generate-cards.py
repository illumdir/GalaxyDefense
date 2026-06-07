"""
generate-cards.py
=================
Génère TOUTES les images de cartes depuis gameData.js + templates tourelles.

Structure d'une carte (512x862) :
  y=  0 →  105  header coloré + nom
  y=105 →  507  illustration tourelle (template)
  y=507 →  525  ligne séparatrice
  y=525 →  862  texte effet

Badge crosshair : centre (55, 455), dessiné en dernier (par-dessus tout).

Usage :
  python generate-cards.py           # génère toutes les cartes
  python generate-cards.py templates # régénère seulement les templates
"""

import os, sys, json, subprocess, textwrap
from PIL import Image, ImageDraw, ImageFont

# ── Dimensions ──────────────────────────────────────────────────
CARD_W, CARD_H  = 512, 862
HEADER_H        = 105
ILLUS_Y0        = 105
ILLUS_Y1        = 507
SEP_Y0, SEP_Y1  = 507, 525
EFFECT_Y0       = 525

BADGE_CX, BADGE_CY = 55, 455
BADGE_R_OUT     = 52
BADGE_R_RING    = 44
BADGE_R_INNER   = 28
BADGE_CROSS_LEN = 20
BADGE_CROSS_W   = 2

# ── Palettes ────────────────────────────────────────────────────
GREEN  = dict(header=(51,127,113), body=(24,69,59),
              sep=(155,238,219),   hdr_text=(100,240,215),
              badge_ring=(155,238,219))
PURPLE = dict(header=(90,50,130),  body=(40,20,70),
              sep=(180,130,230),   hdr_text=(220,180,255),
              badge_ring=(180,130,230))

TEXT_WHITE = (255, 255, 255)
BADGE_DARK = (12, 22, 18)

BASE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
CARD_DIR = os.path.join(BASE_DIR, "images", "cards")
TPL_DIR  = os.path.join(CARD_DIR, "_templates")


# ── Polices ─────────────────────────────────────────────────────
def load_font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
        r"C:\Windows\Fonts\seguibl.ttf"  if bold else r"C:\Windows\Fonts\segoeui.ttf",
    ]
    for f in candidates:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


# ── Wrapping ─────────────────────────────────────────────────────
def wrap_text(draw, text, max_w, font):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textbbox((0,0), test, font=font)[2] <= max_w:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines


# ── Badge ────────────────────────────────────────────────────────
def draw_badge(draw, cx, cy, tier, palette):
    draw.ellipse([cx-BADGE_R_OUT, cy-BADGE_R_OUT, cx+BADGE_R_OUT, cy+BADGE_R_OUT],
                 fill=BADGE_DARK)
    ring = palette["badge_ring"]
    draw.ellipse([cx-BADGE_R_RING, cy-BADGE_R_RING, cx+BADGE_R_RING, cy+BADGE_R_RING],
                 outline=ring, width=3)
    cl = BADGE_CROSS_LEN
    draw.line([(cx-BADGE_R_RING, cy), (cx-cl, cy)], fill=ring, width=BADGE_CROSS_W)
    draw.line([(cx+cl, cy), (cx+BADGE_R_RING, cy)], fill=ring, width=BADGE_CROSS_W)
    draw.line([(cx, cy-BADGE_R_RING), (cx, cy-cl)], fill=ring, width=BADGE_CROSS_W)
    draw.line([(cx, cy+cl), (cx, cy+BADGE_R_RING)], fill=ring, width=BADGE_CROSS_W)
    draw.ellipse([cx-BADGE_R_INNER, cy-BADGE_R_INNER, cx+BADGE_R_INNER, cy+BADGE_R_INNER],
                 fill=BADGE_DARK)
    fn  = load_font(42, bold=True)
    ts  = str(tier)
    bb  = draw.textbbox((0,0), ts, font=fn)
    tx  = cx - (bb[2]-bb[0])//2 - bb[0]
    ty  = cy - (bb[3]-bb[1])//2 - bb[1] - 2
    draw.text((tx, ty), ts, font=fn, fill=TEXT_WHITE)


# ── Templates ────────────────────────────────────────────────────
def build_templates():
    """Extrait l'illustration de chaque tourelle depuis les archives."""
    os.makedirs(TPL_DIR, exist_ok=True)
    arch_dir = os.path.join(CARD_DIR, "_archives")
    turret_ids = [
        d for d in os.listdir(arch_dir)
        if os.path.isdir(os.path.join(arch_dir, d))
    ]
    saved = []
    for tid in sorted(turret_ids):
        tpl_path = os.path.join(TPL_DIR, f"{tid}.png")
        src_dir  = os.path.join(arch_dir, tid)
        best = None
        best_brightness = -1
        for fname in sorted(os.listdir(src_dir)):
            if not fname.endswith(".png"):
                continue
            try:
                img = Image.open(os.path.join(src_dir, fname)).convert("RGB")
                w, h = img.size
                if not (w == CARD_W and h in (CARD_H, CARD_H - 1)):
                    continue
                # Mesurer la luminosité de la zone illustration (centre, sans badge)
                import numpy as np
                arr = np.array(img)
                zone = arr[ILLUS_Y0+50 : ILLUS_Y1-50, 100:CARD_W-50]
                brightness = float(np.mean(zone))
                if brightness > best_brightness:
                    best_brightness = brightness
                    best = img
            except Exception:
                continue
        if best is None:
            print(f"  SKIP {tid} — aucune carte {CARD_W}px trouvee dans archives")
            continue
        illus = best.crop((0, ILLUS_Y0, CARD_W, ILLUS_Y1))
        illus.save(tpl_path)
        saved.append(tid)
        print(f"  template {tid}.png")
    return saved


# ── Génération d'une carte ───────────────────────────────────────
def make_card(card_name, tier, effect, turret_id, out_path, color="green"):
    palette  = PURPLE if color == "purple" else GREEN
    tpl_path = os.path.join(TPL_DIR, f"{turret_id}.png")
    if not os.path.exists(tpl_path):
        raise FileNotFoundError(f"Template manquant : {tpl_path}")

    illus = Image.open(tpl_path).convert("RGB")

    card = Image.new("RGB", (CARD_W, CARD_H), palette["body"])
    draw = ImageDraw.Draw(card)

    # Header
    draw.rectangle([(0,0),(CARD_W,HEADER_H)], fill=palette["header"])
    for size in (52, 42, 34, 28):
        fn = load_font(size, bold=True)
        bb = draw.textbbox((0,0), card_name, font=fn)
        tw, th = bb[2]-bb[0], bb[3]-bb[1]
        if tw <= CARD_W - 24:
            break
    draw.text(((CARD_W-tw)//2, (HEADER_H-th)//2), card_name,
              font=fn, fill=palette["hdr_text"])

    # Illustration — effacer la zone badge du template
    illus_edit = illus.copy()
    illus_draw = ImageDraw.Draw(illus_edit)
    by = BADGE_CY - ILLUS_Y0
    illus_draw.rectangle(
        [0, by - BADGE_R_OUT - 10,
         BADGE_CX + BADGE_R_OUT + 20, ILLUS_Y1 - ILLUS_Y0],
        fill=palette["body"]
    )
    card.paste(illus_edit, (0, ILLUS_Y0))

    # Séparateur
    draw.rectangle([(0,SEP_Y0),(CARD_W,SEP_Y1)], fill=palette["sep"])

    # Zone effet
    draw.rectangle([(0,EFFECT_Y0),(CARD_W,CARD_H)], fill=palette["body"])
    fn_fx  = load_font(48, bold=True)
    margin = 18
    y_cur  = EFFECT_Y0 + 22
    for line in wrap_text(draw, effect, CARD_W - margin*2, fn_fx):
        draw.text((margin, y_cur), line, font=fn_fx, fill=TEXT_WHITE)
        bb     = draw.textbbox((0,0), line, font=fn_fx)
        y_cur += (bb[3]-bb[1]) + 10

    # Badge (par-dessus tout)
    draw_badge(draw, BADGE_CX, BADGE_CY, tier, palette)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    card.save(out_path, "PNG")


# ── Lecture de gameData.js ───────────────────────────────────────
def load_all_cards():
    """Extrait toutes les cartes de gameData.js via Node."""
    script = r"""
const { TURRETS } = require('./data/gameData.js');
const out = [];
for (const t of TURRETS) {
  for (const [type, cards] of Object.entries(t.cards)) {
    for (const c of cards) {
      const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+$/,'');
      out.push({
        turret_id:   t.id,
        card_name:   c.name,
        slug:        slug,
        tier:        c.tier,
        color:       c.color,
        effect:      c.effect || '',
        type:        type
      });
    }
  }
}
console.log(JSON.stringify(out));
"""
    result = subprocess.run(
        ["node", "-e", script],
        capture_output=True, text=True,
        cwd=BASE_DIR
    )
    if result.returncode != 0:
        raise RuntimeError(f"Node error: {result.stderr}")
    return json.loads(result.stdout)


# ── Main ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"

    print("=== Templates ===")
    build_templates()

    if mode == "templates":
        print("Mode templates only — termine.")
        sys.exit(0)

    print("\n=== Chargement des cartes depuis gameData.js ===")
    cards = load_all_cards()
    print(f"{len(cards)} cartes trouvees")

    print("\n=== Generation ===")
    ok = 0
    errors = []
    for c in cards:
        out_path = os.path.join(CARD_DIR, c["turret_id"], f"{c['slug']}.png")
        try:
            make_card(
                card_name=c["card_name"],
                tier=c["tier"],
                effect=c["effect"],
                turret_id=c["turret_id"],
                out_path=out_path,
                color=c["color"],
            )
            ok += 1
            print(f"  OK  {c['turret_id']}/{c['slug']}.png")
        except Exception as e:
            errors.append((c["turret_id"], c["card_name"], str(e)))
            print(f"  ERR {c['turret_id']}/{c['slug']}.png — {e}")

    print(f"\n{ok}/{len(cards)} cartes generees.")
    if errors:
        print(f"{len(errors)} erreurs :")
        for tid, name, err in errors:
            print(f"  [{tid}] {name}: {err}")
    else:
        print("Aucune erreur.")

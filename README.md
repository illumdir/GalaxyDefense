# Galaxy Defense — ARK Builder

Outil de construction de compositions pour le mode **ARK (Expedition)** de Galaxy Defense - Fortress TD.

Choisissez jusqu'à 4 tourelles, un gardien, et construisez votre deck de cartes palier par palier.

**Live** → http://gdb.illumdir.com

---

## Intégration

L'app est **100% statique** — HTML + CSS + Vue 3 (CDN). Aucun build, aucun backend requis.

### Option A — Iframe (recommandée)

```html
<iframe
  src="https://your-domain.com/galaxydefense/"
  width="100%"
  height="800px"
  frameborder="0">
</iframe>
```

### Option B — Sous-dossier de votre site

Copiez le contenu du repo dans un sous-dossier de votre site et accédez-y via `monsite.com/galaxydefense/`.

### Option C — Serveur dédié

```bash
git clone https://github.com/illumdir/GalaxyDefense.git
cd GalaxyDefense

# Node
npx serve . -p 8080

# Python
python -m http.server 8080

# nginx → pointer le root vers ce dossier
```

> Les dossiers `images/cards/_archives/` et `images/cards/_templates/` sont des ressources de développement — inutiles en production, vous pouvez les supprimer.

---

## Structure du projet

```
GalaxyDefense/
├── index.html              # Point d'entrée unique
├── css/style.css           # Styles
├── js/
│   ├── app.js              # Application Vue 3
│   ├── helpers.js          # Encodage URL, utilitaires
│   └── components/         # Composants Vue
│       ├── TurretSelector.js
│       ├── GuardianSelector.js
│       ├── CardBuilder.js
│       └── CompositionSummary.js
├── data/
│   ├── gameData.js         # Données du jeu (tourelles, gardiens, cartes)
│   └── gd.db               # Base SQLite (tourelles + cartes, usage dev)
├── images/
│   └── cards/
│       ├── {turret_id}/    # 188 images de cartes générées
│       ├── _templates/     # Illustrations extraites (dev)
│       └── _archives/      # Images wiki originales (dev)
└── scripts/
    ├── generate-cards.py   # Génère toutes les images de cartes
    └── build-database.py   # Reconstruit gd.db depuis l'API communautaire
```

---

## Mettre à jour les données du jeu

### Workflow complet (nouvelle carte ou nouvelle tourelle)

```
gd-database.vercel.app  (API communautaire)
          │
          │  1. python scripts/build-database.py
          ▼
      data/gd.db          (SQLite local — tourelles + cartes)
          │
          │  2. python scripts/sync-gamedata.py --write
          ▼
   data/gameData.js       (données du jeu, lues par l'app)
          │
          │  3. python scripts/generate-cards.py
          ▼
 images/cards/{id}/*.png  (visuels des cartes)
          │
          │  4. git add . && git commit && git push
          ▼
        GitHub
          │
          │  5. déployer sur le serveur (scp / nginx)
          ▼
     Production
```

| Étape | Commande | Quand ? |
|---|---|---|
| 1. Rebuilder la DB | `python scripts/build-database.py` | Toujours en premier |
| 2. Sync gameData.js | `python scripts/sync-gamedata.py --write` | Après chaque rebuild DB |
| 3. Régénérer les images | `python scripts/generate-cards.py` | Si des cartes ont changé de nom ou d'effet |
| 4. Commit | `git add . && git commit && git push` | Après validation |
| 5. Déployer | copier `data/` + `images/cards/` sur le serveur | Pour mettre en prod |

> **Vérification avant écriture** : `python scripts/sync-gamedata.py` (sans `--write`) affiche le nombre de lignes modifiées sans toucher au fichier.

### Détail des scripts

**`build-database.py`** — Reconstruit `data/gd.db` depuis [gd-database.vercel.app](https://gd-database.vercel.app).

**`sync-gamedata.py`** — Lit `gd.db` et met à jour la section `cards` de chaque tourelle dans `gameData.js`. Préserve les métadonnées tourelle (images, damageType) et la section GUARDIANS. Crée un backup `gameData.js.bak` automatiquement.

**`generate-cards.py`** — Génère 1 image PNG par carte (512×862 px) dans `images/cards/{turret_id}/`. Requiert Python + Pillow (`pip install Pillow`).

---

## Partage de compositions

Les compositions sont encodées en **Base64 dans l'URL** (`#hash`). Chaque lien est partageable et auto-descriptif — aucune base de données nécessaire.

---

## Stack technique

| Composant | Technologie |
|---|---|
| Frontend | Vue 3 (CDN), Vanilla JS |
| Données | JS statique (`gameData.js`) |
| Images | PNG générés avec Pillow (Python) |
| Déploiement | Fichiers statiques (nginx, Apache, etc.) |
| Base de données | SQLite (`gd.db`) — usage développement uniquement |

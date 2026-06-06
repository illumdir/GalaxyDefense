# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GalaxyDefense** est un outil web de composition de tourelles pour le jeu mobile **Galaxy Defense - Fortress TD**, focalisé sur le mode **ARK (Expedition - Project Ark: Rebuild)**.

Le joueur sélectionne :
- 1 **Gardien** (obligatoire, toujours présent)
- 4 **Tourelles de combat** parmi les 11 disponibles
- Les **cartes** associées à chaque tourelle (9 cartes de base + 3 cartes violettes/combo)

L'objectif : permettre aux joueurs de créer et partager leurs compositions.

## Version du jeu

**v0.15.4**

## Repo GitHub

https://github.com/illumdir/GalaxyDefense

## Branches

- `main` → production (NAS Synology / Docker). Ne jamais pousser directement.
- `dev` → développement en cours. Merger vers `main` quand validé.

## Running

Lancer le serveur de dev local :

```bash
npm run dev
# → http://localhost:8080
```

## Déploiement (NAS)

Le script `deploy.sh` déploie sur le NAS Synology via SSH/SCP :

```bash
bash deploy.sh
# ou : npm run deploy
```

- Cible : `illumdir@192.168.2.31:/volume1/docker/galaxydefense/www`
- Container Docker existant : nginx:alpine, port **8086**
- App disponible sur le réseau local : http://192.168.2.31:8086
- Le flag `-O` est obligatoire sur `scp` (protocole SCP legacy Synology, pas SFTP)
- Fichiers déployés : `index.html`, `css/`, `js/`, `data/`, `images/`
- **Ne jamais `git push` directement sur `main`** — passer par une PR depuis `dev`

## Secrets

Le token GitHub est dans `.env` (ignoré par git) :
```
GITHUB_TOKEN=...
```

## Architecture

```
GalaxyDefense/
├── index.html          # Point d'entrée
├── data/
│   └── gameData.js     # Toutes les données du jeu (tourelles, gardiens, cartes)
├── js/                 # Logique applicative
└── css/                # Styles
```

## Ressources Wiki

Le wiki officiel (Fandom) **bloque les requêtes automatiques (403)**. Contourner en passant par `curl` avec un user-agent navigateur :
```bash
curl -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "<url>"
```

### Pages utiles

| Page | URL | Contenu |
|------|-----|---------|
| Wiki officiel (accueil) | https://official-galaxy-defense-ftd-wiki.fandom.com/wiki/The_Official_Galaxy_Defense_Fortess_TD_Wiki | Point d'entrée |
| Patch Notes | https://official-galaxy-defense-ftd-wiki.fandom.com/wiki/Patch_Notes | Historique des versions (documenté jusqu'à v0.14.0 au 2026-05-25) |
| Turret Overview | https://official-galaxy-defense-ftd-wiki.fandom.com/wiki/Turret_Overview | **Source principale** : toutes les cartes combo, chain, breakthrough par tourelle + cartes du Gardien |
| Codex Turrets | https://official-galaxy-defense-ftd-wiki.fandom.com/wiki/Codex_Turrets | Progression de déverrouillage des cartes par niveau de tourelle |
| ARK: Rebuild | https://official-galaxy-defense-ftd-wiki.fandom.com/wiki/Expedition_-_Project_Ark:_Rebuild | Règles et mécaniques du mode ciblé |

> Note : le wiki n'est pas à jour pour v0.15.4 (vérifié le 2026-05-25). À re-consulter lors des futures mises à jour.

### Autres sources

| Source | URL | Contenu |
|--------|-----|---------|
| GD Database | https://gd-database.vercel.app/ | Source communautaire intéressante sur les données du jeu |
| GD Database API — Cartes | https://gd-database.vercel.app/api/db/cards | JSON structuré de toutes les cartes du jeu (à jour) |
| GD Database API — Tourelles | https://gd-database.vercel.app/api/db/turrets | JSON structuré de toutes les tourelles du jeu (à jour) |

## Données du jeu (`data/gameData.js`)

Source : [Wiki officiel Galaxy Defense](https://official-galaxy-defense-ftd-wiki.fandom.com/wiki/The_Official_Galaxy_Defense_Fortess_TD_Wiki)

### Tourelles (11)
| ID | Nom | Type de dégâts |
|----|-----|----------------|
| `sky_guard` | Sky Guard | Fire |
| `laser` | Laser | Energy |
| `disruption_drone` | Disruption Drone | Force-field |
| `aeroblast` | Aeroblast | Physical |
| `thunderbolt` | Thunderbolt | Electric |
| `beam` | Beam | Energy |
| `firewheel_drone` | Firewheel Drone | Fire |
| `hive` | Hive | Force-field |
| `railgun` | Railgun | Physical |
| `teslacoil` | Teslacoil | Electric |
| `gravity_vortex_gun` | Gravity Vortex Gun | Force-field |

### Types de cartes par tourelle
- **Normal** (3 par tourelle) : boosts de stats de base, aucun prérequis
- **Chain T1/T2/T3** : chaîne séquentielle — T2 nécessite T1, T3 nécessite T2. Chaque tier a 2 options. En mode ARK, les 2 options d'un même tier peuvent être jouées simultanément.
- **Breakthrough** (5 par tourelle) : améliorations horizontales spéciales
- **Combo** (3-4 par tourelle, cartes violettes) : nécessitent une **autre tourelle spécifique** dans la composition. Ce sont les cartes clés à afficher selon la sélection de tourelles.

### Gardiens (20)
- 1 Défaut (Adam)
- 5 Légendaires (Cynthia, Angelica, Jesse, Iris, Tracy) — chacun lié à une tourelle
- 6 Suprêmes (Jax, Hedy, SK-Zero, John-X, Capt., Hardy)
- 8 Ultimes (Clockwork, Aurora, Linus, Victor, Robin, Cael-A, Ampere Mag Witch, Audric)

Les gardiens Légendaire/Suprême/Ultime accordent des bonus de dégâts même sans être équipés (bonus passifs).

### Logique des cartes Combo
Une carte combo est disponible si **les 2 tourelles requises sont toutes deux dans la composition sélectionnée**.
Exemple : `Graviton Laser` (Laser) nécessite `gravity_vortex_gun` → visible uniquement si Laser + Gravity Vortex Gun sont dans les 4 tourelles choisies.

## Images des cartes (`images/cards/`)

Les images sont cropées depuis des composites du wiki et sauvegardées sous `images/cards/{turret_id}/{slug}.png`.

Le slug est généré à runtime par `getCardImage()` dans `js/helpers.js` :
```js
cardName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '')
```

### Pipeline de téléchargement
- Script : `scripts/download-cards.js`
- Utilise `TURRET_CARDS_META` comme source de vérité (noms de cartes → coordonnées de crop)
- Prérequis : token GitHub dans `.env` (pour accès aux images wiki via Jimp)

### Statut des images (post v0.15.4)

Suite au renommage massif de cartes en v0.15.4, un script de renommage a été créé (`scripts/rename-cards.js`) et exécuté.

**Images manquantes à télécharger** (pas encore cropées) :
- **Beam** (refonte complète) : `beam_amplifier`, `beam_acceleration`, `beam_expansion`, `refracted_beam`, `charging_beam`, `refraction_enhancement`, `charged_burst`, `refraction_mastery`, `overcharged_beam`, `energy_synergy`, `conductive_beam`, `spinning_energy`, `gravitational_lens`, `penetrating_beam`, `energy_overload`, `beam_mastery`, `focused_energy`
- **sky_guard** : `fire_transmission` (T3 breakthrough)
- **laser** : `energy_boost` (nouveau T2)
- **teslacoil** : `electric_enhancement` (nouveau combo)
- Autres cartes ajoutées/renommées en v0.15.4 non encore vérifiées

**Fichier orphelin** : `images/cards/teslacoil/surge.png` (ancienne carte, renommée → peut être supprimé)

**Collision de slug Railgun** : la carte chain T1 "Piercing Mark" (API) a été conservée sous le nom `"Basic Split"` dans `gameData.js` pour éviter la collision de slug avec la carte combo "Piercing Mark". C'est une divergence intentionnelle.

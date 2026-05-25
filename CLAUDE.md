# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GalaxyDefense** est un outil web de composition de tourelles pour le jeu mobile **Galaxy Defense - Fortress TD**, focalisé sur le mode **ARK (Expedition - Project Ark: Rebuild)**.

Le joueur sélectionne :
- 1 **Gardien** (obligatoire, toujours présent)
- 4 **Tourelles de combat** parmi les 11 disponibles
- Les **cartes** associées à chaque tourelle (9 cartes de base + 3 cartes violettes/combo)

L'objectif : permettre aux joueurs de créer et partager leurs compositions.

## Running

Ouvrir `index.html` directement dans un navigateur, ou utiliser un serveur local pour éviter les problèmes CORS :

```bash
npx serve .
# ou
python -m http.server 8080
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

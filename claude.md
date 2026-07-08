# Drôme · Diois — Carte de vacances

## Le projet en une phrase

Une carte web interactive du territoire autour d'Aouste-sur-Sye (Drôme, France),
partagée à un groupe d'amis en vacances, hébergée gratos sur GitHub Pages,
consultable sur smartphone, avec des couches thématiques activables
(sentiers GR, monuments historiques, points de baignade, commerces, etc.).

**URL de production :** https://braccialisme.github.io/Drome_map/

## Contexte utilisateur

Andrea (le propriétaire du repo) bosse dans le géospatial/photogrammétrie chez
Iconem. Il est intermédiaire-avancé en QGIS et à l'aise avec le concept mais
pas expert JS/CSS. Il apprécie les explications claires et les fichiers
complets plutôt que les patches diff qu'il doit assembler à la main.

Il déteste les copier-coller depuis le chat parce que ça introduit des
caractères Unicode invisibles qui cassent le code — il faut être vigilant
à ne jamais lui demander de coller des blocs de code ambigus.

## Direction artistique — LIRE ATTENTIVEMENT

L'esthétique est **Braun / Dieter Rams / Teenage Engineering**, absolument
PAS "sci-fi wrapper" ou "vibecodé IA".

### Principes visuels

- **Bloc physique, pas overlay flottant** — le panneau du bas est un bloc
  greige mat opaque, pas un panel translucide backdrop-filter blur
- **Bristol / classeur physique** — les intercalaires latéraux droite du
  panneau sont comme des languettes d'un classeur avec surépaisseur
- **Silence visuel** — pas de LED clignotantes, pas de badges numérotés
  décoratifs "01/02/03", pas de status bar "DRM-001", pas d'emoji tech.
  Tout élément doit servir un besoin fonctionnel, sinon on le vire.
- **Une décision par écran** — inspiré du principe TE : un seul accent
  couleur qui guide l'œil, du vide pour respirer, hiérarchie claire
- **Boutons hardware** — les toggles sont des carrés greige avec un cercle
  dedans et une ombre portée légère pour simuler l'affordance 3D
  (référence : numpad Worldwidet.cc, keychron avec knob)

### Palette (strictement)

```
--greige-0:    #f2efe7   /* base claire, boutons */
--greige-1:    #e4e0d5   /* fond du panneau bloc */
--greige-2:    #d0ccc0   /* bordures / séparateurs */
--greige-3:    #b8b4a7   /* rail du slider */
--greige-4:    #8a877c   /* détails discrets */
--ink:         #1a1a1a   /* texte, coches actives */
--orange:      #cc6a3a   /* SEUL accent — intercalaire actif, pastille de coche, échelle */
--orange-2:    #b8582a   /* orange plus profond pour bordures */
```

Les couleurs des couches (bleu rivière, brun monument, etc.) restent
mais discrètes. **Pas de lime toxique #b8e04a**, il a été retiré.

### Typographie

- **VG5000** (de Velvetyne) partout, hébergée à
  `https://cdn.velvetyne.fr/fonts/vg5000/VG5000-Regular.woff2`
- Regular pour l'UI, Mezzo (600) pour l'affichage
- À terme : self-hoster la police dans le repo (`/fonts/`)

### Ce qu'on ne fait plus

- ❌ backdrop-filter blur sur les panels
- ❌ LEDs clignotantes / animations `@keyframes pulse`
- ❌ Numérotation silkscreen "MODULE 01/02/03" décorative
- ❌ Status bar Terminal DRM-001 en haut à droite
- ❌ Badges avec compteurs "3 actifs" à côté de chaque section
- ❌ Grain SVG en overlay global (mixed-blend mode overlay)
- ❌ Chevron rotate avec animation cubic-bezier
- ❌ Header flottant "Drôme · Diois" par-dessus la carte
- ❌ Icônes emoji ou trop de svg décoratifs

## Stack technique

- **HTML/CSS/JS pur** dans un seul `index.html` — pas de build, pas de bundler,
  pas de framework, pas de npm install
- **MapLibre GL JS** 4.7.1 via CDN unpkg — moteur de carte
- **GitHub Pages** pour l'hébergement (branche `main`, root)
- **Authentification GitHub via GitHub CLI** (`gh auth login`) — Andrea
  a déjà des mauvais souvenirs avec les API keys, on évite

## Structure du projet

```
Drome_map/
  index.html               ← application complète (HTML + CSS + JS inline)
  data/
    contours.geojson       ← fichier local existant (~239 MB, à ignorer)
  README.md                ← minimal
```

## Sources de données

### Basemaps (streaming online via IGN sans clé API)

Toutes les URLs suivent ce pattern :
```
https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile
  &LAYER={LAYER_NAME}&STYLE=normal&FORMAT={image/png|image/jpeg}
  &TILEMATRIXSET={PM|PM_0_14}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}
```

Layers utilisées :
- `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` — Plan IGN vectorisé
- `ORTHOIMAGERY.ORTHOPHOTOS` (jpeg) — photo aérienne actuelle
- `ORTHOIMAGERY.ORTHOPHOTOS.1950-1965` — mission aérienne historique
- `IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW` — hillshade LiDAR HD
- `GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40` (jpeg) — Carte d'État-Major 1866
- `AN-IGNF_GEOGRAPHICALGRIDSYSTEMS.CASSINI` (jpeg, TILEMATRIXSET=PM_0_14, maxzoom 14)
  → **RÉPARÉ (2026-07-08)** : le bug était le préfixe `BNF-` (inexistant).
  Le bon identifiant est `AN-IGNF_...`. Fonctionne, ajouté au sélecteur de fond.

### Contours de niveau

Tuiles vectorielles ISOHYPSE IGN :
```
https://data.geopf.fr/tms/1.0.0/ISOHYPSE/{z}/{x}/{y}.pbf
```
- source-layer : `isohypse`
- champ altitude : `altitude`
- filter courbes maîtresses tous les 50m : `["==", ["%", ["get", "altitude"], 50], 0]`
- **ATTENTION : les contours ne s'affichent pas actuellement**, à débugger
  (potentiellement le nom du champ ou source-layer a changé)

### Sentiers de randonnée

Overlay raster Waymarked Trails :
```
https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png
```

À explorer plus tard : `sentiers-balises.json` du repo IGN
(cloné localement dans `../ign-reference/`) — potentiellement meilleure
data mais nécessite clé API.

### POI (villages, monuments, baignade, commerces)

Requêtes **Overpass API** avec cache localStorage 30 jours :
```
https://overpass-api.de/api/interpreter
```

Emprise (bbox) :
```javascript
const BBOX = { south: 44.55, west: 4.85, north: 45.05, east: 5.45 };
```

### Recherche de lieux

Nominatim OSM restreint à la bbox Drôme :
```
https://nominatim.openstreetmap.org/search
```

## État actuel du projet

### Ce qui fonctionne

- Fonds : Sat + LiDAR HD, Plan IGN, Aérienne 1950-65, État-Major, **Cassini**, LiDAR seul
- **Relief 3D** (`map.setTerrain`) sur un MNT LiDAR HD décodé client-side :
  protocol `float32dem://` (GeoTIFF float32 via WMS mercator → terrain-RGB, lib
  geotiff.js). La même source sert le **hillshade dynamique** ("Lumière du jour",
  azimut solaire calculé — WIP, voir plus bas). Fallback couche SHADOW cuite si
  pas de support.
- **Contours** : raster `ELEVATION.CONTOUR.LINE` à z9 → vecteur `oro_courbe`
  (PLAN.IGN) dès z10, en **orange #f04a00** (maîtresses/normales/intercalaires)
- Sentiers GR (Waymarked), Rivières + noms, Noms des forêts
- POI **clusterisés** (icône Tabler + compte, sans bulle) : monuments, baignade,
  points de vue, restaurants, cafés, glaciers, boulangeries, + activités
  (canoë/rafting, canyoning). Popups nom + horaires ; monuments = extrait
  Wikipedia inline résolu via tag **wikidata** (article précis).
- Villages clusterisés (compte dézoomé, noms ≥ z12)
- Zones drone (couche IGN + légende + slider opacité), Grille de coordonnées
- Marqueur Maison (Crest) + bouton focus ; **boussole** (retour nord)
- Géoloc GPS, recherche Nominatim, échelle dynamique
- Panneau bas, 6 intercalaires (Fond / Nature / Activ. / Patri / Comm / **Exp.**),
  poignée chevron haut-gauche, panel rétractable
- **Offline** : Service Worker (app shell + tuiles/glyphs/geotiff, cache 30j)
- Police **VG5000** self-hostée (glyphs SDF dans `fonts/VG5000/`)

### Ce qui ne fonctionne pas

- ✅ **Cassini** — RÉPARÉ : identifiant `AN-IGNF_...` au lieu de `BNF-`.
- ✅ **Contours de niveau** — RÉPARÉS : on a abandonné ISOHYPSE (plancher z14)
  pour la source vectorielle nationale `PLAN.IGN` (`source-layer: oro_courbe`,
  champ `symbo`), visibles dès z11. Reste souhaité : les avoir dès z9 (1:250k).

### Ce qui doit être amélioré (retours utilisateur)

Le fichier `index.html` actuel est déjà dans la bonne direction DA mais
plusieurs raffinements sont demandés :

1. **Le panneau doit avoir l'air d'une fiche bristol** — les intercalaires
   font partie intégrante de la fiche, pas des onglets rapportés à côté
2. **Virer les lignes de séparation** entre les options de fond de carte
3. **Barre de recherche à réduire à 1/3 de sa taille actuelle**, avec coins
   arrondis/chanfreinés plus prononcés
4. **Virer les titres redondants** en haut de chaque intercalaire
   (le nom est déjà sur la languette)
5. **Réduire la taille du slider d'intensité relief**
6. **Toggles hardware** — un carré greige avec un cercle dedans + ombre
   portée légère pour l'effet 3D. Référence : numpad Worldwidet.cc,
   Keychron avec knob rouge
7. **Boutons carte (zoom/géoloc)** doivent suivre le même principe 3D
   que les toggles

### Roadmap / idées

**En cours / à améliorer :**
- **Course du soleil (Lumière du jour)** — WIP. Le hillshade dynamique marche
  mais l'azimut ne semble pas suivre l'heure de façon convaincante (rendu proche
  du NW figé). À creuser : vérifier convention azimut MapLibre
  (`hillshade-illumination-direction`, anchor `map`), et idéalement voir la
  course sur le relief 3D. Fichier : `sunCompass()` / `updateSunlight()`.
- **Pentes (slope)** — onglet Exp., placeholder "à venir". Cible = protocol
  custom qui calcule la pente depuis notre MNT (résolution adaptée à la source,
  BYOD COG), colorisée par degrés (min/max), style split-view. Réf CTO :
  terrain-viewer.iconem.com (`showSlope`, `slopeOpacity`, `slopeMin/MaxDegrees`).
  NB : l'endpoint raster IGN `ELEVATION.SLOPES(.HIGHRES)` renvoie 404/400 en
  WMTS PM — pas exploitable simplement, d'où l'approche custom.
- **Itinéraires / randos** — gros morceau demandé (tracer/afficher des
  itinéraires). À concevoir proprement pour ne pas alourdir l'app ni casser la DA.

**Plus tard :**
- Mode nuit (palette charbon + crème)
- Full offline pré-généré via Protomaps `.pmtiles` sur la bbox
- Impression papier A1 (QGIS, Lambert-93 EPSG:2154)
- Wiki des commerces enrichi (comme monuments)

**Data connue peu fournie (OSM) :** glaciers (glaces) quasi inexistants en Drôme
rurale ; noms de forêts épars. Pas des bugs — limite de la donnée source.

## Références visuelles (moodboard)

L'utilisateur a un moodboard sur `/mnt/user-data/uploads/` (visible dans
l'historique de conversation) avec 11 images incluant :
- Le numpad Worldwidet.cc (boutons carrés-cercles hardware)
- Un lecteur "DSC-24 Music Player" (sliders gris centrés hardware)
- Un dictaphone TB (vibe générale plastique blanc + orange)
- Teenage Engineering TP-7, TX-6
- Une pédale Superlunar sr-01
- Des refs modules synthé rack

Style keywords : **Braun, Dieter Rams, Teenage Engineering, greige,
Y2K industrial, post-digital hardware, futur alternatif, précis**.

## Anti-patterns à éviter absolument

Andrea a explicitement rejeté un fichier antérieur en le qualifiant de
"slope IA" et "vibecodé". Les symptômes typiques du vibecode qu'il
faut éviter :

1. **Trop d'éléments décoratifs** qui compensent l'absence de vraie idée UX
2. **Hiérarchie visuelle plate** — tout gueule au même volume
3. **Backdrop-filter blur généralisé** sur tous les panels
4. **Numérotation silkscreen partout** (01/02/03) sans utilité
5. **LEDs et badges de statut** pour "faire tech"
6. **Effets d'animation** partout (pulse, rotate chevron, cubic-bezier)
7. **Emojis techniques** dans l'interface
8. **Palette qui fait techno-futur** (lime toxique, cyan électrique)

Le bon test : est-ce que ce détail visuel sert un besoin utilisateur
ou est-ce qu'il essaie de compenser un manque de concept ?

## Conventions de commit

Format libre, en français, court et descriptif. Exemples :
- `basemap: fix cassini tilematrixset`
- `ui: reduce search bar size`
- `contours: switch to raster fallback`

## Workflow Claude Code recommandé

1. Lire ce fichier au démarrage de chaque session
2. Consulter l'état actuel avec `git status` et lire `index.html`
3. Poser des questions de clarification avant toute grosse refonte visuelle
4. Proposer un plan avant de coder, faire valider les intentions
5. Commit fréquemment avec des messages courts
6. Push manuel — laisser l'utilisateur push quand il est prêt

## Ce qu'Andrea aime dans une réponse

- Court et direct au but
- Pas d'excès d'emojis
- Pas d'expressions "Great question!" ou "You're absolutely right!"
- Explications quand nécessaires, pas systématiques
- Français dans les conversations, code en anglais (variables, commits)
- Empathie pour les erreurs communes (indentation, caractères invisibles
  copiés depuis le chat)

## Pour finir

Ce projet est un plaisir partagé, pas un livrable pro. L'ambition est
qu'il soit à la fois **beau à regarder** et **utile en vacances**.
Le bon vibe c'est "je montre à mes potes → ils veulent la même pour
leur prochain voyage".
# Drôme · Diois — carte de vacances

Carte web interactive du territoire autour d'Aouste-sur-Sye (Drôme), pour un
groupe d'amis. Fonds IGN, courbes de niveau, sentiers GR, POI (baignade,
monuments, points de vue, commerces), géolocalisation, recherche.

**En ligne :** https://braccialisme.github.io/Drome_map/

## Lancer en local

Une simple ouverture du fichier en `file://` **casse les labels** (le navigateur
bloque le chargement des polices locales). Il faut un mini serveur :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Important à savoir

- **Un seul fichier** : `index.html` (HTML + CSS + JS inline). Pas de build,
  pas de framework, pas de `npm install`.
- **Hors-ligne** : un Service Worker (`sw.js`) garde en cache l'app + les tuiles
  déjà consultées pendant 30 jours. Actif seulement en https (GitHub Pages) ou
  localhost, pas en `file://`.
- **Police** : VG5000 (Velvetyne), glyphs auto-hébergés dans `fonts/VG5000/`.
- **`data/` est ignoré par git** (contient un geojson de ~250 Mo, local seulement).
- **Modifs pas visibles après un push ?** Le Service Worker peut servir l'ancienne
  page une fois. Desktop : DevTools → Application → Service Workers → *Unregister*
  puis recharge. Mobile : fermer l'onglet et rouvrir.

## Données

- Fonds & courbes : [IGN Géoplateforme](https://data.geopf.fr) (WMTS / tuiles vectorielles, sans clé)
- Sentiers : [Waymarked Trails](https://waymarkedtrails.org)
- POI : [Overpass / OpenStreetMap](https://overpass-api.de) (cache navigateur 30 jours)
- Recherche : [Nominatim](https://nominatim.openstreetmap.org)

## Stack

HTML/CSS/JS pur · [MapLibre GL JS](https://maplibre.org) 4.7.1 · GitHub Pages

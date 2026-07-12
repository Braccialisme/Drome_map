#!/usr/bin/env bash
# Fabrique la plaque NEUTRE du panneau Fond depuis un render Figma v3.
# Neutre = toutes touches sombres, toutes LED éteintes, zéro texte baked.
# Les états (sélection orange / LED allumée) sont posés en overlay par le moteur.
# Usage: tools/build-fond-plate.sh src/renders/v3/Fond.png
set -euo pipefail
SRC="${1:-src/renders/v3/Fond.png}"
OUT="assets/ui/panel-fond-plate.png"
UI="assets/ui"
PLATE='#dedede'
# Boîtes touches natives (mesurées par connected-components) : 152x158
SAT_X=428; SAT_Y=299; KW=152; KH=158
# LED baked du Sat (orange) à éteindre
SATLED_X=421; SATLED_Y=471; LED=22

convert "$SRC" \
  -fill "$PLATE" \
  `# 1) couvre les 9 sous-labels baked (PITCH/TIME)` \
  -draw "rectangle 452,464 572,496"  -draw "rectangle 695,464 815,496"  -draw "rectangle 938,464 1058,496" \
  -draw "rectangle 452,707 572,739"  -draw "rectangle 695,707 815,739"  -draw "rectangle 938,707 1058,739" \
  -draw "rectangle 452,947 572,979"  -draw "rectangle 695,947 815,979"  -draw "rectangle 938,947 1058,979" \
  `# 2) touche Sat orange -> touche sombre (vraie art key.png)` \
  \( "$UI/key.png" -resize ${KW}x${KH}\! \) -geometry +${SAT_X}+${SAT_Y} -compose over -composite \
  `# 3) LED orange baked du Sat -> LED éteinte` \
  \( "$UI/led-off.png" -resize ${LED}x${LED} \) -geometry +${SATLED_X}+${SATLED_Y} -compose over -composite \
  `# 4) crop la plaque (drop bord sombre + alpha bas)` \
  -crop 1125x1067+61+56 +repage \
  "$OUT"
echo "→ $OUT"
identify -format '%f %wx%h\n' "$OUT"

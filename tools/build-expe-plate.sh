#!/usr/bin/env bash
# Plaque NEUTRE du panneau Expe depuis un render Figma v3 (Azimut.png).
# Neutre = touches sombres, LED éteintes, "FX" baked couvert. Knob conservé.
set -euo pipefail
SRC="${1:-src/renders/v3/Azimut.png}"
OUT="assets/ui/panel-expe-plate.png"
UI="assets/ui"; PLATE='#dedede'
KX=473; KY=307; KW=152; KH=158      # touche orange top-left grille
KLED_X=466; KLED_Y=480; LED=22       # LED orange baked sous elle
convert "$SRC" \
  -fill "$PLATE" \
  `# couvre "FX" baked (gros label plaque)` \
  -draw "rectangle 150,430 320,560" \
  `# touche orange -> sombre (art key.png)` \
  \( "$UI/key.png" -resize ${KW}x${KH}\! \) -geometry +${KX}+${KY} -compose over -composite \
  `# LED orange -> éteinte` \
  \( "$UI/led-off.png" -resize ${LED}x${LED} \) -geometry +${KLED_X}+${KLED_Y} -compose over -composite \
  -crop 1124x1067+66+56 +repage "$OUT"
echo "→ $OUT"; identify -format '%f %wx%h\n' "$OUT"

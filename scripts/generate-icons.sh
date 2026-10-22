#!/usr/bin/env bash
# Generates all launcher / splash / store imagery from a single vector-ish
# recipe so the brand can be re-themed by editing the variables below.
# Requires ImageMagick 6+ (`convert`). Run from the repo root:
#   bash scripts/generate-icons.sh
set -euo pipefail

APP_NAME="${APP_NAME:-Yearborn}"
TAGLINE="${TAGLINE:-Live a thousand lives}"
BG_FROM="${BG_FROM:-#4338CA}"   # indigo-700
BG_TO="${BG_TO:-#7C3AED}"       # violet-600
GLYPH_COLOR="${GLYPH_COLOR:-#FFFFFF}"
ACCENT="${ACCENT:-#A3E635}"     # lime-400
FONT_GLYPH="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_TEXT="/usr/share/fonts/opentype/inter/Inter-Bold.otf"
[ -f "$FONT_TEXT" ] || FONT_TEXT="$FONT_GLYPH"

OUT=assets/images
STORE=store
mkdir -p "$OUT" "$STORE"

bg() { # $1 size
  convert -size "$1x$1" -define gradient:angle=135 "gradient:${BG_FROM}-${BG_TO}" png:-
}

glyph() { # $1 canvas size, $2 glyph box size, $3 line color  -> transparent PNG: an accent sun rising over the horizon
  # Drawn in a unit box centred on (0.5, 0.52). Every point lies within 0.46 of the box size from
  # the centre, so a box of up to 0.65 x the canvas stays inside Android's adaptive-icon safe circle.
  local mvg
  mvg=$(awk -v S="$1" -v U="$2" -v C="$3" -v SUN="$ACCENT" 'BEGIN {
    pi = atan2(0, -1); ox = S / 2 - U / 2; oy = S / 2 - U * 0.52
    hy = 0.66; r = 0.20
    printf "fill %s stroke none\n", SUN
    printf "path \047M %.2f,%.2f A %.2f,%.2f 0 0,1 %.2f,%.2f Z\047\n", ox + (0.5 - r) * U, oy + hy * U, r * U, r * U, ox + (0.5 + r) * U, oy + hy * U
    printf "fill none stroke %s stroke-width %.2f stroke-linecap round\n", C, 0.058 * U
    printf "line %.2f,%.2f %.2f,%.2f\n", ox + 0.10 * U, oy + hy * U, ox + 0.90 * U, oy + hy * U
    printf "line %.2f,%.2f %.2f,%.2f\n", ox + 0.30 * U, oy + 0.785 * U, ox + 0.70 * U, oy + 0.785 * U
    n = split("90 50 130 12 168", deg, " ")
    for (i = 1; i <= n; i++) {
      t = deg[i] * pi / 180
      printf "line %.2f,%.2f %.2f,%.2f\n", ox + (0.5 + 0.285 * cos(t)) * U, oy + (hy - 0.285 * sin(t)) * U, ox + (0.5 + 0.385 * cos(t)) * U, oy + (hy - 0.385 * sin(t)) * U
    }
  }')
  convert -size "$1x$1" xc:none -draw "$mvg" png:-
}

# 1. Main app icon (1024x1024, no alpha, square — stores apply their own masks)
bg 1024 > /tmp/_bg.png
glyph 1024 900 "$GLYPH_COLOR" > /tmp/_glyph.png
convert /tmp/_bg.png /tmp/_glyph.png -composite -background "$BG_FROM" -alpha remove -alpha off "$OUT/icon.png"

# 2. Android adaptive icon layers (1024x1024; keep glyph inside the 66% safe zone)
bg 1024 > "$OUT/android-icon-background.png"
glyph 1024 620 "$GLYPH_COLOR" > "$OUT/android-icon-foreground.png"
glyph 1024 620 "#FFFFFF" | convert - -fill white -colorize 100% "$OUT/android-icon-monochrome.png"

# 3. Splash icon (transparent, shown on a solid background by expo-splash-screen)
glyph 512 440 "$GLYPH_COLOR" > "$OUT/splash-icon.png"

# 4. Favicon
convert "$OUT/icon.png" -resize 48x48 "$OUT/favicon.png"

# 5. Store assets
convert "$OUT/icon.png" -resize 512x512 "$STORE/play-icon-512.png"
cp "$STORE/play-icon-512.png" "$STORE/site/icon-512.png"   # the website icon (store/site/README.md)
convert -size 1024x500 -define gradient:angle=160 "gradient:${BG_FROM}-${BG_TO}" \
  \( "$OUT/icon.png" -resize 300x300 \) -gravity west -geometry +80+0 -composite \
  -gravity west -font "$FONT_TEXT" -pointsize 92 -fill white -annotate +420-45 "$APP_NAME" \
  -pointsize 38 -fill "#E0E7FF" -annotate +424+45 "$TAGLINE" \
  -background "$BG_FROM" -alpha remove -alpha off "$STORE/play-feature-graphic-1024x500.png"   # Play wants 24-bit PNG, no alpha

rm -f /tmp/_bg.png /tmp/_glyph.png
echo "Generated:"; ls -la "$OUT" "$STORE"

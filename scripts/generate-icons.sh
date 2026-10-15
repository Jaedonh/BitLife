#!/usr/bin/env bash
# Generates all launcher / splash / store imagery from a single vector-ish
# recipe so the brand can be re-themed by editing the variables below.
# Requires ImageMagick 6+ (`convert`). Run from the repo root:
#   bash scripts/generate-icons.sh
set -euo pipefail

APP_NAME="${APP_NAME:-LifeLoop}"
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

glyph() { # $1 canvas size, $2 pointsize, $3 color  -> transparent PNG with the ∞ glyph + accent dot
  convert -size "$1x$1" xc:none -gravity center \
    -font "$FONT_GLYPH" -pointsize "$2" -fill "$3" -annotate +0-$(( $1 / 28 )) "∞" \
    -fill "$ACCENT" -draw "circle $(( $1 / 2 )),$(( $1 * 2 / 3 )) $(( $1 / 2 )),$(( $1 * 2 / 3 + $1 / 26 ))" \
    png:-
}

# 1. Main app icon (1024x1024, no alpha, square — stores apply their own masks)
bg 1024 > /tmp/_bg.png
glyph 1024 760 "$GLYPH_COLOR" > /tmp/_glyph.png
convert /tmp/_bg.png /tmp/_glyph.png -composite -background "$BG_FROM" -alpha remove -alpha off "$OUT/icon.png"

# 2. Android adaptive icon layers (1024x1024; keep glyph inside the 66% safe zone)
bg 1024 > "$OUT/android-icon-background.png"
glyph 1024 520 "$GLYPH_COLOR" > "$OUT/android-icon-foreground.png"
glyph 1024 520 "#FFFFFF" | convert - -fill white -colorize 100% "$OUT/android-icon-monochrome.png"

# 3. Splash icon (transparent, shown on a solid background by expo-splash-screen)
glyph 512 380 "$GLYPH_COLOR" > "$OUT/splash-icon.png"

# 4. Favicon
convert "$OUT/icon.png" -resize 48x48 "$OUT/favicon.png"

# 5. Store assets
convert "$OUT/icon.png" -resize 512x512 "$STORE/play-icon-512.png"
convert -size 1024x500 -define gradient:angle=160 "gradient:${BG_FROM}-${BG_TO}" \
  \( "$OUT/icon.png" -resize 300x300 \) -gravity west -geometry +80+0 -composite \
  -gravity west -font "$FONT_TEXT" -pointsize 92 -fill white -annotate +420-45 "$APP_NAME" \
  -pointsize 38 -fill "#E0E7FF" -annotate +424+45 "$TAGLINE" \
  "$STORE/play-feature-graphic-1024x500.png"

rm -f /tmp/_bg.png /tmp/_glyph.png
echo "Generated:"; ls -la "$OUT" "$STORE"

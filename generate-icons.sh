#!/bin/bash

set -e

file="${1}";
sizes="16x16 24x24 32x32 44x44 48x48 50x50 57x57 72x72 76x76 88x88 96x96 114x114 120x120 144x144 150x150 152x152 180x180 192x192 196x196 300x300 1024x1024";

echo "Generating different pngs"

for size in ${sizes}; do
  echo "Generating ${size}"
  convert "${file}" -resize "${size}" "favicon-${size}.png";
done

extent_sizes="620x300 1240x600"

for size in ${extent_sizes}; do
  echo "Generating ${size}"
  convert "${file}" -transparent white -resize "${size}" "favicon-${size}.png";
  convert "favicon-${size}.png" -background white -gravity center -extent "${size}" -flatten "favicon-${size}.png";
done

echo "Generating favicon.ico"

convert -background white "${file}" -define icon:auto-resize=16,24,32,48,64 "favicon.ico"

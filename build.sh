#!/bin/bash
# =====================================================
# OrderFlow Build Script - v137
# Samler index.html, styles.css og app.js til én fil
# =====================================================

OUTPUT="OrderFlow-complete.html"

echo "🔨 Bygger $OUTPUT..."

awk '
  /<link rel="stylesheet" href="styles.css">/ {
    print "<style>"
    while ((getline line < "styles.css") > 0) print line
    close("styles.css")
    print "</style>"
    next
  }
  /<script src="app.js"><\/script>/ {
    print "<script>"
    while ((getline line < "app.js") > 0) print line
    close("app.js")
    print "</script>"
    next
  }
  { print }
' index.html > "$OUTPUT"

# Vis resultat
SIZE=$(du -h "$OUTPUT" | cut -f1)
LINES=$(wc -l < "$OUTPUT")

echo "✅ Færdig: $OUTPUT ($SIZE, $LINES linjer)"
echo ""
echo "Kør preview med:"
echo "  python3 -m http.server 8000"
echo "  Åbn: http://localhost:8000/$OUTPUT"

#!/bin/bash
# Apply Owner.com design refinements to company landing pages
# Fase 1: 5 company sider

LANDING_DIR="/data/.openclaw/workspace/flow-dev/landing-pages"
FILES=("om-os.html" "ledelse.html" "karriere.html" "partner.html" "presse.html")

for file in "${FILES[@]}"; do
  filepath="$LANDING_DIR/$file"
  echo "Processing: $file"
  
  # 1. Footer background: #000 → #090a0b (near-black, Owner-matched)
  sed -i 's/\.footer { background: var(--color-black);/.footer { background: var(--color-dark);/g' "$filepath"
  
  # 2. Heading weights: 700 → 500 (medium, Owner pattern) in heading contexts
  # Be careful: only change heading-related font-weight, not nav or button weights
  sed -i 's/\.section-intro h2 { font-size: [^;]*; font-weight: 600;/.section-intro h2 { font-size: 4rem; font-weight: 500;/g' "$filepath"
  sed -i 's/\.hero-content h1 {[^}]*font-weight: [46]00;/&/g' "$filepath"
  
  # 3. Add letter-spacing to headings (Owner premium feel)
  sed -i 's/\.hero-content h1 { font-family: '\''Inter'\'', sans-serif; font-size: \([^;]*\); font-weight: \([^;]*\); color/\.hero-content h1 { font-family: '\''Inter'\'', sans-serif; font-size: \1; font-weight: \2; letter-spacing: -0.028em; color/g' "$filepath"
  sed -i 's/\.section-intro h2 { font-size: \([^;]*\); font-weight: \([^;]*\); color/\.section-intro h2 { font-size: \1; font-weight: \2; letter-spacing: -0.02em; color/g' "$filepath"
  
  # 4. Card border-radius: ensure 2rem (rounded, Owner-matched) - already 2rem on stat-card
  
  # 5. Value card h3: weight 600 → 500
  sed -i 's/\.value-card h3 { font-size: \([^;]*\); font-weight: 600;/.value-card h3 { font-size: \1; font-weight: 500;/g' "$filepath"
  
  # 6. CTA section h2: weight 600 → 500
  sed -i 's/\.cta-content h2 { font-size: \([^;]*\); font-weight: 600;/.cta-content h2 { font-size: \1; font-weight: 500; letter-spacing: -0.02em;/g' "$filepath"
  
  # 7. stat-number weight: 700 → 600 (slightly refined)
  sed -i 's/\.stat-number { font-size: \([^;]*\); font-weight: 700;/.stat-number { font-size: \1; font-weight: 600;/g' "$filepath"
  
  # 8. dropdown-link-title weight: 700 → 600
  sed -i 's/\.dropdown-link-title { font-size: \([^;]*\); font-weight: 700;/.dropdown-link-title { font-size: \1; font-weight: 600;/g' "$filepath"
  
  # 9. dropdown-link-desc weight: 600 → 400 (body text should be regular)
  sed -i 's/\.dropdown-link-desc { font-size: \([^;]*\); font-weight: 600;/.dropdown-link-desc { font-size: \1; font-weight: 400;/g' "$filepath"
  
  echo "  Done: $file"
done

echo ""
echo "All files processed. Run QA checks next."

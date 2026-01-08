#!/bin/bash
# =====================================================
# OrderFlow Start Script - v137
# Starter live-server med auto-reload
# =====================================================

echo "🚀 Starter OrderFlow udvikling..."
echo ""
echo "✅ Åbner http://localhost:8080"
echo "   Auto-reload er aktivt"
echo ""
echo "   Tryk Ctrl+C for at stoppe"
echo ""

npx live-server --port=8080 --open=index.html

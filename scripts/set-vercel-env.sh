#!/bin/bash
# Script to set all required environment variables in Vercel
# Usage: ./scripts/set-vercel-env.sh

set -e

echo "🔧 Vercel Environment Variables Setup"
echo "======================================"
echo ""

# Check if VERCEL_TOKEN is set
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN not found!"
  echo ""
  echo "To get your token:"
  echo "1. Go to https://vercel.com/account/tokens"
  echo "2. Create a new token"
  echo "3. Run: export VERCEL_TOKEN='your-token-here'"
  echo ""
  exit 1
fi

# Project ID (from vercel.json or Vercel dashboard)
PROJECT_ID="prj_FwUTHpvLW0hLOqRuNLZHfO5uTwIf"

echo "📋 Please enter your Supabase credentials:"
echo ""

# Get Supabase URL
read -p "SUPABASE_URL (https://qymtjhzgtcittohutmay.supabase.co): " SUPABASE_URL
SUPABASE_URL=${SUPABASE_URL:-https://qymtjhzgtcittohutmay.supabase.co}

# Get Supabase Service Role Key
echo ""
read -p "SUPABASE_SERVICE_ROLE_KEY (find in Supabase Dashboard → Settings → API): " SUPABASE_SERVICE_ROLE_KEY

# Get Supabase Anon Key
echo ""
read -p "SUPABASE_ANON_KEY (find in Supabase Dashboard → Settings → API): " SUPABASE_ANON_KEY

echo ""
echo "🚀 Setting environment variables..."
echo ""

# Function to set environment variable for all environments
set_env_var() {
  local key=$1
  local value=$2

  echo "Setting $key..."

  # Set for Production, Preview, and Development
  curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key\": \"$key\",
      \"value\": \"$value\",
      \"type\": \"encrypted\",
      \"target\": [\"production\", \"preview\", \"development\"]
    }" \
    --silent --output /dev/null

  if [ $? -eq 0 ]; then
    echo "✅ $key set successfully"
  else
    echo "❌ Failed to set $key"
  fi
}

# Set all variables
set_env_var "SUPABASE_URL" "$SUPABASE_URL"
set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
set_env_var "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"

echo ""
echo "✅ All environment variables set!"
echo ""
echo "⚠️  IMPORTANT: You must REDEPLOY for changes to take effect"
echo "   Go to: https://vercel.com/dashboard"
echo "   Click 'Redeploy' on the latest deployment"
echo ""

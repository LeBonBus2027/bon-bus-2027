#!/usr/bin/env bash
# Mise en ligne sur Cloudflare (Workers, fichiers statiques seulement ; configuration dans wrangler.jsonc).
# Première fois : npx wrangler@4.145.0 login --scopes account:read user:read workers:write workers_scripts:write
# Usage : npm run cloudflare              → version d'essai, servie en local seulement (pas d'adresse de prévisualisation publique)
#         npm run cloudflare -- --prod    → site public, après la vérification complète
# Variable : VITE_SITE_URL (adresse publique définitive, pour l'image d'aperçu des liens partagés).
set -euo pipefail
cd "$(dirname "$0")/.."
WRANGLER="wrangler@4.145.0"   # version figée (publiée il y a plus de deux semaines), jamais « latest »
export WRANGLER_SEND_METRICS=false
if [[ "${1:-}" == "--prod" ]]; then
  npm run verifier
  npx vite build
  npx --yes "$WRANGLER" deploy
else
  npx vite build
  npx vite preview
fi

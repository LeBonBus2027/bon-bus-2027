#!/usr/bin/env bash
# Mise en ligne sur Cloudflare Pages (envoi direct du dossier dist, sans passer par GitHub).
# Première fois : npx wrangler@4.145.0 login, puis
#                 npx wrangler@4.145.0 pages project create bon-bus-2027 --production-branch main
# Usage : npm run cloudflare              → version d'essai (adresse de prévisualisation)
#         npm run cloudflare -- --prod    → site public, après la vérification complète
# Variables : CF_PROJET (nom du projet, bon-bus-2027 par défaut), VITE_SITE_URL (adresse publique définitive).
set -euo pipefail
cd "$(dirname "$0")/.."
WRANGLER="wrangler@4.145.0"   # version figée (publiée il y a plus de deux semaines), jamais « latest »
PROJET="${CF_PROJET:-bon-bus-2027}"
BRANCHE="essai"
if [[ "${1:-}" == "--prod" ]]; then
  BRANCHE="main"
  npm run verifier
fi
VITE_SITE_URL="${VITE_SITE_URL:-https://$PROJET.pages.dev}" npx vite build
npx --yes "$WRANGLER" pages deploy dist --project-name "$PROJET" --branch "$BRANCHE" --commit-dirty=true

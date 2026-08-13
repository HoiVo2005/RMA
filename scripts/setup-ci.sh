#!/usr/bin/env bash
set -euo pipefail

# setup-ci.sh
# Usage:
# NEXT_PUBLIC_SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." bash scripts/setup-ci.sh
# Requires: gh CLI installed and authenticated (gh auth login)

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/ and login with 'gh auth login'"
  exit 1
fi

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "You must provide NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as environment variables."
  echo "Example: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bash scripts/setup-ci.sh"
  exit 1
fi

REPO_FULL=$(git config --get remote.origin.url || true)
if [ -z "$REPO_FULL" ]; then
  echo "Cannot determine git remote URL. Run from repo clone with origin remote set."
  exit 1
fi

echo "Setting GitHub repo secrets..."
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "$NEXT_PUBLIC_SUPABASE_URL"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$SUPABASE_SERVICE_ROLE_KEY"

echo "Secrets set. Triggering workflows (apply-supabase-schema and ingest-transfers)..."
# Trigger apply-supabase-schema workflow dispatch
gh workflow run apply-supabase-schema.yml --ref main || true
# Trigger ingest transfers workflow dispatch
gh workflow run ingest-transfers.yml --ref main || true

echo "Done. Check Actions tab on GitHub for run logs."

#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install and authenticate with 'gh auth login'"
  exit 1
fi

WORKFLOWS=(apply-supabase-schema.yml ingest-transfers.yml)
for wf in "${WORKFLOWS[@]}"; do
  echo "--- Logs for $wf ---"
  # get most recent run id
  run_id=$(gh run list --workflow "$wf" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)
  if [ -z "$run_id" ]; then
    echo "No recent run found for $wf"
    continue
  fi
  gh run view "$run_id" --log-failed --repo "$(git config --get remote.origin.url | sed -E 's|.*[:/]{2}(.+/.+)\.git$|\1|')" --logs --output - || gh run view "$run_id" --logs
done

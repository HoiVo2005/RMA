# CI & Ingest Setup

This file explains how to configure CI (GitHub Actions) and run the transfer ingest pipeline locally.

1. Required secrets (GitHub Actions / Local `.env`)

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (e.g. `https://xyz.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (from Project → API → Service key)
- (optional) `TWITTER_BEARER_TOKEN` — Twitter API v2 Bearer token to ingest tweets

2. Run locally

```bash
cp .env.example .env
# edit .env and paste your values
npm ci
# apply migrations locally
node ./scripts/apply-supabase-schema.js
# run ingest (uses tsx installed in devDependencies)
npx tsx scripts/ingest-transfers.ts
```

3. One-line GitHub setup (using `gh` CLI)

```bash
NEXT_PUBLIC_SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." bash scripts/setup-ci.sh
```

4. What the workflows do

- `apply-supabase-schema.yml` — runs on push to `main` and applies all `.sql` files under `supabase/`.
- `ingest-transfers.yml` — scheduled job (daily) that runs `scripts/ingest-transfers.ts` and upserts into `transfers_events` table.

5. Vercel build-time migration (optional)

If you prefer running migrations during Vercel deploys instead of GitHub Actions, set the same environment variables in your Vercel Project Settings (Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Then set the project's **Build Command** to:

```
npm run vercel-build
```

This will run `next build` and then `node ./scripts/apply-supabase-schema.js` during deploy. Warning: this will execute on every deploy and requires the Service Role key to be available during build (security consideration).

6. Debugging

- Check Actions → workflow run → open steps `Debug info` and `Run ingest-transfers script` for logs.
- If a workflow fails due to missing secrets, set the required secrets in repository Settings → Secrets.

7. Fetch recent workflow logs using `gh` (helper)

You can retrieve the last run logs for the main workflows with the helper script:

```bash
bash scripts/get-workflow-logs.sh
```

The script requires `gh` CLI authenticated and will print logs for `apply-supabase-schema.yml` and `ingest-transfers.yml`.

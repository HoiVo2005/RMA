const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
    const { data, error } = await db.from('fixtures').select('home_team,away_team,home_logo_url,away_logo_url');
    if (error) {
        console.error('Supabase error:', error.message);
        process.exit(1);
    }

    const missingTeams = new Map();
    for (const r of data || []) {
        if (!r.home_logo_url && r.home_team) missingTeams.set(r.home_team, (missingTeams.get(r.home_team) || 0) + 1);
        if (!r.away_logo_url && r.away_team) missingTeams.set(r.away_team, (missingTeams.get(r.away_team) || 0) + 1);
    }

    const sorted = Array.from(missingTeams.entries()).sort((a, b) => b[1] - a[1]);
    console.log(JSON.stringify(sorted, null, 2));
})();

import fs from 'fs';
import path from 'path';
import { load } from 'cheerio';
import { createSupabaseAdmin } from '../lib/supabase';

type MatchData = {
    source: string;
    url: string;
    raw?: any;
    extracted?: any;
    fetchedAt: string;
};

async function fetchHtml(url: string) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'madridista-news-bot/1.0 (+https://github.com)'
        }
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return await res.text();
}

function parseJsonLd(html: string) {
    const $ = load(html);
    const scripts = $('script[type="application/ld+json"]');
    const results: any[] = [];
    scripts.each((_, el) => {
        try {
            const txt = $(el).contents().text();
            if (!txt) return;
            const j = JSON.parse(txt);
            if (Array.isArray(j)) results.push(...j);
            else results.push(j);
        } catch (e) {
            // ignore parse errors
        }
    });
    return results;
}

async function extractMatch(url: string): Promise<MatchData> {
    const html = await fetchHtml(url);
    const jsonld = parseJsonLd(html);
    // Prefer SportsEvent objects from JSON-LD
    const sports = jsonld.find((o: any) => o && (o['@type'] === 'SportsEvent' || o['@type'] === 'Match'));
    const out: MatchData = {
        source: 'sofascore',
        url,
        raw: jsonld,
        extracted: sports || jsonld,
        fetchedAt: new Date().toISOString()
    };
    return out;
}

async function saveToSupabase(items: MatchData[]) {
    const supabase = createSupabaseAdmin();
    // expects a table `sofascore_matches` with at least columns: url (text, pk), source, payload (jsonb), fetched_at (timestamptz)
    const rows = items.map((it) => ({
        url: it.url,
        source: it.source,
        payload: it.extracted || it.raw,
        fetched_at: it.fetchedAt
    }));

    const { data, error } = await supabase.from('sofascore_matches').upsert(rows, { onConflict: 'url' });
    if (error) {
        throw error;
    }
    return data;
}

async function run() {
    // config: either pass a file `scripts/sofascore-urls.txt` with URLs, or set SOFASCORE_URLS env (comma-separated)
    const envList = process.env.SOFASCORE_URLS;
    let urls: string[] = [];
    if (envList) urls = envList.split(',').map(s => s.trim()).filter(Boolean);
    const filePath = path.resolve(__dirname, 'sofascore-urls.txt');
    if (urls.length === 0 && fs.existsSync(filePath)) {
        const txt = fs.readFileSync(filePath, 'utf-8');
        urls = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }

    if (urls.length === 0) {
        console.error('No Sofascore URLs provided. Create `scripts/sofascore-urls.txt` or set SOFASCORE_URLS env.');
        process.exit(1);
    }

    const results: MatchData[] = [];
    for (const u of urls) {
        try {
            console.log('Fetching', u);
            const item = await extractMatch(u);
            results.push(item);
        } catch (e: any) {
            console.error('Error fetching', u, e.message || e);
        }
    }

    // Save to Supabase if possible
    try {
        console.log('Saving to Supabase...');
        const saved = await saveToSupabase(results);
        console.log('Saved', Array.isArray(saved) ? saved.length : 0);
    } catch (e: any) {
        console.error('Supabase save failed:', e.message || e);
        // fallback: write local JSON
        const outPath = path.resolve(__dirname, `sofascore-matches-${Date.now()}.json`);
        fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
        console.log('Wrote fallback file', outPath);
    }
}

if (require.main === module) {
    run().catch(e => {
        console.error(e);
        process.exit(1);
    });
}

export { };

import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import fetch from 'node-fetch';
import { createSupabaseAdmin } from '../lib/supabase';

type SourceSpec = { url: string; name?: string; weight?: number };

const DEFAULT_SOURCES: SourceSpec[] = [
    { url: 'https://feeds.feedburner.com/FabrizioRomano', name: 'Fabrizio Romano', weight: 1.0 },
];

function detectStage(title: string, content?: string) {
    const t = `${title} ${content ?? ''}`.toLowerCase();
    if (t.includes('official') || t.includes('chính thức') || t.includes('confirmed')) return 'official';
    if (t.includes('negot') || t.includes('đàm phán') || t.includes('agree') || t.includes('sắp ký')) return 'negotiation';
    return 'rumour';
}

async function readSourcesFile(): Promise<SourceSpec[]> {
    const p = path.join(process.cwd(), 'scripts', 'transfers-sources.txt');
    try {
        const txt = await fs.promises.readFile(p, 'utf-8');
        return txt
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .map((url) => ({ url }));
    } catch (e) {
        return DEFAULT_SOURCES;
    }
}

async function readTwitterFile(): Promise<string[]> {
    const p = path.join(process.cwd(), 'scripts', 'transfers-twitter.txt');
    try {
        const txt = await fs.promises.readFile(p, 'utf-8');
        return txt
            .split(/\r?\n/)
            .map((l) => l.trim().replace(/^@/, ''))
            .filter(Boolean);
    } catch (e) {
        return [];
    }
}

async function fetchTweetsForUser(username: string, bearer?: string) {
    if (!bearer) return [];
    try {
        const url = `https://api.twitter.com/2/tweets/search/recent?query=from:${encodeURIComponent(username)}&tweet.fields=created_at&max_results=10`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${bearer}` } });
        if (!res.ok) {
            console.error('Twitter API error', username, res.status, await res.text());
            return [];
        }
        const data = await res.json();
        return (data.data || []).map((t: any) => ({ id: t.id, text: t.text, created_at: t.created_at }));
    } catch (err) {
        console.error('Failed to fetch tweets for', username, err);
        return [];
    }
}

async function upsertEvents(events: any[]) {
    try {
        const supabase = createSupabaseAdmin();
        for (const ev of events) {
            const { data, error } = await supabase
                .from('transfers_events')
                .upsert(ev, { onConflict: 'url' });
            if (error) console.error('Supabase upsert error', error);
        }
    } catch (err) {
        console.error('Supabase client not available, writing fallback file', err);
        const out = path.join(process.cwd(), `transfers-events-fallback-${Date.now()}.json`);
        await fs.promises.writeFile(out, JSON.stringify(events, null, 2), 'utf-8');
    }
}

async function run() {
    const parser = new Parser();
    const sources = await readSourcesFile();
    const allEvents: any[] = [];
    // optionally ingest Twitter
    const twitterUsers = await readTwitterFile();
    const twitterToken = process.env.TWITTER_BEARER_TOKEN;
    for (const u of twitterUsers) {
        const tweets = await fetchTweetsForUser(u, twitterToken);
        for (const t of tweets) {
            const url = `https://twitter.com/${u}/status/${t.id}`;
            const title = (t.text || '').split('\n')[0];
            const content = t.text || '';
            const published_at = t.created_at ? new Date(t.created_at).toISOString() : null;
            const stage = detectStage(title, content);
            const confidence = 0.6 * (stage === 'official' ? 1.0 : stage === 'negotiation' ? 0.8 : 0.5);
            const topic = title.split(/[-–|:—]/)[0].trim();
            allEvents.push({ topic, actor: u, content: `${title}\n${content}`.trim(), url, source: `twitter:${u}`, stage, confidence, published_at, raw: t });
        }
    }

    for (const s of sources) {
        try {
            const feed = await parser.parseURL(s.url);
            for (const item of feed.items || []) {
                const url = item.link || item.guid || item.id || '';
                const title = item.title || '';
                const content = item.contentSnippet || item.content || item.summary || '';
                const published_at = item.isoDate ? new Date(item.isoDate).toISOString() : null;
                const stage = detectStage(title, content);
                const confidence = (s.weight ?? 0.5) * (stage === 'official' ? 1.0 : stage === 'negotiation' ? 0.7 : 0.4);

                const topic = title.split(/[-–|:—]/)[0].trim();

                const event = {
                    topic,
                    actor: s.name ?? feed.title ?? 'unknown',
                    content: `${title}\n${content}`.trim(),
                    url,
                    source: s.name ?? feed.title ?? 'unknown',
                    stage,
                    confidence,
                    published_at,
                    raw: item,
                };
                allEvents.push(event);
            }
        } catch (e) {
            console.error('Failed to parse source', s.url, e);
        }
    }

    if (allEvents.length) {
        console.log(`Ingested ${allEvents.length} transfer events, upserting...`);
        await upsertEvents(allEvents);
        console.log('Done.');
    } else {
        console.log('No events found.');
    }
}

if (require.main === module) {
    run().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

export default run;

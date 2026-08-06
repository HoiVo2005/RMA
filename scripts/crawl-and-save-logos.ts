import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        if (!key) continue;
        const value = rest.join('=').trim();
        if (value === undefined) continue;
        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadEnvFile();

if (typeof (globalThis as any).fetch !== 'function') {
    throw new Error('Global fetch is not available. Run this script with Node 18+ or install node-fetch and update the script accordingly.');
}

import { parseClubStints, serializeClubStints } from '../lib/career';
import { getTeamBadgeUrl } from '../lib/sportsdb';
import { slugify } from '../lib/slug';

// Duplicate of normalizer from lib/sportsdb to compute canonical keys here
function normalizeStringKey(value: string): string {
    return value
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function stripNationalTeamAgeGroup(teamName: string): string {
    return teamName
        .replace(/\(.*?\)/g, '')
        .replace(/mượn/gi, '')
        .replace(/\b(?:u[-\s]?\d+|\d+[-\s]?u)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeTeamNameForBadge(teamName: string): string {
    if (!teamName) return '';
    let normalized = teamName.replace(/\(.*?\)/g, '').replace(/mượn/gi, '').trim();
    normalized = normalized.replace(/u[-\s]?(\d+)/gi, 'U$1');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized;
}

async function downloadToPublic(url: string, destRelative: string): Promise<void> {
    const destPath = path.join(process.cwd(), 'public', destRelative);
    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
}

async function main() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        console.error('Missing SUPABASE env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    // Collect team names from fixtures
    const { data: fixtures } = await db.from('fixtures').select('id, home_team, away_team, home_logo_url, away_logo_url');
    const teamSet = new Set<string>();
    for (const f of fixtures || []) {
        if (f.home_team) teamSet.add(String(f.home_team));
        if (f.away_team) teamSet.add(String(f.away_team));
    }

    // Also collect from players.career_clubs
    const { data: players } = await db.from('players').select('id, career_clubs');
    for (const p of players || []) {
        if (!p.career_clubs) continue;
        const stints = parseClubStints(p.career_clubs);
        for (const s of stints) {
            if (s.name) teamSet.add(s.name);
        }
    }

    const teams = Array.from(teamSet).filter(Boolean);
    console.log(`Found ${teams.length} distinct team name variants`);

    // Build canonical map
    const canonicalMap = new Map<string, string[]>();
    for (const t of teams) {
        const canon = normalizeStringKey(normalizeTeamNameForBadge(t));
        const arr = canonicalMap.get(canon) || [];
        arr.push(t);
        canonicalMap.set(canon, arr);
    }

    console.log(`Canonical keys: ${canonicalMap.size}`);

    const results: Array<{ canonical: string; badgeUrl: string | null; savedPath?: string }> = [];

    for (const [canon, variants] of canonicalMap.entries()) {
        const representative = variants[0];
        console.log('Searching badge for', representative);
        let badgeUrl: string | null = null;
        try {
            badgeUrl = await getTeamBadgeUrl(representative);
        } catch (e) {
            console.error('Error getTeamBadgeUrl', e);
        }

        if (badgeUrl) {
            try {
                const parsed = new URL(badgeUrl);
                const ext = path.extname(parsed.pathname).split('?')[0] || '.png';
                const fname = `${slugify(representative)}${ext}`;
                const relPath = path.posix.join('icons', fname);
                await downloadToPublic(badgeUrl, relPath);
                console.log('Saved', relPath);
                results.push({ canonical: canon, badgeUrl, savedPath: `/${relPath}` });

                // Update fixtures rows that match any variant
                for (const v of variants) {
                    // update home
                    const { error: e1 } = await db.from('fixtures').update({ home_logo_url: `/${relPath}` }).eq('home_team', v).is('home_logo_url', null);
                    if (e1) console.error('Fixture update home error', e1.message);
                    const { error: e2 } = await db.from('fixtures').update({ away_logo_url: `/${relPath}` }).eq('away_team', v).is('away_logo_url', null);
                    if (e2) console.error('Fixture update away error', e2.message);

                    // update career_clubs in players if present (replace matching club name lines)
                    const { data: matchedPlayers } = await db.from('players').select('id, career_clubs').like('career_clubs', `%${v}%`);
                    for (const mp of matchedPlayers || []) {
                        const stints = parseClubStints(mp.career_clubs);
                        let changed = false;
                        const next = stints.map((s) => {
                            if (s.name === v && !s.name.includes('/icons/')) {
                                changed = true;
                                // no image field in club stints format — skipping file URL in that column
                                return s;
                            }
                            return s;
                        });
                        if (changed) {
                            const { error: up } = await db.from('players').update({ career_clubs: serializeClubStints(next, false) }).eq('id', mp.id);
                            if (up) console.error('Error updating player career_clubs', up.message);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to save badge', e);
                results.push({ canonical: canon, badgeUrl, savedPath: undefined });
            }
        } else {
            console.log('No badge found for', representative);
            results.push({ canonical: canon, badgeUrl: null });
        }
    }

    // Write report
    const report = results.map((r) => ({ ...r }));
    fs.writeFileSync(path.join(process.cwd(), 'tmp-club-logo-report.json'), JSON.stringify(report, null, 2));
    console.log('Report written to tmp-club-logo-report.json');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

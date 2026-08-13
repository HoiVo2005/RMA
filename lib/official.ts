import { load, type CheerioAPI } from 'cheerio';

type Payload = {
    external_id: string | null;
    competition?: string | null;
    home_team?: string | null;
    away_team?: string | null;
    home_logo_url?: string | null;
    away_logo_url?: string | null;
    stadium?: string | null;
    match_time?: string | null;
    status?: string;
    home_score?: number | null;
    away_score?: number | null;
    events?: any[];
};

function safeText(el: ReturnType<CheerioAPI>) {
    return el && el.text ? el.text().trim() : '';
}

/**
 * Best-effort scraper for "official" fixture pages. Works heuristically across
 * different sites (Real Madrid, league pages). Returns a payload similar to
 * other fetchers or null if nothing found.
 */
export async function fetchFixtureFromOfficialUrl(url: string): Promise<Payload | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = load(html);

        // Try <time datetime>
        let time = $('time[datetime]').first().attr('datetime') || null;

        // Fallback: meta property
        if (!time) time = $('meta[property="article:published_time"]').attr('content') || null;

        // Title heuristics: look for "Team - Team" or "Team v Team"
        const title = $('title').first().text().trim() || '';
        let home: string | null = null;
        let away: string | null = null;
        const vsMatch = title.match(/(.+)\s+[-–—vvs]{1,3}\s+(.+)/i);
        if (vsMatch) {
            home = vsMatch[1].trim();
            away = vsMatch[2].trim();
        }

        // Try structured team blocks
        const teamBlocks = $('[class*="team"], [class*="side"], .team-name, .home, .away');
        if (!home || !away) {
            const names: string[] = [];
            teamBlocks.each((i, el) => {
                const t = $(el).text().trim();
                if (t) names.push(t);
            });
            if (names.length >= 2) {
                home = home || names[0];
                away = away || names[1];
            }
        }

        // Score heuristics
        let homeScore: number | null = null;
        let awayScore: number | null = null;
        const scoreSel = $('[class*="score"], .result, .match-score').first();
        if (scoreSel && scoreSel.text()) {
            const s = scoreSel.text().trim().match(/(\d+)\D+(\d+)/);
            if (s) {
                homeScore = parseInt(s[1], 10);
                awayScore = parseInt(s[2], 10);
            }
        }

        // Logos: look for imgs near team blocks
        let homeLogo: string | null = null;
        let awayLogo: string | null = null;
        try {
            const homeImg = $('[class*="home"] img, .team--home img, .home-team img').first();
            const awayImg = $('[class*="away"] img, .team--away img, .away-team img').first();
            if (homeImg && homeImg.attr('src')) homeLogo = homeImg.attr('src') || null;
            if (awayImg && awayImg.attr('src')) awayLogo = awayImg.attr('src') || null;
        } catch (e) {
            // ignore
        }

        // Competition / stadium
        const competition = $('meta[property="og:site_name"]').attr('content') || $('.competition, .tournament').first().text().trim() || null;
        const stadium = $('.venue, .stadium, .ground').first().text().trim() || null;

        const payload: Payload = {
            external_id: url,
            competition: competition || null,
            home_team: home || null,
            away_team: away || null,
            home_logo_url: homeLogo || null,
            away_logo_url: awayLogo || null,
            stadium: stadium || null,
            match_time: time || null,
            status: 'scheduled',
            home_score: homeScore,
            away_score: awayScore,
            events: [],
        };

        // Basic validation
        if (!payload.home_team || !payload.away_team || !payload.match_time) return null;
        return payload;
    } catch (e) {
        return null;
    }
}

export default fetchFixtureFromOfficialUrl;

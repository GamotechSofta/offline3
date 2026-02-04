/**
 * Market betting window: market opens at midnight (00:00) and closes at closing time each day.
 * Users can bet only between midnight and (closing time - betClosureTime).
 * Times are in "HH:MM" or "HH:MM:SS"; betClosureTime is seconds before closing when betting stops.
 * Uses server local time (assume market times are in same timezone as server).
 *
 * @param {Object} market - { closingTime, betClosureTime } (startingTime is not used for the betting window)
 * @param {Date} [now] - current time (default: new Date())
 * @returns {{ allowed: boolean, message?: string }}
 */
export function isBettingAllowed(market, now = new Date()) {
    const closeStr = (market?.closingTime || '').toString().trim();
    const betClosureSec = Number(market?.betClosureTime);
    const closureSec = Number.isFinite(betClosureSec) && betClosureSec >= 0 ? betClosureSec : 0;

    if (!closeStr) {
        return { allowed: false, message: 'Market timing not configured.' };
    }

    const openAt = startOfDay(now);
    let closeAt = parseTimeToDate(closeStr, now);
    if (!closeAt) {
        return { allowed: false, message: 'Invalid market time format.' };
    }

    if (closeAt.getTime() <= openAt.getTime()) {
        closeAt = new Date(closeAt);
        closeAt.setDate(closeAt.getDate() + 1);
    }

    const lastBetAt = new Date(closeAt.getTime() - closureSec * 1000);

    if (now.getTime() < openAt.getTime()) {
        return {
            allowed: false,
            message: 'Betting opens at 12:00 AM (midnight). You can place bets after midnight.',
        };
    }
    if (now.getTime() > lastBetAt.getTime()) {
        return {
            allowed: false,
            message: `Betting has closed for this market. Bets are not accepted after ${closureSec > 0 ? 'the set closure time.' : 'closing time.'}`,
        };
    }
    return { allowed: true };
}

function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Parse "HH:MM" or "HH:MM:SS" to a Date on the same calendar day as refDate.
 */
function parseTimeToDate(timeStr, refDate) {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map((p) => parseInt(p, 10));
    const h = parts[0];
    const m = parts[1] ?? 0;
    const s = parts[2] ?? 0;
    if (!Number.isFinite(h) || h < 0 || h > 23 || !Number.isFinite(m) || m < 0 || m > 59) return null;
    const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), h, m, s, 0);
    return d;
}


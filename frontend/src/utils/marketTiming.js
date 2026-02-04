/**
 * Check if betting is allowed for a market at the given time.
 * Market opens at midnight (00:00) and closes at closing time each day.
 * Uses client local time (assume market times are in same timezone as user).
 *
 * @param {{ closingTime: string, betClosureTime?: number }} market
 * @param {Date} [now]
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
    return { allowed: false, message: 'Invalid market time.' };
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

function parseTimeToDate(timeStr, refDate) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  const h = parts[0];
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  if (!Number.isFinite(h) || h < 0 || h > 23 || !Number.isFinite(m) || m < 0 || m > 59) return null;
  return new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), h, m, s, 0);
}

function formatTime12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (!Number.isFinite(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const min = Number.isFinite(m) ? String(m).padStart(2, '0') : '00';
  return `${h12}:${min} ${ampm}`;
}

/**
 * True if current time has reached or passed the market's closing time (market is automatically closed).
 * Market opens at midnight and closes at closing time; after midnight a new day, so the same market opens again at midnight and closes again at closing time.
 */
export function isPastClosingTime(market, now = new Date()) {
  const closeStr = (market?.closingTime || '').toString().trim();
  if (!closeStr) return false;
  const openAt = startOfDay(now);
  let closeAt = parseTimeToDate(closeStr, now);
  if (!closeAt) return false;
  if (closeAt.getTime() <= openAt.getTime()) {
    closeAt = new Date(closeAt);
    closeAt.setDate(closeAt.getDate() + 1);
  }
  return now.getTime() >= closeAt.getTime();
}

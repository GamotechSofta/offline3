/**
 * Market result reset at midnight IST.
 * Market opens at midnight and closes at closing time; results are cleared at the start of each new day (IST)
 * so the same markets can be used for the next day with fresh results.
 */

/** Current date in IST as YYYY-MM-DD */
export function getTodayIST() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

let lastResultResetDate = null;

/**
 * If we've crossed into a new calendar day (IST), clear openingNumber and closingNumber for all markets.
 * Called when fetching markets so admin and frontend always see reset results after midnight IST.
 * @param {Model} Market - Mongoose Market model
 */
export async function ensureResultsResetForNewDay(Market) {
    const today = getTodayIST();
    if (lastResultResetDate === null) {
        lastResultResetDate = today;
        return;
    }
    if (today <= lastResultResetDate) return;

    await Market.updateMany(
        {},
        { $set: { openingNumber: null, closingNumber: null } }
    );
    lastResultResetDate = today;
}

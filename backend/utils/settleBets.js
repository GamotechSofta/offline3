import mongoose from 'mongoose';
import Bet from '../models/bet/bet.js';
import Market from '../models/market/market.js';
import { Wallet, WalletTransaction } from '../models/wallet/wallet.js';
import { getRatesMap, DEFAULT_RATES } from '../models/rate/rate.js';

function toObjectId(id) {
    if (!id) return null;
    if (id instanceof mongoose.Types.ObjectId) return id;
    try {
        const str = String(id).trim();
        return mongoose.Types.ObjectId.isValid(str) && String(new mongoose.Types.ObjectId(str)) === str
            ? new mongoose.Types.ObjectId(str)
            : null;
    } catch {
        return null;
    }
}

/**
 * Classify 3-digit panna as single/double/triple patti and return rate key.
 */
function getPannaType(digits) {
    if (!digits || digits.length !== 3) return null;
    const a = digits[0], b = digits[1], c = digits[2];
    if (a === b && b === c) return 'triplePatti';
    if (a === b || b === c || a === c) return 'doublePatti';
    return 'singlePatti';
}

/**
 * Get payout rate for a rate key. Uses DEFAULT_RATES as fallback so winning players always get correct rate.
 */
function getRateForKey(rates, key) {
    if (!key) return 0;
    const val = rates[key];
    if (val != null && Number.isFinite(Number(val)) && Number(val) >= 0) return Number(val);
    return (DEFAULT_RATES[key] != null && Number.isFinite(DEFAULT_RATES[key])) ? DEFAULT_RATES[key] : 0;
}

/**
 * Open/Close "Digit" (Ank) = last digit of sum of 3 digits (0–9).
 * Example: "156" → 1+5+6=12 → digit "2"
 */
function digitFromPatti(threeDigitStr) {
    const s = String(threeDigitStr || '').trim();
    if (!/^\d{3}$/.test(s)) return null;
    const sum = Number(s[0]) + Number(s[1]) + Number(s[2]);
    return String(sum % 10);
}

/**
 * Helper: Get today's date at midnight (start of day) for scheduled bet filtering.
 */
function getTodayMidnight() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Helper: Check if a bet should be settled today.
 * Returns true if bet is NOT scheduled OR if it's scheduled for today or earlier.
 */
function shouldSettleToday(bet) {
    // Not scheduled - always settle
    if (!bet.isScheduled || !bet.scheduledDate) {
        return true;
    }
    // Scheduled - only settle if scheduledDate is today or in the past
    const today = getTodayMidnight();
    const schedDate = new Date(bet.scheduledDate);
    schedDate.setHours(0, 0, 0, 0);
    return schedDate.getTime() <= today.getTime();
}

/**
 * Settle opening: set market openingNumber, then mark single & panna bets as won/lost and credit winners.
 */
export async function settleOpening(marketId, openingNumber) {
    if (!openingNumber || !/^\d{3}$/.test(openingNumber)) {
        throw new Error('Opening number must be exactly 3 digits');
    }
    const market = await Market.findById(marketId);
    if (!market) throw new Error('Market not found');
    const canonicalId = market._id.toString();
    await Market.findByIdAndUpdate(marketId, { openingNumber });

    const rates = await getRatesMap();
    const openDigit = digitFromPatti(openingNumber);
    const open3 = openingNumber;

    const oid = toObjectId(canonicalId);
    const marketIdStr = String(canonicalId).trim();
    
    // Get today's midnight for scheduled bet filtering
    const todayMidnight = getTodayMidnight();
    
    const pendingBets = await Bet.find({
        status: 'pending',
        $or: oid ? [{ marketId: oid }, { marketId: marketIdStr }] : [{ marketId: marketIdStr }],
        // Only settle OPEN-session bets on opening (legacy bets without betOn also treated as open)
        betOn: { $ne: 'close' },
        // Only include bets that are NOT scheduled for a future date
        $and: [
            {
                $or: [
                    { isScheduled: { $ne: true } },
                    { scheduledDate: { $exists: false } },
                    { scheduledDate: null },
                    { scheduledDate: { $lte: todayMidnight } }
                ]
            }
        ]
    }).lean();
    for (const bet of pendingBets) {
        const type = (bet.betType || '').toLowerCase();
        const num = (bet.betNumber || '').toString().trim();
        const amount = Number(bet.amount) || 0;

        if (type === 'single' && /^[0-9]$/.test(num)) {
            const won = openDigit != null && num === openDigit;
            const payout = won ? amount * getRateForKey(rates, 'single') : 0;
            await Bet.updateOne(
                { _id: bet._id },
                { status: won ? 'won' : 'lost', payout }
            );
            if (won && payout > 0) {
                await Wallet.findOneAndUpdate(
                    { userId: bet.userId },
                    { $inc: { balance: payout } },
                    { upsert: true }
                );
                await WalletTransaction.create({
                    userId: bet.userId,
                    type: 'credit',
                    amount: payout,
                    description: `Win – ${market.marketName} (Single ${num})`,
                    referenceId: bet._id.toString(),
                });
            }
        } else if (type === 'panna' && /^[0-9]{3}$/.test(num)) {
            const won = num === open3;
            const pannaType = getPannaType(open3);
            const rateKey = pannaType || 'singlePatti';
            const payout = won ? amount * getRateForKey(rates, rateKey) : 0;
            await Bet.updateOne(
                { _id: bet._id },
                { status: won ? 'won' : 'lost', payout }
            );
            if (won && payout > 0) {
                await Wallet.findOneAndUpdate(
                    { userId: bet.userId },
                    { $inc: { balance: payout } },
                    { upsert: true }
                );
                await WalletTransaction.create({
                    userId: bet.userId,
                    type: 'credit',
                    amount: payout,
                    description: `Win – ${market.marketName} (Panna ${num})`,
                    referenceId: bet._id.toString(),
                });
            }
        }
        // jodi, half-sangam, full-sangam remain pending until closing
    }
}

/**
 * Settle closing: set market closingNumber, then settle jodi, half-sangam, full-sangam.
 */
export async function settleClosing(marketId, closingNumber) {
    if (!closingNumber || !/^\d{3}$/.test(closingNumber)) {
        throw new Error('Closing number must be exactly 3 digits');
    }
    const market = await Market.findById(marketId);
    if (!market) throw new Error('Market not found');
    const open3 = (market.openingNumber || '').toString();
    if (!/^\d{3}$/.test(open3)) throw new Error('Opening number must be set before declaring closing');
    await Market.findByIdAndUpdate(marketId, { closingNumber });

    const rates = await getRatesMap();
    const lastDigitOpen = digitFromPatti(open3);
    const lastDigitClose = digitFromPatti(closingNumber);
    const close3 = closingNumber;

    const canonicalId = market._id.toString();
    const oid = toObjectId(canonicalId);
    const marketIdStr = String(canonicalId).trim();
    
    // Get today's midnight for scheduled bet filtering
    const todayMidnight = getTodayMidnight();
    
    const pendingBets = await Bet.find({
        status: 'pending',
        $or: oid ? [{ marketId: oid }, { marketId: marketIdStr }] : [{ marketId: marketIdStr }],
        // Only include bets that are NOT scheduled for a future date
        $and: [
            {
                $or: [
                    { isScheduled: { $ne: true } },
                    { scheduledDate: { $exists: false } },
                    { scheduledDate: null },
                    { scheduledDate: { $lte: todayMidnight } }
                ]
            }
        ]
    }).lean();
    for (const bet of pendingBets) {
        const type = (bet.betType || '').toLowerCase();
        const num = (bet.betNumber || '').toString().trim();
        const amount = Number(bet.amount) || 0;

        // CLOSE-session Single Digit (settles on closing digit)
        if (type === 'single' && (bet.betOn || '').toString().toLowerCase() === 'close' && /^[0-9]$/.test(num)) {
            const won = num === lastDigitClose;
            const payout = won ? amount * getRateForKey(rates, 'single') : 0;
            await Bet.updateOne({ _id: bet._id }, { status: won ? 'won' : 'lost', payout });
            if (won && payout > 0) {
                await Wallet.findOneAndUpdate(
                    { userId: bet.userId },
                    { $inc: { balance: payout } },
                    { upsert: true }
                );
                await WalletTransaction.create({
                    userId: bet.userId,
                    type: 'credit',
                    amount: payout,
                    description: `Win – ${market.marketName} (Single ${num})`,
                    referenceId: bet._id.toString(),
                });
            }
        }
        // CLOSE-session Patti/Panna (settles on closing patti)
        else if (type === 'panna' && (bet.betOn || '').toString().toLowerCase() === 'close' && /^[0-9]{3}$/.test(num)) {
            const won = num === close3;
            const pannaType = getPannaType(close3);
            const rateKey = pannaType || 'singlePatti';
            const payout = won ? amount * getRateForKey(rates, rateKey) : 0;
            await Bet.updateOne({ _id: bet._id }, { status: won ? 'won' : 'lost', payout });
            if (won && payout > 0) {
                await Wallet.findOneAndUpdate(
                    { userId: bet.userId },
                    { $inc: { balance: payout } },
                    { upsert: true }
                );
                await WalletTransaction.create({
                    userId: bet.userId,
                    type: 'credit',
                    amount: payout,
                    description: `Win – ${market.marketName} (Panna ${num})`,
                    referenceId: bet._id.toString(),
                });
            }
        }
        else if (type === 'jodi' && /^[0-9]{2}$/.test(num)) {
            const expectedJodi = (lastDigitOpen != null && lastDigitClose != null) ? (lastDigitOpen + lastDigitClose) : null;
            const won = expectedJodi != null && num === expectedJodi;
            const payout = won ? amount * getRateForKey(rates, 'jodi') : 0;
            await Bet.updateOne(
                { _id: bet._id },
                { status: won ? 'won' : 'lost', payout }
            );
            if (won && payout > 0) {
                await Wallet.findOneAndUpdate(
                    { userId: bet.userId },
                    { $inc: { balance: payout } },
                    { upsert: true }
                );
                await WalletTransaction.create({
                    userId: bet.userId,
                    type: 'credit',
                    amount: payout,
                    description: `Win – ${market.marketName} (Jodi ${num})`,
                    referenceId: bet._id.toString(),
                });
            }
        } else if (type === 'half-sangam') {
            const parts = num.split('-').map((p) => (p || '').trim());
            const first = parts[0] || '';
            const second = parts[1] || '';
            // Half Sangam A: open3-close1 (e.g. "156-6")
            const isFormatA = /^[0-9]{3}$/.test(first) && /^[0-9]$/.test(second);
            // Half Sangam B: open1-close3 (e.g. "6-156")
            const isFormatB = /^[0-9]$/.test(first) && /^[0-9]{3}$/.test(second);
            let won = false;
            if (isFormatA) won = first === open3 && lastDigitClose != null && second === lastDigitClose;
            else if (isFormatB) won = lastDigitOpen != null && first === lastDigitOpen && second === close3;
            const payout = won ? amount * getRateForKey(rates, 'halfSangam') : 0;
            await Bet.updateOne(
                { _id: bet._id },
                { status: won ? 'won' : 'lost', payout }
            );
            if (won && payout > 0) {
                await Wallet.findOneAndUpdate(
                    { userId: bet.userId },
                    { $inc: { balance: payout } },
                    { upsert: true }
                );
                await WalletTransaction.create({
                    userId: bet.userId,
                    type: 'credit',
                    amount: payout,
                    description: `Win – ${market.marketName} (Half Sangam)`,
                    referenceId: bet._id.toString(),
                });
            }
        } else if (type === 'full-sangam') {
            const parts = num.split('-');
            const betOpen3 = parts[0]?.trim() || '';
            const betClose3 = parts[1]?.trim() || '';
            const won = /^[0-9]{3}$/.test(betOpen3) && /^[0-9]{3}$/.test(betClose3) &&
                betOpen3 === open3 && betClose3 === close3;
            const payout = won ? amount * getRateForKey(rates, 'fullSangam') : 0;
            await Bet.updateOne(
                { _id: bet._id },
                { status: won ? 'won' : 'lost', payout }
            );
            if (won && payout > 0) {
                await Wallet.findOneAndUpdate(
                    { userId: bet.userId },
                    { $inc: { balance: payout } },
                    { upsert: true }
                );
                await WalletTransaction.create({
                    userId: bet.userId,
                    type: 'credit',
                    amount: payout,
                    description: `Win – ${market.marketName} (Full Sangam)`,
                    referenceId: bet._id.toString(),
                });
            }
        }
    }
}

/**
 * Preview declare open: for a proposed opening number, return totalBetAmount (single + panna only),
 * totalWinAmount (payout to winners for single + panna), noOfPlayers, profit,
 * totalBetAmountOnPatti, totalPlayersBetOnPatti, totalPlayersInMarket.
 * Only single and panna are settled on open.
 * @param {string} marketId - Market ID
 * @param {string|null} openingNumber - 3-digit open number e.g. "123"
 * @param {{ bookieUserIds?: string[]|null }} [options] - If bookieUserIds is non-null and non-empty, filter bets by these user IDs (same scope as market stats).
 */
export async function previewDeclareOpen(marketId, openingNumber, options = {}) {
    const oid = toObjectId(marketId);
    if (!oid) {
        return { totalBetAmount: 0, totalWinAmount: 0, noOfPlayers: 0, profit: 0, totalBetAmountOnPatti: 0, totalPlayersBetOnPatti: 0, totalPlayersInMarket: 0 };
    }
    const marketIdStr = String(marketId).trim();
    const bookieUserIds = options.bookieUserIds;
    const hasBookieFilter = Array.isArray(bookieUserIds) && bookieUserIds.length > 0;

    // Get today's midnight for scheduled bet filtering
    const todayMidnight = getTodayMidnight();

    const matchFilter = {
        status: 'pending',
        $or: [{ marketId: oid }, { marketId: marketIdStr }],
        // Only OPEN-session bets apply for opening preview (legacy bets without betOn also treated as open)
        betOn: { $ne: 'close' },
        $and: [
            {
                $or: [
                    { isScheduled: { $ne: true } },
                    { scheduledDate: { $exists: false } },
                    { scheduledDate: null },
                    { scheduledDate: { $lte: todayMidnight } }
                ]
            }
        ]
    };
    if (hasBookieFilter) matchFilter.userId = { $in: bookieUserIds };

    const pendingBets = await Bet.find(matchFilter).lean();

    const rates = await getRatesMap();
    const lastDigitOpen = openingNumber && /^\d{3}$/.test(openingNumber) ? digitFromPatti(openingNumber) : null;
    const open3 = openingNumber && /^\d{3}$/.test(openingNumber) ? openingNumber : null;

    let totalBetAmount = 0; // only single + panna (bets settled on open)
    let totalWinAmount = 0;
    let totalBetAmountOnPatti = 0; // patti-only (panna)
    let totalWinAmountOnPatti = 0; // patti-only (panna)
    const userIds = new Set();
    const playersBetOnPatti = new Set();
    const allMarketUserIds = new Set();

    for (const bet of pendingBets) {
        const type = (bet.betType || '').toLowerCase();
        const num = (bet.betNumber || '').toString().trim();
        const amount = Number(bet.amount) || 0;
        allMarketUserIds.add(bet.userId.toString());

        if (type === 'single' && /^[0-9]$/.test(num)) {
            totalBetAmount += amount;
            userIds.add(bet.userId.toString());
            if (lastDigitOpen != null && num === lastDigitOpen) {
                const rate = getRateForKey(rates, 'single');
                const payout = amount * rate;
                totalWinAmount += payout;
                // "On Patti" for open preview includes:
                // - Single Digit on Open's last digit
                // - Panna exactly equal to Open Patti (handled below)
                totalBetAmountOnPatti += amount;
                totalWinAmountOnPatti += payout;
                playersBetOnPatti.add(bet.userId.toString());
            }
        } else if (type === 'panna' && /^[0-9]{3}$/.test(num)) {
            totalBetAmount += amount;
            userIds.add(bet.userId.toString());
            if (open3 != null && num === open3) {
                const pannaType = getPannaType(open3);
                const rateKey = pannaType || 'singlePatti';
                const rate = getRateForKey(rates, rateKey);
                const payout = amount * rate;
                totalWinAmount += payout;
                totalBetAmountOnPatti += amount;
                totalWinAmountOnPatti += payout;
                playersBetOnPatti.add(bet.userId.toString());
            }
        }
    }

    totalWinAmount = Math.round(totalWinAmount * 100) / 100;
    totalBetAmountOnPatti = Math.round(totalBetAmountOnPatti * 100) / 100;
    totalWinAmountOnPatti = Math.round(totalWinAmountOnPatti * 100) / 100;
    const profit = Math.round((totalBetAmount - totalWinAmount) * 100) / 100;

    return {
        totalBetAmount,
        totalWinAmount,
        noOfPlayers: userIds.size,
        profit,
        totalBetAmountOnPatti,
        totalWinAmountOnPatti,
        totalPlayersBetOnPatti: playersBetOnPatti.size,
        totalPlayersInMarket: allMarketUserIds.size,
    };
}

/**
 * Preview declare close: for pending jodi, half-sangam, full-sangam bets with given closing number.
 * Returns totalBetAmount, totalWinAmount, noOfPlayers, profit, totalBetAmountOnPatti, totalPlayersBetOnPatti, totalPlayersInMarket.
 * @param {{ bookieUserIds?: string[]|null }} [options] - If bookieUserIds is non-null and non-empty, filter bets by these user IDs.
 */
export async function previewDeclareClose(marketId, closingNumber, options = {}) {
    const oid = toObjectId(marketId);
    if (!oid) return { totalBetAmount: 0, totalWinAmount: 0, noOfPlayers: 0, profit: 0, totalBetAmountOnPatti: 0, totalPlayersBetOnPatti: 0, totalPlayersInMarket: 0 };
    const market = await Market.findById(oid).lean();
    if (!market) return { totalBetAmount: 0, totalWinAmount: 0, noOfPlayers: 0, profit: 0, totalBetAmountOnPatti: 0, totalPlayersBetOnPatti: 0, totalPlayersInMarket: 0 };
    const open3 = (market.openingNumber || '').toString();
    if (!/^\d{3}$/.test(open3)) return { totalBetAmount: 0, totalWinAmount: 0, noOfPlayers: 0, profit: 0, totalBetAmountOnPatti: 0, totalPlayersBetOnPatti: 0, totalPlayersInMarket: 0 };

    const marketIdStr = String(marketId).trim();
    const bookieUserIds = options.bookieUserIds;
    const hasBookieFilter = Array.isArray(bookieUserIds) && bookieUserIds.length > 0;

    // Get today's midnight for scheduled bet filtering
    const todayMidnight = getTodayMidnight();

    const matchFilter = {
        status: 'pending',
        $or: [{ marketId: oid }, { marketId: marketIdStr }],
        $and: [
            {
                $or: [
                    { isScheduled: { $ne: true } },
                    { scheduledDate: { $exists: false } },
                    { scheduledDate: null },
                    { scheduledDate: { $lte: todayMidnight } }
                ]
            }
        ]
    };
    if (hasBookieFilter) matchFilter.userId = { $in: bookieUserIds };

    const pendingBets = await Bet.find(matchFilter).lean();
    let totalBetAmount = 0;
    let totalWinAmount = 0;
    let totalBetAmountOnPatti = 0;
    const userIds = new Set();
    const playersBetOnPatti = new Set();
    const allMarketUserIds = new Set();

    if (!closingNumber || !/^\d{3}$/.test(closingNumber)) {
        for (const bet of pendingBets) {
            allMarketUserIds.add(bet.userId.toString());
            const type = (bet.betType || '').toLowerCase();
            const isCloseSettleType =
                type === 'jodi' ||
                type === 'half-sangam' ||
                type === 'full-sangam' ||
                (type === 'single' && (bet.betOn || '').toString().toLowerCase() === 'close') ||
                (type === 'panna' && (bet.betOn || '').toString().toLowerCase() === 'close');
            if (isCloseSettleType) {
                totalBetAmount += Number(bet.amount) || 0;
                userIds.add(bet.userId.toString());
            }
        }
        totalBetAmount = Math.round(totalBetAmount * 100) / 100;
        return {
            totalBetAmount,
            totalWinAmount: 0,
            noOfPlayers: userIds.size,
            profit: totalBetAmount,
            totalBetAmountOnPatti: 0,
            totalWinAmountOnPatti: 0,
            totalPlayersBetOnPatti: 0,
            totalPlayersInMarket: allMarketUserIds.size,
        };
    }

    const rates = await getRatesMap();
    const lastDigitOpen = digitFromPatti(open3);
    const lastDigitClose = digitFromPatti(closingNumber);
    const close3 = closingNumber;
    const pannaTypeClose = getPannaType(close3);
    const pannaRateKeyClose = pannaTypeClose || 'singlePatti';
    const pannaRateClose = getRateForKey(rates, pannaRateKeyClose);

    let totalWinAmountOnPatti = 0; // close patti (panna close-session) only

    for (const bet of pendingBets) {
        const type = (bet.betType || '').toLowerCase();
        const num = (bet.betNumber || '').toString().trim();
        const amount = Number(bet.amount) || 0;
        allMarketUserIds.add(bet.userId.toString());
        const isCloseSession = (bet.betOn || '').toString().toLowerCase() === 'close';
        const isCloseSettleType =
            type === 'jodi' ||
            type === 'half-sangam' ||
            type === 'full-sangam' ||
            (type === 'single' && isCloseSession) ||
            (type === 'panna' && isCloseSession);
        if (!isCloseSettleType) continue;

        totalBetAmount += amount;
        userIds.add(bet.userId.toString());

        let isWinning = false;
        if (type === 'single' && isCloseSession && /^[0-9]$/.test(num)) {
            if (lastDigitClose != null && num === lastDigitClose) {
                const payout = amount * getRateForKey(rates, 'single');
                totalWinAmount += payout;
                // Include Close Single Digit in "On Patti" metrics for close preview
                totalBetAmountOnPatti += amount;
                totalWinAmountOnPatti += payout;
                playersBetOnPatti.add(bet.userId.toString());
                isWinning = true;
            }
        } else if (type === 'panna' && isCloseSession && /^[0-9]{3}$/.test(num)) {
            if (num === close3) {
                const payout = amount * pannaRateClose;
                totalWinAmount += payout;
                totalBetAmountOnPatti += amount;
                totalWinAmountOnPatti += payout;
                playersBetOnPatti.add(bet.userId.toString());
                isWinning = true;
            }
        } else if (type === 'jodi' && /^[0-9]{2}$/.test(num)) {
            const expectedJodi = (lastDigitOpen != null && lastDigitClose != null) ? (lastDigitOpen + lastDigitClose) : null;
            if (expectedJodi != null && num === expectedJodi) {
                const payout = amount * getRateForKey(rates, 'jodi');
                totalWinAmount += payout;
                // Include winning Jodi (computed from Open digit + Close digit) in "On Patti" metrics
                totalBetAmountOnPatti += amount;
                totalWinAmountOnPatti += payout;
                playersBetOnPatti.add(bet.userId.toString());
                isWinning = true;
            }
        } else if (type === 'half-sangam') {
            const parts = num.split('-').map((p) => (p || '').trim());
            const first = parts[0] || '';
            const second = parts[1] || '';
            const isFormatA = /^[0-9]{3}$/.test(first) && /^[0-9]$/.test(second);
            const isFormatB = /^[0-9]$/.test(first) && /^[0-9]{3}$/.test(second);
            if (isFormatA && first === open3 && lastDigitClose != null && second === lastDigitClose) {
                totalWinAmount += amount * getRateForKey(rates, 'halfSangam');
                isWinning = true;
            } else if (isFormatB && lastDigitOpen != null && first === lastDigitOpen && second === close3) {
                totalWinAmount += amount * getRateForKey(rates, 'halfSangam');
                isWinning = true;
            }
        } else if (type === 'full-sangam') {
            const parts = (num || '').split('-').map((p) => (p || '').trim());
            const betOpen3 = parts[0] || '';
            const betClose3 = parts[1] || '';
            if (/^[0-9]{3}$/.test(betOpen3) && /^[0-9]{3}$/.test(betClose3) && betOpen3 === open3 && betClose3 === close3) {
                const payout = amount * getRateForKey(rates, 'fullSangam');
                totalWinAmount += payout;
                isWinning = true;
            }
        }
        // Note: "On Patti" metrics for close preview are tracked for:
        // - CLOSE-session panna (close patti)
        // - CLOSE-session single digit (close digit)
        // - winning Jodi (Open digit + Close digit)
    }

    totalBetAmount = Math.round(totalBetAmount * 100) / 100;
    totalWinAmount = Math.round(totalWinAmount * 100) / 100;
    totalBetAmountOnPatti = Math.round(totalBetAmountOnPatti * 100) / 100;
    totalWinAmountOnPatti = Math.round(totalWinAmountOnPatti * 100) / 100;
    const profit = Math.round((totalBetAmount - totalWinAmount) * 100) / 100;
    return {
        totalBetAmount,
        totalWinAmount,
        noOfPlayers: userIds.size,
        profit,
        totalBetAmountOnPatti,
        totalWinAmountOnPatti,
        totalPlayersBetOnPatti: playersBetOnPatti.size,
        totalPlayersInMarket: allMarketUserIds.size,
    };
}

/**
 * Get list of winning bets (with payout) for open declaration. Same filter as previewDeclareOpen.
 */
export async function getWinningBetsForOpen(marketId, openingNumber, options = {}) {
    const oid = toObjectId(marketId);
    if (!oid) return { winningBets: [], totalWinAmount: 0 };
    const marketIdStr = String(marketId).trim();
    const bookieUserIds = options.bookieUserIds;
    const hasBookieFilter = Array.isArray(bookieUserIds) && bookieUserIds.length > 0;
    const todayMidnight = getTodayMidnight();
    const matchFilter = {
        status: 'pending',
        $or: [{ marketId: oid }, { marketId: marketIdStr }],
        betOn: { $ne: 'close' },
        $and: [{ $or: [{ isScheduled: { $ne: true } }, { scheduledDate: { $exists: false } }, { scheduledDate: null }, { scheduledDate: { $lte: todayMidnight } }] }],
    };
    if (hasBookieFilter) matchFilter.userId = { $in: bookieUserIds };
    const pendingBets = await Bet.find(matchFilter).lean();
    const rates = await getRatesMap();
    const lastDigitOpen = openingNumber && /^\d{3}$/.test(openingNumber) ? digitFromPatti(openingNumber) : null;
    const open3 = openingNumber && /^\d{3}$/.test(openingNumber) ? openingNumber : null;
    const winningBets = [];
    let totalWinAmount = 0;
    for (const bet of pendingBets) {
        const type = (bet.betType || '').toLowerCase();
        const num = (bet.betNumber || '').toString().trim();
        const amount = Number(bet.amount) || 0;
        let payout = 0;
        if (type === 'single' && /^[0-9]$/.test(num) && lastDigitOpen != null && num === lastDigitOpen) {
            payout = amount * getRateForKey(rates, 'single');
        } else if (type === 'panna' && /^[0-9]{3}$/.test(num) && open3 != null && num === open3) {
            const pannaType = getPannaType(open3);
            const rateKey = pannaType || 'singlePatti';
            payout = amount * getRateForKey(rates, rateKey);
        }
        if (payout > 0) {
            payout = Math.round(payout * 100) / 100;
            totalWinAmount += payout;
            winningBets.push({ bet: { _id: bet._id, userId: bet.userId, betType: bet.betType, betNumber: bet.betNumber, amount: bet.amount }, payout });
        }
    }
    totalWinAmount = Math.round(totalWinAmount * 100) / 100;
    return { winningBets, totalWinAmount };
}

/**
 * Get list of winning bets (with payout) for close declaration. Same filter as previewDeclareClose.
 */
export async function getWinningBetsForClose(marketId, closingNumber, options = {}) {
    const oid = toObjectId(marketId);
    if (!oid) return { winningBets: [], totalWinAmount: 0 };
    const market = await Market.findById(oid).lean();
    if (!market) return { winningBets: [], totalWinAmount: 0 };
    const open3 = (market.openingNumber || '').toString();
    if (!/^\d{3}$/.test(open3)) return { winningBets: [], totalWinAmount: 0 };
    if (!closingNumber || !/^\d{3}$/.test(closingNumber)) return { winningBets: [], totalWinAmount: 0 };

    const marketIdStr = String(marketId).trim();
    const bookieUserIds = options.bookieUserIds;
    const hasBookieFilter = Array.isArray(bookieUserIds) && bookieUserIds.length > 0;
    const todayMidnight = getTodayMidnight();
    const matchFilter = {
        status: 'pending',
        $or: [{ marketId: oid }, { marketId: marketIdStr }],
        $and: [{ $or: [{ isScheduled: { $ne: true } }, { scheduledDate: { $exists: false } }, { scheduledDate: null }, { scheduledDate: { $lte: todayMidnight } }] }],
    };
    if (hasBookieFilter) matchFilter.userId = { $in: bookieUserIds };
    const pendingBets = await Bet.find(matchFilter).lean();
    const rates = await getRatesMap();
    const lastDigitOpen = digitFromPatti(open3);
    const lastDigitClose = digitFromPatti(closingNumber);
    const close3 = closingNumber;
    const pannaTypeClose = getPannaType(close3);
    const pannaRateKeyClose = pannaTypeClose || 'singlePatti';
    const winningBets = [];
    let totalWinAmount = 0;
    for (const bet of pendingBets) {
        const type = (bet.betType || '').toLowerCase();
        const num = (bet.betNumber || '').toString().trim();
        const amount = Number(bet.amount) || 0;
        const isCloseSession = (bet.betOn || '').toString().toLowerCase() === 'close';
        const isCloseSettleType =
            type === 'jodi' ||
            type === 'half-sangam' ||
            type === 'full-sangam' ||
            (type === 'single' && isCloseSession) ||
            (type === 'panna' && isCloseSession);
        if (!isCloseSettleType) continue;
        let payout = 0;
        if (type === 'single' && isCloseSession && /^[0-9]$/.test(num)) {
            if (num === lastDigitClose) payout = amount * getRateForKey(rates, 'single');
        } else if (type === 'panna' && isCloseSession && /^[0-9]{3}$/.test(num)) {
            if (num === close3) payout = amount * getRateForKey(rates, pannaRateKeyClose);
        } else if (type === 'jodi' && /^[0-9]{2}$/.test(num)) {
            const expectedJodi = (lastDigitOpen != null && lastDigitClose != null) ? (lastDigitOpen + lastDigitClose) : null;
            if (expectedJodi != null && num === expectedJodi) payout = amount * getRateForKey(rates, 'jodi');
        } else if (type === 'half-sangam') {
            const parts = num.split('-').map((p) => (p || '').trim());
            const first = parts[0] || '';
            const second = parts[1] || '';
            const isFormatA = /^[0-9]{3}$/.test(first) && /^[0-9]$/.test(second);
            const isFormatB = /^[0-9]$/.test(first) && /^[0-9]{3}$/.test(second);
            if (isFormatA && first === open3 && lastDigitClose != null && second === lastDigitClose) payout = amount * getRateForKey(rates, 'halfSangam');
            else if (isFormatB && lastDigitOpen != null && first === lastDigitOpen && second === close3) payout = amount * getRateForKey(rates, 'halfSangam');
        } else if (type === 'full-sangam') {
            const parts = (num || '').split('-').map((p) => (p || '').trim());
            const betOpen3 = parts[0] || '';
            const betClose3 = parts[1] || '';
            if (/^[0-9]{3}$/.test(betOpen3) && /^[0-9]{3}$/.test(betClose3) && betOpen3 === open3 && betClose3 === close3) {
                payout = amount * getRateForKey(rates, 'fullSangam');
            }
        }
        if (payout > 0) {
            payout = Math.round(payout * 100) / 100;
            totalWinAmount += payout;
            winningBets.push({ bet: { _id: bet._id, userId: bet.userId, betType: bet.betType, betNumber: bet.betNumber, amount: bet.amount }, payout });
        }
    }
    totalWinAmount = Math.round(totalWinAmount * 100) / 100;
    return { winningBets, totalWinAmount };
}

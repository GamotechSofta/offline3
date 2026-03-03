/**
 * Responsible gaming checks before spin. Never affects RNG — only allows/blocks the bet.
 */

import UserResponsibleGaming from '../models/user/UserResponsibleGaming.js';

export async function checkResponsibleGaming(req, res, next) {
    const userId = req.body?.userId || req.query?.userId;
    if (!userId) return next();

    try {
        const rg = await UserResponsibleGaming.findOne({ userId }).lean();
        if (!rg) return next();

        const now = new Date();

        if (rg.selfExcludedUntil && new Date(rg.selfExcludedUntil) > now) {
            return res.status(403).json({
                success: false,
                message: 'Account self-excluded until ' + rg.selfExcludedUntil.toISOString().slice(0, 10),
                code: 'SELF_EXCLUDED',
            });
        }
        if (rg.coolOffUntil && new Date(rg.coolOffUntil) > now) {
            return res.status(403).json({
                success: false,
                message: 'Cool-off period active until ' + rg.coolOffUntil.toISOString().slice(0, 10),
                code: 'COOL_OFF',
            });
        }
        if (rg.sessionDurationLimitMinutes && rg.sessionStartedAt) {
            const elapsed = (now - new Date(rg.sessionStartedAt)) / 60000;
            if (elapsed >= rg.sessionDurationLimitMinutes) {
                return res.status(403).json({
                    success: false,
                    message: 'Session duration limit reached. Please take a break.',
                    code: 'SESSION_LIMIT',
                });
            }
        }

        req.responsibleGaming = rg;
        next();
    } catch (err) {
        next(err);
    }
}

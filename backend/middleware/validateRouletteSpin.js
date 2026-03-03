/**
 * Input validation for spin endpoint. IdempotencyKey required for production.
 */

export function validateSpinInput(req, res, next) {
    const body = req.body || {};
    const userId = body.userId;
    const bets = body.bets;
    const idempotencyKey = body.idempotencyKey;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
    }
    if (!Array.isArray(bets) || bets.length === 0) {
        return res.status(400).json({ success: false, message: 'bets array is required' });
    }
    if (idempotencyKey !== undefined && idempotencyKey !== null) {
        if (typeof idempotencyKey !== 'string' || String(idempotencyKey).trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'idempotencyKey must be a non-empty string when provided',
                code: 'IDEMPOTENCY_KEY_INVALID',
            });
        }
        if (String(idempotencyKey).length > 128) {
            return res.status(400).json({ success: false, message: 'idempotencyKey too long' });
        }
    }

    next();
}

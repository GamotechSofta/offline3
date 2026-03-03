/**
 * Automated operational risk policies.
 * - If reserve < reserveHaltTable → halt table (no new spins).
 * - If reserve < reserveFreezeHighRisk → freeze high-risk bet types (e.g. straight-up).
 * - If exposureRatio > threshold → reduce effective maxStraightUpPerNumber by reduction factor.
 */

/**
 * Compute operational policy state and effective limits.
 * @param {Object} config - RouletteConfig (houseReserve, reserveHaltTable, reserveFreezeHighRisk, exposureRatioReductionThreshold, maxStraightUpReductionFactor, maxStraightUpPerNumber)
 * @param {number} reserveBalance - Current house reserve balance (from HouseReserve).
 * @param {number} maxPayoutThisSpin - Max payout for the current bet slip (from maxPayoutForBets).
 * @returns {{ tableHalted: boolean, highRiskFrozen: boolean, effectiveMaxStraightUpPerNumber: number | null, reason?: string }}
 */
export function getOperationalPolicyState(config, reserveBalance, maxPayoutThisSpin) {
    const reserve = Number(reserveBalance) || 0;
    const haltThreshold = config?.reserveHaltTable;
    const freezeThreshold = config?.reserveFreezeHighRisk;
    const exposureThreshold = config?.exposureRatioReductionThreshold ?? 0.6;
    const reductionFactor = config?.maxStraightUpReductionFactor ?? 0.2;
    const baseMaxStraightUp = config?.maxStraightUpPerNumber;

    if (haltThreshold != null && haltThreshold > 0 && reserve < haltThreshold) {
        return {
            tableHalted: true,
            highRiskFrozen: true,
            effectiveMaxStraightUpPerNumber: 0,
            reason: `Table halted: reserve ${reserve} below minimum ${haltThreshold}`,
        };
    }

    const highRiskFrozen = freezeThreshold != null && freezeThreshold > 0 && reserve < freezeThreshold;
    const exposureRatio = reserve > 0 && maxPayoutThisSpin > 0 ? maxPayoutThisSpin / reserve : 0;
    const applyReduction = exposureRatio > exposureThreshold;

    let effectiveMaxStraightUp = baseMaxStraightUp;
    if (highRiskFrozen) {
        effectiveMaxStraightUp = 0;
    } else if (applyReduction && baseMaxStraightUp != null && baseMaxStraightUp > 0) {
        effectiveMaxStraightUp = Math.max(0, Math.floor(baseMaxStraightUp * (1 - reductionFactor)));
    }

    return {
        tableHalted: false,
        highRiskFrozen,
        effectiveMaxStraightUpPerNumber: effectiveMaxStraightUp ?? null,
    };
}

import React, { useEffect, useMemo, useState } from 'react';
import BidLayout from '../BidLayout';
import BidReviewModal from './BidReviewModal';

const sanitizePoints = (v) => (v ?? '').toString().replace(/\D/g, '').slice(0, 6);

const validatePana = (n) => {
    if (!n) return false;
    const str = n.toString().trim();
    
    // Must be exactly 3 digits
    if (!/^[0-9]{3}$/.test(str)) return false;
    
    const digits = str.split('').map(Number);
    const [first, second, third] = digits;
    
    // Two consecutive digits must be the same (positions 0-1 or 1-2)
    const hasConsecutiveSame = (first === second) || (second === third);
    if (!hasConsecutiveSame) return false;
    
    // Numbers starting with zero are not allowed (001-099)
    if (first === 0) {
        return false;
    }
    
    // Special case: Two zeros at the end are allowed (300, 900, 100)
    // For these cases, third (0) is not > first, but they're explicitly allowed
    if (second === 0 && third === 0) {
        return true;
    }
    
    // Special case: Numbers ending with zero where first two digits are the same (220, 990, 880, 660)
    if (first === second && third === 0) {
        return true;
    }
    
    // For all other cases, last digit must be greater than first
    if (third <= first) return false;
    
    return true;
};

const buildDoublePanas = () => {
    const validPanas = [];
    for (let i = 0; i <= 999; i++) {
        const str = String(i).padStart(3, '0');
        if (validatePana(str)) {
            validPanas.push(str);
        }
    }
    return validPanas;
};

const DoublePanaBulkBid = ({ market, title }) => {
    const [session, setSession] = useState(() => (market?.status === 'running' ? 'CLOSE' : 'OPEN'));
    const [warning, setWarning] = useState('');
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewRows, setReviewRows] = useState([]);

    const showWarning = (msg) => {
        setWarning(msg);
        window.clearTimeout(showWarning._t);
        showWarning._t = window.setTimeout(() => setWarning(''), 2200);
    };

    const isRunning = market?.status === 'running'; // "CLOSED IS RUNNING"
    useEffect(() => {
        if (isRunning) setSession('CLOSE');
    }, [isRunning]);

    const walletBefore = useMemo(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || 'null');
            const val =
                u?.wallet ||
                u?.balance ||
                u?.points ||
                u?.walletAmount ||
                u?.wallet_amount ||
                u?.amount ||
                0;
            const n = Number(val);
            return Number.isFinite(n) ? n : 0;
        } catch (e) {
            return 0;
        }
    }, []);

    const marketTitle = market?.gameName || market?.marketName || title;
    const dateText = new Date().toLocaleDateString('en-GB');

    const doublePanas = useMemo(() => buildDoublePanas(), []);
    const [specialInputs, setSpecialInputs] = useState(() =>
        Object.fromEntries(doublePanas.map((n) => [n, '']))
    );
    const [groupBulk, setGroupBulk] = useState(() =>
        Object.fromEntries(Array.from({ length: 10 }, (_, d) => [String(d), '']))
    );

    const panasBySumDigit = useMemo(() => {
        const groups = Object.fromEntries(Array.from({ length: 10 }, (_, d) => [String(d), []]));
        for (const n of doublePanas) {
            const digits = n.split('').map(Number);
            const sum = digits[0] + digits[1] + digits[2];
            const s = sum % 10;
            groups[String(s)].push(n);
        }
        return groups;
    }, [doublePanas]);

    const specialCount = useMemo(
        () => Object.values(specialInputs).filter((v) => Number(v) > 0).length,
        [specialInputs]
    );

    const canSubmit = specialCount > 0;

    const selectedTotalPoints = useMemo(
        () => Object.values(specialInputs).reduce((sum, v) => sum + Number(v || 0), 0),
        [specialInputs]
    );

    const clearAll = () => {
        setIsReviewOpen(false);
        setReviewRows([]);
        setSpecialInputs(Object.fromEntries(doublePanas.map((n) => [n, ''])));
        setGroupBulk(Object.fromEntries(Array.from({ length: 10 }, (_, d) => [String(d), ''])));
    };

    const handleCancel = () => clearAll();
    const handleSubmit = () => clearAll();

    const openReview = () => {
        const rows = Object.entries(specialInputs)
            .filter(([, pts]) => Number(pts) > 0)
            .map(([num, pts]) => ({
                id: `${num}-${pts}-${session}`,
                number: num,
                points: String(pts),
                type: session,
            }));

        if (!rows.length) {
            showWarning('Please enter points for at least one Double Pana.');
            return;
        }

        setReviewRows(rows);
        setIsReviewOpen(true);
    };

    const totalPoints = useMemo(
        () => reviewRows.reduce((sum, b) => sum + Number(b.points || 0), 0),
        [reviewRows]
    );

    const submitBtnClass = (enabled) =>
        enabled
            ? 'w-full bg-gradient-to-r from-[#d4af37] to-[#cca84d] text-[#4b3608] font-bold py-3.5 min-h-[52px] rounded-lg shadow-lg transition-all active:scale-[0.98]'
            : 'w-full bg-gradient-to-r from-[#d4af37] to-[#cca84d] text-[#4b3608] font-bold py-3.5 min-h-[52px] rounded-lg shadow-lg opacity-50 cursor-not-allowed';

    return (
        <BidLayout
            market={market}
            title={title}
            bidsCount={reviewRows.length}
            totalPoints={totalPoints}
            session={session}
            setSession={setSession}
            sessionRightSlot={
                <button
                    type="button"
                    onClick={openReview}
                    disabled={!canSubmit}
                    className={`hidden md:inline-flex items-center justify-center font-bold min-h-[44px] min-w-[220px] px-6 rounded-full shadow-lg transition-all whitespace-nowrap ${
                        canSubmit
                            ? 'bg-gradient-to-r from-[#d4af37] to-[#cca84d] text-[#4b3608] hover:from-[#e5c04a] hover:to-[#d4af37] active:scale-[0.98]'
                            : 'bg-gradient-to-r from-[#d4af37] to-[#cca84d] text-[#4b3608] opacity-50 cursor-not-allowed'
                    }`}
                >
                    Submit Bet
                </button>
            }
            walletBalance={walletBefore}
            extraHeader={null}
            hideFooter
            contentPaddingClass="pb-28 md:pb-8"
        >
            <div className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">
                {warning && (
                    <div className="mb-3 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm">
                        {warning}
                    </div>
                )}

                {/* Responsive grid: 1 col mobile, 2 cols tablet, 4 cols desktop */}
                <div className="space-y-4 sm:space-y-5 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-4 lg:gap-x-5 md:gap-y-8 lg:gap-y-10 md:items-start">
                    {Array.from({ length: 10 }, (_, d) => String(d)).map((groupKey) => {
                        const list = panasBySumDigit[groupKey] || [];
                        if (!list.length) return null;

                        const applyGroup = (pts) => {
                            const p = sanitizePoints(pts);
                            const n = Number(p);
                            if (!n || n <= 0) {
                                showWarning('Please enter points.');
                                return;
                            }
                            setSpecialInputs((prev) => {
                                const next = { ...prev };
                                for (const num of list) next[num] = String(n);
                                return next;
                            });
                            setGroupBulk((prev) => ({ ...prev, [groupKey]: '' }));
                        };

                        return (
                            <div key={groupKey} className="space-y-2 sm:space-y-3 bg-[#1a1a1a]/50 rounded-lg p-2 sm:p-3 border border-white/5">
                                {/* Group header: responsive and touch-friendly */}
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="w-9 h-8 sm:w-10 sm:h-9 bg-[#202124] border border-white/10 text-[#f2c14e] flex items-center justify-center rounded-l-md font-bold text-xs shrink-0">
                                        {groupKey}
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={groupBulk[groupKey]}
                                        onChange={(e) =>
                                            setGroupBulk((p) => ({ ...p, [groupKey]: sanitizePoints(e.target.value) }))
                                        }
                                        onBlur={() => {
                                            if (groupBulk[groupKey]) applyGroup(groupBulk[groupKey]);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && groupBulk[groupKey]) applyGroup(groupBulk[groupKey]);
                                        }}
                                        placeholder="All pts"
                                        className="no-spinner flex-1 min-w-0 sm:w-[96px] md:w-[72px] lg:w-[80px] h-8 sm:h-9 bg-[#202124] border border-white/10 text-white placeholder-gray-500 rounded focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 px-2 text-xs font-semibold text-center"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => groupBulk[groupKey] && applyGroup(groupBulk[groupKey])}
                                        disabled={!groupBulk[groupKey]}
                                        className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-md font-bold text-xs border transition-all active:scale-95 min-w-[60px] sm:min-w-[70px] ${
                                            groupBulk[groupKey]
                                                ? 'bg-[#202124] border-[#d4af37]/40 text-[#f2c14e] hover:border-[#d4af37] hover:bg-[#202124]/90'
                                                : 'bg-[#202124] border-white/10 text-gray-500 cursor-not-allowed'
                                        }`}
                                        title="Apply points to all numbers in this group"
                                    >
                                        Apply
                                    </button>
                                </div>

                                {/* Responsive grid: 2 cols mobile, 3 cols tablet, auto-fit desktop */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-[max-content_max-content] gap-2 sm:gap-2.5 md:gap-3 lg:justify-start lg:gap-x-4 lg:gap-y-2 max-h-[300px] sm:max-h-[400px] md:max-h-none overflow-y-auto custom-scrollbar">
                                    {list.map((num) => (
                                        <div key={num} className="flex items-center gap-1 sm:gap-1.5">
                                            <div className="w-9 h-8 sm:w-10 sm:h-9 bg-[#202124] border border-white/10 text-[#f2c14e] flex items-center justify-center rounded-l-md font-bold text-xs shrink-0">
                                                {num}
                                            </div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Pts"
                                                value={specialInputs[num]}
                                                onChange={(e) =>
                                                    setSpecialInputs((p) => ({
                                                        ...p,
                                                        [num]: sanitizePoints(e.target.value),
                                                    }))
                                                }
                                                className="no-spinner flex-1 min-w-0 sm:w-[64px] md:w-[56px] lg:w-[64px] xl:w-[72px] h-8 sm:h-9 bg-[#202124] border border-white/10 text-white placeholder-gray-500 rounded-r-md focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 px-1.5 sm:px-2 text-xs font-semibold text-center"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Submit Bet: match Single Pana Bulk (mobile sticky, desktop inline) */}
            <div className="md:hidden fixed left-0 right-0 bottom-[88px] z-20 px-3">
                <button type="button" onClick={openReview} disabled={!canSubmit} className={submitBtnClass(canSubmit)}>
                    Submit Bet
                </button>
            </div>

            <BidReviewModal
                open={isReviewOpen}
                onClose={handleCancel}
                onSubmit={handleSubmit}
                marketTitle={marketTitle}
                dateText={dateText}
                labelKey="Pana"
                rows={reviewRows}
                walletBefore={walletBefore}
                totalBids={reviewRows.length}
                totalAmount={totalPoints}
            />
        </BidLayout>
    );
};

export default DoublePanaBulkBid;

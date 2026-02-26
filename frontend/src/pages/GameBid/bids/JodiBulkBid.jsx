import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BidLayout from '../BidLayout';
import BidReviewModal from './BidReviewModal';
import { placeBet, updateUserBalance } from '../../../api/bets';

const DIGITS = Array.from({ length: 10 }, (_, i) => String(i));

const sanitizePoints = (v) => (v ?? '').toString().replace(/\D/g, '').slice(0, 6);

const JodiBulkBid = ({ market, title, initialSelectedDate }) => {
    const cellRefs = useRef({});
    const pendingFocusRef = useRef(null);

    const [session, setSession] = useState('OPEN');
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [warning, setWarning] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => {
        if (initialSelectedDate) return initialSelectedDate;
        try {
            const savedDate = localStorage.getItem('betSelectedDate');
            if (savedDate) {
                const today = new Date().toISOString().split('T')[0];
                const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                const maxAllowed = tomorrow.toISOString().split('T')[0];
                if (savedDate > today && savedDate <= maxAllowed) return savedDate;
            }
        } catch (e) {
            // Ignore errors
        }
        return new Date().toISOString().split('T')[0];
    });
    
    // Save to localStorage when date changes
    const handleDateChange = (newDate) => {
        try {
            localStorage.setItem('betSelectedDate', newDate);
        } catch (e) {
            // Ignore errors
        }
        setSelectedDate(newDate);
    };

    const showWarning = (msg) => {
        setWarning(msg);
        window.clearTimeout(showWarning._t);
        showWarning._t = window.setTimeout(() => setWarning(''), 2400);
    };

    useEffect(() => {
        // Jodi: allow OPEN only (no CLOSE bets)
        if (session !== 'OPEN') setSession('OPEN');
    }, [session]);

    // cell values: key "rc" (row digit + col digit) => points string
    const [cells, setCells] = useState(() => {
        const init = {};
        for (const r of DIGITS) for (const c of DIGITS) init[`${r}${c}`] = '';
        return init;
    });
    const [rowBulk, setRowBulk] = useState(() => Object.fromEntries(DIGITS.map((d) => [d, ''])));
    const [colBulk, setColBulk] = useState(() => Object.fromEntries(DIGITS.map((d) => [d, ''])));
    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth >= 768;
    });

    useEffect(() => {
        const onResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Mobile: show full 10x10 grid on one screen (no prev/next)
    const visibleDigits = DIGITS;

    // Auto-apply row/column Pts after typing (no Enter or blur needed)
    const rowApplyTimersRef = useRef({});
    const colApplyTimersRef = useRef({});
    const APPLY_DELAY_MS = 600;

    useEffect(() => {
        const timers = {};
        DIGITS.forEach((r) => {
            const val = rowBulk[r];
            if (!val || Number(val) <= 0) return;
            if (rowApplyTimersRef.current[r]) clearTimeout(rowApplyTimersRef.current[r]);
            timers[r] = setTimeout(() => {
                applyRow(r, val);
                rowApplyTimersRef.current[r] = null;
            }, APPLY_DELAY_MS);
            rowApplyTimersRef.current[r] = timers[r];
        });
        return () => DIGITS.forEach((r) => { if (rowApplyTimersRef.current[r]) clearTimeout(rowApplyTimersRef.current[r]); });
    }, [rowBulk]);

    useEffect(() => {
        const timers = {};
        DIGITS.forEach((c) => {
            const val = colBulk[c];
            if (!val || Number(val) <= 0) return;
            if (colApplyTimersRef.current[c]) clearTimeout(colApplyTimersRef.current[c]);
            timers[c] = setTimeout(() => {
                applyCol(c, val);
                colApplyTimersRef.current[c] = null;
            }, APPLY_DELAY_MS);
            colApplyTimersRef.current[c] = timers[c];
        });
        return () => DIGITS.forEach((c) => { if (colApplyTimersRef.current[c]) clearTimeout(colApplyTimersRef.current[c]); });
    }, [colBulk]);

    // After column slide on mobile, focus the pending cell
    useEffect(() => {
        const p = pendingFocusRef.current;
        if (!p) return;
        const el = cellRefs.current[`${p.r}-${p.c}`];
        if (el) {
            el.focus();
            pendingFocusRef.current = null;
        }
    }, []);

    const handleCellKeyDown = useCallback(
        (e, r, c) => {
            const key = e.key;
            if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp' && key !== 'ArrowDown') return;
            const ri = DIGITS.indexOf(r);
            const ci = DIGITS.indexOf(c);
            if (ri === -1 || ci === -1) return;

            let nextR = ri;
            let nextC = ci;
            if (key === 'ArrowLeft') {
                if (ci <= 0) return;
                nextC = ci - 1;
            } else if (key === 'ArrowRight') {
                if (ci >= DIGITS.length - 1) return;
                nextC = ci + 1;
            } else if (key === 'ArrowUp') {
                if (ri <= 0) return;
                nextR = ri - 1;
            } else if (key === 'ArrowDown') {
                if (ri >= DIGITS.length - 1) return;
                nextR = ri + 1;
            }

            const nextRStr = DIGITS[nextR];
            const nextCStr = DIGITS[nextC];
            e.preventDefault();
            const el = cellRefs.current[`${nextRStr}-${nextCStr}`];
            if (el) el.focus();
        },
        []
    );

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
    const dateText = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy

    const rows = useMemo(() => {
        const out = [];
        for (const r of DIGITS) {
            for (const c of DIGITS) {
                const key = `${r}${c}`;
                const pts = Number(cells[key] || 0);
                if (pts > 0) out.push({ id: `${key}-${pts}`, number: key, points: String(pts), type: session });
            }
        }
        return out;
    }, [cells, session]);

    const totalPoints = useMemo(() => rows.reduce((sum, b) => sum + Number(b.points || 0), 0), [rows]);
    const canSubmit = rows.length > 0;

    const applyRow = (r, pts) => {
        const p = Number(pts);
        if (!p || p <= 0) {
            showWarning('Please enter points.');
            return;
        }
        setCells((prev) => {
            const next = { ...prev };
            for (const c of DIGITS) {
                const key = `${r}${c}`;
                const cur = Number(next[key] || 0) || 0;
                next[key] = String(cur + p);
            }
            return next;
        });
        setRowBulk((prev) => ({ ...prev, [r]: '' }));
    };

    const applyCol = (c, pts) => {
        const p = Number(pts);
        if (!p || p <= 0) {
            showWarning('Please enter points.');
            return;
        }
        setCells((prev) => {
            const next = { ...prev };
            for (const r of DIGITS) {
                const key = `${r}${c}`;
                const cur = Number(next[key] || 0) || 0;
                next[key] = String(cur + p);
            }
            return next;
        });
        setColBulk((prev) => ({ ...prev, [c]: '' }));
    };

    const clearAll = () => {
        setIsReviewOpen(false);
        setCells(() => {
            const init = {};
            for (const r of DIGITS) for (const c of DIGITS) init[`${r}${c}`] = '';
            return init;
        });
        setRowBulk(Object.fromEntries(DIGITS.map((d) => [d, ''])));
        setColBulk(Object.fromEntries(DIGITS.map((d) => [d, ''])));
        // Reset scheduled date to today after bet is placed
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        try {
            localStorage.removeItem('betSelectedDate');
        } catch (e) {
            // Ignore errors
        }
    };

    const handleSubmitBet = () => {
        if (!rows.length) {
            showWarning('Please enter points for at least one Jodi.');
            return;
        }
        setIsReviewOpen(true);
    };

    const handleCloseReview = () => {
        // keep same behavior as other screens: cancel clears
        clearAll();
    };

    const handleConfirmReview = async () => {
        const marketId = market?._id || market?.id;
        if (!marketId) throw new Error('Market not found');
        const payload = rows.map((r) => ({
            betType: 'jodi',
            betNumber: String(r.number),
            amount: Number(r.points) || 0,
            betOn: 'open',
        }));
        
        // Check if date is in the future (scheduled bet)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateObj = new Date(selectedDate);
        selectedDateObj.setHours(0, 0, 0, 0);
        const scheduledDate = selectedDateObj > today ? selectedDate : null;
        
        const result = await placeBet(marketId, payload, scheduledDate);
        if (!result.success) throw new Error(result.message);
        if (result.data?.newBalance != null) updateUserBalance(result.data.newBalance);
        setIsReviewOpen(false);
        clearAll();
    };

    return (
        <BidLayout
            market={market}
            title={title}
            bidsCount={rows.length}
            totalPoints={totalPoints}
            session={session}
            setSession={setSession}
            sessionOptionsOverride={['OPEN']}
            lockSessionSelect
            hideSessionSelectCaret
            // Desktop only: make date ~1/3 width and keep controls same height
            dateSessionGridClassName="md:grid-cols-[1fr_2fr]"
            selectedDate={selectedDate}
            setSelectedDate={handleDateChange}
            sessionRightSlot={
                <div className="hidden md:flex items-center gap-3 flex-1 min-w-0 justify-end">
                    <button
                        type="button"
                        onClick={handleSubmitBet}
                        disabled={!canSubmit}
                        className={`inline-flex items-center justify-center font-bold text-base min-h-[52px] min-w-[200px] px-6 rounded-full shadow-lg transition-all whitespace-nowrap shrink-0 ${
                            canSubmit
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 active:scale-[0.98]'
                                : 'bg-gradient-to-r from-primary-300 to-primary-400 text-white opacity-50 cursor-not-allowed'
                        }`}
                    >
                        Submit Bet
                    </button>
                    <button
                        type="button"
                        onClick={clearAll}
                        className="shrink-0 px-4 py-2.5 min-h-[52px] rounded-full text-sm font-semibold border-2 border-primary-300 text-primary-600 bg-[#252D3A] hover:bg-primary-500/20 active:scale-[0.98] transition-all"
                    >
                        Clear
                    </button>
                </div>
            }
            walletBalance={walletBefore}
            hideFooter
            contentPaddingClass="pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-8"
        >
            <div className="px-2 sm:px-3 md:px-4 py-3 md:py-4 w-full">
                {warning && (
                    <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-600 rounded-xl px-4 py-3 text-sm">
                        {warning}
                    </div>
                )}

                <div className="p-2 sm:p-3 md:p-4 w-full overflow-visible md:overflow-hidden">
                    {/* Full width: left column fixed so 10 data columns align under headers and use remaining space */}
                    <div className="overflow-x-hidden w-full">
                        <div
                            className="grid gap-1 md:gap-2 w-full justify-items-stretch items-center"
                            style={{
                                gridTemplateColumns: isDesktop
                                    ? `clamp(56px, 9vw, 80px) 8px repeat(10, 1fr)`
                                    : `52px 6px repeat(10, minmax(0, 1fr))`,
                                width: '100%',
                            }}
                        >
                            {/* Header digits — each centered in its column */}
                            <div className="h-6 md:h-8" />
                            <div className="h-6 md:h-8" />
                            {visibleDigits.map((c) => (
                                <div
                                    key={`h-${c}`}
                                    className="h-6 md:h-8 min-w-0 flex items-center justify-center text-primary-500 font-medium text-[9px] md:text-sm"
                                >
                                    {c}
                                </div>
                            ))}

                            {/* Column bulk label (vertical Pts) */}
                            <div className="h-6 md:h-8 min-w-0 flex items-center justify-center text-[8px] md:text-xs text-gray-300 font-normal">
                                <span className="md:hidden">Pts</span>
                                <span className="hidden md:inline">Pts</span>
                            </div>
                            <div className="h-6 md:h-8" />
                            {visibleDigits.map((c) => (
                                <input
                                    key={`col-${c}`}
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Pts"
                                    value={colBulk[c]}
                                    onChange={(e) => setColBulk((p) => ({ ...p, [c]: sanitizePoints(e.target.value) }))}
                                    onBlur={() => {
                                        if (colBulk[c]) applyCol(c, colBulk[c]);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && colBulk[c]) applyCol(c, colBulk[c]);
                                    }}
                                    className="no-spinner w-full min-w-0 h-6 md:h-8 bg-[#252D3A] border border-[#333D4D] md:border-2 text-white font-bold rounded text-[8px] md:text-xs text-center placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-primary-500"
                                />
                            ))}

                            {/* Matrix rows */}
                            {DIGITS.map((r) => (
                                <React.Fragment key={`row-${r}`}>
                                    {/* Row label + vertical Pts box */}
                                    <div className="flex items-center gap-1 md:gap-1.5 min-w-0 w-full overflow-hidden">
                                        <div className="w-5 md:w-7 h-6 md:h-8 flex items-center justify-center text-primary-500 font-medium text-[9px] md:text-sm shrink-0 rounded bg-[#252D3A]/50 border border-[#333D4D]">
                                            {r}
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Pts"
                                            value={rowBulk[r]}
                                            onChange={(e) => setRowBulk((p) => ({ ...p, [r]: sanitizePoints(e.target.value) }))}
                                            onBlur={() => {
                                                if (rowBulk[r]) applyRow(r, rowBulk[r]);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && rowBulk[r]) applyRow(r, rowBulk[r]);
                                            }}
                                            className="no-spinner h-6 md:h-8 flex-1 min-w-0 w-full bg-[#252D3A] border border-[#333D4D] md:border-2 text-white font-bold rounded text-[8px] md:text-xs text-center placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-primary-500"
                                        />
                                    </div>
                                    <div className="h-6 md:h-8" />

                                    {visibleDigits.map((c) => {
                                        const key = `${r}${c}`;
                                        return (
                                            <div key={key} className="flex flex-col items-center justify-center min-w-0 gap-0.5 w-full">
                                                <div className="text-[7px] md:text-[10px] leading-none text-gray-400 font-normal select-none text-center w-full">
                                                    {key[0]}{key[1]}
                                                </div>
                                                <input
                                                    ref={(el) => {
                                                        cellRefs.current[`${r}-${c}`] = el;
                                                    }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={cells[key]}
                                                    onChange={(e) =>
                                                        setCells((p) => ({
                                                            ...p,
                                                            [key]: sanitizePoints(e.target.value),
                                                        }))
                                                    }
                                                    onKeyDown={(e) => handleCellKeyDown(e, r, c)}
                                                    className="no-spinner h-6 md:h-8 w-full min-w-0 bg-[#252D3A] border border-[#333D4D] md:border-2 text-white font-bold rounded text-[8px] md:text-xs text-center placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-primary-500"
                                                />
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky row: Submit (left) + Clear (right) on mobile */}
            <div className="fixed left-0 right-0 z-20 px-3 sm:px-4 pb-1 md:hidden flex items-center gap-2" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 8px)' }}>
                <button
                    type="button"
                    onClick={handleSubmitBet}
                    disabled={!canSubmit}
                    className={`flex-1 min-w-0 font-semibold py-2.5 min-h-[44px] text-sm rounded-xl shadow-md transition-all active:scale-[0.98] ${
                        canSubmit
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
                            : 'bg-gradient-to-r from-primary-300 to-primary-400 text-white opacity-50 cursor-not-allowed'
                    }`}
                >
                    Submit Bet
                </button>
                <button
                    type="button"
                    onClick={clearAll}
                    className="shrink-0 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold border-2 border-primary-300 text-primary-600 bg-[#252D3A] hover:bg-primary-500/20 active:scale-[0.98] transition-all"
                >
                    Clear
                </button>
            </div>

            <BidReviewModal
                open={isReviewOpen}
                onClose={handleCloseReview}
                onSubmit={handleConfirmReview}
                marketTitle={marketTitle}
                dateText={dateText}
                labelKey="Jodi"
                rows={rows}
                walletBefore={walletBefore}
                totalBids={rows.length}
                totalAmount={totalPoints}
                isScheduled={selectedDate > new Date().toISOString().split('T')[0]}
            />
        </BidLayout>
    );
};

export default JodiBulkBid;

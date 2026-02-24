import React, { useMemo, useRef, useState } from 'react';
import BidLayout from '../BidLayout';
import BidReviewModal from './BidReviewModal';
import { isValidAnyPana } from './panaRules';
import { placeBet, updateUserBalance } from '../../../api/bets';

const sanitizeDigits = (v, maxLen) => (v ?? '').toString().replace(/\D/g, '').slice(0, maxLen);
const sanitizePoints = (v) => (v ?? '').toString().replace(/\D/g, '').slice(0, 6);

// Half Sangam: single game with common UI for (O) Open Pana + Close Ank and (C) Open Ank + Close Pana
const HalfSangamBid = ({ market, title }) => {
    const [session, setSession] = useState('OPEN');
    const [bids, setBids] = useState([]);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [warning, setWarning] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => {
        try {
            const savedDate = localStorage.getItem('betSelectedDate');
            if (savedDate) {
                const today = new Date().toISOString().split('T')[0];
                if (savedDate > today) return savedDate;
            }
        } catch (e) {}
        return new Date().toISOString().split('T')[0];
    });

    const handleDateChange = (newDate) => {
        try { localStorage.setItem('betSelectedDate', newDate); } catch (e) {}
        setSelectedDate(newDate);
    };

    const showWarning = (msg) => {
        setWarning(msg);
        window.clearTimeout(showWarning._t);
        showWarning._t = window.setTimeout(() => setWarning(''), 2200);
    };

    const walletBefore = useMemo(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || 'null');
            const val = u?.wallet ?? u?.balance ?? u?.points ?? u?.walletAmount ?? u?.wallet_amount ?? u?.amount ?? 0;
            const n = Number(val);
            return Number.isFinite(n) ? n : 0;
        } catch (e) { return 0; }
    }, []);

    const marketTitle = market?.gameName || market?.marketName || title;
    const dateText = new Date().toLocaleDateString('en-GB');
    const totalPoints = useMemo(() => bids.reduce((sum, b) => sum + Number(b.points || 0), 0), [bids]);
    const submitBtnClass = (enabled) =>
        enabled
            ? 'w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold py-3.5 min-h-[48px] rounded-lg shadow-md hover:from-primary-600 hover:to-primary-700 transition-all active:scale-[0.98]'
            : 'w-full bg-gradient-to-r from-primary-300 to-primary-400 text-white font-bold py-3.5 min-h-[48px] rounded-lg shadow-md opacity-50 cursor-not-allowed';

    const clearAll = () => {
        setIsReviewOpen(false);
        setBids([]);
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        try { localStorage.removeItem('betSelectedDate'); } catch (e) {}
    };

    const handleSubmitBet = async () => {
        const marketId = market?._id || market?.id;
        if (!marketId) throw new Error('Market not found');
        if (!bids.length) throw new Error('No bets to place');
        const payload = bids.map((b) => ({
            betType: 'half-sangam',
            betNumber: String(b?.number ?? '').trim(),
            amount: Number(b?.points) || 0,
            betOn: String(b?.type || session).toUpperCase() === 'CLOSE' ? 'close' : 'open',
        })).filter((b) => b.betNumber && b.amount > 0);
        if (!payload.length) throw new Error('No valid bets to place');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateObj = new Date(selectedDate);
        selectedDateObj.setHours(0, 0, 0, 0);
        const scheduledDate = selectedDateObj > today ? selectedDate : null;
        const result = await placeBet(marketId, payload, scheduledDate);
        if (!result.success) throw new Error(result.message || 'Failed to place bet');
        if (result.data?.newBalance != null) updateUserBalance(result.data.newBalance);
        clearAll();
    };

    const handleDelete = (id) => setBids((prev) => prev.filter((b) => b.id !== id));
    const openReview = () => {
        if (!bids.length) { showWarning('Please add at least one Sangam.'); return; }
        setIsReviewOpen(true);
    };

    const inputCl = 'flex-1 min-w-0 bg-white border-2 border-primary-200 text-gray-800 placeholder-gray-400 rounded-full py-2.5 min-h-[40px] px-4 text-center text-sm focus:ring-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500';
    const labelCl = 'text-gray-700 text-sm font-medium shrink-0 w-40';

    return (
        <BidLayout
            market={market}
            title={title}
            bidsCount={bids.length}
            totalPoints={totalPoints}
            showDateSession={true}
            selectedDate={selectedDate}
            setSelectedDate={handleDateChange}
            session={session}
            setSession={setSession}
            sessionOptionsOverride={['OPEN']}
            lockSessionSelect
            hideSessionSelectCaret
            hideFooter
            walletBalance={walletBefore}
            contentPaddingClass="pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-6"
        >
            <div className="px-3 sm:px-4 py-4 md:max-w-7xl md:mx-auto">
                {warning && (
                    <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-600 rounded-xl px-4 py-3 text-sm">
                        {warning}
                    </div>
                )}

                <div className="md:grid md:grid-cols-2 md:gap-12 md:items-start space-y-8 md:space-y-0">
                    {/* Left: Half Sangam (O) + Half Sangam (C) forms */}
                    <div className="space-y-6">
                        {/* Half Sangam (O): Open Pana + Close Ank */}
                        <HalfSangamOSection
                            bids={bids}
                            setBids={setBids}
                            session={session}
                            showWarning={showWarning}
                            inputCl={inputCl}
                            labelCl={labelCl}
                            sanitizeDigits={sanitizeDigits}
                            sanitizePoints={sanitizePoints}
                            isValidAnyPana={isValidAnyPana}
                        />
                        {/* Half Sangam (C): Open Ank + Close Pana */}
                        <HalfSangamCSection
                            bids={bids}
                            setBids={setBids}
                            session={session}
                            showWarning={showWarning}
                            inputCl={inputCl}
                            labelCl={labelCl}
                            sanitizeDigits={sanitizeDigits}
                            sanitizePoints={sanitizePoints}
                            isValidAnyPana={isValidAnyPana}
                        />

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                            <button
                                type="button"
                                onClick={openReview}
                                disabled={!bids.length}
                                className={submitBtnClass(!!bids.length)}
                            >
                                Submit Bet
                            </button>
                        </div>
                    </div>

                    {/* Right: combined list */}
                    <div className="mt-10 md:mt-0">
                        <div className="grid grid-cols-[1.4fr_0.7fr_0.6fr] gap-2 sm:gap-3 text-center text-primary-500 font-bold text-xs sm:text-sm mb-2 px-2">
                            <div className="truncate">Sangam</div>
                            <div className="truncate">Amount</div>
                            <div className="truncate">Delete</div>
                        </div>
                        <div className="h-px bg-primary-200 w-full mb-2" />
                        {bids.length === 0 ? null : (
                            <div className="space-y-2">
                                {bids.map((b) => (
                                    <div
                                        key={b.id}
                                        className="grid grid-cols-[1.4fr_0.7fr_0.6fr] gap-2 sm:gap-3 text-center items-center py-2.5 px-3 bg-primary-50 rounded-lg border-2 border-primary-200 text-sm"
                                    >
                                        <div className="font-bold text-gray-800 truncate">{b.number}</div>
                                        <div className="font-bold text-primary-500 truncate">{b.points}</div>
                                        <div className="flex justify-center">
                                            <button type="button" onClick={() => handleDelete(b.id)} className="p-2 text-red-500 hover:text-red-600 active:scale-95" aria-label="Delete">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BidReviewModal
                open={isReviewOpen}
                onClose={clearAll}
                onSubmit={handleSubmitBet}
                marketTitle={marketTitle}
                dateText={dateText}
                labelKey="Sangam"
                rows={bids}
                walletBefore={walletBefore}
                totalBids={bids.length}
                totalAmount={totalPoints}
            />
        </BidLayout>
    );
};

function HalfSangamOSection({ bids, setBids, session, showWarning, inputCl, labelCl, sanitizeDigits, sanitizePoints, isValidAnyPana }) {
    const [openPana, setOpenPana] = useState('');
    const [closeAnk, setCloseAnk] = useState('');
    const [points, setPoints] = useState('');
    const [openPanaInvalid, setOpenPanaInvalid] = useState(false);
    const pointsInputRef = useRef(null);

    const handleAdd = () => {
        const pts = Number(points);
        if (!pts || pts <= 0) { showWarning('Please enter points.'); return; }
        if (!isValidAnyPana(openPana)) {
            showWarning('Open Pana must be a valid Pana (Single / Double / Triple).');
            return;
        }
        const enteredCloseAnk = (closeAnk ?? '').toString().trim();
        if (!/^[0-9]$/.test(enteredCloseAnk)) {
            showWarning('Please enter a valid Close Ank (0-9).');
            return;
        }
        const numberKey = `${openPana}-${enteredCloseAnk}`;
        setBids((prev) => {
            const next = [...prev];
            const idx = next.findIndex((b) => String(b.number) === numberKey && String(b.type) === String(session));
            if (idx >= 0) {
                const cur = Number(next[idx].points || 0) || 0;
                next[idx] = { ...next[idx], points: String(cur + pts) };
                return next;
            }
            return [...next, { id: Date.now() + Math.random(), number: numberKey, points: String(pts), type: session }];
        });
        setOpenPana('');
        setCloseAnk('');
        setPoints('');
    };

    return (
        <div className="p-4 rounded-xl border-2 border-primary-200 bg-primary-50/50 space-y-3">
            <h3 className="text-primary-600 font-semibold text-sm">Half Sangam (O) — Open Pana + Close Ank</h3>
            <div className="flex flex-row items-center gap-2">
                <label className={labelCl}>Open Pana:</label>
                <input
                    type="text"
                    inputMode="numeric"
                    value={openPana}
                    onChange={(e) => {
                        const next = sanitizeDigits(e.target.value, 3);
                        setOpenPana(next);
                        setOpenPanaInvalid(!!next && next.length === 3 && !isValidAnyPana(next));
                        if (next.length === 3) pointsInputRef.current?.focus?.();
                    }}
                    placeholder="Pana"
                    className={`${inputCl} ${openPanaInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                />
            </div>
            <div className="flex flex-row items-center gap-2">
                <label className={labelCl}>Close Ank:</label>
                <input
                    type="text"
                    inputMode="numeric"
                    value={closeAnk}
                    onChange={(e) => setCloseAnk(sanitizeDigits(e.target.value, 1))}
                    placeholder="Ank"
                    className={inputCl}
                />
            </div>
            <div className="flex flex-row items-center gap-2">
                <label className={labelCl}>Points:</label>
                <input
                    ref={pointsInputRef}
                    type="text"
                    inputMode="numeric"
                    value={points}
                    onChange={(e) => setPoints(sanitizePoints(e.target.value))}
                    placeholder="Point"
                    className={`no-spinner ${inputCl}`}
                />
            </div>
            <button type="button" onClick={handleAdd} className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold py-3 min-h-[44px] rounded-lg shadow-md hover:from-primary-600 hover:to-primary-700 transition-all active:scale-[0.98]">
                Add to List
            </button>
        </div>
    );
}

function HalfSangamCSection({ bids, setBids, session, showWarning, inputCl, labelCl, sanitizeDigits, sanitizePoints, isValidAnyPana }) {
    const [openAnk, setOpenAnk] = useState('');
    const [closePana, setClosePana] = useState('');
    const [points, setPoints] = useState('');
    const [closePanaInvalid, setClosePanaInvalid] = useState(false);
    const pointsInputRef = useRef(null);

    const handleAdd = () => {
        const pts = Number(points);
        if (!pts || pts <= 0) { showWarning('Please enter points.'); return; }
        if (!isValidAnyPana(closePana)) {
            showWarning('Close Pana must be a valid Pana (Single / Double / Triple).');
            return;
        }
        const enteredOpenAnk = (openAnk ?? '').toString().trim();
        if (!/^[0-9]$/.test(enteredOpenAnk)) {
            showWarning('Please enter a valid Open Ank (0-9).');
            return;
        }
        const numberKey = `${enteredOpenAnk}-${closePana}`;
        setBids((prev) => {
            const next = [...prev];
            const idx = next.findIndex((b) => String(b.number) === numberKey && String(b.type) === String(session));
            if (idx >= 0) {
                const cur = Number(next[idx].points || 0) || 0;
                next[idx] = { ...next[idx], points: String(cur + pts) };
                return next;
            }
            return [...next, { id: Date.now() + Math.random(), number: numberKey, points: String(pts), type: session }];
        });
        setOpenAnk('');
        setClosePana('');
        setPoints('');
    };

    return (
        <div className="p-4 rounded-xl border-2 border-primary-200 bg-primary-50/50 space-y-3">
            <h3 className="text-primary-600 font-semibold text-sm">Half Sangam (C) — Open Ank + Close Pana</h3>
            <div className="flex flex-row items-center gap-2">
                <label className={labelCl}>Open Ank:</label>
                <input
                    type="text"
                    inputMode="numeric"
                    value={openAnk}
                    onChange={(e) => setOpenAnk(sanitizeDigits(e.target.value, 1))}
                    placeholder="Ank"
                    className={inputCl}
                />
            </div>
            <div className="flex flex-row items-center gap-2">
                <label className={labelCl}>Close Pana:</label>
                <input
                    type="text"
                    inputMode="numeric"
                    value={closePana}
                    onChange={(e) => {
                        const next = sanitizeDigits(e.target.value, 3);
                        setClosePana(next);
                        setClosePanaInvalid(!!next && next.length === 3 && !isValidAnyPana(next));
                        if (next.length === 3) pointsInputRef.current?.focus?.();
                    }}
                    placeholder="Pana"
                    className={`${inputCl} ${closePanaInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                />
            </div>
            <div className="flex flex-row items-center gap-2">
                <label className={labelCl}>Points:</label>
                <input
                    ref={pointsInputRef}
                    type="text"
                    inputMode="numeric"
                    value={points}
                    onChange={(e) => setPoints(sanitizePoints(e.target.value))}
                    placeholder="Point"
                    className={`no-spinner ${inputCl}`}
                />
            </div>
            <button type="button" onClick={handleAdd} className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold py-3 min-h-[44px] rounded-lg shadow-md hover:from-primary-600 hover:to-primary-700 transition-all active:scale-[0.98]">
                Add to List
            </button>
        </div>
    );
}

export default HalfSangamBid;

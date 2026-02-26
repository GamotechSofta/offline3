import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBettingWindow } from './BettingWindowContext';

const getWalletFromStorage = () => {
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
};

const BidLayout = ({
    market,
    title,
    children,
    bidsCount,
    totalPoints,
    showDateSession = true,
    extraHeader,
    session = 'OPEN',
    setSession = () => {},
    sessionRightSlot = null,
    // Optional: override allowed session options for this page (e.g. ['OPEN'])
    sessionOptionsOverride = null,
    // Optional: lock session dropdown (prevents selecting OPEN/CLOSE)
    lockSessionSelect = false,
    // Optional: hide the session dropdown caret icon
    hideSessionSelectCaret = false,
    dateSessionControlClassName = '',
    dateSessionGridClassName = '',
    footerRightOnDesktop = false,
    hideFooter = false,
    walletBalance,
    onSubmit = () => {},
    showFooterStats = true,
    submitLabel = 'Submit Bets',
    contentPaddingClass,
    selectedDate = null,
    setSelectedDate = null,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const contentRef = useRef(null);
    const dateInputRef = React.useRef(null);
    const { allowed: bettingAllowed, closeOnly: bettingCloseOnly, message: bettingMessage } = useBettingWindow();
    const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const wallet = Number.isFinite(Number(walletBalance)) ? Number(walletBalance) : getWalletFromStorage();
    
    // Get minimum date (today) and maximum date (tomorrow only - scheduling is for next day only)
    const { minDate, maxDate } = React.useMemo(() => {
        const today = new Date();
        const min = today.toISOString().split('T')[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const max = tomorrow.toISOString().split('T')[0];
        return { minDate: min, maxDate: max };
    }, []);

    // Internal state for date if not provided via props
    // Try to restore from localStorage (only today or tomorrow), otherwise default to today
    const [internalDate, setInternalDate] = React.useState(() => {
        try {
            const savedDate = localStorage.getItem('betSelectedDate');
            if (savedDate) {
                const today = new Date().toISOString().split('T')[0];
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const maxAllowed = tomorrow.toISOString().split('T')[0];
                // Only restore if saved date is tomorrow (scheduling); ignore past or far-future
                if (savedDate > today && savedDate <= maxAllowed) {
                    return savedDate;
                }
            }
        } catch (e) {
            // Ignore errors
        }
        const today = new Date();
        return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    });
    
    const currentDate = selectedDate !== null ? selectedDate : internalDate;
    const setCurrentDate = setSelectedDate !== null ? setSelectedDate : (newDate) => {
        // Save to localStorage when date changes
        try {
            localStorage.setItem('betSelectedDate', newDate);
        } catch (e) {
            // Ignore errors
        }
        setInternalDate(newDate);
    };

    const marketStatus = market?.status;
    const isRunning = marketStatus === 'running'; // "CLOSED IS RUNNING" = market is open for betting
    // Scheduling only for closed markets; open/running = today only, no tomorrow option
    const canSchedule = marketStatus === 'closed';

    // When market is NOT closed: force date to today (scheduling only for closed markets)
    React.useEffect(() => {
        if (!canSchedule && currentDate !== minDate) {
            setCurrentDate(minDate);
        }
    }, [canSchedule, minDate, currentDate, setCurrentDate]);

    // When market is closed (canSchedule), only tomorrow - no calendar; force date to tomorrow
    React.useEffect(() => {
        if (canSchedule && currentDate !== maxDate) {
            setCurrentDate(maxDate);
        }
    }, [canSchedule, maxDate, currentDate, setCurrentDate]);

    // Check if selected date is today or in the future (respect maxDate = tomorrow)
    const effectiveDate = !canSchedule ? minDate : (currentDate > maxDate ? maxDate : currentDate);
    const isToday = effectiveDate === minDate;
    // Only treat as scheduled when market is closed AND date is tomorrow (scheduling only for closed markets)
    const isScheduled = canSchedule && effectiveDate > minDate;
    
    // Determine session options based on date selection and betting window:
    // - If today and (market is running OR opening time passed = closeOnly): only CLOSE
    // - If today and market is open: both OPEN and CLOSE
    // - If scheduled (future date): always both OPEN and CLOSE
    const sessionOptions =
        Array.isArray(sessionOptionsOverride) && sessionOptionsOverride.length
            ? sessionOptionsOverride
            : (isToday && (isRunning || bettingCloseOnly) ? ['CLOSE'] : ['OPEN', 'CLOSE']);

    useEffect(() => {
        // If market is "CLOSED IS RUNNING" and it's today, force session to CLOSE and lock it.
        if (Array.isArray(sessionOptionsOverride) && sessionOptionsOverride.length) {
            const desired = sessionOptionsOverride[0];
            if (desired && session !== desired) setSession(desired);
            return;
        }
        // Force CLOSE if it's today and (market is running OR opening time has passed = closeOnly)
        if (isToday && (isRunning || bettingCloseOnly) && session !== 'CLOSE') {
            setSession('CLOSE');
        }
        // If scheduled (future date) and session was locked to CLOSE, allow OPEN option
        if (isScheduled && sessionOptions.includes('OPEN') && session === 'CLOSE' && isRunning) {
            // Don't force change, but allow user to choose OPEN for scheduled bets
        }
    }, [isToday, isScheduled, isRunning, bettingCloseOnly, session, setSession, sessionOptionsOverride, sessionOptions, currentDate]);

    // Scroll to top when route changes
    useEffect(() => {
        const timer = setTimeout(() => {
            // Scroll window
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
            
            // Scroll content container
            if (contentRef.current) {
                contentRef.current.scrollTop = 0;
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className="min-h-screen min-h-ios-screen bg-[#1F2732] font-sans w-full max-w-full overflow-x-hidden">
            {/* Header - minimal height */}
            <div
                className="bg-[#1F2732] border-b border-[#333D4D] py-1 flex items-center justify-between gap-1 sticky top-0 z-10 mt-2 shadow-sm"
                style={{ paddingLeft: 'max(0.5rem, env(safe-area-inset-left))', paddingRight: 'max(0.5rem, env(safe-area-inset-right))' }}
            >
                <button
                    onClick={() => market ? navigate('/bidoptions', { state: { market } }) : navigate(-1)}
                    className="p-1 min-w-[32px] min-h-[32px] flex items-center justify-center bg-[#252D3A] border border-[#333D4D] hover:bg-primary-500/20 hover:border-primary-400 text-white rounded-full active:scale-95 transition-colors touch-manipulation"
                    aria-label="Back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wide truncate flex-1 text-center mx-0.5 text-white min-w-0">
                    {market?.gameName ? `${market.gameName} - ${title}` : title}
                </h1>
                <div className="bg-primary-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold shadow shrink-0">
                    <div className="w-3.5 h-3.5 bg-[#1F2732] rounded flex items-center justify-center text-primary-400 text-[9px] font-bold border border-[#333D4D] leading-none">₹</div>
                    {wallet.toFixed(1)}
                </div>
            </div>

            {!bettingAllowed && bettingMessage && !isScheduled && (
                <div className="mx-3 sm:mx-6 mt-2 p-3 rounded-xl bg-red-50 border-2 border-red-300 text-red-600 text-sm font-medium flex items-center gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {bettingMessage}
                </div>
            )}
            {isScheduled && (
                <div className="mx-3 sm:mx-6 mt-2 p-3 rounded-xl bg-green-50 border-2 border-green-300 text-green-700 text-sm font-medium flex items-center gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    These bets will count for tomorrow&apos;s result.
                </div>
            )}

            {extraHeader}

            {showDateSession && (
                <div
                    className={`pb-2 pt-1 flex flex-row flex-wrap gap-1.5 sm:gap-2 overflow-hidden ${dateSessionGridClassName}`}
                    style={{ paddingLeft: 'max(0.75rem, env(safe-area-inset-left))', paddingRight: 'max(0.75rem, env(safe-area-inset-right))' }}
                >
                    {/* Closed market: show only tomorrow's date (no calendar picker) */}
                    {canSchedule && (
                        <div className="flex-1 min-w-0 flex items-center gap-2 min-w-[140px] py-1">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#252D3A] border-2 border-primary-200 text-white text-xs font-bold">
                                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>
                                    Tomorrow · {(() => {
                                        const d = new Date(maxDate);
                                        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                    })()}
                                </span>
                            </div>
                            <span className="px-2 py-1 rounded-full bg-green-600 text-white text-[10px] sm:text-xs font-semibold shrink-0">Scheduled</span>
                        </div>
                    )}
                    {/* When market is running: no date/schedule (bets are for today only) */}
                    {!canSchedule && (
                        <div className="flex-1 min-w-0 flex items-center justify-center sm:justify-start text-gray-400 text-xs font-medium py-1">
                            Today only
                        </div>
                    )}

                    {/* Session Select - hidden on mobile, each bid screen has its own session control */}
                    <div className="relative flex-1 min-w-0 hidden md:block">
                        <select
                            value={session}
                            onChange={(e) => setSession(e.target.value)}
                            disabled={lockSessionSelect || (isToday && isRunning)}
                            className={`w-full appearance-none bg-[#252D3A] border-2 border-primary-200 text-white font-bold text-xs py-2 min-h-[36px] h-[36px] sm:min-h-[40px] sm:h-[40px] md:min-h-[44px] md:h-[44px] px-4 pr-8 rounded-full text-center focus:outline-none focus:border-primary-500 ${(lockSessionSelect || (isToday && isRunning)) ? 'opacity-60 cursor-not-allowed' : ''} ${dateSessionControlClassName}`}
                        >
                            {sessionOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        {!hideSessionSelectCaret && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        )}
                    </div>

                    {sessionRightSlot}
                </div>
            )}

            <div
                ref={contentRef}
                className={`flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full ios-scroll-touch ${
                    contentPaddingClass ?? (hideFooter ? 'pb-6' : 'pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-32')
                }`}
                style={{ paddingLeft: 'max(0.75rem, env(safe-area-inset-left))', paddingRight: 'max(0.75rem, env(safe-area-inset-right))' }}
            >
                {children}
            </div>

            {/* Footer - Card centered in right 50% on desktop (hidden when submit card is in content) - iOS safe area */}
            {!hideFooter && (
            <div
                className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] left-0 right-0 md:bottom-0 z-10 py-3 md:grid md:grid-cols-2 md:gap-0"
                style={{
                    paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
                    paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
                }}
            >
                <div className="hidden md:block" />
                <div className="flex justify-center md:justify-center">
                    <div
                        className={`w-full max-w-sm md:max-w-md rounded-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 ${
                            showFooterStats
                                ? 'bg-[#252D3A] backdrop-blur-sm border-2 border-[#333D4D] shadow-xl px-4 py-4'
                                : 'bg-transparent border-0 shadow-none p-0'
                        }`}
                    >
                        {showFooterStats && (
                            <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                                <div className="text-center">
                                    <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Bets</div>
                                    <div className="text-base sm:text-lg font-bold text-primary-500">{bidsCount}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Points</div>
                                    <div className="text-base sm:text-lg font-bold text-primary-500">{totalPoints}</div>
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={!bidsCount || (!bettingAllowed && !isScheduled)}
                            className={`flex-1 w-full sm:w-auto sm:min-w-[140px] font-bold py-3 px-6 rounded-xl shadow-lg transition-all text-sm sm:text-base ${
                                bidsCount && (bettingAllowed || isScheduled)
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 active:scale-[0.98]'
                                    : 'bg-gradient-to-r from-primary-300 to-primary-400 text-white opacity-50 cursor-not-allowed'
                            }`}
                        >
                            {submitLabel}
                        </button>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default BidLayout;

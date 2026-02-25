import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isBettingAllowed } from '../utils/marketTiming';

const BidOptions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const market = location.state?.market;
  const marketType = (location.state?.marketType || '').toString().trim().toLowerCase();
  const inferredStarline = (() => {
    const t = marketType;
    if (t === 'starline' || t === 'startline' || t === 'star-line') return true;
    const mType = (market?.marketType || '').toString().trim().toLowerCase();
    if (mType === 'startline' || mType === 'starline') return true;
    const name = (market?.marketName || market?.gameName || '').toString().toLowerCase();
    return name.includes('starline') || name.includes('startline') || name.includes('star line') || name.includes('start line');
  })();
  const isStarline = inferredStarline;

  // Redirect to home if no market (direct URL access or refresh)
  useEffect(() => {
    if (!market) {
      navigate('/', { replace: true });
      return;
    }
    if (isStarline && market?.status === 'closed') {
      navigate('/startline-dashboard', { replace: true });
    }
  }, [market, navigate]);

  const options = [
    {
      id: 1,
      title: 'Single Digit',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769756244/Untitled_90_x_160_px_1080_x_1080_px_1_yinraf.svg"
          alt="Single Digit"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 2,
      title: 'Single Digit Bulk',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769756244/Untitled_90_x_160_px_1080_x_1080_px_1_yinraf.svg"
          alt="Single Digit"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 3,
      title: 'Jodi',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769714108/Untitled_1080_x_1080_px_1080_x_1080_px_7_rpzykt.svg"
          alt="Jodi"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 4,
      title: 'Jodi Bulk',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769714108/Untitled_1080_x_1080_px_1080_x_1080_px_7_rpzykt.svg"
          alt="Jodi Bulk"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 5,
      title: 'Single Pana',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769714254/Untitled_1080_x_1080_px_1080_x_1080_px_8_jdbxyd.svg"
          alt="Single Pana"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 6,
      title: 'Single Pana Bulk',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769714254/Untitled_1080_x_1080_px_1080_x_1080_px_8_jdbxyd.svg"
          alt="Single Pana Bulk"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 7,
      title: 'Double Pana',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769713943/Untitled_1080_x_1080_px_1080_x_1080_px_6_uccv7o.svg"
          alt="Double Pana"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 8,
      title: 'Double Pana Bulk',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769713943/Untitled_1080_x_1080_px_1080_x_1080_px_6_uccv7o.svg"
          alt="Double Pana Bulk"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 9,
      title: 'Triple Pana',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769714392/Untitled_1080_x_1080_px_1080_x_1080_px_9_ugcdef.svg"
          alt="Triple Pana"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 10,
      title: 'Full Sangam',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1770033671/Untitled_design_2_kr1imj.svg"
          alt="Full Sangam"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
    {
      id: 11,
      title: 'Half Sangam',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1770033165/Untitled_design_c5hag8.svg"
          alt="Half Sangam"
          className="w-full h-full object-contain pointer-events-none"
        />
      ),
    },
  ];

  if (!market) {
    return null; // Will redirect via useEffect
  }

  // Hide OPEN-only games once opening time has passed (close-only window).
  const timing = isBettingAllowed(market);
  const isCloseOnlyWindow = timing.allowed && timing.closeOnly === true;
  const isRunning = market.status === 'running' || isCloseOnlyWindow;
  const visibleOptionsBase = isStarline
    ? options.filter((opt) => {
        const t = (opt.title || '').toString().trim();
        const allowed = new Set([
          'Single Digit',
          'Single Digit Bulk',
          'Single Pana',
          'Single Pana Bulk',
          'Double Pana',
          'Double Pana Bulk',
          'Triple Pana',
          'Half Sangam',
        ]);
        return allowed.has(t);
      })
    : options;

  const visibleOptions = (!isStarline && isRunning)
    ? visibleOptionsBase.filter((opt) => {
        const t = (opt.title || '').toLowerCase().trim();
        // Support both legacy (A/B) and current (O/C) naming.
        const hideWhenRunning = new Set([
          'jodi',
          'jodi bulk',
          'full sangam',
          'half sangam',
        ]);
        return !hideWhenRunning.has(t);
      })
    : visibleOptionsBase;

  return (
    <div className="min-h-[100dvh] h-full overflow-x-hidden bg-[#1F2732] flex flex-col">
      {/* Header: clear hierarchy, 44px touch target */}
      <header className="w-full flex-shrink-0 flex items-center justify-between gap-3 px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:pb-4 bg-[#1F2732] border-b border-[#333D4D]">
        <button
          onClick={() => navigate(isStarline ? '/startline-dashboard' : '/')}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-gray-400 hover:text-primary-400 hover:bg-[#252D3A] active:scale-95 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[#1F2732]"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0 text-center">
          <h1 className="text-white font-bold text-sm sm:text-base truncate uppercase tracking-wide" title={market?.gameName || 'Select market'}>
            {market?.gameName || 'SELECT MARKET'}
          </h1>
          {isStarline && (
            <p className="mt-0.5 text-[10px] sm:text-xs font-semibold tracking-widest text-primary-400 uppercase">
              Starline
            </p>
          )}
        </div>
        <div className="min-w-[44px]" aria-hidden />
      </header>

      {/* Grid: scrollable on mobile even when touching cards; pan-y allows vertical scroll */}
      <main className="scroll-on-tap-mobile flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden ios-scroll-touch">
        <div className="w-full max-w-2xl lg:max-w-none mx-auto px-3 sm:px-4 py-4 sm:py-5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-2.5 sm:gap-x-3 sm:gap-y-2.5 md:gap-x-4 md:gap-y-3">
          {visibleOptions.map((option) => (
            <button
              type="button"
              key={option.id}
              onClick={() => navigate('/game-bid', {
                state: {
                  market,
                  betType: option.title,
                  gameMode: option.title.toLowerCase().includes('bulk') ? 'bulk' : 'easy'
                }
              })}
              className="scroll-card relative rounded-xl md:rounded-2xl bg-[#252D3A] border border-[#333D4D] md:border-2 md:border-[#333D4D] md:hover:border-primary-500/60 p-2.5 sm:p-3 md:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5 hover:bg-[#2a3342] md:hover:bg-primary-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] w-full aspect-square md:aspect-auto md:min-h-[140px] group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[#1F2732] focus:border-primary-500/80"
              aria-label={`${option.title} – choose this bet type`}
            >
              <div className="flex items-center justify-center w-full flex-1 min-h-0 min-w-0 aspect-square max-w-[76px] max-h-[76px] sm:max-w-[80px] sm:max-h-[80px] md:max-w-[88px] md:max-h-[88px] lg:max-w-[96px] lg:max-h-[96px] shrink-0 transition-transform duration-200 group-hover:scale-[1.05] group-active:scale-[1.02]">
                {option.icon}
              </div>
              <span className="text-white text-[9px] sm:text-[11px] md:text-sm font-semibold tracking-wide uppercase text-center line-clamp-2 leading-tight shrink-0">
                {option.title}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default BidOptions;

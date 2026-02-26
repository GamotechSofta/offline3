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
          alt="Triple Pana"
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
    <div className="min-h-[100dvh] h-full overflow-x-hidden bg-[#1a2029] flex flex-col">
      {/* Header — clean bar with even padding */}
      <header className="w-full flex-shrink-0 flex items-center justify-between p-4 md:p-5 bg-[#1F2732] border-b border-[#2d3644]">
        <button
          onClick={() => navigate(isStarline ? '/startline-dashboard' : '/')}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1F2732]"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0 mx-4 text-center">
          <h1 className="text-white font-semibold text-sm md:text-base tracking-wide uppercase truncate">
            {market?.gameName || 'Select market'}
          </h1>
          {isStarline && (
            <p className="mt-0.5 text-[10px] md:text-xs font-medium tracking-widest text-primary-400 uppercase">
              Starline
            </p>
          )}
        </div>
        <div className="w-10 h-10" aria-hidden />
      </header>

      {/* Grid — 6 cols desktop, square cards, max-width for large screens */}
      <main className="w-full flex-1 min-h-0 flex flex-col items-center">
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6 grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-5 flex-1 content-start">
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
              className="relative rounded-xl md:rounded-2xl bg-[#252D3A] border border-[#3d4a5c] p-3 md:p-4 flex flex-col items-center justify-center gap-2 min-h-0 w-full aspect-square shadow-sm hover:border-primary-500/60 hover:bg-[#2a3340] hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1F2732] group"
            >
              <div className="flex items-center justify-center w-full min-w-0 aspect-square max-w-[72px] max-h-[72px] sm:max-w-[80px] sm:max-h-[80px] md:max-w-[88px] md:max-h-[88px] shrink-0 group-hover:scale-105 transition-transform duration-200">
                {option.icon}
              </div>
              <span className="text-white/95 text-[10px] sm:text-xs md:text-sm font-medium tracking-wider uppercase text-center line-clamp-2 leading-tight shrink-0">
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

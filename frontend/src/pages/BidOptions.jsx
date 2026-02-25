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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
          className="w-full h-full object-contain"
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
    <div className="h-[100dvh] h-screen max-h-[100dvh] overflow-hidden bg-[#1F2732] flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex-shrink-0 flex items-center px-3 sm:px-4 pt-4 sm:pt-5 pb-3 sm:pb-4 bg-[#1F2732] border-b-2 border-gray-700 relative shadow-sm">
        <button
          onClick={() => navigate(isStarline ? '/startline-dashboard' : '/')}
          className="absolute left-3 sm:left-4 flex items-center justify-center min-w-[44px] min-h-[44px] -ml-1 text-gray-600 hover:text-primary-500 active:scale-95 touch-manipulation"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="w-full text-center pr-12 pl-12 min-w-0">
          {/* Dynamic market name from selected market */}
          <h1 className="text-white font-bold text-base sm:text-lg tracking-wider uppercase inline-block border-b-2 border-primary-500 pb-1 px-2 py-1 truncate max-w-full">
            {market?.gameName || 'SELECT MARKET'}
          </h1>
          {isStarline ? (
            <div className="mt-2 text-xs font-extrabold tracking-[0.22em] text-primary-500 uppercase">
              STARLINE MARKET
            </div>
          ) : null}
        </div>
      </div>

      {/* Grid Content: page doesn't scroll; grid scrolls inside viewport if needed */}
      <div className="w-full flex-1 min-h-0 max-w-md lg:max-w-none px-2.5 sm:px-4 pt-2.5 sm:pt-4 pb-3 md:pb-6 overflow-y-auto overflow-x-hidden grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 md:gap-4 content-start">
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
            className="relative rounded-xl sm:rounded-2xl bg-[#252D3A] border-2 border-[#333D4D] flex flex-col items-center justify-start overflow-hidden hover:border-[#4a5568] hover:bg-primary-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-lg group touch-manipulation text-left w-full aspect-square max-md:min-h-0 md:aspect-auto md:min-h-[140px] p-1.5 sm:p-3 md:p-4"
          >
            {/* Icon area: larger on mobile (more of card), normal on md+ */}
            <div className="flex-1 min-h-0 w-full flex items-center justify-center p-1 sm:p-3 group-hover:scale-[1.03] transition-transform duration-300">
              <div className="aspect-square w-[92%] max-h-[78%] md:w-[72%] md:max-w-[88px] md:max-h-[70%] flex items-center justify-center shrink-0">
                {option.icon}
              </div>
            </div>
            {/* Title: fixed at bottom; smaller text on mobile */}
            <span className="text-white text-[9px] sm:text-xs md:text-sm font-semibold tracking-[0.06em] sm:tracking-[0.12em] uppercase text-center line-clamp-2 leading-tight w-full shrink-0 pb-0.5">
              {option.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BidOptions;

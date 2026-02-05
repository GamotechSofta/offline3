import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Funds = () => {
  const navigate = useNavigate();
  // One-screen behavior (same as My Bets)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const items = useMemo(() => ([
    {
      title: 'Add Fund',
      subtitle: 'You can add fund to your wallet',
      color: '#34a853',
      icon: <span className="text-3xl font-extrabold text-black leading-none">₹</span>,
    },
    {
      title: 'Withdraw Fund',
      subtitle: 'You can withdraw winnings',
      color: '#ef4444',
      icon: (
        <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4-4l4 4 4-4M16 6a6 6 0 00-8 0" />
        </svg>
      ),
    },
    {
      title: 'Bank Detail',
      subtitle: 'Add your bank detail for withdrawals',
      color: '#3b82f6',
      icon: (
        <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 18h18M4 10l8-4 8 4" />
        </svg>
      ),
    },
    {
      title: 'Add Fund History',
      subtitle: 'You can check your add point history',
      color: '#1e3a8a',
      icon: (
        <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 2" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      ),
    },
    {
      title: 'Withdraw Fund History',
      subtitle: 'You can check your Withdraw point history',
      color: '#f59e0b',
      icon: (
        <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 11-2.343-5.657" />
        </svg>
      ),
    },
  ]), []);

  const [activeTitle, setActiveTitle] = useState(items[0]?.title || 'Funds');
  const activeItem = items.find((i) => i.title === activeTitle) || items[0];

  return (
    <div className="min-h-screen bg-black text-white pl-3 pr-3 sm:pl-4 sm:pr-4 pt-0 md:pt-4 pb-20">
      <div className="w-full max-w-lg md:max-w-none mx-auto md:mx-0">
        <div className="mb-4 md:grid md:grid-cols-[360px_1fr] md:gap-6 md:items-center">
          <div className="flex items-center gap-3 pt-4 md:pt-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 active:scale-95 transition"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">Funds</h1>
          </div>

          <div className="hidden md:flex items-center justify-between gap-4 px-1">
            <div className="text-2xl font-extrabold text-white">{activeTitle}</div>
          </div>
        </div>

        {/* Mobile: same list layout (My Bets style) */}
        <div className="space-y-2.5 md:hidden">
          {items.map((item) => (
            <div
              key={item.title}
              onClick={() => setActiveTitle(item.title)}
              className="bg-[#202124] border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setActiveTitle(item.title);
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-black shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
                  style={{ backgroundColor: item.color }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold">{item.title}</p>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-snug">{item.subtitle}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white/70">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: sidebar-style list + right panel (My Bets style) */}
        <div className="hidden md:grid md:grid-cols-[360px_1fr] md:gap-6 md:items-start">
          <aside className="md:sticky md:top-[96px] space-y-2">
            {items.map((item) => {
              const active = item.title === activeTitle;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActiveTitle(item.title)}
                  className={`w-full text-left bg-[#202124] border rounded-2xl p-3 md:p-5 flex items-center justify-between shadow-[0_12px_24px_rgba(0,0,0,0.35)] transition-colors ${
                    active ? 'border-[#d4af37]/40 bg-[#202124]' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-black shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm md:text-base font-semibold text-white truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <div
                    className={`w-8 h-8 md:w-9 md:h-9 rounded-full border flex items-center justify-center ${
                      active ? 'bg-[#d4af37]/15 border-[#d4af37]/35 text-[#d4af37]' : 'bg-black/30 border-white/10 text-white/70'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </aside>

          <main className="rounded-2xl bg-[#202124] border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.35)] p-6">
            <div className="flex items-center justify-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: activeItem?.color || '#f3b61b' }}
              >
                {activeItem?.icon}
              </div>
              <div className="min-w-0 text-center">
                <div className="text-xl font-bold text-white truncate">{activeItem?.title}</div>
                <div className="text-sm text-gray-400">{activeItem?.subtitle}</div>
              </div>
            </div>

            <div className="mt-6 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-hidden">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-gray-300 text-sm">
                Select an item from the left menu. We will add the actual funds pages/content here next.
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Funds;

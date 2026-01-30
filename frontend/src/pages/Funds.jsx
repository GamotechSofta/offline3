import React from 'react';
import { useNavigate } from 'react-router-dom';

const Funds = () => {
  const navigate = useNavigate();
  const items = [
    {
      title: 'Add Fund',
      subtitle: 'You can add fund to your wallet',
      color: '#34a853',
      icon: (
        <span className="text-3xl font-bold text-white leading-none">₹</span>
      )
    },
    {
      title: 'Withdraw Fund',
      subtitle: 'You can withdraw winnings',
      color: '#ef4444',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4-4l4 4 4-4M16 6a6 6 0 00-8 0" />
        </svg>
      )
    },
    {
      title: 'Bank Detail',
      subtitle: 'Add your bank detail for withdrawals',
      color: '#3b82f6',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 18h18M4 10l8-4 8 4" />
        </svg>
      )
    },
    {
      title: 'Add Fund History',
      subtitle: 'You can check your add point history',
      color: '#1e3a8a',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 2" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
    },
    {
      title: 'Withdraw Fund History',
      subtitle: 'You can check your Withdraw point history',
      color: '#f59e0b',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 11-2.343-5.657" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="bg-black px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full border border-gray-700 bg-gray-800 flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-white">Funds</h1>
        </div>
      </div>

      <div className="px-4 pt-2 space-y-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="bg-gray-900 rounded-2xl border border-gray-800 shadow-[0_8px_18px_rgba(0,0,0,0.35)] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.2)]"
                style={{ backgroundColor: item.color }}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-base sm:text-lg font-semibold text-white">{item.title}</p>
                <p className="text-xs sm:text-sm text-gray-400">{item.subtitle}</p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Funds;

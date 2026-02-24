import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { isPastClosingTime } from '../utils/marketTiming';
import { useRefreshOnMarketReset } from '../hooks/useRefreshOnMarketReset';

const Section1 = () => {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // Convert 24-hour time to 12-hour format
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Status: result format OR automatic close when closing time is reached
  // ***-**-*** → Open (green) | 156-2*-*** → Running (green) | 987-45-456 or past closing time → Closed (red)
  const getMarketStatus = (market) => {
    if (isPastClosingTime(market)) {
      return { status: 'closed', timer: null };
    }
    const hasOpening = market.openingNumber && /^\d{3}$/.test(String(market.openingNumber));
    const hasClosing = market.closingNumber && /^\d{3}$/.test(String(market.closingNumber));

    if (hasOpening && hasClosing) {
      return { status: 'closed', timer: null };
    }
    if (hasOpening && !hasClosing) {
      return { status: 'running', timer: null };
    }
    return { status: 'open', timer: null };
  };

  // Fetch markets from API
  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/markets/get-markets`);
      const data = await response.json();

      if (data.success) {
        const mainOnly = (data.data || []).filter((m) => m.marketType !== 'startline');
        const transformedMarkets = mainOnly.map((market) => {
          const st = getMarketStatus(market);
          return {
            id: market._id,
            gameName: market.marketName,
            timeRange: `${formatTime(market.startingTime)} - ${formatTime(market.closingTime)}`,
            result: market.displayResult || '***-**-***',
            status: st.status,
            timer: st.timer,
            winNumber: market.winNumber,
            startingTime: market.startingTime,
            closingTime: market.closingTime,
            betClosureTime: market.betClosureTime ?? 0,
            openingNumber: market.openingNumber,
            closingNumber: market.closingNumber
          };
        });
        setMarkets(transformedMarkets);
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    const dataInterval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(dataInterval);
  }, []);

  useRefreshOnMarketReset(fetchMarkets);


  return (
    <section className="w-full pt-6 sm:pt-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pb-12 md:pb-10">
      {/* Section header - unified for mobile and desktop */}
      <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#333D4D] to-[#333D4D]" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#252D3A] border border-[#333D4D] text-primary-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
            </svg>
          </span>
          <h2 className="text-white text-base sm:text-lg font-semibold tracking-tight uppercase">Markets</h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#333D4D] to-[#333D4D]" />
      </div>

      {/* Market Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-[#333D4D] border-t-primary-500 rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading markets...</p>
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-[#252D3A]/50 border border-[#333D4D]">
          <p className="text-gray-400">No markets available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {markets.map((market) => {
            const isClickable = market.status === 'open' || market.status === 'running';
            return (
              <div
                key={market.id}
                onClick={() => isClickable && navigate('/bidoptions', { state: { market } })}
                role={isClickable ? 'button' : undefined}
                className={`rounded-xl overflow-hidden transition-all duration-200 ${
                  isClickable
                    ? 'bg-[#252D3A] border-2 border-green-500/70 cursor-pointer hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20'
                    : 'bg-[#252D3A] border border-[#333D4D] cursor-not-allowed opacity-70'
                }`}
              >
                {/* Status bar - bold green for Open/Running, muted red for Closed */}
                <div className={`px-3 py-2 text-center ${
                  market.status === 'closed'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-green-600 text-white'
                }`}>
                  <p className={`text-xs font-semibold ${market.status !== 'closed' ? 'font-bold' : ''}`}>
                    {market.status === 'open' && 'Open'}
                    {market.status === 'running' && 'Running'}
                    {market.status === 'closed' && 'Closed'}
                  </p>
                </div>

                <div className="p-3 sm:p-4">
                  <div className={`flex items-center gap-1.5 mb-2 ${isClickable ? 'text-gray-300' : 'text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs truncate">{market.timeRange}</p>
                  </div>
                  <h3 className={`text-sm sm:text-base font-semibold mb-3 truncate ${isClickable ? 'text-white' : 'text-gray-400'}`}>{market.gameName}</h3>
                  <p className={`text-lg sm:text-xl font-bold font-mono tracking-wide ${isClickable ? 'text-primary-400' : 'text-gray-500'}`}>{market.result}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Section1;

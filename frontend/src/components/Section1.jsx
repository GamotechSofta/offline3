import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const Section1 = () => {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Convert 24-hour time to 12-hour format
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Parse time string to minutes since midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [hour, min] = timeStr.split(':').map(Number);
    if (hour >= 0 && hour < 24 && min >= 0 && min < 60) {
      return hour * 60 + min;
    }
    return null;
  };

  // Calculate market status and countdown
  const getMarketStatus = (market) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentSec = now.getSeconds();
    const currentTime = currentHour * 60 + currentMin;

    const startTime = parseTimeToMinutes(market.startingTime);
    const endTime = parseTimeToMinutes(market.closingTime);

    if (startTime === null || endTime === null) {
      return { isOpen: false, timer: null };
    }

    if (currentTime < startTime) {
      // Market hasn't started yet - calculate time until opening
      const totalSeconds = (startTime - currentTime) * 60 - currentSec;
      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      
      let timerStr = '';
      if (hours > 0) timerStr += `${hours} Hr${hours > 1 ? 's' : ''}: `;
      if (mins > 0 || hours > 0) timerStr += `${mins} Min${mins !== 1 ? 's' : ''}: `;
      timerStr += `${secs} Sec${secs !== 1 ? '' : ''}`;
      
      return {
        isOpen: false,
        timer: timerStr.trim()
      };
    } else if (currentTime >= startTime && currentTime <= endTime) {
      // Market is open - calculate time until closing
      const totalSeconds = (endTime - currentTime) * 60 - currentSec;
      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      
      let timerStr = '';
      if (hours > 0) timerStr += `${hours} Hr${hours > 1 ? 's' : ''}: `;
      if (mins > 0 || hours > 0) timerStr += `${mins} Min${mins !== 1 ? 's' : ''}: `;
      timerStr += `${secs} Sec${secs !== 1 ? '' : ''}`;
      
      return {
        isOpen: true,
        timer: timerStr.trim()
      };
    } else {
      // Market is closed
      return { isOpen: false, timer: null };
    }
  };

  // Fetch markets from API
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/markets/get-markets`);
        const data = await response.json();
        
        if (data.success) {
          // Transform API data to match UI format
          const transformedMarkets = data.data.map((market) => {
            const status = getMarketStatus(market);
            return {
              id: market._id,
              gameName: market.marketName,
              timeRange: `${formatTime(market.startingTime)} - ${formatTime(market.closingTime)}`,
              result: market.displayResult || '***-**-***',
              isOpen: status.isOpen,
              timer: status.timer,
              winNumber: market.winNumber,
              startingTime: market.startingTime,
              closingTime: market.closingTime
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

    fetchMarkets();
    
    // Refresh market data every 30 seconds
    const dataInterval = setInterval(fetchMarkets, 30000);
    
    return () => clearInterval(dataInterval);
  }, []);

  // Update timers every second for real-time countdown
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setMarkets((prevMarkets) => 
        prevMarkets.map((market) => {
          if (!market.startingTime || !market.closingTime) return market;
          const status = getMarketStatus({
            startingTime: market.startingTime,
            closingTime: market.closingTime
          });
          return {
            ...market,
            isOpen: status.isOpen,
            timer: status.timer
          };
        })
      );
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  return (
    <section className="w-full bg-black py-4 sm:py-6 px-3 sm:px-4 md:px-8">
      {/* MARKETS Header */}
      {/* MARKETS Header */}
      <div className="flex items-end justify-center mb-8 w-full max-w-7xl mx-auto">
        {/* Left Line */}
        <div className="flex-1 h-[2px] bg-[#d4af37]"></div>

        {/* Center Trapezoid */}
        <div className="relative shrink-0">
          <svg width="240" height="40" viewBox="0 0 240 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 39 L30 2 L210 2 L240 39" stroke="#d4af37" strokeWidth="2" fill="black" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pt-3">
            <h2 className="text-white text-2xl font-bold tracking-wider">MARKETS</h2>
          </div>
        </div>

        {/* Right Line */}
        <div className="flex-1 h-[2px] bg-[#d4af37]"></div>
      </div>
      {/* Market Cards Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading markets...</p>
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No markets available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {markets.map((market) => (
            <div
              key={market.id}
              onClick={() => navigate('/bidoptions')}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform hover:scale-[1.02] transition-transform duration-200"
            >
              {/* Status Banner */}
              <div className={`${market.isOpen ? 'bg-green-600' : 'bg-red-600'} py-2 px-3 text-center`}>
                <p className="text-white text-xs sm:text-sm font-semibold">
                  {market.isOpen ? market.timer : 'MARKET CLOSED'}
                </p>
              </div>

            {/* Card Content */}
            <div className="p-3 sm:p-4">
              {/* Time with Clock Icon */}
              <div className="flex items-center gap-1.5 mb-2">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400 text-xs sm:text-sm">{market.timeRange}</p>
              </div>

              {/* Game Name */}
              <h3 className="text-white text-sm sm:text-base md:text-lg font-semibold mb-3">
                {market.gameName}
              </h3>

              {/* Result */}
              <div>
                <p className="text-yellow-400 text-xl sm:text-2xl md:text-3xl font-bold">
                  {market.result}
                </p>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </section>
  );
};

export default Section1;

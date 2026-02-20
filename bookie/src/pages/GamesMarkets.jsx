import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../utils/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRefreshOnMarketReset } from '../hooks/useRefreshOnMarketReset';
import { FaDice, FaClock } from 'react-icons/fa';
import { isPastClosingTime } from '../utils/marketTiming';

/** Format "13:00" / "15:10" to "1pm" / "3:10pm" */
function formatTimeLabel(timeStr) {
    if (!timeStr) return '—';
    const parts = String(timeStr).trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parts[1] ? parseInt(parts[1], 10) : 0;
    if (h === 12 && m === 0) return '12pm';
    if (h === 0 && m === 0) return '12am';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? 'pm' : 'am';
    const minStr = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
    return `${hour}${minStr}${ampm}`;
}

const GamesMarkets = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const playerId = searchParams.get('playerId') || '';

    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchMarkets = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/markets/get-markets`);
            const data = await response.json();
            if (data.success) setMarkets(data.data || []);
            else setError('Failed to fetch markets');
        } catch (err) {
            setError('Network error. Please check if the server is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarkets();
    }, []);

    // Update current time every second for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second for better UX
        return () => clearInterval(interval);
    }, []);

    useRefreshOnMarketReset(fetchMarkets);

    const getMarketStatus = (market) => {
        const hasOpening = market.openingNumber && /^\d{3}$/.test(String(market.openingNumber));
        const hasClosing = market.closingNumber && /^\d{3}$/.test(String(market.closingNumber));
        if (hasOpening && hasClosing) return { status: 'closed' };
        if (isPastClosingTime(market, currentTime)) return { status: 'closed' };
        return { status: 'open' };
    };

    const availableMarkets = markets;

    const handleMarketClick = (marketId) => {
        const query = playerId ? `?playerId=${playerId}` : '';
        // If playerId is present, go directly to first game type (single-digit) to show the betting screen
        // Otherwise, go to game types selection screen
        if (playerId) {
            navigate(`/games/${marketId}/single-digit${query}`);
        } else {
            navigate(`/games/${marketId}${query}`);
        }
    };

    return (
        <Layout title="Games">
            <div className="min-w-0 max-w-full" style={{ backgroundColor: 'rgb(248, 249, 250)' }}>
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-gray-800">
                        <FaDice className="text-orange-500" />
                        Games
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Select a market to place bets</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-orange-500"></div>
                    </div>
                ) : availableMarkets.length === 0 ? (
                    <div className="text-center py-12">
                        <FaClock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No markets available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableMarkets.map((market) => {
                            const { status } = getMarketStatus(market);
                            const isClosed = status === 'closed';
                            const isClickable = !isClosed;
                            const resultDisplay = market.displayResult || '***_**_***';

                            return (
                                <button
                                    key={market._id}
                                    type="button"
                                    onClick={() => isClickable && handleMarketClick(market._id)}
                                    disabled={!isClickable}
                                    className={`text-left w-full bg-white rounded-[1.25rem] border border-black p-5 transition-all ${
                                        isClickable
                                            ? 'hover:shadow-lg cursor-pointer'
                                            : 'opacity-70 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Left: open pill + time */}
                                        <div className="flex flex-col items-start shrink-0">
                                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                                                open
                                            </span>
                                            <span className="text-sm text-black mt-1 font-normal">
                                                {formatTimeLabel(market.startingTime)}
                                            </span>
                                        </div>
                                        {/* Center: market name + masked id */}
                                        <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
                                            <h3 className="text-xl font-bold text-black text-center w-full truncate">
                                                {market.marketName}
                                            </h3>
                                            <p className="text-sm text-black font-mono font-normal tracking-wide mt-1">
                                                {resultDisplay}
                                            </p>
                                        </div>
                                        {/* Right: close pill + time */}
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                                close
                                            </span>
                                            <span className="text-sm text-black mt-1 font-normal">
                                                {formatTimeLabel(market.closingTime)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default GamesMarkets;

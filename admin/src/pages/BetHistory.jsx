import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1';
import { getAuthHeaders, clearAdminSession } from '../lib/auth';

const formatNum = (num) => {
    if (!num && num !== 0) return '0';
    return Number(num).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

/** Format scheduled date for display (for close-market scheduled bets) */
const formatScheduled = (bet) => {
    const date = bet?.scheduledDate;
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const BetHistory = () => {
    const navigate = useNavigate();
    const [bets, setBets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placedByFilter, setPlacedByFilter] = useState('all'); // all | player | bookie
    const [filters, setFilters] = useState({
        userId: '',
        marketId: '',
        status: '',
        startDate: '',
        endDate: '',
        scheduled: '', // '' | 'true' - show only scheduled (close-market) bets
    });

    useEffect(() => {
        fetchBets();
    }, [filters]);

    const fetchBets = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filters.userId) queryParams.append('userId', filters.userId);
            if (filters.marketId) queryParams.append('marketId', filters.marketId);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.scheduled === 'true') queryParams.append('scheduled', 'true');

            const response = await fetch(`${API_BASE_URL}/bets/history?${queryParams}`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setBets(data.data);
            }
        } catch (err) {
            console.error('Error fetching bets:', err);
        } finally {
            setLoading(false);
        }
    };

    // Group bets by market and then by open/close
    const betsByMarket = useMemo(() => {
        const marketMap = new Map();
        const includeByPlacedFilter = (bet) => {
            if (placedByFilter === 'player') return !bet?.placedByBookie;
            if (placedByFilter === 'bookie') return !!bet?.placedByBookie;
            return true;
        };

        bets.forEach((bet) => {
            if (!includeByPlacedFilter(bet)) return;
            const marketId = bet.marketId?._id || bet.marketId || 'unknown';
            const marketName = bet.marketId?.marketName || 'Unknown Market';
            
            if (!marketMap.has(marketId)) {
                marketMap.set(marketId, {
                    marketId,
                    marketName,
                    open: [],
                    close: [],
                    total: 0,
                    totalOpen: 0,
                    totalClose: 0,
                    totalAmount: 0,
                    totalOpenAmount: 0,
                    totalCloseAmount: 0,
                });
            }

            const marketData = marketMap.get(marketId);
            const betOn = bet.betOn || 'open'; // Default to open if not specified
            
            if (betOn === 'close') {
                marketData.close.push(bet);
                marketData.totalClose++;
                marketData.totalCloseAmount += bet.amount || 0;
            } else {
                marketData.open.push(bet);
                marketData.totalOpen++;
                marketData.totalOpenAmount += bet.amount || 0;
            }
            
            marketData.total++;
            marketData.totalAmount += bet.amount || 0;
        });

        // Convert to array and sort by market name
        return Array.from(marketMap.values()).sort((a, b) => 
            a.marketName.localeCompare(b.marketName)
        );
    }, [bets, placedByFilter]);

    const handleLogout = () => {
        clearAdminSession();
        navigate('/');
    };

    return (
        <AdminLayout onLogout={handleLogout} title="Bet History">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-white">Bet History</h1>

                    {/* Filters */}
                    <div className="bg-[#252D3A] rounded-lg p-4 mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 border border-[#333D4D]">
                        <input
                            type="text"
                            placeholder="Player ID"
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                            className="px-4 py-2 bg-[#1F2732] border border-[#333D4D] rounded-lg text-white"
                        />
                        <input
                            type="text"
                            placeholder="Market ID"
                            value={filters.marketId}
                            onChange={(e) => setFilters({ ...filters, marketId: e.target.value })}
                            className="px-4 py-2 bg-[#1F2732] border border-[#333D4D] rounded-lg text-white"
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2 bg-[#1F2732] border border-[#333D4D] rounded-lg text-white"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="px-4 py-2 bg-[#1F2732] border border-[#333D4D] rounded-lg text-white"
                        />
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="px-4 py-2 bg-[#1F2732] border border-[#333D4D] rounded-lg text-white"
                        />
                        <select
                            value={filters.scheduled}
                            onChange={(e) => setFilters({ ...filters, scheduled: e.target.value })}
                            className="px-4 py-2 bg-[#1F2732] border border-[#333D4D] rounded-lg text-white"
                        >
                            <option value="">All Bets</option>
                            <option value="true">Scheduled (close market) only</option>
                        </select>
                    </div>

                    {/* Placed-by filter */}
                    <div className="bg-[#252D3A] rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-[#333D4D]">
                        <p className="text-xs sm:text-sm font-semibold text-gray-200 mb-3">Bet Type View</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setPlacedByFilter('all')}
                                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-colors ${
                                    placedByFilter === 'all'
                                        ? 'bg-primary-500 text-white border-primary-500'
                                        : 'bg-[#1F2732] text-gray-200 border-[#333D4D] hover:bg-[#252D3A]'
                                }`}
                            >
                                All Bets
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlacedByFilter('player')}
                                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-colors ${
                                    placedByFilter === 'player'
                                        ? 'bg-primary-500 text-white border-primary-500'
                                        : 'bg-[#1F2732] text-gray-200 border-[#333D4D] hover:bg-[#252D3A]'
                                }`}
                            >
                                Bets By Player
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlacedByFilter('bookie')}
                                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-colors ${
                                    placedByFilter === 'bookie'
                                        ? 'bg-primary-500 text-white border-primary-500'
                                        : 'bg-[#1F2732] text-gray-200 border-[#333D4D] hover:bg-[#252D3A]'
                                }`}
                            >
                                Bets By Bookie
                            </button>
                        </div>
                    </div>

                    {/* Bets Grouped by Market */}
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400">Loading bets...</p>
                        </div>
                    ) : betsByMarket.length === 0 ? (
                        <div className="bg-[#252D3A] rounded-lg p-8 text-center border border-[#333D4D]">
                            <p className="text-gray-400">No bets found</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {betsByMarket.map((marketData) => (
                                <div key={marketData.marketId} className="bg-[#252D3A] rounded-lg border border-[#333D4D] overflow-hidden">
                                    {/* Market Header */}
                                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 border-b border-primary-300">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-white">{marketData.marketName}</h2>
                                            <div className="text-right text-white/90">
                                                <div className="text-sm">Total Bets: {marketData.total}</div>
                                                <div className="text-sm font-semibold">Total Amount: ₹{formatNum(marketData.totalAmount)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Opening Bets Section */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-primary-400 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    Opening Bets ({marketData.totalOpen})
                                                </h3>
                                                <span className="text-sm text-gray-300">
                                                    Total: ₹{formatNum(marketData.totalOpenAmount)}
                                                </span>
                                            </div>
                                            {marketData.open.length === 0 ? (
                                                <p className="text-gray-400 text-center py-4 bg-[#1F2732] rounded-lg">No opening bets found</p>
                                            ) : (
                                                <div className="overflow-x-auto rounded-lg border border-[#333D4D]">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#1F2732]">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-200">Time</th>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-200">Player</th>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-200">Phone</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Bet Type</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Number</th>
                                                                <th className="px-3 py-2 text-right font-semibold text-gray-200">Amount</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Status</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Scheduled</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Placed By</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#333D4D]">
                                                            {marketData.open.map((bet) => (
                                                                <tr key={bet._id} className="hover:bg-[#252D3A] bg-[#252D3A]">
                                                                    <td className="px-3 py-2 text-gray-300 font-mono text-xs">
                                                                        {new Date(bet.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-white font-medium">{bet.userId?.username || 'N/A'}</td>
                                                                    <td className="px-3 py-2 text-gray-600 text-xs">{bet.userId?.phone || bet.userId?.email || '—'}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                                                                            {bet.betType?.toUpperCase() || 'N/A'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center font-mono font-bold text-primary-600">{bet.betNumber || '—'}</td>
                                                                    <td className="px-3 py-2 text-right font-semibold text-white">₹{formatNum(bet.amount)}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                            bet.status === 'won' ? 'bg-green-100 text-green-700' :
                                                                            bet.status === 'lost' ? 'bg-red-100 text-red-700' :
                                                                            'bg-yellow-100 text-yellow-700'
                                                                        }`}>
                                                                            {bet.status?.toUpperCase() || 'PENDING'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-xs">
                                                                        {(bet.isScheduled || bet.scheduledDate) ? (
                                                                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium" title="Scheduled for close market">
                                                                                {formatScheduled(bet)}
                                                                            </span>
                                                                        ) : '—'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-xs text-gray-300">
                                                                        {bet.placedByBookie ? (bet.placedByBookieId?.username || 'Bookie') : 'Player'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        {/* Closing Bets Section */}
                                        <div className="pt-6 border-t border-[#333D4D]">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-primary-400 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                    Closing Bets ({marketData.totalClose})
                                                </h3>
                                                <span className="text-sm text-gray-300">
                                                    Total: ₹{formatNum(marketData.totalCloseAmount)}
                                                </span>
                                            </div>
                                            {marketData.close.length === 0 ? (
                                                <p className="text-gray-400 text-center py-4 bg-[#1F2732] rounded-lg">No closing bets found</p>
                                            ) : (
                                                <div className="overflow-x-auto rounded-lg border border-[#333D4D]">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#1F2732]">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-200">Time</th>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-200">Player</th>
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-200">Phone</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Bet Type</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Number</th>
                                                                <th className="px-3 py-2 text-right font-semibold text-gray-200">Amount</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Status</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Scheduled</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-gray-200">Placed By</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#333D4D]">
                                                            {marketData.close.map((bet) => (
                                                                <tr key={bet._id} className="hover:bg-[#252D3A] bg-[#252D3A]">
                                                                    <td className="px-3 py-2 text-gray-300 font-mono text-xs">
                                                                        {new Date(bet.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-white font-medium">{bet.userId?.username || 'N/A'}</td>
                                                                    <td className="px-3 py-2 text-gray-300 text-xs">{bet.userId?.phone || bet.userId?.email || '—'}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">
                                                                            {bet.betType?.toUpperCase() || 'N/A'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center font-mono font-bold text-primary-400">{bet.betNumber || '—'}</td>
                                                                    <td className="px-3 py-2 text-right font-semibold text-white">₹{formatNum(bet.amount)}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                            bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                                                                            bet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                                                                            'bg-amber-500/20 text-amber-400'
                                                                        }`}>
                                                                            {bet.status?.toUpperCase() || 'PENDING'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-xs">
                                                                        {(bet.isScheduled || bet.scheduledDate) ? (
                                                                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium" title="Scheduled for close market">
                                                                                {formatScheduled(bet)}
                                                                            </span>
                                                                        ) : '—'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-xs text-gray-300">
                                                                        {bet.placedByBookie ? (bet.placedByBookieId?.username || 'Bookie') : 'Player'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
        </AdminLayout>
    );
};

export default BetHistory;

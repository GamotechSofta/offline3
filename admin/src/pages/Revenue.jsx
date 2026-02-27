import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useNavigate, Link } from 'react-router-dom';
import {
    FaMoneyBillWave,
    FaCoins,
    FaSyncAlt,
    FaCalendarAlt,
    FaUsers,
    FaChartBar,
    FaPrint,
    FaUserTie,
    FaArrowUp,
    FaArrowDown,
    FaPercent,
} from 'react-icons/fa';
import { getAuthHeaders, clearAdminSession } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1';

const PRESETS = [
    { id: 'today', label: 'Today', getRange: () => {
        const d = new Date();
        const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
        const from = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return { from, to: from };
    }},
    { id: 'yesterday', label: 'Yesterday', getRange: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
        const from = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return { from, to: from };
    }},
    { id: 'this_week', label: 'This Week', getRange: () => {
        const d = new Date();
        const day = d.getDay();
        const sun = new Date(d); sun.setDate(d.getDate() - day);
        const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
        const fmt = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
        return { from: fmt(sun), to: fmt(sat) };
    }},
    { id: 'this_month', label: 'This Month', getRange: () => {
        const d = new Date();
        const y = d.getFullYear(), m = d.getMonth();
        const last = new Date(y, m + 1, 0);
        const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
        return { from, to };
    }},
    { id: 'last_month', label: 'Last Month', getRange: () => {
        const d = new Date();
        const y = d.getFullYear(), m = d.getMonth() - 1;
        const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        const last = new Date(y, m + 1, 0);
        const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
        return { from, to };
    }},
];

const formatCurrency = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return '\u20B90';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(num);
};

const formatNumber = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return '0';
    return new Intl.NumberFormat('en-IN').format(num);
};

const Revenue = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(() => {
        const d = new Date();
        const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
        const today = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return { startDate: today, endDate: today };
    });
    const [activePreset, setActivePreset] = useState('today');

    useEffect(() => {
        fetchRevenue();
    }, [dateRange]);

    const fetchRevenue = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/reports/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
                { headers: getAuthHeaders() }
            );
            const result = await response.json();
            if (result.success) setData(result.data);
            else setData(null);
        } catch (err) {
            console.error('Error fetching revenue:', err);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const applyPreset = (presetId) => {
        const preset = PRESETS.find((p) => p.id === presetId);
        if (preset) {
            const { from, to } = preset.getRange();
            setDateRange({ startDate: from, endDate: to });
            setActivePreset(presetId);
        }
    };

    const handleLogout = () => {
        clearAdminSession();
        navigate('/');
    };

    const summary = data?.summary;
    const bookies = data?.bookies || [];
    const direct = data?.directUsers;

    const sortedBookies = [...bookies].sort((a, b) => b.totalBetAmount - a.totalBetAmount);

    return (
        <AdminLayout onLogout={handleLogout} title="Revenue">
            <div className="space-y-4 sm:space-y-6 print:hidden">
                {/* Header */}
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                        <FaMoneyBillWave className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500 shrink-0" />
                        Revenue
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">Bookie-wise revenue breakdown and admin profit</p>
                </div>

                {/* Date filters */}
                <div className="bg-[#252D3A] rounded-xl border border-[#333D4D] p-3 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <FaCalendarAlt className="w-4 h-4 text-primary-500 shrink-0" />
                        <span className="text-sm font-medium text-gray-300">Period</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                        {PRESETS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => applyPreset(p.id)}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                    activePreset === p.id
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-[#1F2732] text-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => { setDateRange((r) => ({ ...r, startDate: e.target.value })); setActivePreset(''); }}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-[#1F2732] border border-[#333D4D] rounded-lg text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent w-[130px] sm:w-auto"
                        />
                        <span className="text-gray-400 text-sm">to</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => { setDateRange((r) => ({ ...r, endDate: e.target.value })); setActivePreset(''); }}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-[#1F2732] border border-[#333D4D] rounded-lg text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent w-[130px] sm:w-auto"
                        />
                        <button
                            type="button"
                            onClick={fetchRevenue}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-500 hover:bg-amber-400 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm"
                        >
                            <FaSyncAlt className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-[#252D3A] rounded-xl h-24 sm:h-28 animate-pulse border border-[#333D4D]" />
                        ))}
                    </div>
                ) : data ? (
                    <>
                        {/* Summary Cards - 2 cols on mobile, 4 on desktop */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {/* Total Bets Volume */}
                            <div className="bg-[#252D3A] rounded-xl p-3 sm:p-5 border border-[#333D4D]/60 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">Bets Volume</p>
                                        <p className="text-base sm:text-xl lg:text-2xl font-bold text-blue-600 mt-1 truncate">{formatCurrency(summary.grandTotalBets)}</p>
                                    </div>
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                                        <FaChartBar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Total Payouts */}
                            <div className="bg-[#252D3A] rounded-xl p-3 sm:p-5 border border-[#333D4D]/60 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-400" />
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">Payouts</p>
                                        <p className="text-base sm:text-xl lg:text-2xl font-bold text-red-500 mt-1 truncate">{formatCurrency(summary.grandTotalPayouts)}</p>
                                    </div>
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                                        <FaCoins className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Bookie Commissions */}
                            <div className="bg-[#252D3A] rounded-xl p-3 sm:p-5 border border-[#333D4D]/60 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-400" />
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">Bookie Comm.</p>
                                        <p className="text-base sm:text-xl lg:text-2xl font-bold text-primary-400 mt-1 truncate">{formatCurrency(summary.totalBookieCommission)}</p>
                                    </div>
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-500/15 flex items-center justify-center shrink-0">
                                        <FaUserTie className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Admin Profit */}
                            <div className={`bg-[#252D3A] rounded-xl p-3 sm:p-5 border relative overflow-hidden ${summary.totalAdminProfit >= 0 ? 'border-emerald-500/40' : 'border-red-500/40'}`}>
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${summary.totalAdminProfit >= 0 ? 'from-emerald-500 to-emerald-400' : 'from-red-500 to-red-400'}`} />
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">Admin Profit</p>
                                        <p className={`text-base sm:text-xl lg:text-2xl font-bold mt-1 truncate ${summary.totalAdminProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {formatCurrency(summary.totalAdminProfit)}
                                        </p>
                                    </div>
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${summary.totalAdminProfit >= 0 ? 'bg-primary-500/15' : 'bg-red-500/15'}`}>
                                        {summary.totalAdminProfit >= 0
                                            ? <FaArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                            : <FaArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bookie-wise Breakdown */}
                        <div className="bg-[#252D3A] rounded-xl border border-[#333D4D] overflow-hidden">
                            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-[#333D4D]">
                                <h2 className="text-sm sm:text-lg font-semibold text-white flex items-center gap-2">
                                    <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                                    Bookie-wise Breakdown
                                </h2>
                            </div>

                            {/* Desktop Table (hidden on mobile) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#1F2732]/40 text-gray-400 text-[11px] uppercase tracking-wider">
                                            <th className="text-left px-4 py-3 font-medium">Bookie</th>
                                            <th className="text-right px-3 py-3 font-medium">Users</th>
                                            <th className="text-right px-3 py-3 font-medium">Total Bets</th>
                                            <th className="text-right px-3 py-3 font-medium">Payouts</th>
                                            <th className="text-center px-3 py-3 font-medium">Comm %</th>
                                            <th className="text-right px-3 py-3 font-medium">Bookie Share</th>
                                            <th className="text-right px-3 py-3 font-medium">Admin Pool</th>
                                            <th className="text-right px-4 py-3 font-medium">Admin Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/40">
                                        {sortedBookies.map((b) => (
                                            <tr key={b.bookieId} className="hover:bg-[#1F2732]/20 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full shrink-0 ${b.bookieStatus === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                        <div className="min-w-0">
                                                            <Link to={`/revenue/${b.bookieId}`} className="font-medium text-white truncate hover:text-primary-500 transition-colors">{b.bookieName}</Link>
                                                            {b.bookiePhone && <p className="text-[11px] text-gray-400">{b.bookiePhone}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-right px-3 py-3 text-gray-300 text-xs">{formatNumber(b.totalUsers)}</td>
                                                <td className="text-right px-3 py-3 text-white font-medium">{formatCurrency(b.totalBetAmount)}</td>
                                                <td className="text-right px-3 py-3 text-red-500">{formatCurrency(b.totalPayouts)}</td>
                                                <td className="text-center px-3 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-500/15 text-primary-500">
                                                        {b.commissionPercentage}%
                                                    </span>
                                                </td>
                                                <td className="text-right px-3 py-3 text-primary-400 font-medium">{formatCurrency(b.bookieShare)}</td>
                                                <td className="text-right px-3 py-3 text-gray-400">{formatCurrency(b.adminPool)}</td>
                                                <td className={`text-right px-4 py-3 font-semibold ${b.adminProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {formatCurrency(b.adminProfit)}
                                                </td>
                                            </tr>
                                        ))}

                                        {direct && direct.totalBetAmount > 0 && (
                                            <tr className="bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full shrink-0 bg-blue-400" />
                                                        <div>
                                                            <p className="font-medium text-blue-300">Direct Users</p>
                                                            <p className="text-[11px] text-gray-400">Admin's own</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-right px-3 py-3 text-gray-300 text-xs">{formatNumber(direct.totalUsers || 0)}</td>
                                                <td className="text-right px-3 py-3 text-white font-medium">{formatCurrency(direct.totalBetAmount)}</td>
                                                <td className="text-right px-3 py-3 text-red-500">{formatCurrency(direct.totalPayouts)}</td>
                                                <td className="text-center px-3 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600">0%</span>
                                                </td>
                                                <td className="text-right px-3 py-3 text-gray-300">-</td>
                                                <td className="text-right px-3 py-3 text-gray-400">{formatCurrency(direct.totalBetAmount)}</td>
                                                <td className={`text-right px-4 py-3 font-semibold ${direct.adminProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {formatCurrency(direct.adminProfit)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Totals */}
                                        <tr className="bg-[#1F2732]/30 border-t-2 border-[#333D4D]/80">
                                            <td className="px-4 py-3.5 font-bold text-primary-500 text-xs uppercase tracking-wider">Total</td>
                                            <td className="text-right px-3 py-3.5 text-gray-400">-</td>
                                            <td className="text-right px-3 py-3.5 text-white font-bold">{formatCurrency(summary.grandTotalBets)}</td>
                                            <td className="text-right px-3 py-3.5 text-red-500 font-bold">{formatCurrency(summary.grandTotalPayouts)}</td>
                                            <td className="text-center px-3 py-3.5 text-gray-400">-</td>
                                            <td className="text-right px-3 py-3.5 text-primary-400 font-bold">{formatCurrency(summary.totalBookieCommission)}</td>
                                            <td className="text-right px-3 py-3.5 text-gray-400">-</td>
                                            <td className={`text-right px-4 py-3.5 font-bold ${summary.totalAdminProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {formatCurrency(summary.totalAdminProfit)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards (hidden on desktop) */}
                            <div className="md:hidden divide-y divide-gray-700/40">
                                {sortedBookies.map((b) => (
                                    <div key={b.bookieId} className="p-3 sm:p-4">
                                        {/* Bookie header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${b.bookieStatus === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                <div className="min-w-0">
                                                    <Link to={`/revenue/${b.bookieId}`} className="font-semibold text-white text-sm truncate hover:text-primary-500 transition-colors">{b.bookieName}</Link>
                                                    {b.bookiePhone && <p className="text-[11px] text-gray-400">{b.bookiePhone}</p>}
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-500/15 text-primary-500 shrink-0">
                                                {b.commissionPercentage}%
                                            </span>
                                        </div>
                                        {/* Stats grid */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-[#1F2732]/30 rounded-lg px-2.5 py-2">
                                                <p className="text-[10px] text-gray-400 uppercase">Bets</p>
                                                <p className="text-xs font-semibold text-white truncate">{formatCurrency(b.totalBetAmount)}</p>
                                            </div>
                                            <div className="bg-[#1F2732]/30 rounded-lg px-2.5 py-2">
                                                <p className="text-[10px] text-gray-400 uppercase">Payouts</p>
                                                <p className="text-xs font-semibold text-red-500 truncate">{formatCurrency(b.totalPayouts)}</p>
                                            </div>
                                            <div className="bg-[#1F2732]/30 rounded-lg px-2.5 py-2">
                                                <p className="text-[10px] text-gray-400 uppercase">Bookie Share</p>
                                                <p className="text-xs font-semibold text-primary-400 truncate">{formatCurrency(b.bookieShare)}</p>
                                            </div>
                                            <div className="bg-[#1F2732]/30 rounded-lg px-2.5 py-2">
                                                <p className="text-[10px] text-gray-400 uppercase">Admin Profit</p>
                                                <p className={`text-xs font-semibold truncate ${b.adminProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {formatCurrency(b.adminProfit)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                                            <span>{formatNumber(b.totalUsers)} users</span>
                                            <span>Pool: {formatCurrency(b.adminPool)}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Direct Users - mobile */}
                                {direct && direct.totalBetAmount > 0 && (
                                    <div className="p-3 sm:p-4 bg-blue-500/5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-blue-400" />
                                                <p className="font-semibold text-blue-300 text-sm">Direct Users</p>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600">0%</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-[#1F2732]/30 rounded-lg px-2.5 py-2">
                                                <p className="text-[10px] text-gray-400 uppercase">Bets</p>
                                                <p className="text-xs font-semibold text-white truncate">{formatCurrency(direct.totalBetAmount)}</p>
                                            </div>
                                            <div className="bg-[#1F2732]/30 rounded-lg px-2.5 py-2">
                                                <p className="text-[10px] text-gray-400 uppercase">Payouts</p>
                                                <p className="text-xs font-semibold text-red-500 truncate">{formatCurrency(direct.totalPayouts)}</p>
                                            </div>
                                            <div className="bg-[#1F2732]/30 rounded-lg px-2.5 py-2 col-span-2">
                                                <p className="text-[10px] text-gray-400 uppercase">Admin Profit</p>
                                                <p className={`text-xs font-semibold truncate ${direct.adminProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {formatCurrency(direct.adminProfit)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Totals - mobile */}
                                <div className="p-3 sm:p-4 bg-[#1F2732]/20">
                                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mb-2">Total Summary</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-[#1F2732]/40 rounded-lg px-2.5 py-2">
                                            <p className="text-[10px] text-gray-400 uppercase">Bets Volume</p>
                                            <p className="text-xs font-bold text-white truncate">{formatCurrency(summary.grandTotalBets)}</p>
                                        </div>
                                        <div className="bg-[#1F2732]/40 rounded-lg px-2.5 py-2">
                                            <p className="text-[10px] text-gray-400 uppercase">Payouts</p>
                                            <p className="text-xs font-bold text-red-500 truncate">{formatCurrency(summary.grandTotalPayouts)}</p>
                                        </div>
                                        <div className="bg-[#1F2732]/40 rounded-lg px-2.5 py-2">
                                            <p className="text-[10px] text-gray-400 uppercase">Bookie Comm.</p>
                                            <p className="text-xs font-bold text-primary-400 truncate">{formatCurrency(summary.totalBookieCommission)}</p>
                                        </div>
                                        <div className="bg-[#1F2732]/40 rounded-lg px-2.5 py-2">
                                            <p className="text-[10px] text-gray-400 uppercase">Admin Profit</p>
                                            <p className={`text-xs font-bold truncate ${summary.totalAdminProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {formatCurrency(summary.totalAdminProfit)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {sortedBookies.length === 0 && (!direct || direct.totalBetAmount === 0) && (
                                    <div className="p-8 text-center">
                                        <p className="text-gray-400 text-sm">No revenue data for this period</p>
                                    </div>
                                )}
                            </div>

                            {/* Empty state for desktop */}
                            {sortedBookies.length === 0 && (!direct || direct.totalBetAmount === 0) && (
                                <div className="hidden md:block p-12 text-center">
                                    <p className="text-gray-400">No revenue data for this period</p>
                                </div>
                            )}
                        </div>

                        {/* Print */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1F2732] hover:bg-gray-200 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                            >
                                <FaPrint className="w-3.5 h-3.5" />
                                Print Report
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="bg-[#252D3A] rounded-xl border border-[#333D4D] p-8 sm:p-12 text-center">
                        <FaMoneyBillWave className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 text-base sm:text-lg">No revenue data available</p>
                        <p className="text-gray-400 text-xs sm:text-sm mt-2">Try a different date range or refresh</p>
                        <button
                            type="button"
                            onClick={fetchRevenue}
                            className="mt-4 px-4 py-2 bg-primary-500 hover:bg-amber-400 text-white font-semibold rounded-lg transition-colors text-sm"
                        >
                            Refresh
                        </button>
                    </div>
                )}
            </div>

            {/* Print-only */}
            {data && (
                <div className="hidden print:block mt-8 p-6 bg-[#252D3A] text-white rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Revenue Report</h2>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-2">Bookie</th>
                                <th className="text-right py-2">Total Bets</th>
                                <th className="text-right py-2">Payouts</th>
                                <th className="text-center py-2">Comm %</th>
                                <th className="text-right py-2">Bookie Share</th>
                                <th className="text-right py-2">Admin Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedBookies.map((b) => (
                                <tr key={b.bookieId} className="border-b border-[#333D4D]">
                                    <td className="py-1.5">{b.bookieName}</td>
                                    <td className="text-right py-1.5">{formatCurrency(b.totalBetAmount)}</td>
                                    <td className="text-right py-1.5">{formatCurrency(b.totalPayouts)}</td>
                                    <td className="text-center py-1.5">{b.commissionPercentage}%</td>
                                    <td className="text-right py-1.5">{formatCurrency(b.bookieShare)}</td>
                                    <td className="text-right py-1.5">{formatCurrency(b.adminProfit)}</td>
                                </tr>
                            ))}
                            {direct && direct.totalBetAmount > 0 && (
                                <tr className="border-b border-[#333D4D]">
                                    <td className="py-1.5 font-medium">Direct Users</td>
                                    <td className="text-right py-1.5">{formatCurrency(direct.totalBetAmount)}</td>
                                    <td className="text-right py-1.5">{formatCurrency(direct.totalPayouts)}</td>
                                    <td className="text-center py-1.5">0%</td>
                                    <td className="text-right py-1.5">-</td>
                                    <td className="text-right py-1.5">{formatCurrency(direct.adminProfit)}</td>
                                </tr>
                            )}
                            <tr className="border-t-2 border-gray-400 font-bold">
                                <td className="py-2">TOTAL</td>
                                <td className="text-right py-2">{formatCurrency(summary.grandTotalBets)}</td>
                                <td className="text-right py-2">{formatCurrency(summary.grandTotalPayouts)}</td>
                                <td className="text-center py-2">-</td>
                                <td className="text-right py-2">{formatCurrency(summary.totalBookieCommission)}</td>
                                <td className="text-right py-2">{formatCurrency(summary.totalAdminProfit)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
};

export default Revenue;

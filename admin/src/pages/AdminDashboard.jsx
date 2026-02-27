import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useNavigate, Link } from 'react-router-dom';
import { SkeletonCard } from '../components/Skeleton';
import {
    FaChartLine,
    FaUsers,
    FaMoneyBillWave,
    FaChartBar,
    FaSyncAlt,
    FaWallet,
    FaCreditCard,
    FaUserFriends,
    FaLifeRing,
    FaClipboardList,
    FaArrowRight,
    FaExclamationTriangle,
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1';
import { getAuthHeaders, clearAdminSession } from '../lib/auth';

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
        const sun = new Date(d);
        sun.setDate(d.getDate() - day);
        const sat = new Date(sun);
        sat.setDate(sun.getDate() + 6);
        const fmt = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
        return { from: fmt(sun), to: fmt(sat) };
    }},
    { id: 'last_week', label: 'Last Week', getRange: () => {
        const d = new Date();
        const day = d.getDay();
        const sun = new Date(d);
        sun.setDate(d.getDate() - day - 7);
        const sat = new Date(sun);
        sat.setDate(sun.getDate() + 6);
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

const formatRangeLabel = (from, to) => {
    if (!from || !to) return 'Today';
    if (from === to) {
        const d = new Date(from + 'T12:00:00');
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const a = new Date(from + 'T12:00:00');
    const b = new Date(to + 'T12:00:00');
    return `${a.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

/** Section card wrapper */
const SectionCard = ({ title, description, icon: Icon, children, linkTo, linkLabel }) => (
    <div className="bg-[#252D3A] rounded-xl p-5 sm:p-6 border border-[#333D4D] hover:border-primary-400/50 transition-all">
        <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-primary-400" />}
                    {title}
                </h3>
                {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
            </div>
            {linkTo && (
                <Link to={linkTo} className="text-xs font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    {linkLabel || 'View'} <FaArrowRight className="w-3 h-3" />
                </Link>
            )}
        </div>
        {children}
    </div>
);

/** Stat row */
const StatRow = ({ label, value, subValue, colorClass = 'text-white' }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-[#333D4D] last:border-0">
        <span className="text-sm text-gray-400">{label}</span>
        <div className="text-right">
            <span className={`font-semibold font-mono ${colorClass}`}>{value}</span>
            {subValue && <span className="text-xs text-gray-400 ml-2">{subValue}</span>}
        </div>
    </div>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [datePreset, setDatePreset] = useState('today');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [customMode, setCustomMode] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [adminRole, setAdminRole] = useState('');
    const [markets, setMarkets] = useState([]);
    const [selectedMarketId, setSelectedMarketId] = useState('');
    const [marketReport, setMarketReport] = useState(null);
    const [marketReportLoading, setMarketReportLoading] = useState(false);

    const getFromTo = () => {
        if (customMode && customFrom && customTo) return { from: customFrom, to: customTo };
        const preset = PRESETS.find((p) => p.id === datePreset);
        return preset ? preset.getRange() : PRESETS[0].getRange();
    };

    const fetchMarkets = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/markets/get-markets`, { headers: getAuthHeaders() });
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) setMarkets(data.data);
        } catch (_) {}
    };

    const fetchMarketReport = async () => {
        if (!selectedMarketId) {
            setMarketReport(null);
            return;
        }
        try {
            setMarketReportLoading(true);
            const { from, to } = getFromTo();
            const params = new URLSearchParams({ marketId: selectedMarketId });
            if (from) params.set('startDate', from);
            if (to) params.set('endDate', to);
            const response = await fetch(`${API_BASE_URL}/reports?${params}`, { headers: getAuthHeaders() });
            const data = await response.json();
            if (data.success) setMarketReport(data.data);
            else setMarketReport(null);
        } catch (_) {
            setMarketReport(null);
        } finally {
            setMarketReportLoading(false);
        }
    };

    useEffect(() => {
        const admin = localStorage.getItem('admin');
        if (!admin) {
            navigate('/');
            return;
        }
        try {
            const parsed = JSON.parse(admin);
            setAdminRole(parsed.role || '');
        } catch (_) {}
        fetchDashboardStats();
        fetchMarkets();
    }, [navigate]);

    useEffect(() => {
        if (selectedMarketId) fetchMarketReport();
        else setMarketReport(null);
    }, [selectedMarketId]);

    useEffect(() => {
        if (selectedMarketId && !loading) fetchMarketReport();
    }, [datePreset, customMode, customFrom, customTo]);

    const fetchDashboardStats = async (rangeOverride, options = {}) => {
        const isRefresh = options.refresh === true;
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError('');
            const { from, to } = rangeOverride || getFromTo();
            const params = new URLSearchParams();
            if (from && to) { params.set('from', from); params.set('to', to); }
            if (isRefresh) params.set('_', String(Date.now()));
            const query = params.toString();
            const url = `${API_BASE_URL}/dashboard/stats${query ? `?${query}` : ''}`;
            const response = await fetch(url, {
                headers: getAuthHeaders(),
                cache: isRefresh ? 'no-store' : 'default',
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            } else {
                if (response.status === 401) {
                    clearAdminSession();
                    navigate('/', { replace: true });
                    return;
                }
                setError('Failed to fetch dashboard stats');
            }
        } catch (err) {
            setError('Network error. Please check if the server is running.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        fetchDashboardStats(undefined, { refresh: true });
        if (selectedMarketId) fetchMarketReport();
    };
    const handlePresetSelect = (presetId) => {
        setDatePreset(presetId);
        setCustomMode(false);
        setCustomOpen(false);
        const preset = PRESETS.find((p) => p.id === presetId);
        const range = preset ? preset.getRange() : PRESETS[0].getRange();
        fetchDashboardStats(range);
    };
    const handleCustomToggle = () => { setCustomMode(true); setCustomOpen((o) => !o); };
    const handleCustomApply = () => {
        if (!customFrom || !customTo) return;
        if (new Date(customFrom) > new Date(customTo)) return;
        setCustomMode(true);
        setCustomOpen(false);
        fetchDashboardStats({ from: customFrom, to: customTo });
    };

    const handleLogout = () => {
        clearAdminSession();
        navigate('/');
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

    const pendingPayments = stats?.payments?.pending || 0;
    const pendingDeposits = stats?.payments?.pendingDeposits ?? stats?.payments?.pending ?? 0;
    const pendingWithdrawals = stats?.payments?.pendingWithdrawals ?? 0;
    const helpDeskOpen = stats?.helpDesk?.open || 0;
    const marketsPendingResultList = stats?.marketsPendingResultList || [];
    const starlinePendingList = marketsPendingResultList.filter((m) => (m.marketType || '').toString().toLowerCase() === 'startline');
    const mainPendingList = marketsPendingResultList.filter((m) => (m.marketType || '').toString().toLowerCase() !== 'startline');
    const starlinePendingCount = starlinePendingList.length;
    const mainPendingCount = mainPendingList.length;
    const marketsPendingResult = marketsPendingResultList.length;
    const hasActionRequired = pendingPayments > 0 || helpDeskOpen > 0 || marketsPendingResult > 0;

    if (loading) {
        return (
            <AdminLayout onLogout={handleLogout} title="Dashboard">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-gray-400 text-sm mt-2">Loading your admin overview...</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout onLogout={handleLogout} title="Dashboard">
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <FaExclamationTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
                    <button onClick={fetchDashboardStats} className="mt-4 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl">
                        Retry
                    </button>
                </div>
            </AdminLayout>
        );
    }

    const displayLabel = customMode && customFrom && customTo ? formatRangeLabel(customFrom, customTo) : (PRESETS.find((p) => p.id === datePreset)?.label || 'Today');

    return (
        <AdminLayout onLogout={handleLogout} title="Dashboard">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                <FaChartLine className="w-5 h-5 text-primary-400" />
                            </span>
                            Dashboard Overview
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#252D3A] hover:bg-primary-500/20 border border-[#333D4D] hover:border-primary-400 text-gray-300 hover:text-primary-400 transition-all disabled:opacity-60 text-sm font-medium"
                    >
                        <FaSyncAlt className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Date Filter */}
                <div className="bg-[#252D3A] rounded-xl p-4 border border-[#333D4D]">
                    <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Date Range</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {PRESETS.map((p) => {
                            const isActive = !customMode && datePreset === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handlePresetSelect(p.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? 'bg-primary-500 text-white' : 'bg-[#252D3A] border border-[#333D4D] text-gray-300 hover:bg-primary-500/20 hover:border-primary-400'}`}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={handleCustomToggle}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold ${customMode ? 'bg-primary-500 text-white' : 'bg-[#252D3A] border border-[#333D4D] text-gray-300 hover:bg-primary-500/20 hover:border-primary-400'}`}
                        >
                            Custom
                        </button>
                        {customOpen && (
                            <div className="flex flex-wrap items-end gap-3 w-full mt-3 p-3 rounded-lg bg-[#1F2732] border border-[#333D4D]">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">From</label>
                                    <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-3 py-2 rounded-lg bg-[#252D3A] border border-[#333D4D] text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">To</label>
                                    <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-3 py-2 rounded-lg bg-[#252D3A] border border-[#333D4D] text-sm text-white" />
                                </div>
                                <button type="button" onClick={handleCustomApply} className="px-4 py-2 rounded-lg bg-primary-500 text-white font-semibold text-sm">
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Showing data for: <span className="text-primary-400 font-medium">{displayLabel}</span></p>
                </div>
            </div>

            {/* Action Required */}
            {hasActionRequired && (
                <div className="mb-6 p-4 rounded-xl bg-primary-500/10 border border-primary-400/50">
                    <h3 className="text-sm font-semibold text-primary-400 flex items-center gap-2 mb-3">
                        <FaExclamationTriangle className="w-4 h-4" />
                        Action Required
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {pendingPayments > 0 && (
                            <Link to="/payment-management" className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm">
                                {pendingPayments} Pending Payment{pendingPayments !== 1 ? 's' : ''} →
                            </Link>
                        )}
                        {helpDeskOpen > 0 && (
                            <Link to="/help-desk" className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm">
                                {helpDeskOpen} Open Ticket{helpDeskOpen !== 1 ? 's' : ''} →
                            </Link>
                        )}
                        {starlinePendingCount > 0 && (
                            <Link to="/markets" state={{ marketType: 'starline' }} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm">
                                {starlinePendingCount} Starline slot{starlinePendingCount !== 1 ? 's' : ''} result pending →
                            </Link>
                        )}
                        {mainPendingCount > 0 && (
                            <Link to="/add-result" className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm">
                                {mainPendingCount} Market{mainPendingCount !== 1 ? 's' : ''} result pending →
                            </Link>
                        )}
                    </div>
                    {(starlinePendingList.length > 0 || mainPendingList.length > 0) && (
                        <p className="text-xs text-primary-300 mt-2">
                            {starlinePendingList.length > 0 && (
                                <span>Starline: {starlinePendingList.map((m) => m.marketName).join(', ')}</span>
                            )}
                            {starlinePendingList.length > 0 && mainPendingList.length > 0 && ' · '}
                            {mainPendingList.length > 0 && (
                                <span>Markets: {mainPendingList.map((m) => m.marketName).join(', ')}</span>
                            )}
                        </p>
                    )}
                </div>
            )}

            {/* Primary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#252D3A] rounded-xl p-5 border border-[#333D4D]">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Revenue (period)</p>
                    <p className="text-2xl font-bold text-green-400 font-mono">{formatCurrency(stats?.revenue?.total)}</p>
                    <p className="text-xs text-gray-400 mt-1">Bet amount collected in selected range</p>
                </div>
                <div className="bg-[#252D3A] rounded-xl p-5 border border-[#333D4D]">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Net Profit (period)</p>
                    <p className="text-2xl font-bold text-blue-400 font-mono">{formatCurrency(stats?.revenue?.netProfit)}</p>
                    <p className="text-xs text-gray-400 mt-1">Revenue − Payouts in selected range</p>
                </div>
                <div className="bg-[#252D3A] rounded-xl p-5 border border-[#333D4D]">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Players (all-time)</p>
                    <p className="text-2xl font-bold text-purple-400 font-mono">{stats?.users?.total ?? 0}</p>
                    <p className="text-xs text-gray-400 mt-1">{stats?.users?.active ?? 0} active · {stats?.users?.newToday ?? 0} new in range</p>
                </div>
                <div className="bg-[#252D3A] rounded-xl p-5 border border-[#333D4D]">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Bets (period)</p>
                    <p className="text-2xl font-bold text-primary-400 font-mono">{stats?.bets?.total ?? 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Win rate: {stats?.bets?.winRate ?? 0}%</p>
                </div>
            </div>

            {/* Market-wise Reports - full width, user-friendly */}
            <div className="bg-[#252D3A] rounded-xl border border-[#333D4D] p-5 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FaChartBar className="w-5 h-5 text-primary-400" />
                            Market-wise Reports
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">View revenue, bets and win rate for a specific market in the selected period.</p>
                    </div>
                    <div className="w-full sm:w-72 shrink-0">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Select market</label>
                        <select
                            value={selectedMarketId}
                            onChange={(e) => setSelectedMarketId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#1F2732] border border-[#333D4D] rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-400 transition-shadow"
                        >
                            <option value="">Choose a market...</option>
                            {markets.map((m) => (
                                <option key={m._id} value={m._id}>
                                    {m.marketName || m.name || m._id}
                                </option>
                            ))}
                        </select>
                        {selectedMarketId && (
                            <p className="text-xs text-gray-400 mt-1.5">For period: {displayLabel}</p>
                        )}
                    </div>
                </div>
                {marketReportLoading ? (
                    <div className="flex items-center justify-center gap-3 py-12 rounded-lg bg-[#1F2732] border border-[#333D4D]">
                        <FaSyncAlt className="w-6 h-6 text-primary-400 animate-spin" />
                        <span className="text-gray-400">Loading report...</span>
                    </div>
                ) : selectedMarketId && marketReport ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-[#252D3A] rounded-lg p-4 border border-[#333D4D]">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</p>
                            <p className="text-lg font-bold text-green-400 mt-0.5 font-mono">{formatCurrency(marketReport.totalRevenue)}</p>
                        </div>
                        <div className="bg-[#252D3A] rounded-lg p-4 border border-[#333D4D]">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Payouts</p>
                            <p className="text-lg font-bold text-red-400 mt-0.5 font-mono">{formatCurrency(marketReport.totalPayouts)}</p>
                        </div>
                        <div className="bg-[#252D3A] rounded-lg p-4 border border-[#333D4D]">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Net Profit</p>
                            <p className="text-lg font-bold text-blue-400 mt-0.5 font-mono">{formatCurrency(marketReport.netProfit)}</p>
                        </div>
                        <div className="bg-[#252D3A] rounded-lg p-4 border border-[#333D4D]">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Bets</p>
                            <p className="text-lg font-bold text-white mt-0.5 font-mono">{marketReport.totalBets ?? 0}</p>
                        </div>
                        <div className="bg-[#252D3A] rounded-lg p-4 border border-[#333D4D]">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Winning</p>
                            <p className="text-lg font-bold text-green-400 mt-0.5 font-mono">{marketReport.winningBets ?? 0}</p>
                        </div>
                        <div className="bg-[#252D3A] rounded-lg p-4 border border-[#333D4D]">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Losing</p>
                            <p className="text-lg font-bold text-red-400 mt-0.5 font-mono">{marketReport.losingBets ?? 0}</p>
                        </div>
                        <div className="bg-[#252D3A] rounded-lg p-4 border border-[#333D4D]">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Players</p>
                            <p className="text-lg font-bold text-white mt-0.5 font-mono">{marketReport.activeUsers ?? 0}</p>
                        </div>
                        <div className="bg-[#252D3A] rounded-lg p-4 border border-[#333D4D]">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Win Rate</p>
                            <p className="text-lg font-bold text-primary-400 mt-0.5 font-mono">{marketReport.winRate ?? 0}%</p>
                        </div>
                    </div>
                ) : selectedMarketId ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-lg bg-[#1F2732] border border-[#333D4D] text-center">
                        <FaChartBar className="w-12 h-12 text-gray-500 mb-3" />
                        <p className="text-gray-400 font-medium">No data for this market</p>
                        <p className="text-sm text-gray-500 mt-1">Try another market or a different date range.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 rounded-lg bg-[#1F2732]/50 border border-dashed border-[#333D4D] text-center">
                        <FaChartBar className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-gray-400 font-medium">Select a market above</p>
                        <p className="text-sm text-gray-400 mt-1">You’ll see revenue, payouts, bets and win rate for that market.</p>
                    </div>
                )}
            </div>

            {/* Detailed Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                {/* Revenue Details */}
                <SectionCard title="Revenue & Payouts" description="Selected period" icon={FaMoneyBillWave} linkTo="/reports" linkLabel="Reports">
                    <StatRow label="Total Revenue" value={formatCurrency(stats?.revenue?.total)} colorClass="text-green-400" />
                    <StatRow label="Total Payouts" value={formatCurrency(stats?.revenue?.payouts)} colorClass="text-red-400" />
                    <StatRow label="Net Profit" value={formatCurrency(stats?.revenue?.netProfit)} colorClass="text-blue-400" />
                </SectionCard>

                {/* Players */}
                <SectionCard title="Players" description="All-time counts" icon={FaUserFriends} linkTo="/all-users" linkLabel="All Players">
                    <StatRow label="Total Players" value={stats?.users?.total ?? 0} />
                    <StatRow label="Active Players" value={stats?.users?.active ?? 0} colorClass="text-green-400" />
                    <StatRow label="New in Period" value={stats?.users?.newToday ?? 0} colorClass="text-primary-400" />
                </SectionCard>

                {/* Bets */}
                <SectionCard title="Bets" description="Selected period" icon={FaChartBar} linkTo="/bet-history" linkLabel="Bet History">
                    <StatRow label="Total Bets" value={stats?.bets?.total ?? 0} />
                    <StatRow label="Winning Bets" value={stats?.bets?.winning ?? 0} colorClass="text-green-400" />
                    <StatRow label="Losing Bets" value={stats?.bets?.losing ?? 0} colorClass="text-red-400" />
                    <StatRow label="Pending Bets" value={stats?.bets?.pending ?? 0} colorClass="text-primary-400" />
                    <StatRow label="Win Rate" value={`${stats?.bets?.winRate ?? 0}%`} />
                </SectionCard>

                {/* Markets */}
                <SectionCard title="Markets" description="Main + Starline" icon={FaChartBar} linkTo="/markets" linkLabel="Markets">
                    <StatRow label="Total Markets" value={stats?.markets?.total ?? 0} />
                    <StatRow label="Open Now" value={stats?.markets?.open ?? 0} colorClass="text-green-400" />
                    <StatRow label="Result Pending" value={marketsPendingResult} colorClass={marketsPendingResult > 0 ? 'text-primary-400' : 'text-gray-400'} />
                    <StatRow label="Main Markets" value={stats?.markets?.main ?? stats?.markets?.total ?? 0} subValue={`${stats?.markets?.openMain ?? 0} open`} />
                    <StatRow label="Starline Markets" value={stats?.markets?.starline ?? 0} subValue={`${stats?.markets?.openStarline ?? 0} open`} />
                </SectionCard>

                {/* Payments */}
                <SectionCard title="Payments" description="Deposits & Withdrawals" icon={FaCreditCard} linkTo="/payment-management" linkLabel="Manage Payments">
                    <StatRow label="Deposits (period)" value={formatCurrency(stats?.payments?.totalDeposits)} colorClass="text-green-400" />
                    <StatRow label="Withdrawals (period)" value={formatCurrency(stats?.payments?.totalWithdrawals)} colorClass="text-red-400" />
                    <StatRow label="Pending Deposits" value={pendingDeposits} colorClass="text-primary-400" />
                    <StatRow label="Pending Withdrawals" value={pendingWithdrawals} colorClass="text-primary-400" />
                    <StatRow label="Total Pending" value={pendingPayments} colorClass="text-primary-400" />
                </SectionCard>

                {/* Wallet */}
                <SectionCard title="Wallet Balance" description="All players combined (all-time)" icon={FaWallet} linkTo="/wallet" linkLabel="Wallet">
                    <StatRow label="Total Balance" value={formatCurrency(stats?.wallet?.totalBalance)} colorClass="text-green-400" />
                </SectionCard>

                {/* Bookies (Super Admin only) */}
                {adminRole === 'super_admin' && (
                    <SectionCard title="Bookie Accounts" description="All-time" icon={FaUsers} linkTo="/bookie-management" linkLabel="Manage Bookies">
                        <StatRow label="Total Bookies" value={stats?.bookies?.total ?? 0} />
                        <StatRow label="Active Bookies" value={stats?.bookies?.active ?? 0} colorClass="text-green-400" />
                    </SectionCard>
                )}

                {/* Help Desk */}
                <SectionCard title="Help Desk" description="Support tickets" icon={FaLifeRing} linkTo="/help-desk" linkLabel="Help Desk">
                    <StatRow label="Total Tickets" value={stats?.helpDesk?.total ?? 0} />
                    <StatRow label="Open" value={stats?.helpDesk?.open ?? 0} colorClass="text-primary-400" />
                    <StatRow label="In Progress" value={stats?.helpDesk?.inProgress ?? 0} colorClass="text-blue-400" />
                </SectionCard>
            </div>

            {/* Revenue Timeline (period summary) */}
            <div className="bg-[#252D3A] rounded-xl p-5 border border-[#333D4D] mb-6">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <FaMoneyBillWave className="w-4 h-4 text-primary-400" />
                    Revenue Summary for Selected Period
                </h3>
                <p className="text-xs text-gray-400 mb-4">Total revenue in the selected date range.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#1F2732] rounded-lg p-4 border border-[#333D4D]">
                        <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                        <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(stats?.revenue?.total)}</p>
                    </div>
                    <div className="bg-[#1F2732] rounded-lg p-4 border border-[#333D4D]">
                        <p className="text-gray-400 text-sm mb-1">Total Payouts</p>
                        <p className="text-xl font-bold text-red-400 font-mono">{formatCurrency(stats?.revenue?.payouts)}</p>
                    </div>
                    <div className="bg-[#1F2732] rounded-lg p-4 border border-[#333D4D]">
                        <p className="text-gray-400 text-sm mb-1">Net Profit</p>
                        <p className="text-xl font-bold text-blue-400 font-mono">{formatCurrency(stats?.revenue?.netProfit)}</p>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-[#252D3A] rounded-xl p-5 border border-[#333D4D]">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <FaClipboardList className="w-4 h-4 text-primary-400" />
                    Quick Links
                </h3>
                <p className="text-xs text-gray-400 mb-4">Navigate to admin sections directly from here.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <Link to="/add-result" className="px-4 py-3 rounded-lg bg-[#1F2732] hover:bg-primary-500/20 border border-[#333D4D] hover:border-primary-400 text-gray-300 hover:text-primary-400 text-sm font-medium transition-all text-center">
                        Add Result
                    </Link>
                    <Link to="/update-rate" className="px-4 py-3 rounded-lg bg-[#1F2732] hover:bg-primary-500/20 border border-[#333D4D] hover:border-primary-400 text-gray-300 hover:text-primary-400 text-sm font-medium transition-all text-center">
                        Update Rate
                    </Link>
                    <Link to="/add-user" className="px-4 py-3 rounded-lg bg-[#1F2732] hover:bg-primary-500/20 border border-[#333D4D] hover:border-primary-400 text-gray-300 hover:text-primary-400 text-sm font-medium transition-all text-center">
                        Add Player
                    </Link>
                    <Link to="/add-market" className="px-4 py-3 rounded-lg bg-[#1F2732] hover:bg-primary-500/20 border border-[#333D4D] hover:border-primary-400 text-gray-300 hover:text-primary-400 text-sm font-medium transition-all text-center">
                        Add Market
                    </Link>
                    <Link to="/logs" className="px-4 py-3 rounded-lg bg-[#1F2732] hover:bg-primary-500/20 border border-[#333D4D] hover:border-primary-400 text-gray-300 hover:text-primary-400 text-sm font-medium transition-all text-center">
                        Activity Logs
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;

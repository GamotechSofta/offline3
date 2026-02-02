import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard, LoadingOverlay } from '../components/Skeleton';
import StatCard from '../components/StatCard';
import { FaChartLine, FaUsers, FaMoneyBillWave, FaChartBar, FaSyncAlt } from 'react-icons/fa';

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

/** Calendar filter row - same theme as rest of admin (yellow accent) */
const CalendarFilterRow = ({ datePreset, customMode, onPresetSelect, onCustomToggle, customOpen, customFrom, customTo, onCustomFromChange, onCustomToChange, onCustomApply }) => (
    <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => {
                const isActive = !customMode && datePreset === p.id;
                return (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => onPresetSelect(p.id)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            isActive
                                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                                : 'bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-yellow-500/50'
                        }`}
                    >
                        {p.label}
                    </button>
                );
            })}
            <button
                type="button"
                onClick={onCustomToggle}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    customMode ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-yellow-500/50'
                }`}
            >
                Custom
            </button>
        </div>
        {customOpen && (
            <div className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-gray-800/60 border border-gray-600">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">From</label>
                    <input type="date" value={customFrom} onChange={(e) => onCustomFromChange(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-sm text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50" />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">To</label>
                    <input type="date" value={customTo} onChange={(e) => onCustomToChange(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-sm text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50" />
                </div>
                <button type="button" onClick={onCustomApply} className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400">
                    Apply
                </button>
            </div>
        )}
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

    const getFromTo = () => {
        if (customMode && customFrom && customTo) return { from: customFrom, to: customTo };
        const preset = PRESETS.find((p) => p.id === datePreset);
        return preset ? preset.getRange() : PRESETS[0].getRange();
    };

    const getDisplayLabel = () => {
        if (customMode && customFrom && customTo) return formatRangeLabel(customFrom, customTo);
        const preset = PRESETS.find((p) => p.id === datePreset);
        return preset ? preset.label : 'Today';
    };

    useEffect(() => {
        const admin = localStorage.getItem('admin');
        if (!admin) {
            navigate('/');
            return;
        }
        fetchDashboardStats();
    }, [navigate]);

    const fetchDashboardStats = async (rangeOverride, options = {}) => {
        const isRefresh = options.refresh === true;
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError('');
            const { from, to } = rangeOverride || getFromTo();
            const admin = JSON.parse(localStorage.getItem('admin'));
            const password = sessionStorage.getItem('adminPassword') || '';
            const params = new URLSearchParams();
            if (from && to) {
                params.set('from', from);
                params.set('to', to);
            }
            if (isRefresh) params.set('_', String(Date.now()));
            const query = params.toString();
            const url = `${API_BASE_URL}/dashboard/stats${query ? `?${query}` : ''}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Basic ${btoa(`${admin.username}:${password}`)}`,
                },
                cache: isRefresh ? 'no-store' : 'default',
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            } else {
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
    };

    const handlePresetSelect = (presetId) => {
        setDatePreset(presetId);
        setCustomMode(false);
        setCustomOpen(false);
        const preset = PRESETS.find((p) => p.id === presetId);
        const range = preset ? preset.getRange() : PRESETS[0].getRange();
        fetchDashboardStats(range);
    };

    const handleCustomToggle = () => {
        setCustomMode(true);
        setCustomOpen((o) => !o);
    };

    const handleCustomApply = () => {
        if (!customFrom || !customTo) return;
        if (new Date(customFrom) > new Date(customTo)) return;
        setCustomMode(true);
        setCustomOpen(false);
        fetchDashboardStats({ from: customFrom, to: customTo });
    };

    const handleLogout = () => {
        localStorage.removeItem('admin');
        sessionStorage.removeItem('adminPassword');
        navigate('/');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <AdminLayout onLogout={handleLogout} title="Dashboard">
                <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold animate-fadeIn">Dashboard Overview</h1>
                    <CalendarFilterRow
                        datePreset={datePreset}
                        customMode={customMode}
                        onPresetSelect={handlePresetSelect}
                        onCustomToggle={handleCustomToggle}
                        customOpen={customOpen}
                        customFrom={customFrom}
                        customTo={customTo}
                        onCustomFromChange={setCustomFrom}
                        onCustomToChange={setCustomTo}
                        onCustomApply={handleCustomApply}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {[...Array(4)].map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[...Array(3)].map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout onLogout={handleLogout} title="Dashboard">
                <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold animate-fadeIn">Dashboard Overview</h1>
                    <CalendarFilterRow
                        datePreset={datePreset}
                        customMode={customMode}
                        onPresetSelect={handlePresetSelect}
                        onCustomToggle={handleCustomToggle}
                        customOpen={customOpen}
                        customFrom={customFrom}
                        customTo={customTo}
                        onCustomFromChange={setCustomFrom}
                        onCustomToChange={setCustomTo}
                        onCustomApply={handleCustomApply}
                    />
                </div>
                <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="text-red-400 text-lg font-medium mb-2">{error}</p>
                    <button
                        onClick={fetchDashboardStats}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold rounded-xl transition-all duration-200 glow-yellow hover:-translate-y-0.5"
                    >
                        Retry
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout onLogout={handleLogout} title="Dashboard">
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold animate-fadeIn">Dashboard Overview</h1>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-yellow-500/20 border border-gray-600 hover:border-yellow-500/60 text-gray-200 hover:text-yellow-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-gray-700 disabled:hover:border-gray-600 disabled:hover:text-gray-200 text-sm font-medium"
                        title="Refresh dashboard data"
                        aria-label="Refresh dashboard"
                    >
                        <FaSyncAlt className={`w-4 h-4 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
                <CalendarFilterRow
                    datePreset={datePreset}
                    customMode={customMode}
                    onPresetSelect={handlePresetSelect}
                    onCustomToggle={handleCustomToggle}
                    customOpen={customOpen}
                    customFrom={customFrom}
                    customTo={customTo}
                    onCustomFromChange={setCustomFrom}
                    onCustomToChange={setCustomTo}
                    onCustomApply={handleCustomApply}
                />
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats?.revenue?.total || 0)}
                    icon={FaMoneyBillWave}
                    color="green"
                    delay={0}
                    details={[
                        { label: 'Today', value: formatCurrency(stats?.revenue?.today || 0) },
                        { label: 'Week', value: formatCurrency(stats?.revenue?.thisWeek || 0) }
                    ]}
                />

                <StatCard
                    title="Net Profit"
                    value={formatCurrency(stats?.revenue?.netProfit || 0)}
                    icon={FaChartLine}
                    color="blue"
                    delay={0.1}
                    details={[
                        { label: 'Payouts', value: formatCurrency(stats?.revenue?.payouts || 0) }
                    ]}
                />

                <StatCard
                    title="Total Players"
                    value={stats?.users?.total || 0}
                    icon={FaUsers}
                    color="purple"
                    delay={0.2}
                    details={[
                        { label: 'Active', value: stats?.users?.active || 0 },
                        { label: 'New', value: stats?.users?.newToday || 0 }
                    ]}
                />

                <StatCard
                    title="Total Bets"
                    value={stats?.bets?.total || 0}
                    icon={FaChartBar}
                    color="yellow"
                    delay={0.3}
                    details={[
                        { label: 'Win Rate', value: `${stats?.bets?.winRate || 0}%` },
                        { label: 'Today', value: stats?.bets?.today || 0 }
                    ]}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Markets Card */}
                <div className="glass rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:-translate-y-0.5 animate-slideUp" style={{ animationDelay: '0.4s' }}>
                    <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        Markets
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                            <span className="text-gray-400 text-sm">Total Markets</span>
                            <span className="text-white font-bold font-mono">{stats?.markets?.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                            <span className="text-gray-400 text-sm">Open Now</span>
                            <span className="text-green-400 font-bold font-mono">{stats?.markets?.open || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Bet Status Card */}
                <div className="glass rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:-translate-y-0.5 animate-slideUp" style={{ animationDelay: '0.5s' }}>
                    <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        Bet Status
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                            <span className="text-gray-400 text-sm">Winning</span>
                            <span className="text-green-400 font-bold font-mono">{stats?.bets?.winning || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                            <span className="text-gray-400 text-sm">Losing</span>
                            <span className="text-red-400 font-bold font-mono">{stats?.bets?.losing || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                            <span className="text-gray-400 text-sm">Pending</span>
                            <span className="text-yellow-400 font-bold font-mono">{stats?.bets?.pending || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Payments Card */}
                <div className="glass rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:-translate-y-0.5 animate-slideUp" style={{ animationDelay: '0.6s' }}>
                    <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        Payments
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                            <span className="text-gray-400 text-sm">Total Deposits</span>
                            <span className="text-green-400 font-bold font-mono text-sm">{formatCurrency(stats?.payments?.totalDeposits || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                            <span className="text-gray-400 text-sm">Total Withdrawals</span>
                            <span className="text-red-400 font-bold font-mono text-sm">{formatCurrency(stats?.payments?.totalWithdrawals || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                            <span className="text-gray-400 text-sm">Pending</span>
                            <span className="text-yellow-400 font-bold font-mono">{stats?.payments?.pending || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Wallet Card */}
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Wallet</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Total Balance</span>
                            <span className="text-yellow-400 font-bold text-xl">{formatCurrency(stats?.wallet?.totalBalance || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Player Growth Card */}
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Player Growth</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-400">This Week</span>
                            <span className="text-green-400 font-bold">{stats?.users?.newThisWeek || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">This Month</span>
                            <span className="text-green-400 font-bold">{stats?.users?.newThisMonth || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Help Desk Card */}
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Help Desk</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Total Tickets</span>
                            <span className="text-white font-bold">{stats?.helpDesk?.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Open</span>
                            <span className="text-yellow-400 font-bold">{stats?.helpDesk?.open || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">In Progress</span>
                            <span className="text-blue-400 font-bold">{stats?.helpDesk?.inProgress || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Timeline */}
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Revenue Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-2">Today</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(stats?.revenue?.today || 0)}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-2">This Week</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(stats?.revenue?.thisWeek || 0)}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-2">This Month</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(stats?.revenue?.thisMonth || 0)}</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;

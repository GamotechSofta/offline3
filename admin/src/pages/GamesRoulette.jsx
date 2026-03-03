import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getAuthHeaders, clearAdminSession } from '../lib/auth';
import { FaArrowLeft, FaSave, FaPlay, FaChartLine } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1';

const GamesRoulette = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState(null);
    const [globalStats, setGlobalStats] = useState(null);
    const [simulation, setSimulation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [simSpins, setSimSpins] = useState(1000000);

    useEffect(() => {
        fetchConfig();
        fetchGlobalStats();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/roulette/config`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setConfig(data.data);
            else setError(data.message || 'Failed to load config');
        } catch (err) {
            setError('Failed to load config');
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/roulette/global-stats`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setGlobalStats(data.data);
        } catch (_) {}
    };

    const handleChange = (key, value) => {
        if (value === true || value === false) {
            setConfig((c) => (c ? { ...c, [key]: value } : c));
            return;
        }
        const num = Number(value);
        setConfig((c) => (c ? { ...c, [key]: Number.isFinite(num) ? num : value } : c));
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`${API_BASE_URL}/roulette/config`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(config),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Config saved.');
                setConfig(data.data);
                setTimeout(() => setSuccess(''), 3000);
            } else setError(data.message || 'Save failed');
        } catch (err) {
            setError('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleRunSimulation = async () => {
        setSimulating(true);
        setError('');
        setSimulation(null);
        try {
            const res = await fetch(`${API_BASE_URL}/roulette/monte-carlo`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ spins: simSpins }),
            });
            const data = await res.json();
            if (data.success) {
                setSimulation(data.data);
                fetchGlobalStats();
            } else setError(data.message || 'Simulation failed');
        } catch (err) {
            setError('Simulation failed');
        } finally {
            setSimulating(false);
        }
    };

    const handleLogout = () => {
        clearAdminSession();
        navigate('/');
    };

    if (loading) {
        return (
            <AdminLayout onLogout={handleLogout} title="Roulette">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-[#1F2732] rounded" />
                    <div className="h-64 bg-[#1F2732] rounded-xl" />
                </div>
            </AdminLayout>
        );
    }

    const num = (v) => (v != null ? v : '—');

    return (
        <AdminLayout onLogout={handleLogout} title="Roulette">
            <div className="min-w-0 max-w-full">
                <div className="mb-4">
                    <Link to="/games" className="text-gray-400 hover:text-primary-500 text-sm inline-flex items-center gap-1 mb-2">
                        <FaArrowLeft className="w-4 h-4" /> Games
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Roulette — Config & Analytics</h1>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-600/50 text-red-400 text-sm">{error}</div>
                )}
                {success && (
                    <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-600/50 text-green-400 text-sm">{success}</div>
                )}

                {/* Global stats */}
                <div className="bg-[#252D3A] rounded-xl border border-[#333D4D] p-6 mb-6">
                    <h2 className="text-lg font-semibold text-primary-500 mb-4 flex items-center gap-2">
                        <FaChartLine /> Global exposure
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Total wagered</p>
                            <p className="text-white font-mono font-semibold">{num(globalStats?.totalWagered?.toLocaleString())}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Total paid</p>
                            <p className="text-white font-mono font-semibold">{num(globalStats?.totalPaid?.toLocaleString())}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Spins</p>
                            <p className="text-white font-mono font-semibold">{num(globalStats?.spinCount?.toLocaleString())}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">RTP</p>
                            <p className="text-primary-400 font-mono font-semibold">{globalStats?.rtp != null ? `${(globalStats.rtp * 100).toFixed(2)}%` : '—'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">House profit</p>
                            <p className="text-red-400 font-mono font-semibold">{globalStats?.houseProfit != null ? Number(globalStats.houseProfit).toLocaleString() : '—'}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchGlobalStats}
                        className="mt-3 text-sm text-gray-400 hover:text-primary-400"
                    >
                        Refresh
                    </button>
                </div>

                {/* Exposure config (Super Admin) */}
                {config && (
                    <div className="bg-[#252D3A] rounded-xl border border-[#333D4D] p-6 mb-6">
                        <h2 className="text-lg font-semibold text-primary-500 mb-4">Exposure & risk limits (Super Admin)</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">House reserve</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000000"
                                    value={config.houseReserve ?? 1e9}
                                    onChange={(e) => handleChange('houseReserve', Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Risk factor (max payout = reserve × this)</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    max="1"
                                    step="0.01"
                                    value={config.riskFactor != null ? config.riskFactor * 100 : 10}
                                    onChange={(e) => handleChange('riskFactor', Number(e.target.value) / 100)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Table liability cap (optional)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Optional"
                                    value={config.tableLiabilityCap ?? ''}
                                    onChange={(e) => handleChange('tableLiabilityCap', e.target.value === '' ? undefined : Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Max straight-up per number (optional)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Optional"
                                    value={config.maxStraightUpPerNumber ?? ''}
                                    onChange={(e) => handleChange('maxStraightUpPerNumber', e.target.value === '' ? undefined : Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Kelly fraction (max stake per spin)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={config.kellyFraction != null ? config.kellyFraction * 100 : 5}
                                    onChange={(e) => handleChange('kellyFraction', Number(e.target.value) / 100)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="provablyFairEnabled"
                                    checked={config.provablyFairEnabled === true}
                                    onChange={(e) => handleChange('provablyFairEnabled', e.target.checked)}
                                    className="rounded bg-[#1F2732] border-[#333D4D] text-primary-500 focus:ring-primary-500"
                                />
                                <label htmlFor="provablyFairEnabled" className="text-gray-400 text-sm">Provably fair enabled (clientSeed + nonce)</label>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold disabled:opacity-50"
                        >
                            {saving ? <span className="animate-spin">⏳</span> : <FaSave />}
                            Save config
                        </button>
                    </div>
                )}

                {/* Operational risk automation (reserve thresholds, exposure reduction) */}
                {config && (
                    <div className="bg-[#252D3A] rounded-xl border border-[#333D4D] p-6 mb-6">
                        <h2 className="text-lg font-semibold text-primary-500 mb-4">Operational risk automation</h2>
                        <p className="text-gray-400 text-sm mb-4">When reserve falls below thresholds, table can halt or high-risk bets freeze. When exposure ratio exceeds threshold, max straight-up is reduced.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Reserve halt table (below this = no spins)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Optional"
                                    value={config.reserveHaltTable ?? ''}
                                    onChange={(e) => handleChange('reserveHaltTable', e.target.value === '' ? undefined : Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Reserve freeze high-risk (below this = no straight-up)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Optional"
                                    value={config.reserveFreezeHighRisk ?? ''}
                                    onChange={(e) => handleChange('reserveFreezeHighRisk', e.target.value === '' ? undefined : Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Exposure ratio threshold (0–100%, reduce above this)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={config.exposureRatioReductionThreshold != null ? config.exposureRatioReductionThreshold * 100 : 60}
                                    onChange={(e) => handleChange('exposureRatioReductionThreshold', Number(e.target.value) / 100)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Max straight-up reduction (0–100% when over threshold)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={config.maxStraightUpReductionFactor != null ? config.maxStraightUpReductionFactor * 100 : 20}
                                    onChange={(e) => handleChange('maxStraightUpReductionFactor', Number(e.target.value) / 100)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Min reserve formula (docs only, e.g. totalWagered * 0.02)</label>
                                <input
                                    type="text"
                                    placeholder="Optional"
                                    value={config.minReserveFormula ?? ''}
                                    onChange={(e) => handleChange('minReserveFormula', e.target.value || undefined)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold disabled:opacity-50"
                        >
                            {saving ? <span className="animate-spin">⏳</span> : <FaSave />}
                            Save config
                        </button>
                    </div>
                )}

                {/* Monte Carlo simulator (pure European wheel, no steering) */}
                <div className="bg-[#252D3A] rounded-xl border border-[#333D4D] p-6">
                    <h2 className="text-lg font-semibold text-primary-500 mb-4">Monte Carlo (1M spins default)</h2>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <input
                            type="number"
                            min="10000"
                            max="2000000"
                            step="100000"
                            value={simSpins}
                            onChange={(e) => setSimSpins(Number(e.target.value) || 1000000)}
                            className="w-36 px-3 py-2 rounded-lg bg-[#1F2732] border border-[#333D4D] text-white"
                        />
                        <span className="text-gray-400 text-sm">spins</span>
                        <button
                            type="button"
                            onClick={handleRunSimulation}
                            disabled={simulating}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold disabled:opacity-50"
                        >
                            {simulating ? <span className="animate-spin">⏳</span> : <FaPlay />}
                            Run Monte Carlo
                        </button>
                    </div>
                    {simulation && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 p-4 bg-[#1F2732] rounded-lg">
                                <div>
                                    <p className="text-gray-400 text-xs">Spins</p>
                                    <p className="text-white font-mono font-semibold">{simulation.spins?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">RTP %</p>
                                    <p className="text-primary-400 font-mono font-semibold">{simulation.rtpPct != null ? `${simulation.rtpPct}%` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">House edge %</p>
                                    <p className="text-red-400 font-mono font-semibold">{simulation.houseEdgePct != null ? `${simulation.houseEdgePct}%` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Std deviation</p>
                                    <p className="text-white font-mono font-semibold">{simulation.stdDev ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Max drawdown</p>
                                    <p className="text-white font-mono font-semibold">{simulation.maxDrawdown ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">House profit</p>
                                    <p className="text-red-400 font-mono font-semibold">{simulation.houseProfit?.toLocaleString() ?? '—'}</p>
                                </div>
                            </div>
                            {simulation.evenMoneyWinRate != null && (
                                <div className="p-3 bg-[#1F2732]/60 rounded-lg text-sm">
                                    <p className="text-gray-400">Even-money win rate: <span className="text-white font-mono">{Number(simulation.evenMoneyWinRate * 100).toFixed(2)}%</span> (theoretical 48.65%)</p>
                                </div>
                            )}
                            {Array.isArray(simulation.numberDistribution) && simulation.numberDistribution.length > 0 && (
                                <div className="p-3 bg-[#1F2732]/60 rounded-lg">
                                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Number frequency (0–36) — expect uniform</p>
                                    <div className="flex flex-wrap gap-1">
                                        {simulation.numberDistribution.slice(0, 37).map((d) => (
                                            <span key={d.number} className="text-xs px-1.5 py-0.5 rounded bg-[#333D4D] text-gray-300" title={`#${d.number}: ${(d.frequency * 100).toFixed(2)}%`}>
                                                {d.number}:{(d.frequency * 100).toFixed(1)}%
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default GamesRoulette;

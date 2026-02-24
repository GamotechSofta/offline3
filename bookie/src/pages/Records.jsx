import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { API_BASE_URL, getBookieAuthHeaders } from '../utils/api';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const formatBetDetails = (bet) => {
    const betType = String(bet?.betType || '').toLowerCase();
    const betNumber = String(bet?.betNumber || '').trim();
    const betOn = String(bet?.betOn || '').toLowerCase();

    if (betType === 'panna' && betNumber) {
        if (betOn === 'close') return `CLOSE PANA ${betNumber}`;
        return `OPEN PANA ${betNumber}`;
    }

    return `${String(bet?.betType || '').toUpperCase()} ${betNumber}`.trim();
};

const Records = () => {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [betByFilter, setBetByFilter] = useState('all'); // all | player | bookie | market
    const [selectedMarketName, setSelectedMarketName] = useState(''); // for market-wise filter

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const [betsRes, paymentsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/bets/history`, { headers: getBookieAuthHeaders() }),
                fetch(`${API_BASE_URL}/payments`, { headers: getBookieAuthHeaders() }),
            ]);
            const [betsData, paymentsData] = await Promise.all([betsRes.json(), paymentsRes.json()]);

            const betRecords = (betsData?.success ? betsData.data || [] : []).map((b) => ({
                id: `bet-${b._id}`,
                recordType: 'bet',
                createdAt: b.createdAt,
                playerName: b.userId?.username || '—',
                marketName: b.marketId?.marketName || '—',
                description: formatBetDetails(b),
                amount: Number(b.amount) || 0,
                flow: 'debit',
                status: b.status || 'pending',
                betPlacedBy: b.placedByBookie ? 'bookie' : 'player',
                source: b.placedByBookie ? (b.placedByBookieId?.username || 'Bookie') : 'Player',
            }));

            const paymentRecords = (paymentsData?.success ? paymentsData.data || [] : []).map((p) => ({
                id: `payment-${p._id}`,
                recordType: 'payment',
                createdAt: p.createdAt,
                playerName: p.userId?.username || '—',
                marketName: '—',
                description: `${String(p.type || '').toUpperCase()}${p.method ? ` • ${p.method}` : ''}`.trim(),
                amount: Number(p.amount) || 0,
                flow: p.type === 'deposit' ? 'credit' : 'debit',
                status: p.status || 'pending',
                betPlacedBy: null,
                source: 'Payment',
            }));

            const combined = [...betRecords, ...paymentRecords].sort((a, b) => {
                const at = new Date(a.createdAt).getTime() || 0;
                const bt = new Date(b.createdAt).getTime() || 0;
                return bt - at;
            });
            setRecords(combined);
        } catch (err) {
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const uniqueMarketNames = useMemo(() => {
        const names = new Set();
        records.forEach((r) => {
            if (r.recordType === 'bet' && r.marketName && r.marketName !== '—') names.add(r.marketName);
        });
        return Array.from(names).sort((a, b) => String(a).localeCompare(String(b)));
    }, [records]);

    const filteredRecords = useMemo(() => {
        let list = records;
        if (betByFilter === 'player' || betByFilter === 'bookie') {
            list = list.filter((r) => r.recordType === 'bet' && r.betPlacedBy === betByFilter);
        } else if (betByFilter === 'market') {
            if (selectedMarketName) list = list.filter((r) => r.marketName === selectedMarketName);
        }
        return [...list].sort((a, b) => {
            const marketA = String(a.marketName || '').toLowerCase();
            const marketB = String(b.marketName || '').toLowerCase();
            if (marketA !== marketB) return marketA.localeCompare(marketB);
            const at = new Date(a.createdAt).getTime() || 0;
            const bt = new Date(b.createdAt).getTime() || 0;
            return bt - at;
        });
    }, [records, betByFilter, selectedMarketName]);

    return (
        <Layout title="Bets History">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Bets History</h1>

            <div className="bg-[#252D3A] rounded-lg p-4 mb-4 sm:mb-6 border border-[#333D4D]">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Bets By:</span>
                    <button
                        type="button"
                        onClick={() => setBetByFilter('all')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                            betByFilter === 'all' ? 'bg-primary-500 text-white border-primary-500' : 'bg-[#1F2732] text-gray-300 border-[#333D4D]'
                        }`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setBetByFilter('player')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                            betByFilter === 'player' ? 'bg-primary-500 text-white border-primary-500' : 'bg-[#1F2732] text-gray-300 border-[#333D4D]'
                        }`}
                    >
                        Bets by Player
                    </button>
                    <button
                        type="button"
                        onClick={() => setBetByFilter('bookie')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                            betByFilter === 'bookie' ? 'bg-primary-500 text-white border-primary-500' : 'bg-[#1F2732] text-gray-300 border-[#333D4D]'
                        }`}
                    >
                        Bets by Bookie
                    </button>
                    <button
                        type="button"
                        onClick={() => setBetByFilter('market')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                            betByFilter === 'market' ? 'bg-primary-500 text-white border-primary-500' : 'bg-[#1F2732] text-gray-300 border-[#333D4D]'
                        }`}
                    >
                        Bets by Market
                    </button>
                </div>
                {betByFilter === 'market' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Market:</label>
                        <select
                            value={selectedMarketName}
                            onChange={(e) => setSelectedMarketName(e.target.value)}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-[#1F2732] border border-[#333D4D] text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-400 min-w-[180px]"
                        >
                            <option value="">All markets</option>
                            {uniqueMarketNames.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <p className="text-gray-400 py-12 text-center">Loading records...</p>
            ) : filteredRecords.length === 0 ? (
                <div className="bg-[#252D3A] rounded-lg p-8 text-center border border-[#333D4D]">
                    <p className="text-gray-500">No records found.</p>
                </div>
            ) : (
                <div className="bg-[#252D3A] rounded-lg overflow-hidden border border-[#333D4D]">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#1F2732]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Player</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Details</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Market</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Source</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Credit</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Debit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredRecords.map((r) => (
                                    <tr key={r.id} className="hover:bg-[#252D3A]">
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${r.recordType === 'bet' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {r.recordType.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white">{r.playerName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-300">{r.description || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-300">{r.marketName || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-300">{r.source || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                            {r.flow === 'credit' ? formatCurrency(r.amount) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-500">
                                            {r.flow === 'debit' ? formatCurrency(r.amount) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                r.status === 'won' || r.status === 'approved' || r.status === 'completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : r.status === 'lost' || r.status === 'rejected'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-primary-100 text-primary-700'
                                            }`}>
                                                {String(r.status || 'pending').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-300">
                                            {new Date(r.createdAt).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Records;

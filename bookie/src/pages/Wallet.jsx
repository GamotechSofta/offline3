import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { API_BASE_URL, getBookieAuthHeaders } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

const Wallet = () => {
    const { t } = useLanguage();
    const [wallets, setWallets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [bookieTransactions, setBookieTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('wallets');
    const [transactionView, setTransactionView] = useState('player'); // 'player' | 'bookie'

    useEffect(() => {
        if (activeTab === 'wallets') fetchWallets();
        else if (transactionView === 'player') fetchTransactions();
        else fetchBookieTransactions();
    }, [activeTab, transactionView]);

    const fetchWallets = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/wallet/all`, { headers: getBookieAuthHeaders() });
            const data = await response.json();
            if (data.success) setWallets(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/wallet/transactions`, { headers: getBookieAuthHeaders() });
            const data = await response.json();
            if (data.success) setTransactions(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookieTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/wallet/bookie-transactions`, { headers: getBookieAuthHeaders() });
            const data = await response.json();
            if (data.success) setBookieTransactions(data.data || []);
        } catch (err) {
            console.error(err);
            setBookieTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title={t('wallet')}>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">{t('walletTitle')}</h1>
            <div className="flex gap-4 mb-4 sm:mb-6 border-b border-[#333D4D]">
                <button onClick={() => setActiveTab('wallets')} className={`pb-4 px-4 font-semibold transition-colors ${activeTab === 'wallets' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-400 hover:text-gray-600'}`}>{t('playerWallets')}</button>
                <button onClick={() => setActiveTab('transactions')} className={`pb-4 px-4 font-semibold transition-colors ${activeTab === 'transactions' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-400 hover:text-gray-600'}`}>{t('transactions')}</button>
            </div>
            {loading ? (
                <p className="text-gray-400 py-12 text-center">{t('loading')}</p>
            ) : activeTab === 'wallets' ? (
                <div className="bg-[#252D3A] rounded-lg overflow-hidden border border-[#333D4D]">
                    <table className="w-full">
                        <thead className="bg-[#1F2732]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Player</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333D4D]">
                            {wallets.length === 0 ? <tr><td colSpan="2" className="px-6 py-4 text-center text-gray-400">No wallets found</td></tr> : wallets.map((w) => (
                                <tr key={w._id} className="hover:bg-[#1F2732]">
                                    <td className="px-6 py-4 text-sm">{w.userId?.username || w.userId}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-primary-500">₹{w.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div>
                    <div className="flex gap-3 mb-4">
                        <button
                            type="button"
                            onClick={() => setTransactionView('player')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${transactionView === 'player' ? 'bg-primary-500 text-white' : 'bg-[#252D3A] border border-[#333D4D] text-gray-300 hover:bg-[#333D4D]'}`}
                        >
                            {t('player')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTransactionView('bookie')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${transactionView === 'bookie' ? 'bg-primary-500 text-white' : 'bg-[#252D3A] border border-[#333D4D] text-gray-300 hover:bg-[#333D4D]'}`}
                        >
                            {t('bookie')}
                        </button>
                    </div>
                    {transactionView === 'player' ? (
                        <div className="bg-[#252D3A] rounded-lg overflow-hidden border border-[#333D4D]">
                            <table className="w-full">
                                <thead className="bg-[#1F2732]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Player</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#333D4D]">
                                    {transactions.length === 0 ? <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-400">No transactions found</td></tr> : transactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-[#1F2732]">
                                            <td className="px-6 py-4 text-sm text-gray-300">{tx.userId?.username || tx.userId}</td>
                                            <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-medium ${tx.type === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{tx.type}</span></td>
                                            <td className="px-6 py-4 text-sm text-white">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-[#252D3A] rounded-lg overflow-hidden border border-[#333D4D]">
                            <table className="w-full">
                                <thead className="bg-[#1F2732]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Player / Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#333D4D]">
                                    {bookieTransactions.length === 0 ? <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-400">No bookie transactions found</td></tr> : bookieTransactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-[#1F2732]">
                                            <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-medium ${tx.type === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{tx.type}</span></td>
                                            <td className="px-6 py-4 text-sm text-white">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4 text-sm text-gray-300">{tx.playerName || tx.description || '—'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default Wallet;

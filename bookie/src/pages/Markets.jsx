import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { API_BASE_URL } from '../utils/api';

const Markets = () => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMarkets();
    }, []);

    const fetchMarkets = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/markets/get-markets`);
            const data = await response.json();
            if (data.success) setMarkets(data.data);
            else setError('Failed to fetch markets');
        } catch (err) {
            setError('Network error. Please check if the server is running.');
        } finally {
            setLoading(false);
        }
    };

    const getMarketStatus = (market) => {
        try {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const parse = (t) => {
                if (!t) return null;
                const [h, m] = t.split(':').map(Number);
                return h >= 0 && h < 24 && m >= 0 && m < 60 ? h * 60 + m : null;
            };
            const start = parse(market.startingTime);
            const end = parse(market.closingTime);
            if (!start || !end) return { status: 'unknown', color: 'bg-gray-600' };
            if (currentTime < start) return { status: 'upcoming', color: 'bg-blue-600' };
            if (currentTime >= start && currentTime <= end) return { status: 'open', color: 'bg-green-600' };
            return { status: 'closed', color: 'bg-red-600' };
        } catch {
            return { status: 'unknown', color: 'bg-gray-600' };
        }
    };

    return (
        <Layout title="Markets">
            <div>
                <h1 className="text-3xl font-bold mb-6">Markets (View Only)</h1>
                {error && <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">{error}</div>}
                {loading ? (
                    <p className="text-gray-400 py-12 text-center">Loading markets...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {markets.map((market) => {
                            const { status, color } = getMarketStatus(market);
                            return (
                                <div key={market._id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                                    <div className={`${color} text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4`}>{status.toUpperCase()}</div>
                                    <h3 className="text-xl font-bold text-white mb-2">{market.marketName}</h3>
                                    <div className="space-y-2 text-sm text-gray-300">
                                        <p><span className="font-semibold">Opening:</span> {market.startingTime}</p>
                                        <p><span className="font-semibold">Closing:</span> {market.closingTime}</p>
                                        <p><span className="font-semibold">Result:</span> <span className="text-yellow-400 font-mono">{market.displayResult || '***-**-***'}</span></p>
                                        {market.winNumber && <p><span className="font-semibold">Win Number:</span> <span className="text-green-400 font-mono">{market.winNumber}</span></p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Markets;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getAuthHeaders, clearAdminSession } from '../lib/auth';
import { FaGamepad, FaCog, FaChartLine } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1';

const GAMES = [
    {
        id: 'roulette',
        name: 'Roulette',
        description: 'Configure win %, RTP band, risk and exposure. View global stats and run simulations.',
        path: '/games/roulette',
        icon: FaGamepad,
    },
];

const Games = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearAdminSession();
        navigate('/');
    };

    return (
        <AdminLayout onLogout={handleLogout} title="Games">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Games</h1>
                <p className="text-gray-400 text-sm">Configure and analyze casino games. Set win %, RTP, and risk parameters.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {GAMES.map((game) => (
                    <div
                        key={game.id}
                        onClick={() => navigate(game.path)}
                        className="bg-[#252D3A] rounded-xl border border-[#333D4D] p-6 cursor-pointer hover:bg-[#252D3A]/90 hover:border-primary-500/50 transition-all flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400">
                                <game.icon className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">{game.name}</h2>
                        </div>
                        <p className="text-gray-400 text-sm flex-1 mb-4">{game.description}</p>
                        <div className="flex items-center gap-2 text-primary-400 text-sm font-medium">
                            <FaCog className="w-4 h-4" />
                            <span>Config & analytics</span>
                            <FaChartLine className="w-4 h-4 ml-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
};

export default Games;

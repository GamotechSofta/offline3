import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    FaTachometerAlt,
    FaChartBar, 
    FaUserPlus, 
    FaPlusCircle, 
    FaHistory, 
    FaTrophy, 
    FaChartLine, 
    FaCreditCard, 
    FaWallet, 
    FaLifeRing,
    FaSignOutAlt,
    FaUsers,
    FaEdit,
    FaTimes
} from 'react-icons/fa';

const Sidebar = ({ onLogout, isOpen = true, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
        { path: '/bookie-management', label: 'Bookie Accounts', icon: FaUsers },
        { path: '/markets', label: 'Markets', icon: FaChartBar },
        { path: '/add-result', label: 'Add Result', icon: FaEdit },
        { path: '/add-user', label: 'Add User', icon: FaUserPlus },
        { path: '/add-market', label: 'Add New Market', icon: FaPlusCircle },
        { path: '/bet-history', label: 'Bet History', icon: FaHistory },
        { path: '/top-winners', label: 'Top Winners', icon: FaTrophy },
        { path: '/reports', label: 'Report', icon: FaChartLine },
        { path: '/payment-management', label: 'Payments', icon: FaCreditCard },
        { path: '/wallet', label: 'Wallet', icon: FaWallet },
        { path: '/help-desk', label: 'Help Desk', icon: FaLifeRing },
    ];

    const isActive = (path) => location.pathname === path;

    const handleNav = (path) => {
        navigate(path);
        onClose?.();
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen w-64 sm:w-72 bg-gray-800 border-r border-gray-700 flex flex-col z-50 overflow-y-auto
                transform transition-transform duration-200 ease-in-out
                lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            {/* Logo + Close (mobile) */}
            <div className="p-4 sm:p-6 border-b border-gray-700 shrink-0 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-yellow-500">Super Admin</h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-700 text-gray-400"
                    aria-label="Close menu"
                >
                    <FaTimes className="w-5 h-5" />
                </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                            isActive(item.path)
                                ? 'bg-yellow-500 text-black font-semibold'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                        <item.icon className="w-5 h-5 sm:text-xl shrink-0" />
                        <span className="truncate">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-3 sm:p-4 border-t border-gray-700 shrink-0">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors text-sm sm:text-base"
                >
                    <FaSignOutAlt className="w-5 h-5 sm:text-xl shrink-0" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

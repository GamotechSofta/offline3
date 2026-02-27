import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaTachometerAlt,
    FaChartBar,
    FaChartLine,
    FaCreditCard,
    FaWallet,
    FaSignOutAlt,
    FaUsers,
    FaUserFriends,
    FaEdit,
    FaTimes,
    FaClipboardList,
    FaCoins,
    FaCog,
    FaMoneyBillWave,
} from 'react-icons/fa';
import GoogleTranslate from './GoogleTranslate';

const Sidebar = ({ onLogout, isOpen = true, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const navRef = useRef(null);
    const savedScrollTop = useRef(0);

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
        { path: '/all-users', label: 'All Players', icon: FaUserFriends },
        { path: '/bookie-management', label: 'Bookie Accounts', icon: FaUsers },
        { path: '/markets', label: 'Markets', icon: FaChartBar },
        { path: '/add-result', label: 'Add Result', icon: FaEdit },
        { path: '/update-rate', label: 'Update Rate', icon: FaCoins },
        { path: '/reports', label: 'Report', icon: FaChartLine },
        { path: '/revenue', label: 'Revenue', icon: FaMoneyBillWave },
        { path: '/payment-management', label: 'Payments', icon: FaCreditCard },
        { path: '/wallet', label: 'Wallet', icon: FaWallet },
        { path: '/logs', label: 'Logs', icon: FaClipboardList },
        { path: '/settings', label: 'Settings', icon: FaCog },
    ];

    const isActive = (path) => {
        if (path === '/all-users' || path === '/markets') {
            return location.pathname === path || location.pathname.startsWith(path + '/');
        }
        if (path === '/revenue') {
            return location.pathname === '/revenue' || location.pathname.startsWith('/revenue/');
        }
        if (path === '/reports') return location.pathname === '/reports';
        return location.pathname === path;
    };

    const handleNav = (path) => {
        savedScrollTop.current = navRef.current?.scrollTop ?? 0;
        navigate(path);
        onClose?.();
    };

    useEffect(() => {
        if (navRef.current != null && savedScrollTop.current > 0) {
            navRef.current.scrollTop = savedScrollTop.current;
            savedScrollTop.current = 0;
        }
    }, [location.pathname]);

    return (
        <aside
            className={`fixed left-0 top-0 h-screen w-64 sm:w-72 bg-[#181E27] border-r border-[#333D4D] flex flex-col z-50 overflow-y-auto shadow-lg
                transform transition-transform duration-200 ease-in-out
                lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            <div className="p-4 sm:p-6 border-b border-[#333D4D] shrink-0 flex items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-primary-400 truncate">Super Admin</h2>
                <div className="shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg hover:bg-[#252D3A] text-gray-400"
                        aria-label="Close menu"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <nav ref={navRef} className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm sm:text-base ${
                            isActive(item.path)
                                ? 'bg-primary-500 text-white font-semibold shadow-lg shadow-primary-500/20'
                                : 'text-gray-300 hover:bg-[#252D3A] hover:text-primary-400 hover:-translate-y-0.5'
                        }`}
                    >
                        <item.icon className="w-5 h-5 sm:text-xl shrink-0" />
                        <span className="truncate">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-3 sm:p-4 border-t border-[#333D4D] shrink-0 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 shrink-0">Translate page:</span>
                    <GoogleTranslate />
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 border border-red-500/50 text-white font-semibold transition-all duration-200"
                >
                    <FaSignOutAlt className="w-5 h-5 shrink-0" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

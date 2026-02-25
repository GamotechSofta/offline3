import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaTachometerAlt,
    FaUserPlus,
    FaHistory,
    FaChartLine,
    FaWallet,
    FaSignOutAlt,
    FaUsers,
    FaTimes,
    FaMoneyBillWave,
    FaKeyboard,
    FaFileInvoiceDollar,
    FaCreditCard,
    FaCog,
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import GoogleTranslate from './GoogleTranslate';

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 400;
export const SIDEBAR_DEFAULT_WIDTH = 288; // 18rem, matches w-72
export const SIDEBAR_STORAGE_KEY = 'bookieLayoutSidebarWidth';

export const getStoredSidebarWidth = () => {
    try {
        const val = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (val) {
            const n = Number(val);
            if (n >= SIDEBAR_MIN_WIDTH && n <= SIDEBAR_MAX_WIDTH) return n;
        }
    } catch (e) { /* ignore */ }
    return SIDEBAR_DEFAULT_WIDTH;
};

const Sidebar = ({ user, onLogout, isOpen = true, onClose, width = SIDEBAR_DEFAULT_WIDTH, onWidthChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);

    const handleResizeMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        dragRef.current = { startX: e.clientX, startWidth: width };
    }, [width]);

    const handleResizeTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        setIsDragging(true);
        dragRef.current = { startX: touch.clientX, startWidth: width };
    }, [width]);

    useEffect(() => {
        if (!isDragging) return;
        const handleMove = (clientX) => {
            if (!dragRef.current) return;
            const diff = clientX - dragRef.current.startX;
            let newWidth = dragRef.current.startWidth + diff;
            newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, newWidth));
            onWidthChange?.(newWidth);
        };
        const onMouseMove = (e) => handleMove(e.clientX);
        const onTouchMove = (e) => handleMove(e.touches[0].clientX);
        const onEnd = () => {
            setIsDragging(false);
            dragRef.current = null;
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onEnd);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onEnd);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isDragging, onWidthChange]);

    const menuItems = [
        { path: '/dashboard', label: t('dashboard'), icon: FaTachometerAlt, key: 'dashboard' },
        { path: '/my-users', label: t('myPlayers'), icon: FaUsers, key: 'myPlayers' },
        { path: '/add-user', label: t('addPlayer'), icon: FaUserPlus, key: 'addPlayer' },
        { path: '/reports', label: t('report'), icon: FaChartLine, key: 'report' },
        { path: '/revenue', label: t('revenue'), icon: FaMoneyBillWave, key: 'revenue' },
        { path: '/payments', label: t('payments'), icon: FaCreditCard, key: 'payments' },
        { path: '/records', label: t('betHistory'), icon: FaFileInvoiceDollar, key: 'records' },
        { path: '/wallet', label: t('wallet'), icon: FaWallet, key: 'wallet' },
        { path: '/receipt', label: t('receipt'), icon: FaFileInvoiceDollar, key: 'receipt' },
        { path: '/shortcuts', label: t('shortcuts'), icon: FaKeyboard, key: 'shortcuts' },
        { path: '/settings', label: t('settings'), icon: FaCog, key: 'settings' },
    ];

    const isActive = (path) => {
        if (path === '/my-users' || path === '/receipt') {
            return location.pathname === path || location.pathname.startsWith(path + '/');
        }
        if (path === '/settings') return location.pathname === '/settings';
        return location.pathname === path;
    };

    const handleNav = (path) => {
        navigate(path);
        onClose?.();
    };

    return (
        <aside
            style={{ width: `${width}px` }}
            className={`fixed left-0 top-0 h-screen bg-[#181E27] border-r border-[#333D4D] flex flex-col z-50 overflow-y-auto shadow-lg
                transform transition-transform duration-200 ease-in-out
                lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            {/* Resize handle — right edge, desktop only */}
            {onWidthChange && (
                <div
                    onMouseDown={handleResizeMouseDown}
                    onTouchStart={handleResizeTouchStart}
                    className="hidden lg:flex absolute right-0 top-0 h-full w-2 cursor-col-resize z-[60] items-center justify-center group"
                    aria-label="Resize sidebar"
                >
                    <div className={`w-[3px] h-12 rounded-full transition-colors ${isDragging ? 'bg-primary-500' : 'bg-[#333D4D] group-hover:bg-primary-400'}`} />
                </div>
            )}
            {/* Logo + Close (mobile) */}
            <div className="p-4 sm:p-6 border-b border-[#333D4D] shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-primary-400">{t('bookiePanel')}</h2>
                    {user?.username && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{user.username}</p>
                    )}
                    <p className="text-sm font-semibold text-primary-400 mt-1">
                        {t('balance')}: ₹{Number(user?.balance ?? 0).toLocaleString('en-IN')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-lg hover:bg-[#252D3A] text-gray-400"
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

            {/* Translate page (Google) + Logout */}
            <div className="p-3 sm:p-4 border-t border-[#333D4D] shrink-0 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 shrink-0">Translate page:</span>
                    <GoogleTranslate />
                </div>
                <button
                    type="button"
                    onClick={onLogout}
                    title={t('logout')}
                    aria-label={t('logout')}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 border border-red-500/50 text-white font-semibold transition-all duration-200"
                >
                    <FaSignOutAlt className="w-5 h-5 shrink-0" />
                    <span>{t('logout')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

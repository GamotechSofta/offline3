import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar, { getStoredSidebarWidth, SIDEBAR_STORAGE_KEY } from './Sidebar';
import GoogleTranslate from './GoogleTranslate';
import { FaBars } from 'react-icons/fa';
import { API_BASE_URL, getBookieAuthHeaders } from '../utils/api';

const Layout = ({ children, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { bookie, logout, updateBookie } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(getStoredSidebarWidth);
    const handleSidebarWidthChange = useCallback((w) => {
        setSidebarWidth(w);
        try {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, String(w));
        } catch (e) { /* ignore */ }
    }, []);
    const lastProfileFetch = useRef(0);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Sync bookie profile periodically (every 2 minutes) or on route change
    useEffect(() => {
        const syncProfile = async () => {
            const now = Date.now();
            // Only fetch if more than 2 minutes since last fetch
            if (now - lastProfileFetch.current < 120000) return;
            lastProfileFetch.current = now;
            try {
                const response = await fetch(`${API_BASE_URL}/bookie/profile`, { headers: getBookieAuthHeaders() });
                const data = await response.json();
                if (data.success && data.data) {
                    updateBookie(data.data);
                }
            } catch (err) {
                // Silently fail - profile will be synced on next opportunity
            }
        };
        syncProfile();
    }, [location.pathname, updateBookie]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
            const target = e.target;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable ||
                (target.tagName === 'SELECT')
            ) {
                return;
            }

            // Alt + key shortcuts for navigation
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                switch (e.key.toLowerCase()) {
                    case 'd':
                        navigate('/dashboard');
                        break;
                    case 'p':
                        navigate('/my-users');
                        break;
                    case 'a':
                        navigate('/add-user');
                        break;
                    case 'b':
                        navigate('/bet-history');
                        break;
                    case 'm':
                        navigate('/markets');
                        break;
                    case 'g':
                        navigate('/games');
                        break;
                    case 'r':
                        navigate('/reports');
                        break;
                    case 'w':
                        navigate('/wallet');
                        break;
                    case 'h':
                        navigate('/help-desk');
                        break;
                    case '?':
                    case '/':
                        navigate('/shortcuts');
                        break;
                    default:
                        return; // Don't prevent default for other keys
                }
            }

            // Esc key to close sidebar or modals
            if (e.key === 'Escape' && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, sidebarOpen]);

    return (
        <div className="min-h-screen bg-[#1F2732] text-gray-200">
            {/* Mobile header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#181E27] border-b border-[#333D4D] flex items-center justify-between px-4 z-40 shadow-sm gap-2">
                <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-[#252D3A] transition-colors text-white shrink-0"
                    aria-label="Open menu"
                >
                    <FaBars className="w-6 h-6 text-primary-400" />
                </button>
                <h1 className="text-lg font-bold text-primary-400 truncate mx-1 min-w-0 flex-1 text-center">
                    {title || 'Bookie Panel'}
                </h1>
                <div className="shrink-0" title="Translate page">
                    <GoogleTranslate />
                </div>
            </header>

            {/* Sidebar */}
            <Sidebar
                user={bookie}
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                width={sidebarWidth}
                onWidthChange={handleSidebarWidthChange}
            />

            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 z-30"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden
                />
            )}

            {/* Main content — margin matches sidebar width on desktop */}
            <style>{`
                @media (min-width: 1024px) {
                    .bookie-main { margin-left: ${sidebarWidth}px; }
                }
            `}</style>
            <main className="pt-14 lg:pt-0 bookie-main min-h-screen overflow-x-hidden">
                <div
                    key={location.pathname}
                    className="p-3 sm:p-4 md:p-6 lg:p-8 lg:pl-10 min-w-0 max-w-full box-border animate-[fadeInLayout_0.2s_ease-out]"
                >
                    {children}
                </div>
            </main>
            <style>{`@keyframes fadeInLayout{from{opacity:0}to{opacity:1}}`}</style>
        </div>
    );
};

export default Layout;

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import GoogleTranslate from './GoogleTranslate';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';

const AdminLayout = ({ children, onLogout, title }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#1F2732] text-gray-200">
            {/* Mobile header - match bookie */}
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
                    {title || 'Super Admin'}
                </h1>
                <div className="shrink-0" title="Translate page">
                    <GoogleTranslate />
                </div>
                <button
                    type="button"
                    onClick={onLogout}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors shrink-0"
                    aria-label="Logout"
                >
                    <FaSignOutAlt className="w-5 h-5 text-red-400" />
                </button>
            </header>

            <Sidebar
                onLogout={onLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 z-30"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden
                />
            )}

            <main className="pt-14 lg:pt-0 lg:ml-72 min-h-screen overflow-x-hidden">
                <div
                    className="p-3 sm:p-4 md:p-6 lg:p-8 lg:pl-10 min-w-0 max-w-full box-border animate-[fadeInLayout_0.2s_ease-out]"
                >
                    {children}
                </div>
            </main>
            <style>{`@keyframes fadeInLayout{from{opacity:0}to{opacity:1}}`}</style>
        </div>
    );
};

export default AdminLayout;

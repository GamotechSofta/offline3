import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { FaBars } from 'react-icons/fa';

const AdminLayout = ({ children, onLogout, title }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Mobile header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 z-40">
                <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-700"
                    aria-label="Open menu"
                >
                    <FaBars className="w-6 h-6 text-yellow-500" />
                </button>
                <h1 className="text-lg font-bold text-yellow-500 truncate mx-2">{title || 'Admin'}</h1>
                <div className="w-10" />
            </header>

            {/* Sidebar */}
            <Sidebar
                onLogout={onLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-30"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden
                />
            )}

            {/* Main content */}
            <main className="pt-14 lg:pt-0 lg:ml-64 min-h-screen">
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;

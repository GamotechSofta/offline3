import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1';

const TABS = [
    { id: 'super_admins', label: 'All Super Admins', value: 'super_admins' },
    { id: 'all', label: 'All Users', value: 'all' },
    { id: 'all_bookies', label: 'All Bookies', value: 'all_bookies' },
    { id: 'bookie_users', label: 'All Bookies Users', value: 'bookie_users' },
    { id: 'super_admin_users', label: 'Super Admin Users', value: 'super_admin_users' },
];

const AllUsers = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('super_admins');
    const [expandedBookieId, setExpandedBookieId] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [superAdminUsersList, setSuperAdminUsersList] = useState([]);
    const [bookieUsersList, setBookieUsersList] = useState([]);
    const [allBookies, setAllBookies] = useState([]);
    const [superAdminsList, setSuperAdminsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const getAuthHeaders = () => {
        const admin = JSON.parse(localStorage.getItem('admin'));
        const password = sessionStorage.getItem('adminPassword') || '';
        return {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${admin.username}:${password}`)}`,
        };
    };

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [allRes, superAdminRes, bookieRes, bookiesRes, adminsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE_URL}/users?filter=super_admin`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE_URL}/users?filter=bookie`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE_URL}/admin/bookies`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE_URL}/admin/super-admins`, { headers: getAuthHeaders() }),
            ]);
            const allData = await allRes.json();
            const superAdminData = await superAdminRes.json();
            const bookieData = await bookieRes.json();
            const bookiesData = await bookiesRes.json();
            const adminsData = await adminsRes.json();
            if (allData.success) setAllUsers(allData.data || []);
            if (superAdminData.success) setSuperAdminUsersList(superAdminData.data || []);
            if (bookieData.success) setBookieUsersList(bookieData.data || []);
            if (bookiesData.success) setAllBookies(bookiesData.data || []);
            if (adminsData.success) setSuperAdminsList(adminsData.data || []);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const admin = localStorage.getItem('admin');
        if (!admin) {
            navigate('/');
            return;
        }
        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('admin');
        sessionStorage.removeItem('adminPassword');
        navigate('/');
    };

    const getCurrentList = () => {
        if (activeTab === 'all') return allUsers;
        if (activeTab === 'super_admin_users') return superAdminUsersList;
        if (activeTab === 'bookie_users') return bookieUsersList;
        if (activeTab === 'all_bookies') return allBookies;
        if (activeTab === 'super_admins') return superAdminsList;
        return [];
    };

    const list = getCurrentList();
    const isUserList = ['all', 'super_admin_users', 'bookie_users'].includes(activeTab);

    const getUsersForBookie = (bookieId) => {
        return bookieUsersList.filter(
            (u) => u.referredBy && (u.referredBy._id === bookieId || u.referredBy === bookieId)
        );
    };

    return (
        <AdminLayout onLogout={handleLogout} title="All Users">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">All Users</h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                            activeTab === tab.id
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto" />
                        <p className="mt-4 text-gray-400">Loading...</p>
                    </div>
                ) : list.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No {TABS.find(t => t.id === activeTab)?.label?.toLowerCase()} found.
                    </div>
                ) : activeTab === 'all_bookies' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px] text-sm sm:text-base">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase w-10"></th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">#</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase hidden sm:table-cell">Email</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase hidden md:table-cell">Phone</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase hidden md:table-cell">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {allBookies.map((bookie, index) => {
                                    const bookieUsers = getUsersForBookie(bookie._id);
                                    const isExpanded = expandedBookieId === bookie._id;
                                    return (
                                        <React.Fragment key={bookie._id}>
                                            <tr className="hover:bg-gray-700/50 bg-gray-800">
                                                <td className="px-2 sm:px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedBookieId(isExpanded ? null : bookie._id)}
                                                        className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-white"
                                                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                                    >
                                                        <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                                                    </button>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 text-gray-300">{index + 1}</td>
                                                <td className="px-4 sm:px-6 py-3 font-medium text-white">{bookie.username}</td>
                                                <td className="px-4 sm:px-6 py-3 text-gray-300 hidden sm:table-cell">{bookie.email || '—'}</td>
                                                <td className="px-4 sm:px-6 py-3 text-gray-300 hidden md:table-cell">{bookie.phone || '—'}</td>
                                                <td className="px-4 sm:px-6 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        bookie.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                                                    }`}>
                                                        {bookie.status || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 text-gray-300 hidden md:table-cell">
                                                    {bookie.createdAt ? new Date(bookie.createdAt).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    }) : '—'}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="7" className="px-0 py-0 bg-gray-900/50">
                                                        <div className="px-4 sm:px-8 py-4 border-l-4 border-yellow-500">
                                                            <p className="text-yellow-500 font-semibold mb-3 text-sm">
                                                                {bookie.username}&apos;s Users ({bookieUsers.length})
                                                            </p>
                                                            {bookieUsers.length === 0 ? (
                                                                <p className="text-gray-500 text-sm">No users yet.</p>
                                                            ) : (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full min-w-[400px] text-sm">
                                                                        <thead>
                                                                            <tr className="text-gray-400 text-xs">
                                                                                <th className="text-left py-2 pr-4">Username</th>
                                                                                <th className="text-left py-2 pr-4">Email</th>
                                                                                <th className="text-left py-2 pr-4">Wallet</th>
                                                                                <th className="text-left py-2 pr-4">Status</th>
                                                                                <th className="text-left py-2 hidden sm:table-cell">Created</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {bookieUsers.map((u) => (
                                                                                <tr key={u._id} className="border-t border-gray-700">
                                                                                    <td className="py-2 pr-4 font-medium text-white">{u.username}</td>
                                                                                    <td className="py-2 pr-4 text-gray-300">{u.email || '—'}</td>
                                                                                    <td className="py-2 pr-4">
                                                                                        <span className="font-mono font-medium text-green-400">
                                                                                            ₹{Number(u.walletBalance ?? 0).toLocaleString('en-IN')}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="py-2 pr-4">
                                                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                                            u.isOnline
                                                                                                ? 'bg-green-900/50 text-green-400'
                                                                                                : 'bg-gray-700 text-gray-400'
                                                                                        }`}>
                                                                                            <span className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                                                                                            {u.isOnline ? 'Online' : 'Offline'}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="py-2 text-gray-400 hidden sm:table-cell">
                                                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                                                                                            day: '2-digit',
                                                                                            month: 'short',
                                                                                            year: 'numeric',
                                                                                        }) : '—'}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px] text-sm sm:text-base">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">#</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase hidden sm:table-cell">Email</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase hidden md:table-cell">Phone</th>
                                    {(activeTab === 'super_admins') && (
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                                    )}
                                    {isUserList && (
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                                            {activeTab === 'bookie_users' ? 'Bookie' : activeTab === 'all' ? 'Role' : 'Source'}
                                        </th>
                                    )}
                                    {isUserList && (
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Wallet</th>
                                    )}
                                    {isUserList && (
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                                    )}
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase hidden md:table-cell">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {list.map((item, index) => (
                                    <tr key={item._id} className="hover:bg-gray-700/50">
                                        <td className="px-4 sm:px-6 py-3 text-gray-300">{index + 1}</td>
                                        <td className="px-4 sm:px-6 py-3 font-medium text-white">{item.username}</td>
                                        <td className="px-4 sm:px-6 py-3 text-gray-300 hidden sm:table-cell">{item.email || '—'}</td>
                                        <td className="px-4 sm:px-6 py-3 text-gray-300 hidden md:table-cell">{item.phone || '—'}</td>
                                        {(activeTab === 'super_admins') && (
                                            <td className="px-4 sm:px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    item.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                                                }`}>
                                                    {item.status || '—'}
                                                </span>
                                            </td>
                                        )}
                                        {isUserList && (
                                            <td className="px-4 sm:px-6 py-3">
                                                {activeTab === 'bookie_users' ? (
                                                    <span className="text-gray-300 text-sm">{item.referredBy?.username || '—'}</span>
                                                ) : activeTab === 'all' ? (
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-200 capitalize">
                                                        {item.role || 'user'}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-200 capitalize">
                                                        {item.source || (item.referredBy ? 'bookie' : 'super_admin')}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        {isUserList && (
                                            <td className="px-4 sm:px-6 py-3">
                                                <span className="font-mono font-medium text-green-400">
                                                    ₹{Number(item.walletBalance ?? 0).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                        )}
                                        {isUserList && (
                                            <td className="px-4 sm:px-6 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.isOnline
                                                        ? 'bg-green-900/50 text-green-400 border border-green-700'
                                                        : 'bg-gray-700 text-gray-400 border border-gray-600'
                                                }`}>
                                                    <span className={`w-2 h-2 rounded-full ${item.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                                                    {item.isOnline ? 'Online' : 'Offline'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-4 sm:px-6 py-3 text-gray-300 hidden md:table-cell">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            }) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && list.length > 0 && (
                <p className="mt-4 text-gray-400 text-sm">
                    Showing {list.length} {TABS.find(t => t.id === activeTab)?.label?.toLowerCase()}
                </p>
            )}
        </AdminLayout>
    );
};

export default AllUsers;

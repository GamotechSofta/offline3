import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';

const WithdrawFundHistory = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        if (!user.id) return;
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/payments/my-withdrawals?userId=${user.id}`);
            const data = await res.json();
            if (data.success) {
                setWithdrawals(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch withdrawals:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-primary-500/20 text-primary-400 border border-primary-400/50',
            approved: 'bg-green-500/20 text-green-400 border border-green-400/50',
            rejected: 'bg-red-500/20 text-red-400 border border-red-400/50',
            completed: 'bg-blue-500/20 text-blue-400 border border-blue-400/50',
        };
        return styles[status] || 'bg-[#252D3A] text-gray-400 border border-[#333D4D]';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredWithdrawals = filter === 'all' 
        ? withdrawals 
        : withdrawals.filter(w => w.status === filter);

    const stats = {
        total: withdrawals.length,
        pending: withdrawals.filter(w => w.status === 'pending').length,
        approved: withdrawals.filter(w => w.status === 'approved').length,
        rejected: withdrawals.filter(w => w.status === 'rejected').length,
    };

    const totalWithdrawn = withdrawals
        .filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + w.amount, 0);

    return (
        <div className="space-y-6">
            {/* Total Withdrawn */}
            <div className="bg-[#252D3A] rounded-2xl p-5 border-2 border-[#333D4D]">
                <p className="text-gray-400 text-sm">Total Withdrawn</p>
                <p className="text-3xl font-bold text-primary-400">₹{totalWithdrawn.toLocaleString()}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                <div 
                    onClick={() => setFilter('all')}
                    className={`p-3 rounded-xl text-center cursor-pointer transition-colors ${
                        filter === 'all' ? 'bg-primary-500 text-white border border-primary-500' : 'bg-[#252D3A] text-white border border-[#333D4D] hover:border-primary-400'
                    }`}
                >
                    <p className="text-lg font-bold">{stats.total}</p>
                    <p className="text-xs">Total</p>
                </div>
                <div 
                    onClick={() => setFilter('pending')}
                    className={`p-3 rounded-xl text-center cursor-pointer transition-colors ${
                        filter === 'pending' ? 'bg-primary-500/20 text-primary-400 border border-primary-400/50' : 'bg-[#252D3A] text-white border border-[#333D4D] hover:border-primary-400'
                    }`}
                >
                    <p className="text-lg font-bold text-primary-600">{stats.pending}</p>
                    <p className="text-xs text-gray-300">Pending</p>
                </div>
                <div 
                    onClick={() => setFilter('approved')}
                    className={`p-3 rounded-xl text-center cursor-pointer transition-colors ${
                        filter === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-400/50' : 'bg-[#252D3A] text-white border border-[#333D4D] hover:border-primary-400'
                    }`}
                >
                    <p className="text-lg font-bold text-green-600">{stats.approved}</p>
                    <p className="text-xs text-gray-300">Approved</p>
                </div>
                <div 
                    onClick={() => setFilter('rejected')}
                    className={`p-3 rounded-xl text-center cursor-pointer transition-colors ${
                        filter === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-400/50' : 'bg-[#252D3A] text-white border border-[#333D4D] hover:border-primary-400'
                    }`}
                >
                    <p className="text-lg font-bold text-red-600">{stats.rejected}</p>
                    <p className="text-xs text-gray-300">Rejected</p>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto"></div>
                    <p className="text-gray-400 mt-3">Loading history...</p>
                </div>
            ) : filteredWithdrawals.length === 0 ? (
                <div className="text-center py-8 bg-[#252D3A] rounded-xl border border-[#333D4D]">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-300">No withdrawal history found</p>
                    {filter !== 'all' && (
                        <button
                            onClick={() => setFilter('all')}
                            className="mt-2 text-primary-400 text-sm hover:text-primary-300"
                        >
                            View all withdrawals
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredWithdrawals.map((withdrawal) => (
                        <div
                            key={withdrawal._id}
                            className="bg-[#252D3A] rounded-xl p-4 border border-[#333D4D] shadow-sm hover:border-primary-400/50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        withdrawal.status === 'approved' ? 'bg-green-500/20' : 
                                        withdrawal.status === 'rejected' ? 'bg-red-500/20' : 'bg-primary-500/20'
                                    }`}>
                                        {withdrawal.status === 'approved' ? (
                                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : withdrawal.status === 'rejected' ? (
                                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">₹{withdrawal.amount.toLocaleString()}</p>
                                        <p className="text-gray-400 text-xs">{formatDate(withdrawal.createdAt)}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(withdrawal.status)}`}>
                                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                                </span>
                            </div>

                            {/* Bank Details */}
                            {withdrawal.bankDetailId && (
                                <div className="mt-3 pt-3 border-t border-[#333D4D]">
                                    <p className="text-gray-300 text-sm">
                                        <span className="text-gray-400">To:</span> {withdrawal.bankDetailId.accountHolderName}
                                    </p>
                                    {withdrawal.bankDetailId.bankName && (
                                        <p className="text-gray-400 text-xs">
                                            {withdrawal.bankDetailId.bankName} - ****{withdrawal.bankDetailId.accountNumber?.slice(-4)}
                                        </p>
                                    )}
                                    {withdrawal.bankDetailId.upiId && (
                                        <p className="text-gray-400 text-xs">
                                            UPI: {withdrawal.bankDetailId.upiId}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Admin Remarks */}
                            {(withdrawal.adminRemarks || withdrawal.processedAt) && (
                                <div className="mt-2 pt-2 border-t border-[#333D4D] space-y-1">
                                    {withdrawal.adminRemarks && (
                                        <p className="text-gray-300 text-sm">
                                            <span className="text-gray-400">Admin:</span> {withdrawal.adminRemarks}
                                        </p>
                                    )}
                                    {withdrawal.processedAt && (
                                        <p className="text-gray-400 text-xs">
                                            Processed: {formatDate(withdrawal.processedAt)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WithdrawFundHistory;

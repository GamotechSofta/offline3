import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, Plus, Eye, Pencil, Trash2, X } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1';

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 bg-white rounded-t-xl">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, onClose, title, message, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Markets() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [openDetailOpen, setOpenDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);

  const [form, setForm] = useState({
    marketName: '',
    startingTime: '',
    closingTime: '',
    openingNumber: '',
    closingNumber: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMarkets = useCallback(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API_BASE}/get-markets`)
      .then((res) => {
        if (res.data?.success) setMarkets(res.data.data || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load markets');
        setMarkets([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const filtered = markets.filter(
    (m) =>
      !search ||
      m.marketName?.toLowerCase().includes(search.toLowerCase()) ||
      m.displayResult?.includes(search)
  );

  const resetForm = () => {
    setForm({
      marketName: '',
      startingTime: '',
      closingTime: '',
      openingNumber: '',
      closingNumber: '',
    });
    setSubmitError('');
    setSelectedMarket(null);
  };

  const openAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const openEdit = (market) => {
    setSelectedMarket(market);
    setForm({
      marketName: market.marketName ?? '',
      startingTime: market.startingTime ?? '',
      closingTime: market.closingTime ?? '',
      openingNumber: market.openingNumber ?? '',
      closingNumber: market.closingNumber ?? '',
    });
    setSubmitError('');
    setEditOpen(true);
  };

  const openDetail = (market) => {
    setSelectedMarket(market);
    setOpenDetailOpen(true);
  };

  const openDelete = (market) => {
    setSelectedMarket(market);
    setDeleteOpen(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!form.marketName?.trim() || !form.startingTime?.trim() || !form.closingTime?.trim()) {
      setSubmitError('Market name, starting time and closing time are required.');
      return;
    }
    setSubmitLoading(true);
    try {
      await axios.post(`${API_BASE}/create-market`, {
        marketName: form.marketName.trim(),
        startingTime: form.startingTime.trim(),
        closingTime: form.closingTime.trim(),
      });
      setAddOpen(false);
      resetForm();
      fetchMarkets();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to create market');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedMarket?._id) return;
    setSubmitError('');
    if (!form.marketName?.trim() || !form.startingTime?.trim() || !form.closingTime?.trim()) {
      setSubmitError('Market name, starting time and closing time are required.');
      return;
    }
    setSubmitLoading(true);
    try {
      await axios.patch(`${API_BASE}/update-market/${selectedMarket._id}`, {
        marketName: form.marketName.trim(),
        startingTime: form.startingTime.trim(),
        closingTime: form.closingTime.trim(),
      });
      if (form.openingNumber?.trim() && /^\d{3}$/.test(form.openingNumber.trim())) {
        await axios.patch(`${API_BASE}/set-opening-number/${selectedMarket._id}`, {
          openingNumber: form.openingNumber.trim(),
        });
      }
      if (form.closingNumber?.trim() && /^\d{3}$/.test(form.closingNumber.trim())) {
        await axios.patch(`${API_BASE}/set-closing-number/${selectedMarket._id}`, {
          closingNumber: form.closingNumber.trim(),
        });
      }
      setEditOpen(false);
      resetForm();
      fetchMarkets();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to update market');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMarket?._id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_BASE}/delete-market/${selectedMarket._id}`);
      setDeleteOpen(false);
      setSelectedMarket(null);
      fetchMarkets();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to delete market');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Market list</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              New Market
            </button>
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                title="Filter"
              >
                <Filter className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading markets...
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              type="button"
              onClick={fetchMarkets}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="mb-2">No markets found.</p>
            <button
              type="button"
              onClick={openAdd}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Add your first market
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Market name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Result</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Opening</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Closing</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Timeline</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((market) => (
                  <tr
                    key={market._id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">{market.marketName}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {market.displayResult ?? '***-**-***'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{market.openingNumber ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{market.closingNumber ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {market.startingTime} – {market.closingTime}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          market.result
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {market.result ? 'Closed' : 'Open'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openDetail(market)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          title="Open / View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(market)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(market)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Market modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); resetForm(); }} title="New Market">
        <form onSubmit={handleAdd} className="space-y-4">
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{submitError}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Market name</label>
            <input
              type="text"
              value={form.marketName}
              onChange={(e) => setForm((f) => ({ ...f, marketName: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. Morning Market"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Starting time</label>
            <input
              type="text"
              value={form.startingTime}
              onChange={(e) => setForm((f) => ({ ...f, startingTime: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. 09:00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Closing time</label>
            <input
              type="text"
              value={form.closingTime}
              onChange={(e) => setForm((f) => ({ ...f, closingTime: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. 18:00"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setAddOpen(false); resetForm(); }}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitLoading ? 'Creating...' : 'Create Market'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Market modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); resetForm(); }} title="Edit Market">
        <form onSubmit={handleEdit} className="space-y-4">
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{submitError}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Market name</label>
            <input
              type="text"
              value={form.marketName}
              onChange={(e) => setForm((f) => ({ ...f, marketName: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Starting time</label>
            <input
              type="text"
              value={form.startingTime}
              onChange={(e) => setForm((f) => ({ ...f, startingTime: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Closing time</label>
            <input
              type="text"
              value={form.closingTime}
              onChange={(e) => setForm((f) => ({ ...f, closingTime: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Opening number (3 digits, optional)
            </label>
            <input
              type="text"
              maxLength={3}
              value={form.openingNumber}
              onChange={(e) => setForm((f) => ({ ...f, openingNumber: e.target.value.replace(/\D/g, '') }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              placeholder="e.g. 123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Closing number (3 digits, optional)
            </label>
            <input
              type="text"
              maxLength={3}
              value={form.closingNumber}
              onChange={(e) => setForm((f) => ({ ...f, closingNumber: e.target.value.replace(/\D/g, '') }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              placeholder="e.g. 456"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setEditOpen(false); resetForm(); }}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Open / View Market detail modal */}
      <Modal
        open={openDetailOpen}
        onClose={() => { setOpenDetailOpen(false); setSelectedMarket(null); }}
        title={selectedMarket?.marketName ? `${selectedMarket.marketName} – Details` : 'Market details'}
      >
        {selectedMarket && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Result</p>
              <p className="text-xl font-mono font-semibold text-slate-900 mt-1">
                {selectedMarket.displayResult ?? '***-**-***'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Opening</p>
                <p className="text-slate-900 mt-1">{selectedMarket.openingNumber ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Closing</p>
                <p className="text-slate-900 mt-1">{selectedMarket.closingNumber ?? '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Timeline</p>
              <p className="text-slate-900 mt-1">
                {selectedMarket.startingTime} – {selectedMarket.closingTime}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</p>
              <span
                className={`inline-flex mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                  selectedMarket.result
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {selectedMarket.result ? 'Closed' : 'Open'}
              </span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpenDetailOpen(false);
                  openEdit(selectedMarket);
                }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Edit this market →
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedMarket(null); }}
        title="Delete market"
        message={`Are you sure you want to delete "${selectedMarket?.marketName}"? This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const Support = () => {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState('Support Request');
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    const onUserChange = () => {
      const r = localStorage.getItem('user');
      setUser(r ? JSON.parse(r) : null);
    };
    window.addEventListener('userLogin', onUserChange);
    window.addEventListener('userLogout', onUserChange);
    return () => {
      window.removeEventListener('userLogin', onUserChange);
      window.removeEventListener('userLogout', onUserChange);
    };
  }, []);

  const userId = user?._id || user?.id;

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length !== files.length) {
      setMessage({ type: 'error', text: 'Only image files (e.g. PNG, JPG) are allowed.' });
    }
    setScreenshots(list.length ? list : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setMessage({ type: 'error', text: 'Please login to submit a support request.' });
      return;
    }
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Please describe your problem.' });
      return;
    }
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('subject', subject.trim() || 'Support Request');
      formData.append('description', description.trim());
      screenshots.forEach((file) => formData.append('screenshots', file));

      const response = await fetch(`${API_BASE_URL}/help-desk/tickets`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Your request has been submitted. We will get back to you soon.' });
        setDescription('');
        setScreenshots([]);
        const input = document.getElementById('support-screenshots');
        if (input) input.value = '';
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit. Please try again.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800">Support</h1>
      <p className="mt-2 text-gray-600">Customer support and help. Describe your problem and attach screenshots if needed.</p>

      {!userId && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          Please login to submit a support request.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="support-subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            id="support-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Payment issue, Game error"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            disabled={!userId}
          />
        </div>

        <div>
          <label htmlFor="support-description" className="block text-sm font-medium text-gray-700 mb-1">
            Describe your problem <span className="text-red-500">*</span>
          </label>
          <textarea
            id="support-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain your issue in detail..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white resize-y"
            disabled={!userId}
          />
        </div>

        <div>
          <label htmlFor="support-screenshots" className="block text-sm font-medium text-gray-700 mb-1">
            Screenshots (optional, max 5 images)
          </label>
          <input
            id="support-screenshots"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            multiple
            onChange={handleFileChange}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-800 file:font-medium"
            disabled={!userId}
          />
          {screenshots.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">{screenshots.length} file(s) selected</p>
          )}
        </div>

        {message.text && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={!userId || loading}
          className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default Support;

/**
 * Shared auth for Super Admin panel.
 * Prefers JWT (Bearer) for fast API auth; falls back to Basic if no token (e.g. old session).
 */
export function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    }
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const password = sessionStorage.getItem('adminPassword') || '';
    if (admin?.username && password) {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${admin.username}:${password}`)}`,
        };
    }
    return { 'Content-Type': 'application/json' };
}

export function clearAdminSession() {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminPassword');
}

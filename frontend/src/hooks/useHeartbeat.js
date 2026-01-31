import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export const useHeartbeat = () => {
  const intervalRef = useRef(null);

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;
        const user = JSON.parse(userData);
        const userId = user?.id || user?._id;
        if (!userId) return;
        await fetch(`${API_BASE_URL}/users/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch {
        // Silently ignore
      }
    };

    const userData = localStorage.getItem('user');
    if (!userData) return;

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    const handleLogout = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    window.addEventListener('userLogout', handleLogout);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('userLogout', handleLogout);
    };
  }, []);
};

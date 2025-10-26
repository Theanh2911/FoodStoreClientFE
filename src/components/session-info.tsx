'use client';

import { useEffect, useState } from 'react';
import { getTableSession, clearTableSession, getSessionTimeRemaining, type TableSession } from '@/lib/session';

export function SessionInfo() {
  const [session, setSession] = useState<TableSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    // Load session on mount
    const currentSession = getTableSession();
    setSession(currentSession);

    if (currentSession) {
      // Update time remaining every second
      const interval = setInterval(() => {
        const remaining = getSessionTimeRemaining();
        setTimeRemaining(remaining);

        // If session expired, clear it
        if (remaining === 0) {
          setSession(null);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClearSession = () => {
    clearTableSession();
    setSession(null);
  };

  if (!session) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      minWidth: '200px',
      zIndex: 1000,
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
        🪑 Bàn số: {session.tableNumber}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
        Session: {session.sessionId.substring(0, 8)}...
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
        ⏱️ Còn lại: {formatTime(timeRemaining)}
      </div>
      <button
        onClick={handleClearSession}
        style={{
          background: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Kết thúc phiên
      </button>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface SessionResponse {
  sessionId: string;
  tableNumber: number;
}

export default function QRSessionPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const createSession = async () => {
      try {
        const tableNumber = params.tableNumber as string;
        
        if (!tableNumber || isNaN(Number(tableNumber))) {
          setStatus('error');
          setErrorMessage('Số bàn không hợp lệ');
          return;
        }

        // Call POST API to create session
        const response = await fetch(`http://192.168.1.9:8080/api/session/${tableNumber}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data: SessionResponse = await response.json();

        // Store session data with 30-minute expiration
        const sessionData = {
          sessionId: data.sessionId,
          tableNumber: data.tableNumber,
          expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
        };

        // Save to sessionStorage
        sessionStorage.setItem('tableSession', JSON.stringify(sessionData));

        setStatus('success');

        // Redirect to home page after a brief delay
        setTimeout(() => {
          router.push('/');
        }, 1000);

      } catch (error) {
        console.error('Error creating session:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tạo phiên');
      }
    };

    createSession();
  }, [params.tableNumber, router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 1s linear infinite',
            }} />
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Đang xử lý...</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#4CAF50',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
            }}>
              ✓
            </div>
            <h2 style={{ color: '#4CAF50', marginBottom: '10px' }}>Thành công!</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>Đang chuyển hướng đến trang chủ...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#f44336',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              color: 'white',
            }}>
              ✕
            </div>
            <h2 style={{ color: '#f44336', marginBottom: '10px' }}>Lỗi</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background 0.3s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#5568d3'}
              onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}
            >
              Về trang chủ
            </button>
          </>
        )}
      </div>
    </div>
  );
}


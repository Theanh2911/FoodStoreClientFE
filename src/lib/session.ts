export interface TableSession {
  sessionId: string;
  tableNumber: number;
  expiresAt: number;
}

/**
 * Get the current table session from sessionStorage
 * Returns null if session doesn't exist or has expired
 */
export function getTableSession(): TableSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const sessionData = sessionStorage.getItem('tableSession');
    if (!sessionData) {
      return null;
    }

    const session: TableSession = JSON.parse(sessionData);

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      clearTableSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error reading table session:', error);
    return null;
  }
}

/**
 * Save a table session to sessionStorage
 */
export function setTableSession(sessionId: string, tableNumber: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  const sessionData: TableSession = {
    sessionId,
    tableNumber,
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
  };

  sessionStorage.setItem('tableSession', JSON.stringify(sessionData));
}

/**
 * Clear the table session from sessionStorage
 */
export function clearTableSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.removeItem('tableSession');
}

/**
 * Check if a valid table session exists
 */
export function hasValidSession(): boolean {
  return getTableSession() !== null;
}

/**
 * Get the remaining time in milliseconds before session expires
 * Returns 0 if session doesn't exist or has expired
 */
export function getSessionTimeRemaining(): number {
  const session = getTableSession();
  if (!session) {
    return 0;
  }

  const remaining = session.expiresAt - Date.now();
  return Math.max(0, remaining);
}



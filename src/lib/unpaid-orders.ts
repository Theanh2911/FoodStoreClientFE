const KEY_PREFIX = "unpaidOrderIds:";

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getKey(sessionId: string) {
  return `${KEY_PREFIX}${sessionId}`;
}

// Get list of unpaid order IDs from sessionStorage
export function getCachedUnpaidOrderIds(sessionId: string): number[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(getKey(sessionId));
  if (!raw) return [];
  const parsed = safeJsonParse<number[]>(raw);
  return Array.isArray(parsed) ? parsed : [];
}

// Add order ID to the list (only store ID, not entire order)
export function addCachedUnpaidOrderId(sessionId: string, orderId: number): void {
  if (typeof window === "undefined") return;
  const existing = getCachedUnpaidOrderIds(sessionId);
  
  // Add to the beginning if not already present
  if (!existing.includes(orderId)) {
    const next = [orderId, ...existing];
    sessionStorage.setItem(getKey(sessionId), JSON.stringify(next));
  }
}

// Remove order ID from the list
export function removeCachedUnpaidOrderId(sessionId: string, orderId: number): void {
  if (typeof window === "undefined") return;
  const existing = getCachedUnpaidOrderIds(sessionId);
  const next = existing.filter((id) => id !== orderId);
  sessionStorage.setItem(getKey(sessionId), JSON.stringify(next));
}




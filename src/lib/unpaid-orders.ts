import type { UserOrder } from "@/lib/api";

const KEY_PREFIX = "unpaidOrders:";

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

export function getCachedUnpaidOrders(sessionId: string): UserOrder[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(getKey(sessionId));
  if (!raw) return [];
  const parsed = safeJsonParse<UserOrder[]>(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function upsertCachedUnpaidOrder(sessionId: string, order: UserOrder): void {
  if (typeof window === "undefined") return;
  const existing = getCachedUnpaidOrders(sessionId);
  const next = [
    order,
    ...existing.filter((o) => o.orderId !== order.orderId),
  ];
  sessionStorage.setItem(getKey(sessionId), JSON.stringify(next));
}

export function removeCachedUnpaidOrder(sessionId: string, orderId: number): void {
  if (typeof window === "undefined") return;
  const existing = getCachedUnpaidOrders(sessionId);
  const next = existing.filter((o) => o.orderId !== orderId);
  sessionStorage.setItem(getKey(sessionId), JSON.stringify(next));
}



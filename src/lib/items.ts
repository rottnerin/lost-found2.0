import type { Item } from '../types/database';

export const PUBLIC_ITEM_RETENTION_DAYS = 60;
const RETENTION_WINDOW_MS = PUBLIC_ITEM_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function isExpiredItem(item: Pick<Item, 'created_at'>) {
  return Date.now() - new Date(item.created_at).getTime() > RETENTION_WINDOW_MS;
}

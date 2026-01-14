import { AsyncLocalStorage } from 'async_hooks';

export const storage = new AsyncLocalStorage<Map<string, string>>();

// Кеширование данных с TTL (Time To Live)
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private prefix = 'mmaphoto_cache_';

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (e) {
      console.warn('Failed to cache data:', e);
    }
  }

  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.prefix + key);
      if (!cached) return null;

      const item: CacheItem<T> = JSON.parse(cached);
      const age = Date.now() - item.timestamp;

      if (age > item.ttl) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (e) {
      console.warn('Failed to read cache:', e);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (e) {
      console.warn('Failed to remove cache:', e);
    }
  }

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  }

  // Удаляет просроченные записи
  cleanup(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => {
          const cached = localStorage.getItem(key);
          if (!cached) return;

          try {
            const item = JSON.parse(cached);
            const age = Date.now() - item.timestamp;
            if (age > item.ttl) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Удаляем невалидные записи
            localStorage.removeItem(key);
          }
        });
    } catch (e) {
      console.warn('Failed to cleanup cache:', e);
    }
  }
}

export const cache = new CacheManager();

// Автоматическая очистка каждые 5 минут
if (typeof window !== 'undefined') {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}

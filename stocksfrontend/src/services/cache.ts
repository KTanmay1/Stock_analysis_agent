/**
 * Cache service for storing API response data
 * Uses a combination of memory cache and localStorage (when in browser)
 */

type CacheData<T> = {
  data: T;
  timestamp: number;
  expiry: number; // Expiry time in milliseconds
};

// In-memory cache store
const memoryCache: Record<string, CacheData<any>> = {};

// Default cache durations in milliseconds
const CACHE_DURATIONS = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
};

// Function to determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Cache keys for different endpoints
export const CACHE_KEYS = {
  TRENDING: 'trending-stocks',
  MARKET_MOVERS: 'market-movers',
  MARKET_INDICES: 'market-indices',
  NEWS: 'news',
  STOCK_ANALYSIS: (symbol: string) => `stock-analysis-${symbol}`,
  STOCK_HISTORY: (symbol: string, period: string) => `stock-history-${symbol}-${period}`,
  ALL_STOCKS: 'all-stocks',
};

// Basic structure validators to ensure cache data is usable
const dataValidators: Record<string, (data: any) => boolean> = {
  [CACHE_KEYS.TRENDING]: (data) => {
    // Check if data has expected structure
    return data && (
      (Array.isArray(data.trending_stocks) && data.trending_stocks.length > 0) ||
      (Array.isArray(data.top_movers) && data.top_movers.length > 0) ||
      (Array.isArray(data.most_active) && data.most_active.length > 0)
    );
  },
  [CACHE_KEYS.MARKET_MOVERS]: (data) => {
    // Check if data has expected structure
    return data && (
      (Array.isArray(data.gainers) && data.gainers.length > 0) ||
      (Array.isArray(data.losers) && data.losers.length > 0)
    );
  },
  [CACHE_KEYS.MARKET_INDICES]: (data) => {
    // Check if data has expected structure
    return data && Array.isArray(data.indices) && data.indices.length > 0;
  },
  [CACHE_KEYS.NEWS]: (data) => {
    // Check if data has either news or articles array
    return data && (
      (Array.isArray(data.news) && data.news.length > 0) ||
      (Array.isArray(data.articles) && data.articles.length > 0)
    );
  },
  // Default validator passes for any non-null data
  default: (data) => data !== null && data !== undefined
};

const cacheService = {
  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, duration: number = CACHE_DURATIONS.MEDIUM): void {
    // Don't cache null or undefined data
    if (data === null || data === undefined) {
      console.warn('Attempted to cache null or undefined data for key:', key);
      return;
    }

    const cacheObject: CacheData<T> = {
      data,
      timestamp: Date.now(),
      expiry: duration,
    };

    // Store in memory cache
    memoryCache[key] = cacheObject;

    // Also store in localStorage if in browser
    if (isBrowser) {
      try {
        localStorage.setItem(key, JSON.stringify(cacheObject));
      } catch (error) {
        console.warn('Error storing data in localStorage:', error);
      }
    }
  },

  /**
   * Get data from cache with validation
   * Returns null if data is not in cache, has expired, or fails validation
   */
  get<T>(key: string): T | null {
    // Get the appropriate validator for this key
    const getValidator = () => {
      // Use specific validator if exists, otherwise use default
      if (key.includes('-')) {
        // Handle dynamic keys like "stock-analysis-AAPL"
        const baseKey = Object.keys(CACHE_KEYS).find(cacheKey => 
          key.startsWith(CACHE_KEYS[cacheKey as keyof typeof CACHE_KEYS] as string)
        );
        return baseKey ? dataValidators[CACHE_KEYS[baseKey as keyof typeof CACHE_KEYS] as string] || dataValidators.default : dataValidators.default;
      }
      return dataValidators[key] || dataValidators.default;
    };
    
    const validator = getValidator();

    // First try memory cache
    const memoryCacheItem = memoryCache[key] as CacheData<T> | undefined;
    
    if (memoryCacheItem && !this.isExpired(memoryCacheItem)) {
      // Validate data structure
      if (validator(memoryCacheItem.data)) {
        return memoryCacheItem.data;
      } else {
        console.warn(`Cached data for ${key} failed validation, removing from cache`);
        delete memoryCache[key];
        return null;
      }
    }

    // If not in memory cache or expired, try localStorage
    if (isBrowser) {
      try {
        const storedItem = localStorage.getItem(key);
        if (storedItem) {
          const parsedItem = JSON.parse(storedItem) as CacheData<T>;
          
          // Check if data is still valid
          if (!this.isExpired(parsedItem)) {
            // Validate data structure
            if (validator(parsedItem.data)) {
              // Refresh memory cache with this data
              memoryCache[key] = parsedItem;
              return parsedItem.data;
            } else {
              console.warn(`Cached data in localStorage for ${key} failed validation, removing`);
              localStorage.removeItem(key);
              return null;
            }
          } else {
            // If expired, remove from localStorage
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Error retrieving data from localStorage:', error);
        // Try to clean up potentially corrupted data
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }

    return null;
  },

  /**
   * Check if cached data has expired
   */
  isExpired<T>(cacheItem: CacheData<T>): boolean {
    return Date.now() > cacheItem.timestamp + cacheItem.expiry;
  },

  /**
   * Remove item from cache
   */
  remove(key: string): void {
    // Remove from memory cache
    delete memoryCache[key];

    // Remove from localStorage if in browser
    if (isBrowser) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Error removing data from localStorage:', error);
      }
    }
  },

  /**
   * Clear all cached data
   */
  clear(): void {
    // Clear memory cache
    Object.keys(memoryCache).forEach(key => {
      delete memoryCache[key];
    });

    // Clear localStorage if in browser
    if (isBrowser) {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('Error clearing localStorage:', error);
      }
    }
  },

  /**
   * Get all cache durations
   */
  getDurations() {
    return CACHE_DURATIONS;
  },

  /**
   * Force clear problematic cache entries that might be causing errors
   */
  clearProblematicCaches() {
    const keysToCheck = [
      CACHE_KEYS.TRENDING,
      CACHE_KEYS.MARKET_MOVERS,
      CACHE_KEYS.MARKET_INDICES,
      CACHE_KEYS.NEWS
    ];

    keysToCheck.forEach(key => {
      this.remove(key);
    });

    // Also clear any dynamic keys for news with specific symbols
    if (isBrowser) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('news-')) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Error clearing news cache items:', error);
      }
    }
  }
};

export default cacheService; 
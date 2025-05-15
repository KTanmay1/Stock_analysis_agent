import axios, { AxiosError } from 'axios';
import { StockAnalysis, TrendingStocksData, MarketMovers, MarketIndices, AllStocks, NewsData, StockHistory } from '../types/stock';
import cacheService, { CACHE_KEYS } from './cache';

// Get the API URL based on environment
const isBrowser = typeof window !== 'undefined';

// Define fallback API endpoints to try in order
const API_ENDPOINTS = isBrowser
  ? [
      '/api', // Next.js API route (preferred in browser)
      'http://localhost:8000', // Direct to localhost backend
    ]
  : [
      process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://backend:8000', // Docker service name
      'http://localhost:8000', // Direct to localhost backend
    ];

console.log('Available API endpoints:', API_ENDPOINTS, 'isBrowser:', isBrowser);

// Use a function to create the axios instance with the primary endpoint
const createApiInstance = () => {
  const baseURL = API_ENDPOINTS[0]; // Start with the first endpoint
  
  console.log('Creating API instance with baseURL:', baseURL);
  
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds timeout (increased)
  });
};

const api = createApiInstance();

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    console.error('Response error:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Request:', error.request);
    }
    return Promise.reject(error);
  }
);

// Helper function to format error messages
const formatErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
      return 'Unable to connect to the API server. Please check if the backend is running.';
    }
    
    if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
      return 'Connection timed out. The server might be overloaded or unreachable.';
    }
    
    if (axiosError.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (axiosError.response?.status === 500) {
      return 'An error occurred on the server. Please try again later.';
    }
    
    return axiosError.message || 'An unknown error occurred';
  }
  
  return error instanceof Error ? error.message : 'An unknown error occurred';
};

// Helper function to try all endpoints for a request with caching
const tryAllEndpoints = async <T>(
  path: string, 
  method: 'get' | 'post' = 'get',
  data?: any,
  cacheKey?: string,
  cacheDuration?: number
): Promise<T> => {
  // Check cache first if a cache key is provided
  if (cacheKey) {
    const cachedData = cacheService.get<T>(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${cacheKey}`);
      return cachedData;
    }
  }

  // Try each endpoint in sequence until one works
  let lastError: unknown;
  let attempts = 0;
  const maxAttempts = API_ENDPOINTS.length * 2; // Try each endpoint twice
  
  while (attempts < maxAttempts) {
    // Choose endpoint (rotate through available endpoints)
    const baseURL = API_ENDPOINTS[attempts % API_ENDPOINTS.length];
    attempts++;
    
    try {
      console.log(`Attempt ${attempts}/${maxAttempts}: Trying endpoint: ${baseURL}${path}`);
      const instance = axios.create({
        baseURL,
        headers: { 'Content-Type': 'application/json' },
        // Progressive timeout increase with each attempt
        timeout: 8000 + (attempts * 2000), // Start with 8s, add 2s each attempt
      });
      
      const response = method === 'get'
        ? await instance.get<T>(path)
        : await instance.post<T>(path, data);
        
      console.log(`Successful connection to ${baseURL}${path}`);

      // Store result in cache if a cache key is provided
      if (cacheKey && response.data) {
        cacheService.set(cacheKey, response.data, cacheDuration);
      }

      return response.data;
    } catch (error) {
      // Only log distinct errors to reduce console noise
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to connect to ${baseURL}${path}:`, errorMessage);
      lastError = error;
      
      // Small delay before retrying to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // If we get here, all endpoints failed
  console.error(`All ${attempts} API connection attempts failed`);
  throw lastError;
};

const stockService = {
  // Get detailed analysis for a specific stock
  async analyzeStock(symbol: string): Promise<StockAnalysis> {
    const cacheKey = CACHE_KEYS.STOCK_ANALYSIS(symbol);
    try {
      console.log(`Analyzing stock: ${symbol}`);
      return await tryAllEndpoints<StockAnalysis>(
        `/analyze/${symbol}`, 
        'get', 
        undefined, 
        cacheKey, 
        cacheService.getDurations().MEDIUM
      );
    } catch (error) {
      console.error('Error analyzing stock:', error);
      // Try to use cached data even if it's expired when we have a connection error
      const cachedData = cacheService.get<StockAnalysis>(cacheKey);
      if (cachedData) {
        console.log(`Using expired cached data for ${symbol} due to connection error`);
        return cachedData;
      }
      throw new Error(formatErrorMessage(error));
    }
  },

  // Get trending stocks data
  async getTrendingStocks(): Promise<TrendingStocksData> {
    try {
      console.log('Fetching trending stocks');
      return await tryAllEndpoints<TrendingStocksData>(
        '/trending', 
        'get', 
        undefined, 
        CACHE_KEYS.TRENDING, 
        cacheService.getDurations().SHORT
      );
    } catch (error) {
      console.error('Error fetching trending stocks:', error);
      // Try to use cached data even if it's expired when we have a connection error
      const cachedData = cacheService.get<TrendingStocksData>(CACHE_KEYS.TRENDING);
      if (cachedData) {
        console.log('Using expired cached trending stocks data due to connection error');
        return cachedData;
      }
      throw new Error(formatErrorMessage(error));
    }
  },

  // Get market movers (gainers and losers)
  async getMarketMovers(): Promise<MarketMovers> {
    try {
      console.log('Fetching market movers');
      return await tryAllEndpoints<MarketMovers>(
        '/market-movers', 
        'get', 
        undefined, 
        CACHE_KEYS.MARKET_MOVERS, 
        cacheService.getDurations().SHORT
      );
    } catch (error) {
      console.error('Error fetching market movers:', error);
      // Try to use cached data even if it's expired when we have a connection error
      const cachedData = cacheService.get<MarketMovers>(CACHE_KEYS.MARKET_MOVERS);
      if (cachedData) {
        console.log('Using expired cached market movers data due to connection error');
        return cachedData;
      }
      throw new Error(formatErrorMessage(error));
    }
  },

  // Get market indices
  async getMarketIndices(): Promise<MarketIndices> {
    try {
      console.log('Fetching market indices');
      return await tryAllEndpoints<MarketIndices>(
        '/market-indices', 
        'get', 
        undefined, 
        CACHE_KEYS.MARKET_INDICES, 
        cacheService.getDurations().SHORT
      );
    } catch (error) {
      console.error('Error fetching market indices:', error);
      // Try to use cached data even if it's expired when we have a connection error
      const cachedData = cacheService.get<MarketIndices>(CACHE_KEYS.MARKET_INDICES);
      if (cachedData) {
        console.log('Using expired cached market indices data due to connection error');
        return cachedData;
      }
      throw new Error(formatErrorMessage(error));
    }
  },

  // Get all stocks data
  async getAllStocks(limit: number = 50): Promise<AllStocks> {
    const cacheKey = CACHE_KEYS.ALL_STOCKS;
    try {
      console.log(`Fetching all stocks with limit: ${limit}`);
      return await tryAllEndpoints<AllStocks>(
        `/stocks?limit=${limit}`, 
        'get', 
        undefined, 
        cacheKey, 
        cacheService.getDurations().LONG
      );
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      // Try to use cached data even if it's expired when we have a connection error
      const cachedData = cacheService.get<AllStocks>(cacheKey);
      if (cachedData) {
        console.log('Using expired cached stocks data due to connection error');
        return cachedData;
      }
      throw new Error(formatErrorMessage(error));
    }
  },

  // Get news data (market or stock-specific)
  async getNews(symbol?: string, limit: number = 10): Promise<NewsData> {
    // Use different cache keys for general news vs. stock-specific news
    const cacheKey = symbol 
      ? `${CACHE_KEYS.NEWS}-${symbol}-${limit}` 
      : `${CACHE_KEYS.NEWS}-${limit}`;
    
    try {
      let url = '/news';
      if (symbol) {
        url += `?symbol=${symbol}&limit=${limit}`;
      } else {
        url += `?limit=${limit}`;
      }
      
      console.log(`Fetching news with URL: ${url}`);
      return await tryAllEndpoints<NewsData>(
        url, 
        'get', 
        undefined, 
        cacheKey, 
        cacheService.getDurations().SHORT // News should refresh frequently
      );
    } catch (error) {
      console.error('Error fetching news:', error);
      // Try to use cached data even if it's expired when we have a connection error
      const cachedData = cacheService.get<NewsData>(cacheKey);
      if (cachedData) {
        console.log('Using expired cached news data due to connection error');
        return cachedData;
      }
      throw new Error(formatErrorMessage(error));
    }
  },

  // Get stock price history
  async getStockHistory(symbol: string, period: string = '1y'): Promise<StockHistory> {
    const cacheKey = CACHE_KEYS.STOCK_HISTORY(symbol, period);
    try {
      console.log(`Fetching stock history for ${symbol} with period ${period}`);
      return await tryAllEndpoints<StockHistory>(
        `/stock-history/${symbol}?period=${period}`, 
        'get', 
        undefined, 
        cacheKey,
        // Longer periods can be cached longer
        period === '1d' ? cacheService.getDurations().SHORT :
        period === '5d' ? cacheService.getDurations().MEDIUM :
        cacheService.getDurations().LONG
      );
    } catch (error) {
      console.error('Error fetching stock history:', error);
      // Try to use cached data even if it's expired when we have a connection error
      const cachedData = cacheService.get<StockHistory>(cacheKey);
      if (cachedData) {
        console.log(`Using expired cached history data for ${symbol} due to connection error`);
        return cachedData;
      }
      throw new Error(formatErrorMessage(error));
    }
  },

  // Health check for the API (no caching for health check)
  async healthCheck(): Promise<{ status: string; healthy: boolean }> {
    try {
      console.log('Running API health check');
      const healthData = await tryAllEndpoints<{ status: string }>('/health');
      console.log('API health check successful:', healthData.status);
      return { status: healthData.status, healthy: true };
    } catch (error) {
      console.error('API health check failed:', error);
      return { 
        status: formatErrorMessage(error), 
        healthy: false 
      };
    }
  }
};

export default stockService; 
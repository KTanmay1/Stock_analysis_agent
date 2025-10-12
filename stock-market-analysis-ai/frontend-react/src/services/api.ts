import axios, { AxiosError } from 'axios';
import { config } from '../config';
import type { StockAnalysisResponse, TrendingStocksResponse } from '../types/stock.types';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: config.backendUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

// API methods
export const stockApi = {
  // Get trending stocks
  getTrendingStocks: async (): Promise<TrendingStocksResponse> => {
    const response = await apiClient.get<TrendingStocksResponse>('/trending');
    return response.data;
  },

  // Analyze specific stock
  analyzeStock: async (symbol: string): Promise<StockAnalysisResponse> => {
    const cleanSymbol = symbol.trim().toUpperCase().replace('.NS', '');
    const response = await apiClient.get<StockAnalysisResponse>(`/analyze/${cleanSymbol}`);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;


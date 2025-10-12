// Application configuration
export const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'https://stock-analysis-agent.onrender.com',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;


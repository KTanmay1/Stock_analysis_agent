// Application configuration
export const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'https://stockanalysisagent-production.up.railway.app',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;


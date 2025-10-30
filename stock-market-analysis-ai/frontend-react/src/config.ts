// Application configuration
// IMPORTANT: Do not hardcode a production fallback URL here.
// The backend URL must come from the build-time env var VITE_BACKEND_URL.
// This ensures Netlify/CI-provided value (e.g., Railway URL) is used.
const envBackend = import.meta.env.VITE_BACKEND_URL as string | undefined;

if (!envBackend) {
  // Surface a clear error to make misconfiguration obvious at runtime
  // rather than silently pointing to an incorrect default.
  // eslint-disable-next-line no-console
  console.error(
    'VITE_BACKEND_URL is not defined. Please set it in Netlify Environment Variables.'
  );
}

export const config = {
  backendUrl: envBackend ?? '',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;


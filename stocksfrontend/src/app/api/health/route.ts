import { NextRequest, NextResponse } from 'next/server';

// List of fallback endpoints to try
const BACKEND_ENDPOINTS = [
  process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://backend:8000',
  'http://localhost:8000'
];

// In-memory cache for health check status to prevent hammering backend
type HealthStatus = {
  status: string;
  healthy: boolean;
  timestamp: number;
};

// Health check cache with a short TTL (15 seconds)
const healthCache: HealthStatus = {
  status: 'unknown',
  healthy: false,
  timestamp: 0
};

// Cache TTL (15 seconds)
const HEALTH_CACHE_TTL = 15 * 1000;

// Check if health cache is still valid
const isHealthCacheValid = (): boolean => {
  return Date.now() - healthCache.timestamp < HEALTH_CACHE_TTL;
};

/**
 * Health check endpoint
 * This route checks if the backend API is accessible
 */
export async function GET(request: NextRequest) {
  console.log('Health check route: Attempting connection to backend APIs');
  
  // Check cache first to prevent hammering the backend with health checks
  if (isHealthCacheValid()) {
    console.log('Using cached health status');
    return NextResponse.json({
      status: healthCache.status,
      healthy: healthCache.healthy
    });
  }
  
  let lastError: Error | null = null;
  
  // Try each backend endpoint
  for (const baseUrl of BACKEND_ENDPOINTS) {
    try {
      console.log(`Health check trying: ${baseUrl}/health`);
      
      // Create abort controller with short timeout (health checks should be fast)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Fetch from the backend
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        // Disable cache to always get fresh health status
        cache: 'no-cache',
        next: { revalidate: 0 }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Health check failed for ${baseUrl}: ${response.status} ${response.statusText}`);
        throw new Error(`Backend returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Successful health check response from ${baseUrl}`);
      
      // Update the health cache
      healthCache.status = data.status || 'ok';
      healthCache.healthy = true;
      healthCache.timestamp = Date.now();
      
      return NextResponse.json({
        status: healthCache.status,
        healthy: healthCache.healthy
      });
    } catch (error) {
      console.error(`Health check failed for ${baseUrl}:`, error instanceof Error ? error.message : String(error));
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  // All endpoints failed
  console.error('All health check endpoints failed');
  
  // Update the health cache with failure
  healthCache.status = lastError?.message || 'Backend unreachable';
  healthCache.healthy = false;
  healthCache.timestamp = Date.now();
  
  return NextResponse.json({
    status: healthCache.status,
    healthy: healthCache.healthy
  }, { status: 200 }); // Still return 200 to not break clients
} 
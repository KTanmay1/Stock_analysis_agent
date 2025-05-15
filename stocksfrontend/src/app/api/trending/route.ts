import { NextRequest, NextResponse } from 'next/server';
import cacheService, { CACHE_KEYS } from '../../../services/cache';

// List of fallback endpoints to try
const BACKEND_ENDPOINTS = [
  process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://backend:8000',
  'http://localhost:8000'
];

// Create a simplified response when backend is not available
const createEmptyResponse = () => {
  return {
    trending_stocks: [
      { symbol: 'LOADING', name: 'Loading...', price: 0, change: 0, changePct: 0 },
      { symbol: 'LOADING', name: 'Loading...', price: 0, change: 0, changePct: 0 },
      { symbol: 'LOADING', name: 'Loading...', price: 0, change: 0, changePct: 0 },
    ],
    _meta: {
      status: 'degraded',
      message: 'Using placeholder data due to backend connection issues'
    }
  };
};

export async function GET(request: NextRequest) {
  console.log('Trending API route called');
  
  // Check cache first
  const cachedData = cacheService.get(CACHE_KEYS.TRENDING);
  if (cachedData) {
    console.log('Using cached trending data');
    return NextResponse.json(cachedData);
  }
  
  let lastError: Error | null = null;
  
  // Try each backend endpoint
  for (const baseUrl of BACKEND_ENDPOINTS) {
    try {
      console.log(`Trying to fetch trending data from: ${baseUrl}/trending`);
      
      // Create abort controller with longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      // Fetch from the backend
      const response = await fetch(`${baseUrl}/trending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        // Disable cache to get fresh data
        cache: 'no-cache',
        next: { revalidate: 0 }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Error fetching trending data from ${baseUrl}: ${response.status} ${response.statusText}`);
        throw new Error(`Backend returned status ${response.status}`);
      }
      
      // Get data and cache it
      const data = await response.json();
      console.log(`Successfully fetched trending data from ${baseUrl}`);
      
      // Store in cache with 5-minute expiry
      cacheService.set(CACHE_KEYS.TRENDING, data, cacheService.getDurations().SHORT);
      
      return NextResponse.json(data);
    } catch (error) {
      console.error(`Failed to fetch trending data from ${baseUrl}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Small delay before retrying to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // All endpoints failed - check if we have expired cached data we can use
  const expiredCache = cacheService.get(CACHE_KEYS.TRENDING);
  if (expiredCache) {
    console.log('Using expired cached trending data due to backend errors');
    return NextResponse.json(expiredCache);
  }
  
  // No cached data available - provide a graceful degradation with placeholder data
  console.error('All backend endpoints failed when fetching trending data');
  
  // Create placeholder data
  const placeholderData = createEmptyResponse();
  
  // Store placeholder in cache with a short expiry to prevent too many backend calls
  cacheService.set(CACHE_KEYS.TRENDING, placeholderData, 30000); // 30 seconds
  
  // Return empty placeholder data with 200 status instead of error
  return NextResponse.json(placeholderData, { status: 200 });
} 
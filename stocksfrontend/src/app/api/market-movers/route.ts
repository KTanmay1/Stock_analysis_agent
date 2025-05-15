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
    gainers: [
      { symbol: 'LOADING', name: 'Loading...', change: 0, changePct: 0 },
      { symbol: 'LOADING', name: 'Loading...', change: 0, changePct: 0 },
      { symbol: 'LOADING', name: 'Loading...', change: 0, changePct: 0 },
    ],
    losers: [
      { symbol: 'LOADING', name: 'Loading...', change: 0, changePct: 0 },
      { symbol: 'LOADING', name: 'Loading...', change: 0, changePct: 0 },
      { symbol: 'LOADING', name: 'Loading...', change: 0, changePct: 0 },
    ],
    most_active: [
      { symbol: 'LOADING', name: 'Loading...', volume: 0, price: 0 },
      { symbol: 'LOADING', name: 'Loading...', volume: 0, price: 0 },
      { symbol: 'LOADING', name: 'Loading...', volume: 0, price: 0 },
    ],
    _meta: {
      status: 'degraded',
      message: 'Using placeholder data due to backend connection issues'
    }
  };
};

export async function GET(request: NextRequest) {
  console.log('Market movers API route called');
  
  // Check cache first
  const cachedData = cacheService.get(CACHE_KEYS.MARKET_MOVERS);
  if (cachedData) {
    console.log('Using cached market movers data');
    return NextResponse.json(cachedData);
  }

  let lastError: Error | null = null;
  
  // Try each backend endpoint
  for (const baseUrl of BACKEND_ENDPOINTS) {
    try {
      console.log(`Trying to fetch market movers from: ${baseUrl}/market-movers`);
      
      // Create abort controller with longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout (increased)
      
      // Fetch from the backend
      const response = await fetch(`${baseUrl}/market-movers`, {
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
        console.error(`Error fetching market movers from ${baseUrl}: ${response.status} ${response.statusText}`);
        throw new Error(`Backend returned status ${response.status}`);
      }
      
      // Get data and cache it
      const data = await response.json();
      console.log(`Successfully fetched market movers from ${baseUrl}`);
      
      // Store in cache with 5-minute expiry
      cacheService.set(CACHE_KEYS.MARKET_MOVERS, data, cacheService.getDurations().SHORT);
      
      return NextResponse.json(data);
    } catch (error) {
      console.error(`Failed to fetch market movers from ${baseUrl}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Small delay before retrying to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // All endpoints failed - check if we have expired cached data we can use
  const expiredCache = cacheService.get(CACHE_KEYS.MARKET_MOVERS);
  if (expiredCache) {
    console.log('Using expired cached market movers data due to backend errors');
    return NextResponse.json(expiredCache);
  }
  
  // No cached data available - provide a graceful degradation with placeholder data
  console.error('All backend endpoints failed when fetching market movers');
  
  // Create placeholder data
  const placeholderData = createEmptyResponse();
  
  // Store placeholder in cache with a short expiry to prevent too many backend calls
  cacheService.set(CACHE_KEYS.MARKET_MOVERS, placeholderData, 30000); // 30 seconds
  
  // Return empty placeholder data with 200 status instead of error
  // This allows the UI to show something rather than fail completely
  return NextResponse.json(placeholderData, { status: 200 });
} 
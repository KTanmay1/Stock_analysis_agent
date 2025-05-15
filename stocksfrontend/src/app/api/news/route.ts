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
    articles: [
      { 
        title: 'Unable to load news at this time',
        description: 'Please try again later. Our servers are experiencing high load.',
        source: 'System',
        url: '#',
        published_at: new Date().toISOString(),
        image_url: null
      },
    ],
    _meta: {
      status: 'degraded',
      message: 'Using placeholder data due to backend connection issues'
    }
  };
};

export async function GET(request: NextRequest) {
  console.log('News API route called');
  
  // Get the query parameters
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const limit = searchParams.get('limit') || '5';
  
  // Create a cache key based on the query parameters
  const cacheKey = symbol 
    ? `${CACHE_KEYS.NEWS}-${symbol}-${limit}` 
    : `${CACHE_KEYS.NEWS}-${limit}`;
  
  // Check cache first
  const cachedData = cacheService.get(cacheKey);
  if (cachedData) {
    console.log(`Using cached news data for ${symbol || 'general news'}`);
    return NextResponse.json(cachedData);
  }
  
  // Construct the API endpoint URL
  let apiPath = `/news?limit=${limit}`;
  if (symbol) {
    apiPath += `&symbol=${symbol}`;
  }
  
  let lastError: Error | null = null;
  
  // Try each backend endpoint
  for (const baseUrl of BACKEND_ENDPOINTS) {
    try {
      console.log(`Trying to fetch news data from: ${baseUrl}${apiPath}`);
      
      // Create abort controller with longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      // Fetch from the backend
      const response = await fetch(`${baseUrl}${apiPath}`, {
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
        console.error(`Error fetching news data from ${baseUrl}: ${response.status} ${response.statusText}`);
        throw new Error(`Backend returned status ${response.status}`);
      }
      
      // Get data and cache it
      const data = await response.json();
      console.log(`Successfully fetched news data from ${baseUrl}`);
      
      // Store in cache with a short expiry since news changes frequently
      cacheService.set(cacheKey, data, cacheService.getDurations().SHORT);
      
      return NextResponse.json(data);
    } catch (error) {
      console.error(`Failed to fetch news data from ${baseUrl}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Small delay before retrying to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // All endpoints failed - check if we have expired cached data we can use
  const expiredCache = cacheService.get(cacheKey);
  if (expiredCache) {
    console.log(`Using expired cached news data for ${symbol || 'general news'} due to backend errors`);
    return NextResponse.json(expiredCache);
  }
  
  // No cached data available - provide a graceful degradation with placeholder data
  console.error('All backend endpoints failed when fetching news data');
  
  // Create placeholder data
  const placeholderData = createEmptyResponse();
  
  // Store placeholder in cache with a short expiry to prevent too many backend calls
  cacheService.set(cacheKey, placeholderData, 30000); // 30 seconds
  
  // Return empty placeholder data with 200 status instead of error
  return NextResponse.json(placeholderData, { status: 200 });
} 
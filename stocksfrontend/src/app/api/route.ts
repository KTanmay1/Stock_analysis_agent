import { NextRequest, NextResponse } from 'next/server';

// The base URL for the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://backend:8000';

/**
 * Proxy API requests to the backend
 * This is a catch-all route that forwards requests to the backend API
 */
export async function GET(request: NextRequest) {
  try {
    // Get the requested path
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '');
    const searchParams = url.search;
    
    // Construct the full URL for the backend API
    const backendUrl = `${API_BASE_URL}${path}${searchParams}`;
    console.log(`Proxying GET request to: ${backendUrl}`);
    
    // Forward the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Forward the request
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if the response is ok
      if (!response.ok) {
        console.error(`Error from backend: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `Backend error: ${response.statusText}` },
          { status: response.status }
        );
      }
      
      // Get the response data
      const data = await response.json();
      console.log(`Successful response from ${backendUrl}`);
      
      // Return the response
      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error(`Request timeout for ${backendUrl}`);
        return NextResponse.json(
          { error: 'Request timed out while connecting to backend' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('API proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from backend',
        details: errorMessage,
        type: errorName
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the requested path
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '');
    const searchParams = url.search;
    
    // Get the request body
    const body = await request.json();
    
    // Construct the full URL for the backend API
    const backendUrl = `${API_BASE_URL}${path}${searchParams}`;
    console.log(`Proxying POST request to: ${backendUrl}`);
    
    // Forward the request
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Check if the response is ok
    if (!response.ok) {
      console.error(`Error from backend: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to send data to backend' },
      { status: 500 }
    );
  }
} 
'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Text, Title } from '@tremor/react';
import cacheService from '@/services/cache';

export default function FixCache() {
  const [cleared, setCleared] = useState(false);
  const [cacheCount, setCacheCount] = useState(0);

  // Function to count cache entries
  const countCacheEntries = () => {
    if (typeof window !== 'undefined') {
      setCacheCount(localStorage.length);
    }
  };

  useEffect(() => {
    countCacheEntries();
  }, []);

  const handleClearCache = () => {
    try {
      // Clear all cache entries
      cacheService.clear();
      
      // Clear browser localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      
      setCleared(true);
      setCacheCount(0);
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache. See console for details.');
    }
  };

  const handleClearProblematic = () => {
    try {
      // Clear only potentially problematic cache entries
      cacheService.clearProblematicCaches();
      setCleared(true);
      countCacheEntries();
    } catch (error) {
      console.error('Error clearing problematic caches:', error);
      alert('Error clearing problematic caches. See console for details.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <Card className="mb-8">
        <Title>Cache Utility</Title>
        <Text className="mb-4">
          If you're experiencing issues with the application, clearing the cache might help.
          This will remove all stored market data and require new data to be fetched from the server.
        </Text>
        
        <div className="mb-4">
          <Text>Current cache entries: {cacheCount}</Text>
        </div>
        
        <div className="flex gap-4">
          <Button onClick={handleClearProblematic} color="amber">
            Clear Problematic Cache Entries
          </Button>
          
          <Button onClick={handleClearCache} color="red">
            Clear All Cache
          </Button>
        </div>
        
        {cleared && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded">
            Cache has been cleared. Please refresh the main page or navigate back to continue.
          </div>
        )}
      </Card>
      
      <Card>
        <Title>Troubleshooting</Title>
        <Text className="mb-2">If you continue to experience issues:</Text>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Try refreshing the page</li>
          <li>Clear your browser cache</li>
          <li>Try a different browser</li>
          <li>If the issues persist, the backend server might be unavailable</li>
        </ol>
        
        <div className="mt-6">
          <Button onClick={() => window.location.href = '/'} color="blue">
            Return to Homepage
          </Button>
        </div>
      </Card>
    </div>
  );
} 
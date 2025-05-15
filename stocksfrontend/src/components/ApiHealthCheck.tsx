"use client";

import React, { useState, useEffect } from 'react';
import { Card, Text, Badge } from '@tremor/react';
import stockService from '@/services/api';

interface ApiHealthCheckProps {
  showDetails?: boolean;
}

const ApiHealthCheck: React.FC<ApiHealthCheckProps> = ({ showDetails = true }) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('Checking API connection...');
  const [lastChecked, setLastChecked] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [error, setError] = useState<any>(null);
  const [directCheckResults, setDirectCheckResults] = useState<string[]>([]);
  const [checkInProgress, setCheckInProgress] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Direct fetch check for debugging - check multiple endpoints
  const runDirectFetchTests = async () => {
    const results: string[] = [];
    const isBrowser = typeof window !== 'undefined';
    const environments = [
      {name: 'Frontend API Route', url: '/api/health'},
      {name: 'Localhost', url: 'http://localhost:8000/health'},
      {name: 'Backend Container', url: 'http://backend:8000/health'},
      {name: 'API Proxy', url: '/api'}
    ];
    
    // Only test URLs appropriate for the environment
    const urlsToTest = isBrowser 
        ? environments.filter(env => env.name !== 'Backend Container') // Browser can't access container directly
        : environments;
    
    setDebugInfo(`Running in ${isBrowser ? 'browser' : 'server'} environment. Testing ${urlsToTest.length} endpoints.`);
    
    // Test each URL
    for (const env of urlsToTest) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (increased)
        
        results.push(`🔄 Testing ${env.name} (${env.url})...`);
        setDirectCheckResults([...results]);
        
        const result = await fetch(env.url, {
          method: 'GET',
          headers: {'Content-Type': 'application/json'},
          signal: controller.signal,
          // Avoid caching issues
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        // Replace the last result with the actual result
        results.pop();
        
        if (result.ok) {
          const data = await result.json();
          results.push(`✅ ${env.name} (${env.url}): ${JSON.stringify(data)}`);
        } else {
          results.push(`❌ ${env.name} (${env.url}): Status ${result.status}`);
        }
        setDirectCheckResults([...results]);
      } catch (err) {
        // Replace the last result with the error
        results.pop();
        
        const errMessage = err instanceof Error ? err.message : String(err);
        results.push(`❌ ${env.name} (${env.url}): ${errMessage}`);
        setDirectCheckResults([...results]);
      }
    }
  };

  const checkHealth = async () => {
    if (checkInProgress) return;
    
    try {
      setCheckInProgress(true);
      setRetryCount(prev => prev + 1);
      
      console.log(`ApiHealthCheck: Starting health check (attempt #${retryCount + 1})`);
      const isBrowser = typeof window !== 'undefined';
      setDebugInfo(`Environment: ${isBrowser ? 'Browser' : 'Server'}, Checking multiple API endpoints (attempt #${retryCount + 1})`);
      
      // Update UI immediately to show we're checking
      setMessage('Checking API connection...');
      setDirectCheckResults([]);
      
      // First try the more reliable direct check first
      await runDirectFetchTests();
      
      // Then try the service
      const result = await stockService.healthCheck();
      setIsHealthy(result.healthy);
      setMessage(result.status);
      setLastChecked(new Date().toLocaleTimeString());
      setError(null);
      console.log('ApiHealthCheck: Health check complete', result);
    } catch (error) {
      console.error('ApiHealthCheck: Error during health check', error);
      setIsHealthy(false);
      setMessage('Failed to connect to API');
      setLastChecked(new Date().toLocaleTimeString());
      setError(error);
      
      // Add detailed error information
      if (error instanceof Error) {
        setDebugInfo(`Error in health check: ${error.message}`);
      } else {
        setDebugInfo(`Unknown error occurred: ${String(error)}`);
      }
    } finally {
      setCheckInProgress(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Set up a periodic check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={`mb-4 ${isHealthy === false ? 'border-red-500' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Text>API Status:</Text>
          {isHealthy === null ? (
            <Badge color="gray">Checking...</Badge>
          ) : isHealthy ? (
            <Badge color="green">Connected</Badge>
          ) : (
            <Badge color="red">Disconnected</Badge>
          )}
        </div>
        <Text className="text-xs text-gray-500">Last checked: {lastChecked || 'Never'}</Text>
      </div>
      <Text className="mt-2 text-sm">{message}</Text>
      
      {!isHealthy && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-xs">
          <Text className="font-semibold">Troubleshooting:</Text>
          <Text className="text-xs mt-1">
            • Check if the backend container is running<br />
            • Make sure port 8000 is not blocked<br />
            • Ensure Docker networking is working properly<br />
            • If using Docker Desktop, check if containers are using the correct network<br /> 
            • Try restarting both services with 'docker-compose down && docker-compose up -d'
          </Text>
        </div>
      )}
      
      {showDetails && debugInfo && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
          <Text className="font-mono">{debugInfo}</Text>
        </div>
      )}
      
      {showDetails && directCheckResults.length > 0 && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs overflow-auto">
          <Text className="font-semibold mb-1">Direct API Checks:</Text>
          {directCheckResults.map((result, index) => (
            <Text key={index} className="font-mono block">{result}</Text>
          ))}
        </div>
      )}
      
      {showDetails && error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-xs overflow-auto">
          <Text className="font-mono">
            {error instanceof Error
              ? `${error.name}: ${error.message}\n${error.stack || ''}`
              : String(error)}
          </Text>
        </div>
      )}
      
      <button 
        onClick={checkHealth}
        disabled={checkInProgress}
        className={`mt-2 px-3 py-1 text-white text-xs rounded ${
          checkInProgress 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {checkInProgress ? 'Checking...' : 'Retry Connection'}
      </button>
    </Card>
  );
};

export default ApiHealthCheck; 
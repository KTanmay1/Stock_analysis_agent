'use client';

import { useEffect } from 'react';
import cacheService from '@/services/cache';

export function ClientInit() {
  useEffect(() => {
    // Function to check and fix localStorage data
    const checkAndFixCache = () => {
      try {
        console.log('Checking cache integrity...');
        
        // Check if there are any corrupt localStorage items
        let hasCorruptData = false;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            // Try to parse each item to detect corruption
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (!key) continue;
              
              try {
                const item = localStorage.getItem(key);
                if (!item) continue;
                
                // Try to parse the JSON
                JSON.parse(item);
              } catch (e) {
                console.warn(`Found corrupt cache item: ${key}. Removing.`);
                localStorage.removeItem(key);
                hasCorruptData = true;
              }
            }
          } catch (e) {
            console.error('Error checking localStorage:', e);
          }
        }
        
        // If we found corrupt data, clear problematic caches to be safe
        if (hasCorruptData) {
          console.log('Clearing problematic caches due to detected corruption');
          cacheService.clearProblematicCaches();
        }
      } catch (error) {
        console.error('Error in checkAndFixCache:', error);
      }
    };
    
    // Run the check
    checkAndFixCache();
  }, []);
  
  // This component doesn't render anything
  return null;
}

export default ClientInit; 
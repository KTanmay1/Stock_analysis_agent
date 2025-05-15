'use client';

import { useEffect } from 'react';
import { Button } from '@tremor/react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        We apologize for the inconvenience. The application has encountered an unexpected error.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} color="blue">
          Refresh Page
        </Button>
        <Button onClick={reset} variant="secondary">
          Try Again
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 max-w-lg mx-auto p-4 bg-gray-100 rounded-lg text-left">
          <p className="font-mono text-sm text-red-600 overflow-auto">
            {error.message}
          </p>
        </div>
      )}
    </div>
  );
} 
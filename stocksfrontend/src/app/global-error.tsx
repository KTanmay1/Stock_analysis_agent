'use client';

import { Button } from '@tremor/react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            We apologize for the inconvenience. The application has encountered a critical error.
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
      </body>
    </html>
  );
} 
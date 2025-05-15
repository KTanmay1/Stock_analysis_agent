'use client';

import React, { useState, useEffect } from 'react';
import { Card, Text } from '@tremor/react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  fallback = (
    <Card className="p-4 my-2 border-l-4 border-yellow-500">
      <Text className="text-yellow-700">
        Something went wrong loading this component. Please refresh the page or try again later.
      </Text>
    </Card>
  )
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('ErrorBoundary caught client-side error:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ErrorBoundary; 
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
}) => {
  const { darkMode } = useTheme();

  const bgColor = darkMode ? 'bg-red-900/20' : 'bg-red-50';
  const borderColor = darkMode ? 'border-red-800' : 'border-red-200';
  const textColor = darkMode ? 'text-red-400' : 'text-red-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${bgColor} ${borderColor} p-4`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${textColor}`} />
        <div className="flex-1">
          <p className={`text-sm ${textColor}`}>{message}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="ghost"
              size="sm"
              className="mt-2 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};


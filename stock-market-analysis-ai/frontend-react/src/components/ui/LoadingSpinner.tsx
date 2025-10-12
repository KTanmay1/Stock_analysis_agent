import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
}) => {
  const { darkMode } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const iconColor = darkMode ? 'text-primary-400' : 'text-primary-500';

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizeClasses[size]} ${iconColor}`} />
      </motion.div>
      {text && (
        <p className={`text-sm ${textColor}`}>{text}</p>
      )}
    </div>
  );
};


import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  onClick,
}) => {
  const { darkMode } = useTheme();

  const baseClasses = darkMode
    ? 'bg-gray-800 border border-gray-700'
    : 'bg-white border border-gray-200';

  const hoverClasses = hover
    ? 'cursor-pointer transition-shadow duration-200 hover:shadow-card-hover'
    : '';

  return (
    <motion.div
      className={`rounded-lg shadow-card p-4 sm:p-6 ${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { scale: 1.02 } : {}}
    >
      {children}
    </motion.div>
  );
};


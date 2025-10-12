import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const { darkMode } = useTheme();

  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900';

  const variantClasses = {
    primary: darkMode
      ? 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-md [&>*]:relative [&>*]:z-10'
      : 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-400 shadow-lg [&>*]:relative [&>*]:z-10',
    secondary: darkMode
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 focus:ring-gray-500 [&>*]:relative [&>*]:z-10'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400 [&>*]:relative [&>*]:z-10',
    danger: 'bg-danger hover:bg-danger-dark text-white focus:ring-danger-light [&>*]:relative [&>*]:z-10',
    ghost: darkMode
      ? 'bg-transparent hover:bg-gray-700 text-gray-300 focus:ring-gray-500 [&>*]:relative [&>*]:z-10'
      : 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300 [&>*]:relative [&>*]:z-10',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.button>
  );
};


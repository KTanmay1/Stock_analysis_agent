import React from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  const { darkMode } = useTheme();

  const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const placeholderColor = darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400';
  const iconColor = darkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`w-5 h-5 ${iconColor}`} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`block w-full pl-10 pr-3 py-2 sm:py-3 border ${borderColor} rounded-lg ${bgColor} ${textColor} ${placeholderColor} focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200`}
      />
    </div>
  );
};


import React from 'react';
import { Menu, Sun, Moon, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  const bgColor = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <nav className={`sticky top-0 z-40 w-full border-b ${bgColor} transition-colors duration-300 md:ml-64`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Menu button (mobile) and Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onMenuClick}
              className={`md:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors duration-200`}
              aria-label="Toggle menu"
            >
              <Menu className={`w-6 h-6 ${textColor}`} />
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className={`w-6 h-6 sm:w-8 sm:h-8 text-primary-500`} />
              <h1 className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor}`}>
                Stock Analysis
              </h1>
            </div>
          </div>

          {/* Right side - Dark mode toggle */}
          <motion.button
            onClick={toggleDarkMode}
            className={`p-2 sm:p-3 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors duration-200`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle dark mode"
          >
            <motion.div
              initial={false}
              animate={{ rotate: darkMode ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {darkMode ? (
                <Moon className="w-5 h-5 text-yellow-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-600" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>
    </nav>
  );
};


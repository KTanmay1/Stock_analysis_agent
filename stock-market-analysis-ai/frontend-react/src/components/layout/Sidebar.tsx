import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const location = useLocation();

  const bgColor = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const activeColor = darkMode ? 'bg-primary-900/30 text-primary-400 border-primary-500' : 'bg-primary-50 text-primary-600 border-primary-500';
  const hoverColor = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50';

  const navItems = [
    { path: '/', label: 'Trending Stocks', icon: TrendingUp },
    { path: '/analyze', label: 'Stock Analysis', icon: BarChart3 },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 ${bgColor} border-r z-50 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 
          transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Menu
          </h2>
          <button
            onClick={onClose}
            className={`md:hidden p-2 rounded-lg ${hoverColor} transition-colors`}
            aria-label="Close menu"
          >
            <X className={`w-5 h-5 ${textColor}`} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 transition-all duration-200 ${
                  isActive
                    ? activeColor
                    : `border-transparent ${textColor} ${hoverColor}`
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-xs text-center ${textColor}`}>
            Made with ❤️ for Indian Stock Market
          </p>
        </div>
      </aside>
    </>
  );
};


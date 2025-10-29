import React from 'react';
import { Menu, TrendingUp } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-gray-900 border-gray-800 md:ml-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Menu button (mobile) and Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-gray-100" />
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-100">
                Stock Analysis
              </h1>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};


import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../ui/Card';
import type { StockData } from '../../types/stock.types';
import { formatCurrency, formatNumber, formatFieldName, formatCompactNumber } from '../../utils/formatters';

interface StockDataCardProps {
  stockData: StockData;
}

export const StockDataCard: React.FC<StockDataCardProps> = ({ stockData }) => {
  const { darkMode } = useTheme();

  if (stockData.error) {
    return (
      <Card>
        <p className={`text-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          {stockData.error}
        </p>
      </Card>
    );
  }

  const formatValue = (key: string, value: any): string => {
    if (value === 'N/A' || value === null || value === undefined) return 'N/A';
    
    if (key === 'current_price' || key === 'day_high' || key === 'day_low' || key === '52_week_high' || key === '52_week_low') {
      return typeof value === 'number' ? formatCurrency(value) : String(value);
    }
    
    if (key === 'volume') {
      return typeof value === 'number' ? formatNumber(value) : String(value);
    }
    
    if (key === 'market_cap') {
      return typeof value === 'number' ? formatCompactNumber(value) : String(value);
    }
    
    if (key === 'pe_ratio') {
      return typeof value === 'number' ? value.toFixed(2) : String(value);
    }
    
    return String(value);
  };

  const dataEntries = Object.entries(stockData).filter(
    ([key]) => key !== 'error' && key !== 'symbol'
  );

  return (
    <Card>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {stockData.symbol}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataEntries.map(([key, value], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
            >
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                {formatFieldName(key)}
              </p>
              <p className={`text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {formatValue(key, value)}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Card>
  );
};


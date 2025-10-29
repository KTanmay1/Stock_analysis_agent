import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../ui/Card';
import type { TechnicalData } from '../../types/stock.types';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface TechnicalIndicatorsProps {
  technicalData: TechnicalData;
}

export const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({ technicalData }) => {
  if (technicalData.error) {
    return (
      <Card>
        <p className="text-center text-red-400">
          {technicalData.error}
        </p>
      </Card>
    );
  }

  const getTrendBadgeColor = (trend: string) => {
    if (trend === 'Bullish') {
      return 'bg-green-900/30 text-green-400';
    }
    return 'bg-red-900/30 text-red-400';
  };

  const getRSIBadgeColor = (signal: string) => {
    if (signal === 'Oversold') {
      return 'bg-blue-900/30 text-blue-400';
    }
    if (signal === 'Overbought') {
      return 'bg-orange-900/30 text-orange-400';
    }
    return 'bg-gray-700 text-gray-300';
  };

  const indicators = [
    { label: 'SMA 20', value: formatCurrency(technicalData.sma20) },
    { label: 'SMA 50', value: formatCurrency(technicalData.sma50) },
    { label: 'RSI', value: technicalData.rsi.toFixed(2) },
    { label: 'Last Close', value: formatCurrency(technicalData.last_close) },
    { label: 'Last Volume', value: formatNumber(technicalData.last_volume) },
    { label: 'Data Points', value: technicalData.data_points.toString() },
  ];

  return (
    <Card>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Trend and RSI Signals */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getTrendBadgeColor(technicalData.trend)}`}>
            {technicalData.trend === 'Bullish' ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="font-semibold">{technicalData.trend}</span>
          </div>
          
          <div className={`px-4 py-2 rounded-lg ${getRSIBadgeColor(technicalData.rsi_signal)}`}>
            <span className="font-semibold">RSI: {technicalData.rsi_signal}</span>
          </div>
        </div>

        {/* Technical Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indicators.map((indicator, index) => (
            <motion.div
              key={indicator.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 rounded-lg bg-gray-700/50"
            >
              <p className="text-sm text-gray-400 mb-1">
                {indicator.label}
              </p>
              <p className="text-base font-semibold text-gray-100">
                {indicator.value}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Card>
  );
};


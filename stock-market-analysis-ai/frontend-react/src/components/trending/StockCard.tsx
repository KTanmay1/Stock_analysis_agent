import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { TrendingStock } from '../../types/stock.types';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters';

interface StockCardProps {
  stock: TrendingStock;
  showVolume?: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, showVolume = false }) => {
  const navigate = useNavigate();

  const isPositive = stock.performance_5d >= 0;
  const performanceColor = isPositive ? 'text-green-400' : 'text-red-400';
  const badgeBg = isPositive ? 'bg-green-900/30' : 'bg-red-900/30';

  const handleAnalyze = () => {
    navigate(`/analyze/${stock.symbol}`);
  };

  return (
    <Card hover className="h-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-100">
              {stock.symbol}
            </h3>
            <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
              {stock.sector}
            </span>
          </div>
          <motion.div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg ${badgeBg} ${performanceColor}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-semibold text-sm">
              {formatPercentage(stock.performance_5d)}
            </span>
          </motion.div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-sm text-gray-400">
            Current Price
          </p>
          <p className="text-2xl font-bold text-gray-100">
            {formatCurrency(stock.current_price)}
          </p>
        </div>

        {/* Volume (if shown) */}
        {showVolume && (
          <div className="mb-4">
            <p className="text-sm text-gray-400">
              Average Volume
            </p>
            <p className="text-base font-semibold text-gray-200">
              {formatNumber(stock.avg_volume)}
            </p>
          </div>
        )}

        {/* Analyze Button */}
        <div className="mt-auto pt-3 border-t border-gray-700">
          <Button
            onClick={handleAnalyze}
            variant="primary"
            size="sm"
            className="w-full gap-2"
          >
            Analyze {stock.symbol}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};


import React from 'react';
import { motion } from 'framer-motion';
import { StockCard } from './StockCard';
import type { TrendingStock } from '../../types/stock.types';

interface TrendingListProps {
  title: string;
  stocks: TrendingStock[];
  showVolume?: boolean;
}

export const TrendingList: React.FC<TrendingListProps> = ({
  title,
  stocks,
  showVolume = false,
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-100">
        {title}
      </h2>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
      >
        {stocks.map((stock) => (
          <motion.div key={stock.symbol} variants={item}>
            <StockCard stock={stock} showVolume={showVolume} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};


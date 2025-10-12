import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp as TrendingUpIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTrendingStocks } from '../hooks/useTrendingStocks';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { TrendingList } from '../components/trending/TrendingList';
import { SectorChart } from '../components/trending/SectorChart';

export const TrendingPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { data, isLoading, error, refetch } = useTrendingStocks();

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading trending stocks..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={`Failed to load trending stocks: ${error.message}`}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return (
      <ErrorMessage
        message="No data available"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <div className="mb-8 sm:mb-10 lg:mb-12">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUpIcon className={`w-8 h-8 ${darkMode ? 'text-primary-400' : 'text-primary-600'}`} />
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Trending Stocks
          </h1>
        </div>
        <p className={`text-sm sm:text-base max-w-3xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Discover top performing stocks and sector trends in the Indian market
        </p>
      </div>

      {/* Top Movers */}
      <TrendingList
        title="📈 Top Movers (Last 5 Days)"
        stocks={data.top_movers}
        showVolume={false}
      />

      {/* Most Active */}
      <TrendingList
        title="📊 Most Active Stocks"
        stocks={data.most_active}
        showVolume={true}
      />

      {/* Sector Performance Chart */}
      {data.sector_performance && Object.keys(data.sector_performance).length > 0 && (
        <div className="mt-8">
          <SectorChart sectorPerformance={data.sector_performance} />
        </div>
      )}
    </motion.div>
  );
};


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BarChart3 } from 'lucide-react';
import { useStockAnalysis } from '../hooks/useStockAnalysis';
import { SearchInput } from '../components/ui/SearchInput';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Button } from '../components/ui/Button';
import { AnalysisTabs } from '../components/analysis/AnalysisTabs';

export const AnalysisPage: React.FC = () => {
  const { symbol: urlSymbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  
  const [searchValue, setSearchValue] = useState(urlSymbol || '');
  const [analyzedSymbol, setAnalyzedSymbol] = useState<string | undefined>(urlSymbol);

  // Update URL when symbol changes
  useEffect(() => {
    if (urlSymbol && urlSymbol !== searchValue) {
      setSearchValue(urlSymbol);
      setAnalyzedSymbol(urlSymbol);
    }
  }, [urlSymbol]);

  const { data, isLoading, error, refetch } = useStockAnalysis(analyzedSymbol);

  const handleSearch = () => {
    if (searchValue.trim()) {
      const cleanSymbol = searchValue.trim().toUpperCase();
      setAnalyzedSymbol(cleanSymbol);
      navigate(`/analyze/${cleanSymbol}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <div className="mb-8 sm:mb-10 lg:mb-12">
        <div className="flex items-center gap-3 mb-3">
          <BarChart3 className="w-8 h-8 text-primary-400" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100">
            Stock Analysis
          </h1>
        </div>
        <p className="text-sm sm:text-base max-w-3xl text-gray-400">
          Deep dive into stock performance, technical indicators, and AI-powered insights
        </p>
      </div>

      {/* Search Section */}
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Enter stock symbol (e.g., RELIANCE, TCS, INFY)"
              className="w-full"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!searchValue.trim() || isLoading}
            className="w-full sm:w-auto gap-2"
          >
            <Search className="w-5 h-5" />
            Analyze
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <LoadingSpinner size="lg" text={`Analyzing ${analyzedSymbol}...`} />
      )}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorMessage
          message={`Failed to analyze ${analyzedSymbol}: ${error.message}`}
          onRetry={() => refetch()}
        />
      )}

      {/* No Symbol State */}
      {!analyzedSymbol && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/50"
        >
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2 text-gray-300">
            Start Your Analysis
          </h3>
          <p className="text-sm text-gray-400">
            Enter a stock symbol above to get comprehensive analysis
          </p>
        </motion.div>
      )}

      {/* Analysis Results */}
      {data && !isLoading && !error && (
        <AnalysisTabs data={data} />
      )}
    </motion.div>
  );
};


import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Newspaper, Brain } from 'lucide-react';
import type { StockAnalysisResponse } from '../../types/stock.types';
import { StockDataCard } from './StockDataCard';
import { TechnicalIndicators } from './TechnicalIndicators';
import { NewsCard } from './NewsCard';
import { AIAnalysis } from './AIAnalysis';

interface AnalysisTabsProps {
  data: StockAnalysisResponse;
}

type TabType = 'stock' | 'technical' | 'news' | 'ai';

export const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('stock');

  const tabs = [
    { id: 'stock' as TabType, label: 'Stock Data', icon: BarChart3 },
    { id: 'technical' as TabType, label: 'Technical Analysis', icon: TrendingUp },
    { id: 'news' as TabType, label: 'News', icon: Newspaper },
    { id: 'ai' as TabType, label: 'AI Analysis', icon: Brain },
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'stock':
        return <StockDataCard stockData={data.stock_data} />;
      case 'technical':
        return <TechnicalIndicators technicalData={data.technical_data} />;
      case 'news':
        return <NewsCard news={data.news_data} />;
      case 'ai':
        return <AIAnalysis analysis={data.analysis} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <div className="flex flex-wrap gap-2 sm:gap-0 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 font-medium text-sm sm:text-base transition-all duration-200 ${
                  isActive
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="mt-6 sm:mt-8"
        >
          {getTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


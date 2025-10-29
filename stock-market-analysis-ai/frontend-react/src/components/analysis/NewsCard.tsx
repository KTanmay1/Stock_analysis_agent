import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Newspaper } from 'lucide-react';
import { Card } from '../ui/Card';
import type { NewsItem } from '../../types/stock.types';

interface NewsCardProps {
  news: NewsItem[];
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!news || news.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8">
          <Newspaper className="w-12 h-12 mb-3 text-gray-600" />
          <p className="text-center text-gray-400">
            No recent news found
          </p>
        </div>
      </Card>
    );
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Card>
      <div className="space-y-3">
        {news.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border rounded-lg overflow-hidden border-gray-700 bg-gray-800/50"
          >
            <button
              onClick={() => toggleExpand(index)}
              className="w-full p-4 flex items-start justify-between gap-3 text-left transition-colors hover:bg-gray-700/50"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold mb-1 text-gray-100">
                  {item.title || 'Untitled'}
                </h4>
                {expandedIndex !== index && item.snippet && (
                  <p className="text-sm line-clamp-2 text-gray-400">
                    {item.snippet}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {expandedIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-0 text-gray-300">
                    <p className="text-sm leading-relaxed">{item.snippet}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};


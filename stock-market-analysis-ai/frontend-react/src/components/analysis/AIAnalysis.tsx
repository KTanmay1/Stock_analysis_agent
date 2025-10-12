import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../ui/Card';

interface AIAnalysisProps {
  analysis: string;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ analysis }) => {
  const { darkMode } = useTheme();

  if (!analysis || analysis === 'No AI analysis available.') {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8">
          <Brain className={`w-12 h-12 mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No AI analysis available
          </p>
        </div>
      </Card>
    );
  }

  // Check for key sections in the analysis
  const hasTargetPrice = analysis.toLowerCase().includes('target price');
  const hasStopLoss = analysis.toLowerCase().includes('stop loss');

  return (
    <Card>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className={`w-6 h-6 ${darkMode ? 'text-primary-400' : 'text-primary-600'}`} />
          <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            AI Analysis
          </h3>
        </div>

        {/* Highlight boxes for target and stop loss if present */}
        {(hasTargetPrice || hasStopLoss) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {hasTargetPrice && (
              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <span className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                    Target Price
                  </span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Check analysis below for details
                </p>
              </div>
            )}
            {hasStopLoss && (
              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                    Stop Loss
                  </span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Check analysis below for details
                </p>
              </div>
            )}
          </div>
        )}

        {/* Analysis content */}
        <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : 'prose-slate'}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({node, ...props}) => <h1 className={`text-2xl font-bold mt-6 mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
              h2: ({node, ...props}) => <h2 className={`text-xl font-bold mt-5 mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
              h3: ({node, ...props}) => <h3 className={`text-lg font-semibold mt-4 mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`} {...props} />,
              p: ({node, ...props}) => <p className={`mb-4 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props} />,
              ul: ({node, ...props}) => <ul className={`list-disc list-inside mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props} />,
              ol: ({node, ...props}) => <ol className={`list-decimal list-inside mb-4 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props} />,
              li: ({node, ...props}) => <li className={`ml-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props} />,
              strong: ({node, ...props}) => <strong className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`} {...props} />,
              code: ({node, className, children, ...props}: any) => {
                const isInline = !className;
                return isInline 
                  ? <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${darkMode ? 'bg-gray-800 text-blue-400' : 'bg-gray-100 text-blue-600'}`} {...props}>{children}</code>
                  : <code className={`block p-3 rounded-lg text-sm font-mono overflow-x-auto ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'}`} {...props}>{children}</code>;
              },
              blockquote: ({node, ...props}) => <blockquote className={`border-l-4 pl-4 italic my-4 ${darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'}`} {...props} />,
              table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-300'}`} {...props} /></div>,
              thead: ({node, ...props}) => <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'} {...props} />,
              tbody: ({node, ...props}) => <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`} {...props} />,
              tr: ({node, ...props}) => <tr {...props} />,
              th: ({node, ...props}) => <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props} />,
              td: ({node, ...props}) => <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} {...props} />,
            }}
          >
            {analysis}
          </ReactMarkdown>
        </div>
      </motion.div>
    </Card>
  );
};


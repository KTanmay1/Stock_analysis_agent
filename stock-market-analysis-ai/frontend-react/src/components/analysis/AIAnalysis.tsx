import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Card } from '../ui/Card';

interface AIAnalysisProps {
  analysis: string;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ analysis }) => {
  if (!analysis || analysis === 'No AI analysis available.') {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8">
          <Brain className="w-12 h-12 mb-3 text-gray-600" />
          <p className="text-center text-gray-400">
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
          <Brain className="w-6 h-6 text-primary-400" />
          <h3 className="text-xl font-bold text-gray-100">
            AI Analysis
          </h3>
        </div>

        {/* Highlight boxes for target and stop loss if present */}
        {(hasTargetPrice || hasStopLoss) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {hasTargetPrice && (
              <div className="p-4 rounded-lg border bg-green-900/20 border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">
                    Target Price
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  Check analysis below for details
                </p>
              </div>
            )}
            {hasStopLoss && (
              <div className="p-4 rounded-lg border bg-red-900/20 border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-red-400">
                    Stop Loss
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  Check analysis below for details
                </p>
              </div>
            )}
          </div>
        )}

        {/* Analysis content */}
        <div className="prose prose-sm max-w-none prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-100" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-100" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-200" {...props} />,
              p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-gray-300" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-300" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-300" {...props} />,
              li: ({node, ...props}) => <li className="ml-4 text-gray-300" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-gray-100" {...props} />,
              code: ({node, className, children, ...props}: any) => {
                const isInline = !className;
                return isInline 
                  ? <code className="px-1.5 py-0.5 rounded text-sm font-mono bg-gray-800 text-blue-400" {...props}>{children}</code>
                  : <code className="block p-3 rounded-lg text-sm font-mono overflow-x-auto bg-gray-800 text-gray-300" {...props}>{children}</code>;
              },
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 pl-4 italic my-4 border-gray-600 text-gray-400" {...props} />,
              table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-700" {...props} /></div>,
              thead: ({node, ...props}) => <thead className="bg-gray-800" {...props} />,
              tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-700" {...props} />,
              tr: ({node, ...props}) => <tr {...props} />,
              th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300" {...props} />,
              td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-gray-400" {...props} />,
            }}
          >
            {analysis}
          </ReactMarkdown>
        </div>
      </motion.div>
    </Card>
  );
};


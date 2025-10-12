import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../ui/Card';

interface SectorChartProps {
  sectorPerformance: Record<string, number>;
}

export const SectorChart: React.FC<SectorChartProps> = ({ sectorPerformance }) => {
  const { darkMode } = useTheme();

  // Transform data for recharts
  const chartData = Object.entries(sectorPerformance)
    .map(([sector, performance]) => ({
      sector,
      performance: Number(performance.toFixed(2)),
    }))
    .sort((a, b) => b.performance - a.performance);

  const getBarColor = (value: number) => {
    return value >= 0 ? (darkMode ? '#4ade80' : '#10b981') : (darkMode ? '#f87171' : '#ef4444');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-3 shadow-lg`}>
          <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {data.payload.sector}
          </p>
          <p className={`text-sm ${data.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.value >= 0 ? '+' : ''}{data.value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Sector Performance (5 Days)
        </h2>
        
        <div className="w-full" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? '#374151' : '#e5e7eb'}
              />
              <XAxis
                dataKey="sector"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                label={{
                  value: 'Performance (%)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: darkMode ? '#9ca3af' : '#6b7280' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="performance" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.performance)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </Card>
  );
};


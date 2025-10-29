import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';

interface SectorChartProps {
  sectorPerformance: Record<string, number>;
}

export const SectorChart: React.FC<SectorChartProps> = ({ sectorPerformance }) => {
  // Transform data for recharts
  const chartData = Object.entries(sectorPerformance)
    .map(([sector, performance]) => ({
      sector,
      performance: Number(performance.toFixed(2)),
    }))
    .sort((a, b) => b.performance - a.performance);

  const getBarColor = (value: number) => {
    return value >= 0 ? '#4ade80' : '#f87171';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-100">
            {data.payload.sector}
          </p>
          <p className={`text-sm ${data.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-100">
          Sector Performance (5 Days)
        </h2>
        
        <div className="w-full" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
              />
              <XAxis
                dataKey="sector"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                label={{
                  value: 'Performance (%)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9ca3af' }
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


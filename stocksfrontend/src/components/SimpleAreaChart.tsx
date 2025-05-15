"use client";

import React from 'react';

interface DataPoint {
  date: string;
  value: number;
}

interface SimpleAreaChartProps {
  data: DataPoint[];
  color?: string;
  className?: string;
}

/**
 * A simple area chart component that avoids using Tremor's AreaChart
 * to prevent the wrapperStyle issue with React.Fragment.
 */
const SimpleAreaChart: React.FC<SimpleAreaChartProps> = ({ 
  data, 
  color = '#16a34a', // emerald-600 default 
  className = ''
}) => {
  if (!data || data.length === 0) return null;

  // Get min and max values for scaling
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // Create a simple SVG path for the area chart
  const width = 100; // percentage width
  const height = 100; // percentage height
  
  // Build the path
  let path = '';
  
  // Move to the first point at the bottom
  path += `M 0,${height} `;
  
  // Draw lines to each data point
  data.forEach((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const normalizedValue = range === 0 ? 0.5 : (point.value - min) / range;
    const y = height - (normalizedValue * height);
    path += `L ${x},${y} `;
  });
  
  // Close the path by going to the bottom right and back to start
  path += `L ${width},${height} L 0,${height}`;

  return (
    <div className={`w-full h-full ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <path
          d={path}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default SimpleAreaChart; 
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, Text } from "@tremor/react";
import { FaChartLine, FaChartBar, FaChevronDown } from "react-icons/fa";

interface StockChartProps {
  symbol: string;
  data: {
    date: string;
    close: number;
    open?: number;
    high?: number;
    low?: number;
    currency?: string;
  }[];
}

const StockChart: React.FC<StockChartProps> = ({ symbol, data }) => {
  const [timeRange, setTimeRange] = useState("1M");
  const [chartType, setChartType] = useState<"line" | "candle">("candle");
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine the currency symbol
  const currencySymbol = data[0]?.currency === 'INR' ? '₹' : '$';

  // Add missing OHLC data if not provided
  const enhancedData = data.map(item => ({
    ...item,
    open: item.open || item.close * 0.99, // Estimate if not provided
    high: item.high || item.close * 1.02,
    low: item.low || item.close * 0.98,
  }));

  // Update dimensions when window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        setDimensions({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight
        });
      }
    };
    
    // Initial update
    updateDimensions();
    
    // Listen for resize events
    window.addEventListener('resize', updateDimensions);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Add click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter data based on time range
  const filterData = () => {
    const currentDate = new Date();
    let filterDate = new Date();

    switch (timeRange) {
      case "1D":
        filterDate.setDate(currentDate.getDate() - 1);
        break;
      case "1W":
        filterDate.setDate(currentDate.getDate() - 7);
        break;
      case "1M":
        filterDate.setMonth(currentDate.getMonth() - 1);
        break;
      case "3M":
        filterDate.setMonth(currentDate.getMonth() - 3);
        break;
      case "6M":
        filterDate.setMonth(currentDate.getMonth() - 6);
        break;
      case "1Y":
        filterDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      case "5Y":
        filterDate.setFullYear(currentDate.getFullYear() - 5);
        break;
      default:
        filterDate.setMonth(currentDate.getMonth() - 1);
    }

    return enhancedData.filter(item => new Date(item.date) >= filterDate);
  };

  const filteredData = filterData();

  // Calculate if the trend is positive (last price > first price)
  const isPositive = filteredData.length > 1 && 
    filteredData[filteredData.length - 1].close > filteredData[0].close;

  // Calculate min/max price for y-axis scale
  const allPrices = filteredData.flatMap(item => [
    item.low || 0, 
    item.high || 0, 
    item.open || 0, 
    item.close
  ]);
  const minPrice = Math.floor(Math.min(...allPrices) * 0.995);
  const maxPrice = Math.ceil(Math.max(...allPrices) * 1.005);
  const priceRange = maxPrice - minPrice;

  // Function to calculate Simple Moving Average
  function calculateSMA(data: number[], window: number): number[] {
    if (data.length < window) {
      return [];
    }
    
    const sma: number[] = [];
    let sum = 0;
    
    // Initialize sum for the first window
    for (let i = 0; i < window; i++) {
      sum += data[i];
    }
    
    // Calculate SMA for each data point
    for (let i = window; i <= data.length; i++) {
      sma.push(sum / window);
      sum = sum - data[i - window] + (data[i] || 0);
    }
    
    return sma;
  }

  // Calculate the 20-day SMA for line chart
  const closePrices = filteredData.map(item => item.close);
  const smaWindow = 20;
  const smaValues = calculateSMA(closePrices, smaWindow);

  // Function to convert price to y coordinate
  const priceToY = (price: number, height: number) => {
    return height - ((price - minPrice) / priceRange) * height;
  };

  // Render candlestick chart
  const renderCandlestickChart = () => {
    const svgWidth = dimensions.width;
    const svgHeight = dimensions.height;
    const padding = { top: 20, right: 60, bottom: 40, left: 10 };
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;
    
    // Calculate candle width and spacing
    const availableWidth = chartWidth;
    const totalCandles = filteredData.length;
    const candleMaxWidth = 15; // Max width for a candle
    const candleWidth = Math.min(availableWidth / totalCandles * 0.7, candleMaxWidth);
    const candleSpacing = (availableWidth - (candleWidth * totalCandles)) / (totalCandles + 1);
    
    // Calculate SMA line points for SVG path
    const smaPoints = smaValues.map((value, i) => {
      const dataIndex = i + smaWindow - 1;
      if (dataIndex >= 0 && dataIndex < filteredData.length) {
        const x = padding.left + (dataIndex + 1) * candleSpacing + dataIndex * candleWidth + candleWidth / 2;
        const y = padding.top + priceToY(value, chartHeight);
        return `${x},${y}`;
      }
      return '';
    }).filter(Boolean).join(' ');

    // Generate price ticks for y-axis
    const numTicks = 5;
    const priceTicks = Array.from({ length: numTicks }, (_, i) => {
      const price = minPrice + (priceRange / (numTicks - 1)) * i;
      return {
        price: parseFloat(price.toFixed(2)),
        y: padding.top + priceToY(price, chartHeight)
      };
    });

    // Generate date ticks for x-axis (show a selection of dates)
    const dateTicks = [];
    if (filteredData.length > 0) {
      // Show evenly spaced date ticks
      const numDateTicks = Math.min(5, filteredData.length);
      for (let i = 0; i < numDateTicks; i++) {
        const index = Math.floor(i * (filteredData.length - 1) / (numDateTicks - 1));
        const dataPoint = filteredData[index];
        const x = padding.left + (index + 1) * candleSpacing + index * candleWidth + candleWidth / 2;
        
        // Format the date
        const date = new Date(dataPoint.date);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        dateTicks.push({ date: formattedDate, x });
      }
    }

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {/* Grid lines */}
        {priceTicks.map((tick, i) => (
          <line 
            key={`grid-${i}`}
            x1={padding.left} 
            y1={tick.y} 
            x2={svgWidth - padding.right} 
            y2={tick.y} 
            stroke="#374151" 
            strokeWidth="1" 
            strokeDasharray="4"
          />
        ))}
        
        {/* Candlesticks */}
        {filteredData.map((item, i) => {
          const candleX = padding.left + (i + 1) * candleSpacing + i * candleWidth;
          const open = item.open || 0;
          const close = item.close;
          const high = item.high || 0;
          const low = item.low || 0;
          
          const isUp = close >= open;
          const candleColor = isUp ? "#10b981" : "#ef4444"; // Green for up, red for down
          
          const openY = padding.top + priceToY(open, chartHeight);
          const closeY = padding.top + priceToY(close, chartHeight);
          const highY = padding.top + priceToY(high, chartHeight);
          const lowY = padding.top + priceToY(low, chartHeight);
          
          // Ensure body has minimum height for visibility
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
        
        return (
            <g 
              key={`candle-${i}`} 
              onMouseEnter={() => setHoveredCandle(i)}
              onMouseLeave={() => setHoveredCandle(null)}
            >
              {/* Wick (high to low line) */}
              <line 
                x1={candleX + candleWidth / 2} 
                y1={highY} 
                x2={candleX + candleWidth / 2} 
                y2={lowY} 
                stroke={candleColor} 
                strokeWidth="1"
              />
              
              {/* Body (open to close box) */}
              <rect 
                x={candleX} 
                y={bodyY} 
                width={candleWidth} 
                height={bodyHeight} 
                fill={candleColor} 
                fillOpacity={isUp ? 0.8 : 0.8}
                stroke={candleColor}
                strokeWidth="1"
              />
              
              {/* Tooltip */}
              {hoveredCandle === i && (
                <g>
                  <rect
                    x={candleX + candleWidth + 5}
                    y={highY - 70}
                    width={120}
                    height={80}
                    rx={4}
                    fill="#1f2937"
                    stroke="#374151"
                  />
                  <text x={candleX + candleWidth + 15} y={highY - 50} fill="#ffffff" fontSize="12">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </text>
                  <text x={candleX + candleWidth + 15} y={highY - 35} fill="#9ca3af" fontSize="10">Open: {currencySymbol}{open.toFixed(2)}</text>
                  <text x={candleX + candleWidth + 15} y={highY - 20} fill="#9ca3af" fontSize="10">High: {currencySymbol}{high.toFixed(2)}</text>
                  <text x={candleX + candleWidth + 15} y={highY - 5} fill="#9ca3af" fontSize="10">Low: {currencySymbol}{low.toFixed(2)}</text>
                  <text x={candleX + candleWidth + 15} y={highY + 10} fill="#9ca3af" fontSize="10">Close: {currencySymbol}{close.toFixed(2)}</text>
                </g>
              )}
            </g>
          );
        })}
        
        {/* SMA line */}
        {smaValues.length > 0 && (
          <polyline
            points={smaPoints}
            fill="none"
            stroke="#eab308" // Yellow color for SMA
            strokeWidth="2"
          />
        )}
        
        {/* Price axis (right) */}
        {priceTicks.map((tick, i) => (
          <g key={`price-${i}`}>
            <text 
              x={svgWidth - padding.right + 10} 
              y={tick.y + 4} 
              fontSize="10" 
              fill="#9ca3af" 
              textAnchor="start"
            >
              {currencySymbol}{tick.price.toFixed(2)}
            </text>
          </g>
        ))}
        
        {/* Date axis (bottom) */}
        {dateTicks.map((tick, i) => (
          <g key={`date-${i}`}>
            <text 
              x={tick.x} 
              y={svgHeight - padding.bottom + 20} 
              fontSize="10" 
              fill="#9ca3af" 
              textAnchor="middle"
            >
              {tick.date}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  // Render line chart
  const renderLineChart = () => {
    const svgWidth = dimensions.width;
    const svgHeight = dimensions.height;
    const padding = { top: 20, right: 60, bottom: 40, left: 10 };
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;
    
    // Generate line points
    const points = filteredData.map((item, i) => {
      const x = padding.left + chartWidth * (i / (filteredData.length - 1));
      const y = padding.top + priceToY(item.close, chartHeight);
      return `${x},${y}`;
    }).join(' ');
    
    // Generate area points (for fill)
    const areaPoints = [
      // Start at bottom left
      `${padding.left},${padding.top + chartHeight}`,
      // Add all points from the line
      points,
      // End at bottom right
      `${padding.left + chartWidth},${padding.top + chartHeight}`
    ].join(' ');
    
    // Calculate SMA line points
    const smaPoints = smaValues.map((value, i) => {
      const dataIndex = i + smaWindow - 1;
      if (dataIndex >= 0 && dataIndex < filteredData.length) {
        const x = padding.left + chartWidth * (dataIndex / (filteredData.length - 1));
        const y = padding.top + priceToY(value, chartHeight);
        return `${x},${y}`;
      }
      return '';
    }).filter(Boolean).join(' ');
    
    // Generate price ticks for y-axis
    const numTicks = 5;
    const priceTicks = Array.from({ length: numTicks }, (_, i) => {
      const price = minPrice + (priceRange / (numTicks - 1)) * i;
      return {
        price: parseFloat(price.toFixed(2)),
        y: padding.top + priceToY(price, chartHeight)
      };
    });

    // Generate date ticks for x-axis
    const numDateTicks = Math.min(5, filteredData.length);
    const dateTicks = Array.from({ length: numDateTicks }, (_, i) => {
      const dataIndex = Math.floor(i * (filteredData.length - 1) / (numDateTicks - 1));
      const date = new Date(filteredData[dataIndex].date);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const x = padding.left + chartWidth * (dataIndex / (filteredData.length - 1));
      return { date: formattedDate, x };
    });

    const lineColor = isPositive ? "#10b981" : "#ef4444"; // Green for up, red for down
    const fillColor = isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)";

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {/* Grid lines */}
        {priceTicks.map((tick, i) => (
          <line 
            key={`grid-${i}`}
            x1={padding.left} 
            y1={tick.y} 
            x2={svgWidth - padding.right} 
            y2={tick.y} 
            stroke="#374151" 
            strokeWidth="1" 
            strokeDasharray="4"
          />
        ))}
        
        {/* Area fill */}
        <polygon 
          points={areaPoints} 
          fill={fillColor}
        />
        
        {/* Price line */}
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
        />
        
        {/* SMA line */}
        {smaValues.length > 0 && (
          <polyline
            points={smaPoints}
            fill="none"
            stroke="#eab308" // Yellow color for SMA
            strokeWidth="2"
          />
        )}
        
        {/* Data points (invisible but useful for hover events) */}
        {filteredData.map((item, i) => {
          const x = padding.left + chartWidth * (i / (filteredData.length - 1));
          const y = padding.top + priceToY(item.close, chartHeight);
      
      return (
            <g key={`point-${i}`}>
              <circle 
                cx={x} 
                cy={y} 
                r="4"
                fill={lineColor}
                fillOpacity="0"
                onMouseEnter={() => setHoveredCandle(i)}
                onMouseLeave={() => setHoveredCandle(null)}
              />
              
              {/* Tooltip */}
              {hoveredCandle === i && (
                <g>
                  <rect
                    x={x + 5}
                    y={y - 40}
                    width={120}
                    height={50}
                    rx={4}
                    fill="#1f2937"
                    stroke="#374151"
                  />
                  <text x={x + 15} y={y - 20} fill="#ffffff" fontSize="12">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </text>
                  <text x={x + 15} y={y} fill="#9ca3af" fontSize="12">
                    Price: {currencySymbol}{item.close.toFixed(2)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        
        {/* Price axis (right) */}
        {priceTicks.map((tick, i) => (
          <g key={`price-${i}`}>
            <text 
              x={svgWidth - padding.right + 10} 
              y={tick.y + 4} 
              fontSize="10" 
              fill="#9ca3af" 
              textAnchor="start"
            >
              {currencySymbol}{tick.price.toFixed(2)}
            </text>
          </g>
        ))}
        
        {/* Date axis (bottom) */}
        {dateTicks.map((tick, i) => (
          <g key={`date-${i}`}>
            <text 
              x={tick.x} 
              y={svgHeight - padding.bottom + 20} 
              fontSize="10" 
              fill="#9ca3af" 
              textAnchor="middle"
            >
              {tick.date}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <Card className="p-4 bg-gray-950 border border-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <Text className="font-medium text-lg text-white">{symbol} Chart</Text>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex border border-gray-700 rounded-lg overflow-hidden">
            <button 
              onClick={() => setChartType("line")}
              className={`px-3 py-1.5 flex items-center text-sm ${chartType === "line" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              <FaChartLine className="mr-1.5" />
              Line
            </button>
            <button 
              onClick={() => setChartType("candle")}
              className={`px-3 py-1.5 flex items-center text-sm ${chartType === "candle" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              <FaChartBar className="mr-1.5" />
              Candle
            </button>
          </div>

          {/* Custom modern dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className="w-24 py-1.5 px-3 bg-gray-800 text-white border border-gray-700 rounded-lg flex items-center justify-between text-sm hover:bg-gray-700 transition-colors"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span>{timeRange}</span>
              <FaChevronDown className={`ml-1 text-gray-400 h-3 w-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div className="absolute z-20 mt-1 w-24 rounded-md shadow-lg bg-gray-800 border border-gray-700 overflow-hidden">
                {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"].map((range) => (
                  <button
                    key={range}
                    className={`w-full text-left text-sm px-4 py-2 hover:bg-gray-700 transition-colors ${timeRange === range ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                    onClick={() => {
                      setTimeRange(range);
                      setDropdownOpen(false);
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-[400px] mt-4 bg-black rounded-lg p-4" ref={chartRef}>
        {filteredData.length > 1 && (chartType === 'candle' ? renderCandlestickChart() : renderLineChart())}
      </div>
    </Card>
  );
};

export default StockChart; 
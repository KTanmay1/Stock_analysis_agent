"use client";

import React, { useState } from "react";
import { Card, Text, Title, Grid, Col, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import SearchBar from "@/components/SearchBar";
import StockChart from "@/components/StockChart";
import TechnicalAnalysis from "@/components/TechnicalAnalysis";

// Define the TechnicalIndicator type locally
interface TechnicalIndicator {
  name: string;
  value: string | number;
  signal: "buy" | "sell" | "neutral";
  description?: string;
}

// Mock data for development
const mockChartData = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (90 - i));
  
  // Create a realistic price movement pattern
  const basePrice = 150;
  const dayFactor = i / 15;
  const variation = Math.sin(dayFactor) * 20 + Math.cos(dayFactor * 2) * 10;
  const trendFactor = i / 30;
  const close = basePrice + variation + trendFactor * 15;
  
  return {
    date: date.toISOString().split('T')[0],
    close: close,
  };
});

// Properly type the technical indicators
const mockTechnicalIndicators: TechnicalIndicator[] = [
  {
    name: "RSI (14)",
    value: 62.45,
    signal: "neutral",
    description: "Relative Strength Index. Values > 70 may indicate overbought conditions, values < 30 may indicate oversold conditions.",
  },
  {
    name: "MACD",
    value: "3.25 (1.42)",
    signal: "buy",
    description: "Moving Average Convergence Divergence. Positive values suggest bullish momentum.",
  },
  {
    name: "SMA (50)",
    value: 145.87,
    signal: "buy",
    description: "50-day Simple Moving Average. Price above SMA indicates bullish trend.",
  },
  {
    name: "EMA (20)",
    value: 155.32,
    signal: "buy",
    description: "20-day Exponential Moving Average. More weight to recent prices than SMA.",
  },
  {
    name: "Bollinger Bands",
    value: "157.23 / 145.67",
    signal: "neutral",
    description: "Price near upper band may indicate overbought conditions, near lower band may indicate oversold conditions.",
  },
  {
    name: "Stochastic Oscillator",
    value: 82.13,
    signal: "sell",
    description: "Values > 80 may indicate overbought conditions, values < 20 may indicate oversold conditions.",
  },
  {
    name: "ATR (14)",
    value: 2.53,
    signal: "neutral",
    description: "Average True Range. Measures market volatility.",
  },
  {
    name: "OBV",
    value: "12.4M",
    signal: "buy",
    description: "On-Balance Volume. Positive values suggest accumulation (buying pressure).",
  },
  {
    name: "ADX (14)",
    value: 27.65,
    signal: "buy",
    description: "Average Directional Index. Values > 25 indicate a strong trend.",
  },
];

const mockSummary = {
  buySignals: 5,
  sellSignals: 1,
  neutralSignals: 3,
  recommendation: "Buy" as const,
};

const AnalysisPage = () => {
  const [symbol, setSymbol] = useState("AAPL");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setSymbol(query.toUpperCase());
      setIsSearching(false);
    }, 500);
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl mb-4">Technical Analysis</h1>
        <div className="max-w-xl">
          <SearchBar onSearch={handleSearch} placeholder="Enter a stock symbol (e.g. AAPL)" />
        </div>
      </div>

      {isSearching ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Title>{symbol} Analysis</Title>
            <Text>Analyze technical indicators and price movements</Text>
          </div>

          <TabGroup>
            <TabList>
              <Tab>Chart</Tab>
              <Tab>Technical Indicators</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <div className="mt-4">
                  <StockChart symbol={symbol} data={mockChartData} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className="mt-4">
                  <TechnicalAnalysis 
                    symbol={symbol} 
                    indicators={mockTechnicalIndicators} 
                    summary={mockSummary}
                  />
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>

          <div className="mt-8">
            <Card>
              <Title>AI Analysis Insights</Title>
              <Text className="mt-2">
                Based on the current technical indicators and market conditions, our AI analysis suggests a {mockSummary.recommendation.toLowerCase()} position for {symbol}. The stock shows positive momentum with 5 buy signals against 1 sell signal, indicating potential upward movement in the near term.
              </Text>
              <Text className="mt-4">
                Key indicators supporting this analysis include positive MACD, price above the 50-day SMA, and strong OBV suggesting institutional buying. However, the stochastic oscillator indicates potential overbought conditions that should be monitored.
              </Text>
              <Text className="mt-4">
                This analysis is for informational purposes only and should not be considered investment advice.
              </Text>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisPage; 
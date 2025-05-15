"use client";

import React, { useState, useEffect } from "react";
import { Card, Title, Text, Grid, Col, TabGroup, TabList, TabPanel, TabPanels, Metric, Flex, Badge, ProgressBar } from "@tremor/react";
import StockChart from "@/components/StockChart";
import { FaChartLine, FaCalendarAlt, FaNewspaper, FaExchangeAlt, FaArrowUp, FaArrowDown, FaRobot, FaLightbulb } from "react-icons/fa";
import TechnicalAnalysis from "@/components/TechnicalAnalysis";
import PercentChangeDisplay from "@/components/PercentChangeDisplay";
import SentimentBadge from "@/components/SentimentBadge";
import stockService from "@/services/api";
import { StockAnalysis, StockData, TechnicalData, NewsItem } from "@/types/stock";

interface StockDetailsPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

// Keep the chart data mock for now, since the backend doesn't provide historical chart data yet
const mockChartData = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (90 - i));
  
  // Create a realistic price movement pattern
  const basePrice = 150;
  const dayFactor = i / 15;
  const variation = Math.sin(dayFactor) * 20 + Math.cos(dayFactor * 2) * 10;
  const trendFactor = i / 30;
  const close = basePrice + variation + trendFactor * 15;
  
  // Generate realistic OHLC data
  const volatility = 2 + Math.random() * 3;  // Random volatility between 2-5%
  const priceRange = close * (volatility / 100);
  
  // Generate random intraday movement, ensuring open and close are not the same
  const openOffset = (Math.random() * 2 - 1) * priceRange;
  const open = close - openOffset;
  
  // Ensure high is the highest price and low is the lowest
  const tempHigh = Math.max(open, close) + Math.random() * priceRange * 0.5;
  const tempLow = Math.min(open, close) - Math.random() * priceRange * 0.5;
  const high = parseFloat(tempHigh.toFixed(2));
  const low = parseFloat(tempLow.toFixed(2));
  
  return {
    date: date.toISOString().split('T')[0],
    open: parseFloat(open.toFixed(2)),
    high,
    low,
    close: parseFloat(close.toFixed(2)),
  };
});

// Transform stock data from API to UI-friendly format
const transformStockData = (stockAnalysis: StockAnalysis) => {
  const { stock_data, technical_data } = stockAnalysis;
  
  return {
    symbol: stock_data.symbol,
    name: stock_data.symbol.replace('.NS', ''),  // We can improve this later
    price: stock_data.current_price,
    change: calculateChange(stock_data, technical_data),
    changePercent: calculateChangePercent(stock_data, technical_data),
    volume: typeof stock_data.volume === 'number' ? stock_data.volume : 0,
    marketCap: formatLargeNumber(stock_data.market_cap),
    peRatio: stock_data.pe_ratio,
    dividend: 0, // Not provided by API
    yearHigh: stock_data['52_week_high'],
    yearLow: stock_data['52_week_low'],
    avgVolume: typeof stock_data.volume === 'number' ? stock_data.volume : 0, // Not provided by API
    eps: 0, // Not provided by API
    beta: 0, // Not provided by API
    sector: "N/A", // Not provided by API
    industry: "N/A", // Not provided by API
    sma20: technical_data?.sma20 || 0,
    sma50: technical_data?.sma50 || 0,
    rsi: technical_data?.rsi || 0,
    trend: technical_data?.trend || "N/A",
    rsiSignal: technical_data?.rsi_signal || "N/A",
  };
};

// Helper function to calculate change based on available data
const calculateChange = (stock: StockData, technical?: TechnicalData) => {
  if (technical && technical.last_close) {
    return stock.current_price - technical.last_close;
  }
  return 0;
};

// Helper function to calculate percent change
const calculateChangePercent = (stock: StockData, technical?: TechnicalData) => {
  if (technical && technical.last_close) {
    return ((stock.current_price - technical.last_close) / technical.last_close) * 100;
  }
  return 0;
};

// Helper function to format large numbers (e.g., market cap)
const formatLargeNumber = (num: number | string) => {
  if (typeof num === 'string') {
    if (num === 'N/A') return num;
    num = parseFloat(num);
  }
  
  if (typeof num !== 'number' || isNaN(num)) return 'N/A';
  
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  
  return num.toString();
};

// Function to determine news sentiment based on content
const determineSentiment = (newsItem: NewsItem): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = ['increase', 'rise', 'gain', 'growth', 'positive', 'up', 'surge', 'rally', 'strong', 'higher'];
  const negativeWords = ['decrease', 'drop', 'fall', 'decline', 'negative', 'down', 'lower', 'weak', 'poor', 'loss'];
  
  const text = (newsItem.title + ' ' + newsItem.snippet).toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (text.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (text.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

const StockDetailsPage: React.FC<StockDetailsPageProps> = ({ params }) => {
  // Unwrap params with React.use()
  const { symbol } = React.use(params);
  
  const [isLoading, setIsLoading] = useState(true);
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [stockAnalysis, setStockAnalysis] = useState<StockAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<"chart" | "stats" | "news" | "insights">("chart");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Clean the symbol (remove .NS if present)
        const cleanSymbol = symbol.replace('.NS', '');
        
        // Fetch stock analysis data from the API
        const analysisData = await stockService.analyzeStock(cleanSymbol);
        
        if (analysisData.error) {
          setError(analysisData.error);
          setIsLoading(false);
          return;
        }
        
        setStockAnalysis(analysisData);
        
        // Transform the data for UI display
        const transformedData = transformStockData(analysisData);
        setStockInfo(transformedData);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !stockInfo || !stockAnalysis) {
    return (
      <div className="text-center py-12">
        <Title>Stock Data Error</Title>
        <Text>{error || `Unable to find stock information for ${symbol}`}</Text>
      </div>
    );
  }

  const isPositive = stockInfo.change >= 0;
  const changeColor = isPositive ? "emerald" : "rose";

  // Format news data
  const newsItems = stockAnalysis.news_data.map((item, index) => ({
    id: index,
    title: item.title,
    snippet: item.snippet,
    source: "News", // Source not provided by API
    date: new Date().toISOString().split('T')[0], // Date not provided by API
    sentiment: determineSentiment(item),
    url: "#", // URL not provided by API
  }));

  const renderTabContent = () => {
    switch (activeTab) {
      case "chart":
        return (
          <div className="mt-6">
            <StockChart symbol={stockInfo.symbol} data={mockChartData} />
          </div>
        );
      case "stats":
        return (
          <div className="mt-6 p-1 rounded-lg bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-950/30 dark:to-teal-950/30">
            <Card className="p-4 border-0 shadow-sm">
              <Title className="flex items-center gap-2">
                <FaCalendarAlt className="text-green-600 dark:text-green-400" />
                <span>Key Statistics</span>
              </Title>
              <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6 mt-6">
                {[
                  { label: "Market Cap", value: stockInfo.marketCap, icon: "💰" },
                  { label: "P/E Ratio", value: stockInfo.peRatio, icon: "📊" },
                  { label: "Current Price", value: `₹${stockInfo.price.toFixed(2)}`, icon: "💸" },
                  { label: "52-Week High", value: `₹${typeof stockInfo.yearHigh === 'number' ? stockInfo.yearHigh.toFixed(2) : stockInfo.yearHigh}`, icon: "📈" },
                  { label: "52-Week Low", value: `₹${typeof stockInfo.yearLow === 'number' ? stockInfo.yearLow.toFixed(2) : stockInfo.yearLow}`, icon: "📉" },
                  { label: "SMA20", value: stockInfo.sma20.toFixed(2), icon: "📊" },
                  { label: "SMA50", value: stockInfo.sma50.toFixed(2), icon: "📊" },
                  { label: "RSI", value: stockInfo.rsi.toFixed(2), icon: "📋" },
                  { label: "Trend", value: stockInfo.trend, icon: "📈" },
                ].map((stat, index) => (
                  <div key={index} className="p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{stat.icon}</span>
                      <Text className="text-gray-500">{stat.label}</Text>
                    </div>
                    <p className="text-lg font-semibold mt-1">{stat.value}</p>
                  </div>
                ))}
              </Grid>
            </Card>
          </div>
        );
      case "news":
        return (
          <div className="mt-6 p-1 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30">
            <Card className="p-4 border-0 shadow-sm">
              <Title className="flex items-center gap-2">
                <FaNewspaper className="text-purple-600 dark:text-purple-400" />
                <span>Latest News</span>
              </Title>
              <div className="mt-6 space-y-4">
                {newsItems.length > 0 ? (
                  newsItems.map((news) => (
                    <div 
                      key={news.id}
                      className="block p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{news.title}</h3>
                          <p className="mt-2 text-gray-600 dark:text-gray-400">{news.snippet}</p>
                        </div>
                        <SentimentBadge 
                          sentiment={news.sentiment as "positive" | "negative" | "neutral"}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">No news available for this stock</div>
                )}
              </div>
            </Card>
          </div>
        );
      case "insights":
        return (
          <div className="mt-6">
            <Card className="p-6 bg-gray-950 border border-gray-800 shadow-lg rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-500/20 p-2 rounded-full">
                  <FaLightbulb className="text-amber-500 text-xl" />
                </div>
                <span className="text-xl font-bold text-white">AI-Generated Insights</span>
              </div>
              
              <div className="space-y-6">
                <div className="p-5 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-500/10 p-2 rounded-full mt-1 flex-shrink-0">
                      <FaRobot className="text-blue-400 text-xl" />
                    </div>
                    <div className="text-gray-200 leading-relaxed whitespace-pre-line">
                      {stockAnalysis.analysis}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-1 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30">
        <Card className="p-6 border-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div className="mb-4 md:mb-0">
              <Title className="text-3xl">{stockInfo.symbol}</Title>
              <Text className="text-xl text-gray-500">{stockInfo.name}</Text>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-3xl font-bold mb-1">₹{stockInfo.price.toFixed(2)}</div>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center text-${changeColor}-600`}>
                  {isPositive ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                  <span className="font-medium">₹{Math.abs(stockInfo.change).toFixed(2)}</span>
                </div>
                <PercentChangeDisplay value={stockInfo.changePercent} />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <TabGroup>
              <TabList className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex overflow-x-auto pb-1 space-x-1 md:space-x-4">
                  <div 
                    onClick={() => setActiveTab("chart")}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors ${activeTab === "chart" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
                  >
                    <FaChartLine />
                    <span>Chart</span>
                  </div>
                  <div 
                    onClick={() => setActiveTab("stats")}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors ${activeTab === "stats" ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
                  >
                    <FaCalendarAlt />
                    <span>Statistics</span>
                  </div>
                  <div 
                    onClick={() => setActiveTab("news")}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors ${activeTab === "news" ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
                  >
                    <FaNewspaper />
                    <span>News</span>
                  </div>
                  <div 
                    onClick={() => setActiveTab("insights")}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors ${activeTab === "insights" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
                  >
                    <FaRobot />
                    <span>AI Insights</span>
                  </div>
                </div>
              </TabList>
              
              {renderTabContent()}
            </TabGroup>
          </div>
        </Card>
      </div>
      
      {activeTab !== "insights" && (
        <TechnicalAnalysis 
          symbol={stockInfo.symbol}
          indicators={[
            {
              name: "SMA 20",
              value: stockInfo.sma20.toFixed(2),
              signal: stockInfo.price > stockInfo.sma20 ? "buy" : "sell",
              description: "Simple Moving Average (20 days)"
            },
            {
              name: "SMA 50",
              value: stockInfo.sma50.toFixed(2),
              signal: stockInfo.price > stockInfo.sma50 ? "buy" : "sell",
              description: "Simple Moving Average (50 days)"
            },
            {
              name: "RSI",
              value: stockInfo.rsi.toFixed(2),
              signal: stockInfo.rsi < 30 ? "buy" : stockInfo.rsi > 70 ? "sell" : "neutral",
              description: "Relative Strength Index"
            },
            {
              name: "Price vs SMA20",
              value: `${((stockInfo.price - stockInfo.sma20) / stockInfo.sma20 * 100).toFixed(2)}%`,
              signal: stockInfo.price > stockInfo.sma20 ? "buy" : "sell",
              description: "Price deviation from 20-day moving average"
            },
            {
              name: "SMA 20 vs SMA 50",
              value: stockInfo.sma20 > stockInfo.sma50 ? "Bullish" : "Bearish",
              signal: stockInfo.sma20 > stockInfo.sma50 ? "buy" : "sell",
              description: "Golden Cross (SMA20 > SMA50) indicates bullish trend"
            },
            {
              name: "Trend",
              value: stockInfo.trend,
              signal: stockInfo.trend.toLowerCase().includes("up") ? "buy" : 
                     stockInfo.trend.toLowerCase().includes("down") ? "sell" : "neutral",
              description: "Overall price trend"
            }
          ]}
          summary={{
            buySignals: stockInfo.price > stockInfo.sma20 && stockInfo.price > stockInfo.sma50 ? 2 : 
                        stockInfo.price > stockInfo.sma20 || stockInfo.price > stockInfo.sma50 ? 1 : 0,
            sellSignals: stockInfo.price < stockInfo.sma20 && stockInfo.price < stockInfo.sma50 ? 2 : 
                         stockInfo.price < stockInfo.sma20 || stockInfo.price < stockInfo.sma50 ? 1 : 0,
            neutralSignals: 1,
            recommendation: stockInfo.price > stockInfo.sma20 && stockInfo.price > stockInfo.sma50 ? "Buy" : 
                           stockInfo.price < stockInfo.sma20 && stockInfo.price < stockInfo.sma50 ? "Sell" : "Neutral"
          }}
        />
      )}
    </div>
  );
};

export default StockDetailsPage; 
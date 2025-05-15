"use client";

import React, { useEffect, useState } from "react";
import { Card, Title, Text, Grid, Col, Metric } from "@tremor/react";
import StockCard from "@/components/StockCard";
import MarketMovers from "@/components/MarketMovers";
import MarketIndices from "@/components/MarketIndices";
import MarketNews from "@/components/MarketNews";
import SimpleAreaChart from "@/components/SimpleAreaChart";
import PercentChangeDisplay from "@/components/PercentChangeDisplay";
import Link from "next/link";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import stockService from "@/services/api";
import { TrendingStocksData, TrendingStock } from "@/types/stock";

// Add stock name mapping for common stocks
const stockNameMapping: Record<string, string> = {
  "SBIN": "State Bank of India",
  "RELIANCE": "Reliance Industries Ltd.",
  "TCS": "Tata Consultancy Services Ltd.",
  "INFY": "Infosys Ltd.",
  "HDFCBANK": "HDFC Bank Ltd.",
  "BHARTIARTL": "Bharti Airtel Ltd.",
  "ICICIBANK": "ICICI Bank Ltd.",
  "ITC": "ITC Ltd.",
  "KOTAKBANK": "Kotak Mahindra Bank Ltd.",
  // Add more mappings as needed
};

// Fallback function to generate a name if it's not in our mapping
const getStockName = (symbol: string): string => {
  return stockNameMapping[symbol] || `${symbol} Stock`;
};

// ErrorBoundary wrapper component
const ErrorDisplay = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Caught client-side error:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <Card className="p-4 my-4 border-l-4 border-yellow-500">
        <Text className="text-yellow-700">
          Something went wrong loading this component. Please refresh the page or try again later.
        </Text>
      </Card>
    );
  }

  return <>{children}</>;
};

const Dashboard = () => {
  const [trendingData, setTrendingData] = useState<TrendingStocksData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        setLoading(true);
        const data = await stockService.getTrendingStocks();
        
        // Validate data structure before processing
        if (!data) {
          throw new Error('No trending data received');
        }
        
        // Handle both API response structures
        let processedData: TrendingStocksData = { ...data };
        
        // Process top_movers if available
        if (data.top_movers && Array.isArray(data.top_movers)) {
          processedData.top_movers = data.top_movers.map(stock => ({
            ...stock,
            name: getStockName(stock.symbol),
            price: stock.price || stock.current_price || 0,
            change_percent: stock.change_percent || stock.changePct || stock.performance_5d || 0
          }));
        }
        
        // Process most_active if available
        if (data.most_active && Array.isArray(data.most_active)) {
          processedData.most_active = data.most_active.map(stock => ({
            ...stock,
            name: getStockName(stock.symbol),
            price: stock.price || stock.current_price || 0,
            change_percent: stock.change_percent || stock.changePct || stock.performance_5d || 0
          }));
        }
        
        // Handle trending_stocks if that's what the API returns
        if (data.trending_stocks && Array.isArray(data.trending_stocks)) {
          processedData.most_active = data.trending_stocks.map(stock => ({
            ...stock,
            name: getStockName(stock.symbol),
            price: stock.price || stock.current_price || 0,
            change_percent: stock.change_percent || stock.changePct || stock.performance_5d || 0
          }));
        }
        
        setTrendingData(processedData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch trending stocks:", err);
        setError(err instanceof Error ? err.message : "Failed to load trending stocks data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingStocks();
  }, []);

  // Handle case where there's no data structure available
  const getActiveStocks = () => {
    if (!trendingData) return [];
    
    if (trendingData.most_active && Array.isArray(trendingData.most_active)) {
      return trendingData.most_active;
    }
    
    if (trendingData.trending_stocks && Array.isArray(trendingData.trending_stocks)) {
      return trendingData.trending_stocks;
    }
    
    return [];
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold md:text-3xl">Market Overview</h1>
      
      {/* Market Indices with error boundary */}
      <ErrorDisplay>
        <MarketIndices />
      </ErrorDisplay>

      {/* Popular Stocks - Most Active from API */}
      <div>
        <Text className="mb-2">Popular Stocks</Text>
        {loading ? (
          <div className="text-center py-8">Loading stock data...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : getActiveStocks().length > 0 ? (
          <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
            {getActiveStocks().slice(0, 4).map((stock) => {
              // Safely get the values we need with fallbacks
              const price = stock.price ?? stock.current_price ?? 0;
              const changePercent = stock.change_percent ?? stock.changePct ?? stock.performance_5d ?? 0;
              
              return (
                <Card key={stock.symbol} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/stocks/${stock.symbol}`} className="text-lg font-medium hover:text-blue-600">
                        {stock.symbol}
                      </Link>
                      <Text className="text-sm text-gray-500 truncate">{stock.name || getStockName(stock.symbol)}</Text>
                    </div>
                    <PercentChangeDisplay 
                      value={changePercent} 
                      className="text-sm font-medium"
                    />
                  </div>
                  <Metric className="mt-2">₹{price.toFixed(2)}</Metric>
                  <div className="flex justify-between items-center mt-3">
                    <div className={`flex items-center text-sm ${changePercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {changePercent >= 0 ? <FaArrowUp className="mr-1" size={12} /> : <FaArrowDown className="mr-1" size={12} />}
                      ₹{Math.abs((price * changePercent / 100)).toFixed(2)}
                    </div>
                    {stock.volume && (
                      <Text className="text-xs text-gray-500">
                        Vol: {(stock.volume / 1000000).toFixed(1)}M
                      </Text>
                    )}
                  </div>
                </Card>
              );
            })}
          </Grid>
        ) : (
          <div className="text-center py-8">No active stocks data available</div>
        )}
      </div>

      {/* Market Movers with error boundary */}
      <ErrorDisplay>
        <MarketMovers />
      </ErrorDisplay>

      {/* Market News with error boundary */}
      <ErrorDisplay>
        <MarketNews limit={5} />
      </ErrorDisplay>
    </div>
  );
};

export default Dashboard; 
"use client";

import React, { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import StockCard from "@/components/StockCard";
import { Card, Text, Title, Grid } from "@tremor/react";
import { FaSearch, FaHistory } from "react-icons/fa";
import stockService from "@/services/api";
import { TrendingStock } from "@/types/stock";
import { useRouter } from "next/navigation";

// Add stock name mapping for common stocks (can be moved to a shared utility)
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
};

// Fallback function to generate a name if it's not in our mapping
const getStockName = (symbol: string): string => {
  return stockNameMapping[symbol] || `${symbol} Stock`;
};

// Define a type for stock search results
interface StockSearchResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

const SearchPage = () => {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<StockSearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [popularStocks, setPopularStocks] = useState<StockSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    // Fetch popular stocks on load
    const fetchPopularStocks = async () => {
      try {
        setIsLoading(true);
        const trendingData = await stockService.getTrendingStocks();
        
        // Transform trending stocks to the format expected by StockCard
        const transformedStocks = trendingData.most_active.map(stock => {
          // Ensure we have the required values
          const price = stock.price ?? stock.current_price;
          const changePercent = stock.change_percent ?? stock.performance_5d;
          const name = stock.name || getStockName(stock.symbol);
          
          return {
            symbol: stock.symbol,
            name,
            price,
            change: price * (changePercent / 100), // Approximate based on percent
            changePercent,
            volume: stock.volume ?? stock.avg_volume
          };
        });
        
        setPopularStocks(transformedStocks);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch popular stocks:", err);
        setError("Failed to load popular stocks. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchPopularStocks();
  }, []);

  const handleSearch = (query: string) => {
    // Clean the query
    const cleanQuery = query.trim().toUpperCase();
    
    if (!cleanQuery) return;
    
    setIsSearching(true);
    
    // Navigate directly to the stock page if it looks like a stock symbol
    if (/^[A-Z]{2,}$/.test(cleanQuery)) {
      // Save to recent searches
      saveToRecentSearches(cleanQuery);
      // Redirect to stock page
      router.push(`/stocks/${cleanQuery}`);
      return;
    }
    
    // Otherwise, perform search against popular stocks
    // In a real implementation, this would search using an API endpoint
    setTimeout(() => {
      // For now, filter the popular stocks
      const results = popularStocks.filter(
        stock => 
          stock.symbol.toUpperCase().includes(cleanQuery) ||
          stock.name.toUpperCase().includes(cleanQuery)
      );
      
      setSearchResults(results);
      
      // Save to recent searches if we have results
      if (results.length > 0) {
        saveToRecentSearches(cleanQuery);
      }
      
      setIsSearching(false);
    }, 300);
  };

  const saveToRecentSearches = (query: string) => {
    // Add to recent searches, avoiding duplicates and keeping only last 5
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold md:text-3xl mb-4">Find Stocks</h1>
        <div className="mx-auto">
          <SearchBar onSearch={handleSearch} placeholder="Search for stocks (e.g. RELIANCE, INFY)" />
        </div>
      </div>

      {isSearching ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : searchResults ? (
        <div>
          <Text className="mb-4">Search Results</Text>
          {searchResults.length === 0 ? (
            <Card className="text-center py-8">
              <div className="flex flex-col items-center">
                <FaSearch className="text-gray-400 text-4xl mb-4" />
                <Title>No results found</Title>
                <Text className="mt-1">Try another search term</Text>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((stock) => (
                <StockCard 
                  key={stock.symbol} 
                  symbol={stock.symbol} 
                  name={stock.name} 
                  price={stock.price} 
                  change={stock.change} 
                  changePercent={stock.changePercent} 
                  volume={stock.volume || 0} 
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FaHistory className="text-gray-500" />
                <Text>Recent Searches</Text>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => handleSearch(symbol)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-sm"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Stocks */}
          <div>
            <Text className="mb-3">Popular Stocks</Text>
            {isLoading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <Card className="text-center py-8">
                <Text className="text-red-500">{error}</Text>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularStocks.map((stock) => (
                  <StockCard 
                    key={stock.symbol} 
                    symbol={stock.symbol} 
                    name={stock.name} 
                    price={stock.price} 
                    change={stock.change} 
                    changePercent={stock.changePercent} 
                    volume={stock.volume || 0} 
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage; 
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tab, TabList, TabGroup, TabPanel, TabPanels, Card, Title, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@tremor/react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import PercentChangeDisplay from "./PercentChangeDisplay";
import stockService from "../services/api";

interface StockMover {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  changePct?: number; // Alternate field name
  currency?: string;
  // Add any other potential fields from the API
  [key: string]: any; // Allow any other properties
}

const MarketMovers: React.FC = () => {
  const [gainers, setGainers] = useState<StockMover[]>([]);
  const [losers, setLosers] = useState<StockMover[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketMovers = async () => {
      try {
        setLoading(true);
        const response = await stockService.getMarketMovers();
        
        // Safely process data and normalize structure
        const processedGainers = (response.gainers || []).map(g => normalizeStockData(g));
        const processedLosers = (response.losers || []).map(l => normalizeStockData(l));
        
        setGainers(processedGainers);
        setLosers(processedLosers);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch market movers:', err);
        setError('Failed to load market movers data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketMovers();
  }, []);

  // Helper function to normalize stock data structure
  const normalizeStockData = (stock: any): StockMover => {
    // Create a normalized object with default values
    return {
      symbol: stock.symbol || 'Unknown',
      name: stock.name || stock.company_name || stock.symbol || 'Unknown',
      price: typeof stock.price !== 'undefined' ? stock.price : 
             typeof stock.current_price !== 'undefined' ? stock.current_price : 0,
      change: typeof stock.change !== 'undefined' ? stock.change : 0,
      changePercent: typeof stock.changePercent !== 'undefined' ? stock.changePercent : 
                     typeof stock.changePct !== 'undefined' ? stock.changePct : 
                     typeof stock.change_percent !== 'undefined' ? stock.change_percent : 0,
      currency: stock.currency || 'INR',
    };
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
  };
  
  const renderStockRow = (stock: StockMover) => {
    // Ensure we have all required values with fallbacks
    const price = stock.price || 0;
    const change = stock.change || 0;
    const changePercent = stock.changePercent || stock.changePct || 0;
    const isPositive = change >= 0;
    const currencySymbol = (stock.currency === 'INR' || !stock.currency) ? '₹' : '$';
    
    return (
      <TableRow key={stock.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-800">
        <TableCell>
          <Link href={`/stocks/${stock.symbol}`} className="font-medium hover:text-blue-600">
            {stock.symbol}
          </Link>
        </TableCell>
        <TableCell className="max-w-[200px] truncate">{stock.name}</TableCell>
        <TableCell>{currencySymbol}{formatNumber(price)}</TableCell>
        <TableCell>
          <div className={`flex items-center gap-1 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {isPositive ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
            {currencySymbol}{Math.abs(change).toFixed(2)}
          </div>
        </TableCell>
        <TableCell>
          <PercentChangeDisplay 
            value={changePercent} 
            showArrow={false}
          />
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <Card>
        <Title>Market Movers</Title>
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading market movers...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Title>Market Movers</Title>
        <div className="flex justify-center items-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title>Market Movers</Title>
      <TabGroup className="mt-4">
        <TabList>
          <Tab>Top Gainers</Tab>
          <Tab>Top Losers</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Table className="mt-4">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Symbol</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Price</TableHeaderCell>
                  <TableHeaderCell>Change</TableHeaderCell>
                  <TableHeaderCell>% Change</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gainers.length > 0 ? (
                  gainers.map(stock => renderStockRow(stock))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No gainers data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabPanel>
          <TabPanel>
            <Table className="mt-4">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Symbol</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Price</TableHeaderCell>
                  <TableHeaderCell>Change</TableHeaderCell>
                  <TableHeaderCell>% Change</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {losers.length > 0 ? (
                  losers.map(stock => renderStockRow(stock))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No losers data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
};

export default MarketMovers; 
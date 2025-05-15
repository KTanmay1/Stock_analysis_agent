"use client";

import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from "@tremor/react";
import PercentChangeDisplay from "./PercentChangeDisplay";
import Link from 'next/link';
import stockService from '../services/api';
import { StockMover } from '../types/stock';
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

interface StocksListProps {
  limit?: number;
}

const StocksList: React.FC<StocksListProps> = ({ limit = 50 }) => {
  const [stocks, setStocks] = useState<StockMover[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof StockMover>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch stocks data
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await stockService.getAllStocks(limit);
        setStocks(response.stocks || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch stocks:', err);
        setError('Failed to load stocks data');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [limit]);

  // Sorting function
  const sortedStocks = React.useMemo(() => {
    if (!stocks) return [];
    
    return [...stocks].sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      
      if (fieldA === undefined || fieldB === undefined) {
        return 0;
      }
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc' 
          ? fieldA - fieldB 
          : fieldB - fieldA;
      }
      
      return 0;
    });
  }, [stocks, sortField, sortDirection]);
  
  // Toggle sort function
  const toggleSort = (field: keyof StockMover) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Function to format large numbers
  const formatLargeNumber = (num: number | string): string => {
    if (typeof num === 'string') {
      if (num === 'N/A') return num;
      return num;
    }
    
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    
    return num.toString();
  };

  if (loading) {
    return (
      <Card>
        <Title>Stocks</Title>
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading stocks data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Title>Stocks</Title>
        <div className="flex justify-center items-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title>Stocks</Title>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell 
              className="cursor-pointer" 
              onClick={() => toggleSort('symbol')}
            >
              Symbol
              {sortField === 'symbol' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHeaderCell>
            <TableHeaderCell 
              className="cursor-pointer" 
              onClick={() => toggleSort('name')}
            >
              Name
              {sortField === 'name' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHeaderCell>
            <TableHeaderCell 
              className="cursor-pointer text-right" 
              onClick={() => toggleSort('price')}
            >
              Price
              {sortField === 'price' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHeaderCell>
            <TableHeaderCell 
              className="cursor-pointer text-right" 
              onClick={() => toggleSort('changePercent')}
            >
              Change %
              {sortField === 'changePercent' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHeaderCell>
            <TableHeaderCell
              className="cursor-pointer text-right"
              onClick={() => toggleSort('volume')}
            >
              Volume
              {sortField === 'volume' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHeaderCell>
            <TableHeaderCell
              className="cursor-pointer text-right"
              onClick={() => toggleSort('sector')}
            >
              Sector
              {sortField === 'sector' && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedStocks.length > 0 ? (
            sortedStocks.map((stock) => {
              const isPositive = stock.change >= 0;
              const currencySymbol = stock.currency === 'INR' ? '₹' : '$';
              
              return (
                <TableRow key={stock.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <Link href={`/stocks/${stock.symbol}`} className="font-medium hover:text-blue-600">
                      {stock.symbol}
                    </Link>
                  </TableCell>
                  <TableCell className="font-normal">{stock.name}</TableCell>
                  <TableCell className="text-right">
                    {currencySymbol}{stock.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <PercentChangeDisplay value={stock.changePercent} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {stock.volume ? formatLargeNumber(stock.volume) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {stock.sector || 'N/A'}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No stocks data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default StocksList; 
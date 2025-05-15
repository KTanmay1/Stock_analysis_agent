"use client";

import React, { useEffect, useState } from "react";
import { Card, Title, Text, Grid, Col, Metric } from "@tremor/react";
import SimpleAreaChart from "./SimpleAreaChart";
import PercentChangeDisplay from "./PercentChangeDisplay";
import stockService from "../services/api";
import { MarketIndex } from "../types/stock";

const MarketIndices: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketIndices = async () => {
      try {
        setLoading(true);
        const response = await stockService.getMarketIndices();
        setIndices(response.indices || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch market indices:', err);
        setError('Failed to load market indices data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketIndices();
  }, []);

  if (loading) {
    return (
      <div>
        <Text className="mb-2">Market Indices</Text>
        <div className="text-center py-8">Loading market indices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Text className="mb-2">Market Indices</Text>
        <div className="text-center py-8 text-red-500">{error}</div>
      </div>
    );
  }

  if (indices.length === 0) {
    return (
      <div>
        <Text className="mb-2">Market Indices</Text>
        <div className="text-center py-8">No market indices data available</div>
      </div>
    );
  }

  return (
    <div>
      <Text className="mb-2">Market Indices</Text>
      <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-4">
        {indices.map((index) => {
          // Generate mock chart data - in real implementation, you'd fetch historical data
          const mockChartData = Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: index.price * (0.98 + Math.random() * 0.04), // ±2% of current price
          }));

          const currencySymbol = index.currency === 'INR' ? '₹' : '$';
          
          return (
            <Card key={index.symbol}>
              <div className="flex justify-between items-start">
                <div>
                  <Text>{index.name}</Text>
                  <Metric>{currencySymbol}{index.price.toLocaleString()}</Metric>
                </div>
                <div className="flex items-center gap-1">
                  <Text className={index.change >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    {index.change >= 0 ? "+" : ""}
                    {index.change.toFixed(2)}
                  </Text>
                  <span className="text-gray-500">(</span>
                  <PercentChangeDisplay 
                    value={index.changePercent} 
                    showArrow={false} 
                    className="text-sm"
                  />
                  <span className="text-gray-500">)</span>
                </div>
              </div>
              <div className="mt-4 h-28">
                <SimpleAreaChart 
                  data={mockChartData}
                  color={index.change >= 0 ? "#16a34a" : "#e11d48"} // emerald-600 or rose-600
                />
              </div>
            </Card>
          );
        })}
      </Grid>
    </div>
  );
};

export default MarketIndices; 
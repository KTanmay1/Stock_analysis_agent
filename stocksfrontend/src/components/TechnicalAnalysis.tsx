"use client";

import React from "react";
import { Card, Title, Grid, Col, Text, Metric, ProgressBar, Flex } from "@tremor/react";
import SignalBadge from "./SignalBadge";

interface TechnicalIndicator {
  name: string;
  value: string | number;
  signal: "buy" | "sell" | "neutral";
  description?: string;
}

interface TechnicalAnalysisSummary {
  buySignals: number;
  sellSignals: number;
  neutralSignals: number;
  recommendation: string;
}

interface TechnicalAnalysisProps {
  symbol?: string;
  indicators: TechnicalIndicator[];
  summary: TechnicalAnalysisSummary;
  // Keep the old props for backwards compatibility
  sma20?: number;
  sma50?: number;
  rsi?: number;
  currentPrice?: number;
  rsiSignal?: string;
}

const TechnicalAnalysis: React.FC<TechnicalAnalysisProps> = ({
  symbol,
  indicators: passedIndicators,
  summary: passedSummary,
  sma20,
  sma50,
  rsi,
  currentPrice,
  rsiSignal,
}) => {
  // If we're using the old props, generate indicators based on the passed data
  let indicators = passedIndicators;
  let summary = passedSummary;
  
  if (!passedIndicators && sma20 && sma50 && rsi && currentPrice) {
    indicators = [
      {
        name: "SMA 20",
        value: sma20.toFixed(2),
        signal: currentPrice > sma20 ? "buy" : "sell",
        description: "Simple Moving Average (20 days)"
      },
      {
        name: "SMA 50",
        value: sma50.toFixed(2),
        signal: currentPrice > sma50 ? "buy" : "sell",
        description: "Simple Moving Average (50 days)"
      },
      {
        name: "RSI",
        value: rsi.toFixed(2),
        signal: rsi < 30 ? "buy" : rsi > 70 ? "sell" : "neutral",
        description: "Relative Strength Index"
      },
      {
        name: "Price vs SMA20",
        value: `${((currentPrice - sma20) / sma20 * 100).toFixed(2)}%`,
        signal: currentPrice > sma20 ? "buy" : "sell",
        description: "Price deviation from 20-day moving average"
      },
      {
        name: "SMA 20 vs SMA 50",
        value: sma20 > sma50 ? "Bullish" : "Bearish",
        signal: sma20 > sma50 ? "buy" : "sell",
        description: "Golden Cross (SMA20 > SMA50) indicates bullish trend"
      }
    ];
    
    if (rsiSignal) {
      indicators.push({
        name: "RSI Signal",
        value: rsiSignal,
        signal: rsiSignal === "Oversold" ? "buy" : rsiSignal === "Overbought" ? "sell" : "neutral",
        description: "RSI interpretation"
      });
    }
    
    // Calculate summary based on indicators
    summary = {
      buySignals: indicators.filter(i => i.signal === "buy").length,
      sellSignals: indicators.filter(i => i.signal === "sell").length,
      neutralSignals: indicators.filter(i => i.signal === "neutral").length,
      recommendation: "Buy" // Default placeholder
    };
  }

  // Determine recommendation if not already set
  let recommendation = passedSummary?.recommendation || "Neutral";
  if (!passedSummary?.recommendation) {
    if (summary.buySignals >= 4) recommendation = "Strong Buy";
    else if (summary.buySignals >= 3) recommendation = "Buy";
    else if (summary.sellSignals >= 4) recommendation = "Strong Sell";
    else if (summary.sellSignals >= 3) recommendation = "Sell";
    else recommendation = "Neutral";
  }

  const getRecommendationClasses = (rec: string) => {
    if (rec.includes("Buy")) return "bg-emerald-500/10 text-emerald-500";
    if (rec.includes("Sell")) return "bg-rose-500/10 text-rose-500";
    return "bg-amber-500/10 text-amber-500";
  };

  const totalSignals = summary.buySignals + summary.sellSignals + summary.neutralSignals;
  
  return (
    <Card>
      <Title>Technical Analysis {symbol ? `for ${symbol}` : ''}</Title>
      
      <div className="mt-6">
        <Text>Summary</Text>
        <Card className="mt-2 bg-gray-50 dark:bg-gray-900">
          <Flex>
            <div>
              <Text>Recommendation</Text>
              <div className={`inline-flex items-center justify-center px-3 py-1.5 mt-2 rounded-md text-sm font-medium ${getRecommendationClasses(recommendation)}`}>
                {recommendation}
              </div>
            </div>
            <div>
              <Text>Signal Strength</Text>
              <div className="w-52 mt-2">
                <Flex className="mt-1 space-x-2">
                  <Text>Buy</Text>
                  <Text>{Math.round((summary.buySignals / totalSignals) * 100)}%</Text>
                </Flex>
                <ProgressBar value={(summary.buySignals / totalSignals) * 100} color="emerald" className="mt-1" />
                
                <Flex className="mt-1 space-x-2">
                  <Text>Neutral</Text>
                  <Text>{Math.round((summary.neutralSignals / totalSignals) * 100)}%</Text>
                </Flex>
                <ProgressBar value={(summary.neutralSignals / totalSignals) * 100} color="amber" className="mt-1" />
                
                <Flex className="mt-1 space-x-2">
                  <Text>Sell</Text>
                  <Text>{Math.round((summary.sellSignals / totalSignals) * 100)}%</Text>
                </Flex>
                <ProgressBar value={(summary.sellSignals / totalSignals) * 100} color="rose" className="mt-1" />
              </div>
            </div>
          </Flex>
        </Card>
      </div>
      
      <div className="mt-6">
        <Text>Technical Indicators</Text>
        <Grid numItems={1} numItemsMd={2} numItemsLg={3} className="gap-4 mt-2">
          {indicators.map((indicator, index) => (
            <Card key={index} className="bg-gray-50 dark:bg-gray-900">
              <Flex justifyContent="between" alignItems="center">
                <div>
                  <Text>{indicator.name}</Text>
                  <Metric className="mt-1">{indicator.value}</Metric>
                </div>
                <SignalBadge signal={indicator.signal} />
              </Flex>
              {indicator.description && (
                <Text className="mt-2 text-xs text-gray-500">{indicator.description}</Text>
              )}
            </Card>
          ))}
        </Grid>
      </div>
    </Card>
  );
};

export default TechnicalAnalysis; 
"use client";

import React from "react";
import { Card, Title, Text } from "@tremor/react";
import MarketMovers from "@/components/MarketMovers";
import ApiHealthCheck from "@/components/ApiHealthCheck";

const MoversPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Market Movers</h1>
        <Text>Stocks making the biggest moves in the market today</Text>
      </div>

      {/* API Health Check - will only show if there's an issue */}
      <ApiHealthCheck />

      {/* MarketMovers component now fetches its own data */}
      <MarketMovers />

      <Card>
        <Title>Understanding Market Movers</Title>
        <Text className="mt-2">
          Market movers are stocks that are experiencing significant price changes due to factors like earnings reports, 
          analyst upgrades/downgrades, sector trends, or broader market movements. These stocks often present opportunities 
          for both short-term traders and long-term investors.
        </Text>
        <Text className="mt-4">
          Gainers (stocks moving up) may indicate positive news, strong earnings, or increased investor interest. 
          Losers (stocks moving down) may reflect disappointing results, lowered guidance, or sector-wide concerns.
        </Text>
        <Text className="mt-4">
          Our AI analyzes these movements along with other technical and fundamental factors to provide insights on 
          potential trading opportunities.
        </Text>
      </Card>
    </div>
  );
};

export default MoversPage;

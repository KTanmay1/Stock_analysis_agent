"use client";

import React from "react";
import Link from "next/link";
import { Card, Text, Metric, Flex } from "@tremor/react";
import { FaArrowUp, FaArrowDown, FaRupeeSign } from "react-icons/fa";
import PercentChangeDisplay from "./PercentChangeDisplay";

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

const StockCard: React.FC<StockCardProps> = ({
  symbol,
  name,
  price,
  change,
  changePercent,
  volume,
}) => {
  const isPositive = change >= 0;
  const changeIcon = isPositive ? <FaArrowUp /> : <FaArrowDown />;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 10000000) {
      return `${(num / 10000000).toFixed(2)}Cr`;
    } else if (num >= 100000) {
      return `${(num / 100000).toFixed(2)}L`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toString();
  };

  return (
    <Link href={`/stocks/${symbol}`} className="block transition-transform hover:scale-[1.02]">
      <Card className="max-w-xs p-4 hover:shadow-md transition-shadow">
        <Flex justifyContent="between" alignItems="center">
          <div>
            <Text className="text-sm font-medium">{symbol}</Text>
            <Text className="text-xs text-gray-500 truncate">{name}</Text>
          </div>
          <PercentChangeDisplay 
            value={changePercent}
            className="text-xs font-medium"
          />
        </Flex>
        <div className="flex items-center mt-2">
          <span className="text-xl font-bold">₹{formatNumber(price)}</span>
        </div>
        <Flex justifyContent="between" alignItems="center" className="mt-3">
          <div className={`flex items-center text-sm font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {changeIcon} <span className="mr-1">₹</span>{Math.abs(change).toFixed(2)}
          </div>
          <Text className="text-xs text-gray-500">Vol: {formatLargeNumber(volume)}</Text>
        </Flex>
      </Card>
    </Link>
  );
};

export default StockCard; 
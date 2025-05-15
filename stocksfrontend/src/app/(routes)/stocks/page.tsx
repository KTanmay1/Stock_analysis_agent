"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, Title, Text, Grid } from "@tremor/react";
import SearchBar from "@/components/SearchBar";
import StocksList from "@/components/StocksList";
import ApiHealthCheck from "@/components/ApiHealthCheck";

const StocksPage = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stocks</h1>
      
      {/* API Health Check - will only show if there's an issue */}
      <ApiHealthCheck />
      
      {/* Search functionality will be handled by the StocksList component */}
      <StocksList limit={100} />
    </div>
  );
};

export default StocksPage; 
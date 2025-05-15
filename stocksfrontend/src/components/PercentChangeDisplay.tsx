"use client";

import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

interface PercentChangeDisplayProps {
  value: number;
  showSign?: boolean;
  showArrow?: boolean;
  className?: string;
}

/**
 * A component for displaying percentage changes in a consistent way.
 * This fixes styling issues with background color in percentage displays.
 */
const PercentChangeDisplay: React.FC<PercentChangeDisplayProps> = ({
  value,
  showSign = true,
  showArrow = true,
  className = "",
}) => {
  const isPositive = value >= 0;
  const textColorClass = isPositive ? "text-emerald-600" : "text-rose-600";
  
  return (
    <div className={`inline-flex items-center ${textColorClass} ${className}`}>
      {showArrow && (isPositive ? 
        <FaArrowUp className="mr-1" size={12} /> : 
        <FaArrowDown className="mr-1" size={12} />
      )}
      <span>
        {showSign && isPositive && "+"}
        {value.toFixed(2)}%
      </span>
    </div>
  );
};

export default PercentChangeDisplay; 
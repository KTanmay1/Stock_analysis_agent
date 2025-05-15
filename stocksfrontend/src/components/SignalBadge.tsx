"use client";

import React from "react";
import { FaArrowUp, FaArrowDown, FaDotCircle } from "react-icons/fa";

type SignalType = "buy" | "sell" | "neutral";

interface SignalBadgeProps {
  signal: SignalType;
  className?: string;
  showIcon?: boolean;
}

/**
 * A component for displaying buy/sell/neutral signals with consistent styling.
 */
const SignalBadge: React.FC<SignalBadgeProps> = ({
  signal,
  className = "",
  showIcon = true,
}) => {
  const getClasses = () => {
    switch (signal) {
      case "buy":
        return "bg-emerald-500/10 text-emerald-500";
      case "sell":
        return "bg-rose-500/10 text-rose-500";
      case "neutral":
        return "bg-amber-500/10 text-amber-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };
  
  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (signal) {
      case "buy":
        return <FaArrowUp className="mr-1" size={10} />;
      case "sell":
        return <FaArrowDown className="mr-1" size={10} />;
      case "neutral":
        return <FaDotCircle className="mr-1" size={10} />;
      default:
        return null;
    }
  };
  
  return (
    <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium ${getClasses()} ${className}`}>
      {getIcon()}
      {signal.toUpperCase()}
    </div>
  );
};

export default SignalBadge; 
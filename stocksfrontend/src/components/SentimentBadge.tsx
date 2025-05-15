"use client";

import React from "react";

type SentimentType = "positive" | "negative" | "neutral";

interface SentimentBadgeProps {
  sentiment: SentimentType;
  className?: string;
}

/**
 * A component for displaying sentiment badges (positive, negative, neutral)
 * with consistent styling and proper background colors.
 */
const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  className = "",
}) => {
  const getClasses = () => {
    switch (sentiment) {
      case "positive":
        return "bg-emerald-500/10 text-emerald-500";
      case "negative":
        return "bg-rose-500/10 text-rose-500";
      case "neutral":
        return "bg-amber-500/10 text-amber-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };
  
  return (
    <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium ${getClasses()} ${className}`}>
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </div>
  );
};

export default SentimentBadge; 
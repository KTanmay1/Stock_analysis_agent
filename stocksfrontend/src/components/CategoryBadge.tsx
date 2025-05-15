"use client";

import React from "react";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

/**
 * A component for displaying category badges with consistent styling.
 */
const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  className = "",
}) => {
  const getCategoryClasses = () => {
    // You can customize colors based on category if needed
    switch (category.toLowerCase()) {
      case "technology":
        return "bg-blue-500/10 text-blue-500";
      case "economy":
        return "bg-purple-500/10 text-purple-500";
      case "energy":
        return "bg-green-500/10 text-green-500";
      case "real estate":
        return "bg-amber-500/10 text-amber-500";
      case "financial":
      case "financial services":
        return "bg-indigo-500/10 text-indigo-500";
      case "healthcare":
        return "bg-teal-500/10 text-teal-500";
      case "consumer cyclical":
      case "consumer defensive":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };
  
  return (
    <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${getCategoryClasses()} ${className}`}>
      {category}
    </div>
  );
};

export default CategoryBadge; 
"use client";

import React from "react";

interface FilterButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}

/**
 * A reusable button component for filter categories, tabs, and other selections
 * with consistent styling and proper background colors.
 */
const FilterButton: React.FC<FilterButtonProps> = ({
  active,
  label,
  onClick,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-gray-100/10 text-gray-600 hover:bg-gray-200/20 dark:text-gray-300 dark:hover:bg-gray-700/30"
      } ${className}`}
    >
      {label}
    </button>
  );
};

export default FilterButton; 
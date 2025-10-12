// Utility functions for formatting data

export const formatCurrency = (value: number | string): string => {
  if (typeof value === 'string') return String(value);
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number | string): string => {
  if (typeof value === 'string') return String(value);
  
  return new Intl.NumberFormat('en-IN').format(value);
};

export const formatCompactNumber = (value: number | string): string => {
  if (typeof value === 'string') return String(value);
  
  const num = Number(value);
  
  if (num >= 1e7) { // 1 crore
    return `₹${(num / 1e7).toFixed(2)} Cr`;
  } else if (num >= 1e5) { // 1 lakh
    return `₹${(num / 1e5).toFixed(2)} L`;
  } else if (num >= 1e3) { // 1 thousand
    return `₹${(num / 1e3).toFixed(2)} K`;
  }
  
  return formatCurrency(num);
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

export const getPerformanceColor = (value: number): string => {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-danger';
  return 'text-gray-600';
};

export const getPerformanceColorBg = (value: number, darkMode: boolean): string => {
  if (value > 0) {
    return darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700';
  }
  if (value < 0) {
    return darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700';
  }
  return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
};

export const formatFieldName = (field: string): string => {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};


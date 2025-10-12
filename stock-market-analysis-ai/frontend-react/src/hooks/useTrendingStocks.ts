import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../services/api';

export const useTrendingStocks = () => {
  return useQuery({
    queryKey: ['trending-stocks'],
    queryFn: stockApi.getTrendingStocks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
    retry: 2,
  });
};


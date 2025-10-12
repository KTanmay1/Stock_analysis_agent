import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../services/api';

export const useStockAnalysis = (symbol: string | undefined) => {
  return useQuery({
    queryKey: ['stock-analysis', symbol],
    queryFn: () => stockApi.analyzeStock(symbol!),
    enabled: !!symbol && symbol.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};


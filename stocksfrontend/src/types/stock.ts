export interface StockData {
  symbol: string;
  current_price: number;
  day_high: number | string;
  day_low: number | string;
  volume: number | string;
  market_cap: number | string;
  pe_ratio: number | string;
  '52_week_high': number | string;
  '52_week_low': number | string;
  last_updated: string;
  error?: string;
}

export interface TechnicalData {
  sma20: number;
  sma50: number;
  rsi: number;
  trend: string;
  rsi_signal: string;
  last_close: number;
  last_volume: number;
  data_points: number;
  error?: string;
}

export interface NewsItem {
  title: string;
  snippet?: string;
  description?: string;
  source?: string;
  url?: string;
  published_at?: string;
  published?: string;
  image_url?: string;
  date?: string;
  summary?: string;
}

export interface StockAnalysis {
  stock_data: StockData;
  technical_data: TechnicalData;
  news_data: NewsItem[];
  analysis: string;
  price_history?: StockHistoryItem[];
  error?: string;
}

export interface TrendingStock {
  symbol: string;
  name?: string;
  price?: number;
  current_price?: number;
  performance_5d?: number;
  change_percent?: number;
  changePct?: number;
  change?: number;
  avg_volume?: number;
  volume?: number;
  sector?: string;
}

export interface SectorPerformance {
  sector: string;
  performance: number;
}

export interface TrendingStocksData {
  top_movers?: TrendingStock[];
  most_active?: TrendingStock[];
  trending_stocks?: TrendingStock[];
  sector_performance?: { [sector: string]: number } | SectorPerformance[];
  error?: string;
}

// New interfaces
export interface StockMover {
  symbol: string;
  name: string;
  price?: number;
  current_price?: number;
  change?: number;
  changePercent?: number;
  changePct?: number;
  change_percent?: number;
  sector?: string;
  volume?: number;
  marketCap?: number | string;
  peRatio?: number | string;
  eps?: number | string;
  currency?: string;
}

export interface MarketMovers {
  gainers?: StockMover[];
  losers?: StockMover[];
  most_active?: StockMover[];
  error?: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent?: number;
  changePct?: number;
  currency?: string;
}

export interface MarketIndices {
  indices?: MarketIndex[];
  error?: string;
}

export interface AllStocks {
  stocks?: StockMover[];
  error?: string;
}

export interface NewsData {
  news?: NewsItem[];
  articles?: NewsItem[];
  error?: string;
  [key: string]: any; // Allow for other properties
}

export interface StockHistoryItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  currency?: string;
}

export interface StockHistory {
  history?: StockHistoryItem[];
  data?: StockHistoryItem[];
  error?: string;
} 
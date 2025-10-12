// Stock data types based on backend API responses

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

// Advanced Technical Indicator Types
export interface MACDData {
  macd: number;
  signal: number;
  histogram: number;
  crossover: 'bullish' | 'bearish' | 'bullish_crossover' | 'bearish_crossover';
  error?: string;
}

export interface BollingerBandsData {
  upper_band: number;
  middle_band: number;
  lower_band: number;
  current_price: number;
  position: number; // 0-100%
  bandwidth: number;
  signal: 'overbought' | 'oversold' | 'neutral';
  error?: string;
}

export interface EMAData {
  ema9: number;
  ema21: number;
  ema50: number;
  short_term_trend: 'bullish' | 'bearish';
  long_term_trend: 'bullish' | 'bearish';
  overall_trend: 'strong_bullish' | 'strong_bearish' | 'neutral';
  error?: string;
}

export interface VolumeData {
  obv: number;
  obv_trend: 'rising' | 'falling' | 'flat' | 'unknown';
  volume_ma: number;
  current_volume: number;
  volume_ratio: number;
  volume_signal: 'high' | 'low' | 'normal';
  error?: string;
}

export interface ATRData {
  atr: number;
  volatility_pct: number;
  volatility_level: 'high' | 'medium' | 'low';
  error?: string;
}

export interface TrendAnalysisData {
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  confidence: number; // 0-100
  signals: Record<string, string>;
  bullish_score: number;
  bearish_score: number;
  error?: string;
}

export interface TechnicalData {
  // Basic indicators
  sma20: number;
  sma50: number;
  rsi: number;
  trend: 'Bullish' | 'Bearish';
  rsi_signal: 'Oversold' | 'Overbought' | 'Neutral';
  last_close: number;
  last_volume: number;
  data_points: number;
  
  // Advanced indicators
  macd?: MACDData;
  bollinger?: BollingerBandsData;
  ema?: EMAData;
  volume?: VolumeData;
  atr?: ATRData;
  trend_analysis?: TrendAnalysisData;
  
  error?: string;
}

export interface NewsItem {
  title: string;
  snippet: string;
}

// Risk Metrics Types
export interface RiskInterpretation {
  volatility: string;
  drawdown: string;
  beta: string;
  sharpe: string;
}

export interface RiskData {
  volatility: number;
  max_drawdown: number;
  beta: number | null;
  sharpe_ratio: number;
  risk_level: 'high' | 'medium' | 'low';
  risk_score: number;
  interpretation?: RiskInterpretation;
  error?: string;
}

// Confidence Scoring Types
export interface ConfidenceFactors {
  data_quality: number;
  signal_strength: number;
  indicator_agreement: number;
  news_availability: number;
}

export interface ConfidenceBreakdown {
  data_quality: string;
  signal_strength: string;
  indicator_agreement: string;
  news_availability: string;
}

export interface ConfidenceData {
  overall_confidence: number;
  confidence_level: 'high' | 'medium' | 'low';
  description: string;
  factors: ConfidenceFactors;
  breakdown: ConfidenceBreakdown;
  error?: string;
}

// Recommendation Types
export interface Recommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  timeframe: string;
  current_price: number;
  target_price: number;
  stop_loss: number;
  upside_potential: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  risk_level: 'high' | 'medium' | 'low';
  sentiment_score?: number; // NEW
  sentiment_label?: 'positive' | 'negative' | 'neutral'; // NEW
  reason?: string; // Fallback for error cases
}

// Sentiment Analysis Types
export interface ArticleSentiment {
  title: string;
  snippet?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to +1
  confidence: number; // 0 to 1
  source: string;
  credibility: number;
  label_scores?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface SentimentData {
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  overall_score: number; // -1 to +1
  average_confidence?: number; // 0 to 1
  article_count: number;
  sentiment_distribution?: {
    positive: number;
    negative: number;
    neutral: number;
  };
  interpretation?: string;
  articles?: ArticleSentiment[];
}

// Pattern Analysis Types
export interface ThemeData {
  theme_id: number;
  label: string;
  articles: ArticleSentiment[];
  article_count: number;
}

export interface SentimentDistribution {
  sentiment_counts: {
    positive: number;
    negative: number;
    neutral: number;
  };
  avg_score: number;
  score_variance: number;
  dominant_sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ConflictData {
  type: string;
  positive_articles: number;
  negative_articles: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface TemporalTrend {
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  early_sentiment_score?: number;
  recent_sentiment_score?: number;
  delta?: number;
}

export interface ConsensusData {
  level: 'strong' | 'moderate' | 'weak' | 'unknown';
  agreement_percentage: number;
  score_variance: number;
  interpretation: string;
}

export interface PatternData {
  themes: ThemeData[];
  sentiment_distribution: Record<string, SentimentDistribution>;
  conflicts: ConflictData[];
  temporal_trend: TemporalTrend;
  consensus: ConsensusData;
  key_entities: Record<string, {
    mention_count: number;
    avg_sentiment: number;
  }>;
  pattern_summary: string;
}

export interface StockAnalysisResponse {
  stock_data: StockData;
  technical_data: TechnicalData;
  risk_data?: RiskData;
  confidence_data?: ConfidenceData;
  recommendation?: Recommendation;
  news_data: NewsItem[];
  sentiment_data?: SentimentData;
  patterns?: PatternData; // NEW: Pattern analysis
  ai_synthesis?: string; // NEW: AI synthesis from multi-stage
  analysis: string;
  error?: string;
}

export interface TrendingStock {
  symbol: string;
  current_price: number;
  performance_5d: number;
  avg_volume: number;
  sector: string;
}

export interface TrendingStocksResponse {
  top_movers: TrendingStock[];
  most_active: TrendingStock[];
  sector_performance: Record<string, number>;
}

export interface ApiError {
  error: string;
  message?: string;
}


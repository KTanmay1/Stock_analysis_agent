from typing import List, Dict
import yfinance as yf
import requests
from bs4 import BeautifulSoup
import os
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv
import numpy as np

# Import technical indicators
from technical_indicators import (
    calculate_macd,
    calculate_bollinger_bands,
    calculate_emas,
    calculate_volume_indicators,
    calculate_atr,
    analyze_trend_multi_factor
)

# Import risk and confidence metrics
from risk_confidence import (
    calculate_risk_metrics,
    calculate_confidence_score,
    generate_recommendation
)

# Import logging
from logger_config import log_function_call, PerformanceTimer, log_analysis_result

# Load environment variables (for local development)
load_dotenv()

# Get GROQ_API_KEY from environment (works for both .env and Railway)
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

if not GROQ_API_KEY:
    # Don't raise immediately - allow service to start, fail at first use
    print("⚠️  WARNING: GROQ_API_KEY not found. Service will start but API calls will fail.")
    groq_client = None
else:
    # Initialize Groq client
    groq_client = Groq(api_key=GROQ_API_KEY)

class WebSearchAgent:
    def __init__(self):
        self.groq_client = groq_client
        # Import here to avoid circular imports
        from news_aggregator import NewsAggregator
        from article_extractor import ArticleExtractor
        from multi_stage_analyzer import MultiStageAnalyzer
        
        self.news_aggregator = NewsAggregator()
        self.article_extractor = ArticleExtractor()
        self.multi_stage_analyzer = MultiStageAnalyzer(GROQ_API_KEY)

    def search(self, query: str) -> Dict:
        """
        Enhanced search with full article extraction and multi-stage analysis
        
        Args:
            query: Search query (e.g., "RELIANCE stock news NSE India")
            
        Returns:
            Dict with articles, patterns, overall_sentiment, ai_synthesis
        """
        try:
            # Extract symbol from query
            symbol = self._extract_symbol(query)
            
            # Step 1: Fetch news from multiple sources
            print(f"📰 Fetching news for {symbol}...")
            news_articles = self.news_aggregator.fetch_news(symbol, max_articles=10)
            
            if not news_articles:
                print(f"No news found for {symbol}")
                return {
                    'articles': [],
                    'patterns': {},
                    'overall_sentiment': {'overall_sentiment': 'neutral', 'overall_score': 0.0, 'article_count': 0},
                    'ai_synthesis': 'No news articles found'
                }
            
            # Step 2: Extract full article content (parallel)
            print(f"📄 Extracting full content from {len(news_articles)} articles...")
            articles_with_content = self.article_extractor.extract_multiple(news_articles)
            
            # Step 3: Add credibility scores
            articles_with_content = self.news_aggregator.add_credibility_score(articles_with_content)
            
            # Step 4: Run multi-stage analysis (Groq sentiment → Patterns → Groq synthesis)
            print(f"🧠 Running multi-stage sentiment analysis...")
            comprehensive_analysis = self.multi_stage_analyzer.analyze_comprehensive(
                symbol, articles_with_content
            )
            
            return comprehensive_analysis
            
        except Exception as e:
            print(f"Error in enhanced search: {e}")
            import traceback
            traceback.print_exc()
            return {
                'articles': [],
                'patterns': {},
                'overall_sentiment': {'overall_sentiment': 'neutral', 'overall_score': 0.0, 'article_count': 0},
                'ai_synthesis': f'Error: {str(e)}'
            }
    
    def _extract_symbol(self, query: str) -> str:
        """Extract stock symbol from query"""
        # Simple extraction: first word is usually the symbol
        words = query.split()
        if words:
            # Remove common words
            common_words = {'stock', 'news', 'nse', 'india', 'market'}
            for word in words:
                if word.lower() not in common_words:
                    return word.upper()
        return query

class IndianStockAgent:
    def __init__(self):
        self.groq_client = groq_client

    @log_function_call
    def get_stock_info(self, symbol: str) -> Dict:
        try:
            with PerformanceTimer(f"Fetching stock info for {symbol}"):
                # Remove .NS if present
                symbol = symbol.replace('.NS', '')
                nse_symbol = f"{symbol}.NS"
                
                stock = yf.Ticker(nse_symbol)
                
                # First try to get current data
                current_data = stock.history(period='1d')
                if current_data.empty:
                    return {'error': 'No current data available'}
                
                # Get stock info
                info = stock.info
                
                return {
                    'symbol': nse_symbol,
                    'current_price': round(float(current_data['Close'].iloc[-1]), 2),
                    'day_high': info.get('dayHigh', 'N/A'),
                    'day_low': info.get('dayLow', 'N/A'),
                    'volume': info.get('volume', 'N/A'),
                    'market_cap': info.get('marketCap', 'N/A'),
                    'pe_ratio': info.get('trailingPE', 'N/A'),
                    '52_week_high': info.get('fiftyTwoWeekHigh', 'N/A'),
                    '52_week_low': info.get('fiftyTwoWeekLow', 'N/A'),
                    'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
        except Exception as e:
            return {'error': f"Error fetching stock info: {str(e)}"}

    @log_function_call
    def analyze_technical_indicators(self, symbol: str) -> Dict:
        try:
            with PerformanceTimer(f"Technical analysis for {symbol}"):
                # Remove .NS if present
                symbol = symbol.replace('.NS', '')
                nse_symbol = f"{symbol}.NS"
                
                # Fetch historical data
                stock = yf.Ticker(nse_symbol)
                hist = stock.history(period='1mo', interval='1d')
                
                if hist.empty:
                    return {'error': 'No historical data available'}
                
                print(f"Debug: Retrieved {len(hist)} days of historical data")
                
                # Ensure we have enough data points
                if len(hist) < 50:
                    hist = stock.history(period='3mo', interval='1d')
                    if len(hist) < 50:
                        return {
                            'error': f'Insufficient data points. Got {len(hist)}, need at least 50'
                        }
                
                # Calculate basic SMAs and RSI (keep existing for compatibility)
                try:
                    hist['SMA20'] = hist['Close'].rolling(window=20, min_periods=1).mean()
                    hist['SMA50'] = hist['Close'].rolling(window=50, min_periods=1).mean()
                    
                    # Calculate RSI
                    delta = hist['Close'].diff()
                    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
                    loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
                    rs = gain / loss
                    hist['RSI'] = 100 - (100 / (1 + rs))
                    
                    # Get the most recent values
                    latest = hist.iloc[-1]
                    
                    # Build response with basic indicators
                    response = {
                        'sma20': round(float(latest['SMA20']), 2),
                        'sma50': round(float(latest['SMA50']), 2),
                        'rsi': round(float(latest['RSI']), 2),
                        'trend': 'Bullish' if latest['SMA20'] > latest['SMA50'] else 'Bearish',
                        'rsi_signal': 'Oversold' if latest['RSI'] < 30 else 'Overbought' if latest['RSI'] > 70 else 'Neutral',
                        'last_close': round(float(latest['Close']), 2),
                        'last_volume': int(latest['Volume']),
                        'data_points': len(hist)
                    }
                    
                    # Add advanced indicators
                    response['macd'] = calculate_macd(hist)
                    response['bollinger'] = calculate_bollinger_bands(hist)
                    response['ema'] = calculate_emas(hist)
                    response['volume'] = calculate_volume_indicators(hist)
                    response['atr'] = calculate_atr(hist)
                    
                    # Add multi-factor trend analysis
                    response['trend_analysis'] = analyze_trend_multi_factor(response)
                    
                    return response
                    
                except Exception as calc_error:
                    return {'error': f'Error in calculations: {str(calc_error)}'}
                    
        except Exception as e:
            return {'error': f"Failed to fetch technical data: {str(e)}"}

def verify_stock_data(symbol: str) -> bool:
    """Verify if stock data is available for the given symbol."""
    try:
        symbol = symbol.replace('.NS', '')
        nse_symbol = f"{symbol}.NS"
        stock = yf.Ticker(nse_symbol)
        hist = stock.history(period='1mo')
        return not hist.empty
    except Exception as e:
        print(f"Error verifying {symbol}: {str(e)}")
        return False

class FinancialAnalysisAgent:
    def __init__(self):
        self.web_search_agent = WebSearchAgent()
        self.indian_stock_agent = IndianStockAgent()
        self.groq_client = groq_client

    @log_function_call
    def analyze_stock(self, symbol: str) -> Dict:
        with PerformanceTimer(f"Complete analysis for {symbol}"):
            # Clean the symbol
            symbol = symbol.strip().upper().replace('.NS', '')
            
            print(f"Fetching data for {symbol}...")
            
            stock_data = self.indian_stock_agent.get_stock_info(symbol)
            if 'error' in stock_data:
                print(f"Warning: {stock_data['error']}")
                
            technical_data = self.indian_stock_agent.analyze_technical_indicators(symbol)
            if 'error' in technical_data:
                print(f"Warning: {technical_data['error']}")
            
            # Calculate risk metrics
            risk_data = {'error': 'No data'}
            if 'error' not in technical_data:
                try:
                    # Get historical data for risk calculation
                    nse_symbol = f"{symbol}.NS"
                    stock = yf.Ticker(nse_symbol)
                    hist = stock.history(period='1y')
                    if not hist.empty:
                        risk_data = calculate_risk_metrics(symbol, hist)
                except Exception as e:
                    risk_data = {'error': f'Risk calculation failed: {str(e)}'}
            
            # Fetch news with comprehensive analysis (multi-stage)
            news_analysis = self.web_search_agent.search(f"{symbol} stock news NSE India")
            
            # Extract components from comprehensive analysis
            news_data = news_analysis.get('articles', [])
            patterns = news_analysis.get('patterns', {})
            sentiment_data = news_analysis.get('overall_sentiment', {})
            ai_synthesis = news_analysis.get('ai_synthesis', '')
            
            # Calculate confidence score WITH sentiment
            confidence_data = calculate_confidence_score(stock_data, technical_data, news_data, sentiment_data)
            
            # Generate automated recommendation WITH sentiment
            recommendation = generate_recommendation(stock_data, technical_data, risk_data, confidence_data, sentiment_data)
            
            # Build enhanced AI prompt with structured data
            current_price = stock_data.get('current_price', 'N/A')
            
            # Extract key indicators for prompt
            trend_info = "N/A"
            if 'trend_analysis' in technical_data:
                ta = technical_data['trend_analysis']
                trend_info = f"{ta.get('trend', 'N/A')} (strength: {ta.get('strength', 0)}%, confidence: {ta.get('confidence', 0)}%)"
            elif 'trend' in technical_data:
                trend_info = technical_data['trend']
            
            rsi_info = technical_data.get('rsi', 'N/A')
            macd_info = technical_data.get('macd', {}).get('crossover', 'N/A') if 'macd' in technical_data else 'N/A'
            
            risk_info = "N/A"
            if 'error' not in risk_data:
                risk_info = f"{risk_data.get('risk_level', 'N/A')} (volatility: {risk_data.get('volatility', 'N/A')}%)"
            
            # Extract sentiment info for prompt
            sentiment_info = "N/A"
            if sentiment_data:
                sentiment_info = f"{sentiment_data.get('overall_sentiment', 'N/A')} (score: {sentiment_data.get('overall_score', 0):+.2f})"
            
            # Extract pattern info
            pattern_summary = patterns.get('pattern_summary', 'N/A')
            consensus_level = patterns.get('consensus', {}).get('level', 'N/A')
            consensus_pct = patterns.get('consensus', {}).get('agreement_percentage', 0)
            conflicts = patterns.get('conflicts', [])
            
            analysis_prompt = f"""
You are a professional Indian stock market analyst. Analyze {symbol} stock.

**DATA PROVIDED:**
- Current Price: ₹{current_price}
- Technical Trend: {trend_info}
- RSI: {rsi_info}
- MACD: {macd_info}
- Risk Level: {risk_info}
- Confidence: {confidence_data.get('confidence_level', 'N/A')}

**NEWS SENTIMENT ANALYSIS:**
- Overall Sentiment: {sentiment_info}
- Article Count: {sentiment_data.get('article_count', 0)}
- Pattern Summary: {pattern_summary}
- Consensus: {consensus_level} ({consensus_pct:.0f}% agreement)
- Conflicts: {"Yes - " + str(len(conflicts)) + " detected" if conflicts else "None"}

**NEWS SYNTHESIS:**
{ai_synthesis}

**AUTOMATED RECOMMENDATION:**
Action: {recommendation.get('action', 'N/A')}
Target: ₹{recommendation.get('target_price', 'N/A')}
Stop Loss: ₹{recommendation.get('stop_loss', 'N/A')}

**PROVIDE ANALYSIS:**

## 1. Market Position
[2-3 sentences on valuation and standing]

## 2. Technical Analysis
[Interpret indicators]

## 3. News Sentiment & Patterns
[Discuss the news sentiment, patterns detected, and any conflicts]
{ai_synthesis}

## 4. Recommendation
- **Action:** {recommendation.get('action')}
- **Timeframe:** {recommendation.get('timeframe')}
- **Target:** ₹{recommendation.get('target_price')}
- **Stop Loss:** ₹{recommendation.get('stop_loss')}
- **Reasoning:** [Consider technicals + sentiment + patterns]

## 5. Risk Assessment
- **Risk Level:** {risk_info}
- **Key Risks:** [2-3 risks, include sentiment conflicts if any]
- **Key Opportunities:** [2-3 opportunities]

**IMPORTANT:**
- Integrate pattern analysis findings
- Address any sentiment conflicts
- Consider consensus strength
"""
            
            try:
                completion = self.groq_client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[
                        {"role": "system", "content": "You are a professional Indian stock market analyst with expertise in technical and fundamental analysis."},
                        {"role": "user", "content": analysis_prompt}
                    ]
                )
                
                analysis = completion.choices[0].message.content
                print(analysis)
                
                result = {
                    'stock_data': stock_data,
                    'technical_data': technical_data,
                    'risk_data': risk_data,
                    'confidence_data': confidence_data,
                    'recommendation': recommendation,
                    'news_data': news_data,
                    'sentiment_data': sentiment_data,  # Overall sentiment from multi-stage
                    'patterns': patterns,  # NEW: Pattern analysis
                    'ai_synthesis': ai_synthesis,  # NEW: AI synthesis
                    'analysis': analysis
                }
                
                # Log the analysis result
                log_analysis_result(symbol, result)
                
                return result
                
            except Exception as e:
                return {'error': f"Error in analysis: {str(e)}"}

def format_output(analysis: Dict) -> None:
    """Format and print the analysis output."""
    if 'error' in analysis:
        print(f"Error: {analysis['error']}")
        return

    print("\nStock Data:")
    for key, value in analysis['stock_data'].items():
        print(f"{key}: {value}")

    print("\nTechnical Indicators:")
    if isinstance(analysis['technical_data'], dict):
        if 'error' in analysis['technical_data']:
            print(f"Error: {analysis['technical_data']['error']}")
        else:
            for key, value in analysis['technical_data'].items():
                print(f"{key}: {value}")

    print("\nRecent News:")
    for news in analysis['news_data']:
        print(f"\nTitle: {news['title']}")
        print(f"Summary: {news['snippet']}")

    print("\nAI Analysis:")
    print(analysis['analysis'])

class TrendingStocksAgent:
    """Agent to identify and analyze trending stocks in the Indian market"""
    def __init__(self):
        self.nifty50_symbols = [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 
            'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK'
        ]  # Add more symbols as needed

    def get_trending_stocks(self) -> Dict:
        try:
            trending_stocks = []
            
            for symbol in self.nifty50_symbols:
                try:
                    stock = yf.Ticker(f"{symbol}.NS")
                    hist = stock.history(period='5d')
                    
                    if hist.empty:
                        continue
                    
                    # Calculate 5-day performance
                    performance = ((hist['Close'].iloc[-1] / hist['Close'].iloc[0]) - 1) * 100
                    
                    # Get current price and volume
                    current_price = hist['Close'].iloc[-1]
                    avg_volume = hist['Volume'].mean()
                    
                    trending_stocks.append({
                        'symbol': symbol,
                        'current_price': round(float(current_price), 2),
                        'performance_5d': round(float(performance), 2),
                        'avg_volume': int(avg_volume),
                        'sector': self._get_sector(symbol)
                    })
                    
                except Exception as e:
                    print(f"Error processing {symbol}: {str(e)}")
                    continue
            
            # Sort by performance
            trending_stocks.sort(key=lambda x: abs(x['performance_5d']), reverse=True)
            
            return {
                'top_movers': trending_stocks[:5],
                'most_active': sorted(trending_stocks, key=lambda x: x['avg_volume'], reverse=True)[:5]
            }
        except Exception as e:
            return {'error': f"Error fetching trending stocks: {str(e)}"}

    def _get_sector(self, symbol: str) -> str:
        """Get sector information for a stock"""
        sector_mapping = {
            'RELIANCE': 'Oil & Gas',
            'TCS': 'IT',
            'HDFCBANK': 'Banking',
            'INFY': 'IT',
            'ICICIBANK': 'Banking',
            'HINDUNILVR': 'FMCG',
            'ITC': 'FMCG',
            'SBIN': 'Banking',
            'BHARTIARTL': 'Telecom',
            'KOTAKBANK': 'Banking'
        }
        return sector_mapping.get(symbol, 'Unknown')

    def get_sector_performance(self) -> Dict:
        """Get sector-wise performance"""
        try:
            sector_performance = {}
            
            for symbol in self.nifty50_symbols:
                sector = self._get_sector(symbol)
                if sector not in sector_performance:
                    sector_performance[sector] = []
                
                try:
                    stock = yf.Ticker(f"{symbol}.NS")
                    hist = stock.history(period='5d')
                    if not hist.empty:
                        performance = ((hist['Close'].iloc[-1] / hist['Close'].iloc[0]) - 1) * 100
                        sector_performance[sector].append(performance)
                except Exception:
                    continue
            
            # Calculate average performance for each sector
            sector_avg = {
                sector: round(sum(performances)/len(performances), 2)
                for sector, performances in sector_performance.items()
                if performances
            }
            
            return sector_avg
        except Exception as e:
            return {'error': f"Error calculating sector performance: {str(e)}"}

def display_trending_stocks():
    """Display trending stocks and sector performance"""
    trending_agent = TrendingStocksAgent()
    
    print("\nTrending Stocks in Indian Market")
    print("================================")
    
    # Get trending stocks
    trending_data = trending_agent.get_trending_stocks()
    
    if 'error' in trending_data:
        print(f"Error: {trending_data['error']}")
        return
    
    print("\nTop Movers (Last 5 Days):")
    print("--------------------------")
    for stock in trending_data['top_movers']:
        print(f"{stock['symbol']} ({stock['sector']})")
        print(f"Price: ₹{stock['current_price']}")
        print(f"5-Day Performance: {stock['performance_5d']}%")
        print("---")
    
    print("\nMost Active Stocks:")
    print("------------------")
    for stock in trending_data['most_active']:
        print(f"{stock['symbol']} ({stock['sector']})")
        print(f"Price: ₹{stock['current_price']}")
        print(f"Average Volume: {stock['avg_volume']:,}")
        print("---")
    
    # Get sector performance
    sector_perf = trending_agent.get_sector_performance()
    
    if not isinstance(sector_perf, dict) or 'error' in sector_perf:
        print("Error fetching sector performance")
    else:
        print("\nSector Performance (5 Days):")
        print("----------------------------")
        for sector, performance in sorted(sector_perf.items(), key=lambda x: x[1], reverse=True):
            print(f"{sector}: {performance}%")

# Modify the main function to include trending stocks
def main():
    print("Indian Stock Market Analysis Tool")
    print("================================")
    
    while True:
        print("\nOptions:")
        print("1. View Trending Stocks")
        print("2. Analyze Specific Stocks")
        print("3. Quit")
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == '1':
            display_trending_stocks()
            continue
        
        elif choice == '2':
            print("\nEnter stock symbols (comma-separated):")
            user_input = input().strip()
            
            stocks = [s.strip() for s in user_input.split(',')]
            
            for symbol in stocks:
                print(f"\nVerifying data availability for {symbol}...")
                if not verify_stock_data(symbol):
                    print(f"Warning: No data available for {symbol}. Skipping...")
                    continue
                
                print(f"\n{'='*50}")
                print(f"Analyzing {symbol}")
                print(f"{'='*50}")
                
                analyst = FinancialAnalysisAgent()
                analysis = analyst.analyze_stock(symbol)
                format_output(analysis)
        
        elif choice == '3':
            print("\nThank you for using the Indian Stock Market Analysis Tool!")
            break
        
        else:
            print("\nInvalid choice. Please try again.")

if __name__ == "__main__":
    main()





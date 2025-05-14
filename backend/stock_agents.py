import autogen
from typing import List, Dict
import yfinance as yf
import requests
from bs4 import BeautifulSoup
import os
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv
import json
from urllib.parse import quote

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY)

class WebSearchAgent:
    def __init__(self):
        self.groq_client = groq_client

    def search(self, query: str) -> List[Dict]:
        url = f"https://duckduckgo.com/html/?q={query}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        try:
            response = requests.get(url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            
            for result in soup.find_all('div', class_='result'):
                title = result.find('h2').text if result.find('h2') else ''
                snippet = result.find('a', class_='result__snippet').text if result.find('a', class_='result__snippet') else ''
                results.append({
                    'title': title,
                    'snippet': snippet
                })
            return results[:5]
        except Exception as e:
            print(f"Error in web search: {str(e)}")
            return []

class NewsAgent:
    """Agent to fetch real news data for stocks"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def get_stock_news(self, symbol: str, limit: int = 10) -> List[Dict]:
        """Get news articles for a specific stock symbol"""
        try:
            # First try Yahoo Finance API for stock news
            yahoo_news = self._get_yahoo_finance_news(symbol, limit)
            if yahoo_news and len(yahoo_news) >= limit:
                return yahoo_news[:limit]
                
            # Fallback to Alpha Vantage if available (through web scraping)
            alpha_news = self._get_general_market_news(symbol, limit)
            
            # Combine and limit results
            all_news = yahoo_news + alpha_news
            return all_news[:limit]
        except Exception as e:
            print(f"Error fetching news for {symbol}: {str(e)}")
            return []
    
    def _get_yahoo_finance_news(self, symbol: str, limit: int = 10) -> List[Dict]:
        """Get news from Yahoo Finance for a specific stock"""
        try:
            # Clean the symbol and add .NS for NSE stocks
            clean_symbol = symbol.strip().upper().replace('.NS', '')
            nse_symbol = f"{clean_symbol}.NS"
            
            stock = yf.Ticker(nse_symbol)
            news_items = stock.news
            
            if not news_items:
                return []
            
            formatted_news = []
            for item in news_items[:limit]:
                # Convert Unix timestamp to readable date
                timestamp = item.get('providerPublishTime', 0)
                date = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S') if timestamp else 'Unknown date'
                
                formatted_news.append({
                    'title': item.get('title', 'No title'),
                    'snippet': item.get('summary', 'No summary available'),
                    'source': item.get('publisher', 'Yahoo Finance'),
                    'url': item.get('link', ''),
                    'published_at': date
                })
            
            return formatted_news
        except Exception as e:
            print(f"Error fetching Yahoo Finance news for {symbol}: {str(e)}")
            return []
    
    def _get_general_market_news(self, symbol: str, limit: int = 5) -> List[Dict]:
        """Get general market news for a specific stock"""
        try:
            # Format URL for general market news search
            encoded_query = quote(f"{symbol} stock market news")
            url = f"https://news.google.com/rss/search?q={encoded_query}"
            
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                return []
                
            soup = BeautifulSoup(response.content, 'xml')
            items = soup.find_all('item')
            
            news_list = []
            for item in items[:limit]:
                title = item.find('title').text if item.find('title') else 'No title'
                description = item.find('description').text if item.find('description') else 'No description available'
                link = item.find('link').text if item.find('link') else ''
                pub_date = item.find('pubDate').text if item.find('pubDate') else 'Unknown date'
                
                news_list.append({
                    'title': title,
                    'snippet': description[:150] + '...' if len(description) > 150 else description,
                    'source': 'Google News',
                    'url': link,
                    'published_at': pub_date
                })
                
            return news_list
        except Exception as e:
            print(f"Error fetching general market news for {symbol}: {str(e)}")
            return []
    
    def get_market_news(self, limit: int = 10) -> List[Dict]:
        """Get general market news"""
        try:
            # Get Indian market news
            queries = ["indian stock market", "nse news", "sensex nifty news", "stock market india"]
            
            all_news = []
            for query in queries:
                encoded_query = quote(query)
                url = f"https://news.google.com/rss/search?q={encoded_query}"
                
                response = requests.get(url, headers=self.headers)
                if response.status_code != 200:
                    continue
                    
                soup = BeautifulSoup(response.content, 'xml')
                items = soup.find_all('item')
                
                for item in items[:5]:
                    title = item.find('title').text if item.find('title') else 'No title'
                    description = item.find('description').text if item.find('description') else 'No description available'
                    link = item.find('link').text if item.find('link') else ''
                    pub_date = item.find('pubDate').text if item.find('pubDate') else 'Unknown date'
                    
                    news_list = {
                        'title': title,
                        'snippet': description[:150] + '...' if len(description) > 150 else description,
                        'source': 'Google News',
                        'url': link,
                        'published_at': pub_date
                    }
                    
                    # Avoid duplicates by checking titles
                    if not any(n['title'] == title for n in all_news):
                        all_news.append(news_list)
            
            return all_news[:limit]
        except Exception as e:
            print(f"Error fetching market news: {str(e)}")
            return []

class IndianStockAgent:
    def __init__(self):
        self.groq_client = groq_client

    def get_stock_info(self, symbol: str) -> Dict:
        try:
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

    def analyze_technical_indicators(self, symbol: str) -> Dict:
        try:
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
            
            # Calculate SMAs
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
                
                return {
                    'sma20': round(float(latest['SMA20']), 2),
                    'sma50': round(float(latest['SMA50']), 2),
                    'rsi': round(float(latest['RSI']), 2),
                    'trend': 'Bullish' if latest['SMA20'] > latest['SMA50'] else 'Bearish',
                    'rsi_signal': 'Oversold' if latest['RSI'] < 30 else 'Overbought' if latest['RSI'] > 70 else 'Neutral',
                    'last_close': round(float(latest['Close']), 2),
                    'last_volume': int(latest['Volume']),
                    'data_points': len(hist)
                }
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

    def analyze_stock(self, symbol: str) -> Dict:
        # Clean the symbol
        symbol = symbol.strip().upper().replace('.NS', '')
        
        print(f"Fetching data for {symbol}...")
        
        stock_data = self.indian_stock_agent.get_stock_info(symbol)
        if 'error' in stock_data:
            print(f"Warning: {stock_data['error']}")
            
        technical_data = self.indian_stock_agent.analyze_technical_indicators(symbol)
        if 'error' in technical_data:
            print(f"Warning: {technical_data['error']}")
            
        news_data = self.web_search_agent.search(f"{symbol} stock news NSE India")
        
        analysis_prompt = f"""
        Analyze the following data for {symbol}:
        
        Stock Data: {stock_data}
        Technical Indicators: {technical_data}
        Recent News: {news_data}
        
        Please provide a comprehensive analysis including:
        1. Current market position and valuation
        2. Technical analysis interpretation (if data available)
        3. News sentiment analysis
        4. Trading recommendation (Short-term and Long-term)
        5. Key risks and opportunities
        6. Also tell if I buy at the current price, what should be the target price and stop loss. Explain your reasoning.

        
        Note: If some data is missing or shows errors, please focus on the available data and mention the limitations in your analysis.
        Also tell if I buy at the current price, what should be the target price and stop loss.
        """
        
        try:
            completion = self.groq_client.chat.completions.create(
                model="gemma2-9b-it",
                messages=[
                    {"role": "system", "content": "You are a professional Indian stock market analyst with expertise in technical and fundamental analysis."},
                    {"role": "user", "content": analysis_prompt}
                ]
            )
            
            analysis = completion.choices[0].message.content
            print(analysis)
            
            return {
                'stock_data': stock_data,
                'technical_data': technical_data,
                'news_data': news_data,
                'analysis': analysis
            }
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

class StocksDatabase:
    """Database to manage real stock data, indices, and market movers"""
    
    def __init__(self):
        self.indian_indices = {
            'NSEI': '^NSEI',  # Nifty 50
            'BSESN': '^BSESN',  # Sensex
            'NSEBANK': '^NSEBANK',  # Nifty Bank
            'CNXIT': '^CNXIT',  # CNX IT
            'NSMIDCP': '^NSMIDCP',  # Nifty Midcap
            'NSEMDCP100': '^NSEMDCP100',  # Nifty Midcap 100
            'CNXSMALL': '^CNXSMALL',  # Nifty Smallcap
            'NIFTY100': '^NIFTY100',  # Nifty 100
            'NIFTY200': '^NIFTY200',  # Nifty 200
        }
        
        self.nifty50_symbols = [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 
            'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'AXISBANK', 'BAJFINANCE',
            'ASIANPAINT', 'HCLTECH', 'WIPRO', 'SUNPHARMA', 'HDFC', 'ONGC',
            'MARUTI', 'ULTRACEMCO', 'TITAN', 'ADANIPORTS', 'TATASTEEL', 'POWERGRID',
            'BAJAJFINSV', 'NTPC', 'TECHM', 'DIVISLAB', 'JSWSTEEL', 'BRITANNIA',
            'TATAMOTORS', 'HINDALCO', 'NESTLEIND', 'DRREDDY', 'COALINDIA', 'GRASIM',
            'INDUSINDBK', 'SHREECEM', 'CIPLA', 'LT', 'HDFCLIFE', 'HEROMOTOCO',
            'BPCL', 'M&M', 'EICHERMOT', 'IOC', 'SBILIFE', 'ADANIENT', 'UPL', 'BAJAJ-AUTO'
        ]
        
        # Added sector mapping for common stocks
        self.sector_mapping = {
            'RELIANCE': 'Oil & Gas',
            'TCS': 'IT',
            'HDFCBANK': 'Banking',
            'INFY': 'IT',
            'ICICIBANK': 'Banking',
            'HINDUNILVR': 'FMCG',
            'ITC': 'FMCG',
            'SBIN': 'Banking',
            'BHARTIARTL': 'Telecom',
            'KOTAKBANK': 'Banking',
            'AXISBANK': 'Banking',
            'BAJFINANCE': 'Financial Services',
            'ASIANPAINT': 'Paints',
            'HCLTECH': 'IT',
            'WIPRO': 'IT',
            'SUNPHARMA': 'Pharma',
            'ONGC': 'Oil & Gas',
            'MARUTI': 'Auto',
            'ULTRACEMCO': 'Cement',
            'TITAN': 'Consumer Durables',
            'ADANIPORTS': 'Ports',
            'TATASTEEL': 'Metal',
            'POWERGRID': 'Power',
            'BAJAJFINSV': 'Financial Services',
            'NTPC': 'Power',
            'TECHM': 'IT',
            'DIVISLAB': 'Pharma',
            'JSWSTEEL': 'Metal',
            'BRITANNIA': 'FMCG',
            'TATAMOTORS': 'Auto',
            'HINDALCO': 'Metal',
            'NESTLEIND': 'FMCG',
            'DRREDDY': 'Pharma',
            'COALINDIA': 'Mining',
            'GRASIM': 'Cement',
            'INDUSINDBK': 'Banking',
            'SHREECEM': 'Cement',
            'CIPLA': 'Pharma',
            'LT': 'Construction',
            'HDFCLIFE': 'Insurance',
            'HEROMOTOCO': 'Auto',
            'BPCL': 'Oil & Gas',
            'M&M': 'Auto',
            'EICHERMOT': 'Auto',
            'IOC': 'Oil & Gas',
            'SBILIFE': 'Insurance',
            'ADANIENT': 'Diversified',
            'UPL': 'Agrochemicals',
            'BAJAJ-AUTO': 'Auto'
        }
    
    def get_company_name(self, symbol: str) -> str:
        """Get company name from symbol"""
        try:
            clean_symbol = symbol.replace('.NS', '')
            stock = yf.Ticker(f"{clean_symbol}.NS")
            if hasattr(stock, 'info') and 'longName' in stock.info:
                return stock.info['longName']
            return clean_symbol
        except Exception:
            return clean_symbol
    
    def get_sector(self, symbol: str) -> str:
        """Get sector for a stock symbol"""
        clean_symbol = symbol.replace('.NS', '')
        
        # First check our mapping
        if clean_symbol in self.sector_mapping:
            return self.sector_mapping[clean_symbol]
        
        # If not in mapping, try to get from Yahoo Finance
        try:
            stock = yf.Ticker(f"{clean_symbol}.NS")
            sector = stock.info.get('sector', 'Unknown')
            return sector if sector else 'Unknown'
        except Exception:
            return 'Unknown'
    
    def get_all_stocks_data(self, limit: int = 50) -> List[Dict]:
        """Get data for all stocks (or a subset of them)"""
        stocks_data = []
        
        try:
            # Use Nifty 50 symbols as default
            for symbol in self.nifty50_symbols[:limit]:
                try:
                    stock = yf.Ticker(f"{symbol}.NS")
                    hist = stock.history(period='5d')
                    
                    if hist.empty:
                        continue
                    
                    current_price = hist['Close'].iloc[-1]
                    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else hist['Open'].iloc[-1]
                    change = current_price - prev_close
                    change_percent = (change / prev_close) * 100
                    
                    # Get company name and metadata
                    company_name = self.get_company_name(symbol)
                    sector = self.get_sector(symbol)
                    
                    stocks_data.append({
                        'symbol': symbol,
                        'name': company_name,
                        'price': round(float(current_price), 2),
                        'change': round(float(change), 2),
                        'changePercent': round(float(change_percent), 2),
                        'sector': sector,
                        'volume': int(hist['Volume'].iloc[-1]),
                        'marketCap': stock.info.get('marketCap', 'N/A'),
                        'peRatio': stock.info.get('trailingPE', 'N/A'),
                        'eps': stock.info.get('trailingEps', 'N/A'),
                        'currency': 'INR' 
                    })
                except Exception as e:
                    print(f"Error getting data for {symbol}: {str(e)}")
                    continue
            
            return stocks_data
        except Exception as e:
            print(f"Error getting all stocks data: {str(e)}")
            return []
    
    def get_market_indices(self) -> List[Dict]:
        """Get market indices data"""
        indices_data = []
        
        try:
            for index_name, index_symbol in self.indian_indices.items():
                try:
                    index = yf.Ticker(index_symbol)
                    hist = index.history(period='5d')
                    
                    if hist.empty:
                        continue
                    
                    current_value = hist['Close'].iloc[-1]
                    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else hist['Open'].iloc[-1]
                    change = current_value - prev_close
                    change_percent = (change / prev_close) * 100
                    
                    # Format index name for display
                    display_name = index_name.replace('^', '')
                    if display_name == 'NSEI':
                        display_name = 'Nifty 50'
                    elif display_name == 'BSESN':
                        display_name = 'Sensex'
                    elif display_name == 'NSEBANK':
                        display_name = 'Nifty Bank'
                    
                    indices_data.append({
                        'symbol': index_name,
                        'name': display_name,
                        'price': round(float(current_value), 2),
                        'change': round(float(change), 2),
                        'changePercent': round(float(change_percent), 2),
                        'currency': 'INR'
                    })
                except Exception as e:
                    print(f"Error getting data for index {index_name}: {str(e)}")
                    continue
            
            return indices_data
        except Exception as e:
            print(f"Error getting market indices: {str(e)}")
            return []
    
    def get_market_movers(self) -> Dict:
        """Get market movers (gainers and losers)"""
        try:
            all_stocks = self.get_all_stocks_data(100)  # Get more stocks to find movers
            
            # Filter out stocks with invalid data
            valid_stocks = [stock for stock in all_stocks if 'changePercent' in stock and isinstance(stock['changePercent'], (int, float))]
            
            # Sort by percent change
            gainers = sorted(valid_stocks, key=lambda x: x['changePercent'], reverse=True)
            losers = sorted(valid_stocks, key=lambda x: x['changePercent'])
            
            # Get top 5 gainers and losers
            return {
                'gainers': gainers[:5],
                'losers': losers[:5]
            }
        except Exception as e:
            print(f"Error getting market movers: {str(e)}")
            return {'gainers': [], 'losers': []}
    
    def get_stock_price_history(self, symbol: str, period: str = '1y') -> List[Dict]:
        """Get historical price data for a stock"""
        try:
            # Clean the symbol and add .NS for NSE stocks
            clean_symbol = symbol.strip().upper().replace('.NS', '')
            nse_symbol = f"{clean_symbol}.NS"
            
            stock = yf.Ticker(nse_symbol)
            hist = stock.history(period=period)
            
            if hist.empty:
                return []
            
            # Format data for charting
            price_data = []
            for date, row in hist.iterrows():
                price_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'open': round(float(row['Open']), 2),
                    'high': round(float(row['High']), 2),
                    'low': round(float(row['Low']), 2),
                    'close': round(float(row['Close']), 2),
                    'volume': int(row['Volume']),
                    'currency': 'INR'
                })
            
            return price_data
        except Exception as e:
            print(f"Error fetching price history for {symbol}: {str(e)}")
            return []

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







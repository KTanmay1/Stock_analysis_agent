import autogen
from typing import List, Dict
import yfinance as yf
import requests
from bs4 import BeautifulSoup
import os
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv

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
                model="mixtral-8x7b-32768",
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

def main():
    print("Indian Stock Market Analysis Tool")
    print("================================")
    
    while True:
        print("\nEnter stock symbols (comma-separated) or 'quit' to exit:")
        user_input = input().strip()
        
        if user_input.lower() == 'quit':
            break
            
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
            print(analysis)
            format_output(analysis)

if __name__ == "__main__":
    main()


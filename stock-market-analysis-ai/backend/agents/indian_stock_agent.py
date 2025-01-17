import yfinance as yf
from datetime import datetime
from typing import Dict
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY)
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

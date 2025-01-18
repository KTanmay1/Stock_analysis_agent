import yfinance as yf
from typing import Dict

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
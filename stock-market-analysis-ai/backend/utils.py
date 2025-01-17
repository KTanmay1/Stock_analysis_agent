import yfinance as yf

def verify_stock_data(symbol: str) -> bool:
    try:
        stock = yf.Ticker(f"{symbol}.NS")
        hist = stock.history(period='1mo')
        return not hist.empty
    except Exception:
        return False
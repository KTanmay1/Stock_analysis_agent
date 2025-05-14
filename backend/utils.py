import yfinance as yf

def verify_stock_data(symbol: str) -> bool:
    try:
        nse_symbol = f"{symbol}.NS"
        stock = yf.Ticker(nse_symbol)
        hist = stock.history(period='1mo')
        return not hist.empty
    except:
        return False
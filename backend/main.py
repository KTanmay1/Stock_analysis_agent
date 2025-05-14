from fastapi import FastAPI
from stock_agents import IndianStockAgent, WebSearchAgent, FinancialAnalysisAgent, TrendingStocksAgent, NewsAgent, StocksDatabase
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
stock_agent = IndianStockAgent()
web_agent = WebSearchAgent()
financial_agent = FinancialAnalysisAgent()
news_agent = NewsAgent()
stocks_db = StocksDatabase()


@app.get("/")
def read_root():
    return {"message": "Welcome to Indian Stock Market Analysis Tool"}


@app.get("/analyze/{symbol}")
def analyze_stock(symbol: str):
    """
    Analyze stock based on symbol.
    Returns stock data, technical indicators, recent news, and AI analysis.
    """
    try:
        # Clean symbol input
        symbol = symbol.strip().upper().replace('.NS', '')
        
        print(f"Analyzing symbol: {symbol}")  # Debug log
        
        # Fetch stock data
        stock_data = stock_agent.get_stock_info(symbol)
        print(f"Stock data: {stock_data}")  # Debug log
        
        # Fetch technical indicators
        technical_data = stock_agent.analyze_technical_indicators(symbol)
        print(f"Technical data: {technical_data}")  # Debug log
        
        # Fetch recent news using the new NewsAgent
        news_data = news_agent.get_stock_news(symbol)
        print(f"News data: {len(news_data)} articles found")  # Debug log
        
        # Generate AI analysis
        analysis_result = financial_agent.analyze_stock(symbol)
        
        # Ensure we're getting the analysis from the result
        analysis = analysis_result.get('analysis', 'No AI analysis available.')
        if isinstance(analysis_result, dict) and 'error' in analysis_result:
            print(f"AI Analysis error: {analysis_result['error']}")  # Debug log
            analysis = f"Error in AI analysis: {analysis_result['error']}"
        
        # Get historical price data for charting
        price_history = stocks_db.get_stock_price_history(symbol)
        
        response_data = {
            "stock_data": stock_data,
            "technical_data": technical_data,
            "news_data": news_data,
            "analysis": analysis,
            "price_history": price_history
        }
        
        print(f"Complete response data: {response_data}")  # Debug log
        return response_data
        
    except Exception as e:
        print(f"Error in analyze_stock: {str(e)}")  # Debug log
        return {"error": f"Failed to analyze stock: {str(e)}"}


@app.get("/health")
def health_check():
    """
    Health check endpoint to verify if the API is running.
    """
    return {"status": "API is running fine."}


@app.get("/test_ai")
def test_ai_analysis():
    """
    Test the AI analysis endpoint directly to verify Groq integration.
    """
    try:
        test_result = financial_agent.analyze_stock("TEST")
        return {"test_analysis": test_result.get('analysis', 'No analysis generated.')}
    except Exception as e:
        return {"error": f"AI analysis failed: {str(e)}"}
    
@app.get("/trending")
async def get_trending_stocks():
    trending_agent = TrendingStocksAgent()
    trending_data = trending_agent.get_trending_stocks()
    sector_performance = trending_agent.get_sector_performance()
    
    return {
        "top_movers": trending_data['top_movers'],
        "most_active": trending_data['most_active'],
        "sector_performance": sector_performance
    }

@app.get("/market-movers")
async def get_market_movers():
    """
    Get real-time market movers (gainers and losers)
    """
    try:
        movers_data = stocks_db.get_market_movers()
        return movers_data
    except Exception as e:
        print(f"Error getting market movers: {str(e)}")
        return {"error": f"Failed to fetch market movers: {str(e)}"}

@app.get("/market-indices")
async def get_market_indices():
    """
    Get real-time market indices data
    """
    try:
        indices_data = stocks_db.get_market_indices()
        return {"indices": indices_data}
    except Exception as e:
        print(f"Error getting market indices: {str(e)}")
        return {"error": f"Failed to fetch market indices: {str(e)}"}

@app.get("/stocks")
async def get_all_stocks(limit: int = 50):
    """
    Get data for all stocks (or a subset)
    """
    try:
        stocks_data = stocks_db.get_all_stocks_data(limit)
        return {"stocks": stocks_data}
    except Exception as e:
        print(f"Error getting all stocks: {str(e)}")
        return {"error": f"Failed to fetch stocks: {str(e)}"}

@app.get("/news")
async def get_market_news(symbol: str = None, limit: int = 10):
    """
    Get market news or stock-specific news
    """
    try:
        if symbol:
            # Clean symbol input
            symbol = symbol.strip().upper().replace('.NS', '')
            news_data = news_agent.get_stock_news(symbol, limit)
            return {"news": news_data}
        else:
            # Get general market news
            news_data = news_agent.get_market_news(limit)
            return {"news": news_data}
    except Exception as e:
        print(f"Error getting news: {str(e)}")
        return {"error": f"Failed to fetch news: {str(e)}"}

@app.get("/stock-history/{symbol}")
async def get_stock_history(symbol: str, period: str = "1y"):
    """
    Get historical price data for a stock
    Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    """
    try:
        # Clean symbol input
        symbol = symbol.strip().upper().replace('.NS', '')
        
        # Validate period
        valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
        if period not in valid_periods:
            period = "1y"  # Default to 1 year if invalid
        
        history_data = stocks_db.get_stock_price_history(symbol, period)
        return {"history": history_data}
    except Exception as e:
        print(f"Error getting stock history: {str(e)}")
        return {"error": f"Failed to fetch stock history: {str(e)}"}


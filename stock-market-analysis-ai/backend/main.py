from fastapi import FastAPI
from stock_agents import IndianStockAgent, WebSearchAgent, FinancialAnalysisAgent, TrendingStocksAgent
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Initialize agents
stock_agent = IndianStockAgent()
web_agent = WebSearchAgent()
financial_agent = FinancialAnalysisAgent()


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
        
        # Fetch recent news
        news_data = web_agent.search(f"{symbol} stock news NSE India")
        print(f"News data: {len(news_data)} articles found")  # Debug log
        
        # Generate AI analysis
        analysis_result = financial_agent.analyze_stock(symbol)
        
        # Ensure we're getting the analysis from the result
        analysis = analysis_result.get('analysis', 'No AI analysis available.')
        if isinstance(analysis_result, dict) and 'error' in analysis_result:
            print(f"AI Analysis error: {analysis_result['error']}")  # Debug log
            analysis = f"Error in AI analysis: {analysis_result['error']}"
        
        response_data = {
            "stock_data": stock_data,
            "technical_data": technical_data,
            "news_data": news_data,
            "analysis": analysis
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


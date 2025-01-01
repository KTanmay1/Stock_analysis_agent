from fastapi import FastAPI
from stock_agents import IndianStockAgent, WebSearchAgent, FinancialAnalysisAgent
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
        
        # Fetch stock data
        stock_data = stock_agent.get_stock_info(symbol)
        if 'error' in stock_data:
            return {"error": stock_data['error']}

        # Fetch technical indicators
        technical_data = stock_agent.analyze_technical_indicators(symbol)
        if 'error' in technical_data:
            return {"error": technical_data['error']}

        # Fetch recent news
        news_data = web_agent.search(f"{symbol} stock news NSE India")

        # Generate AI analysis
        analysis_result = financial_agent.analyze_stock(symbol)
        analysis = analysis_result.get('analysis', 'No AI analysis available.')

        return {
            "stock_data": stock_data,
            "technical_data": technical_data,
            "news_data": news_data,
            "analysis": analysis
        }
    except Exception as e:
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
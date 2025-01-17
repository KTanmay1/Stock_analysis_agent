from fastapi import FastAPI
from agents.indian_stock_agent import IndianStockAgent
from agents.web_search_agent import WebSearchAgent
from agents.financial_analysis_agent import FinancialAnalysisAgent
from agents.trending_stocks_agent import TrendingStocksAgent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Initialize agents
stock_agent = IndianStockAgent()
web_agent = WebSearchAgent()
financial_agent = FinancialAnalysisAgent()
trending_agent = TrendingStocksAgent()


@app.get("/trending")
async def get_trending():
    # Add logic to return trending stocks
    return {"message": "Trending stocks"}

@app.get("/analyze/{symbol}")
async def analyze_stock(symbol: str):
    # Add logic to analyze the stock
    return {"symbol": symbol, "analysis": "Analysis data"}
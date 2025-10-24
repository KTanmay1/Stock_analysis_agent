from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import your existing agents
import sys
sys.path.append('/var/task')
from stock_agents import IndianStockAgent, WebSearchAgent, FinancialAnalysisAgent

# Initialize agents
stock_agent = IndianStockAgent()
web_agent = WebSearchAgent()
financial_agent = FinancialAnalysisAgent()

@app.get("/")
def read_root():
    return {"message": "Stock Analysis API - Vercel Serverless"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "stock-analysis-api"}

@app.get("/trending")
def get_trending_stocks():
    try:
        trending = stock_agent.get_trending_stocks()
        return {"trending": trending}
    except Exception as e:
        return {"error": str(e)}

@app.get("/analyze/{symbol}")
def analyze_stock(symbol: str):
    try:
        analysis_result = financial_agent.analyze_stock(symbol)
        return {
            "stock_data": analysis_result.get('stock_data', {}),
            "technical_data": analysis_result.get('technical_data', {}),
            "risk_data": analysis_result.get('risk_data', {}),
            "confidence_data": analysis_result.get('confidence_data', {}),
            "recommendation": analysis_result.get('recommendation', {}),
            "news_data": analysis_result.get('news_data', []),
            "sentiment_data": analysis_result.get('sentiment_data', None),
            "patterns": analysis_result.get('patterns', {}),
            "ai_synthesis": analysis_result.get('ai_synthesis', ''),
            "analysis": analysis_result.get('analysis', 'No AI analysis available.')
        }
    except Exception as e:
        return {"error": str(e)}

# Vercel serverless handler
def handler(request):
    return app(request.scope, request.receive, request.send)



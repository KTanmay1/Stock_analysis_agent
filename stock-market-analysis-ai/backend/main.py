from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from stock_agents import IndianStockAgent, WebSearchAgent, FinancialAnalysisAgent, TrendingStocksAgent
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "http://localhost:5173",  # Vite dev server
        "https://*.vercel.app",   # Vercel deployments
        "https://*.railway.app",  # Railway deployments
        "https://*.netlify.app",  # Netlify deployments
        "https://*.onrender.com", # Render deployments (legacy)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    Returns stock data, technical indicators, risk metrics, confidence scores,
    automated recommendation, recent news, and AI analysis.
    """
    try:
        # Clean symbol input
        symbol = symbol.strip().upper().replace('.NS', '')
        
        print(f"Analyzing symbol: {symbol}")  # Debug log
        
        # Generate comprehensive analysis using the financial agent
        # This returns all data: stock_data, technical_data, risk_data, 
        # confidence_data, recommendation, news_data, and analysis
        analysis_result = financial_agent.analyze_stock(symbol)
        
        # Check for errors
        if isinstance(analysis_result, dict) and 'error' in analysis_result:
            print(f"Analysis error: {analysis_result['error']}")  # Debug log
            return {"error": analysis_result['error']}
        
        # Return the complete analysis result
        # This now includes all the new fields from our enhancements
        print(f"Analysis completed successfully for {symbol}")  # Debug log
        
        return {
            "stock_data": analysis_result.get('stock_data', {}),
            "technical_data": analysis_result.get('technical_data', {}),
            "risk_data": analysis_result.get('risk_data', {}),
            "confidence_data": analysis_result.get('confidence_data', {}),
            "recommendation": analysis_result.get('recommendation', {}),
            "news_data": analysis_result.get('news_data', []),
            "sentiment_data": analysis_result.get('sentiment_data', None),
            "patterns": analysis_result.get('patterns', {}),  # NEW: Pattern analysis
            "ai_synthesis": analysis_result.get('ai_synthesis', ''),  # NEW: AI synthesis
            "analysis": analysis_result.get('analysis', 'No AI analysis available.')
        }
        
    except Exception as e:
        print(f"Error in analyze_stock: {str(e)}")  # Debug log
        import traceback
        traceback.print_exc()
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


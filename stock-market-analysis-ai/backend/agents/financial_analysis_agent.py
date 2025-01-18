from agents.web_search_agent import WebSearchAgent
from agents.indian_stock_agent import IndianStockAgent
from typing import Dict
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY)


class FinancialAnalysisAgent:
    def __init__(self):
        self.web_search_agent = WebSearchAgent()
        self.indian_stock_agent = IndianStockAgent()
        self.groq_client = groq_client

    def analyze_stock(self, symbol: str) -> Dict:
        # Clean the symbol
        symbol = symbol.strip().upper().replace('.NS', '')
        
        print(f"Fetching data for {symbol}...")
        
        stock_data = self.indian_stock_agent.get_stock_info(symbol)
        if 'error' in stock_data:
            print(f"Warning: {stock_data['error']}")
            
        technical_data = self.indian_stock_agent.analyze_technical_indicators(symbol)
        if 'error' in technical_data:
            print(f"Warning: {technical_data['error']}")
            
        news_data = self.web_search_agent.search(f"{symbol} stock news NSE India")
        
        analysis_prompt = f"""
        Analyze the following data for {symbol}:
        
        Stock Data: {stock_data}
        Technical Indicators: {technical_data}
        Recent News: {news_data}
        
        Please provide a comprehensive analysis including:
        1. Current market position and valuation
        2. Technical analysis interpretation (if data available)
        3. News sentiment analysis
        4. Trading recommendation (Short-term and Long-term)
        5. Key risks and opportunities
        6. Also tell if I buy at the current price, what should be the target price and stop loss. Explain your reasoning.

        
        Note: If some data is missing or shows errors, please focus on the available data and mention the limitations in your analysis.
        Also tell if I buy at the current price, what should be the target price and stop loss.
        """
        
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama3-70b-8192", #Model Name
                messages=[
                    {"role": "system", "content": "You are a professional Indian stock market analyst with expertise in technical and fundamental analysis."},
                    {"role": "user", "content": analysis_prompt}
                ]
            )
            
            analysis = completion.choices[0].message.content
            print(analysis)
            
            return {
                'stock_data': stock_data,
                'technical_data': technical_data,
                'news_data': news_data,
                'analysis': analysis
            }
        except Exception as e:
            return {'error': f"Error in analysis: {str(e)}"}

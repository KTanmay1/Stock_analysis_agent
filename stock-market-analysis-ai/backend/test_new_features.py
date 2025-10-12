"""
Quick test script for new features
"""

import sys
sys.path.append('.')

from stock_agents import IndianStockAgent, FinancialAnalysisAgent
from technical_indicators import (
    calculate_macd,
    calculate_bollinger_bands,
    calculate_emas,
    calculate_volume_indicators,
    calculate_atr,
    analyze_trend_multi_factor
)
from risk_confidence import (
    calculate_risk_metrics,
    calculate_confidence_score,
    generate_recommendation
)
import yfinance as yf

def test_technical_indicators():
    """Test new technical indicators"""
    print("\n" + "="*60)
    print("TESTING TECHNICAL INDICATORS")
    print("="*60)
    
    agent = IndianStockAgent()
    
    try:
        # Get technical data for INFY
        print("\nTesting with INFY stock...")
        tech_data = agent.analyze_technical_indicators('INFY')
        
        if 'error' in tech_data:
            print(f"⚠️  Warning: {tech_data['error']}")
            return
        
        # Print basic indicators
        print(f"\n📊 Basic Indicators:")
        print(f"   SMA20: {tech_data.get('sma20', 'N/A')}")
        print(f"   SMA50: {tech_data.get('sma50', 'N/A')}")
        print(f"   RSI: {tech_data.get('rsi', 'N/A')}")
        
        # Print MACD
        if 'macd' in tech_data and 'error' not in tech_data['macd']:
            macd = tech_data['macd']
            print(f"\n📈 MACD:")
            print(f"   MACD Line: {macd.get('macd', 'N/A')}")
            print(f"   Signal Line: {macd.get('signal', 'N/A')}")
            print(f"   Histogram: {macd.get('histogram', 'N/A')}")
            print(f"   Crossover: {macd.get('crossover', 'N/A')}")
        
        # Print Bollinger Bands
        if 'bollinger' in tech_data and 'error' not in tech_data['bollinger']:
            bb = tech_data['bollinger']
            print(f"\n📊 Bollinger Bands:")
            print(f"   Upper: {bb.get('upper_band', 'N/A')}")
            print(f"   Middle: {bb.get('middle_band', 'N/A')}")
            print(f"   Lower: {bb.get('lower_band', 'N/A')}")
            print(f"   Position: {bb.get('position', 'N/A')}%")
            print(f"   Signal: {bb.get('signal', 'N/A')}")
        
        # Print EMA
        if 'ema' in tech_data and 'error' not in tech_data['ema']:
            ema = tech_data['ema']
            print(f"\n📉 Exponential Moving Averages:")
            print(f"   EMA9: {ema.get('ema9', 'N/A')}")
            print(f"   EMA21: {ema.get('ema21', 'N/A')}")
            print(f"   EMA50: {ema.get('ema50', 'N/A')}")
            print(f"   Short-term Trend: {ema.get('short_term_trend', 'N/A')}")
            print(f"   Long-term Trend: {ema.get('long_term_trend', 'N/A')}")
            print(f"   Overall Trend: {ema.get('overall_trend', 'N/A')}")
        
        # Print Volume
        if 'volume' in tech_data and 'error' not in tech_data['volume']:
            vol = tech_data['volume']
            print(f"\n📊 Volume Indicators:")
            print(f"   OBV: {vol.get('obv', 'N/A'):,}")
            print(f"   OBV Trend: {vol.get('obv_trend', 'N/A')}")
            print(f"   Current Volume: {vol.get('current_volume', 'N/A'):,}")
            print(f"   Volume MA: {vol.get('volume_ma', 'N/A'):,}")
            print(f"   Volume Ratio: {vol.get('volume_ratio', 'N/A')}")
            print(f"   Volume Signal: {vol.get('volume_signal', 'N/A')}")
        
        # Print Trend Analysis
        if 'trend_analysis' in tech_data and 'error' not in tech_data['trend_analysis']:
            ta = tech_data['trend_analysis']
            print(f"\n🎯 Multi-Factor Trend Analysis:")
            print(f"   Trend: {ta.get('trend', 'N/A')}")
            print(f"   Strength: {ta.get('strength', 'N/A')}%")
            print(f"   Confidence: {ta.get('confidence', 'N/A')}%")
            print(f"   Bullish Score: {ta.get('bullish_score', 'N/A')}")
            print(f"   Bearish Score: {ta.get('bearish_score', 'N/A')}")
        
        print("\n✅ Technical indicators test PASSED")
        
    except Exception as e:
        print(f"\n❌ Technical indicators test FAILED: {str(e)}")
        import traceback
        traceback.print_exc()


def test_risk_metrics():
    """Test risk metrics"""
    print("\n" + "="*60)
    print("TESTING RISK METRICS")
    print("="*60)
    
    try:
        print("\nFetching 1-year historical data for TCS...")
        stock = yf.Ticker("TCS.NS")
        hist = stock.history(period='1y')
        
        if hist.empty:
            print("⚠️  No data available for risk calculation")
            return
        
        print(f"Data points: {len(hist)}")
        
        risk_data = calculate_risk_metrics('TCS', hist)
        
        if 'error' in risk_data:
            print(f"⚠️  Warning: {risk_data['error']}")
            return
        
        print(f"\n📊 Risk Metrics:")
        print(f"   Volatility: {risk_data.get('volatility', 'N/A')}%")
        print(f"   Max Drawdown: {risk_data.get('max_drawdown', 'N/A')}%")
        print(f"   Beta: {risk_data.get('beta', 'N/A')}")
        print(f"   Sharpe Ratio: {risk_data.get('sharpe_ratio', 'N/A')}")
        print(f"   Risk Level: {risk_data.get('risk_level', 'N/A')}")
        print(f"   Risk Score: {risk_data.get('risk_score', 'N/A')}")
        
        if 'interpretation' in risk_data:
            print(f"\n📝 Interpretation:")
            for key, value in risk_data['interpretation'].items():
                print(f"   {key}: {value}")
        
        print("\n✅ Risk metrics test PASSED")
        
    except Exception as e:
        print(f"\n❌ Risk metrics test FAILED: {str(e)}")
        import traceback
        traceback.print_exc()


def test_confidence_score():
    """Test confidence scoring"""
    print("\n" + "="*60)
    print("TESTING CONFIDENCE SCORING")
    print("="*60)
    
    try:
        agent = IndianStockAgent()
        
        print("\nFetching data for RELIANCE...")
        stock_data = agent.get_stock_info('RELIANCE')
        tech_data = agent.analyze_technical_indicators('RELIANCE')
        news_data = [{'title': 'Test news 1'}, {'title': 'Test news 2'}]
        
        confidence = calculate_confidence_score(stock_data, tech_data, news_data)
        
        if 'error' in confidence:
            print(f"⚠️  Warning: {confidence['error']}")
            return
        
        print(f"\n🎯 Confidence Score:")
        print(f"   Overall: {confidence.get('overall_confidence', 'N/A')}/100")
        print(f"   Level: {confidence.get('confidence_level', 'N/A')}")
        print(f"   Description: {confidence.get('description', 'N/A')}")
        
        if 'breakdown' in confidence:
            print(f"\n📊 Breakdown:")
            for key, value in confidence['breakdown'].items():
                print(f"   {key}: {value}")
        
        print("\n✅ Confidence scoring test PASSED")
        
    except Exception as e:
        print(f"\n❌ Confidence scoring test FAILED: {str(e)}")
        import traceback
        traceback.print_exc()


def test_recommendation():
    """Test recommendation generation"""
    print("\n" + "="*60)
    print("TESTING RECOMMENDATION GENERATION")
    print("="*60)
    
    try:
        agent = IndianStockAgent()
        
        print("\nGenerating recommendation for INFY...")
        stock_data = agent.get_stock_info('INFY')
        tech_data = agent.analyze_technical_indicators('INFY')
        
        # Get risk data
        stock = yf.Ticker("INFY.NS")
        hist = stock.history(period='1y')
        risk_data = calculate_risk_metrics('INFY', hist) if not hist.empty else {'error': 'No data'}
        
        # Get confidence
        confidence_data = calculate_confidence_score(stock_data, tech_data, [])
        
        # Generate recommendation
        recommendation = generate_recommendation(stock_data, tech_data, risk_data, confidence_data)
        
        if 'error' in recommendation:
            print(f"⚠️  Warning: {recommendation['error']}")
            return
        
        print(f"\n💡 Recommendation:")
        print(f"   Action: {recommendation.get('action', 'N/A')}")
        print(f"   Timeframe: {recommendation.get('timeframe', 'N/A')}")
        print(f"   Current Price: ₹{recommendation.get('current_price', 'N/A')}")
        print(f"   Target Price: ₹{recommendation.get('target_price', 'N/A')}")
        print(f"   Stop Loss: ₹{recommendation.get('stop_loss', 'N/A')}")
        print(f"   Upside Potential: {recommendation.get('upside_potential', 'N/A')}%")
        print(f"   Reasoning: {recommendation.get('reasoning', 'N/A')}")
        print(f"   Confidence: {recommendation.get('confidence', 'N/A')}")
        print(f"   Risk Level: {recommendation.get('risk_level', 'N/A')}")
        
        print("\n✅ Recommendation generation test PASSED")
        
    except Exception as e:
        print(f"\n❌ Recommendation generation test FAILED: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n🚀 TESTING NEW FEATURES")
    print("="*60)
    
    # Run all tests
    test_technical_indicators()
    test_risk_metrics()
    test_confidence_score()
    test_recommendation()
    
    print("\n" + "="*60)
    print("✅ ALL TESTS COMPLETED")
    print("="*60)


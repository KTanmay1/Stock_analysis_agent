"""
Risk metrics and confidence scoring for stock analysis
"""

import pandas as pd
import numpy as np
import yfinance as yf
from typing import Dict


def calculate_risk_metrics(symbol: str, hist: pd.DataFrame) -> Dict:
    """
    Calculate comprehensive risk metrics
    
    - Volatility (annualized standard deviation)
    - Maximum Drawdown
    - Beta (vs Nifty50)
    - Sharpe Ratio
    
    Args:
        symbol: Stock symbol
        hist: Historical price data
        
    Returns:
        Dict with risk metrics
    """
    try:
        # Calculate daily returns
        returns = hist['Close'].pct_change().dropna()
        
        if len(returns) < 10:
            return {'error': 'Insufficient data for risk calculation'}
        
        # 1. Volatility (annualized standard deviation)
        daily_vol = returns.std()
        annualized_vol = daily_vol * np.sqrt(252) * 100  # Convert to percentage
        
        # 2. Maximum Drawdown
        cumulative = (1 + returns).cumprod()
        running_max = cumulative.cummax()
        drawdown = (cumulative - running_max) / running_max
        max_drawdown = drawdown.min() * 100  # Convert to percentage
        
        # 3. Beta (vs Nifty50)
        beta = None
        try:
            nifty = yf.Ticker("^NSEI")
            nifty_hist = nifty.history(period='1y')
            
            if not nifty_hist.empty and len(nifty_hist) > 20:
                nifty_returns = nifty_hist['Close'].pct_change().dropna()
                
                # Align dates
                common_dates = returns.index.intersection(nifty_returns.index)
                
                if len(common_dates) > 20:
                    stock_returns_aligned = returns[common_dates]
                    nifty_returns_aligned = nifty_returns[common_dates]
                    
                    # Calculate covariance and variance
                    covariance = np.cov(stock_returns_aligned, nifty_returns_aligned)[0, 1]
                    nifty_variance = np.var(nifty_returns_aligned)
                    
                    if nifty_variance > 0:
                        beta = covariance / nifty_variance
        except:
            beta = None
        
        # 4. Sharpe Ratio (assuming risk-free rate of 6% for India)
        risk_free_rate = 0.06
        daily_rf = risk_free_rate / 252
        excess_returns = returns - daily_rf
        sharpe_ratio = (excess_returns.mean() / returns.std()) * np.sqrt(252) if returns.std() > 0 else 0
        
        # 5. Risk Classification
        if annualized_vol > 40:
            risk_level = 'high'
        elif annualized_vol > 25:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        # 6. Risk Score (0-100, higher = riskier)
        risk_score = min(annualized_vol + abs(max_drawdown), 100)
        
        return {
            'volatility': round(float(annualized_vol), 2),
            'max_drawdown': round(float(max_drawdown), 2),
            'beta': round(float(beta), 2) if beta is not None else None,
            'sharpe_ratio': round(float(sharpe_ratio), 2),
            'risk_level': risk_level,
            'risk_score': round(float(risk_score), 1),
            'interpretation': {
                'volatility': f"{'High' if annualized_vol > 30 else 'Moderate' if annualized_vol > 20 else 'Low'} volatility at {annualized_vol:.1f}%",
                'drawdown': f"Maximum loss from peak: {abs(max_drawdown):.1f}%",
                'beta': f"{'More volatile than market' if beta and beta > 1.2 else 'Less volatile than market' if beta and beta < 0.8 else 'Similar to market'}" if beta else 'Beta not available',
                'sharpe': f"{'Good' if sharpe_ratio > 1 else 'Moderate' if sharpe_ratio > 0.5 else 'Poor'} risk-adjusted returns"
            }
        }
        
    except Exception as e:
        return {'error': f'Risk calculation failed: {str(e)}'}


def calculate_confidence_score(stock_data: Dict, technical_data: Dict, news_data: list, sentiment_data: Dict = None) -> Dict:
    """
    Calculate confidence score for the analysis
    
    Based on:
    - Data completeness (25 points)
    - Signal strength (35 points)
    - Indicator agreement (25 points)
    - News sentiment clarity (15 points)
    
    Args:
        stock_data: Stock information
        technical_data: Technical indicators
        news_data: News articles list
        
    Returns:
        Dict with confidence score and breakdown
    """
    try:
        confidence_factors = {}
        total_confidence = 0
        
        # 1. Data completeness (0-25 points)
        data_quality = 0
        if 'error' not in stock_data:
            data_quality += 10
        if 'error' not in technical_data:
            data_quality += 10
        if len(news_data) >= 5:
            data_quality += 5
        elif len(news_data) >= 2:
            data_quality += 2
        
        confidence_factors['data_quality'] = round(data_quality, 1)
        total_confidence += data_quality
        
        # 2. Signal strength (0-35 points)
        signal_strength = 0
        if 'trend_analysis' in technical_data:
            trend = technical_data['trend_analysis']
            if 'strength' in trend:
                signal_strength = (trend['strength'] / 100) * 35
        else:
            # Fallback to basic trend
            if technical_data.get('trend') in ['Bullish', 'Bearish']:
                signal_strength = 20
        
        confidence_factors['signal_strength'] = round(signal_strength, 1)
        total_confidence += signal_strength
        
        # 3. Indicator agreement (0-25 points)
        indicator_agreement = 0
        if 'trend_analysis' in technical_data:
            trend = technical_data['trend_analysis']
            if 'confidence' in trend:
                indicator_agreement = (trend['confidence'] / 100) * 25
        else:
            # Check basic agreement
            indicators_count = sum([
                'rsi' in technical_data,
                'sma20' in technical_data,
                'sma50' in technical_data
            ])
            indicator_agreement = (indicators_count / 3) * 15
        
        confidence_factors['indicator_agreement'] = round(indicator_agreement, 1)
        total_confidence += indicator_agreement
        
        # 4. News sentiment clarity (0-15 points) - NOW USES REAL SENTIMENT
        news_clarity = 0
        
        if sentiment_data and 'overall_score' in sentiment_data:
            # Strong sentiment (positive or negative) = high confidence
            sentiment_strength = abs(sentiment_data['overall_score'])
            sentiment_confidence = sentiment_data.get('average_confidence', 0)
            
            # Combine strength and confidence
            # Strong, confident sentiment gives maximum points
            news_clarity = (sentiment_strength * 0.5 + sentiment_confidence * 0.5) * 15
        elif len(news_data) > 0:
            # Fallback: just count news (old behavior)
            news_clarity = min(len(news_data) / 10 * 15, 15)
        
        confidence_factors['news_sentiment'] = round(news_clarity, 1)
        total_confidence += news_clarity
        
        # Ensure total doesn't exceed 100
        total_confidence = min(total_confidence, 100)
        
        # Determine confidence level
        if total_confidence > 75:
            confidence_level = 'high'
            description = 'Strong confidence - multiple confirming signals and complete data'
        elif total_confidence > 50:
            confidence_level = 'medium'
            description = 'Moderate confidence - some signals agree, reasonable data quality'
        else:
            confidence_level = 'low'
            description = 'Low confidence - mixed signals or incomplete data'
        
        return {
            'overall_confidence': round(total_confidence, 1),
            'confidence_level': confidence_level,
            'description': description,
            'factors': confidence_factors,
            'breakdown': {
                'data_quality': f"{confidence_factors['data_quality']}/25",
                'signal_strength': f"{confidence_factors['signal_strength']}/35",
                'indicator_agreement': f"{confidence_factors['indicator_agreement']}/25",
                'news_sentiment': f"{confidence_factors['news_sentiment']}/15"  # UPDATED
            }
        }
        
    except Exception as e:
        return {'error': f'Confidence calculation failed: {str(e)}'}


def generate_recommendation(stock_data: Dict, technical_data: Dict, risk_data: Dict, confidence_data: Dict, sentiment_data: Dict = None) -> Dict:
    """
    Generate actionable recommendation based on all available data
    
    Args:
        stock_data: Stock information
        technical_data: Technical indicators
        risk_data: Risk metrics
        confidence_data: Confidence scores
        
    Returns:
        Dict with recommendation
    """
    try:
        # Check if we have enough data
        if 'error' in stock_data or 'error' in technical_data:
            return {
                'action': 'HOLD',
                'reason': 'Insufficient data for recommendation',
                'confidence': 'low'
            }
        
        # Get current price
        current_price = stock_data.get('current_price', 0)
        if current_price == 0:
            return {
                'action': 'HOLD',
                'reason': 'Price data unavailable',
                'confidence': 'low'
            }
        
        # Get trend
        trend = 'neutral'
        trend_strength = 50
        if 'trend_analysis' in technical_data:
            trend = technical_data['trend_analysis'].get('trend', 'neutral')
            trend_strength = technical_data['trend_analysis'].get('strength', 50)
        elif 'trend' in technical_data:
            trend = 'bullish' if technical_data['trend'] == 'Bullish' else 'bearish'
            trend_strength = 60
        
        # Get RSI
        rsi = technical_data.get('rsi', 50)
        
        # Get risk level
        risk_level = risk_data.get('risk_level', 'medium') if 'error' not in risk_data else 'medium'
        
        # Get confidence
        confidence_level = confidence_data.get('confidence_level', 'low') if 'error' not in confidence_data else 'low'
        
        # Get sentiment
        sentiment_score = 0
        sentiment_label = 'neutral'
        if sentiment_data:
            sentiment_score = sentiment_data.get('overall_score', 0)
            sentiment_label = sentiment_data.get('overall_sentiment', 'neutral')
        
        # Decision logic with sentiment
        action = 'HOLD'
        reason = []
        timeframe = 'Short-term (1-3 months)'
        
        # Strong bullish signals + sentiment
        if trend == 'bullish' and trend_strength > 60 and rsi < 70:
            if sentiment_score > 0.2:  # Positive news confirms
                action = 'BUY'
                reason.append(f'Strong bullish trend (strength: {trend_strength}%)')
                reason.append(f'Positive news sentiment (score: {sentiment_score:.2f})')
                timeframe = 'Medium-term (3-6 months)' if trend_strength > 75 else 'Short-term (1-3 months)'
            elif sentiment_score < -0.2:  # Negative news conflicts
                action = 'HOLD'
                reason.append(f'Bullish trend but negative news sentiment ({sentiment_score:.2f})')
                reason.append('Wait for sentiment to improve before buying')
            else:  # Neutral or weak sentiment
                action = 'BUY'
                reason.append(f'Strong bullish trend (strength: {trend_strength}%)')
                if rsi < 40:
                    reason.append(f'RSI indicates oversold at {rsi:.1f}')
                timeframe = 'Medium-term (3-6 months)' if trend_strength > 75 else 'Short-term (1-3 months)'
        
        # Strong bearish signals + sentiment
        elif trend == 'bearish' and trend_strength > 60 and rsi > 30:
            if sentiment_score < -0.2:  # Negative news confirms
                action = 'SELL'
                reason.append(f'Strong bearish trend (strength: {trend_strength}%)')
                reason.append(f'Negative news sentiment (score: {sentiment_score:.2f})')
            elif sentiment_score > 0.2:  # Positive news conflicts
                action = 'HOLD'
                reason.append(f'Bearish trend but positive news sentiment ({sentiment_score:.2f})')
                reason.append('Wait for clearer signals')
            else:  # Neutral or weak sentiment
                action = 'SELL'
                reason.append(f'Strong bearish trend (strength: {trend_strength}%)')
                if rsi > 60:
                    reason.append(f'RSI indicates overbought at {rsi:.1f}')
            timeframe = 'Short-term (1-3 months)'
        
        # Moderate bullish
        elif trend == 'bullish' and rsi < 60:
            action = 'BUY'
            reason.append(f'Moderate bullish trend')
            reason.append(f'RSI at healthy level: {rsi:.1f}')
            timeframe = 'Short-term (1-3 months)'
        
        # Overbought
        elif rsi > 75:
            action = 'SELL' if trend == 'bearish' else 'HOLD'
            reason.append(f'Overbought conditions (RSI: {rsi:.1f})')
        
        # Oversold
        elif rsi < 25:
            action = 'BUY' if trend != 'bearish' else 'HOLD'
            reason.append(f'Oversold conditions (RSI: {rsi:.1f})')
        
        # Sentiment-driven opportunities
        elif sentiment_score > 0.5 and rsi < 40:  # Very positive news + oversold
            action = 'BUY'
            reason.append(f'Very positive sentiment ({sentiment_score:.2f}) + oversold (RSI: {rsi:.1f})')
            reason.append('Strong buy opportunity from sentiment and technical alignment')
        
        elif sentiment_score < -0.5 and rsi > 60:  # Very negative news + overbought
            action = 'SELL'
            reason.append(f'Very negative sentiment ({sentiment_score:.2f}) + overbought (RSI: {rsi:.1f})')
            reason.append('Strong sell signal from sentiment and technical alignment')
        
        # Default to HOLD
        else:
            action = 'HOLD'
            reason.append('Mixed signals or neutral conditions')
        
        # Add sentiment to reason if strong (and not already mentioned)
        if abs(sentiment_score) > 0.3 and not any('sentiment' in r.lower() for r in reason):
            reason.append(f'News sentiment: {sentiment_label} ({sentiment_score:+.2f})')
        
        # Add risk warning
        if risk_level == 'high':
            reason.append('⚠️ High volatility stock - use caution')
        
        # Calculate target price (simple estimate)
        target_price = current_price
        stop_loss = current_price
        
        if action == 'BUY':
            # Target 8-15% upside depending on trend strength
            upside = 0.08 + (trend_strength / 100 * 0.07)
            target_price = current_price * (1 + upside)
            stop_loss = current_price * 0.92  # 8% stop loss
        elif action == 'SELL':
            # Target 8-15% downside
            downside = 0.08 + (trend_strength / 100 * 0.07)
            target_price = current_price * (1 - downside)
            stop_loss = current_price * 1.08  # 8% stop loss
        else:  # HOLD
            target_price = current_price * 1.05
            stop_loss = current_price * 0.95
        
        return {
            'action': action,
            'timeframe': timeframe,
            'target_price': round(target_price, 2),
            'stop_loss': round(stop_loss, 2),
            'current_price': round(current_price, 2),
            'upside_potential': round(((target_price / current_price) - 1) * 100, 1),
            'reasoning': ' | '.join(reason),
            'confidence': confidence_level,
            'risk_level': risk_level,
            'sentiment_score': sentiment_score,  # NEW
            'sentiment_label': sentiment_label   # NEW
        }
        
    except Exception as e:
        return {
            'action': 'HOLD',
            'reason': f'Error generating recommendation: {str(e)}',
            'confidence': 'low'
        }


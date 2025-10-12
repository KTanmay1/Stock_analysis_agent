"""
Advanced technical indicators for stock analysis
Includes MACD, Bollinger Bands, EMA, and Volume indicators
"""

import pandas as pd
import numpy as np
from typing import Dict


def calculate_macd(hist: pd.DataFrame) -> Dict:
    """
    Calculate MACD (Moving Average Convergence Divergence)
    
    MACD = 12-day EMA - 26-day EMA
    Signal = 9-day EMA of MACD
    Histogram = MACD - Signal
    
    Args:
        hist: DataFrame with 'Close' column
        
    Returns:
        Dict with MACD values and signals
    """
    try:
        # Calculate EMAs
        ema12 = hist['Close'].ewm(span=12, adjust=False).mean()
        ema26 = hist['Close'].ewm(span=26, adjust=False).mean()
        
        # Calculate MACD line
        macd = ema12 - ema26
        
        # Calculate signal line
        signal = macd.ewm(span=9, adjust=False).mean()
        
        # Calculate histogram
        histogram = macd - signal
        
        # Determine crossover signal
        crossover = 'bullish' if histogram.iloc[-1] > 0 else 'bearish'
        
        # Check for recent crossover (last 3 days)
        if len(histogram) >= 3:
            prev_histogram = histogram.iloc[-2]
            if histogram.iloc[-1] > 0 and prev_histogram <= 0:
                crossover = 'bullish_crossover'
            elif histogram.iloc[-1] < 0 and prev_histogram >= 0:
                crossover = 'bearish_crossover'
        
        return {
            'macd': round(float(macd.iloc[-1]), 2),
            'signal': round(float(signal.iloc[-1]), 2),
            'histogram': round(float(histogram.iloc[-1]), 2),
            'crossover': crossover
        }
        
    except Exception as e:
        return {'error': f'MACD calculation failed: {str(e)}'}


def calculate_bollinger_bands(hist: pd.DataFrame, period: int = 20, std_dev: float = 2) -> Dict:
    """
    Calculate Bollinger Bands
    
    Upper Band = SMA + (std_dev * standard deviation)
    Middle Band = SMA
    Lower Band = SMA - (std_dev * standard deviation)
    
    Args:
        hist: DataFrame with 'Close' column
        period: Period for SMA calculation (default: 20)
        std_dev: Number of standard deviations (default: 2)
        
    Returns:
        Dict with band values and position
    """
    try:
        # Calculate middle band (SMA)
        sma = hist['Close'].rolling(window=period).mean()
        
        # Calculate standard deviation
        std = hist['Close'].rolling(window=period).std()
        
        # Calculate bands
        upper_band = sma + (std * std_dev)
        lower_band = sma - (std * std_dev)
        
        # Get current price
        current_price = hist['Close'].iloc[-1]
        
        # Calculate position between bands (0-100%)
        band_width = upper_band.iloc[-1] - lower_band.iloc[-1]
        if band_width > 0:
            position = (current_price - lower_band.iloc[-1]) / band_width
        else:
            position = 0.5
        
        # Determine signal
        if position > 0.8:
            signal = 'overbought'
        elif position < 0.2:
            signal = 'oversold'
        else:
            signal = 'neutral'
        
        # Calculate bandwidth (volatility indicator)
        bandwidth = (band_width / sma.iloc[-1]) * 100
        
        return {
            'upper_band': round(float(upper_band.iloc[-1]), 2),
            'middle_band': round(float(sma.iloc[-1]), 2),
            'lower_band': round(float(lower_band.iloc[-1]), 2),
            'current_price': round(float(current_price), 2),
            'position': round(float(position * 100), 1),  # Convert to percentage
            'bandwidth': round(float(bandwidth), 2),
            'signal': signal
        }
        
    except Exception as e:
        return {'error': f'Bollinger Bands calculation failed: {str(e)}'}


def calculate_emas(hist: pd.DataFrame) -> Dict:
    """
    Calculate Exponential Moving Averages (9, 21, 50)
    
    EMA is more responsive to recent price changes than SMA
    
    Args:
        hist: DataFrame with 'Close' column
        
    Returns:
        Dict with EMA values and trend signals
    """
    try:
        # Calculate EMAs
        ema9 = hist['Close'].ewm(span=9, adjust=False).mean()
        ema21 = hist['Close'].ewm(span=21, adjust=False).mean()
        ema50 = hist['Close'].ewm(span=50, adjust=False).mean()
        
        # Determine trends
        short_term_trend = 'bullish' if ema9.iloc[-1] > ema21.iloc[-1] else 'bearish'
        long_term_trend = 'bullish' if ema21.iloc[-1] > ema50.iloc[-1] else 'bearish'
        
        # Overall trend (all EMAs aligned)
        if ema9.iloc[-1] > ema21.iloc[-1] > ema50.iloc[-1]:
            overall_trend = 'strong_bullish'
        elif ema9.iloc[-1] < ema21.iloc[-1] < ema50.iloc[-1]:
            overall_trend = 'strong_bearish'
        else:
            overall_trend = 'neutral'
        
        return {
            'ema9': round(float(ema9.iloc[-1]), 2),
            'ema21': round(float(ema21.iloc[-1]), 2),
            'ema50': round(float(ema50.iloc[-1]), 2),
            'short_term_trend': short_term_trend,
            'long_term_trend': long_term_trend,
            'overall_trend': overall_trend
        }
        
    except Exception as e:
        return {'error': f'EMA calculation failed: {str(e)}'}


def calculate_volume_indicators(hist: pd.DataFrame) -> Dict:
    """
    Calculate volume-based indicators
    
    - On-Balance Volume (OBV): Cumulative volume based on price direction
    - Volume Moving Average
    - Volume Ratio: Current volume vs average
    
    Args:
        hist: DataFrame with 'Close' and 'Volume' columns
        
    Returns:
        Dict with volume indicators
    """
    try:
        # Calculate On-Balance Volume (OBV)
        # Add volume when price goes up, subtract when price goes down
        price_change = hist['Close'].diff()
        obv = (hist['Volume'] * ((price_change > 0).astype(int) - (price_change < 0).astype(int))).cumsum()
        
        # Calculate Volume Moving Average (20-day)
        vol_ma = hist['Volume'].rolling(window=20).mean()
        
        # Get current volume
        current_vol = hist['Volume'].iloc[-1]
        
        # Calculate volume ratio
        if vol_ma.iloc[-1] > 0:
            vol_ratio = current_vol / vol_ma.iloc[-1]
        else:
            vol_ratio = 1.0
        
        # Determine volume signal
        if vol_ratio > 1.5:
            volume_signal = 'high'
        elif vol_ratio < 0.5:
            volume_signal = 'low'
        else:
            volume_signal = 'normal'
        
        # OBV trend (last 5 days)
        if len(obv) >= 5:
            obv_change = obv.iloc[-1] - obv.iloc[-5]
            obv_trend = 'rising' if obv_change > 0 else 'falling' if obv_change < 0 else 'flat'
        else:
            obv_trend = 'unknown'
        
        return {
            'obv': int(obv.iloc[-1]) if not pd.isna(obv.iloc[-1]) else 0,
            'obv_trend': obv_trend,
            'volume_ma': int(vol_ma.iloc[-1]) if not pd.isna(vol_ma.iloc[-1]) else 0,
            'current_volume': int(current_vol),
            'volume_ratio': round(float(vol_ratio), 2),
            'volume_signal': volume_signal
        }
        
    except Exception as e:
        return {'error': f'Volume indicators calculation failed: {str(e)}'}


def calculate_atr(hist: pd.DataFrame, period: int = 14) -> Dict:
    """
    Calculate Average True Range (ATR) - volatility indicator
    
    Args:
        hist: DataFrame with 'High', 'Low', 'Close' columns
        period: Period for ATR calculation (default: 14)
        
    Returns:
        Dict with ATR value and volatility assessment
    """
    try:
        # Calculate True Range
        high_low = hist['High'] - hist['Low']
        high_close = np.abs(hist['High'] - hist['Close'].shift())
        low_close = np.abs(hist['Low'] - hist['Close'].shift())
        
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        
        # Calculate ATR
        atr = tr.rolling(window=period).mean()
        
        # Calculate volatility as percentage of price
        current_price = hist['Close'].iloc[-1]
        volatility_pct = (atr.iloc[-1] / current_price) * 100
        
        # Classify volatility
        if volatility_pct > 3:
            volatility_level = 'high'
        elif volatility_pct > 1.5:
            volatility_level = 'medium'
        else:
            volatility_level = 'low'
        
        return {
            'atr': round(float(atr.iloc[-1]), 2),
            'volatility_pct': round(float(volatility_pct), 2),
            'volatility_level': volatility_level
        }
        
    except Exception as e:
        return {'error': f'ATR calculation failed: {str(e)}'}


def analyze_trend_multi_factor(technical_data: Dict) -> Dict:
    """
    Multi-factor trend analysis combining multiple indicators
    
    Args:
        technical_data: Dict containing all technical indicators
        
    Returns:
        Dict with trend, strength, and confidence scores
    """
    try:
        signals = []
        
        # SMA signals (weight: 0.8)
        if 'sma20' in technical_data and 'sma50' in technical_data:
            if technical_data['sma20'] > technical_data['sma50']:
                signals.append(('sma', 'bullish', 0.8))
            else:
                signals.append(('sma', 'bearish', 0.8))
        
        # MACD signals (weight: 0.9)
        if 'macd' in technical_data and isinstance(technical_data['macd'], dict):
            macd_data = technical_data['macd']
            if macd_data.get('crossover') in ['bullish', 'bullish_crossover']:
                signals.append(('macd', 'bullish', 0.9 if 'crossover' in macd_data.get('crossover') else 0.7))
            else:
                signals.append(('macd', 'bearish', 0.9 if 'crossover' in macd_data.get('crossover') else 0.7))
        
        # RSI signals (weight: 0.7)
        if 'rsi' in technical_data:
            rsi = technical_data['rsi']
            if rsi < 30:
                signals.append(('rsi', 'bullish', 0.7))  # Oversold = potential buy
            elif rsi > 70:
                signals.append(('rsi', 'bearish', 0.7))  # Overbought = potential sell
            else:
                signals.append(('rsi', 'neutral', 0.3))
        
        # EMA signals (weight: 0.8)
        if 'ema' in technical_data and isinstance(technical_data['ema'], dict):
            ema_trend = technical_data['ema'].get('overall_trend', 'neutral')
            if ema_trend == 'strong_bullish':
                signals.append(('ema', 'bullish', 0.9))
            elif ema_trend == 'strong_bearish':
                signals.append(('ema', 'bearish', 0.9))
            elif ema_trend == 'bullish':
                signals.append(('ema', 'bullish', 0.6))
            elif ema_trend == 'bearish':
                signals.append(('ema', 'bearish', 0.6))
        
        # Volume confirmation (weight: 0.6)
        if 'volume' in technical_data and isinstance(technical_data['volume'], dict):
            volume_signal = technical_data['volume'].get('volume_signal')
            obv_trend = technical_data['volume'].get('obv_trend')
            if volume_signal == 'high' and obv_trend == 'rising':
                signals.append(('volume', 'confirming', 0.6))
            elif volume_signal == 'high' and obv_trend == 'falling':
                signals.append(('volume', 'diverging', 0.6))
        
        # Bollinger Bands signals (weight: 0.5)
        if 'bollinger' in technical_data and isinstance(technical_data['bollinger'], dict):
            bb_signal = technical_data['bollinger'].get('signal')
            if bb_signal == 'oversold':
                signals.append(('bollinger', 'bullish', 0.5))
            elif bb_signal == 'overbought':
                signals.append(('bollinger', 'bearish', 0.5))
        
        if not signals:
            return {
                'trend': 'neutral',
                'strength': 0,
                'confidence': 0,
                'signals': {}
            }
        
        # Calculate consensus
        bullish_score = sum(weight for name, signal, weight in signals if signal == 'bullish')
        bearish_score = sum(weight for name, signal, weight in signals if signal == 'bearish')
        neutral_score = sum(weight for name, signal, weight in signals if signal == 'neutral')
        
        total = bullish_score + bearish_score + neutral_score
        
        if total == 0:
            return {
                'trend': 'neutral',
                'strength': 0,
                'confidence': 0,
                'signals': {}
            }
        
        # Determine trend
        if bullish_score > bearish_score and bullish_score > neutral_score:
            trend = 'bullish'
            strength = (bullish_score / (bullish_score + bearish_score)) * 100 if (bullish_score + bearish_score) > 0 else 50
        elif bearish_score > bullish_score and bearish_score > neutral_score:
            trend = 'bearish'
            strength = (bearish_score / (bullish_score + bearish_score)) * 100 if (bullish_score + bearish_score) > 0 else 50
        else:
            trend = 'neutral'
            strength = 50
        
        # Calculate confidence (how well signals agree)
        max_score = max(bullish_score, bearish_score, neutral_score)
        confidence = (max_score / total) * 100
        
        return {
            'trend': trend,
            'strength': round(float(strength), 1),
            'confidence': round(float(confidence), 1),
            'signals': {name: signal for name, signal, _ in signals},
            'bullish_score': round(float(bullish_score), 2),
            'bearish_score': round(float(bearish_score), 2)
        }
        
    except Exception as e:
        return {'error': f'Trend analysis failed: {str(e)}'}


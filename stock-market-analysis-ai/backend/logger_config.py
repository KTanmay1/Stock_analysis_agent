"""
Structured logging configuration for stock analysis agents
Provides performance monitoring and error tracking
"""

import logging
import json
import time
from datetime import datetime
from functools import wraps
from typing import Any, Callable

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stock_analysis.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('stock_agents')


class PerformanceTimer:
    """Context manager for timing operations"""
    
    def __init__(self, operation_name: str):
        self.operation_name = operation_name
        self.start_time = None
        self.end_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        logger.info(f"Starting: {self.operation_name}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.time()
        elapsed = self.end_time - self.start_time
        
        if exc_type is None:
            logger.info(f"Completed: {self.operation_name} in {elapsed:.2f}s")
        else:
            logger.error(f"Failed: {self.operation_name} after {elapsed:.2f}s - {exc_val}")
        
        return False  # Don't suppress exceptions


def log_function_call(func: Callable) -> Callable:
    """Decorator to log function calls with timing"""
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        func_name = func.__name__
        
        # Log function call
        logger.debug(f"Calling: {func_name} with args={args}, kwargs={kwargs}")
        
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            elapsed = time.time() - start_time
            
            # Check if result contains error
            if isinstance(result, dict) and 'error' in result:
                logger.warning(f"{func_name} returned error: {result['error']} (took {elapsed:.2f}s)")
            else:
                logger.info(f"{func_name} completed successfully in {elapsed:.2f}s")
            
            return result
            
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"{func_name} raised exception after {elapsed:.2f}s: {str(e)}", exc_info=True)
            raise
    
    return wrapper


def log_analysis_result(symbol: str, result: dict):
    """Log structured analysis result"""
    
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'symbol': symbol,
        'has_stock_data': 'error' not in result.get('stock_data', {}),
        'has_technical_data': 'error' not in result.get('technical_data', {}),
        'news_count': len(result.get('news_data', [])),
        'has_analysis': 'analysis' in result and len(result.get('analysis', '')) > 0
    }
    
    logger.info(f"Analysis Result: {json.dumps(log_data)}")


def log_performance_metrics(metrics: dict):
    """Log performance metrics in structured format"""
    
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'metrics': metrics
    }
    
    logger.info(f"Performance Metrics: {json.dumps(log_data)}")


# Example usage:
# with PerformanceTimer("Fetching stock data"):
#     data = fetch_data()
#
# @log_function_call
# def my_function():
#     pass


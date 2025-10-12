"""
Test suite for stock_agents.py
Tests current functionality and establishes baseline metrics
"""

import sys
import time
from stock_agents import (
    IndianStockAgent, 
    WebSearchAgent, 
    FinancialAnalysisAgent,
    TrendingStocksAgent,
    verify_stock_data
)

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.test_results = []
    
    def run_test(self, test_name, test_func):
        """Run a single test and track results"""
        print(f"\n🧪 Testing: {test_name}")
        try:
            start_time = time.time()
            test_func()
            elapsed = time.time() - start_time
            print(f"✅ PASSED ({elapsed:.2f}s)")
            self.passed += 1
            self.test_results.append({
                'name': test_name,
                'status': 'PASSED',
                'time': elapsed
            })
        except AssertionError as e:
            print(f"❌ FAILED: {str(e)}")
            self.failed += 1
            self.test_results.append({
                'name': test_name,
                'status': 'FAILED',
                'error': str(e)
            })
        except Exception as e:
            print(f"💥 ERROR: {str(e)}")
            self.failed += 1
            self.test_results.append({
                'name': test_name,
                'status': 'ERROR',
                'error': str(e)
            })
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.passed + self.failed}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Success Rate: {(self.passed / (self.passed + self.failed) * 100):.1f}%")
        print("="*60)


# Test functions
def test_stock_data_fetching():
    """Test basic stock data fetching for known stocks"""
    agent = IndianStockAgent()
    
    # Test RELIANCE
    data = agent.get_stock_info('RELIANCE')
    assert 'error' not in data, f"Failed to fetch RELIANCE: {data.get('error')}"
    assert 'current_price' in data, "Missing current_price field"
    assert data['current_price'] > 0, "Invalid current_price"
    assert data['symbol'] == 'RELIANCE.NS', f"Wrong symbol: {data['symbol']}"
    print(f"   RELIANCE price: ₹{data['current_price']}")
    
    # Test TCS
    data = agent.get_stock_info('TCS')
    assert 'error' not in data, f"Failed to fetch TCS: {data.get('error')}"
    assert data['current_price'] > 0, "Invalid TCS price"
    print(f"   TCS price: ₹{data['current_price']}")


def test_technical_indicators():
    """Test technical indicators calculation"""
    agent = IndianStockAgent()
    
    data = agent.analyze_technical_indicators('INFY')
    
    # Check for errors
    if 'error' in data:
        print(f"   Warning: {data['error']}")
        return
    
    # Validate fields exist
    assert 'sma20' in data, "Missing SMA20"
    assert 'sma50' in data, "Missing SMA50"
    assert 'rsi' in data, "Missing RSI"
    assert 'trend' in data, "Missing trend"
    
    # Validate values are reasonable
    assert 0 < data['rsi'] < 100, f"RSI out of range: {data['rsi']}"
    assert data['sma20'] > 0, "Invalid SMA20"
    assert data['sma50'] > 0, "Invalid SMA50"
    assert data['trend'] in ['Bullish', 'Bearish'], f"Invalid trend: {data['trend']}"
    
    print(f"   RSI: {data['rsi']:.2f}")
    print(f"   Trend: {data['trend']}")
    print(f"   SMA20: {data['sma20']}, SMA50: {data['sma50']}")


def test_invalid_symbol():
    """Test error handling with invalid symbol"""
    agent = IndianStockAgent()
    
    data = agent.get_stock_info('INVALID_XYZ')
    # Should return error or empty data
    assert 'error' in data or data.get('current_price') == 'N/A', \
        "Should handle invalid symbol gracefully"
    print("   Handled invalid symbol correctly")


def test_web_search():
    """Test web search functionality"""
    agent = WebSearchAgent()
    
    results = agent.search("RELIANCE stock news India")
    
    # Should return some results (might be empty but shouldn't crash)
    assert isinstance(results, list), "Results should be a list"
    print(f"   Found {len(results)} news articles")
    
    if results:
        assert 'title' in results[0], "News item missing title"
        assert 'snippet' in results[0], "News item missing snippet"
        print(f"   Sample: {results[0]['title'][:50]}...")


def test_trending_stocks():
    """Test trending stocks functionality"""
    agent = TrendingStocksAgent()
    
    data = agent.get_trending_stocks()
    
    if 'error' in data:
        print(f"   Warning: {data['error']}")
        return
    
    assert 'top_movers' in data, "Missing top_movers"
    assert 'most_active' in data, "Missing most_active"
    
    assert len(data['top_movers']) > 0, "No top movers found"
    assert len(data['most_active']) > 0, "No most active found"
    
    print(f"   Top movers: {len(data['top_movers'])}")
    print(f"   Most active: {len(data['most_active'])}")
    
    # Check first mover has required fields
    first = data['top_movers'][0]
    assert 'symbol' in first, "Missing symbol"
    assert 'performance_5d' in first, "Missing performance"
    print(f"   Best performer: {first['symbol']} ({first['performance_5d']:+.2f}%)")


def test_sector_performance():
    """Test sector performance calculation"""
    agent = TrendingStocksAgent()
    
    data = agent.get_sector_performance()
    
    if 'error' in data:
        print(f"   Warning: {data['error']}")
        return
    
    assert isinstance(data, dict), "Should return dict"
    assert len(data) > 0, "Should have sector data"
    
    print(f"   Sectors analyzed: {len(data)}")
    for sector, perf in list(data.items())[:3]:
        print(f"   {sector}: {perf:+.2f}%")


def test_verify_stock_data():
    """Test stock verification function"""
    # Valid stock
    assert verify_stock_data('RELIANCE') == True, "RELIANCE should be valid"
    
    # Invalid stock
    result = verify_stock_data('INVALID_XYZ')
    print(f"   Invalid stock verification: {result}")


def test_full_analysis_pipeline():
    """Test complete stock analysis pipeline"""
    agent = FinancialAnalysisAgent()
    
    print("   Running full analysis (may take 10-15 seconds)...")
    result = agent.analyze_stock('TCS')
    
    if 'error' in result:
        print(f"   Warning: {result['error']}")
        return
    
    # Check all components present
    assert 'stock_data' in result, "Missing stock_data"
    assert 'technical_data' in result, "Missing technical_data"
    assert 'news_data' in result, "Missing news_data"
    assert 'analysis' in result, "Missing AI analysis"
    
    # Check AI analysis is not empty
    assert len(result['analysis']) > 50, "AI analysis too short"
    
    print(f"   Stock data: ✅")
    print(f"   Technical data: ✅")
    print(f"   News articles: {len(result['news_data'])}")
    print(f"   AI analysis: {len(result['analysis'])} characters")


def test_performance_baseline():
    """Measure baseline performance metrics"""
    agent = FinancialAnalysisAgent()
    
    print("   Measuring single stock analysis time...")
    start = time.time()
    agent.analyze_stock('INFY')
    single_time = time.time() - start
    
    print(f"   ⏱️  Single stock analysis: {single_time:.2f}s")
    
    # Baseline should be under 30 seconds
    assert single_time < 30, f"Too slow: {single_time:.2f}s"


# Main test runner
def run_all_tests():
    """Run all tests and generate report"""
    print("\n" + "="*60)
    print("🚀 STOCK AGENTS TEST SUITE")
    print("="*60)
    print("Testing current functionality and establishing baseline...")
    
    runner = TestRunner()
    
    # Run all tests
    runner.run_test("Stock Data Fetching", test_stock_data_fetching)
    runner.run_test("Technical Indicators", test_technical_indicators)
    runner.run_test("Invalid Symbol Handling", test_invalid_symbol)
    runner.run_test("Web Search", test_web_search)
    runner.run_test("Trending Stocks", test_trending_stocks)
    runner.run_test("Sector Performance", test_sector_performance)
    runner.run_test("Stock Verification", test_verify_stock_data)
    runner.run_test("Full Analysis Pipeline", test_full_analysis_pipeline)
    runner.run_test("Performance Baseline", test_performance_baseline)
    
    # Print summary
    runner.print_summary()
    
    return runner


if __name__ == "__main__":
    runner = run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(0 if runner.failed == 0 else 1)


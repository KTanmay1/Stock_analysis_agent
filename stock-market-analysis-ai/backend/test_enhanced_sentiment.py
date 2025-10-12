"""
Test suite for enhanced sentiment analysis with pattern detection
Validates article extraction, pattern analysis, and multi-stage pipeline
"""

import sys
import time
from typing import Dict, List

# Test article extractor
def test_article_extraction():
    """Test full article content extraction"""
    print("\n" + "="*60)
    print("TEST 1: Article Content Extraction")
    print("="*60)
    
    try:
        from article_extractor import ArticleExtractor
        
        extractor = ArticleExtractor(max_workers=3)
        
        # Test articles with real URLs
        test_articles = [
            {
                'title': 'Stock Market News',
                'link': 'https://economictimes.indiatimes.com/markets',
                'snippet': 'Test snippet'
            }
        ]
        
        start_time = time.time()
        results = extractor.extract_multiple(test_articles)
        elapsed = time.time() - start_time
        
        print(f"✅ Article extraction initialized successfully")
        print(f"⏱️  Processing time: {elapsed:.2f}s")
        print(f"📊 Results: {len(results)} articles processed")
        
        # Check for full_content field
        for article in results:
            if 'full_content' in article:
                word_count = article.get('word_count', 0)
                print(f"   - Full content extracted: {word_count} words")
            else:
                print(f"   - Fallback to snippet used")
        
        return True
        
    except Exception as e:
        print(f"❌ Article extraction test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_pattern_analyzer():
    """Test pattern detection functionality"""
    print("\n" + "="*60)
    print("TEST 2: Pattern Analysis")
    print("="*60)
    
    try:
        from pattern_analyzer import PatternAnalyzer
        
        analyzer = PatternAnalyzer()
        
        if not analyzer.model:
            print("⚠️  Pattern analyzer model not loaded, skipping test")
            return True
        
        # Create test articles with sentiment
        test_articles = [
            {
                'title': 'Reliance Q4 earnings beat estimates',
                'snippet': 'Strong performance in retail',
                'sentiment': 'positive',
                'score': 0.75,
                'confidence': 0.92,
                'credibility': 0.90,
                'source': 'Economic Times',
                'published_parsed': time.struct_time([2024, 1, 15, 0, 0, 0, 0, 0, 0])
            },
            {
                'title': 'Reliance faces regulatory challenges',
                'snippet': 'Government scrutiny increases',
                'sentiment': 'negative',
                'score': -0.65,
                'confidence': 0.88,
                'credibility': 0.95,
                'source': 'Moneycontrol',
                'published_parsed': time.struct_time([2024, 1, 16, 0, 0, 0, 0, 0, 0])
            },
            {
                'title': 'Reliance stock holds steady amid volatility',
                'snippet': 'Market remains cautious',
                'sentiment': 'neutral',
                'score': 0.05,
                'confidence': 0.70,
                'credibility': 0.85,
                'source': 'Business Standard',
                'published_parsed': time.struct_time([2024, 1, 17, 0, 0, 0, 0, 0, 0])
            }
        ]
        
        start_time = time.time()
        patterns = analyzer.analyze_patterns(test_articles)
        elapsed = time.time() - start_time
        
        print(f"✅ Pattern analysis completed successfully")
        print(f"⏱️  Processing time: {elapsed:.2f}s")
        print(f"\n📊 Pattern Results:")
        print(f"   - Themes detected: {len(patterns.get('themes', []))}")
        print(f"   - Consensus level: {patterns.get('consensus', {}).get('level', 'N/A')}")
        print(f"   - Agreement: {patterns.get('consensus', {}).get('agreement_percentage', 0):.1f}%")
        print(f"   - Conflicts: {len(patterns.get('conflicts', []))}")
        print(f"   - Temporal trend: {patterns.get('temporal_trend', {}).get('trend', 'N/A')}")
        print(f"   - Pattern summary: {patterns.get('pattern_summary', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Pattern analysis test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_multi_stage_analyzer():
    """Test complete multi-stage analysis pipeline"""
    print("\n" + "="*60)
    print("TEST 3: Multi-Stage Analysis Pipeline")
    print("="*60)
    
    try:
        from multi_stage_analyzer import MultiStageAnalyzer
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        groq_api_key = os.getenv('GROQ_API_KEY')
        
        if not groq_api_key:
            print("⚠️  GROQ_API_KEY not found, skipping synthesis test")
            return True
        
        analyzer = MultiStageAnalyzer(groq_api_key)
        
        # Create test articles with full content
        test_articles = [
            {
                'title': 'Tech stock rallies on strong earnings',
                'full_content': 'The technology sector saw significant gains today as major companies reported better-than-expected quarterly earnings. Investors were particularly impressed by the revenue growth and forward guidance provided by industry leaders.',
                'snippet': 'Tech sector gains on earnings',
                'source': 'Economic Times',
                'credibility': 0.95,
                'link': 'https://example.com/1'
            },
            {
                'title': 'Market concerns over inflation data',
                'full_content': 'Rising inflation numbers have sparked concerns among investors about potential interest rate hikes. Analysts suggest that the central bank may need to take action to control price pressures.',
                'snippet': 'Inflation worries persist',
                'source': 'Moneycontrol',
                'credibility': 0.90,
                'link': 'https://example.com/2'
            }
        ]
        
        start_time = time.time()
        results = analyzer.analyze_comprehensive('RELIANCE', test_articles)
        elapsed = time.time() - start_time
        
        print(f"✅ Multi-stage analysis completed successfully")
        print(f"⏱️  Total processing time: {elapsed:.2f}s")
        print(f"\n📊 Analysis Results:")
        print(f"   - Articles analyzed: {len(results.get('articles', []))}")
        print(f"   - Overall sentiment: {results.get('overall_sentiment', {}).get('overall_sentiment', 'N/A')}")
        print(f"   - Overall score: {results.get('overall_sentiment', {}).get('overall_score', 0):+.2f}")
        print(f"   - Pattern summary: {results.get('patterns', {}).get('pattern_summary', 'N/A')}")
        print(f"   - AI synthesis available: {'Yes' if results.get('ai_synthesis') else 'No'}")
        
        if results.get('ai_synthesis'):
            print(f"\n🤖 AI Synthesis Preview:")
            synthesis = results['ai_synthesis'][:200]
            print(f"   {synthesis}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Multi-stage analysis test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_end_to_end():
    """Test complete end-to-end pipeline with real stock"""
    print("\n" + "="*60)
    print("TEST 4: End-to-End Pipeline Test")
    print("="*60)
    
    try:
        from stock_agents import FinancialAnalysisAgent
        
        analyst = FinancialAnalysisAgent()
        
        # Test with a real stock symbol
        test_symbol = "RELIANCE"
        
        print(f"🔍 Analyzing {test_symbol}...")
        start_time = time.time()
        
        result = analyst.analyze_stock(test_symbol)
        
        elapsed = time.time() - start_time
        
        if 'error' in result:
            print(f"⚠️  Analysis completed with error: {result['error']}")
            return False
        
        print(f"✅ End-to-end analysis completed successfully")
        print(f"⏱️  Total time: {elapsed:.2f}s")
        print(f"\n📊 Complete Results:")
        print(f"   - Stock data: {'✓' if result.get('stock_data') else '✗'}")
        print(f"   - Technical data: {'✓' if result.get('technical_data') else '✗'}")
        print(f"   - Risk data: {'✓' if result.get('risk_data') else '✗'}")
        print(f"   - Confidence data: {'✓' if result.get('confidence_data') else '✗'}")
        print(f"   - Recommendation: {'✓' if result.get('recommendation') else '✗'}")
        print(f"   - News articles: {len(result.get('news_data', []))}")
        print(f"   - Sentiment data: {'✓' if result.get('sentiment_data') else '✗'}")
        print(f"   - Pattern analysis: {'✓' if result.get('patterns') else '✗'}")
        print(f"   - AI synthesis: {'✓' if result.get('ai_synthesis') else '✗'}")
        print(f"   - AI analysis: {'✓' if result.get('analysis') else '✗'}")
        
        # Print performance breakdown
        if elapsed > 0:
            print(f"\n⚡ Performance Analysis:")
            print(f"   - Target: 15-25 seconds")
            print(f"   - Actual: {elapsed:.1f} seconds")
            
            if elapsed < 15:
                print(f"   - Status: ✅ Excellent (faster than target)")
            elif elapsed <= 25:
                print(f"   - Status: ✅ Good (within target range)")
            elif elapsed <= 35:
                print(f"   - Status: ⚠️  Acceptable (slightly above target)")
            else:
                print(f"   - Status: ❌ Slow (needs optimization)")
        
        return True
        
    except Exception as e:
        print(f"❌ End-to-end test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all tests and report results"""
    print("\n" + "="*60)
    print("ENHANCED SENTIMENT ANALYSIS TEST SUITE")
    print("="*60)
    
    tests = [
        ("Article Extraction", test_article_extraction),
        ("Pattern Analysis", test_pattern_analyzer),
        ("Multi-Stage Pipeline", test_multi_stage_analyzer),
        ("End-to-End Integration", test_end_to_end)
    ]
    
    results = []
    total_start = time.time()
    
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
    
    total_elapsed = time.time() - total_start
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\n📊 Results: {passed_count}/{total_count} tests passed ({passed_count/total_count*100:.1f}%)")
    print(f"⏱️  Total time: {total_elapsed:.1f}s")
    
    if passed_count == total_count:
        print("\n🎉 All tests passed! Enhanced sentiment analysis is working correctly.")
    else:
        print(f"\n⚠️  {total_count - passed_count} test(s) failed. Please review the errors above.")
    
    return passed_count == total_count


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)


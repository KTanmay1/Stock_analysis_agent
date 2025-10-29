"""
Multi-stage sentiment analysis pipeline
Stage 1: Groq LLM scores each article
Stage 2: Pattern detection across all articles
Stage 3: Groq AI synthesizes insights
"""

import os
from typing import Dict, List
from sentiment_analyzer import FinancialSentimentAnalyzer
from pattern_analyzer import PatternAnalyzer
from groq import Groq
import numpy as np


class MultiStageAnalyzer:
    """
    3-Stage comprehensive sentiment analysis pipeline
    1. Per-article sentiment (Groq)
    2. Cross-article pattern detection (Groq-assisted)
    3. AI synthesis (Groq)
    """
    
    def __init__(self, groq_api_key: str):
        """
        Initialize multi-stage analyzer
        
        Args:
            groq_api_key: Groq API key for AI synthesis
        """
        print("Initializing multi-stage analyzer...")

        api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is required for multi-stage analysis")

        self.groq_client = Groq(api_key=api_key)
        self.sentiment_analyzer = FinancialSentimentAnalyzer(groq_client=self.groq_client)
        self.pattern_analyzer = PatternAnalyzer(groq_client=self.groq_client)
        print("✅ Multi-stage analyzer ready")
    
    def analyze_comprehensive(self, symbol: str, articles: List[Dict]) -> Dict:
        """
        Run complete 3-stage analysis pipeline
        
        Args:
            symbol: Stock symbol
            articles: List of article dicts with full_content
            
        Returns:
            {
                'articles': [...],  # Articles with sentiment
                'patterns': {...},  # Pattern analysis
                'overall_sentiment': {...},  # Aggregate sentiment
                'ai_synthesis': str  # AI-generated insights
            }
        """
        if not articles:
            return {
                'articles': [],
                'patterns': {},
                'overall_sentiment': {
                    'overall_sentiment': 'neutral',
                    'overall_score': 0.0,
                    'article_count': 0
                },
                'ai_synthesis': 'No articles available for analysis'
            }
        
        # STAGE 1: Per-Article Sentiment (Groq)
        print(f"[Stage 1/3] Analyzing {len(articles)} articles with Groq sentiment scorer...")
        articles_with_sentiment = []
        
        for article in articles:
            sentiment = self.sentiment_analyzer.analyze_article(
                title=article.get('title', ''),
                content=article.get('full_content', article.get('snippet', ''))
            )
            
            # Merge article data with sentiment
            article_copy = article.copy()
            article_copy.update(sentiment)
            articles_with_sentiment.append(article_copy)
        
        print(f"✅ Stage 1 complete: {len(articles_with_sentiment)} articles analyzed")
        
        # STAGE 2: Pattern Detection (Groq-assisted)
        print(f"[Stage 2/3] Detecting patterns across articles...")
        patterns = self.pattern_analyzer.analyze_patterns(articles_with_sentiment)
        print(f"✅ Stage 2 complete: {patterns.get('pattern_summary', 'N/A')}")
        
        # STAGE 3: AI Synthesis (Groq)
        print(f"[Stage 3/3] Synthesizing insights with Groq AI...")
        synthesis = self._synthesize_with_ai(symbol, articles_with_sentiment, patterns)
        print(f"✅ Stage 3 complete: AI synthesis generated")
        
        # Calculate overall sentiment
        overall_sentiment = self._calculate_overall_sentiment(articles_with_sentiment)
        
        return {
            'articles': articles_with_sentiment,
            'patterns': patterns,
            'overall_sentiment': overall_sentiment,
            'ai_synthesis': synthesis
        }
    
    def _synthesize_with_ai(self, symbol: str, articles: List[Dict], 
                           patterns: Dict) -> str:
        """
        Use Groq AI to synthesize pattern insights
        
        Args:
            symbol: Stock symbol
            articles: Articles with sentiment analysis
            patterns: Pattern analysis results
            
        Returns:
            str: AI-generated synthesis
        """
        # Build comprehensive prompt
        prompt = f"""You are a financial news analyst. Synthesize the following sentiment analysis for {symbol}:

**ARTICLE SENTIMENTS:**
"""
        
        # Include top 5 articles with sentiments
        for i, article in enumerate(articles[:5], 1):
            prompt += f"\n{i}. [{article.get('source', 'Unknown')}] {article.get('title', 'Untitled')}"
            prompt += f"\n   Sentiment: {article.get('sentiment', 'neutral')} (score: {article.get('score', 0):+.2f}, confidence: {article.get('confidence', 0):.2f})"
        
        prompt += f"\n\n**PATTERN ANALYSIS:**"
        prompt += f"\n- Themes Detected: {len(patterns.get('themes', []))}"
        
        for theme in patterns.get('themes', []):
            prompt += f"\n  • {theme['label']}: {theme['article_count']} articles, "
            dist = patterns.get('sentiment_distribution', {}).get(theme['label'], {})
            prompt += f"avg sentiment: {dist.get('avg_score', 0):+.2f}"
        
        consensus = patterns.get('consensus', {})
        prompt += f"\n- Consensus: {consensus.get('level', 'N/A')} ({consensus.get('agreement_percentage', 0):.0f}% agreement)"
        
        if patterns.get('conflicts'):
            prompt += f"\n- ⚠️ Conflicts: {len(patterns['conflicts'])} contradictory signal(s)"
        
        temporal = patterns.get('temporal_trend', {})
        prompt += f"\n- Temporal Trend: {temporal.get('trend', 'N/A')}"
        
        prompt += """\n\n**PROVIDE SYNTHESIS:**
1. What is the dominant narrative about this stock?
2. Are there any concerning conflicts or uncertainties?
3. What does the pattern analysis reveal about market sentiment?
4. Key takeaway for investors (2-3 sentences)

Keep response concise (150 words max)."""
        
        try:
            completion = self.groq_client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {"role": "system", "content": "You are an expert financial news analyst who synthesizes sentiment data into actionable insights."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=300
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            print(f"AI synthesis failed: {e}")
            return f"Synthesis unavailable: {str(e)}"
    
    def _calculate_overall_sentiment(self, articles: List[Dict]) -> Dict:
        """
        Calculate final weighted sentiment
        
        Args:
            articles: Articles with sentiment scores
            
        Returns:
            Dict with overall_sentiment, overall_score, article_count
        """
        if not articles:
            return {
                'overall_sentiment': 'neutral',
                'overall_score': 0.0,
                'article_count': 0
            }
        
        # Weight by confidence × credibility
        weighted_sum = sum(
            a.get('score', 0) * a.get('confidence', 0) * a.get('credibility', 0.5)
            for a in articles
        )
        total_weight = sum(
            a.get('confidence', 0) * a.get('credibility', 0.5)
            for a in articles
        )
        
        overall_score = weighted_sum / total_weight if total_weight > 0 else 0.0
        
        # Determine sentiment label
        if overall_score > 0.15:
            overall_sentiment = 'positive'
        elif overall_score < -0.15:
            overall_sentiment = 'negative'
        else:
            overall_sentiment = 'neutral'
        
        return {
            'overall_sentiment': overall_sentiment,
            'overall_score': round(float(overall_score), 3),
            'article_count': len(articles)
        }

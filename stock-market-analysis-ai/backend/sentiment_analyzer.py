"""
Financial sentiment analysis using FinBERT
Model: yiyanghkust/finbert-tone - specifically trained on financial text
"""

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from typing import Dict, List
import numpy as np


class FinancialSentimentAnalyzer:
    """
    Sentiment analysis using FinBERT (Financial BERT)
    Model: yiyanghkust/finbert-tone - trained on financial news
    """
    
    def __init__(self, model_name: str = "yiyanghkust/finbert-tone"):
        """
        Initialize FinBERT model
        Note: First run will download ~400MB model
        
        Args:
            model_name: HuggingFace model name
        """
        try:
            print(f"Loading sentiment model: {model_name}...")
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
            self.model.eval()  # Set to evaluation mode
            print("✅ Sentiment model loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load sentiment model: {e}")
            print("Sentiment analysis will be disabled")
            self.tokenizer = None
            self.model = None
    
    def analyze_article(self, title: str, content: str) -> Dict:
        """
        Analyze sentiment of a single news article
        
        Args:
            title: Article title
            content: Full article content or snippet (will use first ~2000 chars)
            
        Returns:
            {
                'sentiment': 'positive'/'negative'/'neutral',
                'score': -1.0 to +1.0,
                'confidence': 0.0 to 1.0,
                'label_scores': {'positive': 0.X, 'negative': 0.Y, 'neutral': 0.Z}
            }
        """
        if not self.model or not self.tokenizer:
            return {
                'sentiment': 'neutral',
                'score': 0.0,
                'confidence': 0.0,
                'error': 'Model not loaded'
            }
        
        try:
            # Combine title and content (use first 2000 chars for better context than just snippet)
            # FinBERT can handle ~512 tokens, which is roughly 2000-2500 characters
            text = f"{title}. {content[:2000]}"
            
            # Truncate to max length (512 tokens for BERT)
            text = text[:2500]
            
            # Tokenize
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, 
                                   padding=True, max_length=512)
            
            # Get prediction
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            
            # FinBERT returns: [positive, negative, neutral] probabilities
            scores = predictions[0].tolist()
            
            # Map to labels
            labels = ['positive', 'negative', 'neutral']
            label_scores = dict(zip(labels, scores))
            
            # Get dominant sentiment
            max_idx = np.argmax(scores)
            sentiment = labels[max_idx]
            confidence = scores[max_idx]
            
            # Calculate normalized score (-1 to +1)
            # Positive = +1, Negative = -1, Neutral = 0
            if sentiment == 'positive':
                score = confidence
            elif sentiment == 'negative':
                score = -confidence
            else:  # neutral
                score = 0.0
            
            return {
                'sentiment': sentiment,
                'score': round(float(score), 3),
                'confidence': round(float(confidence), 3),
                'label_scores': {k: round(float(v), 3) for k, v in label_scores.items()}
            }
            
        except Exception as e:
            print(f"Sentiment analysis failed for article: {e}")
            return {
                'sentiment': 'neutral',
                'score': 0.0,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def analyze_multiple_articles(self, news_articles: List[Dict]) -> Dict:
        """
        Analyze sentiment of multiple news articles
        
        Args:
            news_articles: List of news articles with 'title' and 'snippet'
            
        Returns:
            {
                'overall_sentiment': 'positive'/'negative'/'neutral',
                'overall_score': -1.0 to +1.0,
                'average_confidence': 0.0 to 1.0,
                'article_count': int,
                'articles': [individual sentiment results],
                'sentiment_distribution': {'positive': X, 'negative': Y, 'neutral': Z}
            }
        """
        if not news_articles:
            return {
                'overall_sentiment': 'neutral',
                'overall_score': 0.0,
                'average_confidence': 0.0,
                'article_count': 0,
                'articles': [],
                'sentiment_distribution': {'positive': 0, 'negative': 0, 'neutral': 0}
            }
        
        article_sentiments = []
        
        for article in news_articles:
            title = article.get('title', '')
            content = article.get('full_content', article.get('snippet', ''))
            
            sentiment_result = self.analyze_article(title, content)
            
            # Add article metadata
            sentiment_result['title'] = title
            sentiment_result['source'] = article.get('source', 'Unknown')
            sentiment_result['credibility'] = article.get('credibility_score', 0.5)
            
            article_sentiments.append(sentiment_result)
        
        # Calculate overall sentiment (weighted by confidence and credibility)
        weighted_scores = []
        total_weight = 0
        
        for article_sent in article_sentiments:
            # Skip articles with errors
            if 'error' in article_sent and article_sent.get('confidence', 0) == 0:
                continue
            
            # Weight by both confidence and source credibility
            weight = article_sent['confidence'] * article_sent.get('credibility', 0.5)
            weighted_scores.append(article_sent['score'] * weight)
            total_weight += weight
        
        overall_score = sum(weighted_scores) / total_weight if total_weight > 0 else 0.0
        
        # Determine overall sentiment label
        if overall_score > 0.15:
            overall_sentiment = 'positive'
        elif overall_score < -0.15:
            overall_sentiment = 'negative'
        else:
            overall_sentiment = 'neutral'
        
        # Calculate sentiment distribution
        sentiment_counts = {'positive': 0, 'negative': 0, 'neutral': 0}
        for article_sent in article_sentiments:
            sentiment = article_sent.get('sentiment', 'neutral')
            if sentiment in sentiment_counts:
                sentiment_counts[sentiment] += 1
        
        # Average confidence
        confidences = [a['confidence'] for a in article_sentiments if a['confidence'] > 0]
        avg_confidence = np.mean(confidences) if confidences else 0.0
        
        return {
            'overall_sentiment': overall_sentiment,
            'overall_score': round(float(overall_score), 3),
            'average_confidence': round(float(avg_confidence), 3),
            'article_count': len(article_sentiments),
            'articles': article_sentiments,
            'sentiment_distribution': sentiment_counts,
            'interpretation': self._get_interpretation(overall_score, overall_sentiment)
        }
    
    def _get_interpretation(self, score: float, sentiment: str) -> str:
        """Generate human-readable interpretation"""
        
        intensity = abs(score)
        
        if sentiment == 'positive':
            if intensity > 0.6:
                return "Strongly positive news sentiment - market appears very optimistic"
            elif intensity > 0.3:
                return "Moderately positive news sentiment - generally favorable coverage"
            else:
                return "Slightly positive news sentiment - mildly favorable coverage"
        
        elif sentiment == 'negative':
            if intensity > 0.6:
                return "Strongly negative news sentiment - market appears very pessimistic"
            elif intensity > 0.3:
                return "Moderately negative news sentiment - generally unfavorable coverage"
            else:
                return "Slightly negative news sentiment - mildly unfavorable coverage"
        
        else:  # neutral
            return "Neutral news sentiment - balanced or mixed coverage"


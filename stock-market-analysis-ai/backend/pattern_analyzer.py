"""
Advanced pattern detection for financial news sentiment analysis
Detects themes, conflicts, temporal trends, and consensus across articles
"""

from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
import numpy as np
from typing import List, Dict
from collections import Counter
import re


class PatternAnalyzer:
    """
    Multi-dimensional pattern analysis for financial news
    - Theme clustering using semantic similarity
    - Sentiment distribution analysis
    - Conflict detection between sources
    - Temporal trend analysis
    - Consensus measurement
    - Entity-specific sentiment
    """
    
    def __init__(self):
        """Initialize pattern analyzer with sentence transformer model"""
        print("Loading sentence transformer model for pattern analysis...")
        try:
            # Load semantic similarity model (fast and efficient)
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Pattern analyzer model loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load pattern analyzer model: {e}")
            self.model = None
    
    def analyze_patterns(self, articles_with_sentiment: List[Dict]) -> Dict:
        """
        Comprehensive pattern analysis across all articles
        
        Args:
            articles_with_sentiment: List of articles with sentiment scores
            
        Returns:
            {
                'themes': [...],  # Clustered topics
                'sentiment_distribution': {...},  # Per-theme sentiment
                'conflicts': [...],  # Contradictory articles
                'temporal_trend': {...},  # Sentiment over time
                'consensus': {...},  # Agreement metrics
                'key_entities': {...},  # Entity-specific sentiment
                'pattern_summary': str  # Human-readable summary
            }
        """
        if not articles_with_sentiment or len(articles_with_sentiment) < 2:
            return self._empty_pattern()
        
        try:
            # 1. Theme Clustering
            themes = self._detect_themes(articles_with_sentiment)
            
            # 2. Sentiment Distribution per Theme
            sentiment_dist = self._analyze_sentiment_distribution(
                articles_with_sentiment, themes
            )
            
            # 3. Conflict Detection
            conflicts = self._detect_conflicts(articles_with_sentiment)
            
            # 4. Temporal Analysis
            temporal = self._analyze_temporal_trend(articles_with_sentiment)
            
            # 5. Consensus Measurement
            consensus = self._measure_consensus(articles_with_sentiment)
            
            # 6. Entity Analysis
            entities = self._analyze_entities(articles_with_sentiment)
            
            return {
                'themes': themes,
                'sentiment_distribution': sentiment_dist,
                'conflicts': conflicts,
                'temporal_trend': temporal,
                'consensus': consensus,
                'key_entities': entities,
                'pattern_summary': self._generate_summary(
                    themes, sentiment_dist, conflicts, consensus
                )
            }
        except Exception as e:
            print(f"Error in pattern analysis: {e}")
            return self._empty_pattern()
    
    def _detect_themes(self, articles: List[Dict]) -> List[Dict]:
        """Cluster articles into themes using semantic similarity"""
        if not self.model or len(articles) < 3:
            return [{'theme_id': 0, 'articles': articles, 'label': 'General'}]
        
        try:
            # Create embeddings from titles + snippets
            texts = [f"{a.get('title', '')} {a.get('snippet', '')}" for a in articles]
            embeddings = self.model.encode(texts)
            
            # Optimal clusters (2-5 based on article count)
            n_clusters = min(max(2, len(articles) // 5), 5)
            
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            clusters = kmeans.fit_predict(embeddings)
            
            # Group articles by theme
            themes = []
            for cluster_id in range(n_clusters):
                cluster_articles = [
                    articles[i] for i, c in enumerate(clusters) if c == cluster_id
                ]
                
                # Generate theme label from most common words
                theme_label = self._generate_theme_label(cluster_articles)
                
                themes.append({
                    'theme_id': cluster_id,
                    'label': theme_label,
                    'articles': cluster_articles,
                    'article_count': len(cluster_articles)
                })
            
            return sorted(themes, key=lambda x: x['article_count'], reverse=True)
        except Exception as e:
            print(f"Error in theme detection: {e}")
            return [{'theme_id': 0, 'articles': articles, 'label': 'General'}]
    
    def _analyze_sentiment_distribution(self, articles: List[Dict], 
                                       themes: List[Dict]) -> Dict:
        """Analyze sentiment variance across themes"""
        distribution = {}
        
        for theme in themes:
            theme_articles = theme['articles']
            sentiments = [a.get('sentiment', 'neutral') for a in theme_articles]
            scores = [a.get('score', 0) for a in theme_articles]
            
            distribution[theme['label']] = {
                'sentiment_counts': Counter(sentiments),
                'avg_score': float(np.mean(scores)) if scores else 0,
                'score_variance': float(np.var(scores)) if len(scores) > 1 else 0,
                'dominant_sentiment': Counter(sentiments).most_common(1)[0][0] if sentiments else 'neutral'
            }
        
        return distribution
    
    def _detect_conflicts(self, articles: List[Dict]) -> List[Dict]:
        """Detect contradictory sentiment signals"""
        conflicts = []
        
        # Group by source credibility tier
        high_cred = [a for a in articles if a.get('credibility', 0) > 0.85]
        
        if len(high_cred) < 2:
            return conflicts
        
        # Check for opposite sentiments in high-credibility articles
        positive = [a for a in high_cred if a.get('score', 0) > 0.3]
        negative = [a for a in high_cred if a.get('score', 0) < -0.3]
        
        if positive and negative:
            conflicts.append({
                'type': 'sentiment_conflict',
                'positive_articles': len(positive),
                'negative_articles': len(negative),
                'severity': 'high' if len(positive) > 2 and len(negative) > 2 else 'medium',
                'description': f"{len(positive)} high-credibility sources positive, {len(negative)} negative"
            })
        
        return conflicts
    
    def _analyze_temporal_trend(self, articles: List[Dict]) -> Dict:
        """Analyze sentiment changes over time"""
        # Sort by date
        dated_articles = [
            a for a in articles 
            if a.get('published_parsed')
        ]
        
        if len(dated_articles) < 3:
            return {'trend': 'insufficient_data'}
        
        dated_articles.sort(key=lambda x: x['published_parsed'])
        
        # Split into early/late periods
        mid_point = len(dated_articles) // 2
        early = dated_articles[:mid_point]
        late = dated_articles[mid_point:]
        
        early_score = np.mean([a.get('score', 0) for a in early])
        late_score = np.mean([a.get('score', 0) for a in late])
        
        delta = late_score - early_score
        
        return {
            'trend': 'improving' if delta > 0.1 else 'declining' if delta < -0.1 else 'stable',
            'early_sentiment_score': round(float(early_score), 3),
            'recent_sentiment_score': round(float(late_score), 3),
            'delta': round(float(delta), 3)
        }
    
    def _measure_consensus(self, articles: List[Dict]) -> Dict:
        """Measure agreement level among articles"""
        scores = [a.get('score', 0) for a in articles]
        sentiments = [a.get('sentiment', 'neutral') for a in articles]
        
        # Calculate variance (lower = more agreement)
        variance = float(np.var(scores)) if len(scores) > 1 else 0
        
        # Count sentiment agreement
        sentiment_counts = Counter(sentiments)
        dominant_pct = sentiment_counts.most_common(1)[0][1] / len(sentiments) * 100 if sentiments else 0
        
        consensus_level = 'strong' if dominant_pct > 70 and variance < 0.2 else \
                         'moderate' if dominant_pct > 50 and variance < 0.4 else 'weak'
        
        return {
            'level': consensus_level,
            'agreement_percentage': round(dominant_pct, 1),
            'score_variance': round(variance, 3),
            'interpretation': self._interpret_consensus(consensus_level, dominant_pct)
        }
    
    def _analyze_entities(self, articles: List[Dict]) -> Dict:
        """Extract and analyze sentiment by entity mentions"""
        # Simplified entity detection (can be enhanced with NER)
        common_entities = ['CEO', 'management', 'competitor', 'government', 'market', 
                          'earnings', 'revenue', 'profit', 'loss', 'debt']
        entity_sentiment = {}
        
        for entity in common_entities:
            entity_articles = [
                a for a in articles 
                if entity.lower() in a.get('full_content', '').lower() or
                   entity.lower() in a.get('title', '').lower() or
                   entity.lower() in a.get('snippet', '').lower()
            ]
            
            if entity_articles:
                avg_score = np.mean([a.get('score', 0) for a in entity_articles])
                entity_sentiment[entity] = {
                    'mention_count': len(entity_articles),
                    'avg_sentiment': round(float(avg_score), 3)
                }
        
        return entity_sentiment
    
    def _generate_theme_label(self, articles: List[Dict]) -> str:
        """Generate descriptive label for theme cluster"""
        # Extract most common meaningful words from titles
        all_titles = ' '.join([a.get('title', '') for a in articles])
        words = re.findall(r'\b[A-Z][a-z]+\b', all_titles)  # Capitalized words
        
        if not words:
            return 'General News'
        
        common = Counter(words).most_common(2)
        return ' '.join([w[0] for w in common])
    
    def _generate_summary(self, themes, sentiment_dist, conflicts, consensus) -> str:
        """Generate human-readable pattern summary"""
        summary_parts = []
        
        # Theme summary
        summary_parts.append(f"{len(themes)} distinct themes detected")
        
        # Consensus
        summary_parts.append(f"{consensus['level']} consensus ({consensus['agreement_percentage']:.0f}% agreement)")
        
        # Conflicts
        if conflicts:
            summary_parts.append(f"⚠️ {len(conflicts)} sentiment conflict(s) detected")
        
        return '; '.join(summary_parts)
    
    def _interpret_consensus(self, level: str, pct: float) -> str:
        """Interpret consensus level"""
        if level == 'strong':
            return f"Strong agreement ({pct:.0f}%) - reliable signal"
        elif level == 'moderate':
            return f"Moderate agreement ({pct:.0f}%) - consider with caution"
        else:
            return f"Weak agreement ({pct:.0f}%) - conflicting signals, high uncertainty"
    
    def _empty_pattern(self) -> Dict:
        """Return empty pattern structure"""
        return {
            'themes': [],
            'sentiment_distribution': {},
            'conflicts': [],
            'temporal_trend': {'trend': 'insufficient_data'},
            'consensus': {'level': 'unknown', 'agreement_percentage': 0, 'interpretation': 'Insufficient data'},
            'key_entities': {},
            'pattern_summary': 'Insufficient data for pattern analysis'
        }


"""
Multi-source news aggregator for Indian stock market
Fetches news from multiple RSS feeds with date filtering and duplicate removal
"""

import requests
from datetime import datetime, timedelta
from typing import List, Dict
import feedparser
from urllib.parse import quote


class NewsAggregator:
    """
    Multi-source news aggregator with fallback mechanism
    Fetches news from Google News, MoneyControl, and Economic Times
    """
    
    def __init__(self):
        self.sources = [
            ('google_news_rss', self._fetch_google_news),
            ('moneycontrol_rss', self._fetch_moneycontrol),
            ('economic_times_rss', self._fetch_economic_times),
        ]
        self.max_age_days = 7  # Only news from last 7 days
    
    def fetch_news(self, symbol: str, max_articles: int = 15) -> List[Dict]:
        """
        Fetch news from multiple sources with fallback
        
        Args:
            symbol: Stock symbol (e.g., 'RELIANCE', 'TCS')
            max_articles: Maximum number of articles to return
            
        Returns:
            List of news articles with metadata
        """
        all_news = []
        
        # Try each source
        for source_name, fetch_func in self.sources:
            try:
                news = fetch_func(symbol)
                all_news.extend(news)
                print(f"Fetched {len(news)} articles from {source_name}")
                if len(all_news) >= max_articles * 2:  # Get extra for filtering
                    break
            except Exception as e:
                print(f"Failed to fetch from {source_name}: {e}")
                continue  # Try next source
        
        if not all_news:
            print(f"Warning: No news found for {symbol}")
            return []
        
        # Remove duplicates
        all_news = self._remove_duplicates(all_news)
        print(f"After deduplication: {len(all_news)} articles")
        
        # Filter by date (last 7 days only)
        all_news = self._filter_by_date(all_news)
        print(f"After date filtering: {len(all_news)} articles")
        
        # Sort by date (newest first)
        all_news = sorted(all_news, key=lambda x: x.get('published', ''), reverse=True)
        
        return all_news[:max_articles]
    
    def _fetch_google_news(self, symbol: str) -> List[Dict]:
        """Fetch from Google News RSS"""
        query = f"{symbol} stock India"
        url = f"https://news.google.com/rss/search?q={quote(query)}&hl=en-IN&gl=IN&ceid=IN:en"
        
        feed = feedparser.parse(url)
        news = []
        
        for entry in feed.entries[:20]:
            news.append({
                'title': entry.title,
                'snippet': entry.get('summary', '')[:200],
                'link': entry.link,
                'source': 'Google News',
                'published': entry.get('published', ''),
                'published_parsed': entry.get('published_parsed', None)
            })
        
        return news
    
    def _fetch_moneycontrol(self, symbol: str) -> List[Dict]:
        """Fetch from Moneycontrol RSS"""
        # Moneycontrol has RSS feeds for market news
        url = "https://www.moneycontrol.com/rss/marketreports.xml"
        
        try:
            feed = feedparser.parse(url)
            news = []
            
            for entry in feed.entries[:20]:
                # Filter for relevant symbol
                title_text = entry.title.upper()
                summary_text = entry.get('summary', '').upper()
                
                if symbol.upper() in title_text or symbol.upper() in summary_text:
                    news.append({
                        'title': entry.title,
                        'snippet': entry.get('summary', '')[:200],
                        'link': entry.link,
                        'source': 'MoneyControl',
                        'published': entry.get('published', ''),
                        'published_parsed': entry.get('published_parsed', None)
                    })
            
            return news
        except Exception as e:
            print(f"MoneyControl fetch error: {e}")
            return []
    
    def _fetch_economic_times(self, symbol: str) -> List[Dict]:
        """Fetch from Economic Times RSS"""
        url = "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
        
        try:
            feed = feedparser.parse(url)
            news = []
            
            for entry in feed.entries[:20]:
                title_text = entry.title.upper()
                summary_text = entry.get('summary', '').upper()
                
                if symbol.upper() in title_text or symbol.upper() in summary_text:
                    news.append({
                        'title': entry.title,
                        'snippet': entry.get('summary', '')[:200],
                        'link': entry.link,
                        'source': 'Economic Times',
                        'published': entry.get('published', ''),
                        'published_parsed': entry.get('published_parsed', None)
                    })
            
            return news
        except Exception as e:
            print(f"Economic Times fetch error: {e}")
            return []
    
    def _remove_duplicates(self, news: List[Dict]) -> List[Dict]:
        """Remove duplicate news articles based on title similarity"""
        seen_titles = set()
        unique_news = []
        
        for article in news:
            # Normalize title for comparison
            title_normalized = article['title'].lower().strip()
            
            # Check if similar title exists (>70% match)
            is_duplicate = False
            for seen_title in seen_titles:
                similarity = self._calculate_similarity(title_normalized, seen_title)
                if similarity > 0.7:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                seen_titles.add(title_normalized)
                unique_news.append(article)
        
        return unique_news
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple word-based similarity (Jaccard index)"""
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
    
    def _filter_by_date(self, news: List[Dict]) -> List[Dict]:
        """Filter news to only include articles from last N days"""
        cutoff_date = datetime.now() - timedelta(days=self.max_age_days)
        filtered = []
        
        for article in news:
            published_parsed = article.get('published_parsed')
            if published_parsed:
                try:
                    article_date = datetime(*published_parsed[:6])
                    if article_date >= cutoff_date:
                        filtered.append(article)
                except Exception as e:
                    # If date parsing fails, include it (better than excluding)
                    print(f"Date parsing error: {e}")
                    filtered.append(article)
            else:
                # If no date, include it (better than excluding)
                filtered.append(article)
        
        return filtered
    
    def add_credibility_score(self, news: List[Dict]) -> List[Dict]:
        """
        Add credibility score to each article based on source
        
        Credibility scores:
        - Economic Times: 0.95 (highly credible)
        - MoneyControl: 0.90 (highly credible)
        - Business Standard: 0.90 (highly credible)
        - Mint: 0.85 (credible)
        - Google News: 0.70 (aggregator, varies)
        - Unknown: 0.50 (default)
        """
        credibility_map = {
            'Economic Times': 0.95,
            'MoneyControl': 0.90,
            'Business Standard': 0.90,
            'Mint': 0.85,
            'Google News': 0.70,  # Aggregator, varies
            'Unknown': 0.50
        }
        
        for article in news:
            source = article.get('source', 'Unknown')
            article['credibility_score'] = credibility_map.get(source, 0.50)
        
        return news


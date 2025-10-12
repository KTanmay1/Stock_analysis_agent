"""
Full article content extraction using Trafilatura
Fetches and parses complete article text from URLs in parallel
"""

import trafilatura
import requests
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed


class ArticleExtractor:
    """
    Extract full article content from URLs using Trafilatura
    Handles parallel processing for efficiency
    """
    
    def __init__(self, max_workers=5, timeout=10):
        """
        Initialize article extractor
        
        Args:
            max_workers: Number of parallel workers for extraction
            timeout: Timeout for each URL request in seconds
        """
        self.max_workers = max_workers
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def extract_article(self, url: str) -> Optional[Dict]:
        """
        Extract full article content from URL
        
        Args:
            url: Article URL
            
        Returns:
            Dict with content, word_count, author, date, description or None
        """
        try:
            # Download HTML using trafilatura
            downloaded = trafilatura.fetch_url(url)
            if not downloaded:
                print(f"Failed to download {url}")
                return None
            
            # Extract content
            content = trafilatura.extract(
                downloaded,
                include_comments=False,
                include_tables=False,
                no_fallback=False
            )
            
            if not content or len(content) < 100:  # Too short
                print(f"Content too short or empty for {url}")
                return None
            
            # Extract metadata
            metadata = trafilatura.extract_metadata(downloaded)
            
            return {
                'content': content,
                'word_count': len(content.split()),
                'author': metadata.author if metadata else None,
                'date': metadata.date if metadata else None,
                'description': metadata.description if metadata else None
            }
        except Exception as e:
            print(f"Failed to extract {url}: {e}")
            return None
    
    def extract_multiple(self, articles: List[Dict]) -> List[Dict]:
        """
        Extract content from multiple articles in parallel
        
        Args:
            articles: List of article dicts with 'link' field
            
        Returns:
            List of articles with 'full_content' and 'word_count' added
        """
        results = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all extraction tasks
            future_to_article = {
                executor.submit(self.extract_article, article.get('link', '')): article
                for article in articles
                if article.get('link')
            }
            
            # Process completed tasks
            for future in as_completed(future_to_article):
                article = future_to_article[future]
                try:
                    extracted = future.result()
                    if extracted:
                        # Success: add full content
                        article['full_content'] = extracted['content']
                        article['word_count'] = extracted['word_count']
                        if extracted['author']:
                            article['author'] = extracted['author']
                        if extracted['description']:
                            article['description'] = extracted['description']
                    else:
                        # Fallback: use snippet if extraction fails
                        article['full_content'] = article.get('snippet', '')
                        article['word_count'] = len(article.get('snippet', '').split())
                    
                    results.append(article)
                    
                except Exception as e:
                    print(f"Error processing article '{article.get('title', 'Unknown')}': {e}")
                    # Fallback: use snippet
                    article['full_content'] = article.get('snippet', '')
                    article['word_count'] = len(article.get('snippet', '').split())
                    results.append(article)
        
        print(f"✅ Extracted full content from {len([a for a in results if a.get('word_count', 0) > 200])} / {len(results)} articles")
        
        return results


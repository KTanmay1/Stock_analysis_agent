from bs4 import BeautifulSoup
import requests
from typing import List, Dict

class WebSearchAgent:
    def __init__(self):
        pass

    def search(self, query: str) -> List[Dict]:
        url = f"https://duckduckgo.com/html/?q={query}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        try:
            response = requests.get(url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            for result in soup.find_all('div', class_='result'):
                title = result.find('h2').text if result.find('h2') else ''
                snippet = result.find('a', class_='result__snippet').text if result.find('a', class_='result__snippet') else ''
                results.append({'title': title, 'snippet': snippet})
            return results[:5]
        except Exception as e:
            print(f"Error in web search: {str(e)}")
            return []
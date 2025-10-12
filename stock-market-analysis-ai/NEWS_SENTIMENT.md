# News Aggregation & Sentiment Analysis

## 🎯 Overview

This document describes the **News Aggregation and Sentiment Analysis** system integrated into the stock analysis platform. This system fetches news from multiple reliable sources, analyzes sentiment using FinBERT (a financial-domain BERT model), and incorporates sentiment into trading recommendations.

---

## 🌟 Key Features

### 1. **Multi-Source News Aggregation**
- **3+ News Sources**: Google News RSS, MoneyControl, Economic Times
- **Fallback Mechanism**: If one source fails, others continue working
- **15 Articles Maximum**: Configurable, default is 15 recent articles
- **Date Filtering**: Only news from the last 7 days (configurable)
- **Duplicate Removal**: Uses Jaccard similarity (70% threshold) to remove duplicate headlines
- **Source Credibility**: Each source has a credibility score (0.5 to 0.95)

### 2. **FinBERT Sentiment Analysis**
- **Model**: `yiyanghkust/finbert-tone` - specifically trained on financial news
- **Per-Article Analysis**: Sentiment (positive/negative/neutral), score (-1 to +1), confidence (0 to 1)
- **Aggregate Sentiment**: Weighted by confidence × credibility
- **Interpretation**: Human-readable sentiment interpretation
- **Fast**: ~0.15s for 3 articles, ~2s for 15 articles

### 3. **Integration with Analysis Pipeline**
- **Confidence Scoring**: Sentiment strength and confidence contribute 15 points (out of 100)
- **Recommendation Engine**: Sentiment confirms or conflicts with technical signals
- **AI Prompt**: Sentiment data passed to Groq AI for natural language analysis

---

## 📊 How It Works

### **Workflow**

```
1. Stock Symbol Input (e.g., "RELIANCE")
   ↓
2. News Aggregation
   • Fetch from Google News RSS (20 articles)
   • Fetch from MoneyControl RSS (filtered by symbol)
   • Fetch from Economic Times RSS (filtered by symbol)
   • Remove duplicates (Jaccard similarity > 70%)
   • Filter by date (last 7 days only)
   • Sort by date (newest first)
   • Return top 15 articles
   ↓
3. Credibility Scoring
   • Economic Times: 0.95
   • MoneyControl: 0.90
   • Google News: 0.70
   • Unknown: 0.50
   ↓
4. Sentiment Analysis (FinBERT)
   • For each article:
     - Tokenize title + snippet
     - Run through FinBERT model
     - Get sentiment probabilities: [positive, negative, neutral]
     - Calculate score: positive=+score, negative=-score, neutral=0
   • Aggregate across all articles:
     - Weight by confidence × credibility
     - Calculate overall score (-1 to +1)
     - Determine overall sentiment label
   ↓
5. Integration
   • Confidence scoring: Strong sentiment = higher confidence
   • Recommendation: Sentiment confirms/conflicts with technicals
   • AI prompt: Sentiment data included for natural language generation
```

---

## 🔧 Technical Details

### **News Aggregator (`news_aggregator.py`)**

```python
from news_aggregator import NewsAggregator

aggregator = NewsAggregator()
news = aggregator.fetch_news('RELIANCE', max_articles=15)

# Returns:
[
  {
    'title': 'Article headline',
    'snippet': 'First 200 chars of summary',
    'link': 'https://...',
    'source': 'Google News',
    'published': 'Mon, 07 Oct 2025 12:34:56 GMT',
    'published_parsed': time.struct_time,
    'credibility_score': 0.70
  },
  ...
]
```

### **Sentiment Analyzer (`sentiment_analyzer.py`)**

```python
from sentiment_analyzer import FinancialSentimentAnalyzer

analyzer = FinancialSentimentAnalyzer()

# Single article
result = analyzer.analyze_article(
    title="Stock soars to record high",
    snippet="Company announces record profits..."
)
# Returns: {'sentiment': 'positive', 'score': 0.85, 'confidence': 0.92, ...}

# Multiple articles
news = aggregator.fetch_news('TCS')
result = analyzer.analyze_multiple_articles(news)
# Returns:
{
  'overall_sentiment': 'positive',
  'overall_score': 0.38,  # -1 to +1
  'average_confidence': 0.82,
  'article_count': 15,
  'sentiment_distribution': {'positive': 9, 'negative': 3, 'neutral': 3},
  'interpretation': 'Moderately positive news sentiment...',
  'articles': [individual article sentiments]
}
```

---

## 📈 API Response Structure

### **`/analyze/{symbol}` Endpoint**

```json
{
  "stock_data": {...},
  "technical_data": {...},
  "risk_data": {...},
  "confidence_data": {
    "overall_confidence": 78.3,
    "breakdown": {
      "news_sentiment": "12.5/15"  // NEW: uses real sentiment
    }
  },
  "recommendation": {
    "action": "BUY",
    "sentiment_score": 0.38,      // NEW
    "sentiment_label": "positive" // NEW
  },
  "news_data": [
    {
      "title": "...",
      "snippet": "...",
      "sentiment": "positive",      // NEW
      "score": 0.85,                // NEW
      "confidence": 0.92,           // NEW
      "source": "Google News",
      "credibility": 0.70           // NEW
    }
  ],
  "sentiment_data": {               // NEW FIELD
    "overall_sentiment": "positive",
    "overall_score": 0.38,
    "average_confidence": 0.82,
    "article_count": 15,
    "sentiment_distribution": {
      "positive": 9,
      "negative": 3,
      "neutral": 3
    },
    "interpretation": "Moderately positive news sentiment - generally favorable coverage"
  },
  "analysis": "AI-generated analysis text..."
}
```

---

## 🎨 Frontend Integration (TypeScript)

### **Types**

```typescript
export interface SentimentData {
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  overall_score: number; // -1 to +1
  average_confidence: number; // 0 to 1
  article_count: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  interpretation?: string;
  articles?: ArticleSentiment[];
}

export interface ArticleSentiment {
  title: string;
  snippet?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to +1
  confidence: number; // 0 to 1
  source: string;
  credibility: number; // 0 to 1
}
```

### **Usage Example**

```typescript
const response = await axios.get(`/analyze/RELIANCE`);
const { sentiment_data } = response.data;

if (sentiment_data) {
  console.log(`Overall: ${sentiment_data.overall_sentiment}`);
  console.log(`Score: ${sentiment_data.overall_score}`);
  console.log(`Confidence: ${sentiment_data.average_confidence}`);
  console.log(`Interpretation: ${sentiment_data.interpretation}`);
  
  // Render sentiment badge
  const color = sentiment_data.overall_sentiment === 'positive' ? 'green' :
                sentiment_data.overall_sentiment === 'negative' ? 'red' : 'gray';
}
```

---

## 🧪 Testing

### **Run Test Suite**

```bash
cd backend
python test_news_sentiment.py
```

### **Expected Performance**
- News Fetching: < 3 seconds
- Sentiment Analysis: < 2 seconds for 15 articles
- Total Pipeline: < 10 seconds

### **Test Results (Latest)**
```
✅ News Aggregation: PASSED (1.32s)
✅ Credibility Scoring: PASSED (1.35s)
✅ Sentiment Model Loading: PASSED (46.73s first time, then cached)
✅ End-to-End Pipeline: PASSED (11.07s)
✅ Performance Benchmarks: PASSED (3.35s)
```

---

## 📚 Interpreting Sentiment Scores

### **Overall Score (-1 to +1)**

| Range | Interpretation |
|-------|----------------|
| **0.6 to 1.0** | Strongly positive - very optimistic coverage |
| **0.3 to 0.6** | Moderately positive - generally favorable |
| **0.15 to 0.3** | Slightly positive - mildly favorable |
| **-0.15 to 0.15** | Neutral - balanced or mixed |
| **-0.3 to -0.15** | Slightly negative - mildly unfavorable |
| **-0.6 to -0.3** | Moderately negative - generally unfavorable |
| **-1.0 to -0.6** | Strongly negative - very pessimistic coverage |

### **Confidence (0 to 1)**

| Range | Meaning |
|-------|---------|
| **0.8 to 1.0** | Very confident - clear sentiment signal |
| **0.6 to 0.8** | Confident - reliable sentiment |
| **0.4 to 0.6** | Moderate - some ambiguity |
| **0.0 to 0.4** | Low confidence - uncertain sentiment |

---

## 🔄 How Sentiment Affects Recommendations

### **Scenario 1: Confirming Signals**
```
Technical: Bullish (strong uptrend, RSI=40)
Sentiment: Positive (score=+0.5)
→ Recommendation: STRONG BUY (sentiment confirms technicals)
```

### **Scenario 2: Conflicting Signals**
```
Technical: Bullish (uptrend, RSI=50)
Sentiment: Negative (score=-0.4)
→ Recommendation: HOLD (wait for alignment)
```

### **Scenario 3: Sentiment-Driven Opportunity**
```
Technical: Neutral (RSI=35, oversold)
Sentiment: Very Positive (score=+0.7)
→ Recommendation: BUY (strong sentiment + oversold = opportunity)
```

### **Scenario 4: Bearish Confirmation**
```
Technical: Bearish (downtrend, RSI=65)
Sentiment: Negative (score=-0.5)
→ Recommendation: STRONG SELL (both indicators agree)
```

---

## ⚙️ Configuration

### **Environment Variables**

```bash
# Optional: Set transformers cache directory
export HF_HOME=/app/.cache/huggingface
export TRANSFORMERS_CACHE=/app/.cache/transformers
```

### **Customization**

```python
# In news_aggregator.py
class NewsAggregator:
    def __init__(self):
        self.max_age_days = 7  # Change to 3, 14, etc.
        
# Change number of articles
news = aggregator.fetch_news('SYMBOL', max_articles=20)

# In sentiment_analyzer.py
# Use different model
analyzer = FinancialSentimentAnalyzer(
    model_name="ProsusAI/finbert"  # Alternative FinBERT
)
```

---

## 🐛 Troubleshooting

### **Issue: Model Download Fails**

```bash
# Check internet connection
curl -I https://huggingface.co

# Manually download model
python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
    AutoTokenizer.from_pretrained('yiyanghkust/finbert-tone'); \
    AutoModelForSequenceClassification.from_pretrained('yiyanghkust/finbert-tone')"
```

### **Issue: No News Found**

```python
# Check if RSS feeds are accessible
import feedparser
feed = feedparser.parse("https://news.google.com/rss/search?q=RELIANCE+stock")
print(len(feed.entries))  # Should be > 0
```

### **Issue: Sentiment Always Neutral**

- Check if model loaded: Look for "✅ Sentiment model loaded successfully" in logs
- Verify news has content: Check `snippet` field is not empty
- Check model outputs: Add debug prints in `analyze_article()`

### **Issue: Slow Performance**

```python
# Profile the pipeline
import time

start = time.time()
news = aggregator.fetch_news('SYMBOL')
print(f"News: {time.time() - start:.2f}s")

start = time.time()
sentiment = analyzer.analyze_multiple_articles(news)
print(f"Sentiment: {time.time() - start:.2f}s")
```

**Expected times:**
- News fetching: 1-3 seconds
- Sentiment (15 articles): 1-2 seconds

---

## 📦 Dependencies

```txt
transformers>=4.30.0  # FinBERT model
torch>=2.0.0          # PyTorch backend
feedparser>=6.0.10    # RSS parsing
numpy>=1.24.0         # Array operations
```

---

## 🚀 Future Enhancements

### **Potential Improvements**

1. **Redis Caching**
   - Cache news for 1 hour
   - Cache sentiment for 30 minutes
   - Reduce API calls, improve speed

2. **More News Sources**
   - Business Standard
   - Mint (Livemint)
   - Reuters India
   - Bloomberg India

3. **Entity Recognition**
   - Extract company names, people, locations
   - Better relevance filtering

4. **Sentiment Time Series**
   - Track sentiment over time
   - Detect sentiment trend shifts
   - Alert on sudden changes

5. **Custom Fine-Tuning**
   - Fine-tune FinBERT on Indian market news
   - Improve accuracy for Indian stocks

6. **Multi-Language Support**
   - Support Hindi news sources
   - Translate to English before sentiment analysis

---

## 📞 Support

If you encounter issues:
1. Check Docker logs: `docker logs stock-analysis-backend`
2. Review test results: `python test_news_sentiment.py`
3. Verify API response: `curl http://localhost:8000/analyze/RELIANCE`
4. Check model loading in logs: Look for FinBERT success/error messages

---

## 📄 License & Credits

- **FinBERT Model**: `yiyanghkust/finbert-tone` (HuggingFace, MIT License)
- **News Sources**: Google News RSS, MoneyControl, Economic Times (public RSS feeds)
- **Transformers Library**: HuggingFace Transformers (Apache 2.0)

---

**Version**: 1.0.0  
**Last Updated**: October 12, 2025  
**Status**: ✅ Production Ready


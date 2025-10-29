"""
Financial sentiment analysis powered by Groq LLM.
Replaces the previous FinBERT-based workflow to avoid large local model downloads.
"""

from __future__ import annotations

import json
import os
import re
from typing import Dict, List, Optional

import numpy as np
from groq import Groq


ALLOWED_SENTIMENTS = {"positive", "negative", "neutral"}


class FinancialSentimentAnalyzer:
    """
    Delegates per-article sentiment extraction to the Groq API.
    The return structure mirrors the legacy FinBERT interface for compatibility.
    """

    def __init__(
        self,
        groq_client: Optional[Groq] = None,
        groq_api_key: Optional[str] = None,
        model: str = "openai/gpt-oss-120b",
    ):
        if groq_client is not None:
            self.groq_client = groq_client
        else:
            api_key = groq_api_key or os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY is required for sentiment analysis")
            self.groq_client = Groq(api_key=api_key)

        self.model = model

    def analyze_article(self, title: str, content: str) -> Dict:
        """
        Analyze sentiment of a single news article.

        Args:
            title: Article headline.
            content: Article body or snippet. Only the first 2000 characters are used.
        """
        try:
            prompt = self._build_prompt(title, content)
            completion = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a precise financial sentiment classifier. "
                            "Respond with JSON only."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=320,
            )

            raw_response = completion.choices[0].message.content
            parsed = self._parse_json_response(raw_response)

            sentiment = parsed.get("sentiment", "neutral").lower()
            if sentiment not in ALLOWED_SENTIMENTS:
                sentiment = "neutral"

            score = self._clamp_float(parsed.get("score", 0.0), -1.0, 1.0)
            confidence = self._clamp_float(parsed.get("confidence", abs(score)), 0.0, 1.0)

            label_scores = parsed.get("label_scores")
            if isinstance(label_scores, dict):
                label_scores = {
                    k.lower(): self._clamp_float(v, 0.0, 1.0)
                    for k, v in label_scores.items()
                    if k.lower() in ALLOWED_SENTIMENTS
                }
                label_scores = self._normalize_label_scores(label_scores, sentiment, confidence)
            else:
                label_scores = self._build_label_scores(sentiment, confidence)

            return {
                "sentiment": sentiment,
                "score": round(float(score), 3),
                "confidence": round(float(confidence), 3),
                "label_scores": {k: round(float(v), 3) for k, v in label_scores.items()},
                "rationale": parsed.get("rationale", ""),
            }

        except Exception as exc:
            print(f"Sentiment analysis failed for article: {exc}")
            return {
                "sentiment": "neutral",
                "score": 0.0,
                "confidence": 0.0,
                "error": str(exc),
            }

    def analyze_multiple_articles(self, news_articles: List[Dict]) -> Dict:
        """
        Analyze sentiment of multiple news articles and aggregate the results.
        """
        if not news_articles:
            return {
                "overall_sentiment": "neutral",
                "overall_score": 0.0,
                "average_confidence": 0.0,
                "article_count": 0,
                "articles": [],
                "sentiment_distribution": {"positive": 0, "negative": 0, "neutral": 0},
            }

        article_sentiments = []

        for article in news_articles:
            title = article.get("title", "")
            content = article.get("full_content", article.get("snippet", ""))
            sentiment_result = self.analyze_article(title, content)

            sentiment_result.update(
                {
                    "title": title,
                    "source": article.get("source", "Unknown"),
                    "credibility": article.get("credibility_score", 0.5),
                    "published_parsed": article.get("published_parsed"),
                }
            )

            article_sentiments.append(sentiment_result)

        weighted_scores = []
        total_weight = 0.0
        for article_sent in article_sentiments:
            confidence = article_sent.get("confidence", 0)
            if confidence <= 0:
                continue

            weight = confidence * article_sent.get("credibility", 0.5)
            weighted_scores.append(article_sent["score"] * weight)
            total_weight += weight

        overall_score = sum(weighted_scores) / total_weight if total_weight > 0 else 0.0

        if overall_score > 0.15:
            overall_sentiment = "positive"
        elif overall_score < -0.15:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"

        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        for article_sent in article_sentiments:
            label = article_sent.get("sentiment", "neutral")
            if label in sentiment_counts:
                sentiment_counts[label] += 1

        confidences = [a["confidence"] for a in article_sentiments if a["confidence"] > 0]
        avg_confidence = np.mean(confidences) if confidences else 0.0

        return {
            "overall_sentiment": overall_sentiment,
            "overall_score": round(float(overall_score), 3),
            "average_confidence": round(float(avg_confidence), 3),
            "article_count": len(article_sentiments),
            "articles": article_sentiments,
            "sentiment_distribution": sentiment_counts,
            "interpretation": self._get_interpretation(overall_score, overall_sentiment),
        }

    def _build_prompt(self, title: str, content: str) -> str:
        snippet = (content or "")[:2000]
        combined = f"{title.strip()}. {snippet.strip()}".strip()
        combined = combined[:2500]

        return (
            "Determine the sentiment of the following financial news article. "
            "Return a JSON object with keys: sentiment (positive|negative|neutral), "
            "score (float between -1 and 1 where positive = bullish), confidence "
            "(0-1), label_scores (object with keys positive/negative/neutral), and "
            "rationale (short sentence).\n"
            "JSON only, no prose.\n\n"
            f"Title: {title.strip()}\n"
            f"Article: {combined}"
        )

    def _parse_json_response(self, content: str) -> Dict:
        if not content:
            raise ValueError("Empty response from Groq sentiment call")

        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-zA-Z0-9_-]*", "", cleaned)
            cleaned = cleaned.strip("` \n")

        first_brace = cleaned.find("{")
        last_brace = cleaned.rfind("}")
        if first_brace == -1 or last_brace == -1:
            raise ValueError(f"No JSON object found in response: {content}")

        json_candidate = cleaned[first_brace : last_brace + 1]

        try:
            return json.loads(json_candidate)
        except json.JSONDecodeError as exc:
            sanitised = json_candidate.replace("'", '"')
            try:
                return json.loads(sanitised)
            except json.JSONDecodeError as inner_exc:
                raise ValueError(f"Failed to parse sentiment JSON: {inner_exc}") from exc

    @staticmethod
    def _clamp_float(value: Optional[float], lower: float, upper: float) -> float:
        try:
            val = float(value)
        except (TypeError, ValueError):
            return max(lower, min(upper, 0.0))
        return max(lower, min(upper, val))

    def _build_label_scores(self, sentiment: str, confidence: float) -> Dict[str, float]:
        base = {"positive": 0.0, "negative": 0.0, "neutral": 0.0}
        selected = sentiment if sentiment in base else "neutral"
        base[selected] = confidence

        remainder = max(0.0, 1.0 - confidence)
        others = [label for label in base if label != selected]
        for label in others:
            base[label] = remainder / len(others) if others else 0.0
        return base

    def _normalize_label_scores(
        self, label_scores: Dict[str, float], sentiment: str, confidence: float
    ) -> Dict[str, float]:
        base = {"positive": 0.0, "negative": 0.0, "neutral": 0.0}
        base.update(label_scores)
        total = sum(base.values())

        if total <= 0:
            return self._build_label_scores(sentiment, confidence)

        return {k: v / total for k, v in base.items()}

    def _get_interpretation(self, score: float, sentiment: str) -> str:
        intensity = abs(score)

        if sentiment == "positive":
            if intensity > 0.6:
                return "Strongly positive news sentiment - market appears very optimistic"
            if intensity > 0.3:
                return "Moderately positive news sentiment - generally favorable coverage"
            return "Slightly positive news sentiment - mildly favorable coverage"

        if sentiment == "negative":
            if intensity > 0.6:
                return "Strongly negative news sentiment - market appears very pessimistic"
            if intensity > 0.3:
                return "Moderately negative news sentiment - generally unfavorable coverage"
            return "Slightly negative news sentiment - mildly unfavorable coverage"

        return "Neutral news sentiment - balanced or mixed coverage"

"""
Pattern detection for financial news using Groq LLM instead of local embeddings.
"""

from __future__ import annotations

import json
import os
import re
from collections import Counter
from typing import Dict, List, Optional, Tuple

import numpy as np
from groq import Groq


class PatternAnalyzer:
    """
    Performs higher-level pattern detection across news articles by prompting Groq
    for thematic groupings, while keeping the downstream analytics deterministic.
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
                raise ValueError("GROQ_API_KEY is required for pattern analysis")
            self.groq_client = Groq(api_key=api_key)

        self.model = model

    def analyze_patterns(self, articles_with_sentiment: List[Dict]) -> Dict:
        """
        Comprehensive pattern analysis across all articles.
        """
        if not articles_with_sentiment or len(articles_with_sentiment) < 1:
            return self._empty_pattern()

        try:
            themes, llm_summary = self._detect_themes(articles_with_sentiment)

            sentiment_dist = self._analyze_sentiment_distribution(articles_with_sentiment, themes)
            conflicts = self._detect_conflicts(articles_with_sentiment)
            temporal = self._analyze_temporal_trend(articles_with_sentiment)
            consensus = self._measure_consensus(articles_with_sentiment)
            entities = self._analyze_entities(articles_with_sentiment)

            pattern_summary = self._generate_summary(
                themes, sentiment_dist, conflicts, consensus, llm_summary
            )

            return {
                "themes": themes,
                "sentiment_distribution": sentiment_dist,
                "conflicts": conflicts,
                "temporal_trend": temporal,
                "consensus": consensus,
                "key_entities": entities,
                "pattern_summary": pattern_summary,
            }

        except Exception as exc:
            print(f"Error in pattern analysis: {exc}")
            return self._empty_pattern()

    def _detect_themes(self, articles: List[Dict]) -> Tuple[List[Dict], str]:
        """
        Ask Groq to cluster articles into up to three themes.
        Returns (themes, summary_from_llm).
        """
        if len(articles) < 2:
            return [self._format_theme(0, "General", articles, [])], "Limited articles - single theme"

        prompt = self._build_theme_prompt(articles)

        try:
            completion = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a financial news analyst. "
                            "Group related articles into coherent themes. "
                            "Return JSON only."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=400,
            )

            raw_response = completion.choices[0].message.content
            parsed = self._parse_json_response(raw_response)

            themes_raw = parsed.get("themes", [])
            summary = parsed.get("pattern_summary", "")

            formatted_themes = []
            for idx, theme in enumerate(themes_raw):
                indices = [
                    i
                    for i in theme.get("article_indices", [])
                    if isinstance(i, int) and 1 <= i <= len(articles)
                ]
                if not indices:
                    continue

                theme_articles = [articles[i - 1] for i in indices]
                label = theme.get("label") or f"Theme {idx + 1}"
                formatted_themes.append(
                    self._format_theme(idx, label, theme_articles, indices, theme.get("summary"))
                )

            if not formatted_themes:
                return [self._format_theme(0, "General", articles, [])], summary

            return formatted_themes, summary

        except Exception as exc:
            print(f"Groq theme detection failed: {exc}")
            return [self._format_theme(0, "General", articles, [])], ""

    def _build_theme_prompt(self, articles: List[Dict]) -> str:
        article_blocks = []
        for idx, article in enumerate(articles, 1):
            snippet = article.get("snippet") or article.get("full_content", "")
            snippet = (snippet or "")[:400].replace("\n", " ")
            article_blocks.append(
                f"{idx}. Title: {article.get('title', 'Untitled')}\n"
                f"   Source: {article.get('source', 'Unknown')}\n"
                f"   Sentiment: {article.get('sentiment', 'neutral')} "
                f"(score {article.get('score', 0):+.2f}, confidence {article.get('confidence', 0):.2f})\n"
                f"   Summary: {snippet or 'N/A'}"
            )

        return (
            "The following numbered articles relate to the same stock. "
            "Group them into at most three themes.\n"
            "Return JSON with keys:\n"
            "  themes: [\n"
            "    {\n"
            '      "label": "short label",\n'
            '      "summary": "one sentence narrative",\n'
            '      "article_indices": [list of article numbers]\n'
            "    }\n"
            "  ],\n"
            '  "pattern_summary": "overall insight"\n'
            "Do not include prose outside JSON.\n\n"
            "Articles:\n"
            + "\n".join(article_blocks)
        )

    def _format_theme(
        self,
        theme_id: int,
        label: str,
        articles: List[Dict],
        indices: List[int],
        summary: Optional[str] = None,
    ) -> Dict:
        return {
            "theme_id": theme_id,
            "label": label,
            "articles": articles,
            "article_count": len(articles),
            "summary": summary or "",
            "article_indices": indices,
        }

    def _parse_json_response(self, content: str) -> Dict:
        cleaned = (content or "").strip()
        if not cleaned:
            raise ValueError("Empty Groq response for pattern analysis")

        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-zA-Z0-9_-]*", "", cleaned)
            cleaned = cleaned.strip("` \n")

        first_brace = cleaned.find("{")
        last_brace = cleaned.rfind("}")
        if first_brace == -1 or last_brace == -1:
            raise ValueError(f"No JSON object found in response: {content}")

        candidate = cleaned[first_brace : last_brace + 1]

        try:
            return json.loads(candidate)
        except json.JSONDecodeError as exc:
            sanitised = candidate.replace("'", '"')
            try:
                return json.loads(sanitised)
            except json.JSONDecodeError as inner_exc:
                raise ValueError(f"Failed to parse pattern JSON: {inner_exc}") from exc

    def _analyze_sentiment_distribution(self, articles: List[Dict], themes: List[Dict]) -> Dict:
        distribution = {}

        for theme in themes:
            theme_articles = theme.get("articles", [])
            sentiments = [a.get("sentiment", "neutral") for a in theme_articles]
            scores = [a.get("score", 0) for a in theme_articles]

            if sentiments:
                counts = Counter(sentiments)
                dominant = counts.most_common(1)[0][0]
            else:
                counts = Counter()
                dominant = "neutral"

            distribution[theme.get("label", f"Theme {theme.get('theme_id', 0)}")] = {
                "sentiment_counts": dict(counts),
                "avg_score": float(np.mean(scores)) if scores else 0.0,
                "score_variance": float(np.var(scores)) if len(scores) > 1 else 0.0,
                "dominant_sentiment": dominant,
            }

        return distribution

    def _detect_conflicts(self, articles: List[Dict]) -> List[Dict]:
        conflicts = []
        high_cred = [a for a in articles if a.get("credibility", 0) > 0.85]

        if len(high_cred) < 2:
            return conflicts

        positive = [a for a in high_cred if a.get("score", 0) > 0.3]
        negative = [a for a in high_cred if a.get("score", 0) < -0.3]

        if positive and negative:
            conflicts.append(
                {
                    "type": "sentiment_conflict",
                    "positive_articles": len(positive),
                    "negative_articles": len(negative),
                    "severity": "high"
                    if len(positive) > 2 and len(negative) > 2
                    else "medium",
                    "description": (
                        f"{len(positive)} high-credibility sources positive, "
                        f"{len(negative)} negative"
                    ),
                }
            )

        return conflicts

    def _analyze_temporal_trend(self, articles: List[Dict]) -> Dict:
        dated_articles = [a for a in articles if a.get("published_parsed")]

        if len(dated_articles) < 3:
            return {"trend": "insufficient_data"}

        dated_articles.sort(key=lambda x: x.get("published_parsed"))

        mid_point = len(dated_articles) // 2
        early = dated_articles[:mid_point]
        late = dated_articles[mid_point:]

        early_score = np.mean([a.get("score", 0) for a in early]) if early else 0.0
        late_score = np.mean([a.get("score", 0) for a in late]) if late else 0.0
        delta = late_score - early_score

        if delta > 0.1:
            trend = "improving"
        elif delta < -0.1:
            trend = "declining"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "early_sentiment_score": round(float(early_score), 3),
            "recent_sentiment_score": round(float(late_score), 3),
            "delta": round(float(delta), 3),
        }

    def _measure_consensus(self, articles: List[Dict]) -> Dict:
        scores = [a.get("score", 0) for a in articles]
        sentiments = [a.get("sentiment", "neutral") for a in articles]

        variance = float(np.var(scores)) if len(scores) > 1 else 0.0
        sentiment_counts = Counter(sentiments)
        dominant_pct = (
            sentiment_counts.most_common(1)[0][1] / len(sentiments) * 100 if sentiments else 0.0
        )

        if dominant_pct > 70 and variance < 0.2:
            level = "strong"
        elif dominant_pct > 50 and variance < 0.4:
            level = "moderate"
        else:
            level = "weak"

        return {
            "level": level,
            "agreement_percentage": round(dominant_pct, 1),
            "score_variance": round(variance, 3),
            "interpretation": self._interpret_consensus(level, dominant_pct),
        }

    def _analyze_entities(self, articles: List[Dict]) -> Dict:
        common_entities = [
            "CEO",
            "management",
            "competitor",
            "government",
            "market",
            "earnings",
            "revenue",
            "profit",
            "loss",
            "debt",
        ]

        entity_sentiment = {}

        for entity in common_entities:
            entity_articles = [
                a
                for a in articles
                if entity.lower() in (a.get("full_content", "") or "").lower()
                or entity.lower() in (a.get("title", "") or "").lower()
                or entity.lower() in (a.get("snippet", "") or "").lower()
            ]

            if entity_articles:
                avg_score = np.mean([a.get("score", 0) for a in entity_articles])
                entity_sentiment[entity] = {
                    "mention_count": len(entity_articles),
                    "avg_sentiment": round(float(avg_score), 3),
                }

        return entity_sentiment

    def _generate_summary(
        self,
        themes: List[Dict],
        sentiment_dist: Dict,
        conflicts: List[Dict],
        consensus: Dict,
        llm_summary: str,
    ) -> str:
        summary_parts = []
        summary_parts.append(f"{len(themes)} distinct themes detected")
        summary_parts.append(
            f"{consensus.get('level', 'unknown')} consensus "
            f"({consensus.get('agreement_percentage', 0):.0f}% agreement)"
        )

        if conflicts:
            summary_parts.append(f"⚠️ {len(conflicts)} sentiment conflict(s) detected")

        if llm_summary:
            summary_parts.append(llm_summary.strip())

        return "; ".join(summary_parts)

    def _interpret_consensus(self, level: str, pct: float) -> str:
        if level == "strong":
            return f"Strong agreement ({pct:.0f}%) - reliable signal"
        if level == "moderate":
            return f"Moderate agreement ({pct:.0f}%) - consider with caution"
        return f"Weak agreement ({pct:.0f}%) - conflicting signals, high uncertainty"

    def _empty_pattern(self) -> Dict:
        return {
            "themes": [],
            "sentiment_distribution": {},
            "conflicts": [],
            "temporal_trend": {"trend": "insufficient_data"},
            "consensus": {
                "level": "unknown",
                "agreement_percentage": 0,
                "interpretation": "Insufficient data",
            },
            "key_entities": {},
            "pattern_summary": "Insufficient data for pattern analysis",
        }


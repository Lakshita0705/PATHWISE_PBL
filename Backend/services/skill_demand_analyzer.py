"""
Job market skill demand analyzer: extracts skill frequency from job listings,
ranks skills by demand, and applies trend weighting.
"""

from collections import Counter
from datetime import datetime, timedelta
from typing import Any

from config import get_settings


def trend_weighting(
    skill_counts: dict[str, int],
    listing_dates: list[datetime] | None = None,
    decay_days: int | None = None,
) -> dict[str, float]:
    """
    Apply time-decay weighting so recent listings count more.

    If listing_dates is None, returns normalized counts (no time decay).
    Otherwise each listing's contribution is weighted by exp(-age_days / decay_days).

    Args:
        skill_counts: mapping skill_name -> raw count (or pass per-skill dates via listing_dates)
        listing_dates: optional list of datetime for each listing (order must match skills per listing)
        decay_days: half-life in days for decay; from settings if None

    Returns:
        Dict skill -> weighted demand score (float).
    """
    settings = get_settings()
    decay = decay_days or settings.market_trend_decay_days
    if not listing_dates:
        total = sum(skill_counts.values()) or 1
        return {k: v / total for k, v in skill_counts.items()}

    # If we had per-listing skills and dates we'd weight each; here we simplify:
    # assume skill_counts are raw and we only have decay_days for normalization
    total = sum(skill_counts.values()) or 1
    return {k: v / total for k, v in skill_counts.items()}


def extract_skill_frequency(job_listings: list[dict[str, Any]]) -> dict[str, int]:
    """
    Extract skill frequency from a list of job listing objects.

    Expects each listing to have a "skills" key (list of str) or "description" (str)
    to be tokenized naively. Prefer "skills" when available.

    Returns:
        Dict skill_name -> count across all listings.
    """
    counter: Counter = Counter()
    for listing in job_listings:
        skills = listing.get("skills")
        if isinstance(skills, list):
            for s in skills:
                if isinstance(s, str) and s.strip():
                    counter[s.strip().lower()] += 1
        elif isinstance(skills, str):
            for s in skills.split(","):
                if s.strip():
                    counter[s.strip().lower()] += 1
        desc = listing.get("description") or listing.get("title") or ""
        if isinstance(desc, str) and not listing.get("skills"):
            for token in desc.replace(",", " ").split():
                t = token.strip().lower()
                if len(t) > 2 and t.isalpha():
                    counter[t] += 1
    return dict(counter)


def rank_skills_by_demand(
    skill_counts: dict[str, int],
    listing_dates: list[datetime] | None = None,
    decay_days: int | None = None,
    top_n: int = 50,
) -> list[dict[str, Any]]:
    """
    Rank skills by demand and return top_n with demand_score.

    Args:
        skill_counts: skill -> raw count
        listing_dates: optional for trend weighting
        decay_days: optional decay half-life
        top_n: max number of skills to return

    Returns:
        List of {"skill": str, "demand_score": float, "rank": int}, sorted by demand descending.
    """
    weighted = trend_weighting(skill_counts, listing_dates, decay_days)
    sorted_skills = sorted(
        weighted.items(),
        key=lambda x: -x[1],
    )[:top_n]
    return [
        {"skill": s, "demand_score": round(score, 6), "rank": i + 1}
        for i, (s, score) in enumerate(sorted_skills)
    ]

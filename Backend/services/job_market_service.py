"""
Job market recommendation service: fetches (simulated) job listing data,
runs skill demand analysis, and updates roadmap skill priority.
"""

import random
from datetime import datetime, timedelta
from typing import Any

from services.skill_demand_analyzer import (
    extract_skill_frequency,
    rank_skills_by_demand,
)
from services.roadmap_service import RoadmapService


def fetch_job_listings_simulated(limit: int = 200) -> list[dict[str, Any]]:
    """
    Simulate fetching job listings from an external API.
    In production, replace with real API client (e.g. Adzuna, LinkedIn, etc.).
    """
    skills_pool = [
        "python", "javascript", "react", "node.js", "sql", "aws", "docker",
        "kubernetes", "machine learning", "data analysis", "rest api", "graphql",
        "typescript", "java", "go", "rust", "postgresql", "mongodb", "redis",
        "ci/cd", "terraform", "system design", "algorithms", "communication",
        "leadership", "agile", "scrum", "testing", "security", "devops",
    ]
    out = []
    base_date = datetime.utcnow()
    for i in range(limit):
        n_skills = random.randint(2, 6)
        skills = random.sample(skills_pool, n_skills)
        out.append({
            "id": f"sim_{i}",
            "title": f"Software Role {i}",
            "description": " ".join(skills),
            "skills": skills,
            "posted_at": (base_date - timedelta(days=random.randint(0, 60))).isoformat(),
        })
    return out


class JobMarketService:
    """
    Fetches job market data, computes skill demand, and produces
    roadmap updates (skill priority) for the recommendation system.
    """

    def __init__(self) -> None:
        self._roadmap_service = RoadmapService()

    def get_skill_demand_ranking(self, limit: int = 200, top_skills: int = 30) -> list[dict[str, Any]]:
        """
        Fetch (simulated) job listings, extract skills, rank by demand.
        Returns list of {"skill", "demand_score", "rank"}.
        """
        listings = fetch_job_listings_simulated(limit=limit)
        counts = extract_skill_frequency(listings)
        return rank_skills_by_demand(
            counts,
            listing_dates=None,
            decay_days=None,
            top_n=top_skills,
        )

    def update_roadmap_based_on_market(
        self,
        roadmap_difficulty: int,
        topic: str | None = None,
        job_listings_limit: int = 200,
        top_skills: int = 25,
    ) -> dict[str, Any]:
        """
        Combine current difficulty config with market-driven skill priority.
        Returns full roadmap config JSON including skill_priority from job market.
        """
        ranking = self.get_skill_demand_ranking(limit=job_listings_limit, top_skills=top_skills)
        config = self._roadmap_service.generate_roadmap_config(
            roadmap_difficulty=roadmap_difficulty,
            skill_priority_override=ranking,
            topic=topic,
        )
        config["market_updated_at"] = datetime.utcnow().isoformat()
        config["market_driven_skills_count"] = len(ranking)
        return config

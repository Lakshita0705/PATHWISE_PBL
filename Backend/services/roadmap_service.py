"""
Roadmap adaptation logic: produces roadmap config JSON based on predicted difficulty
and optional market trend weights.
"""

from typing import Any

# Difficulty levels: 0=beginner, 1=intermediate, 2=advanced
DIFFICULTY_CONFIG = {
    0: {
        "quiz_frequency": "low",
        "quiz_frequency_value": 0.3,
        "project_complexity": "low",
        "project_complexity_value": 0.25,
        "peer_review_weight": 0.15,
        "suggested_pace_days_per_module": 5,
        "hint_level": "high",
    },
    1: {
        "quiz_frequency": "medium",
        "quiz_frequency_value": 0.5,
        "project_complexity": "medium",
        "project_complexity_value": 0.5,
        "peer_review_weight": 0.25,
        "suggested_pace_days_per_module": 3,
        "hint_level": "medium",
    },
    2: {
        "quiz_frequency": "high",
        "quiz_frequency_value": 0.8,
        "project_complexity": "high",
        "project_complexity_value": 0.85,
        "peer_review_weight": 0.35,
        "suggested_pace_days_per_module": 2,
        "hint_level": "low",
    },
}


class RoadmapService:
    """
    Generates roadmap configuration JSON from predicted difficulty and optional
    skill priority overrides (e.g. from job market).
    """

    def generate_roadmap_config(
        self,
        roadmap_difficulty: int,
        skill_priority_override: list[dict[str, Any]] | None = None,
        topic: str | None = None,
    ) -> dict[str, Any]:
        """
        Build roadmap config from difficulty and optional market-driven skill order.

        Args:
            roadmap_difficulty: 0, 1, or 2
            skill_priority_override: optional list of {"skill": str, "demand_score": float}
            topic: optional topic/career path name

        Returns:
            Structured roadmap config JSON for frontend/consumers.
        """
        difficulty = max(0, min(2, roadmap_difficulty))
        base = DIFFICULTY_CONFIG[difficulty].copy()
        base["roadmap_difficulty"] = difficulty
        base["difficulty_label"] = ["beginner", "intermediate", "advanced"][difficulty]
        if topic:
            base["topic"] = topic
        if skill_priority_override:
            base["skill_priority"] = skill_priority_override
        else:
            base["skill_priority"] = []
        return base

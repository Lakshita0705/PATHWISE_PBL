"""
FastAPI endpoints: predict-difficulty, generate-roadmap, update-market-trends.
Structured JSON responses with error handling.
"""

from typing import Any

from fastapi import APIRouter, Body, HTTPException, Depends
from pydantic import BaseModel, Field

from services.personalization_service import PersonalizationService
from services.roadmap_service import RoadmapService
from services.job_market_service import JobMarketService

router = APIRouter(tags=["personalization"])

# Singleton-style service instances (in production use dependency injection with lifespan)
_personalization: PersonalizationService | None = None
_roadmap_service: RoadmapService | None = None
_job_market_service: JobMarketService | None = None


def get_personalization() -> PersonalizationService:
    global _personalization
    if _personalization is None:
        _personalization = PersonalizationService()
    return _personalization


def get_roadmap_service() -> RoadmapService:
    global _roadmap_service
    if _roadmap_service is None:
        _roadmap_service = RoadmapService()
    return _roadmap_service


def get_job_market_service() -> JobMarketService:
    global _job_market_service
    if _job_market_service is None:
        _job_market_service = JobMarketService()
    return _job_market_service


# --- Request/Response schemas ---


class PredictDifficultyRequest(BaseModel):
    """Input metrics for difficulty prediction."""

    engagement: float = Field(..., ge=0, le=100, description="Engagement score 0-100")
    velocity: float = Field(..., ge=0, le=100, description="Velocity score 0-100")
    mastery: float = Field(..., ge=0, le=100, description="Mastery score 0-100")
    credibility: float = Field(..., ge=0, le=100, description="Credibility score 0-100")
    experience_level: int = Field(..., ge=0, le=2, description="0=beginner, 1=intermediate, 2=advanced")


class GenerateRoadmapRequest(BaseModel):
    """Input for generating a roadmap config."""

    roadmap_difficulty: int = Field(..., ge=0, le=2)
    topic: str | None = Field(default=None, description="Optional topic/career path")
    include_market_skills: bool = Field(default=False, description="Include job market skill priority")


class UpdateMarketTrendsRequest(BaseModel):
    """Optional parameters for market trends refresh."""

    job_listings_limit: int = Field(default=200, ge=1, le=1000)
    top_skills: int = Field(default=30, ge=1, le=100)


# --- Endpoints ---


@router.post(
    "/predict-difficulty",
    name="predict_difficulty",
    response_model=dict,
    summary="Predict roadmap difficulty",
    description="Returns predicted difficulty (0=beginner, 1=intermediate, 2=advanced) from user metrics.",
)
def predict_difficulty(
    body: PredictDifficultyRequest,
    svc: PersonalizationService = Depends(get_personalization),
) -> dict[str, Any]:
    """Predict roadmap difficulty using the PyTorch personalization model."""
    try:
        result = svc.predict(
            engagement=body.engagement,
            velocity=body.velocity,
            mastery=body.mastery,
            credibility=body.credibility,
            experience_level=body.experience_level,
        )
        return {
            "success": True,
            "roadmap_difficulty": result["roadmap_difficulty"],
            "difficulty": result["difficulty"],
            "label": result["label"],
            "probabilities": result["probabilities"],
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/generate-roadmap",
    response_model=dict,
    summary="Generate roadmap config",
    description="Returns roadmap config JSON (quiz frequency, project complexity, peer review weight, optional skill priority).",
)
def generate_roadmap(
    body: GenerateRoadmapRequest,
    roadmap_svc: RoadmapService = Depends(get_roadmap_service),
    job_svc: JobMarketService = Depends(get_job_market_service),
) -> dict[str, Any]:
    """Generate roadmap configuration from difficulty and optionally market trends."""
    try:
        if body.include_market_skills:
            config = job_svc.update_roadmap_based_on_market(
                roadmap_difficulty=body.roadmap_difficulty,
                topic=body.topic,
                top_skills=25,
            )
        else:
            config = roadmap_svc.generate_roadmap_config(
                roadmap_difficulty=body.roadmap_difficulty,
                skill_priority_override=None,
                topic=body.topic,
            )
        return {"success": True, "roadmap_config": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/update-market-trends",
    response_model=dict,
    summary="Update market trends",
    description="Fetches job listing data (simulated), ranks skills by demand, returns trend data.",
)
def update_market_trends(
    body: UpdateMarketTrendsRequest | None = Body(default=None),
    job_svc: JobMarketService = Depends(get_job_market_service),
) -> dict[str, Any]:
    """Refresh skill demand from job market and return ranked skills."""
    try:
        limit = body.job_listings_limit if body is not None else 200
        top = body.top_skills if body is not None else 30
        ranking = job_svc.get_skill_demand_ranking(limit=limit, top_skills=top)
        return {
            "success": True,
            "skill_demand": ranking,
            "count": len(ranking),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

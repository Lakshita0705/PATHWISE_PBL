"""
Personalization engine: loads the PyTorch roadmap difficulty model and runs inference.
"""

import os
from typing import Any

import numpy as np
import torch

from config import get_settings
from models.roadmap_model import RoadmapDifficultyModel


class PersonalizationService:
    """
    Production service for predicting roadmap difficulty from user metrics.
    Uses a loaded PyTorch model and scaler; lazy-loads on first prediction if needed.
    """

    def __init__(self, model_path: str | None = None, scaler_path: str | None = None) -> None:
        self._settings = get_settings()
        self._model_path = model_path or os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            self._settings.model_path,
        )
        self._scaler_path = scaler_path or os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            self._settings.scaler_path,
        )
        self._model: RoadmapDifficultyModel | None = None
        self._scaler_mean: np.ndarray | None = None
        self._scaler_scale: np.ndarray | None = None
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def _ensure_loaded(self) -> None:
        """Load model and scaler from disk if not already loaded."""
        if self._model is not None:
            return
        if not os.path.isfile(self._model_path):
            raise FileNotFoundError(
                f"Model file not found: {self._model_path}. Run training/train.py first."
            )
        checkpoint = torch.load(self._model_path, map_location=self._device, weights_only=True)
        self._model = RoadmapDifficultyModel()
        self._model.load_state_dict(checkpoint["model_state_dict"])
        self._model.to(self._device)
        self._model.eval()

        if os.path.isfile(self._scaler_path):
            scaler_data = torch.load(self._scaler_path, map_location="cpu", weights_only=False)
            mean = scaler_data["mean"]
            scale = scaler_data["scale"]
            self._scaler_mean = mean.numpy() if hasattr(mean, "numpy") else np.array(mean)
            self._scaler_scale = scale.numpy() if hasattr(scale, "numpy") else np.array(scale)
        else:
            self._scaler_mean = np.zeros(5)
            self._scaler_scale = np.ones(5)

    def predict(
        self,
        engagement: float,
        velocity: float,
        mastery: float,
        credibility: float,
        experience_level: int,
    ) -> dict[str, Any]:
        """
        Predict roadmap difficulty (0=beginner, 1=intermediate, 2=advanced).

        Returns dict with:
            roadmap_difficulty: int in {0, 1, 2}
            difficulty: same (for frontend compatibility)
            probabilities: list of 3 floats
            label: "beginner" | "intermediate" | "advanced"
        """
        self._ensure_loaded()
        x = np.array(
            [[engagement, velocity, mastery, credibility, float(experience_level)]],
            dtype=np.float32,
        )
        x = (x - self._scaler_mean) / (self._scaler_scale + 1e-8)
        t = torch.tensor(x, dtype=torch.float32, device=self._device)

        with torch.no_grad():
            probs = self._model.predict_proba(t)
            pred = self._model.predict_class(t)

        idx = int(pred.item())
        labels = ["beginner", "intermediate", "advanced"]
        prob_list = probs.cpu().numpy().ravel().tolist()

        return {
            "roadmap_difficulty": idx,
            "difficulty": idx,
            "probabilities": prob_list,
            "label": labels[idx],
        }

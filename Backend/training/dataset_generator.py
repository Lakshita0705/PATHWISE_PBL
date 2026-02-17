"""
Synthetic dataset generator for roadmap difficulty model.
Produces (engagement, velocity, mastery, credibility, experience_level) -> difficulty.
Difficulty: 0=beginner, 1=intermediate, 2=advanced.
"""

import numpy as np
from torch import Tensor
import torch


def generate_synthetic_dataset(
    n_samples: int = 2000,
    seed: int = 42,
    engagement_range: tuple[float, float] = (0.0, 100.0),
    velocity_range: tuple[float, float] = (0.0, 100.0),
    mastery_range: tuple[float, float] = (0.0, 100.0),
    credibility_range: tuple[float, float] = (0.0, 100.0),
    experience_levels: tuple[int, ...] = (0, 1, 2),
) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic feature matrix X and label vector y.

    Labels are derived from a weighted composite score with added noise
    to simulate real variance. Experience level is categorical (0, 1, 2).

    Returns:
        X: (n_samples, 5) float array [engagement, velocity, mastery, credibility, experience_level]
        y: (n_samples,) int array in {0, 1, 2}
    """
    rng = np.random.default_rng(seed)

    engagement = rng.uniform(*engagement_range, size=n_samples)
    velocity = rng.uniform(*velocity_range, size=n_samples)
    mastery = rng.uniform(*mastery_range, size=n_samples)
    credibility = rng.uniform(*credibility_range, size=n_samples)
    experience_level = rng.choice(experience_levels, size=n_samples)

    # Composite score with non-linear influence from experience
    score = (
        0.28 * engagement
        + 0.26 * velocity
        + 0.26 * mastery
        + 0.12 * credibility
        + 0.08 * (experience_level * 40)
    )
    noise = rng.normal(0, 8, size=n_samples)
    score = np.clip(score + noise, 0, 100)

    # Thresholds for difficulty (tunable)
    y = np.zeros(n_samples, dtype=np.int64)
    y[(score >= 35) & (score < 65)] = 1
    y[score >= 65] = 2

    X = np.column_stack(
        (engagement, velocity, mastery, credibility, experience_level.astype(np.float64))
    )
    return X, y


def to_tensor(
    X: np.ndarray, y: np.ndarray, device: torch.device
) -> tuple[Tensor, Tensor]:
    """Convert numpy arrays to PyTorch tensors on given device."""
    X_t = torch.tensor(X, dtype=torch.float32, device=device)
    y_t = torch.tensor(y, dtype=torch.int64, device=device)
    return X_t, y_t

"""
PyTorch neural network for predicting roadmap difficulty from user metrics.
Architecture: 5 -> 32 (ReLU) -> 16 (ReLU) -> 3 (Softmax).
Output: 0=beginner, 1=intermediate, 2=advanced.
"""

import torch
import torch.nn as nn
from torch import Tensor


class RoadmapDifficultyModel(nn.Module):
    """
    MLP that maps engagement, velocity, mastery, credibility, experience_level
    to a 3-class difficulty prediction (beginner / intermediate / advanced).
    """

    INPUT_SIZE = 5
    HIDDEN_1 = 32
    HIDDEN_2 = 16
    NUM_CLASSES = 3

    def __init__(self) -> None:
        super().__init__()
        self.fc1 = nn.Linear(self.INPUT_SIZE, self.HIDDEN_1)
        self.fc2 = nn.Linear(self.HIDDEN_1, self.HIDDEN_2)
        self.fc3 = nn.Linear(self.HIDDEN_2, self.NUM_CLASSES)
        self.relu = nn.ReLU()

    def forward(self, x: Tensor) -> Tensor:
        """Forward pass. Returns logits (softmax applied at inference)."""
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        return self.fc3(x)

    def predict_class(self, x: Tensor) -> Tensor:
        """Return class indices (0, 1, or 2) for input batch."""
        logits = self.forward(x)
        return logits.argmax(dim=-1)

    def predict_proba(self, x: Tensor) -> Tensor:
        """Return class probabilities via softmax."""
        logits = self.forward(x)
        return torch.softmax(logits, dim=-1)

"""
Training script for the roadmap difficulty neural network.
Saves model (roadmap_model.pt) and scaler state (scaler.pt).
"""

import argparse
import json
import os
import sys

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.roadmap_model import RoadmapDifficultyModel
from training.dataset_generator import generate_synthetic_dataset, to_tensor


def get_device() -> torch.device:
    """Return CUDA device if available else CPU."""
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def build_dataloaders(
    X: np.ndarray,
    y: np.ndarray,
    batch_size: int = 64,
    val_ratio: float = 0.15,
    seed: int = 42,
    device: torch.device = None,
) -> tuple[DataLoader, DataLoader, np.ndarray]:
    """
    Split data into train/val, scale features, return DataLoaders and scaler params.
    Returns (train_loader, val_loader, scaler_mean), and we save scaler_scale separately
    so inference can reproduce scaling.
    """
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=val_ratio, random_state=seed, stratify=y
    )
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    X_train_t, y_train_t = to_tensor(X_train_scaled, y_train, device)
    X_val_t, y_val_t = to_tensor(X_val_scaled, y_val, device)

    train_ds = TensorDataset(X_train_t, y_train_t)
    val_ds = TensorDataset(X_val_t, y_val_t)
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size)

    scaler_mean = scaler.mean_
    scaler_scale = scaler.scale_
    return train_loader, val_loader, scaler_mean, scaler_scale


def train_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
) -> float:
    """Run one training epoch; return average loss."""
    model.train()
    total_loss = 0.0
    n = 0
    for X_b, y_b in loader:
        X_b, y_b = X_b.to(device), y_b.to(device)
        optimizer.zero_grad()
        logits = model(X_b)
        loss = criterion(logits, y_b)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * X_b.size(0)
        n += X_b.size(0)
    return total_loss / n if n else 0.0


def evaluate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> tuple[float, float]:
    """Return (average loss, accuracy)."""
    model.eval()
    total_loss = 0.0
    correct = 0
    n = 0
    with torch.no_grad():
        for X_b, y_b in loader:
            X_b, y_b = X_b.to(device), y_b.to(device)
            logits = model(X_b)
            loss = criterion(logits, y_b)
            total_loss += loss.item() * X_b.size(0)
            pred = logits.argmax(dim=1)
            correct += (pred == y_b).sum().item()
            n += X_b.size(0)
    acc = correct / n if n else 0.0
    avg_loss = total_loss / n if n else 0.0
    return avg_loss, acc


def main() -> None:
    parser = argparse.ArgumentParser(description="Train roadmap difficulty model")
    parser.add_argument("--samples", type=int, default=2000)
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out-dir", type=str, default=None)
    args = parser.parse_args()

    out_dir = args.out_dir or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(out_dir, exist_ok=True)

    device = get_device()
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    X, y = generate_synthetic_dataset(n_samples=args.samples, seed=args.seed)
    train_loader, val_loader, scaler_mean, scaler_scale = build_dataloaders(
        X, y, batch_size=args.batch_size, seed=args.seed, device=device
    )

    model = RoadmapDifficultyModel().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)

    best_val_acc = 0.0
    for epoch in range(1, args.epochs + 1):
        train_loss = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
        if epoch % 10 == 0 or epoch == 1:
            print(
                f"Epoch {epoch}: train_loss={train_loss:.4f} val_loss={val_loss:.4f} val_acc={val_acc:.4f}"
            )

    model_path = os.path.join(out_dir, "roadmap_model.pt")
    scaler_path = os.path.join(out_dir, "scaler.pt")
    scaler_meta_path = os.path.join(out_dir, "scaler_meta.json")

    torch.save(
        {
            "model_state_dict": model.cpu().state_dict(),
            "model_config": {},
        },
        model_path,
    )
    torch.save(
        {"mean": scaler_mean, "scale": scaler_scale},
        scaler_path,
    )
    with open(scaler_meta_path, "w") as f:
        json.dump(
            {"mean": scaler_mean.tolist(), "scale": scaler_scale.tolist()},
            f,
            indent=2,
        )

    print(f"Model saved to {model_path}")
    print(f"Scaler saved to {scaler_path}")
    print(f"Best validation accuracy: {best_val_acc:.4f}")


if __name__ == "__main__":
    main()

import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
import joblib

np.random.seed(42)

X = []
y = []

# -------------------------
# Generate Synthetic Dataset
# -------------------------

for _ in range(1000):
    engagement = np.random.randint(0, 100)
    velocity = np.random.randint(0, 100)
    mastery = np.random.randint(0, 100)
    credibility = np.random.randint(0, 100)
    experience = np.random.randint(0, 3)

    score = (
        0.3 * engagement +
        0.25 * velocity +
        0.25 * mastery +
        0.1 * credibility +
        0.1 * (experience * 30)
    )

    if score < 40:
        difficulty = 0
    elif score < 70:
        difficulty = 1
    else:
        difficulty = 2

    X.append([engagement, velocity, mastery, credibility, experience])
    y.append(difficulty)

X = np.array(X)
y = np.array(y)

# -------------------------
# SCALE DATA
# -------------------------

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# -------------------------
# Train Neural Network
# -------------------------

model = MLPClassifier(
    hidden_layer_sizes=(16, 8),
    max_iter=500,
    random_state=42
)

model.fit(X_scaled, y)

# -------------------------
# Save Model + Scaler
# -------------------------

joblib.dump(model, "roadmap_model.pkl")
joblib.dump(scaler, "scaler.pkl")

print("Model and scaler saved successfully!")

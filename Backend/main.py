import os
import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and scaler safely
BASE_DIR = os.path.dirname(__file__)

model = joblib.load(os.path.join(BASE_DIR, "roadmap_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.pkl"))

class Metrics(BaseModel):
    engagement: float
    velocity: float
    mastery: float
    credibility: float
    experience: float

@app.post("/predict")
def predict_difficulty(metrics: Metrics):
    input_data = np.array([[ 
        metrics.engagement,
        metrics.velocity,
        metrics.mastery,
        metrics.credibility,
        metrics.experience
    ]])

    input_scaled = scaler.transform(input_data)

    prediction = model.predict(input_scaled)

    return {
        "difficulty_level": int(prediction[0])
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
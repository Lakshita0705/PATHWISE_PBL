export const getDifficulty = async (metrics: any) => {
  const response = await fetch("http://localhost:8000/predict-difficulty", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metrics)
  });

  const data = await response.json();
  return data.difficulty;
};

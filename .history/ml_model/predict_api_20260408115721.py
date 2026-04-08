from flask import Flask, request, jsonify
import joblib
import numpy as np
from flask_cors import CORS
import os

app = Flask(__name__)   
CORS(app, resources=)             

# Function to load model
def load_model():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(BASE_DIR, "risk_model.pkl")
    return joblib.load(model_path)


@app.route("/")
def home():
    return "ML API running "


@app.route("/predict", methods=["POST"])
def predict():
    try:

        model = load_model()
        data = request.json

        features = np.array([[ 
            data["new_device"],
            data["new_location"],
            data["odd_time"],
            data["https_status"]
        ]])

        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]

        confidence = max(probabilities)

        if prediction == 0:
            risk_score = (1 - confidence) * 30
        elif prediction == 1:
            risk_score = 40 + (1 - confidence) * 30
        else:
            risk_score = 70 + confidence * 30

        risk_map = {
            0: "LOW",
            1: "MEDIUM",
            2: "HIGH"
        }

        return jsonify({
            "risk_level": risk_map[prediction],
            "risk_score": round(risk_score, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
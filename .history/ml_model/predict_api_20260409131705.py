from flask import Flask, request, jsonify
import joblib
import numpy as np
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")

model = None
last_loaded_time = 0


def load_model_if_updated():
    global model, last_loaded_time

    current_time = os.path.getmtime(MODEL_PATH)

    if model is None or current_time != last_loaded_time:
        print("🔄 Reloading updated model...")
        model = joblib.load(MODEL_PATH)
        last_loaded_time = current_time


@app.route("/")
def home():
    return "ML API running "


@app.route("/predict", methods=["POST"])
def predict():
    try:
        load_model_if_updated() 

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
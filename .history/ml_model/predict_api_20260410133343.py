from flask import Flask, request, jsonify
import joblib
import numpy as np
from flask_cors import CORS
import os
import re

app = Flask(__name__)
CORS(app)

# ===============================
# LOAD MODEL
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "risk_model.pkl")

if not os.path.exists(MODEL_PATH):
    print("❌ Model not found")
    model = None
else:
    print("✅ Model loaded")
    model = joblib.load(MODEL_PATH)


@app.route("/")
def home():
    return "ML API running "


# ===============================
# FEATURE EXTRACTION
# ===============================
def extract_features(url):
    return [
        len(url),
        1 if re.search(r"\d+\.\d+\.\d+\.\d+", url) else 0,
        1 if url.startswith("http://") else 0,
        url.count("."),
        1 if "-" in url else 0,
        1 if any(word in url.lower() for word in ["login","verify","secure","bank","account"]) else 0
    ]


# ===============================
# PREDICT
# ===============================
@app.route("/predict", methods=["POST"])
def predict():
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"})

        data = request.json
        url = data.get("url", "")

        if not url:
            return jsonify({"error": "URL required"})

        features = np.array([extract_features(url)])

        prediction = model.predict(features)[0]
        probability = model.predict_proba(features)[0]

        confidence = max(probability)

        # Convert binary → risk
        if prediction == 0:
            risk_level = "LOW"
            risk_score = (1 - confidence) * 30
        else:
            risk_level = "HIGH"
            risk_score = 70 + confidence * 30

        return jsonify({
            "risk_level": risk_level,
            "risk_score": round(risk_score, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
from flask import Flask, request, jsonify
import joblib
import numpy as np
from flask_cors import CORS
import os
import re
import threading
import subprocess
import time

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "risk_model.pkl")
TRAIN_SCRIPT = os.path.join(BASE_DIR, "train_model.py")

model = None
last_loaded_time = 0


# ===============================
# AUTO TRAIN THREAD
# ===============================
def auto_train():
    while True:
        print("🔁 Auto training running...")
        subprocess.run(["python", TRAIN_SCRIPT])
        time.sleep(60)


# ===============================
# LOAD MODEL SAFE
# ===============================
def load_model_if_updated():
    global model, last_loaded_time

    if not os.path.exists(MODEL_PATH):
        print("⚠ Model not found yet...")
        return

    current_time = os.path.getmtime(MODEL_PATH)

    if model is None or current_time != last_loaded_time:
        print("🔄 Reloading model...")
        model = joblib.load(MODEL_PATH)
        last_loaded_time = current_time


@app.route("/")
def home():
    return "ML API running 🚀"


@app.route("/predict", methods=["POST"])
def predict():
    try:
        load_model_if_updated()

        if model is None:
            return jsonify({"error": "Model not ready yet"})

        data = request.json
        url = data.get("url", "")

        https_status = data["https_status"]
        is_http = 1 if url.startswith("http://") else 0
        url_length = len(url)
        has_ip = 1 if re.search(r"\d+\.\d+\.\d+\.\d+", url) else 0
        suspicious = 1 if any(word in url.lower() for word in ["login","bank","verify","secure"]) else 0

        features = np.array([[ 
            data["new_device"],
            data["new_location"],
            data["odd_time"],
            https_status,
            is_http,
            url_length,
            has_ip,
            suspicious
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
    threading.Thread(target=auto_train, daemon=True).start()
    app.run(host="0.0.0.0", port=10000)
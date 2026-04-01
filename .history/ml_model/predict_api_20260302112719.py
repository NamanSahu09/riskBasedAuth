from flask import Flask, request, jsonify
import joblib
import numpy as np
app = Flask(__name__)

model = joblib.load("risk_model.pkl")

@app.route("/predict",methods = ["POST"])

def predict():
  data = request.json
  features = np.array([[data["new_device"], data["new_location"], data["odd_time"], data["https_status"]]])

  prediction = model.predict(features)[0]

  risk_map = 
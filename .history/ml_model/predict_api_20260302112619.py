from flask import Flask, request, jsonify
import joblib
import numpy as np
app = Flask(__name__)

model = joblib.load("risk_model.pkl")

@app.route("/predict",methods = [])
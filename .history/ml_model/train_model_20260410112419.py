import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib
import os

print("🚀 Training started...")

# ===============================
# LOAD DATA FROM CSV (CLOUD SAFE)
# ===============================
try:
    DATA_URL = "https://riskauth.infinityfreeapp.com/backend/public/exportcsv.php"
    df = pd.read_csv(DATA_URL)

    print("✅ Dataset Loaded")
    print(df.head())

except Exception as e:
    print("❌ Failed to load dataset:", e)
    exit()

# ===============================
# CHECK DATA
# ===============================
if df.empty or len(df) < 5:
    print("⚠ Not enough data to train")
    exit()

# ===============================
# LABEL ENCODING
# ===============================
df["risk_level"] = df["risk_level"].map({
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2
})

# Remove null values
df = df.dropna()

# ===============================
# FEATURE ENGINEERING
# ===============================

# HTTP → risky
df["is_http"] = df["https_status"].apply(lambda x: 1 if x == 0 else 0)

# Since URL not stored in DB → default values
df["url_length"] = 50
df["has_ip"] = 0
df["suspicious"] = 0

# ===============================
# FEATURES + LABEL
# ===============================
X = df[[
    "new_device",
    "new_location",
    "odd_time",
    "https_status",
    "is_http",
    "url_length",
    "has_ip",
    "suspicious"
]]

y = df["risk_level"]

# ===============================
# TRAIN MODEL
# ===============================
model = DecisionTreeClassifier()
model.fit(X, y)

print("🔥 Model trained successfully")

# ===============================
# SAVE MODEL (VERY IMPORTANT FIX)
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "risk_model.pkl")

joblib.dump(model, MODEL_PATH)

print("✅ Model saved at:", MODEL_PATH)
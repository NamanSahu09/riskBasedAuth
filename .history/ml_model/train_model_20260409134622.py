import pandas as pd
import mysql.connector
from sklearn.tree import DecisionTreeClassifier
import joblib
import re

# ===============================
# DATABASE CONNECTION (CLOUD)
# ===============================
db = mysql.connector.connect(
    host="sql100.byetcluster.com",
    user="if0_41559408",
    password="NamanSahu2003",
    database="if0_41559408_risk_auth"
)

query = """
SELECT new_device, new_location, odd_time, https_status, risk_level
FROM login_history
WHERE risk_level IS NOT NULL
"""

df = pd.read_sql(query, db)

if len(df) < 10:
    print("⚠ Not enough data to train")
    exit()

print("✅ Dataset Loaded")

# ===============================
# LABEL ENCODING
# ===============================
df["risk_level"] = df["risk_level"].map({
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2
})

# ===============================
# FEATURE ENGINEERING
# ===============================

# HTTP → risky
df["is_http"] = df["https_status"].apply(lambda x: 1 if x == 0 else 0)

# dummy values (no URL in DB yet)
df["url_length"] = 50
df["has_ip"] = 0
df["suspicious"] = 0

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

# ===============================
# SAVE MODEL
# ===============================
joblib.dump(model, "risk_model.pkl")

print("🔥 Model Updated Successfully")
import pandas as pd
import mysql.connector
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
import joblib

# ===============================
# DATABASE CONNECTION
# ===============================

db = mysql.connector.connect(
    host="127.0.0.1",
    user="root",
    password="",
    database="riskBasedAuth",
    port=3306
)

query = """
SELECT
    new_device,
    new_location,
    odd_time,
    https_status,
    risk_level
FROM login_history
WHERE risk_level IS NOT NULL
"""

df = pd.read_sql(query, db)

print("Dataset loaded from database")
print(df.head())

# ===============================
# DATA PREPARATION
# ===============================

df["risk_level"] = df["risk_level"].map({
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2
})

X = df[["new_device","new_location","odd_time","https_status"]]
y = df["risk_level"]

# ===============================
# TRAIN MODEL
# ===============================

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = DecisionTreeClassifier()
model.fit(X_train, y_train)

print("Model trained successfully")

# ===============================
# SAVE MODEL
# ===============================

joblib.dump(model, "risk_model.pkl")

print("Model saved as risk_model.pkl")
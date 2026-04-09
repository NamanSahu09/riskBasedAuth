import pandas as pd
import mysql.connector
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
import joblib

# DB CONNECT
db = mysql.connector.connect(
    user="root",
    password="",
    database="riskauth_db",
    unix_socket="/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"
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

# MAP LABEL
df["risk_level"] = df["risk_level"].map({
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2
})

X = df[["new_device","new_location","odd_time","https_status"]]
y = df["risk_level"]

# TRAIN
model = DecisionTreeClassifier()
model.fit(X, y)

# SAVE (overwrite)
joblib.dump(model, "risk_model.pkl")

print("✅ Model updated")
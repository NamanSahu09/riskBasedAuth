import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# Load dataset
df = pd.read_csv("login_history_dataset.csv")

# Convert risk_level to numeric
df["risk_level"] = df["risk_level"].map({
    "LOW": 0,
    "MEDIUM": 1,
    "HIGH": 2
})

# Features and target
X = df[["new_device", "new_location", "odd_time", "https_status"]]
y = df["risk_level"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = DecisionTreeClassifier()
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, "risk_model.pkl")

print("Model trained and saved as risk_model.pkl")
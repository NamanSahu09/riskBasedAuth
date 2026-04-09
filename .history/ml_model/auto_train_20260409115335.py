import time
import subprocess

while True:
    print("🔁 Training model...")

    try:
        subprocess.run(["python", "train_model.py"], check=True)
        print("✅ Training complete")

    except Exception as e:
        print("❌ Training failed:", e)

    print(" Waiting 15 seconds...\n")
    time.sleep(30)
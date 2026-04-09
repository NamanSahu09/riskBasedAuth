import time
import subprocess

while True:
    print("🔁 Auto Training Started...")

    try:
        subprocess.run(["python", "ml_model/train_model.py"], check=True)
        print("✅ Training Done")

    except Exception as e:
        print("❌ Error:", e)

    print(" Waiting 15 seconds...\n")
    time.sleep(30)
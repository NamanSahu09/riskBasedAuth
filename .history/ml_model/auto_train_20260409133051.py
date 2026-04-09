import threading
import time
import subprocess

def auto_train():
    while True:
        print("🔁 Auto training...")
        subprocess.run(["python", "ml_model/train_model.py"])
        time.sleep(60)

# start background thread
threading.Thread(target=auto_train, daemon=True).start()
import time
import subprocess

while True:
    print("Training model...")
    
    subprocess.run(["python", "train_model.py"])
    
    print("Training complete. Waiting 60 seconds...\n")
    
    time.sleep(10)
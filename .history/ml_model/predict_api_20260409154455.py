BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAIN_SCRIPT = os.path.join(BASE_DIR, "train_model.py")

subprocess.run(["python", TRAIN_SCRIPT])
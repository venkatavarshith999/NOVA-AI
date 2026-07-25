import os
import subprocess
import sys

def main():
    port = os.getenv("PORT", "8000")
    print(f"Starting uvicorn on port {port}")
    
    # We add the root directory to the python path so backend.main can be found
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # We change directory to backend so relative paths (like database.db) work
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    os.chdir(backend_dir)
    
    # Run uvicorn natively
    subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", port])

if __name__ == "__main__":
    main()

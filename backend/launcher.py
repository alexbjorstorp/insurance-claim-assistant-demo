"""
Entry point for the packaged demo .exe.
Sets demo environment variables, starts the uvicorn server,
then opens the browser once the server is ready.
"""
import os
import sys
import time
import threading
import webbrowser
import socket

# ── Environment setup (must happen before any app imports) ──────────────────
if getattr(sys, "frozen", False):
    exe_dir = os.path.dirname(sys.executable)
    os.environ.setdefault("DATABASE_URL", f"sqlite:///{os.path.join(exe_dir, 'insurance_claims.db')}")

os.environ.setdefault("DEMO_MODE", "true")
os.environ.setdefault("SECRET_KEY", "demo-secret-key-for-presentation-only")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:8000")
os.environ.setdefault("ENVIRONMENT", "demo")

HOST = "127.0.0.1"
PORT = 8000
URL = f"http://{HOST}:{PORT}"


def _wait_and_open_browser():
    """Poll until the server accepts connections, then open the browser."""
    for _ in range(30):
        try:
            with socket.create_connection((HOST, PORT), timeout=1):
                break
        except OSError:
            time.sleep(0.5)
    webbrowser.open(URL)


if __name__ == "__main__":
    try:
        threading.Thread(target=_wait_and_open_browser, daemon=True).start()

        from app.main import app
        import uvicorn
        uvicorn.run(app, host=HOST, port=PORT, log_level="warning")
    except Exception as e:
        import traceback
        print("\n--- ERROR ---")
        traceback.print_exc()
        print("\nPress Enter to close...")
        input()

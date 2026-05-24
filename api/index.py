"""
Vercel Python serverless entry point.

Vercel auto-detects file `api/*.py` sebagai serverless function. File ini
mengimpor objek `app` (FastAPI/ASGI) dari paket backend; Vercel akan
mengeksekusi-nya untuk setiap request yang ter-route ke `/api/*`.

Path: project_root/api/index.py
      project_root/backend/app/main.py  <-- aktual FastAPI
"""
import sys
from pathlib import Path

# Tambahkan project root agar `backend.app.main` dapat di-import.
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.app.main import app  # noqa: E402  (re-exported untuk Vercel)

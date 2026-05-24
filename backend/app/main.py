"""
Sistem Informasi Rute Angkutan Umum Pekanbaru (Trans Metro Pekanbaru)
Backend REST API - FastAPI + PostGIS

Kelompok 1 SIG ITERA 2026:
- Febrian Valentino Nugroho   123140034
- Anselmus Herpin Hasugian    123140020
- Adi Septriansyah            123140021
- Jonathan Nicholaus D.S.     123140153
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import halte, koridor, armada

app = FastAPI(
    title="WebGIS Trans Metro Pekanbaru API",
    description=(
        "REST API spasial untuk Sistem Informasi Rute Angkutan Umum Pekanbaru. "
        "Menyediakan CRUD halte, koridor, armada serta query spasial "
        "ST_DWithin / ST_Distance pada PostGIS."
    ),
    version="1.0.0",
    openapi_tags=[
        {"name": "Halte",   "description": "CRUD halte & pencarian radius (ST_DWithin)"},
        {"name": "Koridor", "description": "CRUD koridor trayek (LineString) & GeoJSON"},
        {"name": "Armada",  "description": "CRUD armada bus TMP & statistik operasional"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(halte.router)
app.include_router(koridor.router)
app.include_router(armada.router)


@app.get("/", tags=["Meta"])
def root():
    return {
        "app":  "WebGIS Trans Metro Pekanbaru",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/health", tags=["Meta"])
def health():
    return {"status": "ok"}

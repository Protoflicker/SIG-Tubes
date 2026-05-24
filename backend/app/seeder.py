"""
Auto-seed PostGIS dari berkas GeoJSON di backend/data/.

Strategi rute (HANDLE OSM FRAGMENTED):
  Satu koridor rute biasanya tersebar di puluhan/ratusan fitur LineString
  yang terpotong-potong (hasil ekstrak OpenStreetMap). Seeder ini:

    1.  Membaca semua fitur dari rute.geojson.
    2.  MENGELOMPOKKAN fitur berdasarkan properti `kode_trayek`
        (atau fallback `name`/`ref`/`@id`) menjadi satu grup per koridor.
    3.  Untuk tiap grup, mengirim semua geometri LineString ke PostgreSQL
        sebagai jsonb array, lalu DI-DATABASE-LEVEL menjahit segmen
        melalui:

            ST_Multi(
              ST_LineMerge(
                ST_Collect(
                  ST_SetSRID(ST_GeomFromGeoJSON(elem::text), 4326)
                )
              )
            )

        - `ST_Collect`  : kumpulkan segmen jadi geometry collection
        - `ST_LineMerge`: jahit segmen yang ujung-ujungnya bertemu
        - `ST_Multi`    : pastikan hasil akhir bertipe MultiLineString
                          (single row per koridor)

    4.  Hasilnya: SATU baris MultiLineString utuh per kode trayek.

Strategi halte: insert standar `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)`.

Idempoten: hanya seed bila tabel kosong.
"""
from __future__ import annotations

import json
import logging
import re
import time
import urllib.error
import urllib.request
from collections import OrderedDict
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import SessionLocal

logger = logging.getLogger("seeder")

DATA_DIR    = Path(__file__).resolve().parent.parent / "data"
RUTE_FILE   = DATA_DIR / "rute.geojson"
HALTE_FILE  = DATA_DIR / "halte.geojson"

OSRM_BASE   = "https://router.project-osrm.org/route/v1/driving"

# Palette default bila feature tidak punya warna_peta
COLOR_PALETTE = [
    "#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA",
    "#00ACC1", "#6D4C41", "#7CB342", "#3949AB", "#F4511E",
    "#00897B", "#5E35B1", "#039BE5", "#D81B60", "#C0CA33",
]


# ===========================================================================
# Helpers
# ===========================================================================
def _load_geojson(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        logger.warning("Berkas GeoJSON tidak ditemukan: %s", path)
        return []
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    return data.get("features", [])


def _slug(s: str, maxlen: int = 10) -> str:
    """Sanitasi string jadi kode pendek (a-z0-9 + underscore)."""
    s = re.sub(r"[^A-Za-z0-9]+", "_", str(s)).strip("_").upper()
    return s[:maxlen] or "RUTE"


def _grouping_key(props: dict) -> str | None:
    """Cari properti grup; prioritas kode_trayek → ref → name → @id."""
    for k in ("kode_trayek", "ref", "name", "@id"):
        v = props.get(k)
        if v:
            return str(v)
    return None


def osrm_snap_to_road(coordinates: list[list[float]], timeout: int = 25) -> dict | None:
    """OSRM public API: snap urutan waypoint ke jalan raya valid."""
    if len(coordinates) < 2:
        return None
    coord_str = ";".join(f"{lng},{lat}" for lng, lat in coordinates)
    url = f"{OSRM_BASE}/{coord_str}?overview=full&geometries=geojson"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "WebGIS-TMP-Pekanbaru/3.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if not data.get("routes"):
            return None
        return data["routes"][0]["geometry"]
    except (urllib.error.URLError, Exception) as e:
        logger.warning("OSRM exception: %s", e)
        return None


# ===========================================================================
# Rute seeding — fragmented merge
# ===========================================================================
def _seed_rute(db: Session) -> int:
    count = db.execute(text("SELECT COUNT(*) FROM rute_trayek")).scalar()
    if count and count > 0:
        logger.info("rute_trayek sudah berisi %s baris — skip seeding rute.", count)
        return 0

    features = _load_geojson(RUTE_FILE)
    if not features:
        return 0

    # ----------- GROUP fitur per kode trayek -----------
    groups: dict[str, dict] = OrderedDict()
    skipped = 0
    for feat in features:
        props = feat.get("properties", {}) or {}
        geom  = feat.get("geometry")
        if not geom:
            skipped += 1
            continue
        gtype = geom.get("type")
        if gtype not in ("LineString", "MultiLineString"):
            skipped += 1
            continue

        key = _grouping_key(props)
        if not key:
            skipped += 1
            continue

        if key not in groups:
            groups[key] = {"props": dict(props), "geometries": []}
        else:
            # merge property baru ke yang sudah ada (first-non-null win)
            for k, v in props.items():
                if v and not groups[key]["props"].get(k):
                    groups[key]["props"][k] = v

        groups[key]["geometries"].append(geom)

    logger.info("Group rute: %d kode trayek dari %d fitur (skip %d)",
                len(groups), len(features), skipped)

    inserted = 0
    for idx, (key, info) in enumerate(groups.items()):
        props = info["props"]
        geoms = info["geometries"]

        kode  = props.get("kode_trayek") or _slug(key)
        nama  = props.get("nama_trayek") or props.get("name") or props.get("ref") or kode
        awal  = props.get("titik_awal")
        akhir = props.get("titik_akhir")
        warna = props.get("warna_peta") or COLOR_PALETTE[idx % len(COLOR_PALETTE)]

        # Kirim list geometri sebagai jsonb array; gabungkan di sisi PostGIS
        geoms_json = json.dumps(geoms)

        logger.info("[%d/%d] Menjahit %s (%d segmen)...",
                    idx + 1, len(groups), kode, len(geoms))

        try:
            db.execute(text("""
                INSERT INTO rute_trayek
                    (kode_trayek, nama_trayek, titik_awal, titik_akhir,
                     warna_peta, geometri_jalur)
                SELECT
                    :kode, :nama, :awal, :akhir, :warna, merged_geom
                FROM (
                    SELECT ST_Multi(
                              ST_LineMerge(
                                ST_Collect(
                                  ST_SetSRID(ST_GeomFromGeoJSON(elem::text), 4326)
                                )
                              )
                           ) AS merged_geom
                    FROM jsonb_array_elements(CAST(:geoms AS jsonb)) AS elem
                ) sub
                ON CONFLICT (kode_trayek) DO NOTHING
            """), {
                "kode":  kode[:10],
                "nama":  nama[:150],
                "awal":  awal,
                "akhir": akhir,
                "warna": warna,
                "geoms": geoms_json,
            })
            inserted += 1
        except Exception as exc:
            db.rollback()
            logger.warning("Gagal insert rute %s: %s", kode, exc)
            continue

    # Hitung panjang aktual (km) dari geometri tergabung
    db.execute(text("""
        UPDATE rute_trayek
        SET    panjang_km = ROUND((ST_Length(geometri_jalur::geography)/1000.0)::numeric, 2)
        WHERE  panjang_km IS NULL
    """))
    db.commit()
    logger.info("Seeder rute: %s baris dimasukkan.", inserted)
    return inserted


# ===========================================================================
# Halte seeding — standard point insert
# ===========================================================================
def _seed_halte(db: Session) -> int:
    count = db.execute(text("SELECT COUNT(*) FROM halte_infrastruktur")).scalar()
    if count and count > 0:
        logger.info("halte_infrastruktur sudah berisi %s baris — skip seeding halte.", count)
        return 0

    features = _load_geojson(HALTE_FILE)
    if not features:
        return 0

    inserted = 0
    for feat in features:
        props = feat.get("properties", {}) or {}
        geom  = feat.get("geometry")
        if not geom or geom.get("type") != "Point":
            continue

        coords = geom.get("coordinates", [])
        if len(coords) < 2:
            continue
        lng, lat = coords[0], coords[1]

        # Map kode_trayek → id_rute (FK)
        kode = props.get("kode_trayek")
        id_rute = None
        if kode:
            id_rute = db.execute(text(
                "SELECT id_rute FROM rute_trayek WHERE kode_trayek = :k"
            ), {"k": kode}).scalar()

        # Normalisasi nilai kondisi lama → baru
        kondisi = props.get("kondisi_fisik", "Beroperasi")
        if kondisi in ("Baik",):
            kondisi = "Beroperasi"
        elif kondisi in ("Rusak", "Terbengkalai"):
            kondisi = "Tidak Beroperasi"

        db.execute(text("""
            INSERT INTO halte_infrastruktur
                (id_rute_pelintas, nama_halte, nama_jalan, kondisi_fisik,
                 keterangan, koordinat_titik)
            VALUES
                (:id_rute, :nama, :jalan, :kondisi, :keterangan,
                 ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
        """), {
            "id_rute":    id_rute,
            "nama":       props.get("nama_halte", "Halte"),
            "jalan":      props.get("nama_jalan"),
            "kondisi":    kondisi,
            "keterangan": props.get("keterangan"),
            "lng":        lng,
            "lat":        lat,
        })
        inserted += 1

    db.commit()
    logger.info("Seeder halte: %s baris dimasukkan.", inserted)
    return inserted


# ===========================================================================
# Entry points
# ===========================================================================
def run_seeders() -> dict[str, int]:
    db: Session = SessionLocal()
    try:
        n_rute  = _seed_rute(db)
        n_halte = _seed_halte(db)
        return {"rute": n_rute, "halte": n_halte}
    except Exception as exc:
        db.rollback()
        logger.exception("Seeder gagal: %s", exc)
        return {"error": str(exc)}
    finally:
        db.close()


def reseed_all() -> dict[str, int]:
    db: Session = SessionLocal()
    try:
        logger.info("RESEED: TRUNCATE halte_infrastruktur, rute_trayek...")
        db.execute(text("TRUNCATE halte_infrastruktur, rute_trayek RESTART IDENTITY CASCADE"))
        db.commit()
    finally:
        db.close()
    return run_seeders()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    print("Reseed:", reseed_all())

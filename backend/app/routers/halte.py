"""Endpoints CRUD + query spasial untuk entitas Halte."""
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import (
    HalteCreate, HalteUpdate, HalteOut, HalteRadiusOut, FeatureCollection,
)

router = APIRouter(prefix="/api/v1/halte", tags=["Halte"])


def _row_to_halte_out(row) -> dict:
    return {
        "id_halte":            row.id_halte,
        "id_koridor_pelintas": row.id_koridor_pelintas,
        "nama_halte":          row.nama_halte,
        "nama_jalan":          row.nama_jalan,
        "kondisi_fisik":       row.kondisi_fisik,
        "keterangan":          row.keterangan,
        "latitude":            float(row.lat),
        "longitude":           float(row.lng),
        "kode_trayek":         row.kode_trayek,
        "nama_trayek":         row.nama_trayek,
        "warna_peta":          row.warna_peta,
    }


@router.get("", response_model=List[HalteOut], summary="Daftar seluruh halte")
def list_halte(
    db: Session = Depends(get_db),
    kondisi: Optional[str] = Query(None, description="Filter kondisi: Baik / Rusak / Terbengkalai"),
    id_koridor: Optional[int] = Query(None, description="Filter berdasarkan id koridor"),
):
    sql = """
        SELECT  h.id_halte, h.id_koridor_pelintas, h.nama_halte, h.nama_jalan,
                h.kondisi_fisik, h.keterangan,
                ST_Y(h.koordinat_titik) AS lat,
                ST_X(h.koordinat_titik) AS lng,
                k.kode_trayek, k.nama_trayek, k.warna_peta
        FROM    halte_infrastruktur h
        LEFT JOIN koridor_trayek k ON h.id_koridor_pelintas = k.id_koridor
        WHERE   (:kondisi    IS NULL OR h.kondisi_fisik::text = :kondisi)
          AND   (:id_koridor IS NULL OR h.id_koridor_pelintas = :id_koridor)
        ORDER BY h.id_halte
    """
    rows = db.execute(text(sql), {"kondisi": kondisi, "id_koridor": id_koridor}).fetchall()
    return [_row_to_halte_out(r) for r in rows]


@router.get(
    "/radius",
    response_model=List[HalteRadiusOut],
    summary="Halte dalam radius (ST_DWithin)",
    description=(
        "Mencari halte terdekat dari titik (lat, lng) dalam radius tertentu meter "
        "menggunakan PostGIS ST_DWithin pada geography. "
        "Hasil diurutkan dari jarak terdekat."
    ),
)
def halte_radius(
    db: Session = Depends(get_db),
    lat:    float = Query(..., description="Latitude posisi pengguna",  ge=-90,  le=90),
    lng:    float = Query(..., description="Longitude posisi pengguna", ge=-180, le=180),
    radius: int   = Query(500, description="Radius pencarian dalam meter", ge=10, le=20000),
    limit:  int   = Query(20,  description="Maksimum hasil",               ge=1,  le=100),
):
    sql = """
        SELECT  h.id_halte, h.id_koridor_pelintas, h.nama_halte, h.nama_jalan,
                h.kondisi_fisik, h.keterangan,
                ST_Y(h.koordinat_titik) AS lat,
                ST_X(h.koordinat_titik) AS lng,
                k.kode_trayek, k.nama_trayek, k.warna_peta,
                ST_Distance(
                    h.koordinat_titik::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
                ) AS jarak_meter
        FROM    halte_infrastruktur h
        LEFT JOIN koridor_trayek k ON h.id_koridor_pelintas = k.id_koridor
        WHERE   ST_DWithin(
                    h.koordinat_titik::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :radius
                )
        ORDER BY jarak_meter ASC
        LIMIT   :limit
    """
    rows = db.execute(text(sql), {"lat": lat, "lng": lng, "radius": radius, "limit": limit}).fetchall()
    return [{**_row_to_halte_out(r), "jarak_meter": round(float(r.jarak_meter), 2)} for r in rows]


@router.get(
    "/geojson",
    response_model=FeatureCollection,
    summary="Halte format GeoJSON FeatureCollection",
)
def halte_geojson(
    db: Session = Depends(get_db),
    kondisi: Optional[str] = Query(None),
    id_koridor: Optional[int] = Query(None),
):
    sql = """
        SELECT  json_build_object(
                    'type',       'FeatureCollection',
                    'features',   COALESCE(json_agg(feat), '[]'::json)
                ) AS fc
        FROM (
            SELECT  json_build_object(
                        'type',       'Feature',
                        'id',         h.id_halte,
                        'geometry',   ST_AsGeoJSON(h.koordinat_titik)::json,
                        'properties', json_build_object(
                            'id_halte',            h.id_halte,
                            'id_koridor_pelintas', h.id_koridor_pelintas,
                            'nama_halte',          h.nama_halte,
                            'nama_jalan',          h.nama_jalan,
                            'kondisi_fisik',       h.kondisi_fisik,
                            'keterangan',          h.keterangan,
                            'kode_trayek',         k.kode_trayek,
                            'nama_trayek',         k.nama_trayek,
                            'warna_peta',          k.warna_peta
                        )
                    ) AS feat
            FROM    halte_infrastruktur h
            LEFT JOIN koridor_trayek k ON h.id_koridor_pelintas = k.id_koridor
            WHERE   (:kondisi    IS NULL OR h.kondisi_fisik::text = :kondisi)
              AND   (:id_koridor IS NULL OR h.id_koridor_pelintas = :id_koridor)
        ) sub
    """
    fc = db.execute(text(sql), {"kondisi": kondisi, "id_koridor": id_koridor}).scalar()
    return fc


@router.get("/{id_halte}", response_model=HalteOut)
def get_halte(id_halte: int, db: Session = Depends(get_db)):
    sql = """
        SELECT  h.id_halte, h.id_koridor_pelintas, h.nama_halte, h.nama_jalan,
                h.kondisi_fisik, h.keterangan,
                ST_Y(h.koordinat_titik) AS lat,
                ST_X(h.koordinat_titik) AS lng,
                k.kode_trayek, k.nama_trayek, k.warna_peta
        FROM    halte_infrastruktur h
        LEFT JOIN koridor_trayek k ON h.id_koridor_pelintas = k.id_koridor
        WHERE   h.id_halte = :id
    """
    row = db.execute(text(sql), {"id": id_halte}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Halte tidak ditemukan")
    return _row_to_halte_out(row)


@router.post("", response_model=HalteOut, status_code=201, summary="Tambah halte baru")
def create_halte(payload: HalteCreate, db: Session = Depends(get_db)):
    sql_insert = """
        INSERT INTO halte_infrastruktur
            (id_koridor_pelintas, nama_halte, nama_jalan, kondisi_fisik, keterangan, koordinat_titik)
        VALUES
            (:id_koridor, :nama, :jalan, :kondisi, :keterangan,
             ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
        RETURNING id_halte
    """
    try:
        new_id = db.execute(text(sql_insert), {
            "id_koridor":  payload.id_koridor_pelintas,
            "nama":        payload.nama_halte,
            "jalan":       payload.nama_jalan,
            "kondisi":     payload.kondisi_fisik,
            "keterangan":  payload.keterangan,
            "lng":         payload.longitude,
            "lat":         payload.latitude,
        }).scalar()
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal insert halte: {exc}") from exc
    return get_halte(new_id, db)


@router.put("/{id_halte}", response_model=HalteOut, summary="Perbarui halte")
def update_halte(id_halte: int, payload: HalteUpdate, db: Session = Depends(get_db)):
    exists = db.execute(
        text("SELECT 1 FROM halte_infrastruktur WHERE id_halte = :id"),
        {"id": id_halte},
    ).scalar()
    if not exists:
        raise HTTPException(status_code=404, detail="Halte tidak ditemukan")

    sets: list[str] = []
    params: dict = {"id": id_halte}

    field_map = {
        "id_koridor_pelintas": "id_koridor_pelintas",
        "nama_halte":          "nama_halte",
        "nama_jalan":          "nama_jalan",
        "kondisi_fisik":       "kondisi_fisik",
        "keterangan":          "keterangan",
    }
    for attr, col in field_map.items():
        val = getattr(payload, attr)
        if val is not None:
            sets.append(f"{col} = :{attr}")
            params[attr] = val

    if payload.latitude is not None and payload.longitude is not None:
        sets.append("koordinat_titik = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)")
        params["lng"] = payload.longitude
        params["lat"] = payload.latitude
    elif (payload.latitude is None) ^ (payload.longitude is None):
        raise HTTPException(status_code=400, detail="latitude & longitude harus diisi keduanya")

    if not sets:
        raise HTTPException(status_code=400, detail="Tidak ada field yang diperbarui")

    db.execute(text(f"UPDATE halte_infrastruktur SET {', '.join(sets)} WHERE id_halte = :id"), params)
    db.commit()
    return get_halte(id_halte, db)


@router.delete("/{id_halte}", status_code=204, summary="Hapus halte")
def delete_halte(id_halte: int, db: Session = Depends(get_db)):
    result = db.execute(text("DELETE FROM halte_infrastruktur WHERE id_halte = :id"), {"id": id_halte})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Halte tidak ditemukan")
    return None

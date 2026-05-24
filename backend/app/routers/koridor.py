"""Endpoints untuk entitas Koridor Trayek (LineString)."""
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import KoridorCreate, KoridorUpdate, KoridorOut, FeatureCollection

router = APIRouter(prefix="/api/v1/koridor", tags=["Koridor"])


def _row_to_koridor_out(row) -> dict:
    return {
        "id_koridor":  row.id_koridor,
        "kode_trayek": row.kode_trayek,
        "nama_trayek": row.nama_trayek,
        "titik_awal":  row.titik_awal,
        "titik_akhir": row.titik_akhir,
        "warna_peta":  row.warna_peta,
        "panjang_km":  float(row.panjang_km) if row.panjang_km is not None else None,
    }


@router.get("", response_model=List[KoridorOut], summary="Daftar seluruh koridor")
def list_koridor(db: Session = Depends(get_db)):
    rows = db.execute(text(
        "SELECT id_koridor, kode_trayek, nama_trayek, titik_awal, titik_akhir, "
        "warna_peta, panjang_km FROM koridor_trayek ORDER BY kode_trayek"
    )).fetchall()
    return [_row_to_koridor_out(r) for r in rows]


@router.get(
    "/geojson",
    response_model=FeatureCollection,
    summary="Seluruh koridor sebagai GeoJSON FeatureCollection",
)
def all_koridor_geojson(db: Session = Depends(get_db)):
    sql = """
        SELECT  json_build_object(
                    'type',       'FeatureCollection',
                    'features',   COALESCE(json_agg(feat), '[]'::json)
                ) AS fc
        FROM (
            SELECT  json_build_object(
                        'type',       'Feature',
                        'id',         id_koridor,
                        'geometry',   ST_AsGeoJSON(geometri_jalur)::json,
                        'properties', json_build_object(
                            'id_koridor',  id_koridor,
                            'kode_trayek', kode_trayek,
                            'nama_trayek', nama_trayek,
                            'titik_awal',  titik_awal,
                            'titik_akhir', titik_akhir,
                            'warna_peta',  warna_peta,
                            'panjang_km',  panjang_km
                        )
                    ) AS feat
            FROM    koridor_trayek
            ORDER BY kode_trayek
        ) sub
    """
    return db.execute(text(sql)).scalar()


@router.get(
    "/{id_koridor}/geojson",
    response_model=dict,
    summary="GeoJSON Feature untuk satu koridor",
)
def koridor_geojson(id_koridor: int, db: Session = Depends(get_db)):
    sql = """
        SELECT  json_build_object(
                    'type',       'Feature',
                    'id',         id_koridor,
                    'geometry',   ST_AsGeoJSON(geometri_jalur)::json,
                    'properties', json_build_object(
                        'id_koridor',  id_koridor,
                        'kode_trayek', kode_trayek,
                        'nama_trayek', nama_trayek,
                        'titik_awal',  titik_awal,
                        'titik_akhir', titik_akhir,
                        'warna_peta',  warna_peta,
                        'panjang_km',  panjang_km
                    )
                ) AS feature
        FROM    koridor_trayek
        WHERE   id_koridor = :id
    """
    feat = db.execute(text(sql), {"id": id_koridor}).scalar()
    if not feat:
        raise HTTPException(status_code=404, detail="Koridor tidak ditemukan")
    return feat


@router.get(
    "/{id_koridor}/intersect-halte",
    response_model=FeatureCollection,
    summary="Halte yang berada di sekitar jalur koridor (ST_DWithin pada LineString)",
)
def halte_di_sekitar_koridor(
    id_koridor: int,
    buffer_meter: int = 200,
    db: Session = Depends(get_db),
):
    sql = """
        WITH k AS (SELECT geometri_jalur FROM koridor_trayek WHERE id_koridor = :id)
        SELECT  json_build_object(
                    'type',     'FeatureCollection',
                    'features', COALESCE(json_agg(feat), '[]'::json)
                ) AS fc
        FROM (
            SELECT  json_build_object(
                        'type',       'Feature',
                        'id',         h.id_halte,
                        'geometry',   ST_AsGeoJSON(h.koordinat_titik)::json,
                        'properties', json_build_object(
                            'id_halte',      h.id_halte,
                            'nama_halte',    h.nama_halte,
                            'kondisi_fisik', h.kondisi_fisik
                        )
                    ) AS feat
            FROM    halte_infrastruktur h, k
            WHERE   ST_DWithin(h.koordinat_titik::geography, k.geometri_jalur::geography, :buf)
        ) sub
    """
    fc = db.execute(text(sql), {"id": id_koridor, "buf": buffer_meter}).scalar()
    if fc is None:
        raise HTTPException(status_code=404, detail="Koridor tidak ditemukan")
    return fc


@router.post("", response_model=KoridorOut, status_code=201)
def create_koridor(payload: KoridorCreate, db: Session = Depends(get_db)):
    sql = """
        INSERT INTO koridor_trayek
            (kode_trayek, nama_trayek, titik_awal, titik_akhir, warna_peta, geometri_jalur)
        VALUES
            (:kode, :nama, :awal, :akhir, :warna,
             ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326))
        RETURNING id_koridor
    """
    try:
        new_id = db.execute(text(sql), {
            "kode":  payload.kode_trayek,
            "nama":  payload.nama_trayek,
            "awal":  payload.titik_awal,
            "akhir": payload.titik_akhir,
            "warna": payload.warna_peta,
            "geom":  json.dumps(payload.geometri_jalur),
        }).scalar()
        db.execute(text(
            "UPDATE koridor_trayek SET panjang_km = "
            "ROUND((ST_Length(geometri_jalur::geography)/1000.0)::numeric, 2) "
            "WHERE id_koridor = :id"
        ), {"id": new_id})
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal insert koridor: {exc}") from exc

    row = db.execute(text(
        "SELECT id_koridor, kode_trayek, nama_trayek, titik_awal, titik_akhir, "
        "warna_peta, panjang_km FROM koridor_trayek WHERE id_koridor = :id"
    ), {"id": new_id}).fetchone()
    return _row_to_koridor_out(row)


@router.put("/{id_koridor}", response_model=KoridorOut)
def update_koridor(id_koridor: int, payload: KoridorUpdate, db: Session = Depends(get_db)):
    exists = db.execute(text("SELECT 1 FROM koridor_trayek WHERE id_koridor = :id"),
                        {"id": id_koridor}).scalar()
    if not exists:
        raise HTTPException(status_code=404, detail="Koridor tidak ditemukan")

    sets: list[str] = []
    params: dict = {"id": id_koridor}
    for attr in ("nama_trayek", "titik_awal", "titik_akhir", "warna_peta"):
        val = getattr(payload, attr)
        if val is not None:
            sets.append(f"{attr} = :{attr}")
            params[attr] = val
    if payload.geometri_jalur is not None:
        sets.append("geometri_jalur = ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326)")
        params["geom"] = json.dumps(payload.geometri_jalur)

    if not sets:
        raise HTTPException(status_code=400, detail="Tidak ada field yang diperbarui")

    db.execute(text(f"UPDATE koridor_trayek SET {', '.join(sets)} WHERE id_koridor = :id"), params)
    if payload.geometri_jalur is not None:
        db.execute(text(
            "UPDATE koridor_trayek SET panjang_km = "
            "ROUND((ST_Length(geometri_jalur::geography)/1000.0)::numeric, 2) "
            "WHERE id_koridor = :id"
        ), {"id": id_koridor})
    db.commit()

    row = db.execute(text(
        "SELECT id_koridor, kode_trayek, nama_trayek, titik_awal, titik_akhir, "
        "warna_peta, panjang_km FROM koridor_trayek WHERE id_koridor = :id"
    ), {"id": id_koridor}).fetchone()
    return _row_to_koridor_out(row)


@router.delete("/{id_koridor}", status_code=204)
def delete_koridor(id_koridor: int, db: Session = Depends(get_db)):
    result = db.execute(text("DELETE FROM koridor_trayek WHERE id_koridor = :id"), {"id": id_koridor})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Koridor tidak ditemukan")
    return None

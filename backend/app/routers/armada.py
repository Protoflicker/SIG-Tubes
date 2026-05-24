"""Endpoints CRUD untuk armada bus TMP."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ArmadaCreate, ArmadaUpdate, ArmadaOut

router = APIRouter(prefix="/api/v1/armada", tags=["Armada"])


def _row_to_armada_out(row) -> dict:
    return {
        "id_bus":                row.id_bus,
        "id_koridor_penugasan":  row.id_koridor_penugasan,
        "nomor_lambung":         row.nomor_lambung,
        "plat_nomor":            row.plat_nomor,
        "tahun_perakitan":       row.tahun_perakitan,
        "status_operasional":    row.status_operasional,
        "keterangan":            row.keterangan,
        "kode_trayek":           row.kode_trayek,
        "nama_trayek":           row.nama_trayek,
    }


@router.get("", response_model=List[ArmadaOut], summary="Daftar seluruh armada")
def list_armada(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter status operasional"),
    id_koridor: Optional[int] = Query(None),
):
    sql = """
        SELECT  a.id_bus, a.id_koridor_penugasan, a.nomor_lambung, a.plat_nomor,
                a.tahun_perakitan, a.status_operasional, a.keterangan,
                k.kode_trayek, k.nama_trayek
        FROM    armada_bus_tmp a
        LEFT JOIN koridor_trayek k ON a.id_koridor_penugasan = k.id_koridor
        WHERE   (:status     IS NULL OR a.status_operasional::text = :status)
          AND   (:id_koridor IS NULL OR a.id_koridor_penugasan = :id_koridor)
        ORDER BY a.nomor_lambung
    """
    rows = db.execute(text(sql), {"status": status, "id_koridor": id_koridor}).fetchall()
    return [_row_to_armada_out(r) for r in rows]


@router.get("/statistik", summary="Ringkasan statistik armada per koridor & status")
def statistik_armada(db: Session = Depends(get_db)):
    sql = """
        SELECT  COALESCE(k.kode_trayek, 'TANPA_KORIDOR') AS kode_trayek,
                a.status_operasional,
                COUNT(*) AS jumlah
        FROM    armada_bus_tmp a
        LEFT JOIN koridor_trayek k ON a.id_koridor_penugasan = k.id_koridor
        GROUP BY k.kode_trayek, a.status_operasional
        ORDER BY kode_trayek, status_operasional
    """
    rows = db.execute(text(sql)).fetchall()
    return [
        {"kode_trayek": r.kode_trayek, "status": r.status_operasional, "jumlah": r.jumlah}
        for r in rows
    ]


@router.get("/{id_bus}", response_model=ArmadaOut)
def get_armada(id_bus: int, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT  a.id_bus, a.id_koridor_penugasan, a.nomor_lambung, a.plat_nomor,
                a.tahun_perakitan, a.status_operasional, a.keterangan,
                k.kode_trayek, k.nama_trayek
        FROM    armada_bus_tmp a
        LEFT JOIN koridor_trayek k ON a.id_koridor_penugasan = k.id_koridor
        WHERE   a.id_bus = :id
    """), {"id": id_bus}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Armada tidak ditemukan")
    return _row_to_armada_out(row)


@router.post("", response_model=ArmadaOut, status_code=201)
def create_armada(payload: ArmadaCreate, db: Session = Depends(get_db)):
    try:
        new_id = db.execute(text("""
            INSERT INTO armada_bus_tmp
                (id_koridor_penugasan, nomor_lambung, plat_nomor, tahun_perakitan,
                 status_operasional, keterangan)
            VALUES
                (:id_koridor, :lambung, :plat, :tahun, :status, :keterangan)
            RETURNING id_bus
        """), {
            "id_koridor": payload.id_koridor_penugasan,
            "lambung":    payload.nomor_lambung,
            "plat":       payload.plat_nomor,
            "tahun":      payload.tahun_perakitan,
            "status":     payload.status_operasional,
            "keterangan": payload.keterangan,
        }).scalar()
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal insert armada: {exc}") from exc
    return get_armada(new_id, db)


@router.put("/{id_bus}", response_model=ArmadaOut)
def update_armada(id_bus: int, payload: ArmadaUpdate, db: Session = Depends(get_db)):
    exists = db.execute(text("SELECT 1 FROM armada_bus_tmp WHERE id_bus = :id"),
                        {"id": id_bus}).scalar()
    if not exists:
        raise HTTPException(status_code=404, detail="Armada tidak ditemukan")

    sets: list[str] = []
    params: dict = {"id": id_bus}
    field_map = {
        "id_koridor_penugasan": "id_koridor_penugasan",
        "plat_nomor":           "plat_nomor",
        "tahun_perakitan":      "tahun_perakitan",
        "status_operasional":   "status_operasional",
        "keterangan":           "keterangan",
    }
    for attr, col in field_map.items():
        val = getattr(payload, attr)
        if val is not None:
            sets.append(f"{col} = :{attr}")
            params[attr] = val
    if not sets:
        raise HTTPException(status_code=400, detail="Tidak ada field yang diperbarui")

    db.execute(text(f"UPDATE armada_bus_tmp SET {', '.join(sets)} WHERE id_bus = :id"), params)
    db.commit()
    return get_armada(id_bus, db)


@router.delete("/{id_bus}", status_code=204)
def delete_armada(id_bus: int, db: Session = Depends(get_db)):
    result = db.execute(text("DELETE FROM armada_bus_tmp WHERE id_bus = :id"), {"id": id_bus})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Armada tidak ditemukan")
    return None

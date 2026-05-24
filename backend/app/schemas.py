from typing import Literal, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


# ===== Enum literals =====
KondisiFisik   = Literal["Baik", "Rusak", "Terbengkalai"]
StatusArmada   = Literal["Beroperasi", "Mogok Subsidi BBM", "Rusak Berat"]


# ===== Koridor =====
class KoridorBase(BaseModel):
    kode_trayek: str = Field(..., max_length=10, examples=["K01"])
    nama_trayek: str = Field(..., max_length=150)
    titik_awal: str  = Field(..., max_length=100)
    titik_akhir: str = Field(..., max_length=100)
    warna_peta: str  = Field("#3388ff", pattern=r"^#[0-9A-Fa-f]{6}$")


class KoridorCreate(KoridorBase):
    # GeoJSON LineString geometry
    geometri_jalur: dict = Field(..., description="GeoJSON LineString")


class KoridorUpdate(BaseModel):
    nama_trayek: Optional[str] = None
    titik_awal: Optional[str] = None
    titik_akhir: Optional[str] = None
    warna_peta: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    geometri_jalur: Optional[dict] = None


class KoridorOut(KoridorBase):
    id_koridor: int
    panjang_km: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


# ===== Halte =====
class HalteBase(BaseModel):
    id_koridor_pelintas: Optional[int] = None
    nama_halte: str = Field(..., max_length=150)
    nama_jalan: Optional[str] = Field(None, max_length=200)
    kondisi_fisik: KondisiFisik = "Baik"
    keterangan: Optional[str] = None


class HalteCreate(HalteBase):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class HalteUpdate(BaseModel):
    id_koridor_pelintas: Optional[int] = None
    nama_halte: Optional[str] = Field(None, max_length=150)
    nama_jalan: Optional[str] = Field(None, max_length=200)
    kondisi_fisik: Optional[KondisiFisik] = None
    keterangan: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class HalteOut(HalteBase):
    id_halte: int
    latitude: float
    longitude: float
    kode_trayek: Optional[str] = None
    nama_trayek: Optional[str] = None
    warna_peta: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class HalteRadiusOut(HalteOut):
    jarak_meter: float


# ===== Armada =====
class ArmadaBase(BaseModel):
    id_koridor_penugasan: Optional[int] = None
    nomor_lambung: str = Field(..., max_length=20)
    plat_nomor: Optional[str] = Field(None, max_length=15)
    tahun_perakitan: Optional[int] = Field(None, ge=1990, le=2100)
    status_operasional: StatusArmada = "Beroperasi"
    keterangan: Optional[str] = None


class ArmadaCreate(ArmadaBase):
    pass


class ArmadaUpdate(BaseModel):
    id_koridor_penugasan: Optional[int] = None
    plat_nomor: Optional[str] = Field(None, max_length=15)
    tahun_perakitan: Optional[int] = Field(None, ge=1990, le=2100)
    status_operasional: Optional[StatusArmada] = None
    keterangan: Optional[str] = None


class ArmadaOut(ArmadaBase):
    id_bus: int
    kode_trayek: Optional[str] = None
    nama_trayek: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ===== GeoJSON FeatureCollection =====
class FeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[dict[str, Any]]

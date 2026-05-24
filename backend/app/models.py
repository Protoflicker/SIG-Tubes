from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, Numeric, Enum as SAEnum,
    DateTime, func,
)
from sqlalchemy.orm import relationship

from .database import Base


class KoridorTrayek(Base):
    __tablename__ = "koridor_trayek"

    id_koridor      = Column(Integer, primary_key=True, index=True)
    kode_trayek     = Column(String(10),  unique=True, nullable=False, index=True)
    nama_trayek     = Column(String(150), nullable=False)
    titik_awal      = Column(String(100), nullable=False)
    titik_akhir     = Column(String(100), nullable=False)
    warna_peta      = Column(String(7),   nullable=False, default="#3388ff")
    panjang_km      = Column(Numeric(6, 2))
    geometri_jalur  = Column(Geometry(geometry_type="LINESTRING", srid=4326), nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    halte_list = relationship("HalteInfrastruktur", back_populates="koridor")
    armada_list = relationship("ArmadaBusTmp", back_populates="koridor")


class HalteInfrastruktur(Base):
    __tablename__ = "halte_infrastruktur"

    id_halte             = Column(Integer, primary_key=True, index=True)
    id_koridor_pelintas  = Column(Integer, ForeignKey("koridor_trayek.id_koridor", ondelete="SET NULL"), index=True)
    nama_halte           = Column(String(150), nullable=False)
    nama_jalan           = Column(String(200))
    kondisi_fisik        = Column(
        SAEnum("Baik", "Rusak", "Terbengkalai", name="kondisi_fisik_enum", create_type=False),
        nullable=False, default="Baik",
    )
    keterangan           = Column(Text)
    koordinat_titik      = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    created_at           = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at           = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    koridor = relationship("KoridorTrayek", back_populates="halte_list")


class ArmadaBusTmp(Base):
    __tablename__ = "armada_bus_tmp"

    id_bus                = Column(Integer, primary_key=True, index=True)
    id_koridor_penugasan  = Column(Integer, ForeignKey("koridor_trayek.id_koridor", ondelete="SET NULL"), index=True)
    nomor_lambung         = Column(String(20),  unique=True, nullable=False)
    plat_nomor            = Column(String(15))
    tahun_perakitan       = Column(Integer)
    status_operasional    = Column(
        SAEnum("Beroperasi", "Mogok Subsidi BBM", "Rusak Berat",
               name="status_armada_enum", create_type=False),
        nullable=False, default="Beroperasi",
    )
    keterangan            = Column(Text)
    created_at            = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at            = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    koridor = relationship("KoridorTrayek", back_populates="armada_list")

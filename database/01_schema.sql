-- =====================================================================
-- Sistem Informasi Rute Angkutan Umum Pekanbaru (Trans Metro Pekanbaru)
-- Skema Database PostgreSQL + PostGIS
-- Kelompok 1 - SIG ITERA 2026
-- =====================================================================
--
-- Cara pakai:
--   createdb -U postgres sig_tmp_pekanbaru
--   psql -U postgres -d sig_tmp_pekanbaru -f 01_schema.sql
--   psql -U postgres -d sig_tmp_pekanbaru -f 02_seed_koridor.sql
--   psql -U postgres -d sig_tmp_pekanbaru -f 03_seed_halte.sql
--   psql -U postgres -d sig_tmp_pekanbaru -f 04_seed_armada.sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS armada_bus_tmp CASCADE;
DROP TABLE IF EXISTS halte_infrastruktur CASCADE;
DROP TABLE IF EXISTS koridor_trayek CASCADE;

DROP TYPE IF EXISTS kondisi_fisik_enum;
DROP TYPE IF EXISTS status_armada_enum;

CREATE TYPE kondisi_fisik_enum AS ENUM ('Baik', 'Rusak', 'Terbengkalai');
CREATE TYPE status_armada_enum AS ENUM ('Beroperasi', 'Mogok Subsidi BBM', 'Rusak Berat');

-- =====================================================================
-- 1. Tabel Induk: KORIDOR_TRAYEK (Entitas Garis / LineString)
-- =====================================================================
CREATE TABLE koridor_trayek (
    id_koridor          SERIAL PRIMARY KEY,
    kode_trayek         VARCHAR(10)  NOT NULL UNIQUE,
    nama_trayek         VARCHAR(150) NOT NULL,
    titik_awal          VARCHAR(100) NOT NULL,
    titik_akhir         VARCHAR(100) NOT NULL,
    warna_peta          VARCHAR(7)   NOT NULL DEFAULT '#3388ff',
    panjang_km          NUMERIC(6,2),
    geometri_jalur      GEOMETRY(LineString, 4326) NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_koridor_geom ON koridor_trayek USING GIST (geometri_jalur);
CREATE INDEX idx_koridor_kode ON koridor_trayek (kode_trayek);

COMMENT ON TABLE koridor_trayek IS 'Trayek koridor BRT Trans Metro Pekanbaru (LineString WGS84)';

-- =====================================================================
-- 2. Tabel Anak: HALTE_INFRASTRUKTUR (Entitas Titik / Point)
-- =====================================================================
CREATE TABLE halte_infrastruktur (
    id_halte            SERIAL PRIMARY KEY,
    id_koridor_pelintas INTEGER REFERENCES koridor_trayek(id_koridor) ON DELETE SET NULL,
    nama_halte          VARCHAR(150) NOT NULL,
    nama_jalan          VARCHAR(200),
    kondisi_fisik       kondisi_fisik_enum NOT NULL DEFAULT 'Baik',
    keterangan          TEXT,
    koordinat_titik     GEOMETRY(Point, 4326) NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_halte_geom    ON halte_infrastruktur USING GIST (koordinat_titik);
CREATE INDEX idx_halte_koridor ON halte_infrastruktur (id_koridor_pelintas);
CREATE INDEX idx_halte_kondisi ON halte_infrastruktur (kondisi_fisik);

COMMENT ON TABLE halte_infrastruktur IS 'Titik halte/shelter BRT (Point WGS84). Target query ST_DWithin radius.';

-- =====================================================================
-- 3. Tabel Pendukung: ARMADA_BUS_TMP (Entitas Aset)
-- =====================================================================
CREATE TABLE armada_bus_tmp (
    id_bus              SERIAL PRIMARY KEY,
    id_koridor_penugasan INTEGER REFERENCES koridor_trayek(id_koridor) ON DELETE SET NULL,
    nomor_lambung       VARCHAR(20)  NOT NULL UNIQUE,
    plat_nomor          VARCHAR(15),
    tahun_perakitan     INTEGER,
    status_operasional  status_armada_enum NOT NULL DEFAULT 'Beroperasi',
    keterangan          TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_armada_koridor ON armada_bus_tmp (id_koridor_penugasan);
CREATE INDEX idx_armada_status  ON armada_bus_tmp (status_operasional);

COMMENT ON TABLE armada_bus_tmp IS 'Inventaris armada bus TMP (90 unit historis, 23 operasional 2024-2025)';

-- =====================================================================
-- Trigger updated_at otomatis
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_koridor_updated_at BEFORE UPDATE ON koridor_trayek
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_halte_updated_at   BEFORE UPDATE ON halte_infrastruktur
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_armada_updated_at  BEFORE UPDATE ON armada_bus_tmp
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- View untuk join halte + koridor (memudahkan query dari backend)
-- =====================================================================
CREATE OR REPLACE VIEW v_halte_dengan_koridor AS
SELECT
    h.id_halte,
    h.nama_halte,
    h.nama_jalan,
    h.kondisi_fisik,
    h.keterangan,
    h.koordinat_titik,
    k.id_koridor,
    k.kode_trayek,
    k.nama_trayek,
    k.warna_peta
FROM halte_infrastruktur h
LEFT JOIN koridor_trayek k ON h.id_koridor_pelintas = k.id_koridor;

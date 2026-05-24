-- =====================================================================
-- Migration v4: kolom rute_trayek.geometri_jalur jadi GEOMETRY(Geometry, 4326)
--
-- Alasan: seeder baru menghasilkan MultiLineString (hasil ST_LineMerge
-- dari banyak segmen OSM yang dijahit) sementara CRUD admin
-- (RutePicker → OSRM) masih insert LineString. Kolom generik
-- "Geometry" menerima keduanya tanpa CHECK type, sambil tetap
-- mengikat SRID 4326 dan GIST index.
--
-- Jalankan sekali pada database existing:
--   psql -U postgres -d sig_tmp_pekanbaru -f database/04_migration_geometry_generic.sql
-- =====================================================================

BEGIN;

-- Drop GIST index dulu (akan dibuat ulang setelah perubahan tipe)
DROP INDEX IF EXISTS idx_rute_geom;

ALTER TABLE rute_trayek
    ALTER COLUMN geometri_jalur TYPE GEOMETRY(Geometry, 4326)
    USING geometri_jalur;

-- Re-create GIST index
CREATE INDEX idx_rute_geom ON rute_trayek USING GIST (geometri_jalur);

COMMIT;

-- Verifikasi
SELECT id_rute, kode_trayek, GeometryType(geometri_jalur), ST_SRID(geometri_jalur)
FROM   rute_trayek
ORDER  BY id_rute;

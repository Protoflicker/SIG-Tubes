-- =====================================================================
-- Seed: 8 Koridor Trans Metro Pekanbaru (LineString EPSG:4326)
-- Sumber: Traveloka rute TMP, Dishub Pekanbaru, OSM landmark verification
-- =====================================================================

INSERT INTO koridor_trayek
    (kode_trayek, nama_trayek, titik_awal, titik_akhir, warna_peta, panjang_km, geometri_jalur)
VALUES
-- Koridor 01: Plaza Ramayana / MPP - Pandau Permai (selatan kota)
('K01',  'Koridor 01 (Plaza Ramayana - Pandau Permai)',
        'Plaza Ramayana', 'Pandau Permai', '#E53935', 18.50,
 ST_GeomFromText('LINESTRING(
    101.4458 0.5083, 101.4470 0.5025, 101.4485 0.4940, 101.4505 0.4830,
    101.4530 0.4720, 101.4565 0.4600, 101.4615 0.4480, 101.4680 0.4360,
    101.4760 0.4260, 101.4810 0.4145)', 4326)),

-- Koridor 1A: MPP - Bandara SSK II
('K1A',  'Koridor 1A (MPP - Bandara SSK II)',
        'MPP Pekanbaru', 'Bandara SSK II', '#1E88E5', 8.20,
 ST_GeomFromText('LINESTRING(
    101.4458 0.5083, 101.4445 0.5010, 101.4438 0.4920, 101.4435 0.4830,
    101.4438 0.4740, 101.4438 0.4654)', 4326)),

-- Koridor 02: TBRPS - Kulim Ujung
('K02',  'Koridor 02 (Terminal BRPS - Kulim Ujung)',
        'Terminal BRPS', 'Kulim Ujung', '#43A047', 16.30,
 ST_GeomFromText('LINESTRING(
    101.3860 0.5117, 101.3990 0.5135, 101.4140 0.5150, 101.4310 0.5170,
    101.4470 0.5190, 101.4620 0.5215, 101.4790 0.5245, 101.4940 0.5275,
    101.5060 0.5290)', 4326)),

-- Koridor 03: RS Awal Bros - Kampus UIN Suska
('K03',  'Koridor 03 (RS Awal Bros - UIN Suska Riau)',
        'RS Awal Bros Sudirman', 'Kampus UIN Suska', '#FB8C00', 10.40,
 ST_GeomFromText('LINESTRING(
    101.4413 0.4943, 101.4360 0.4900, 101.4280 0.4870, 101.4180 0.4845,
    101.4070 0.4820, 101.3960 0.4795, 101.3865 0.4780, 101.3771 0.4736)', 4326)),

-- Koridor 4A: Pasar Pagi Arengka - Tenayan Raya
('K4A',  'Koridor 4A (Pasar Pagi Arengka - Tenayan Raya)',
        'Pasar Pagi Arengka', 'Tenayan Raya', '#8E24AA', 17.90,
 ST_GeomFromText('LINESTRING(
    101.4150 0.4960, 101.4280 0.4990, 101.4430 0.5040, 101.4580 0.5090,
    101.4740 0.5150, 101.4910 0.5215, 101.5080 0.5275, 101.5240 0.5310,
    101.5390 0.5335, 101.5460 0.5340)', 4326)),

-- Koridor 4B: Sudirman - Tenayan Raya via Lintas Timur
('K4B',  'Koridor 4B (Jl. Sudirman - Tenayan Raya)',
        'Jl. Sudirman', 'Tenayan Raya', '#00ACC1', 19.20,
 ST_GeomFromText('LINESTRING(
    101.4470 0.5070, 101.4620 0.5095, 101.4790 0.5120, 101.4960 0.5145,
    101.5120 0.5180, 101.5260 0.5230, 101.5390 0.5290, 101.5460 0.5340)', 4326)),

-- Koridor 4C: Marpoyan - Tenayan Raya
('K4C',  'Koridor 4C (Marpoyan Damai - Tenayan Raya)',
        'Marpoyan Damai', 'Tenayan Raya', '#6D4C41', 18.10,
 ST_GeomFromText('LINESTRING(
    101.4400 0.4540, 101.4540 0.4640, 101.4690 0.4750, 101.4850 0.4870,
    101.5010 0.4990, 101.5160 0.5110, 101.5300 0.5220, 101.5410 0.5300,
    101.5460 0.5340)', 4326)),

-- Koridor 8A: Pelita Pantai - Universitas Riau (Panam)
('K8A',  'Koridor 8A (Pelita Pantai - Universitas Riau Panam)',
        'Pelita Pantai', 'Universitas Riau (Panam)', '#7CB342', 13.50,
 ST_GeomFromText('LINESTRING(
    101.4530 0.5290, 101.4420 0.5240, 101.4290 0.5170, 101.4150 0.5080,
    101.4010 0.4980, 101.3870 0.4870, 101.3740 0.4760, 101.3640 0.4680)', 4326));

-- Verifikasi panjang sesuai geometri (overwrite panjang_km berdasarkan kalkulasi PostGIS)
UPDATE koridor_trayek
SET panjang_km = ROUND( (ST_Length(geometri_jalur::geography) / 1000.0)::numeric, 2 );

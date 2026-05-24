-- =====================================================================
-- Seed: 25 Armada Bus Trans Metro Pekanbaru
-- Konteks: dari 90 unit historis, hanya 23 operasional (data 2024-2025)
-- =====================================================================

INSERT INTO armada_bus_tmp
    (id_koridor_penugasan, nomor_lambung, plat_nomor, tahun_perakitan, status_operasional, keterangan)
VALUES
-- Koridor 01 - operasional
(1, 'TMP-001', 'BM 7001 AB', 2019, 'Beroperasi',        'Rute Plaza Ramayana - Pandau, jadwal pagi-sore'),
(1, 'TMP-002', 'BM 7002 AB', 2019, 'Beroperasi',        'Rute Plaza Ramayana - Pandau, jadwal sore-malam'),
(1, 'TMP-003', 'BM 7003 AB', 2018, 'Mogok Subsidi BBM', 'Ditarik Januari 2025 - tunggakan BBM'),

-- Koridor 1A - operasional ke bandara
(2, 'TMP-010', 'BM 7010 AB', 2020, 'Beroperasi',        'Shuttle bandara, headway 30 menit'),
(2, 'TMP-011', 'BM 7011 AB', 2020, 'Beroperasi',        'Shuttle bandara cadangan'),
(2, 'TMP-012', 'BM 7012 AB', 2017, 'Rusak Berat',       'Teronggok di TBRPS, mesin tidak hidup'),

-- Koridor 02 - banyak masalah
(3, 'TMP-020', 'BM 7020 AB', 2016, 'Beroperasi',        'Rute TBRPS - Kulim'),
(3, 'TMP-021', 'BM 7021 AB', 2016, 'Rusak Berat',       'Body keropos, ditemukan evaluasi Walikota'),
(3, 'TMP-022', 'BM 7022 AB', 2015, 'Rusak Berat',       'Mesin overhaul, parkir TBRPS'),
(3, 'TMP-023', 'BM 7023 AB', 2018, 'Mogok Subsidi BBM', 'Berhenti operasi sejak 3 Januari 2025'),

-- Koridor 03 - operasional kampus
(4, 'TMP-030', 'BM 7030 AB', 2021, 'Beroperasi',        'Rute kampus, ramai jam kuliah'),
(4, 'TMP-031', 'BM 7031 AB', 2021, 'Beroperasi',        'Rute kampus, jadwal genap'),
(4, 'TMP-032', 'BM 7032 AB', 2017, 'Rusak Berat',       'AC mati, ditarik dari peredaran'),

-- Koridor 4A
(5, 'TMP-040', 'BM 7040 AB', 2019, 'Beroperasi',        'Rute Arengka - Tenayan'),
(5, 'TMP-041', 'BM 7041 AB', 2019, 'Mogok Subsidi BBM', 'Tunggakan BBM Pertamina'),

-- Koridor 4B
(6, 'TMP-050', 'BM 7050 AB', 2020, 'Beroperasi',        'Rute Sudirman - Tenayan'),
(6, 'TMP-051', 'BM 7051 AB', 2016, 'Rusak Berat',       'Transmisi rusak parah'),

-- Koridor 4C
(7, 'TMP-060', 'BM 7060 AB', 2018, 'Beroperasi',        'Rute Marpoyan - Tenayan'),
(7, 'TMP-061', 'BM 7061 AB', 2015, 'Rusak Berat',       'Sudah tidak layak jalan'),

-- Koridor 8A
(8, 'TMP-080', 'BM 7080 AB', 2022, 'Beroperasi',        'Rute kampus UNRI Panam, armada terbaru'),
(8, 'TMP-081', 'BM 7081 AB', 2022, 'Beroperasi',        'Rute kampus UNRI Panam'),
(8, 'TMP-082', 'BM 7082 AB', 2017, 'Mogok Subsidi BBM', 'Ditarik bersama 40 unit lain Jan 2025'),

-- Belum ditugaskan / cadangan
(NULL, 'TMP-099', 'BM 7099 AB', 2014, 'Rusak Berat',    'Cadangan, ditemukan dalam kondisi rusak'),
(NULL, 'TMP-100', 'BM 7100 AB', 2015, 'Rusak Berat',    'Teronggok di TBRPS, tanpa identifikasi koridor'),
(NULL, 'TMP-101', 'BM 7101 AB', 2014, 'Rusak Berat',    'Tidak terurus, akan dilelang');

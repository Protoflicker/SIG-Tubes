-- =====================================================================
-- Seed: 25 Halte Trans Metro Pekanbaru (Point EPSG:4326)
-- Mencakup status fisik bervariasi (Baik / Rusak / Terbengkalai)
-- sesuai laporan DPRD Pekanbaru 2024 - banyak halte TMP terbengkalai
-- =====================================================================

INSERT INTO halte_infrastruktur
    (id_koridor_pelintas, nama_halte, nama_jalan, kondisi_fisik, keterangan, koordinat_titik)
VALUES
-- ===== Koridor 01: Plaza Ramayana - Pandau Permai =====
(1, 'Halte Plaza Ramayana',          'Jl. Jenderal Sudirman',     'Baik',
    'Halte induk, dekat MPP Pekanbaru',
    ST_SetSRID(ST_MakePoint(101.4458, 0.5083), 4326)),

(1, 'Halte Mall Pekanbaru',          'Jl. Jenderal Sudirman',     'Baik',
    'Akses mall dan perkantoran',
    ST_SetSRID(ST_MakePoint(101.4470, 0.5025), 4326)),

(1, 'Halte Simpang Tiga',            'Jl. Jenderal Sudirman',     'Rusak',
    'Atap berlubang, butuh perbaikan',
    ST_SetSRID(ST_MakePoint(101.4485, 0.4940), 4326)),

(1, 'Halte Pasar Pagi',              'Jl. Sudirman',              'Baik',
    'Halte ramai pagi hari',
    ST_SetSRID(ST_MakePoint(101.4530, 0.4720), 4326)),

(1, 'Halte Pandau Permai',           'Jl. Pandau',                'Terbengkalai',
    'Atap hilang, tidak terawat sejak 2023',
    ST_SetSRID(ST_MakePoint(101.4810, 0.4145), 4326)),

-- ===== Koridor 1A: MPP - Bandara SSK II =====
(2, 'Halte MPP Pekanbaru',           'Jl. Jenderal Sudirman',     'Baik',
    'Mal Pelayanan Publik, terintegrasi K01',
    ST_SetSRID(ST_MakePoint(101.4458, 0.5083), 4326)),

(2, 'Halte Simpang Pandau',          'Jl. Sudirman - Arifin Ahmad','Baik',
    'Transit ke koridor lain',
    ST_SetSRID(ST_MakePoint(101.4445, 0.5010), 4326)),

(2, 'Halte Marpoyan',                'Jl. Arifin Ahmad',          'Rusak',
    'Bangku patah, perlu perbaikan ringan',
    ST_SetSRID(ST_MakePoint(101.4438, 0.4830), 4326)),

(2, 'Halte Bandara SSK II',          'Jl. Bandara SSK II',        'Baik',
    'Terminal bandara internasional',
    ST_SetSRID(ST_MakePoint(101.4438, 0.4654), 4326)),

-- ===== Koridor 02: TBRPS - Kulim Ujung =====
(3, 'Halte Terminal BRPS',           'Jl. Tuanku Tambusai',       'Baik',
    'Terminal AKAP/AKDP Bandar Raya Payung Sekaki',
    ST_SetSRID(ST_MakePoint(101.3860, 0.5117), 4326)),

(3, 'Halte Tuanku Tambusai',         'Jl. Tuanku Tambusai',       'Baik',
    'Akses pertokoan',
    ST_SetSRID(ST_MakePoint(101.4140, 0.5150), 4326)),

(3, 'Halte Sukajadi',                'Jl. Tuanku Tambusai',       'Rusak',
    'Atap bocor saat hujan',
    ST_SetSRID(ST_MakePoint(101.4470, 0.5190), 4326)),

(3, 'Halte Pasar Senapelan',         'Jl. Ahmad Yani',            'Terbengkalai',
    'Tidak terpakai akibat krisis BBM TMP 2024',
    ST_SetSRID(ST_MakePoint(101.4790, 0.5245), 4326)),

(3, 'Halte Kulim Ujung',             'Jl. Kulim Raya',            'Baik',
    'Ujung koridor 02',
    ST_SetSRID(ST_MakePoint(101.5060, 0.5290), 4326)),

-- ===== Koridor 03: RS Awal Bros - UIN Suska =====
(4, 'Halte RS Awal Bros Sudirman',   'Jl. Jenderal Sudirman',     'Baik',
    'Rumah sakit rujukan, halte ramai',
    ST_SetSRID(ST_MakePoint(101.4413, 0.4943), 4326)),

(4, 'Halte Simpang HR. Soebrantas',  'Jl. HR. Soebrantas',        'Rusak',
    'Lokasi terminal bayangan ilegal nearby',
    ST_SetSRID(ST_MakePoint(101.4180, 0.4845), 4326)),

(4, 'Halte Panam',                   'Jl. HR. Soebrantas',        'Baik',
    'Kawasan kampus dan pertokoan',
    ST_SetSRID(ST_MakePoint(101.3960, 0.4795), 4326)),

(4, 'Halte UIN Suska Riau',          'Jl. HR. Soebrantas',        'Terbengkalai',
    'Halte depan kampus, atap hilang',
    ST_SetSRID(ST_MakePoint(101.3771, 0.4736), 4326)),

-- ===== Koridor 4A: Pasar Pagi Arengka - Tenayan Raya =====
(5, 'Halte Pasar Pagi Arengka',      'Jl. Arengka',               'Baik',
    'Pasar tradisional besar',
    ST_SetSRID(ST_MakePoint(101.4150, 0.4960), 4326)),

(5, 'Halte Tenayan Raya',            'Jl. Lintas Timur',          'Baik',
    'Halte akhir koridor 4A',
    ST_SetSRID(ST_MakePoint(101.5460, 0.5340), 4326)),

-- ===== Koridor 4B: Sudirman - Tenayan Raya =====
(6, 'Halte Sudirman Atas',           'Jl. Jenderal Sudirman',     'Baik',
    'Halte arah timur',
    ST_SetSRID(ST_MakePoint(101.4470, 0.5070), 4326)),

(6, 'Halte Rumbai',                  'Jl. Rumbai',                'Rusak',
    'Bangku rusak',
    ST_SetSRID(ST_MakePoint(101.4960, 0.5145), 4326)),

-- ===== Koridor 4C: Marpoyan Damai - Tenayan Raya =====
(7, 'Halte Marpoyan Damai',          'Jl. Kaharudin Nasution',    'Baik',
    'Awal koridor 4C',
    ST_SetSRID(ST_MakePoint(101.4400, 0.4540), 4326)),

-- ===== Koridor 8A: Pelita Pantai - UNRI Panam =====
(8, 'Halte Pelita Pantai',           'Jl. Riau',                  'Baik',
    'Awal koridor 8A, dekat sungai Siak',
    ST_SetSRID(ST_MakePoint(101.4530, 0.5290), 4326)),

(8, 'Halte Universitas Riau Panam',  'Jl. HR. Soebrantas',        'Baik',
    'Kampus UNRI, ramai mahasiswa',
    ST_SetSRID(ST_MakePoint(101.3640, 0.4680), 4326));

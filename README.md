# 🚌 WebGIS Sistem Informasi Rute Angkutan Umum Pekanbaru

**Mata Kuliah:** Sistem Informasi Geografis (SIG) — Institut Teknologi Sumatera
**Kelompok 1 (2026):**
- Febrian Valentino Nugroho — 123140034
- Anselmus Herpin Hasugian — 123140020
- Adi Septriansyah — 123140021
- Jonathan Nicholaus Damero Sinaga — 123140153

Implementasi WebGIS *full-stack* untuk **Trans Metro Pekanbaru (TMP)** sebagai
respons terhadap krisis operasional TMP 2024–2025 (hanya 23 dari 90 bus
operasional, banyak halte rusak/terbengkalai). Sistem memetakan **8 koridor BRT**,
**25 halte** beserta status fisik, dan **25 armada** lengkap dengan fitur
pencarian halte terdekat berbasis GPS (ST_DWithin).

---

## 🧱 Arsitektur

```
┌──────────────┐    HTTP/JSON    ┌──────────────┐   SQL/PostGIS  ┌──────────────┐
│  Frontend    │ ──────────────> │  Backend     │ ─────────────> │  PostgreSQL  │
│  React +     │                 │  FastAPI     │                │  + PostGIS   │
│  react-leaf  │ <────────────── │  + Pydantic  │ <───────────── │  (GIST idx)  │
└──────────────┘    GeoJSON      └──────────────┘                └──────────────┘
   :5173                            :8000                            :5432
```

| Lapis    | Tech                                              | Folder       |
|----------|---------------------------------------------------|--------------|
| Database | PostgreSQL ≥14 + PostGIS ≥3                       | [database/](database) |
| Backend  | FastAPI 0.115 · SQLAlchemy 2 · GeoAlchemy2 · Pydantic v2 | [backend/](backend)  |
| Frontend | React 18 · Vite 5 · react-leaflet 4 · Leaflet 1.9 | [frontend/](frontend) |

---

## 🗃️ 1. Setup Database (PostGIS)

Prasyarat: PostgreSQL ≥14 dengan ekstensi PostGIS terpasang.

```powershell
# Windows (PowerShell) — gunakan psql dari PATH PostgreSQL
$env:PGPASSWORD = "postgres"
createdb -U postgres sig_tmp_pekanbaru

psql -U postgres -d sig_tmp_pekanbaru -f database/01_schema.sql
psql -U postgres -d sig_tmp_pekanbaru -f database/02_seed_koridor.sql
psql -U postgres -d sig_tmp_pekanbaru -f database/03_seed_halte.sql
psql -U postgres -d sig_tmp_pekanbaru -f database/04_seed_armada.sql
```

Verifikasi:

```sql
SELECT COUNT(*) FROM koridor_trayek;        -- 8
SELECT COUNT(*) FROM halte_infrastruktur;   -- 25
SELECT COUNT(*) FROM armada_bus_tmp;        -- 25

-- Test query spasial radius 1 km dari MPP Pekanbaru
SELECT nama_halte,
       ROUND(ST_Distance(koordinat_titik::geography,
            ST_SetSRID(ST_MakePoint(101.4458, 0.5083),4326)::geography)::numeric, 2) AS jarak_m
FROM   halte_infrastruktur
WHERE  ST_DWithin(koordinat_titik::geography,
                  ST_SetSRID(ST_MakePoint(101.4458, 0.5083),4326)::geography,
                  1000)
ORDER  BY jarak_m;
```

### Struktur ERD

```
koridor_trayek (id_koridor PK, LineString geom)
  │  1:N memiliki
  ├──> halte_infrastruktur (id_halte PK, Point geom, FK id_koridor_pelintas)
  │
  │  1:N mengoperasikan
  └──> armada_bus_tmp     (id_bus  PK, FK id_koridor_penugasan)
```

GIST spatial index dibuat pada `geometri_jalur` dan `koordinat_titik`.

---

## 🐍 2. Setup Backend (FastAPI)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

Copy-Item .env.example .env   # edit DATABASE_URL jika perlu

uvicorn app.main:app --reload --port 8000
```

Buka:
- Swagger UI: <http://localhost:8000/docs>
- ReDoc:      <http://localhost:8000/redoc>
- OpenAPI:    <http://localhost:8000/openapi.json>

### Daftar Endpoint

| Method | Path                                        | Deskripsi |
|-------:|---------------------------------------------|-----------|
| GET    | `/api/v1/halte`                             | List halte (filter `kondisi`, `id_koridor`) |
| GET    | `/api/v1/halte/radius?lat&lng&radius`       | **ST_DWithin** — halte dalam radius (m) |
| GET    | `/api/v1/halte/geojson`                     | FeatureCollection halte |
| GET    | `/api/v1/halte/{id}`                        | Detail halte |
| POST   | `/api/v1/halte`                             | Tambah halte (validasi Pydantic) |
| PUT    | `/api/v1/halte/{id}`                        | Update halte |
| DELETE | `/api/v1/halte/{id}`                        | Hapus halte |
| GET    | `/api/v1/koridor`                           | List koridor |
| GET    | `/api/v1/koridor/geojson`                   | FeatureCollection semua koridor |
| GET    | `/api/v1/koridor/{id}/geojson`              | GeoJSON Feature satu koridor |
| GET    | `/api/v1/koridor/{id}/intersect-halte?buffer_meter` | Halte di sekitar jalur (ST_DWithin LineString) |
| POST/PUT/DELETE | `/api/v1/koridor[/{id}]`           | CRUD koridor |
| GET    | `/api/v1/armada`                            | List armada |
| GET    | `/api/v1/armada/statistik`                  | Statistik armada/koridor/status |
| POST/PUT/DELETE | `/api/v1/armada[/{id}]`            | CRUD armada |

---

## ⚛️ 3. Setup Frontend (React + Vite + Leaflet)

```powershell
cd frontend
npm install
npm run dev
```

Buka <http://localhost:5173>. Vite di-proxy ke backend `http://localhost:8000` via
`/api`, jadi tidak perlu konfigurasi CORS tambahan saat dev.

### Fitur Frontend

- **Map Centric Layout** — peta OpenStreetMap full screen, sidebar 340 px.
- **Filter Koridor** — checkbox per koridor + toggle tampilkan halte rusak.
- **Pencarian Halte Terdekat** — input lat/lng manual atau **Pakai GPS**
  (browser geolocation), slider radius 100–5000 m, panggil
  `GET /api/v1/halte/radius`. Hasil ditampilkan di sidebar + lingkaran biru di peta.
- **Popup Detail Halte** — nama, jalan, koridor, badge kondisi fisik, keterangan.
- **Popup Detail Koridor** — kode, titik awal/akhir, panjang km.
- **Panel Admin CRUD** — tab Halte & Armada dengan form Tambah/Edit/Hapus.

---

## 🧪 4. Smoke Test End-to-End

1. `psql ...` — load 4 file SQL.
2. `uvicorn app.main:app --reload` — backend di :8000.
3. `npm run dev` — frontend di :5173.
4. Buka <http://localhost:5173>, peta Pekanbaru tampil dengan 8 garis koridor + 25 titik halte.
5. Klik **Pakai GPS** → **Cari** (radius default 500 m) → list halte terdekat muncul.
6. Klik tab **Admin CRUD** → tambah halte baru lat `0.51`, lng `101.45` → kembali ke peta → titik baru muncul.

---

## 📐 5. Pemenuhan Komponen Wajib (sesuai Panduan SIG ITERA)

### 4.1 Database (PostGIS) — ✅
- [x] 3 tabel berelasi: `koridor_trayek`, `halte_infrastruktur`, `armada_bus_tmp`
- [x] 2 tipe geometri: **LineString** (koridor) + **Point** (halte)
- [x] Spatial index **GIST** pada 2 kolom geometri
- [x] SRID konsisten **EPSG:4326**
- [x] Sample data: 8 koridor, 25 halte, 25 armada (>20 minimal)

### 4.2 Backend (FastAPI) — ✅
- [x] CRUD lengkap untuk 3 entitas (Halte, Koridor, Armada)
- [x] 2+ query spasial: `ST_DWithin` (radius halte, intersect koridor), `ST_Distance` (urutkan jarak)
- [x] Output **GeoJSON** (`/halte/geojson`, `/koridor/geojson`)
- [x] Validasi **Pydantic** (range lat/lng, regex warna hex, enum kondisi)
- [x] Error handling (HTTP 400/404 + rollback transaksi)
- [x] Dokumentasi otomatis **Swagger/OpenAPI** di `/docs`

### 4.3 Frontend (React + Leaflet) — ✅
- [x] Peta interaktif `react-leaflet` + TileLayer OSM
- [x] Layer dari API: GeoJSON LineString + CircleMarker dari data backend
- [x] Popup detail saat klik objek (halte & koridor)
- [x] Form input/edit data (Admin Panel)
- [x] Filter & pencarian (filter koridor + pencarian radius berbasis GPS)
- [x] Responsive (grid layout 340 px sidebar + map)

---

## 📁 Struktur Folder

```
SIG_TUBES/
├── database/
│   ├── 01_schema.sql            # CREATE TABLE + GIST index + trigger
│   ├── 02_seed_koridor.sql      # 8 LineString koridor TMP
│   ├── 03_seed_halte.sql        # 25 Point halte (Baik/Rusak/Terbengkalai)
│   └── 04_seed_armada.sql       # 25 armada bus
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py              # FastAPI app + CORS + include routers
│       ├── config.py            # Pydantic settings
│       ├── database.py          # SQLAlchemy engine/session
│       ├── models.py            # ORM (GeoAlchemy2)
│       ├── schemas.py           # Pydantic schemas
│       └── routers/
│           ├── halte.py         # CRUD + ST_DWithin radius
│           ├── koridor.py       # CRUD + GeoJSON + intersect-halte
│           └── armada.py        # CRUD + statistik
└── frontend/
    ├── package.json
    ├── vite.config.js           # proxy /api -> :8000
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              # state + routing tab
        ├── api.js               # fetch helper
        ├── styles.css
        └── components/
            ├── MapView.jsx      # MapContainer + GeoJSON + Circle
            ├── Sidebar.jsx      # filter koridor + radius search
            └── AdminPanel.jsx   # CRUD halte & armada
```

---

## 🔗 Referensi Data

- Proposal Kelompok 1 SIG ITERA 2026 — Sistem Informasi Rute Angkutan Pekanbaru
- Traveloka: Rute & jadwal Trans Metro Pekanbaru
- Wikipedia: Terminal Bandar Raya Payung Sekaki (TBRPS)
- Pemkot Pekanbaru — Evaluasi pengelolaan TMP 2024
- DPRD Pekanbaru — laporan kondisi halte TMP terbengkalai
- OpenStreetMap (Overpass Turbo) untuk verifikasi landmark
- Format & teknik import: lihat [SUMBER DATA.md](SUMBER%20DATA.md)

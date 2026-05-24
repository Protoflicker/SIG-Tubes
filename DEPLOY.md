# 🚀 Deployment ke Vercel + Supabase

Panduan langkah demi langkah untuk men-deploy WebGIS Trans Metro Pekanbaru ke
**Vercel** (frontend static + backend serverless Python) dengan database
**Supabase** (PostgreSQL + PostGIS).

---

## Arsitektur Production

```
┌─────────────────────────┐      ┌──────────────────────────┐
│  Vercel CDN / Edge      │      │  Supabase (US East)      │
│                         │      │                          │
│  /            ──> dist  │      │  PostgreSQL 15           │
│  /assets/*    ──> dist  │ SQL  │  + PostGIS extension     │
│  /api/*       ──> py    │ ───> │  Connection pooler 6543  │
│   (api/index.py)        │      │  (pgBouncer transaction) │
└─────────────────────────┘      └──────────────────────────┘
```

Frontend di-build sekali (Vite → `frontend/dist`) dan disajikan sebagai static
file. Backend FastAPI dijalankan sebagai serverless function — setiap request
HTTP membangunkan instance Python (cold start ±1-3 s), lalu mati lagi.

---

## 1️⃣ Setup Database — Supabase

1.  Buat akun di <https://supabase.com> (gratis, GitHub login OK).
2.  Klik **New project**:
    - Name: `webgis-tmp-pekanbaru`
    - Database password: catat — akan dipakai di `DATABASE_URL`.
    - Region: pilih yang dekat (Singapore untuk Indonesia).
3.  Tunggu provisioning ±2 menit.
4.  Buka tab **SQL Editor** → **New query**, paste isi file
    [database/01_schema.sql](database/01_schema.sql), klik **Run**.
    Ini akan:
    - Aktifkan extension `postgis` & `pgcrypto`.
    - Buat tabel `rute_trayek` dan `halte_infrastruktur`.
    - Buat GIST spatial index.
5.  Verifikasi: jalankan `SELECT postgis_version();` — harus
    keluar versi PostGIS ≥ 3.x.
6.  Buka **Project Settings → Database → Connection string**:
    - Pilih tab **Transaction** (port 6543, pgBouncer pooler).
    - Salin connection string, ubah prefix `postgresql://`
      menjadi `postgresql+psycopg://`.
    - Contoh hasil:
      ```
      postgresql+psycopg://postgres.abcxyz:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
      ```

---

## 2️⃣ Push repo ke GitHub

```powershell
git init
git add .
git commit -m "feat: vercel + supabase deployment ready"
git branch -M main
gh repo create webgis-tmp-pekanbaru --public --source=. --push
# atau buat repo manual lalu push remote-nya
```

---

## 3️⃣ Deploy ke Vercel

### a. Import project

1.  Buka <https://vercel.com/new>.
2.  Import repo GitHub `webgis-tmp-pekanbaru`.
3.  Framework Preset: **Other** (Vercel akan baca `vercel.json` otomatis).
4.  **Root Directory:** biarkan `.` (root).
5.  **Build & Output Settings:** kosongkan — sudah ditangani `vercel.json`.

### b. Environment Variables

Tambahkan di **Project Settings → Environment Variables**:

| Key             | Value                                                                                              |
|-----------------|----------------------------------------------------------------------------------------------------|
| `DATABASE_URL`  | (paste connection string Supabase dari langkah 1.6)                                                |
| `CORS_ORIGINS`  | `https://<nama-project>.vercel.app` (sementara `*` boleh untuk testing)                            |
| `ADMIN_TOKEN`   | string acak panjang (mis. `openssl rand -hex 32`) — dipakai untuk seeder endpoint                  |

Klik **Deploy**. Build pertama ±3 menit (install npm + Vite build + Python deps).

### c. Inisialisasi data (seed sekali)

Setelah deploy berhasil, panggil endpoint admin untuk memuat data GeoJSON
ke Supabase:

```powershell
$token = "ADMIN_TOKEN_YANG_TADI_DIPASANG"
curl -X POST "https://<nama-project>.vercel.app/api/v1/admin/seed" `
     -H "X-Admin-Token: $token"
```

Atau dari browser dengan extension REST client. Response sukses:

```json
{ "rute": 8, "halte": 25 }
```

> **Catatan:** Auto-seeder pada `lifespan` startup di-skip otomatis bila env
> `VERCEL` terdeteksi (lihat [backend/app/main.py](backend/app/main.py)).
> Hal ini disengaja: cold-start serverless tidak boleh berat. Seeding
> dilakukan sekali via endpoint admin.

### d. Re-seed (TRUNCATE + reload GeoJSON)

```powershell
curl -X POST "https://<nama-project>.vercel.app/api/v1/admin/reseed" `
     -H "X-Admin-Token: $token"
```

---

## 4️⃣ Verifikasi

- Buka `https://<nama-project>.vercel.app/` → peta dengan halte & rute tampil.
- Buka `https://<nama-project>.vercel.app/api/v1/health` → `{"status":"ok","serverless":true}`.
- Buka `https://<nama-project>.vercel.app/api/v1/rute` → JSON 8 rute.
- Buka `https://<nama-project>.vercel.app/docs` → Swagger UI.

---

## ⚠️ Batasan & Catatan

- **Cold start:** request pertama setelah idle ±1-3 s. Request berikutnya
  cepat (warm instance).
- **Execution limit:** Vercel Hobby tier = 10 s per request, 30 s di
  `vercel.json` ini hanya valid di Pro tier. Cukup untuk semua endpoint kecuali
  **`/admin/reseed`** yang TRUNCATE + insert ulang — bila gagal timeout, jalankan
  ulang atau pakai SQL Editor Supabase langsung.
- **Tidak ada persistent state:** auto-seeder pada startup tidak jalan; pakai
  endpoint `/admin/seed` sekali.
- **Connection pooling:** WAJIB gunakan Supabase Pooler (port `6543`,
  transaction mode). Bila pakai port `5432` direct, koneksi akan habis cepat
  karena tiap invocation Vercel buka koneksi baru.
- **OSRM:** masih pakai server publik `router.project-osrm.org` (rate-limited).
  Untuk produksi serius, self-host atau pakai alternatif.
- **PostGIS extension:** sudah pre-installed di Supabase, tinggal di-`CREATE EXTENSION`
  di SQL script (`01_schema.sql` sudah menyertakan ini).

---

## 🛠️ Development Lokal Tetap Bisa

Setup Vercel ini **tidak menggantikan** workflow lokal. Cara dev biasa
tetap berlaku:

```powershell
# backend
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# frontend (terminal lain)
cd frontend
npm run dev
```

Auto-seeder akan jalan otomatis bila env `VERCEL` tidak ada (= lokal).

---

## 🔧 Troubleshooting

| Gejala                                            | Solusi |
|---------------------------------------------------|--------|
| `psycopg.OperationalError: connection refused`    | Cek `DATABASE_URL` di env Vercel. Pastikan pakai port `6543` (pooler). |
| `relation "rute_trayek" does not exist`           | Belum jalankan `01_schema.sql` di Supabase SQL Editor. |
| Endpoint `/api/v1/...` 404                        | Cek `vercel.json` ada di root repo. Cek log Build di Vercel dashboard. |
| Build gagal `ModuleNotFoundError: backend`        | Pastikan `backend/__init__.py` ada (file kosong). |
| `prepared statement "xxx" already exists`         | Pool mode salah. Pakai **Transaction** mode di Supabase (bukan Session). |
| Frontend tampil tapi data kosong                  | Belum di-seed. Panggil `POST /api/v1/admin/seed`. |
| CORS error                                        | Tambahkan domain Vercel-mu ke `CORS_ORIGINS` env var. |

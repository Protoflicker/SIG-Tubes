# ============================================================
# START.PS1 - WebGIS Trans Metro Pekanbaru
# Jalankan dari root folder: d:\PROJECTSIG\SIG-TUBES
# Perintah: .\start.ps1
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND = Join-Path $ROOT "backend"
$FRONTEND = Join-Path $ROOT "frontend"
$BACKEND_VENV = Join-Path $BACKEND ".venv\Scripts\Activate.ps1"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  WebGIS Trans Metro Pekanbaru - Dev Server Startup  " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ── Cek .env backend ────────────────────────────────────────
$envFile = Join-Path $BACKEND ".env"
if (-Not (Test-Path $envFile)) {
    Write-Host "[ERROR] File backend\.env tidak ditemukan!" -ForegroundColor Red
    Write-Host "        Salin dari backend\.env.example dan isi DATABASE_URL." -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] File .env ditemukan." -ForegroundColor Green

# ── Cek virtual environment backend ─────────────────────────
if (-Not (Test-Path $BACKEND_VENV)) {
    Write-Host ""
    Write-Host "[INFO] Virtual environment backend tidak ditemukan." -ForegroundColor Yellow
    Write-Host "       Membuat .venv baru di backend\..." -ForegroundColor Yellow
    Set-Location $BACKEND
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Gagal membuat virtual environment. Pastikan Python 3.11+ terinstall." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Virtual environment berhasil dibuat." -ForegroundColor Green
}

# ── Install / update dependencies backend ───────────────────
Write-Host ""
Write-Host "[INFO] Menginstall/memperbarui dependency backend..." -ForegroundColor Yellow
$pip = Join-Path $BACKEND ".venv\Scripts\pip.exe"
& $pip install -r (Join-Path $BACKEND "requirements.txt") --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] pip install gagal. Periksa requirements.txt atau koneksi internet." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependency backend siap." -ForegroundColor Green

# ── Install dependency frontend ──────────────────────────────
Write-Host ""
Write-Host "[INFO] Menginstall dependency frontend (npm)..." -ForegroundColor Yellow
Set-Location $FRONTEND
npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install gagal. Pastikan Node.js terinstall." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependency frontend siap." -ForegroundColor Green

# ── Jalankan Backend di terminal baru ───────────────────────
Write-Host ""
Write-Host "[START] Menjalankan Backend FastAPI di port 8000..." -ForegroundColor Cyan
$uvicorn = Join-Path $BACKEND ".venv\Scripts\uvicorn.exe"
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "Set-Location '$BACKEND'; & '$uvicorn' app.main:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

# ── Jalankan Frontend di terminal baru ──────────────────────
Write-Host "[START] Menjalankan Frontend Vite di port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "Set-Location '$FRONTEND'; npm run dev"

# ── Info Akses ───────────────────────────────────────────────
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Semua server sedang berjalan!" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend   : http://localhost:5173" -ForegroundColor White
Write-Host "  Backend    : http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  API Docs   : http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tutup kedua terminal baru untuk menghentikan server." -ForegroundColor Yellow
Write-Host ""

# 📊 Panduan Sumber Data untuk PostGIS

Dokumen ini berisi daftar sumber data resmi beserta **cara import ke PostgreSQL/PostGIS**.

---

## 🗄️ Format Data yang Didukung PostGIS

| Format | Extension | Import Tool | Langsung ke DB? |
|--------|-----------|-------------|-----------------|
| **SQL/WKT** | .sql | psql | ✅ Ya |
| **GeoJSON** | .geojson | ogr2ogr | ✅ Ya |
| **Shapefile** | .shp | shp2pgsql / ogr2ogr | ✅ Ya |
| **CSV + Koordinat** | .csv | COPY + ST_MakePoint | ✅ Ya |
| **GeoPackage** | .gpkg | ogr2ogr | ✅ Ya |
| **KML/KMZ** | .kml | ogr2ogr | ⚠️ Perlu konversi |
| **GPX** | .gpx | ogr2ogr | ⚠️ Perlu konversi |
| **OSM/PBF** | .osm, .pbf | osm2pgsql | ⚠️ Perlu konversi |

---

## 🇮🇩 Sumber Data Resmi Indonesia

### 1. INA-Geoportal (Badan Informasi Geospasial)

**URL:** https://tanahair.indonesia.go.id/portal-web/unduh

**Format Download:** Shapefile (.shp)

**Data Tersedia:**
- Peta RBI (Rupa Bumi Indonesia) 1:25.000 dan 1:50.000
- Batas administrasi (provinsi, kabupaten, kecamatan, desa)
- Jaringan jalan, sungai, bangunan
- Tutupan lahan

**Import ke PostGIS:**
```bash
# Menggunakan shp2pgsql
shp2pgsql -s 4326 -I -W UTF-8 BATAS_DESA_AR.shp public.batas_desa | psql -d sig_parkir

# Menggunakan ogr2ogr
ogr2ogr -f "PostgreSQL" PG:"host=localhost dbname=sig_parkir user=postgres password=xxx" \
    BATAS_DESA_AR.shp -nln batas_desa -lco GEOMETRY_NAME=geom
```

---

### 2. Satu Data Lampung

**URL:** https://opendata.lampungprov.go.id

**Format Download:** CSV, JSON, XLS

**Import CSV dengan Koordinat:**
```sql
-- 1. Buat tabel staging
CREATE TABLE staging_poi (
    nama VARCHAR(255),
    alamat TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- 2. Import CSV
COPY staging_poi FROM '/path/to/data.csv' WITH CSV HEADER;

-- 3. Konversi ke tabel dengan geometry
CREATE TABLE poi AS
SELECT 
    nama,
    alamat,
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) AS geom
FROM staging_poi;

-- 4. Buat spatial index
CREATE INDEX idx_poi_geom ON poi USING GIST(geom);
```

---

### 3. Geoportal Provinsi Lampung

**URL:** https://geoportal.lampungprov.go.id

**Format:** WMS/WFS Services (untuk referensi/digitasi)

**Cara Akses via QGIS:**
1. Buka QGIS → Layer → Add Layer → Add WMS/WMTS Layer
2. Masukkan URL service
3. Digitasi manual atau export ke format lain

---

### 4. BPS Lampung

**URL:** https://lampung.bps.go.id

**Format Download:** XLS, CSV

**Import untuk Data Atribut:**
```sql
-- Data statistik (non-spasial) bisa di-join dengan tabel spasial
CREATE TABLE statistik_kecamatan (
    kode_kecamatan VARCHAR(10) PRIMARY KEY,
    nama_kecamatan VARCHAR(100),
    jumlah_penduduk INTEGER,
    luas_km2 DECIMAL(10,2)
);

COPY statistik_kecamatan FROM '/path/to/statistik.csv' WITH CSV HEADER;

-- Join dengan tabel spasial
SELECT w.*, s.jumlah_penduduk
FROM wilayah w
JOIN statistik_kecamatan s ON w.kode = s.kode_kecamatan;
```

---

## 🌍 Sumber Data Open Source

### 5. OpenStreetMap via Overpass Turbo

**URL:** https://overpass-turbo.eu

**Format Export:** GeoJSON (recommended), GPX, KML

**Query Contoh - Parkir di Bandar Lampung:**
```
[out:json][timeout:60];
area["name"="Bandar Lampung"]->.searchArea;
(
  node["amenity"="parking"](area.searchArea);
  way["amenity"="parking"](area.searchArea);
);
out body;
>;
out skel qt;
```

**Query Contoh - Rumah Sakit:**
```
[out:json][timeout:60];
area["name"="Bandar Lampung"]->.searchArea;
(
  node["amenity"="hospital"](area.searchArea);
  way["amenity"="hospital"](area.searchArea);
);
out body;
>;
out skel qt;
```

**Query Contoh - Terminal & Stasiun:**
```
[out:json][timeout:60];
area["name"="Bandar Lampung"]->.searchArea;
(
  node["amenity"="bus_station"](area.searchArea);
  node["railway"="station"](area.searchArea);
  node["aeroway"="aerodrome"](area.searchArea);
);
out body;
>;
out skel qt;
```

**Langkah Export:**
1. Jalankan query di Overpass Turbo
2. Klik **Export** → **Download as GeoJSON**
3. Import ke PostGIS (lihat bagian Konversi)

---

### 6. Geofabrik (OSM Extract Indonesia)

**URL:** https://download.geofabrik.de/asia/indonesia.html

**Format Download:** Shapefile, OSM PBF

**Import Shapefile:**
```bash
# Download dan extract
wget https://download.geofabrik.de/asia/indonesia-latest-free.shp.zip
unzip indonesia-latest-free.shp.zip

# Import layer tertentu
shp2pgsql -s 4326 -I gis_osm_pois_free_1.shp public.osm_pois | psql -d sig_parkir
```

**Import OSM PBF (untuk data lengkap):**
```bash
# Install osm2pgsql
sudo apt install osm2pgsql

# Download data
wget https://download.geofabrik.de/asia/indonesia-latest.osm.pbf

# Import (butuh RAM besar untuk Indonesia penuh)
osm2pgsql -d sig_parkir -U postgres -H localhost \
    --create --slim -G --hstore \
    indonesia-latest.osm.pbf
```

---

### 7. Google Places API

**URL:** https://developers.google.com/maps/documentation/places

**Format Output:** JSON

**Cara Mendapatkan Data:**
```python
import requests
import json

API_KEY = "YOUR_API_KEY"
url = f"https://maps.googleapis.com/maps/api/place/textsearch/json"
params = {
    "query": "parkir mall bandar lampung",
    "key": API_KEY
}

response = requests.get(url, params=params)
data = response.json()

# Simpan ke file
with open("parkir_google.json", "w") as f:
    json.dump(data, f)
```

**Konversi JSON ke SQL:**
```python
import json

with open("parkir_google.json") as f:
    data = json.load(f)

with open("parkir_google.sql", "w") as sql:
    for place in data.get("results", []):
        nama = place["name"].replace("'", "''")
        alamat = place.get("formatted_address", "").replace("'", "''")
        lat = place["geometry"]["location"]["lat"]
        lng = place["geometry"]["location"]["lng"]
        rating = place.get("rating", "NULL")
        
        sql.write(f"""
INSERT INTO parkir (nama, alamat, rating, geom)
VALUES ('{nama}', '{alamat}', {rating}, 
        ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326));
""")
```

---

## 🔧 Panduan Konversi Format

### GeoJSON → PostGIS

**Menggunakan ogr2ogr (GDAL):**
```bash
# Install GDAL
sudo apt install gdal-bin

# Import GeoJSON
ogr2ogr -f "PostgreSQL" \
    PG:"host=localhost dbname=sig_parkir user=postgres password=postgres123" \
    data.geojson \
    -nln nama_tabel \
    -lco GEOMETRY_NAME=geom \
    -lco FID=id
```

**Menggunakan Python + psycopg2:**
```python
import json
import psycopg2

# Baca GeoJSON
with open("data.geojson") as f:
    geojson = json.load(f)

# Koneksi database
conn = psycopg2.connect(
    host="localhost",
    database="sig_parkir",
    user="postgres",
    password="postgres123"
)
cur = conn.cursor()

# Insert setiap feature
for feature in geojson["features"]:
    props = feature["properties"]
    geom_json = json.dumps(feature["geometry"])
    
    cur.execute("""
        INSERT INTO parkir (nama, geom)
        VALUES (%s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326))
    """, (props.get("name"), geom_json))

conn.commit()
cur.close()
conn.close()
```

---

### Shapefile → PostGIS

**Menggunakan shp2pgsql:**
```bash
# Opsi umum:
# -s SRID    : Set SRID (4326 untuk WGS84)
# -I         : Buat spatial index
# -W UTF-8   : Encoding karakter
# -a         : Append ke tabel existing
# -d         : Drop dan create ulang tabel

# Contoh: Import dengan create tabel baru
shp2pgsql -s 4326 -I -W UTF-8 batas_kecamatan.shp public.wilayah | psql -d sig_parkir -U postgres

# Contoh: Append ke tabel existing
shp2pgsql -s 4326 -a -W UTF-8 data_tambahan.shp public.wilayah | psql -d sig_parkir -U postgres
```

**Menggunakan ogr2ogr:**
```bash
ogr2ogr -f "PostgreSQL" \
    PG:"host=localhost dbname=sig_parkir user=postgres password=postgres123" \
    batas_kecamatan.shp \
    -nln wilayah \
    -nlt MULTIPOLYGON \
    -lco GEOMETRY_NAME=geom
```

---

### CSV dengan Koordinat → PostGIS

**Format CSV yang Diharapkan:**
```csv
nama,alamat,latitude,longitude,tipe
Mall Boemi Kedaton,Jl. Teuku Umar,-5.3821986,105.2599041,mall
RSUD Abdul Moeloek,Jl. Dr. Rivai,-5.403039,105.258434,rumah_sakit
```

**Import Langsung dengan SQL:**
```sql
-- 1. Buat tabel dengan geometry
CREATE TABLE parkir_import (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255),
    alamat TEXT,
    tipe VARCHAR(50),
    geom GEOMETRY(Point, 4326)
);

-- 2. Buat tabel staging
CREATE TEMP TABLE staging (
    nama VARCHAR(255),
    alamat TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    tipe VARCHAR(50)
);

-- 3. Import CSV
COPY staging FROM '/path/to/data.csv' WITH CSV HEADER;

-- 4. Insert ke tabel utama dengan konversi geometry
INSERT INTO parkir_import (nama, alamat, tipe, geom)
SELECT 
    nama,
    alamat,
    tipe,
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
FROM staging;

-- 5. Buat index
CREATE INDEX idx_parkir_import_geom ON parkir_import USING GIST(geom);
```

---

### KML/KMZ → PostGIS

```bash
# KML langsung
ogr2ogr -f "PostgreSQL" \
    PG:"host=localhost dbname=sig_parkir user=postgres password=postgres123" \
    data.kml \
    -nln nama_tabel

# KMZ (extract dulu)
unzip data.kmz -d extracted/
ogr2ogr -f "PostgreSQL" \
    PG:"host=localhost dbname=sig_parkir user=postgres password=postgres123" \
    extracted/doc.kml \
    -nln nama_tabel
```

---

### GPX → PostGIS

```bash
ogr2ogr -f "PostgreSQL" \
    PG:"host=localhost dbname=sig_parkir user=postgres password=postgres123" \
    track.gpx \
    -nln gps_tracks
```

---

## 📋 Checklist Import Data

- [ ] Pastikan SRID konsisten (gunakan EPSG:4326 / WGS84)
- [ ] Buat spatial index setelah import: `CREATE INDEX idx_geom ON table USING GIST(geom);`
- [ ] Verifikasi data: `SELECT ST_IsValid(geom) FROM table;`
- [ ] Cek extent data: `SELECT ST_Extent(geom) FROM table;`
- [ ] Hapus geometry invalid: `DELETE FROM table WHERE NOT ST_IsValid(geom);`
- [ ] Catat sumber dan tanggal akses data

---

## 🔗 Tools yang Diperlukan

### Instalasi di Ubuntu/Debian
```bash
# GDAL (ogr2ogr)
sudo apt install gdal-bin

# PostGIS tools (shp2pgsql)
sudo apt install postgis

# osm2pgsql (untuk OSM data)
sudo apt install osm2pgsql

# Python libraries
pip install psycopg2-binary geopandas fiona shapely
```

### Instalasi di Windows
- **GDAL:** Download dari https://www.gisinternals.com/release.php
- **QGIS:** Sudah termasuk GDAL (gunakan OSGeo4W Shell)
- **PostGIS:** Install bersama PostgreSQL dari https://postgis.net/install/

---

## 📚 Referensi

- PostGIS Documentation: https://postgis.net/docs/
- GDAL/OGR Formats: https://gdal.org/drivers/vector/
- shp2pgsql Manual: https://postgis.net/docs/using_postgis_dbmanagement.html#shp2pgsql_usage
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API

---

*Dokumen ini disusun untuk mata kuliah Sistem Informasi Geografis (IF4051)*
*Program Studi Teknik Informatika - Institut Teknologi Sumatera*

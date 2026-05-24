import { useState } from "react";

export default function Sidebar({
  koridorList,
  selectedKoridor,
  onToggleKoridor,
  onToggleAll,
  showRusak,
  onToggleRusak,
  onSearchRadius,
  radiusResult,
  onClearRadius,
}) {
  const [lat, setLat]       = useState("");
  const [lng, setLng]       = useState("");
  const [radius, setRadius] = useState(500);
  const [loading, setLoading] = useState(false);

  function handleGPS() {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung Geolocation");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLoading(false);
      },
      (err) => { alert("Gagal ambil GPS: " + err.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!lat || !lng) { alert("Latitude & longitude wajib diisi"); return; }
    setLoading(true);
    try {
      await onSearchRadius(parseFloat(lat), parseFloat(lng), parseInt(radius, 10));
    } catch (err) { alert("Error: " + err.message); }
    finally { setLoading(false); }
  }

  function badgeClass(k) {
    return k === "Baik" ? "badge badge-baik"
         : k === "Rusak" ? "badge badge-rusak"
         : "badge badge-terbengkalai";
  }

  const allChecked = koridorList.length > 0 && selectedKoridor.size === koridorList.length;

  return (
    <aside className="sidebar">
      {/* ===== Pencarian Radius ===== */}
      <div className="card">
        <h2>Pencarian Halte Terdekat</h2>
        <form onSubmit={handleSearch}>
          <label>Latitude</label>
          <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)}
                 placeholder="0.5083" />
          <label>Longitude</label>
          <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)}
                 placeholder="101.4458" />
          <label>Radius: {radius} meter</label>
          <input type="range" min="100" max="5000" step="50"
                 value={radius} onChange={(e) => setRadius(e.target.value)} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" onClick={handleGPS} disabled={loading}>
              Pakai GPS
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Mencari..." : "Cari"}
            </button>
            {radiusResult && (
              <button type="button" className="btn btn-secondary" onClick={onClearRadius}>
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ===== Hasil radius ===== */}
      {radiusResult && (
        <div className="card">
          <h2>Hasil ({radiusResult.halte.length})</h2>
          {radiusResult.halte.length === 0 ? (
            <div className="muted" style={{ fontSize: ".8rem", color: "#6b7280" }}>
              Tidak ada halte dalam radius {radiusResult.radius} m.
            </div>
          ) : (
            <ul className="result-list">
              {radiusResult.halte.map((h) => (
                <li key={h.id_halte}>
                  <div><b>{h.nama_halte}</b> <span className={badgeClass(h.kondisi_fisik)}>{h.kondisi_fisik}</span></div>
                  <div className="muted">
                    {h.kode_trayek || "—"} · {Math.round(h.jarak_meter)} m
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ===== Filter Koridor ===== */}
      <div className="card">
        <h2>Filter Koridor TMP</h2>
        <label className="checkbox-row">
          <input type="checkbox" checked={allChecked}
                 onChange={(e) => onToggleAll(e.target.checked)} />
          <span><b>Semua Koridor</b></span>
        </label>
        <div style={{ borderTop: "1px solid #e5e7eb", margin: "6px 0" }} />
        {koridorList.map((k) => (
          <label key={k.id_koridor} className="checkbox-row">
            <input type="checkbox"
                   checked={selectedKoridor.has(k.id_koridor)}
                   onChange={() => onToggleKoridor(k.id_koridor)} />
            <span className="swatch" style={{ background: k.warna_peta }} />
            <span>{k.kode_trayek} · {k.titik_awal} – {k.titik_akhir}</span>
          </label>
        ))}
        <div style={{ borderTop: "1px solid #e5e7eb", margin: "8px 0 4px" }} />
        <label className="checkbox-row">
          <input type="checkbox" checked={showRusak}
                 onChange={(e) => onToggleRusak(e.target.checked)} />
          <span>Tampilkan halte rusak / terbengkalai</span>
        </label>
      </div>

      <div className="card" style={{ fontSize: ".75rem", color: "#6b7280" }}>
        Sumber: Proposal SIG Kelompok 1 (Trans Metro Pekanbaru), OSM, Dishub Pekanbaru.
        Backend: FastAPI + PostGIS. Frontend: React + Leaflet.
      </div>
    </aside>
  );
}

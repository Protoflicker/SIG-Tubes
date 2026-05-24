import { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Circle } from "react-leaflet";

// Pekanbaru pusat: dekat MPP/Plaza Ramayana
const PEKANBARU_CENTER = [0.5071, 101.4478];

function colorByKondisi(k) {
  if (k === "Baik") return "#16a34a";
  if (k === "Rusak") return "#f59e0b";
  return "#dc2626"; // Terbengkalai
}

function badgeClass(k) {
  return k === "Baik" ? "badge badge-baik"
       : k === "Rusak" ? "badge badge-rusak"
       : "badge badge-terbengkalai";
}

export default function MapView({
  koridorFc, halteFc, selectedKoridor, showRusak, radiusResult,
}) {
  // Filter koridor sesuai checkbox
  const koridorFiltered = useMemo(() => ({
    type: "FeatureCollection",
    features: koridorFc.features.filter((f) => selectedKoridor.has(f.properties.id_koridor)),
  }), [koridorFc, selectedKoridor]);

  // Filter halte: tampil jika koridor aktif, dan respect showRusak
  const halteFiltered = useMemo(() => ({
    type: "FeatureCollection",
    features: halteFc.features.filter((f) => {
      const p = f.properties;
      if (p.id_koridor_pelintas && !selectedKoridor.has(p.id_koridor_pelintas)) return false;
      if (!showRusak && (p.kondisi_fisik === "Rusak" || p.kondisi_fisik === "Terbengkalai")) return false;
      return true;
    }),
  }), [halteFc, selectedKoridor, showRusak]);

  return (
    <MapContainer center={PEKANBARU_CENTER} zoom={12} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* === Garis koridor === */}
      <GeoJSON
        key={"k-" + Array.from(selectedKoridor).sort().join(",")}
        data={koridorFiltered}
        style={(f) => ({
          color: f.properties.warna_peta || "#3388ff",
          weight: 5,
          opacity: 0.75,
        })}
        onEachFeature={(feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(`
            <div class="popup-row">
              <b>${p.kode_trayek} · ${p.nama_trayek}</b><br/>
              ${p.titik_awal} ↔ ${p.titik_akhir}<br/>
              Panjang: <b>${p.panjang_km ?? "?"} km</b>
            </div>
          `);
        }}
      />

      {/* === Halte === */}
      {halteFiltered.features.map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        const p = f.properties;
        return (
          <CircleMarker
            key={p.id_halte}
            center={[lat, lng]}
            radius={6}
            pathOptions={{
              color: "white", weight: 2,
              fillColor: colorByKondisi(p.kondisi_fisik),
              fillOpacity: 0.95,
            }}
          >
            <Popup>
              <div className="popup-row">
                <b>{p.nama_halte}</b>{" "}
                <span className={badgeClass(p.kondisi_fisik)}>{p.kondisi_fisik}</span><br/>
                {p.nama_jalan && <>📍 {p.nama_jalan}<br/></>}
                {p.kode_trayek && <>🚌 {p.kode_trayek} - {p.nama_trayek}<br/></>}
                {p.keterangan && <em style={{ color: "#6b7280" }}>{p.keterangan}</em>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* === Lingkaran radius hasil pencarian === */}
      {radiusResult && (
        <>
          <Circle
            center={[radiusResult.lat, radiusResult.lng]}
            radius={radiusResult.radius}
            pathOptions={{ color: "#1e3a8a", fillOpacity: 0.08, weight: 2, dashArray: "4 6" }}
          />
          <CircleMarker
            center={[radiusResult.lat, radiusResult.lng]}
            radius={8}
            pathOptions={{ color: "white", weight: 3, fillColor: "#1e3a8a", fillOpacity: 1 }}
          >
            <Popup>
              <div className="popup-row">
                <b>Titik Pencarian</b><br/>
                Lat: {radiusResult.lat.toFixed(6)}<br/>
                Lng: {radiusResult.lng.toFixed(6)}<br/>
                Radius: {radiusResult.radius} m
              </div>
            </Popup>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}

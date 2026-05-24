import { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import Sidebar from "./components/Sidebar.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import { api } from "./api.js";

export default function App() {
  const [view, setView]               = useState("map");      // "map" | "admin"
  const [koridorList, setKoridorList] = useState([]);
  const [selectedKoridor, setSelectedKoridor] = useState(new Set());
  const [showRusak, setShowRusak]     = useState(true);

  const [halteFc, setHalteFc]         = useState({ type: "FeatureCollection", features: [] });
  const [koridorFc, setKoridorFc]     = useState({ type: "FeatureCollection", features: [] });

  const [radiusResult, setRadiusResult] = useState(null);     // { lat, lng, radius, halte: [] }

  // Initial load
  async function reload() {
    const [k, kf, hf] = await Promise.all([
      api.listKoridor(), api.koridorGeojsonAll(), api.halteGeojson(),
    ]);
    setKoridorList(k);
    setKoridorFc(kf);
    setHalteFc(hf);
    if (selectedKoridor.size === 0) {
      setSelectedKoridor(new Set(k.map((x) => x.id_koridor)));
    }
  }

  useEffect(() => { reload().catch(console.error); }, []);

  function toggleKoridor(id) {
    setSelectedKoridor((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll(checked) {
    setSelectedKoridor(checked ? new Set(koridorList.map((k) => k.id_koridor)) : new Set());
  }

  async function searchRadius(lat, lng, radius) {
    const halte = await api.halteRadius(lat, lng, radius);
    setRadiusResult({ lat, lng, radius, halte });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>WebGIS Trans Metro Pekanbaru <span className="tag">SIG ITERA</span></h1>
        </div>
        <nav className="nav">
          <button className={view === "map" ? "active" : ""}   onClick={() => setView("map")}>Peta</button>
          <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>Admin CRUD</button>
        </nav>
      </header>

      {view === "map" ? (
        <div className="body">
          <Sidebar
            koridorList={koridorList}
            selectedKoridor={selectedKoridor}
            onToggleKoridor={toggleKoridor}
            onToggleAll={toggleAll}
            showRusak={showRusak}
            onToggleRusak={setShowRusak}
            onSearchRadius={searchRadius}
            radiusResult={radiusResult}
            onClearRadius={() => setRadiusResult(null)}
          />
          <div className="map-area">
            <MapView
              koridorFc={koridorFc}
              halteFc={halteFc}
              selectedKoridor={selectedKoridor}
              showRusak={showRusak}
              radiusResult={radiusResult}
            />
            <div className="legend">
              <h3>Legenda Kondisi Halte</h3>
              <div className="item"><span className="dot" style={{ background: "#16a34a" }} /> Baik</div>
              <div className="item"><span className="dot" style={{ background: "#f59e0b" }} /> Rusak</div>
              <div className="item"><span className="dot" style={{ background: "#dc2626" }} /> Terbengkalai</div>
            </div>
          </div>
        </div>
      ) : (
        <AdminPanel koridorList={koridorList} onChanged={reload} />
      )}
    </div>
  );
}

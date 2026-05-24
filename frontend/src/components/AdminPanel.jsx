import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function AdminPanel({ koridorList, onChanged }) {
  const [tab, setTab] = useState("halte");

  return (
    <div className="admin">
      <h2>Panel Administrasi CRUD</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button
          className="btn" onClick={() => setTab("halte")}
          style={{ background: tab === "halte" ? "#1e3a8a" : "#6b7280", color: "white", padding: "8px 14px", border: 0, borderRadius: 6 }}
        >Halte</button>
        <button
          className="btn" onClick={() => setTab("armada")}
          style={{ background: tab === "armada" ? "#1e3a8a" : "#6b7280", color: "white", padding: "8px 14px", border: 0, borderRadius: 6 }}
        >Armada</button>
      </div>

      {tab === "halte"
        ? <HalteCrud koridorList={koridorList} onChanged={onChanged} />
        : <ArmadaCrud koridorList={koridorList} onChanged={onChanged} />}
    </div>
  );
}

// ============================================================
// CRUD HALTE
// ============================================================
function HalteCrud({ koridorList, onChanged }) {
  const [list, setList]       = useState([]);
  const [editing, setEditing] = useState(null);
  const empty = {
    nama_halte: "", nama_jalan: "", id_koridor_pelintas: "",
    kondisi_fisik: "Baik", keterangan: "",
    latitude: "", longitude: "",
  };
  const [form, setForm] = useState(empty);

  async function reload() { setList(await api.listHalte()); }
  useEffect(() => { reload().catch(console.error); }, []);

  function onEdit(h) {
    setEditing(h.id_halte);
    setForm({
      nama_halte:          h.nama_halte || "",
      nama_jalan:          h.nama_jalan || "",
      id_koridor_pelintas: h.id_koridor_pelintas || "",
      kondisi_fisik:       h.kondisi_fisik,
      keterangan:          h.keterangan || "",
      latitude:            h.latitude,
      longitude:           h.longitude,
    });
  }

  function onCancel() { setEditing(null); setForm(empty); }

  async function onSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      id_koridor_pelintas: form.id_koridor_pelintas ? parseInt(form.id_koridor_pelintas, 10) : null,
      latitude:  parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
    };
    try {
      if (editing) await api.updateHalte(editing, payload);
      else         await api.createHalte(payload);
      onCancel();
      await reload();
      onChanged?.();
    } catch (err) { alert(err.message); }
  }

  async function onDelete(id) {
    if (!confirm("Yakin hapus halte ini?")) return;
    try { await api.deleteHalte(id); await reload(); onChanged?.(); }
    catch (err) { alert(err.message); }
  }

  return (
    <>
      <h3>{editing ? `Edit Halte #${editing}` : "Tambah Halte Baru"}</h3>
      <form onSubmit={onSubmit} style={{ background: "white", padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <div className="form-grid">
          <div className="full">
            <label>Nama Halte</label>
            <input style={{ width: "100%", padding: 6 }} required
              value={form.nama_halte}
              onChange={(e) => setForm({ ...form, nama_halte: e.target.value })} />
          </div>
          <div>
            <label>Nama Jalan</label>
            <input style={{ width: "100%", padding: 6 }}
              value={form.nama_jalan}
              onChange={(e) => setForm({ ...form, nama_jalan: e.target.value })} />
          </div>
          <div>
            <label>Koridor</label>
            <select style={{ width: "100%", padding: 6 }}
              value={form.id_koridor_pelintas}
              onChange={(e) => setForm({ ...form, id_koridor_pelintas: e.target.value })}>
              <option value="">— Tanpa koridor —</option>
              {koridorList.map((k) => (
                <option key={k.id_koridor} value={k.id_koridor}>
                  {k.kode_trayek} — {k.nama_trayek}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Latitude</label>
            <input type="number" step="any" required style={{ width: "100%", padding: 6 }}
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
          </div>
          <div>
            <label>Longitude</label>
            <input type="number" step="any" required style={{ width: "100%", padding: 6 }}
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
          </div>
          <div>
            <label>Kondisi Fisik</label>
            <select style={{ width: "100%", padding: 6 }}
              value={form.kondisi_fisik}
              onChange={(e) => setForm({ ...form, kondisi_fisik: e.target.value })}>
              <option>Baik</option><option>Rusak</option><option>Terbengkalai</option>
            </select>
          </div>
          <div className="full">
            <label>Keterangan</label>
            <textarea rows={2} style={{ width: "100%", padding: 6 }}
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
          </div>
        </div>
        <button type="submit" className="btn" style={{ background: "#1e3a8a", color: "white", padding: "8px 14px", border: 0, borderRadius: 6, fontWeight: 600 }}>
          {editing ? "Simpan" : "Tambah"}
        </button>
        {editing && (
          <button type="button" onClick={onCancel}
            style={{ marginLeft: 8, background: "#6b7280", color: "white", padding: "8px 14px", border: 0, borderRadius: 6 }}>
            Batal
          </button>
        )}
      </form>

      <h3>Daftar Halte ({list.length})</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Nama</th><th>Koridor</th><th>Kondisi</th><th>Koord</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {list.map((h) => (
            <tr key={h.id_halte}>
              <td>{h.id_halte}</td>
              <td>{h.nama_halte}<div style={{ color: "#6b7280", fontSize: ".75rem" }}>{h.nama_jalan}</div></td>
              <td>{h.kode_trayek || <em style={{ color: "#9ca3af" }}>—</em>}</td>
              <td><span className={`badge badge-${h.kondisi_fisik.toLowerCase()}`}>{h.kondisi_fisik}</span></td>
              <td style={{ fontFamily: "monospace", fontSize: ".75rem" }}>
                {h.latitude.toFixed(5)}, {h.longitude.toFixed(5)}
              </td>
              <td>
                <div className="actions">
                  <button onClick={() => onEdit(h)} style={{ background: "#2563eb" }}>Edit</button>
                  <button onClick={() => onDelete(h.id_halte)} style={{ background: "#dc2626" }}>Hapus</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ============================================================
// CRUD ARMADA
// ============================================================
function ArmadaCrud({ koridorList, onChanged }) {
  const [list, setList]       = useState([]);
  const [editing, setEditing] = useState(null);
  const empty = {
    nomor_lambung: "", plat_nomor: "", tahun_perakitan: "",
    id_koridor_penugasan: "", status_operasional: "Beroperasi", keterangan: "",
  };
  const [form, setForm] = useState(empty);

  async function reload() { setList(await api.listArmada()); }
  useEffect(() => { reload().catch(console.error); }, []);

  function onEdit(a) {
    setEditing(a.id_bus);
    setForm({
      nomor_lambung:        a.nomor_lambung,
      plat_nomor:           a.plat_nomor || "",
      tahun_perakitan:      a.tahun_perakitan || "",
      id_koridor_penugasan: a.id_koridor_penugasan || "",
      status_operasional:   a.status_operasional,
      keterangan:           a.keterangan || "",
    });
  }
  function onCancel() { setEditing(null); setForm(empty); }

  async function onSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      tahun_perakitan:      form.tahun_perakitan ? parseInt(form.tahun_perakitan, 10) : null,
      id_koridor_penugasan: form.id_koridor_penugasan ? parseInt(form.id_koridor_penugasan, 10) : null,
    };
    try {
      if (editing) await api.updateArmada(editing, payload);
      else         await api.createArmada(payload);
      onCancel(); await reload(); onChanged?.();
    } catch (err) { alert(err.message); }
  }

  async function onDelete(id) {
    if (!confirm("Yakin hapus armada ini?")) return;
    try { await api.deleteArmada(id); await reload(); onChanged?.(); }
    catch (err) { alert(err.message); }
  }

  return (
    <>
      <h3>{editing ? `Edit Armada #${editing}` : "Tambah Armada Baru"}</h3>
      <form onSubmit={onSubmit} style={{ background: "white", padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <div className="form-grid">
          <div>
            <label>Nomor Lambung</label>
            <input required style={{ width: "100%", padding: 6 }}
              value={form.nomor_lambung} disabled={!!editing}
              onChange={(e) => setForm({ ...form, nomor_lambung: e.target.value })} />
          </div>
          <div>
            <label>Plat Nomor</label>
            <input style={{ width: "100%", padding: 6 }}
              value={form.plat_nomor}
              onChange={(e) => setForm({ ...form, plat_nomor: e.target.value })} />
          </div>
          <div>
            <label>Tahun Perakitan</label>
            <input type="number" min="1990" max="2100" style={{ width: "100%", padding: 6 }}
              value={form.tahun_perakitan}
              onChange={(e) => setForm({ ...form, tahun_perakitan: e.target.value })} />
          </div>
          <div>
            <label>Status Operasional</label>
            <select style={{ width: "100%", padding: 6 }}
              value={form.status_operasional}
              onChange={(e) => setForm({ ...form, status_operasional: e.target.value })}>
              <option>Beroperasi</option>
              <option>Mogok Subsidi BBM</option>
              <option>Rusak Berat</option>
            </select>
          </div>
          <div className="full">
            <label>Koridor Penugasan</label>
            <select style={{ width: "100%", padding: 6 }}
              value={form.id_koridor_penugasan}
              onChange={(e) => setForm({ ...form, id_koridor_penugasan: e.target.value })}>
              <option value="">— Tanpa koridor —</option>
              {koridorList.map((k) => (
                <option key={k.id_koridor} value={k.id_koridor}>
                  {k.kode_trayek} — {k.nama_trayek}
                </option>
              ))}
            </select>
          </div>
          <div className="full">
            <label>Keterangan</label>
            <textarea rows={2} style={{ width: "100%", padding: 6 }}
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
          </div>
        </div>
        <button type="submit" style={{ background: "#1e3a8a", color: "white", padding: "8px 14px", border: 0, borderRadius: 6, fontWeight: 600 }}>
          {editing ? "Simpan" : "Tambah"}
        </button>
        {editing && (
          <button type="button" onClick={onCancel}
            style={{ marginLeft: 8, background: "#6b7280", color: "white", padding: "8px 14px", border: 0, borderRadius: 6 }}>
            Batal
          </button>
        )}
      </form>

      <h3>Daftar Armada ({list.length})</h3>
      <table>
        <thead>
          <tr><th>ID</th><th>Lambung</th><th>Plat</th><th>Tahun</th><th>Koridor</th><th>Status</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.id_bus}>
              <td>{a.id_bus}</td>
              <td><b>{a.nomor_lambung}</b></td>
              <td>{a.plat_nomor || "—"}</td>
              <td>{a.tahun_perakitan || "—"}</td>
              <td>{a.kode_trayek || <em style={{ color: "#9ca3af" }}>—</em>}</td>
              <td style={{ fontSize: ".8rem" }}>{a.status_operasional}</td>
              <td>
                <div className="actions">
                  <button onClick={() => onEdit(a)} style={{ background: "#2563eb" }}>Edit</button>
                  <button onClick={() => onDelete(a.id_bus)} style={{ background: "#dc2626" }}>Hapus</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

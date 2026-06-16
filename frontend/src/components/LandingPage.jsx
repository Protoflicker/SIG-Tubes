import { useState } from "react";
import { api } from "../api.js";
import {
  IconBus, IconLock, IconUser, IconChevronRight,
  IconLoader, IconAlert, IconEye, IconEyeOff,
} from "./Icons.jsx";

export default function LandingPage({ onEnterUser, onEnterAdmin }) {
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(username, password);
      onEnterAdmin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-bg-blob blob-1" />
      <div className="landing-bg-blob blob-2" />

      <div className="landing-card">
        {/* ── Header ── */}
        <div className="landing-header">
          <div className="landing-logo">
            <IconBus size={32} color="white" />
          </div>
          <h1>WebGIS Trans Metro</h1>
          <p>Sistem Informasi Geografis Rute &amp; Halte Angkutan Umum Kota Pekanbaru</p>

          <div className="landing-stats">
            <div className="landing-stat-item">
              <span className="landing-stat-value">7</span>
              <span className="landing-stat-label">Koridor</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat-item">
              <span className="landing-stat-value">50+</span>
              <span className="landing-stat-label">Halte</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat-item">
              <span className="landing-stat-value">112</span>
              <span className="landing-stat-label">KM Jalur</span>
            </div>
          </div>
        </div>

        {/* ── Split ── */}
        <div className="landing-split">
          {/* User */}
          <div className="landing-user">
            <p className="landing-section-label">Akses Publik</p>
            <h2>Jelajahi Peta Interaktif</h2>
            <p>Lihat rute, cari halte terdekat, dan rencanakan perjalanan menggunakan Trans Metro Pekanbaru.</p>
            <button className="btn-explore" onClick={onEnterUser}>
              Mulai Eksplorasi
              <IconChevronRight size={16} />
            </button>
          </div>

          <div className="landing-divider" />

          {/* Admin */}
          <div className="landing-admin">
            <p className="landing-section-label">Admin Panel</p>
            <h2>Kelola Data Operasional</h2>
            <form onSubmit={handleLogin} className="login-form">
              {error && (
                <div className="login-error">
                  <IconAlert size={14} /> {error}
                </div>
              )}
              <div className="input-group">
                <IconUser size={15} />
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="input-group">
                <IconLock size={15} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "transparent", border: "none",
                    color: "var(--text-secondary)", cursor: "pointer",
                    padding: 0, display: "flex", flexShrink: 0,
                  }}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="btn-login">
                {loading
                  ? <><IconLoader size={15} /> Memverifikasi...</>
                  : "Login Admin"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

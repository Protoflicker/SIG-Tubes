import { useState } from "react";
import { api } from "../api.js";
import {
  IconBus, IconLock, IconUser, IconChevronRight,
  IconLoader, IconAlert, IconEye, IconEyeOff, IconArrowLeft
} from "./Icons.jsx";

export default function LandingPage({ onEnterUser, onEnterAdmin }) {
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogin, setShowLogin]     = useState(false);

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

      <div className="landing-card" style={{ maxWidth: "500px", margin: "0 auto" }}>
        {/* ✨ Header ✨ */}
        <div className="landing-header" style={{ paddingBottom: showLogin ? "24px" : "0" }}>
          <div className="landing-logo">
            <IconBus size={32} color="white" />
          </div>
          <h1>WebGIS Trans Metro Pekanbaru</h1>
          <p>Sistem Informasi Geografis Rute &amp; Halte Angkutan Umum Kota Pekanbaru</p>
        </div>

        <div className="landing-content">
          {!showLogin ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "32px 0 16px" }}>
              <button className="btn-explore" onClick={onEnterUser} style={{ width: "100%", maxWidth: "340px", justifyContent: "center", padding: "16px 24px", fontSize: "1rem" }}>
                Try WebGIS Trans Metro Pekanbaru
                <IconChevronRight size={18} />
              </button>
              
              <button 
                onClick={() => setShowLogin(true)} 
                style={{ 
                  background: "transparent", color: "var(--text-secondary)", border: "none", 
                  fontSize: "0.95rem", marginTop: "24px", display: "inline-flex", 
                  alignItems: "center", gap: "8px", cursor: "pointer",
                  padding: "8px 16px", borderRadius: "8px", transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                <IconUser size={16} /> Login as Admin
              </button>
            </div>
          ) : (
            <div className="landing-admin" style={{ paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
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

              <button 
                type="button" 
                onClick={() => setShowLogin(false)} 
                style={{ 
                  background: "transparent", color: "var(--text-secondary)", border: "none", 
                  fontSize: "0.9rem", marginTop: "20px", display: "flex", alignItems: "center", 
                  gap: "6px", justifyContent: "center", width: "100%", cursor: "pointer" 
                }}
              >
                <IconArrowLeft size={16} /> Kembali
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

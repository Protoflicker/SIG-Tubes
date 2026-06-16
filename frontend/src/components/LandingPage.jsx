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

      <div className="landing-card" style={{ maxWidth: "440px", margin: "0 auto", padding: "40px 32px" }}>
        <div className="landing-header" style={{ paddingBottom: showLogin ? "16px" : "0", marginBottom: "24px", transition: "padding 0.3s" }}>
          <div className="landing-logo">
            <IconBus size={32} color="white" />
          </div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "8px", fontWeight: 800 }}>WebGIS Trans Metro Pekanbaru</h1>
          <p style={{ fontSize: "0.95rem", margin: 0, color: "var(--text-secondary)" }}>Sistem Informasi Geografis Rute &amp; Halte Kota Pekanbaru</p>
        </div>

        <div className="landing-content" style={{ minHeight: "180px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {!showLogin ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", animation: "cardFadeIn 0.4s ease-out" }}>
              <button className="btn-explore" onClick={onEnterUser} style={{ width: "100%", justifyContent: "center", padding: "14px 24px", fontSize: "1rem", borderRadius: "14px" }}>
                Masuk ke Peta Publik
                <IconChevronRight size={18} />
              </button>
              
              <button 
                onClick={() => setShowLogin(true)} 
                style={{ 
                  background: "transparent", color: "var(--text-secondary)", border: "none", 
                  fontSize: "0.9rem", marginTop: "12px", display: "inline-flex", 
                  alignItems: "center", gap: "6px", cursor: "pointer",
                  padding: "8px 16px", borderRadius: "8px", transition: "all 0.2s", fontWeight: 600
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
              >
                <IconUser size={14} /> Login Administrator
              </button>
            </div>
          ) : (
            <div className="landing-admin" style={{ animation: "cardFadeIn 0.4s ease-out", paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
              <form onSubmit={handleLogin} className="login-form">
                {error && (
                  <div className="login-error" style={{ padding: "10px 14px", borderRadius: "10px", background: "#fee2e2", color: "#991b1b", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
                    <IconAlert size={14} /> {error}
                  </div>
                )}
                <div className="input-group" style={{ marginBottom: "12px" }}>
                  <IconUser size={15} />
                  <input
                    type="text"
                    placeholder="Username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ background: "var(--bg-primary)", padding: "12px 14px 12px 40px", borderRadius: "12px" }}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: "20px" }}>
                  <IconLock size={15} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ background: "var(--bg-primary)", padding: "12px 40px 12px 40px", borderRadius: "12px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: "transparent", border: "none",
                      color: "var(--text-secondary)", cursor: "pointer",
                      padding: 0, display: "flex", position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)"
                    }}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="btn-explore" style={{ width: "100%", justifyContent: "center", padding: "14px 24px", borderRadius: "12px" }}>
                  {loading
                    ? <><IconLoader size={15} className="spin" /> Memverifikasi...</>
                    : "Login"}
                </button>
              </form>

              <button 
                type="button" 
                onClick={() => { setShowLogin(false); setError(null); }} 
                style={{ 
                  background: "transparent", color: "var(--text-secondary)", border: "none", 
                  fontSize: "0.85rem", marginTop: "20px", display: "flex", alignItems: "center", 
                  gap: "6px", justifyContent: "center", width: "100%", cursor: "pointer", transition: "color 0.2s" 
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseOut={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
              >
                <IconArrowLeft size={14} /> Kembali ke halaman awal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

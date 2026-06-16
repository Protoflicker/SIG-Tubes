import { useState } from "react";
import { api } from "../api.js";
import {
  IconLock, IconUser, IconChevronRight,
  IconLoader, IconAlert, IconEye, IconEyeOff, IconMapPin, IconSearch, IconRoute
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

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, width: "100%" }}>
        
        <div className="landing-card landing-split" style={{ maxWidth: "980px", width: "95%", padding: 0, overflow: "hidden", background: "var(--bg-secondary)", borderRadius: "24px", boxShadow: "var(--shadow-outer)" }}>
          
          {/* Panel Kiri - Publik */}
          <div style={{ flex: 1.1, padding: "50px 40px", display: "flex", flexDirection: "column", justifyContent: "center", background: "rgba(var(--accent-rgb, 30,58,138), 0.02)", borderRight: "1px solid var(--border-color)" }}>
            
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <img src="/withtextblue.png" alt="Trans Metro Pekanbaru" className="logo-light" style={{ width: "240px", height: "auto" }} />
              <img src="/withtextorange.png" alt="Trans Metro Pekanbaru" className="logo-dark" style={{ width: "240px", height: "auto" }} />
            </div>
            
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "32px", textAlign: "center" }}>
              Geographic Information System for Trans Metro Pekanbaru. Navigate routes, find nearby stops, and plan your journey effortlessly.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "36px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "var(--text-primary)" }}>
                <div style={{ background: "var(--bg-primary)", padding: "10px", borderRadius: "12px", boxShadow: "var(--shadow-inner-sm)" }}>
                  <IconMapPin size={20} color="var(--accent-color)" />
                </div>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Interactive Route Mapping</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "var(--text-primary)" }}>
                <div style={{ background: "var(--bg-primary)", padding: "10px", borderRadius: "12px", boxShadow: "var(--shadow-inner-sm)" }}>
                  <IconSearch size={20} color="var(--accent-color)" />
                </div>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>Radius-based Stop Search</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "var(--text-primary)" }}>
                <div style={{ background: "var(--bg-primary)", padding: "10px", borderRadius: "12px", boxShadow: "var(--shadow-inner-sm)" }}>
                  <IconRoute size={20} color="var(--accent-color)" />
                </div>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>A to B Trip Planning</span>
              </div>
            </div>
            
            <button className="btn-explore" onClick={onEnterUser} style={{ padding: "16px 28px", fontSize: "1.05rem", borderRadius: "14px", width: "100%", justifyContent: "center", boxShadow: "0 8px 24px rgba(30,58,138,0.2)" }}>
              Try WebGIS Trans Metro Pekanbaru
              <IconChevronRight size={18} />
            </button>
          </div>

          {/* Panel Kanan - Admin */}
          <div style={{ flex: 1, padding: "50px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <img src="/withouttextblue.png" alt="Logo Admin" className="logo-light" style={{ width: "64px", height: "auto" }} />
              <img src="/withouttextorange.png" alt="Logo Admin" className="logo-dark" style={{ width: "64px", height: "auto" }} />
            </div>

            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)", textAlign: "center" }}>Admin Panel</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "32px", textAlign: "center" }}>Login to manage bus routes and stops operations.</p>

            <form onSubmit={handleLogin} className="login-form">
              {error && (
                <div className="login-error" style={{ padding: "10px 14px", borderRadius: "10px", background: "#fee2e2", color: "#991b1b", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
                  <IconAlert size={14} /> {error}
                </div>
              )}
              
              <div className="input-group" style={{ marginBottom: "16px" }}>
                <IconUser size={15} />
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ background: "var(--bg-primary)", padding: "14px 14px 14px 44px", borderRadius: "12px" }}
                />
              </div>
              
              <div className="input-group" style={{ marginBottom: "28px" }}>
                <IconLock size={15} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ background: "var(--bg-primary)", padding: "14px 44px 14px 44px", borderRadius: "12px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "transparent", border: "none",
                    color: "var(--text-secondary)", cursor: "pointer",
                    padding: 0, display: "flex", position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)"
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              
              <button type="submit" disabled={loading} className="btn-explore" style={{ width: "100%", justifyContent: "center", padding: "14px 24px", borderRadius: "12px", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-inner-sm)", transition: "all 0.2s" }}>
                {loading
                  ? <><IconLoader size={15} className="spin" /> Verifying...</>
                  : "Login as Admin"}
              </button>
            </form>
          </div>

        </div>

        <div style={{ marginTop: "28px", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.8 }}>
          Made by Kelompok 1 SIG
        </div>

      </div>
    </div>
  );
}

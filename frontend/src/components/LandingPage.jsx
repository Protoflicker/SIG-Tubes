import { useState } from "react";
import { api } from "../api.js";
import {
  IconLock, IconUser, IconChevronRight,
  IconLoader, IconAlert, IconEye, IconEyeOff, IconMapPin, IconSearch, IconRoute, IconArrowLeft
} from "./Icons.jsx";

export default function LandingPage({ onEnterUser, onEnterAdmin, forceAdmin = false }) {
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogin, setShowLogin]     = useState(forceAdmin);

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
        
        <div className="landing-card" style={{ maxWidth: "480px", width: "95%", margin: "0 auto", padding: "48px 36px", position: "relative", transition: "all 0.3s ease" }}>
          
          {showLogin && (
            <button 
              onClick={() => setShowLogin(false)}
              style={{
                position: "absolute", top: "24px", left: "24px",
                background: "var(--bg-tertiary)", border: "none", color: "var(--text-secondary)",
                width: "36px", height: "36px", borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer",
                boxShadow: "var(--shadow-outer-sm)", transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.transform = "scale(1)"; }}
              title="Back"
            >
              <IconArrowLeft size={18} />
            </button>
          )}

          <div style={{ textAlign: "center", marginBottom: "32px", transition: "all 0.3s" }}>
            {showLogin ? (
              <>
                <img src="/withouttextblue.png" alt="Logo Admin" className="logo-light" style={{ width: "64px", height: "auto", margin: "0 auto 16px" }} />
                <img src="/withouttextorange.png" alt="Logo Admin" className="logo-dark" style={{ width: "64px", height: "auto", margin: "0 auto 16px" }} />
              </>
            ) : (
              <>
                <img src="/withtextblue.png" alt="Trans Metro Pekanbaru" className="logo-light" style={{ width: "260px", height: "auto", margin: "0 auto 16px" }} />
                <img src="/withtextorange.png" alt="Trans Metro Pekanbaru" className="logo-dark" style={{ width: "260px", height: "auto", margin: "0 auto 16px" }} />
              </>
            )}
          </div>

          <div className="landing-content" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {!showLogin ? (
              <div style={{ animation: "cardFadeIn 0.4s ease-out" }}>
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

                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <button className="btn-explore" onClick={onEnterUser} style={{ width: "100%", justifyContent: "center", padding: "16px 24px", fontSize: "1.05rem", borderRadius: "14px", boxShadow: "0 8px 24px rgba(30,58,138,0.2)" }}>
                    Try WebGIS Trans Metro Pekanbaru
                    <IconChevronRight size={18} />
                  </button>
                  
                  <button 
                    onClick={() => setShowLogin(true)} 
                    style={{ 
                      background: "transparent", color: "var(--text-secondary)", border: "none", 
                      fontSize: "0.9rem", marginTop: "16px", display: "inline-flex", 
                      alignItems: "center", gap: "6px", cursor: "pointer",
                      padding: "8px 16px", borderRadius: "8px", transition: "all 0.2s", fontWeight: 600
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <IconUser size={14} /> Login as Admin
                  </button>
                </div>
              </div>
            ) : (
              <div className="landing-admin" style={{ animation: "cardFadeIn 0.4s ease-out" }}>
                
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)", textAlign: "center" }}>Welcome back Admin!</h2>
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
                      style={{ background: "transparent", padding: 0, border: "none", outline: "none", flex: 1 }}
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
                      style={{ background: "transparent", padding: 0, border: "none", outline: "none", flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: "transparent", border: "none",
                        color: "var(--text-secondary)", cursor: "pointer",
                        padding: 0, display: "flex", flexShrink: 0
                      }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                  <button type="submit" disabled={loading} className="btn-explore" style={{ width: "100%", justifyContent: "center", padding: "14px 24px", borderRadius: "12px", background: "var(--accent-color)", color: "#fff" }}>
                    {loading
                      ? <><IconLoader size={15} className="spin" /> Verifying...</>
                      : "Login as Admin"}
                  </button>
                </form>

              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "32px", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.8 }}>
          Made by Kelompok 1 SIG
        </div>

      </div>
    </div>
  );
}

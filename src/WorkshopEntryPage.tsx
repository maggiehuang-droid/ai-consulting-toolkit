import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const FONT = "'Outfit', 'Noto Sans TC', sans-serif";
const C = {
  bg: "#F6F8F9",
  blue: "#4586F0",
  techBlue: "#1F49A3",
  text: "#222A36",
  muted: "#8899AA",
  border: "#E4EAF2",
  panel: "#FFFFFF",
  red: "#EF4444",
};

export default function WorkshopEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // auto-submit if ?token= is pre-filled
  useEffect(() => {
    const t = searchParams.get("token");
    if (t) handleSubmit(t);
  }, []);

  const handleSubmit = async (t?: string) => {
    const code = (t ?? token).trim();
    if (!code) { setError("請輸入代碼"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/groups/by-token/${code}`);
      if (!res.ok) {
        setError("找不到此代碼，請確認後再試");
        setLoading(false);
        inputRef.current?.focus();
        return;
      }
      const group = await res.json();
      navigate(`/ws/${group.workshop_id}/${group.id}`);
    } catch {
      setError("連線失敗，請稍後再試");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: FONT,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      {/* Back */}
      <button
        onClick={() => navigate("/entry")}
        style={{
          position: "absolute", top: 24, left: 24,
          background: "none", border: "none", cursor: "pointer",
          color: C.muted, fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: FONT,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      {/* Logo */}
      <img
        src="https://i.ibb.co/MxgTGTLH/Logo-black.png"
        alt="Crescendo Lab"
        style={{ height: 26, width: "auto", objectFit: "contain", marginBottom: 40 }}
        referrerPolicy="no-referrer"
      />

      <div style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        padding: "48px 40px",
        maxWidth: 400,
        width: "100%",
        boxShadow: "0 4px 24px rgba(69,134,240,0.08)",
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>
          輸入小組代碼
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 28px", lineHeight: 1.6 }}>
          請輸入您的小幫手或主辦方提供的代碼
        </p>

        <div style={{ marginBottom: 12 }}>
          <input
            ref={inputRef}
            type="text"
            value={token}
            onChange={e => { setToken(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="例：a1b2c3d4"
            autoComplete="off"
            autoFocus
            style={{
              width: "100%",
              border: `1px solid ${error ? C.red : C.border}`,
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 16,
              fontFamily: FONT,
              color: C.text,
              background: "#fff",
              outline: "none",
              boxSizing: "border-box",
              letterSpacing: "0.05em",
              transition: "border-color 0.15s",
            }}
            onFocus={e => { if (!error) e.currentTarget.style.borderColor = C.blue; }}
            onBlur={e => { if (!error) e.currentTarget.style.borderColor = C.border; }}
          />
          {error && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: C.red }}>{error}</p>
          )}
        </div>

        <button
          onClick={() => handleSubmit()}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? C.muted : C.blue,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "13px 0",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: FONT,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = C.techBlue; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = C.blue; }}
        >
          {loading ? "查詢中..." : "進入工作坊"}
        </button>
      </div>
    </div>
  );
}

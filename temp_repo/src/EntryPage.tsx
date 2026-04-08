import React from "react";
import { useNavigate } from "react-router-dom";

const FONT = "'Outfit', 'Noto Sans TC', sans-serif";
const C = {
  bg: "#F6F8F9",
  blue: "#4586F0",
  techBlue: "#1F49A3",
  text: "#222A36",
  muted: "#8899AA",
  border: "#E4EAF2",
  panel: "#FFFFFF",
};

export default function EntryPage() {
  const navigate = useNavigate();

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
        onClick={() => navigate("/")}
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
        返回首頁
      </button>

      {/* Logo */}
      <img
        src="https://i.ibb.co/MxgTGTLH/Logo-black.png"
        alt="Crescendo Lab"
        style={{ height: 26, width: "auto", objectFit: "contain", marginBottom: 40 }}
        referrerPolicy="no-referrer"
      />

      {/* Card */}
      <div style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        padding: "48px 40px",
        maxWidth: 400,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(69,134,240,0.08)",
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64,
          background: `${C.blue}12`,
          borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 10px" }}>
          歡迎參加工作坊
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: "0 0 32px", lineHeight: 1.6 }}>
          請準備好您的小組專屬代碼<br />點擊下方按鈕開始進入
        </p>

        <button
          onClick={() => navigate("/entry/workshop")}
          style={{
            width: "100%",
            background: C.blue,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "14px 0",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: FONT,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = C.techBlue)}
          onMouseLeave={e => (e.currentTarget.style.background = C.blue)}
        >
          進入工作坊 →
        </button>
      </div>
    </div>
  );
}

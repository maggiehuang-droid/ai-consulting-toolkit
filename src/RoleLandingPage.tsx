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

export default function RoleLandingPage() {
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
      {/* Logo */}
      <a
        href="https://www.cresclab.com/tw"
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginBottom: 48, display: "block" }}
      >
        <img
          src="https://i.ibb.co/MxgTGTLH/Logo-black.png"
          alt="Crescendo Lab"
          style={{ height: 30, width: "auto", objectFit: "contain" }}
          referrerPolicy="no-referrer"
        />
      </a>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, margin: "0 0 12px" }}>
          AI 顧問工具箱
        </h1>
        <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>
          請選擇您的身份以繼續
        </p>
      </div>

      {/* Role cards */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 600, width: "100%" }}>
        <RoleCard
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 9h6M9 12h6M9 15h4" />
            </svg>
          }
          title="我是管理者"
          desc="建立工作坊、管理小組、查看進度"
          onClick={() => navigate("/admin")}
          primary
        />
        <RoleCard
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          }
          title="我是參與者"
          desc="輸入工作坊代碼，進入小組工作區"
          onClick={() => navigate("/entry")}
          primary={false}
        />
      </div>
    </div>
  );
}

function RoleCard({
  icon, title, desc, onClick, primary,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  primary: boolean;
}) {
  const [hover, setHover] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: "1 1 220px",
        maxWidth: 260,
        background: primary ? (hover ? C.techBlue : C.blue) : C.panel,
        border: primary ? "none" : `2px solid ${hover ? C.blue : C.border}`,
        borderRadius: 16,
        padding: "32px 24px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s",
        boxShadow: hover
          ? "0 8px 32px rgba(69,134,240,0.18)"
          : "0 2px 8px rgba(69,134,240,0.06)",
        transform: hover ? "translateY(-2px)" : "none",
        fontFamily: FONT,
      }}
    >
      <div style={{ color: primary ? "#fff" : C.blue, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: primary ? "#fff" : C.text, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: primary ? "rgba(255,255,255,0.75)" : C.muted, lineHeight: 1.5 }}>
        {desc}
      </div>
    </button>
  );
}

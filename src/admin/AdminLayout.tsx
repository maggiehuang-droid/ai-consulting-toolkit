import React from "react";
import { Link, useLocation } from "react-router-dom";

const FONT = "'Outfit', 'Noto Sans TC', sans-serif";

// Brand colors — matches App.tsx / CL Brand Guidelines 2025
export const C = {
  // backgrounds
  bg:        "#F6F8F9",   // Cloud White
  panel:     "#FFFFFF",
  border:    "#E4EAF2",
  borderHov: "#C8D6EC",

  // brand
  blue:      "#4586F0",   // Crescendo Blue
  techBlue:  "#1F49A3",   // Tech Blue
  gradLight: "#B5D1FE",   // Gradient Light

  // text
  text:      "#222A36",   // Data Black
  gray:      "#36393D",   // Modern Gray
  muted:     "#8899AA",

  // status
  green:     "#22C55E",
  greenBg:   "#F0FDF4",
  greenBorder: "#BBF7D0",
  yellow:    "#F59E0B",
  yellowBg:  "#FFFBEB",
  yellowBorder: "#FDE68A",
  red:       "#EF4444",
  redBg:     "#FEF2F2",
  redBorder: "#FECACA",
};

export const STEP_LABELS: Record<string, string> = {
  define:       "Step 1 定義問題",
  workflow:     "Step 2 拆解工作流",
  painmap:      "Step 3 痛點地圖",
  "ai-collab":  "Step 4 AI 協作場景",
  knowledge:    "Step 5 知識提取",
  priority:     "Step 6 優先排序",
};

export const STEPS = ["define", "workflow", "painmap", "ai-collab", "knowledge", "priority"];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const SIDEBAR_W = 168;

const NAV_ITEMS = [
  {
    label: "Dashboard",
    to: "/admin",
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "工作坊管理",
    to: "/admin/workshops",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "工具入口總覽",
    to: "/tools",
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const location = useLocation();

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text, display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        a { color: inherit; }
      `}</style>

      {/* Top bar */}
      <nav style={{
        background: C.panel,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 20px",
        height: 48,
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 200,
        boxShadow: "0 1px 4px rgba(69,134,240,0.06)",
        flexShrink: 0,
      }}>
        <a
          href="https://www.cresclab.com/tw"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", marginRight: 20 }}
        >
          <img
            src="https://i.ibb.co/MxgTGTLH/Logo-black.png"
            alt="Crescendo Lab"
            style={{ height: 20, width: "auto", objectFit: "contain", display: "block" }}
            referrerPolicy="no-referrer"
          />
        </a>
        <span style={{ width: 1, height: 16, background: C.border, marginRight: 14 }} />
        <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>管理後台</span>
        {title && (
          <>
            <span style={{ color: C.border, margin: "0 6px", fontSize: 14 }}>›</span>
            <span style={{ color: C.muted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
              {title}
            </span>
          </>
        )}
        <Link
          to="/"
          style={{
            marginLeft: "auto",
            color: C.muted,
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          回前台
        </Link>
      </nav>

      {/* Body: sidebar + content */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: SIDEBAR_W,
          flexShrink: 0,
          background: C.blue,
          minHeight: "calc(100vh - 48px)",
          padding: "16px 0",
          position: "sticky",
          top: 48,
          alignSelf: "flex-start",
          height: "calc(100vh - 48px)",
          overflowY: "auto",
        }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  margin: "1px 8px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#fff" : "rgba(255,255,255,0.7)",
                  background: active ? "rgba(255,255,255,0.18)" : "transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "24px 28px 60px", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ── shared components ─────────────────────────────────────────────────────────

export function Badge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    completed:   { label: "已完成", color: C.green,  bg: C.greenBg,  border: C.greenBorder },
    in_progress: { label: "進行中", color: C.yellow, bg: C.yellowBg, border: C.yellowBorder },
    not_started: { label: "未開始", color: C.muted,  bg: C.bg,       border: C.border },
  };
  const s = map[status] ?? map.not_started;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  style: extraStyle,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    padding: "9px 20px",
    borderRadius: 9999,
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    fontFamily: FONT,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  };
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: C.blue,
      color: "#fff",
      border: "none",
      boxShadow: `0 4px 14px ${C.blue}30`,
    },
    ghost: {
      background: "transparent",
      color: C.gray,
      border: `1px solid ${C.border}`,
    },
    danger: {
      background: C.redBg,
      color: C.red,
      border: `1px solid ${C.redBorder}`,
    },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...styles[variant], ...extraStyle }}
      onMouseEnter={e => {
        if (!disabled) {
          if (variant === "primary") e.currentTarget.style.boxShadow = `0 6px 20px ${C.blue}45`;
          if (variant === "ghost") e.currentTarget.style.borderColor = C.blue;
        }
      }}
      onMouseLeave={e => {
        if (variant === "primary") e.currentTarget.style.boxShadow = `0 4px 14px ${C.blue}30`;
        if (variant === "ghost") e.currentTarget.style.borderColor = C.border;
      }}
    >
      {children}
    </button>
  );
}

export function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, color: C.gray, fontWeight: 600 }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "10px 14px",
          color: C.text,
          fontSize: 14,
          fontFamily: FONT,
          outline: "none",
          width: "100%",
          transition: "border-color 0.2s",
        }}
        onFocus={e => (e.target.style.borderColor = C.blue)}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />
    </div>
  );
}

export function Card({
  children,
  style,
  hoverable,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  hoverable?: boolean;
}) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px 20px",
        transition: hoverable ? "border-color 0.15s, box-shadow 0.15s" : undefined,
        ...style,
      }}
      onMouseEnter={hoverable ? e => {
        e.currentTarget.style.borderColor = C.blue;
        e.currentTarget.style.boxShadow = `0 4px 20px ${C.blue}12`;
      } : undefined}
      onMouseLeave={hoverable ? e => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = "none";
      } : undefined}
    >
      {children}
    </div>
  );
}

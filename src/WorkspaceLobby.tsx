import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { STEPS, STEP_LABELS } from "./admin/AdminLayout";

const FONT = "'Outfit', 'Noto Sans TC', sans-serif";
const C = {
  bg: "#F6F8F9",
  blue: "#4586F0",
  techBlue: "#1F49A3",
  text: "#222A36",
  muted: "#8899AA",
  border: "#E4EAF2",
  panel: "#FFFFFF",
  green: "#22C55E",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  yellow: "#F59E0B",
  yellowBg: "#FFFBEB",
  yellowBorder: "#FDE68A",
};

interface Session { step: string; status: string; }

function stepStatus(step: string, sessions: Session[]): "completed" | "in_progress" | "not_started" {
  const s = sessions.find(s => s.step === step);
  if (!s) return "not_started";
  if (s.status === "completed") return "completed";
  return "in_progress";
}

export default function WorkspaceLobby() {
  const { workshopId, groupId } = useParams<{ workshopId: string; groupId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin";

  const [wTitle, setWTitle] = useState("");
  const [gName, setGName] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workshopId || !groupId) return;
    Promise.all([
      fetch(`/api/workshops/${workshopId}`).then(r => r.ok ? r.json() : { title: "" }),
      fetch(`/api/workshops/${workshopId}/groups/${groupId}`).then(r => r.ok ? r.json() : { name: "" }),
      fetch(`/api/sessions/${workshopId}/${groupId}`).then(r => r.ok ? r.json() : []),
    ]).then(([ws, grp, sess]) => {
      setWTitle((ws as { title: string }).title ?? "");
      setGName((grp as { name: string }).name ?? "");
      setSessions(sess);
      setLoading(false);
    });
  }, [workshopId, groupId]);

  const completedCount = STEPS.filter(s => stepStatus(s, sessions) === "completed").length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: C.muted }}>
        載入中...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT }}>
      {/* Nav */}
      <nav style={{
        background: C.panel,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 32px",
        height: 60,
        display: "flex",
        alignItems: "center",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 4px rgba(69,134,240,0.06)",
      }}>
        <img
          src="https://i.ibb.co/MxgTGTLH/Logo-black.png"
          alt="Crescendo Lab"
          style={{ height: 22, width: "auto", objectFit: "contain" }}
          referrerPolicy="no-referrer"
        />
        {wTitle && (
          <>
            <span style={{ color: C.border, margin: "0 10px", fontSize: 16 }}>›</span>
            <span style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>{wTitle}</span>
          </>
        )}
        {gName && (
          <>
            <span style={{ color: C.border, margin: "0 10px", fontSize: 16 }}>›</span>
            <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{gName}</span>
          </>
        )}
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {wTitle || "工作坊"}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>
            {gName || "您的工作區"}
          </h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
            已完成 {completedCount} / {STEPS.length} 個步驟
          </p>

          {/* Progress bar */}
          <div style={{ margin: "16px auto 0", maxWidth: 320, height: 6, background: C.border, borderRadius: 99 }}>
            <div style={{
              height: "100%",
              borderRadius: 99,
              background: C.blue,
              width: `${(completedCount / STEPS.length) * 100}%`,
              transition: "width 0.3s",
            }} />
          </div>
        </div>

        {/* Step cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {STEPS.map((step, i) => {
            const st = stepStatus(step, sessions);
            const isCompleted = st === "completed";
            const isInProgress = st === "in_progress";

            return (
              <div
                key={step}
                style={{
                  background: C.panel,
                  border: `1px solid ${isCompleted ? C.greenBorder : isInProgress ? C.yellowBorder : C.border}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {/* Step number / status icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: isCompleted ? C.greenBg : isInProgress ? C.yellowBg : C.bg,
                  border: `1px solid ${isCompleted ? C.greenBorder : isInProgress ? C.yellowBorder : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800,
                  color: isCompleted ? C.green : isInProgress ? C.yellow : C.muted,
                }}>
                  {isCompleted
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                    : i + 1
                  }
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {STEP_LABELS[step]}
                  </div>
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "3px 10px", borderRadius: 6,
                  background: isCompleted ? C.greenBg : isInProgress ? C.yellowBg : C.bg,
                  color: isCompleted ? C.green : isInProgress ? C.yellow : C.muted,
                  border: `1px solid ${isCompleted ? C.greenBorder : isInProgress ? C.yellowBorder : C.border}`,
                  whiteSpace: "nowrap",
                }}>
                  {isCompleted ? "已完成" : isInProgress ? "進行中" : "未開始"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Enter button */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => navigate(`/ws/${workshopId}/${groupId}/work`)}
            style={{
              background: C.blue,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "14px 40px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: FONT,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.techBlue)}
            onMouseLeave={e => (e.currentTarget.style.background = C.blue)}
          >
            {completedCount > 0 ? "繼續工作坊" : "開始工作坊"} →
          </button>
        </div>
      </div>

      {/* Admin floating panel */}
      {fromAdmin && (
        <div style={{
          position: "fixed", top: 80, right: 20, zIndex: 1000,
          background: "#fff",
          border: "1px solid #E4EAF2",
          borderRadius: 12,
          padding: "12px 16px",
          boxShadow: "0 4px 20px rgba(69,134,240,0.15)",
          fontFamily: FONT,
          minWidth: 180,
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#8899AA", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            管理者模式
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: "返回本組管理頁", href: `/admin/workshops/${workshopId}/groups/${groupId}` },
              { label: "返回工作坊管理", href: `/admin/workshops/${workshopId}` },
              { label: "返回管理後台",   href: "/admin" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                style={{
                  display: "block", fontSize: 13, fontWeight: 600,
                  color: "#4586F0", textDecoration: "none",
                  padding: "5px 8px", borderRadius: 7,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#4586F010")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                ← {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

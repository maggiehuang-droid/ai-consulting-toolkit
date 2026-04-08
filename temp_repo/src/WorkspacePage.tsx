import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import App from "./App";
import { SessionContext } from "./SessionContext";

const FONT = "'Outfit', 'Noto Sans TC', sans-serif";

export default function WorkspacePage() {
  const { workshopId, groupId } = useParams<{ workshopId: string; groupId: string }>();
  const [searchParams] = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin";

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | {
        status: "ready";
        groupName: string;
        workshopTitle: string;
        initialData: Record<string, { status: string; data: unknown }>;
      }
  >({ status: "loading" });

  useEffect(() => {
    if (!workshopId || !groupId) return;

    (async () => {
      try {
        const [groupRes, wsRes, sessRes] = await Promise.all([
          fetch(`/api/workshops/${workshopId}/groups/${groupId}`),
          fetch(`/api/workshops/${workshopId}`),
          fetch(`/api/sessions/${workshopId}/${groupId}`),
        ]);

        if (!groupRes.ok) {
          setState({ status: "error", message: "找不到此小組，請確認網址是否正確。" });
          return;
        }

        const group = await groupRes.json();
        const ws = wsRes.ok ? await wsRes.json() : { title: "" };
        const sessions: { step: string; status: string; data: unknown }[] = sessRes.ok
          ? await sessRes.json()
          : [];

        const initialData: Record<string, { status: string; data: unknown }> = {};
        for (const s of sessions) {
          initialData[s.step] = { status: s.status, data: s.data };
        }

        setState({
          status: "ready",
          groupName: group.name,
          workshopTitle: ws.title || "",
          initialData,
        });
      } catch {
        setState({ status: "error", message: "載入工作坊資料時發生錯誤，請稍後再試。" });
      }
    })();
  }, [workshopId, groupId]);

  if (state.status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#222A36", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#fff", fontSize: 18 }}>
        載入工作坊中...
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={{ minHeight: "100vh", background: "#222A36", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#FF6B6B", fontSize: 18, padding: 32, textAlign: "center" }}>
        {state.message}
      </div>
    );
  }

  const { groupName, workshopTitle, initialData } = state;

  const saveStep = async (step: string, status: string, data: unknown) => {
    await fetch(`/api/sessions/${workshopId}/${groupId}/${step}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, data }),
    });
  };

  return (
    <SessionContext.Provider value={{ workshopId: workshopId!, groupId: groupId!, groupName, workshopTitle, saveStep }}>
      <App initialData={initialData} startOnToolbox />

      {/* Floating back panel — only shown when admin enters via ?from=admin */}
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
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4586F0",
                  textDecoration: "none",
                  padding: "5px 8px",
                  borderRadius: 7,
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
    </SessionContext.Provider>
  );
}

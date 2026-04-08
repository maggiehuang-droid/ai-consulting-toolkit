import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { C, Btn, Card } from "./AdminLayout";

interface Project {
  id: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
  project_amount: number;
  project_status: string;
}

const STATUS = {
  planning:  { label: "規劃中", color: C.blue,   bg: `${C.blue}10`,  border: `${C.blue}30`  },
  active:    { label: "進行中", color: C.yellow,  bg: C.yellowBg,     border: C.yellowBorder },
  completed: { label: "已結案", color: C.green,   bg: C.greenBg,      border: C.greenBorder  },
};

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="專案管理">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: C.text }}>
            專案管理
          </h1>
          <p style={{ color: C.muted, margin: "6px 0 0", fontSize: 14 }}>管理工作坊對應的專案細節、金額與前置作業</p>
        </div>
      </div>

      {loading && <p style={{ color: C.muted, textAlign: "center", padding: 48 }}>載入中...</p>}

      {!loading && (
        <>
          {projects.length === 0 ? (
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 16, padding: "56px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${C.blue}10`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: "0 0 6px" }}>尚無專案</p>
              <p style={{ color: C.muted, margin: "0 0 20px", fontSize: 14 }}>建立工作坊後，會自動在此產生對應的專案</p>
              <Btn onClick={() => navigate("/admin/workshops/new")}>前往建立工作坊</Btn>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map(proj => {
                const s = STATUS[proj.project_status as keyof typeof STATUS] || STATUS.planning;
                return (
                  <Card key={proj.id} hoverable style={{ cursor: "pointer" }}>
                    <div onClick={() => navigate(`/admin/projects/${proj.id}`)} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: `linear-gradient(135deg, ${C.blue}15, ${C.gradLight}40)`,
                        border: `1px solid ${C.blue}20`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 3 }}>{proj.title}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>
                          {proj.date ? new Date(proj.date + "T00:00:00").toLocaleDateString("zh-TW") + " · " : ""}
                          專案金額：NT$ {proj.project_amount?.toLocaleString() || 0}
                        </div>
                      </div>
                      <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", marginRight: 8 }}>
                        {s.label}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

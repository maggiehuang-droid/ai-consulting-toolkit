import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { C, Btn, Card } from "./AdminLayout";

interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  created_at: string;
}

type WsStatus = "upcoming" | "active" | "completed";

function computeStatus(date: string): WsStatus {
  if (!date) return "active";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date + "T00:00:00"); d.setHours(0, 0, 0, 0);
  if (d > today) return "upcoming";
  if (d.getTime() === today.getTime()) return "active";
  return "completed";
}

const STATUS = {
  upcoming:  { label: "待執行", color: C.blue,   bg: `${C.blue}10`,  border: `${C.blue}30`  },
  active:    { label: "進行中", color: C.yellow,  bg: C.yellowBg,     border: C.yellowBorder },
  completed: { label: "已完成", color: C.green,   bg: C.greenBg,      border: C.greenBorder  },
};

const MONTH_ZH = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const DAY_ZH   = ["日","一","二","三","四","五","六"];

export default function WorkshopList({ listOnly = false }: { listOnly?: boolean }) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | WsStatus>("all");
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [popup, setPopup] = useState<{ dateStr: string; top: number; left: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/workshops")
      .then(r => r.json())
      .then(data => { setWorkshops(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // date → workshops map for calendar
  const wsMap: Record<string, Workshop[]> = {};
  workshops.forEach(ws => {
    if (ws.date) (wsMap[ws.date.slice(0, 10)] ??= []).push(ws);
  });

  // counts for stats + filter
  const counts = { upcoming: 0, active: 0, completed: 0 };
  workshops.forEach(ws => counts[computeStatus(ws.date)]++);

  const filtered = filter === "all" ? workshops : workshops.filter(ws => computeStatus(ws.date) === filter);

  // calendar grid
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayDate = new Date();

  const handleDayClick = (e: React.MouseEvent<HTMLButtonElement>, day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!wsMap[dateStr]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPopup({
      dateStr,
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 270),
    });
  };

  const prevMonth = () => { const d = new Date(calYear, calMonth - 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); };
  const nextMonth = () => { const d = new Date(calYear, calMonth + 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); };

  return (
    <AdminLayout>
      {/* Popup backdrop */}
      {popup && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setPopup(null)} />}

      {/* Date popup */}
      {popup && (
        <div style={{
          position: "fixed", top: popup.top, left: popup.left, zIndex: 100,
          background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 16, minWidth: 240, maxWidth: 300,
          boxShadow: "0 8px 32px rgba(69,134,240,0.12)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10 }}>
            {popup.dateStr.replace(/-/g, "/")} 的工作坊
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {wsMap[popup.dateStr].map(ws => {
              const s = STATUS[computeStatus(ws.date)];
              return (
                <div
                  key={ws.id}
                  onClick={() => { setPopup(null); navigate(`/admin/workshops/${ws.id}`); }}
                  style={{ background: C.bg, borderRadius: 8, padding: "10px 12px", cursor: "pointer", border: `1px solid ${C.border}` }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 5 }}>{ws.title}</div>
                  <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          {!listOnly && (
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: C.blue, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              AI 顧問工具箱
            </p>
          )}
          <h1 style={{ fontSize: listOnly ? 24 : 30, fontWeight: 800, margin: 0, color: C.text }}>
            {listOnly ? "工作坊管理" : "管理後台"}
          </h1>
          {!listOnly && <p style={{ color: C.muted, margin: "6px 0 0", fontSize: 14 }}>建立工作坊、管理小組、查看進度</p>}
        </div>
        <Btn onClick={() => navigate("/admin/workshops/new")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          建立工作坊
        </Btn>
      </div>

      {loading && <p style={{ color: C.muted, textAlign: "center", padding: 48 }}>載入中...</p>}

      {!loading && (
        <>
          {!listOnly && <>{/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
            {([
              { label: "總工作坊場次", value: workshops.length, color: C.text },
              { label: "待執行", value: counts.upcoming, color: C.blue },
              { label: "進行中", value: counts.active, color: C.yellow },
              { label: "已完成", value: counts.completed, color: C.green },
            ] as const).map(s => (
              <Card key={s.label} style={{ textAlign: "center", padding: "18px 20px" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Calendar */}
          <Card style={{ marginBottom: 28, padding: 0, overflow: "hidden" }}>
            {/* Header — brand blue gradient */}
            <div style={{
              background: `linear-gradient(135deg, ${C.techBlue} 0%, ${C.blue} 100%)`,
              borderRadius: "14px 14px 0 0",
              padding: "14px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src="https://i.ibb.co/cSgSMhxg/icon-toolkit.png"
                  alt=""
                  style={{ width: 26, height: 26, objectFit: "contain" }}
                  referrerPolicy="no-referrer"
                />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                  {calYear} 年 {MONTH_ZH[calMonth]}
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[{ fn: prevMonth, d: "M15 18l-6-6 6-6" }, { fn: nextMonth, d: "M9 18l6-6-6-6" }].map((btn, i) => (
                  <button key={i} onClick={btn.fn} style={{
                    border: "1px solid rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: 6, width: 28, height: 28, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                      <path d={btn.d} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid body */}
            <div style={{ padding: "12px 16px 16px" }}>
              {/* Day-of-week headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", justifyItems: "center", marginBottom: 4 }}>
                {DAY_ZH.map(d => (
                  <div key={d} style={{ fontSize: 10, fontWeight: 500, color: "#7A95B8", padding: "2px 0", width: 32, textAlign: "center" }}>{d}</div>
                ))}
              </div>

              {/* Day cells — circular */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", justifyItems: "center", gap: 2 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} style={{ width: 32, height: 32 }} />;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasWs = !!wsMap[dateStr];
                  const isToday = todayDate.getFullYear() === calYear && todayDate.getMonth() === calMonth && todayDate.getDate() === day;
                  const circleBg = (hasWs && isToday) ? C.blue
                                 : isToday            ? `${C.blue}18`
                                 : hasWs              ? `${C.blue}14`
                                 : "transparent";
                  return (
                    <button
                      key={i}
                      onClick={e => handleDayClick(e, day)}
                      style={{
                        width: 32, height: 32, borderRadius: "50%", border: "none",
                        background: circleBg,
                        cursor: hasWs ? "pointer" : "default",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        padding: 0, gap: 1,
                        outline: isToday && !hasWs ? `2px solid ${C.blue}` : "none",
                        outlineOffset: -2,
                      }}
                    >
                      <span style={{
                        fontSize: 12, lineHeight: 1,
                        fontWeight: isToday ? 800 : 400,
                        color: (hasWs && isToday) ? "#fff" : isToday ? C.blue : hasWs ? C.blue : C.gray,
                      }}>
                        {day}
                      </span>
                      {hasWs && (
                        <span style={{
                          width: 3, height: 3, borderRadius: "50%",
                          background: (hasWs && isToday) ? "rgba(255,255,255,0.8)" : C.blue,
                          display: "block",
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
          </>}

          {/* Filter tabs + list */}
          {workshops.length === 0 ? (
            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 16, padding: "56px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${C.blue}10`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: "0 0 6px" }}>尚無工作坊</p>
              <p style={{ color: C.muted, margin: "0 0 20px", fontSize: 14 }}>建立第一個工作坊，開始管理小組與進度</p>
              <Btn onClick={() => navigate("/admin/workshops/new")}>建立第一個工作坊</Btn>
            </div>
          ) : (
            <>
              {/* Filter tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {([["all", "全部", workshops.length], ["upcoming", "待執行", counts.upcoming], ["active", "進行中", counts.active], ["completed", "已完成", counts.completed]] as const).map(([key, label, count]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    style={{
                      border: `1px solid ${filter === key ? C.blue : C.border}`,
                      background: filter === key ? `${C.blue}10` : "#fff",
                      color: filter === key ? C.blue : C.gray,
                      borderRadius: 9999, padding: "5px 14px",
                      fontSize: 13, fontWeight: filter === key ? 700 : 500,
                      cursor: "pointer", fontFamily: "'Outfit','Noto Sans TC',sans-serif",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    {label}
                    <span style={{ fontSize: 11, opacity: 0.65, background: filter === key ? `${C.blue}20` : C.bg, borderRadius: 9999, padding: "0 6px" }}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Workshop cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.length === 0 && (
                  <p style={{ color: C.muted, textAlign: "center", padding: "28px 0", fontSize: 14 }}>
                    此分類暫無工作坊
                  </p>
                )}
                {filtered.map(ws => {
                  const s = STATUS[computeStatus(ws.date)];
                  return (
                    <Card key={ws.id} hoverable style={{ cursor: "pointer" }}>
                      <div onClick={() => navigate(`/admin/workshops/${ws.id}`)} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                          background: `linear-gradient(135deg, ${C.blue}15, ${C.gradLight}40)`,
                          border: `1px solid ${C.blue}20`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 3 }}>{ws.title}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>
                            {ws.date ? new Date(ws.date + "T00:00:00").toLocaleDateString("zh-TW") + " · " : ""}
                            建立於 {new Date(ws.created_at).toLocaleDateString("zh-TW")}
                            {ws.description ? ` · ${ws.description}` : ""}
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
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}

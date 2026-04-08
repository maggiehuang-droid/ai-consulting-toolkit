import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import AdminLayout, { C, Badge, Btn, Card, InputField, STEPS, STEP_LABELS } from "./AdminLayout";
import DatePicker from "./DatePicker";

interface Group {
  id: string;
  name: string;
  group_code: string;
  facilitator: string;
  access_token: string;
  created_at: string;
  member_count: number;
  leader_name: string;
}

interface SessionSummary { step: string; status: string; }

interface Workshop {
  id: string;
  title: string;
  description: string;
  client_name: string;
  date: string;
  notes: string;
  hubspot_url: string;
  status: string;
  groups: Group[];
}

type ImportState =
  | { phase: "idle" }
  | { phase: "confirm_clear"; rows: Record<string, string>[]; groupCount: number }
  | { phase: "error"; message: string }
  | { phase: "success"; groupCount: number; memberCount: number };

function copyToClipboard(text: string) { navigator.clipboard.writeText(text).catch(() => {}); }

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ workshop, onClose, onSaved }: {
  workshop: Workshop;
  onClose: () => void;
  onSaved: (updated: Workshop) => void;
}) {
  const [form, setForm] = useState({
    title: workshop.title,
    description: workshop.description,
    client_name: workshop.client_name || "",
    date: workshop.date || "",
    notes: workshop.notes || "",
    hubspot_url: workshop.hubspot_url || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/workshops/${workshop.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const updated = await res.json();
    onSaved({ ...workshop, ...updated });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 16,
        padding: "28px 32px", width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
        fontFamily: "'Outfit','Noto Sans TC',sans-serif",
      }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800, color: C.text }}>編輯工作坊</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <InputField label="工作坊名稱" name="title" value={form.title} onChange={set("title")} placeholder="工作坊名稱" required />
          <InputField label="說明" name="description" value={form.description} onChange={set("description")} placeholder="簡短描述" />
          <InputField label="客戶名稱" name="client_name" value={form.client_name} onChange={set("client_name")} placeholder="例：某某股份有限公司" />
          <div>
            <label style={{ fontSize: 13, color: C.gray, fontWeight: 600, display: "block", marginBottom: 6 }}>日期</label>
            <DatePicker value={form.date} onChange={iso => setForm(f => ({ ...f, date: iso }))} />
          </div>
          <InputField label="HubSpot 連結" name="hubspot_url" value={form.hubspot_url} onChange={set("hubspot_url")} placeholder="https://app.hubspot.com/contacts/..." />
          <InputField label="備註" name="notes" value={form.notes} onChange={set("notes")} placeholder="其他備忘事項" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>取消</Btn>
          <Btn onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? "儲存中..." : "儲存"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Import Section ────────────────────────────────────────────────────────────

function ImportSection({ workshopId, onImported }: { workshopId: string; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ phase: "idle" });
  const [importing, setImporting] = useState(false);

  const parseFile = (file: File): Promise<Record<string, string>[]> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const wb = XLSX.read(e.target!.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" }));
        } catch { reject(new Error("檔案解析失敗，請確認格式正確")); }
      };
      reader.onerror = () => reject(new Error("檔案讀取失敗"));
      reader.readAsBinaryString(file);
    });

  const sendBulk = async (rows: Record<string, string>[], force = false) => {
    setImporting(true);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/members-bulk${force ? "?force=true" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "HAS_GROUPS" && !force) {
          setState({ phase: "confirm_clear", rows, groupCount: data.groupCount });
        } else {
          setState({ phase: "error", message: data.message || data.error || "匯入失敗" });
        }
      } else {
        setState({ phase: "success", groupCount: data.groups.length, memberCount: data.memberCount });
        onImported();
      }
    } catch (err: unknown) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "匯入失敗" });
    } finally {
      setImporting(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setState({ phase: "idle" });
    try {
      const rows = await parseFile(file);
      await sendBulk(rows);
    } catch (err: unknown) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "檔案處理失敗" });
    }
  };

  const reset = () => setState({ phase: "idle" });

  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
        匯入分組名單
      </h2>
      <Card>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          上傳 Excel / CSV 自動建立小組與成員。欄位：<code style={{ background: C.bg, padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>group_code</code>、<code style={{ background: C.bg, padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>group_name</code>、<code style={{ background: C.bg, padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>name</code>（必填）、title、seniority、department、is_leader（選填）
        </p>

        {state.phase === "idle" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFile} />
            <Btn onClick={() => fileRef.current?.click()} disabled={importing}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {importing ? "匯入中..." : "選擇檔案"}
            </Btn>
          </div>
        )}

        {state.phase === "error" && (
          <div>
            <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 13, marginBottom: 12 }}>
              ⚠️ {state.message}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFile} />
              <Btn onClick={() => fileRef.current?.click()}>重新上傳</Btn>
              <Btn variant="ghost" onClick={reset}>取消</Btn>
            </div>
          </div>
        )}

        {state.phase === "confirm_clear" && (
          <div>
            <div style={{ background: C.yellowBg, border: `1px solid ${C.yellowBorder}`, borderRadius: 8, padding: "10px 14px", color: "#92400E", fontSize: 13, marginBottom: 12 }}>
              此工作坊已有 {state.groupCount} 個小組。清空後重匯將刪除所有現有分組與成員（不影響步驟作答資料）。確定要繼續嗎？
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="danger" onClick={() => sendBulk(state.rows, true)} disabled={importing}>
                {importing ? "清空並匯入中..." : "清空並重新匯入"}
              </Btn>
              <Btn variant="ghost" onClick={reset}>取消</Btn>
            </div>
          </div>
        )}

        {state.phase === "success" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: "10px 14px", color: "#065F46", fontSize: 13 }}>
              ✓ 成功建立 {state.groupCount} 個小組，共匯入 {state.memberCount} 位成員
            </div>
            <Btn variant="ghost" onClick={reset}>再次匯入</Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WorkshopDetail() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [sessions, setSessions] = useState<Record<string, SessionSummary[]>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    if (!workshopId) return;
    const wsRes = await fetch(`/api/workshops/${workshopId}`);
    if (!wsRes.ok) { setLoading(false); return; }
    const ws: Workshop = await wsRes.json();
    setWorkshop(ws);
    const sessionMap: Record<string, SessionSummary[]> = {};
    await Promise.all(ws.groups.map(async g => {
      const r = await fetch(`/api/sessions/${workshopId}/${g.id}`);
      sessionMap[g.id] = r.ok ? await r.json() : [];
    }));
    setSessions(sessionMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, [workshopId]);

  const getStepStatus = (groupId: string, step: string) =>
    sessions[groupId]?.find(x => x.step === step)?.status ?? "not_started";
  const completedCount = (groupId: string) => STEPS.filter(s => getStepStatus(groupId, s) === "completed").length;
  const handleCopy = (token: string, label: string) => {
    copyToClipboard(`${window.location.origin}/entry/workshop?token=${token}`);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <AdminLayout><p style={{ color: C.muted, padding: 48 }}>載入中...</p></AdminLayout>;
  if (!workshop) return <AdminLayout><p style={{ color: C.muted, padding: 48 }}>找不到此工作坊。</p></AdminLayout>;

  return (
    <AdminLayout title={workshop.title}>
      {editOpen && (
        <EditModal
          workshop={workshop}
          onClose={() => setEditOpen(false)}
          onSaved={updated => setWorkshop(prev => prev ? { ...prev, ...updated } : prev)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: C.blue, letterSpacing: "0.08em", textTransform: "uppercase" }}>工作坊</p>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, marginBottom: 4, color: C.text }}>{workshop.title}</h1>
            <p style={{ color: C.muted, margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              {workshop.client_name && <><strong style={{ color: C.gray }}>{workshop.client_name}</strong> · </>}
              {workshop.description && <>{workshop.description} · </>}
              {workshop.date
                ? new Date(workshop.date + "T00:00:00").toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })
                : "未設定日期"}
            </p>
            {workshop.hubspot_url && (
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                <a href={workshop.hubspot_url} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none", fontWeight: 600 }}>
                  ↗ HubSpot
                </a>
              </p>
            )}
            {workshop.notes && <p style={{ color: C.muted, margin: "4px 0 0", fontSize: 12 }}>備註：{workshop.notes}</p>}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Btn variant="ghost" onClick={() => setEditOpen(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              編輯工作坊
            </Btn>
            <Btn onClick={() => navigate(`/admin/workshops/${workshopId}/groups/new`)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              手動新增小組
            </Btn>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "小組數", value: workshop.groups.length },
          { label: "已完成全部步驟", value: workshop.groups.filter(g => completedCount(g.id) === STEPS.length).length },
          { label: "平均進度", value: workshop.groups.length ? `${Math.round(workshop.groups.reduce((s, g) => s + completedCount(g.id), 0) / workshop.groups.length)}/${STEPS.length}` : "—" },
        ].map(stat => (
          <Card key={stat.label} style={{ textAlign: "center", padding: "16px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.blue, lineHeight: 1.2 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Import section */}
      <ImportSection workshopId={workshopId!} onImported={load} />

      {/* Groups */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          小組列表
        </h2>
      </div>

      {workshop.groups.length === 0 ? (
        <div style={{ border: `2px dashed ${C.border}`, borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: C.muted, marginBottom: 16, fontSize: 14 }}>
            尚無小組。可透過上方 Excel 匯入自動建組，或手動新增。
          </p>
          <Btn onClick={() => navigate(`/admin/workshops/${workshopId}/groups/new`)}>手動新增第一個小組</Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {workshop.groups.map(group => {
            const done = completedCount(group.id);
            const pct = Math.round((done / STEPS.length) * 100);
            return (
              <Card key={group.id}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: `linear-gradient(135deg, ${C.blue}20, ${C.gradLight}50)`,
                      border: `1px solid ${C.blue}20`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 14, color: C.blue,
                    }}>
                      {group.group_code || group.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{group.name}</div>
                      <div style={{ fontSize: 12, color: C.muted, display: "flex", gap: 10 }}>
                        {group.facilitator
                          ? <span>小幫手：{group.facilitator}</span>
                          : <span style={{ color: C.yellow }}>⚠ 未指派小幫手</span>
                        }
                        {group.member_count > 0 && <span>{group.member_count} 位成員</span>}
                        {group.leader_name && <span>組長：{group.leader_name}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => handleCopy(group.access_token, group.name)}
                      style={{
                        background: "transparent", border: `1px solid ${C.border}`, borderRadius: 9999,
                        padding: "5px 14px", color: copied === group.name ? C.green : C.blue,
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      {copied === group.name ? "✓ 已複製" : "複製連結"}
                    </button>
                    <Link
                      to={`/admin/workshops/${workshopId}/groups/${group.id}`}
                      style={{
                        border: `1px solid ${C.border}`, borderRadius: 9999, padding: "5px 14px",
                        color: C.gray, fontSize: 12, fontWeight: 700, textDecoration: "none",
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}
                    >
                      查看詳情 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                    </Link>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>整體進度</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: done === STEPS.length ? C.green : C.blue }}>
                      {done}/{STEPS.length} 步驟完成
                    </span>
                  </div>
                  <div style={{ height: 5, background: C.bg, borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: done === STEPS.length ? `linear-gradient(90deg, ${C.green}, #16A34A)` : `linear-gradient(90deg, ${C.blue}, ${C.gradLight})`,
                      borderRadius: 9999, transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>

                {/* Step badges */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
                  {STEPS.map(step => (
                    <div key={step} style={{ background: C.bg, borderRadius: 7, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5 }}>
                      <span style={{ fontSize: 11, color: C.gray, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {STEP_LABELS[step]}
                      </span>
                      <Badge status={getStepStatus(group.id, step)} />
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

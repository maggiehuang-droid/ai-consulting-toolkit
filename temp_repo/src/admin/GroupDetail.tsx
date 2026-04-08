import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import AdminLayout, { C, Badge, Btn, Card, InputField, STEPS, STEP_LABELS } from "./AdminLayout";

// ── types ─────────────────────────────────────────────────────────────────────

interface Session { step: string; status: string; data: unknown; updated_at: string; }
interface Group { id: string; name: string; group_code: string; facilitator: string; access_token: string; workshop_id: string; }
interface Member { id: string; name: string; title: string; seniority: string; department: string; is_leader: boolean; }

const EMPTY_MEMBER = { name: "", title: "", seniority: "", department: "", is_leader: false };

// ── MemberForm (inline add/edit) ──────────────────────────────────────────────

function MemberForm({
  initial, onSave, onCancel,
}: { initial: Omit<Member, "id">; onSave: (m: Omit<Member, "id">) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ background: `${C.blue}05`, border: `1px solid ${C.blue}30`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <InputField label="姓名 *" name="name" value={form.name} onChange={set("name")} placeholder="王小明" required />
        <InputField label="職稱" name="title" value={form.title} onChange={set("title")} placeholder="業務主任" />
        <InputField label="年資" name="seniority" value={form.seniority} onChange={set("seniority")} placeholder="3年" />
        <InputField label="部門" name="department" value={form.department} onChange={set("department")} placeholder="業務部" />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: C.gray, marginBottom: 12 }}>
        <input type="checkbox" checked={form.is_leader} onChange={e => setForm(f => ({ ...f, is_leader: e.target.checked }))} />
        設為組長
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn disabled={saving || !form.name.trim()} onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}>
          {saving ? "儲存中..." : "儲存"}
        </Btn>
        <Btn variant="ghost" onClick={onCancel}>取消</Btn>
      </div>
    </div>
  );
}

// ── MembersSection ────────────────────────────────────────────────────────────

function MembersSection({ workshopId, groupId }: { workshopId: string; groupId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [importErr, setImportErr] = useState("");
  const [importOk, setImportOk] = useState("");

  const loadMembers = async () => {
    const r = await fetch(`/api/workshops/${workshopId}/groups/${groupId}/members`);
    setMembers(r.ok ? await r.json() : []);
    setLoading(false);
  };

  useEffect(() => { loadMembers(); }, [groupId]);

  const handleAdd = async (m: Omit<Member, "id">) => {
    await fetch(`/api/workshops/${workshopId}/groups/${groupId}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m),
    });
    setAdding(false);
    loadMembers();
  };

  const handleEdit = async (id: string, m: Omit<Member, "id">) => {
    await fetch(`/api/workshops/${workshopId}/groups/${groupId}/members/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m),
    });
    setEditId(null);
    loadMembers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此成員？")) return;
    await fetch(`/api/workshops/${workshopId}/groups/${groupId}/members/${id}`, { method: "DELETE" });
    loadMembers();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportErr(""); setImportOk("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      const toSend = rows.map(r => ({
        name: r.name || r["姓名"] || "",
        title: r.title || r["職稱"] || "",
        seniority: r.seniority || r["年資"] || "",
        department: r.department || r["部門"] || "",
        is_leader: ["true","1","yes","是"].includes(String(r.is_leader || r["是否組長"] || "").toLowerCase()),
      })).filter(r => r.name.trim());
      if (!toSend.length) { setImportErr("找不到有效成員資料，請確認 name / 姓名 欄位存在"); return; }
      let ok = 0;
      for (const m of toSend) {
        const r = await fetch(`/api/workshops/${workshopId}/groups/${groupId}/members`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m),
        });
        if (r.ok) ok++;
      }
      setImportOk(`成功匯入 ${ok} 位成員`);
      loadMembers();
    } catch {
      setImportErr("檔案解析失敗，請確認格式為 Excel 或 CSV");
    }
  };

  return (
    <Card style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>
          分組名單{members.length > 0 && <span style={{ fontWeight: 400, color: C.muted, fontSize: 13, marginLeft: 6 }}>（{members.length} 人）</span>}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleImportFile} />
          <Btn variant="ghost" onClick={() => fileRef.current?.click()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            匯入 Excel / CSV
          </Btn>
          {!adding && (
            <Btn onClick={() => { setAdding(true); setEditId(null); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              新增成員
            </Btn>
          )}
        </div>
      </div>

      {importErr && <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "8px 12px", color: C.red, fontSize: 13, marginBottom: 12 }}>⚠️ {importErr}</div>}
      {importOk && <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: "8px 12px", color: "#065F46", fontSize: 13, marginBottom: 12 }}>✓ {importOk}</div>}

      {adding && (
        <div style={{ marginBottom: 12 }}>
          <MemberForm initial={EMPTY_MEMBER} onSave={handleAdd} onCancel={() => setAdding(false)} />
        </div>
      )}

      {loading && <p style={{ color: C.muted, fontSize: 13 }}>載入中...</p>}

      {!loading && members.length === 0 && !adding && (
        <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
          尚無成員，可手動新增或匯入 Excel / CSV
        </p>
      )}

      {members.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["姓名", "職稱", "年資", "部門", "組長", "操作"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontWeight: 700, color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <React.Fragment key={m.id}>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: C.text }}>{m.name}</td>
                    <td style={{ padding: "8px 10px", color: C.gray }}>{m.title || "—"}</td>
                    <td style={{ padding: "8px 10px", color: C.gray }}>{m.seniority || "—"}</td>
                    <td style={{ padding: "8px 10px", color: C.gray }}>{m.department || "—"}</td>
                    <td style={{ padding: "8px 10px" }}>
                      {m.is_leader && <span style={{ background: `${C.blue}12`, color: C.blue, border: `1px solid ${C.blue}30`, borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>組長</span>}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setEditId(editId === m.id ? null : m.id)}
                          style={{ border: `1px solid ${C.border}`, background: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 12, cursor: "pointer", color: C.gray, fontFamily: "'Outfit',sans-serif" }}
                        >編輯</button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          style={{ border: `1px solid ${C.redBorder}`, background: C.redBg, borderRadius: 6, padding: "3px 10px", fontSize: 12, cursor: "pointer", color: C.red, fontFamily: "'Outfit',sans-serif" }}
                        >刪除</button>
                      </div>
                    </td>
                  </tr>
                  {editId === m.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: "8px 10px" }}>
                        <MemberForm
                          initial={{ name: m.name, title: m.title, seniority: m.seniority, department: m.department, is_leader: m.is_leader }}
                          onSave={data => handleEdit(m.id, data)}
                          onCancel={() => setEditId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── GroupDetail ───────────────────────────────────────────────────────────────

export default function GroupDetail() {
  const { workshopId, groupId } = useParams<{ workshopId: string; groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editingFacilitator, setEditingFacilitator] = useState(false);
  const [facilitatorVal, setFacilitatorVal] = useState("");

  useEffect(() => {
    if (!workshopId || !groupId) return;
    (async () => {
      const [gRes, sRes] = await Promise.all([
        fetch(`/api/workshops/${workshopId}/groups/${groupId}`),
        fetch(`/api/sessions/${workshopId}/${groupId}`),
      ]);
      const g = gRes.ok ? await gRes.json() : null;
      setGroup(g);
      setFacilitatorVal(g?.facilitator || "");
      setSessions(sRes.ok ? await sRes.json() : []);
      setLoading(false);
    })();
  }, [workshopId, groupId]);

  const getSession = (step: string) => sessions.find(s => s.step === step);
  const handleCopy = () => {
    if (!group) return;
    navigator.clipboard.writeText(`${window.location.origin}/entry/workshop?token=${group.access_token}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveFacilitator = async () => {
    await fetch(`/api/workshops/${workshopId}/groups/${groupId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facilitator: facilitatorVal }),
    });
    setGroup(g => g ? { ...g, facilitator: facilitatorVal } : g);
    setEditingFacilitator(false);
  };

  if (loading) return <AdminLayout><p style={{ color: C.muted, padding: 48 }}>載入中...</p></AdminLayout>;
  if (!group) return <AdminLayout><p style={{ color: C.muted, padding: 48 }}>找不到此小組。</p></AdminLayout>;

  const completedSteps = STEPS.filter(s => getSession(s)?.status === "completed");
  const pct = Math.round((completedSteps.length / STEPS.length) * 100);

  return (
    <AdminLayout title={group.name}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: C.blue, letterSpacing: "0.08em", textTransform: "uppercase" }}>小組</p>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, marginBottom: 6, color: C.text }}>{group.name}</h1>
            {group.group_code && <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>編號：{group.group_code}</p>}

            {/* Facilitator inline edit */}
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              {editingFacilitator ? (
                <>
                  <input
                    value={facilitatorVal}
                    onChange={e => setFacilitatorVal(e.target.value)}
                    placeholder="輸入小幫手姓名"
                    style={{ border: `1px solid ${C.blue}`, borderRadius: 7, padding: "5px 10px", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }}
                    autoFocus
                  />
                  <Btn onClick={saveFacilitator}>儲存</Btn>
                  <Btn variant="ghost" onClick={() => { setEditingFacilitator(false); setFacilitatorVal(group.facilitator); }}>取消</Btn>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 13, color: group.facilitator ? C.gray : C.yellow }}>
                    {group.facilitator ? `小幫手：${group.facilitator}` : "⚠ 未指派小幫手"}
                  </span>
                  <button onClick={() => setEditingFacilitator(true)} style={{ border: "none", background: "none", color: C.blue, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", padding: 0 }}>
                    編輯
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Access token display */}
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>小組代碼</span>
            <code style={{
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 7, padding: "4px 12px",
              fontSize: 15, fontWeight: 800, letterSpacing: "0.12em", color: C.text,
              fontFamily: "monospace",
            }}>
              {group.access_token}
            </code>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn variant="ghost" onClick={handleCopy}>
              {copied ? "✓ 已複製連結" : "複製入口連結"}
            </Btn>
            <Btn onClick={() => window.open(`/ws/${workshopId}/${groupId}/work?from=admin`, "_blank")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              進入工作區
            </Btn>
            <Btn variant="ghost" onClick={() => navigate(`/admin/workshops/${workshopId}`)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              返回工作坊
            </Btn>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>整體進度</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: completedSteps.length === STEPS.length ? C.green : C.blue }}>
            {completedSteps.length}/{STEPS.length} 步驟完成
          </span>
        </div>
        <div style={{ height: 8, background: C.bg, borderRadius: 9999, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: completedSteps.length === STEPS.length ? `linear-gradient(90deg, ${C.green}, #16A34A)` : `linear-gradient(90deg, ${C.blue}, ${C.gradLight})`,
            borderRadius: 9999, transition: "width 0.4s ease",
          }} />
        </div>
      </Card>

      {/* Steps grid */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>步驟詳情</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {STEPS.map(step => {
            const s = getSession(step);
            const isActive = activeStep === step;
            return (
              <button key={step} onClick={() => setActiveStep(isActive ? null : step)} disabled={!s} style={{
                background: isActive ? `${C.blue}08` : C.panel, border: `1px solid ${isActive ? C.blue : C.border}`,
                borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center",
                justifyContent: "space-between", cursor: s ? "pointer" : "default",
                textAlign: "left", fontFamily: "'Outfit','Noto Sans TC',sans-serif",
                opacity: s ? 1 : 0.5, transition: "all 0.15s", gap: 8,
              }}>
                <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{STEP_LABELS[step]}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Badge status={s?.status ?? "not_started"} />
                  {s && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round"
                      style={{ transform: isActive ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step data viewer */}
      {activeStep && getSession(activeStep) && (
        <Card style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{STEP_LABELS[activeStep]} — 原始資料</h3>
            <span style={{ color: C.muted, fontSize: 12 }}>更新：{new Date(getSession(activeStep)!.updated_at).toLocaleString("zh-TW")}</span>
          </div>
          <pre style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16,
            fontSize: 12, color: C.gray, overflowX: "auto", whiteSpace: "pre-wrap",
            wordBreak: "break-word", margin: 0, maxHeight: 440, overflowY: "auto",
            fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6,
          }}>
            {JSON.stringify(getSession(activeStep)!.data, null, 2)}
          </pre>
        </Card>
      )}

      {/* Members section */}
      <MembersSection workshopId={workshopId!} groupId={groupId!} />

      {/* Report */}
      {completedSteps.length > 0 && (
        <Card>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 24px", color: C.text }}>摘要報告</h2>
          <ReportSummary sessions={sessions} />
        </Card>
      )}
    </AdminLayout>
  );
}

// ── ReportSummary (unchanged) ─────────────────────────────────────────────────

function ReportSummary({ sessions }: { sessions: Session[] }) {
  const get = (step: string) => sessions.find(s => s.step === step)?.data as Record<string, unknown> | undefined;
  const define   = get("define")    as { confirmedCeoGoal?: string; groupPainPoints?: string } | undefined;
  const aiCollab = get("ai-collab") as { scenes?: Record<string, { name?: string; aiRole?: string; expectedImprovement?: string; isPriority?: boolean }> } | undefined;
  const priority = get("priority")  as { evaluations?: Record<string, { isFirstWave?: boolean; reason?: string; impact?: number; feasibility?: number }> } | undefined;

  const sections: React.ReactNode[] = [];

  if (define?.confirmedCeoGoal) {
    sections.push(
      <Section key="goal" title="核心目標">
        <p style={{ margin: 0, lineHeight: 1.8, color: C.text, fontSize: 14 }}>{define.confirmedCeoGoal}</p>
        {define.groupPainPoints && <p style={{ margin: "10px 0 0", color: C.muted, lineHeight: 1.8, fontSize: 13 }}>主要痛點：{define.groupPainPoints}</p>}
      </Section>,
    );
  }

  if (aiCollab?.scenes) {
    const scenes = Object.values(aiCollab.scenes);
    const list = scenes.filter(s => s.isPriority).length ? scenes.filter(s => s.isPriority) : scenes;
    if (list.length) {
      sections.push(
        <Section key="scenes" title={`AI 協作場景（共 ${list.length} 個）`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {list.map((scene, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", border: `1px solid ${C.border}` }}>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 4, fontSize: 14 }}>{scene.name}</div>
                {scene.aiRole && <div style={{ color: C.muted, fontSize: 13 }}>AI 角色：{scene.aiRole}</div>}
                {scene.expectedImprovement && <div style={{ color: C.muted, fontSize: 13 }}>預期改善：{scene.expectedImprovement}</div>}
              </div>
            ))}
          </div>
        </Section>,
      );
    }
  }

  if (priority?.evaluations) {
    const firstWave = Object.entries(priority.evaluations)
      .filter(([, v]) => v.isFirstWave)
      .sort(([, a], [, b]) => (b.impact ?? 0) + (b.feasibility ?? 0) - ((a.impact ?? 0) + (a.feasibility ?? 0)));
    if (firstWave.length) {
      sections.push(
        <Section key="priority" title={`第一波優先執行（${firstWave.length} 個場景）`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {firstWave.map(([id, ev], i) => (
              <div key={id} style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 3 }}>優先場景 {i + 1}</div>
                  {ev.reason && <div style={{ color: C.muted, fontSize: 13 }}>{ev.reason}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <span style={{ background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>影響 {ev.impact ?? "—"}</span>
                  <span style={{ background: C.yellowBg, color: C.yellow, border: `1px solid ${C.yellowBorder}`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>可行性 {ev.feasibility ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>,
      );
    }
  }

  if (sections.length === 0) return <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>尚無足夠資料產生摘要。</p>;
  return <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>{sections}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>{title}</h3>
      {children}
    </div>
  );
}

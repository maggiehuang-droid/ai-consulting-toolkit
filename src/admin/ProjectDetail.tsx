import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight, FileText, Play } from "lucide-react";
import AdminLayout, { C, Btn, Card, InputField } from "./AdminLayout";

const WORKFLOW_PHASES = [
  {
    id: "phase1",
    phase: "Phase 1｜目標對齊＋現況盤點",
    duration: "前2週",
    items: [
      { id: "p1_1", title: "決定第一階段工作坊預計執行時間", actionLabel: "設定時間" },
      { id: "p1_2", title: "對齊今年最重要的營運目標", actionLabel: "填寫目標" },
      { id: "p1_3", title: "目前營運上想優化的方向", actionLabel: "填寫方向" },
      { id: "p1_4", title: "指派 Internal owner", actionLabel: "設定 Owner" },
      { id: "p1_5", title: "提供參加人員清單及分組名單", actionLabel: "匯入名單" },
      { id: "p1_6", title: "提供痛點訪談問卷", actionLabel: "發送問卷" },
      { id: "p1_7", title: "蒐集各部門問卷", actionLabel: "查看進度" },
      { id: "p1_8", title: "進行必要部門 Keyman 訪談", actionLabel: "紀錄訪談" },
      { id: "p1_9", title: "整理並收斂痛點報告", actionLabel: "產生報告" }
    ],
    outputs: [
      { id: "out_p1_1", title: "工作坊時程表" },
      { id: "out_p1_2", title: "營運目標與優化方向確認單" },
      { id: "out_p1_3", title: "分組名單" },
      { id: "out_p1_4", title: "痛點訪談報告" }
    ]
  },
  {
    id: "phase2",
    phase: "Phase 2｜第一階段 Workshop",
    duration: "3小時",
    items: [
      { id: "p2_1", title: "釐清目前的營運流程", actionLabel: "進入工作坊" },
      { id: "p2_2", title: "找出關鍵問題與卡點", actionLabel: "進入工作坊" },
      { id: "p2_3", title: "初步盤點 AI 可以應用的場景", actionLabel: "進入工作坊" },
      { id: "p2_4", title: "建立 AI 應用基礎概念及知識", actionLabel: "進入工作坊" },
      { id: "p2_5", title: "將可導入AI解決方案的工作流程排出優先順序", actionLabel: "進入工作坊" },
      { id: "p2_6", title: "協助各組完成工作坊後作業並回收提交", actionLabel: "查看作業" }
    ],
    outputs: [
      { id: "out_p2_1", title: "現況流程與痛點地圖" },
      { id: "out_p2_2", title: "AI 應用場景優先順序" }
    ]
  },
  {
    id: "phase3",
    phase: "Phase 3｜第二階段 Workshop",
    duration: "3小時 (與前一場間隔2週)",
    items: [
      { id: "p3_1", title: "收斂最值得做的 1–2 個 AI 應用", actionLabel: "進入工作坊" },
      { id: "p3_2", title: "分組共創實際的流程與使用情境", actionLabel: "進入工作坊" },
      { id: "p3_3", title: "成果分享並定義初步 KPI 與後續執行方向", actionLabel: "產出報告" }
    ],
    outputs: [
      { id: "out_p3_1", title: "AI 應用實作情境" },
      { id: "out_p3_2", title: "後續執行 KPI 與 Roadmap" }
    ]
  }
];

interface ProjectDetailData {
  id: string;
  title: string;
  description: string;
  date: string;
  project_amount: number;
  project_status: string;
  completed_tasks: string[];
  completed_outputs: string[];
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("planning");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [completedOutputs, setCompletedOutputs] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(r => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(data => {
        setProject(data);
        setAmount(data.project_amount?.toString() || "0");
        setStatus(data.project_status || "planning");
        setCompletedTasks(data.completed_tasks || []);
        setCompletedOutputs(data.completed_outputs || []);
        setLoading(false);
      })
      .catch(() => {
        navigate("/admin/projects");
      });
  }, [projectId, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_amount: parseInt(amount, 10) || 0,
          project_status: status,
          completed_tasks: completedTasks,
          completed_outputs: completedOutputs
        })
      });
      alert("專案資訊已儲存！");
    } catch (e) {
      alert("儲存失敗");
    }
    setSaving(false);
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev =>
      prev.includes(taskId) ? prev.filter(t => t !== taskId) : [...prev, taskId]
    );
  };

  const toggleOutput = (outId: string) => {
    setCompletedOutputs(prev =>
      prev.includes(outId) ? prev.filter(o => o !== outId) : [...prev, outId]
    );
  };

  const handleAction = (item: any) => {
    if (item.actionLabel === "進入工作坊") {
      navigate(`/admin/workshops/${projectId}`);
    } else if (item.actionLabel === "匯入名單") {
      navigate(`/admin/workshops/${projectId}/groups/new`);
    } else {
      // 預設行為：標記為完成
      if (!completedTasks.includes(item.id)) {
        toggleTask(item.id);
      }
    }
  };

  if (loading) return <AdminLayout title="載入中..."><p style={{ padding: 40, textAlign: "center", color: C.muted }}>載入中...</p></AdminLayout>;
  if (!project) return null;

  const totalTasks = WORKFLOW_PHASES.reduce((acc, phase) => acc + phase.items.length, 0);
  const completedCount = completedTasks.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100) || 0;

  // 找出當前階段與下一步
  let nextTask: any = null;
  let currentPhase: any = null;
  for (const phase of WORKFLOW_PHASES) {
    for (const item of phase.items) {
      if (!completedTasks.includes(item.id)) {
        nextTask = item;
        currentPhase = phase;
        break;
      }
    }
    if (nextTask) break;
  }
  if (!currentPhase) currentPhase = WORKFLOW_PHASES[WORKFLOW_PHASES.length - 1];

  return (
    <AdminLayout title={project.title}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <button onClick={() => navigate("/admin/projects")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: C.muted }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: C.text }}>{project.title}</h1>
          </div>
          <p style={{ color: C.muted, margin: "0 0 0 36px", fontSize: 14 }}>
            {project.date ? new Date(project.date + "T00:00:00").toLocaleDateString("zh-TW") : "未設定日期"}
          </p>
        </div>
        <Btn onClick={handleSave} disabled={saving}>{saving ? "儲存中..." : "儲存專案資訊"}</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32, alignItems: "start" }}>
        
        {/* 左側：專案資訊 (弱化設計) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>專案資訊</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InputField
                label="專案金額 (NT$)"
                name="amount"
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="例如：150000"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, color: C.gray, fontWeight: 600 }}>專案狀態</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{
                    background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10,
                    padding: "10px 14px", color: C.text, fontSize: 14, outline: "none"
                  }}
                >
                  <option value="planning">規劃中</option>
                  <option value="active">進行中</option>
                  <option value="completed">已結案</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>整體進度</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: C.muted }}>完成度</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.blue }}>{progressPercent}%</span>
            </div>
            <div style={{ width: "100%", height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: C.blue, transition: "width 0.3s ease" }} />
            </div>
            <p style={{ fontSize: 13, color: C.muted, margin: "12px 0 0", textAlign: "center" }}>
              已完成 {completedCount} / {totalTasks} 項任務
            </p>
          </div>
        </div>

        {/* 右側：行動控制台 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          
          {/* 1. 當前階段與下一步 (Top Banner) */}
          <div style={{ 
            background: `linear-gradient(135deg, ${C.techBlue} 0%, ${C.blue} 100%)`, 
            borderRadius: 20, padding: "32px 40px", color: "white", 
            display: "flex", justifyContent: "space-between", alignItems: "center", 
            boxShadow: `0 12px 32px ${C.blue}30` 
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.8, marginBottom: 8 }}>
                當前階段：{currentPhase?.phase || "已結案"}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3 }}>
                下一步：{nextTask?.title || "所有任務已完成！"}
              </div>
            </div>
            {nextTask && (
              <button onClick={() => handleAction(nextTask)} style={{ 
                background: "white", color: C.techBlue, border: "none", 
                padding: "14px 28px", borderRadius: 99, fontSize: 16, fontWeight: 700, 
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8, 
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", transition: "transform 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                {nextTask.actionLabel}
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          {/* 2. 產出物區塊 */}
          {currentPhase && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <img src="https://i.ibb.co/cSgSMhxg/icon-toolkit.png" alt="toolkit" style={{ width: 24, height: 24, objectFit: "contain" }} referrerPolicy="no-referrer" />
                本階段產出物
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                {currentPhase.outputs.map((out: any) => {
                  const isOutDone = completedOutputs.includes(out.id);
                  return (
                    <div key={out.id} onClick={() => toggleOutput(out.id)} style={{ 
                      background: isOutDone ? C.greenBg : "#fff", 
                      border: `1px solid ${isOutDone ? C.greenBorder : C.border}`, 
                      borderRadius: 12, padding: "20px", cursor: "pointer", 
                      transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 12,
                      boxShadow: isOutDone ? "none" : "0 2px 8px rgba(0,0,0,0.04)"
                    }}
                    onMouseEnter={e => { if (!isOutDone) e.currentTarget.style.borderColor = C.blue; }}
                    onMouseLeave={e => { if (!isOutDone) e.currentTarget.style.borderColor = C.border; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: 8, 
                          background: isOutDone ? `${C.green}20` : `${C.blue}15`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isOutDone ? C.green : C.blue
                        }}>
                          {isOutDone ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isOutDone ? C.green : C.muted }}>
                          {isOutDone ? "已產出" : "待產出"}
                        </span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: isOutDone ? C.text : C.gray, lineHeight: 1.4 }}>
                        {out.title}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 3. 任務卡清單 */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 20 }}>任務清單與行動</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {WORKFLOW_PHASES.map(phase => {
                const isCurrentPhase = phase.id === currentPhase?.id;
                const phaseCompletedCount = phase.items.filter(item => completedTasks.includes(item.id)).length;
                const isPhaseDone = phaseCompletedCount === phase.items.length;

                return (
                  <div key={phase.id} style={{ opacity: isCurrentPhase || isPhaseDone ? 1 : 0.6, transition: "opacity 0.3s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: isPhaseDone ? C.green : (isCurrentPhase ? C.blue : C.gray), margin: 0 }}>
                        {phase.phase}
                      </h4>
                      <span style={{ fontSize: 12, color: isPhaseDone ? C.green : C.muted, background: isPhaseDone ? C.greenBg : C.bg, padding: "2px 8px", borderRadius: 99, border: `1px solid ${isPhaseDone ? C.greenBorder : C.border}` }}>
                        {phaseCompletedCount} / {phase.items.length}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {phase.items.map(item => {
                        const isChecked = completedTasks.includes(item.id);
                        const isNext = nextTask?.id === item.id;
                        
                        return (
                          <div key={item.id} style={{
                            display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                            background: isChecked ? C.bg : "#fff", 
                            border: `1px solid ${isNext ? C.blue : (isChecked ? C.border : C.border)}`, 
                            borderRadius: 12,
                            boxShadow: isNext ? `0 0 0 1px ${C.blue}` : "none",
                            transition: "all 0.2s"
                          }}>
                            <div onClick={() => toggleTask(item.id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {isChecked ? <CheckCircle2 size={24} color={C.green} /> : <Circle size={24} color={C.borderHov} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 16, fontWeight: 600, color: isChecked ? C.muted : C.text, textDecoration: isChecked ? "line-through" : "none" }}>
                                {item.title}
                              </div>
                            </div>
                            <button onClick={() => handleAction(item)} style={{
                              background: isChecked ? "transparent" : (isNext ? C.blue : C.bg),
                              color: isChecked ? C.muted : (isNext ? "#fff" : C.techBlue),
                              border: isChecked ? `1px solid ${C.border}` : "none",
                              padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 6,
                              transition: "all 0.2s"
                            }}>
                              {isNext && <Play size={14} fill="currentColor" />}
                              {item.actionLabel}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}

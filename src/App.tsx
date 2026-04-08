import React, { useState, useEffect } from "react";
import { useSession } from "./SessionContext";
import WorkflowBreakdownWorkflow from "./WorkflowBreakdownWorkflow";
import PainMapWorkflow from "./PainMapWorkflow";
import AICollabWorkflow from "./AICollabWorkflow";
import KnowledgeExtractionWorkflow from "./KnowledgeExtractionWorkflow";
import PrioritySortingWorkflow from "./PrioritySortingWorkflow";
import ExportReportPage from "./ExportReportPage";

const C = {
  blue: "#4586F0",
  techBlue: "#1F49A3",
  gradLight: "#B5D1FE",
  gray: "#36393D",
  cloud: "#F6F8F9",
  dark: "#222A36",
};

const FONT = "'Outfit', 'Noto Sans TC', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

// Asset paths (relative to project public folder)
const ASSETS = {
  heroBg: "https://i.ibb.co/hJmhKtbT/Gemini-Generated-Image-t4y0dut4y0dut4y0.png",
  toolkit: "https://i.ibb.co/cSgSMhxg/icon-toolkit.png",
  logo: "https://i.ibb.co/MxgTGTLH/Logo-black.png",
};

const ADVISOR_TOOLS = [
  { id: "define", title: "定義問題", desc: "CEO對齊，產出工作表" },
  { id: "workflow", title: "拆解工作流", desc: "上傳SOP，寫下卡點" },
  { id: "painmap", title: "痛點地圖", desc: "找出痛點根因" },
  { id: "ai-collab", title: "AI 協作場景", desc: "找到 AI 介入點" },
  { id: "knowledge", title: "知識提取", desc: "拆解隱性知識建檔" },
  { id: "priority", title: "優先排序", desc: "資源有限，排定優先場景" },
];

const GENERAL_TOOLS = [
  { id: "role-card", title: "品牌DNA", desc: "檢測品牌靈魂" },
  { id: "copywriter", title: "文案產生器", desc: "爆款文案公式" },
  { id: "knowledge-extract", title: "知識拆解", desc: "找出高價值隱性知識" },
  { id: "studio", title: "虛擬攝影棚", desc: "產出高質感商品圖" },
  { id: "faq", title: "FAQ建立", desc: "打造高品質客服回覆" },
  { id: "brand-kb", title: "品牌知識庫", desc: "建立有記憶的品牌大腦" },
];

function BrandLogo({ height = 36 }) {
  return (
    <a href="https://www.cresclab.com/tw" target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
      <img
        src={ASSETS.logo}
        alt="Crescendo Lab"
        style={{ height, width: "auto", objectFit: "contain", display: "block" }}
        referrerPolicy="no-referrer"
      />
    </a>
  );
}

function ToolkitIcon({ size = 48 }) {
  return (
    <img
      src={ASSETS.toolkit}
      alt=""
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      referrerPolicy="no-referrer"
    />
  );
}

/* ══════ HERO PAGE (PRD p.22) ══════ */
function HeroPage({ onEnter }) {
  const [s, setS] = useState(false);
  useEffect(() => { setTimeout(() => setS(true), 80); }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      fontFamily: FONT, display: "flex", flexDirection: "column",
    }}>
      {/* Full-bleed background image */}
      <img
        src={ASSETS.heroBg}
        alt=""
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          zIndex: 0,
        }}
        referrerPolicy="no-referrer"
      />

      {/* Main content — left aligned like PRD p.22 */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "0 10vw 15vh", maxWidth: 800, position: "relative", zIndex: 2,
      }}>
        <button onClick={onEnter} style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          background: C.techBlue, color: "#fff", border: "none", borderRadius: 9999,
          padding: "20px 64px", fontSize: 24, fontWeight: 700, fontFamily: FONT,
          cursor: "pointer", boxShadow: `0 6px 28px ${C.techBlue}40`,
          opacity: s ? 1 : 0, transform: s ? "none" : "translateY(12px)",
          transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s",
          width: "fit-content"
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 36px ${C.techBlue}55`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 6px 28px ${C.techBlue}40`; }}
        >
          打開工具箱
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16l4-4-4-4"/>
            <path d="M8 12h8"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ══════ TOOLBOX GRID (PRD p.23-24) ══════ */
function ToolCard({ tool, index, onSelect, buttonText = "開啟工具", status = 'available' }) {
  const [h, setH] = useState(false);
  const [v, setV] = useState(false);
  useEffect(() => { setTimeout(() => setV(true), 100 + index * 80); }, [index]);

  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  const getBackground = () => {
    if (isCompleted) return h ? `linear-gradient(180deg, #E6F0FA 0%, #D9E8F5 100%)` : "#F0F8FF";
    if (isInProgress) return h ? `linear-gradient(180deg, #FEF7E0 0%, #FCE8B2 100%)` : "#FFF8E1";
    if (isLocked) return "#F8F9FA";
    return h ? `linear-gradient(180deg, #fff 0%, ${C.gradLight}20 100%)` : "#fff";
  };

  const getBorder = () => {
    if (isLocked) return "3px solid #E4EAF2";
    if (isCompleted) return h ? `6px solid ${C.blue}` : "3px solid #D9E8F5";
    if (isInProgress) return h ? `6px solid #F29900` : "3px solid #FCE8B2";
    return h ? `6px solid ${C.blue}` : "3px solid #E4EAF2";
  };

  const getPadding = () => {
    if (isLocked) return "28px 24px 20px";
    return h ? "24px 20px 18px" : "28px 24px 20px";
  };

  return (
    <div
      onMouseEnter={() => !isLocked && setH(true)} onMouseLeave={() => !isLocked && setH(false)}
      onClick={() => !isLocked && onSelect(tool)}
      style={{
        position: "relative",
        background: getBackground(),
        border: getBorder(),
        borderRadius: 16, 
        padding: getPadding(),
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        cursor: isLocked ? "not-allowed" : "pointer",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        transform: v ? (h && !isLocked ? "translateY(-6px)" : "translateY(0)") : "translateY(20px)",
        opacity: v ? (isLocked ? 0.75 : 1) : 0,
        boxShadow: h && !isLocked ? `0 16px 40px ${C.blue}20` : "0 4px 12px rgba(0,0,0,0.04)",
        height: "100%",
        filter: isLocked ? "grayscale(30%)" : "none",
      }}
    >
      {/* Floating status icon top-left */}
      <div style={{ position: "absolute", top: -32, left: 20 }}>
        {isCompleted ? (
          <img src="https://i.ibb.co/s9rqsDqZ/check.png" alt="completed" style={{ width: 64, height: 64, objectFit: "contain", display: "block" }} />
        ) : isInProgress ? (
          <div style={{ width: 48, height: 48, background: "#F29900", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 12, marginTop: 8, marginLeft: 8, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>進行中</div>
        ) : isLocked ? (
          <img src="https://i.ibb.co/MD2gVWV1/lock.png" alt="locked" style={{ width: 64, height: 64, objectFit: "contain", display: "block", opacity: 0.6 }} />
        ) : (
          <ToolkitIcon size={64} />
        )}
      </div>

      <h3 style={{
        fontSize: 22, fontWeight: 800, fontStyle: "italic",
        color: C.blue, margin: "12px 0 8px", fontFamily: FONT, lineHeight: 1.2
      }}>{tool.title}</h3>

      <p style={{
        fontSize: 14, color: "#666", margin: "0 0 20px", lineHeight: 1.6, fontFamily: FONT, fontWeight: 500,
        flex: 1,
      }}>{tool.desc}</p>

      <button
        onClick={e => { e.stopPropagation(); if (!isLocked) onSelect(tool); }}
        disabled={isLocked}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: isLocked ? "#ccc" : (isCompleted ? C.dark : (isInProgress ? "#E65100" : C.blue)), color: "#fff", border: "none", borderRadius: 9999,
          padding: "10px 28px", fontSize: 15, fontWeight: 700,
          fontFamily: FONT, cursor: isLocked ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          boxShadow: h && !isLocked ? `0 6px 20px ${isCompleted ? C.dark : (isInProgress ? '#E65100' : C.blue)}30` : "none",
          marginTop: "auto",
        }}
      >
        {buttonText}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path d="M10 8l4 4-4 4" />
        </svg>
      </button>
    </div>
  );
}

function ToolboxGridPage({ tab, setTab, onBack, onSelectTool, advisorData = {} }) {
  const [s, setS] = useState(false);
  useEffect(() => { setTimeout(() => setS(true), 50); }, []);
  const tools = tab === "advisor" ? ADVISOR_TOOLS : GENERAL_TOOLS;

  const getToolStatus = (tool, index) => {
    if (tab !== "advisor") return 'available';
    
    const toolStatus = advisorData[tool.id]?.status;
    if (toolStatus === 'completed') return 'completed';
    if (toolStatus === 'in_progress') return 'in_progress';

    // It's available if it's the first one, or if the previous one is completed
    const previousTool = ADVISOR_TOOLS[index - 1];
    if (!previousTool || advisorData[previousTool.id]?.status === 'completed') {
      return 'available';
    }

    return 'locked';
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: `linear-gradient(180deg, #fff 0%, ${C.gradLight}15 50%, ${C.blue}08 100%)`,
      fontFamily: FONT, overflowY: "auto",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Noto+Sans+TC:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        @media(max-width:1024px){.tk-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:640px){.tk-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 10,
        background: C.cloud, backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8ECF2",
        opacity: s ? 1 : 0, transform: s ? "none" : "translateY(-8px)",
        transition: "all 0.5s ease",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", width: "100%",
          display: "flex", alignItems: "center", padding: "0 40px", height: 64,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
            <BrandLogo height={28} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setTab("general")} style={{
              padding: "10px 24px", borderRadius: 9999, border: "none",
              fontSize: 15, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
              background: C.blue, color: "#fff",
              boxShadow: `0 4px 16px ${C.blue}30`,
            }}>AI 通用工具箱</button>
          </div>
        </div>
      </nav>

      {/* Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px 100px" }}>
        <button onClick={onBack} style={{
          background: "transparent", border: "none",
          padding: "0 0 24px 0", fontSize: 15, fontWeight: 700,
          color: "#999", cursor: "pointer", fontFamily: FONT,
          display: "flex", alignItems: "center", gap: 6,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = C.blue; e.currentTarget.style.transform = "translateX(-4px)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#999"; e.currentTarget.style.transform = "none"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          返回首頁
        </button>

        {tab === "advisor" && (
          <div style={{ marginBottom: 32, background: "#fff", padding: "24px 32px", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #E8ECF2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>整體進度：{ADVISOR_TOOLS.filter(t => advisorData[t.id]?.status === 'completed').length}/6 completed</div>
              {ADVISOR_TOOLS.filter(t => advisorData[t.id]?.status === 'completed').length === 6 && (
                <button onClick={() => onSelectTool({ id: 'export-report' })} style={{
                  background: C.blue, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  導出顧問報告
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", width: "100%", overflowX: "auto", paddingBottom: 4 }}>
              {ADVISOR_TOOLS.map((t, i) => {
                const isCompleted = advisorData[t.id]?.status === 'completed';
                const isActive = !isCompleted && (i === 0 || advisorData[ADVISOR_TOOLS[i-1].id]?.status === 'completed');
                return (
                  <React.Fragment key={t.id}>
                    <div style={{ 
                      display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", fontSize: 14, fontWeight: 600,
                      color: isCompleted ? "#222A36" : (isActive ? C.blue : "#999"),
                      opacity: isCompleted || isActive ? 1 : 0.5
                    }}>
                      <span style={{ color: isCompleted ? "#389E0D" : "inherit" }}>Step {i + 1} {t.title}</span>
                    </div>
                    {i < ADVISOR_TOOLS.length - 1 && (
                      <div style={{ height: 2, width: 30, background: isCompleted ? "#389E0D" : "#E4EAF2", margin: "0 16px", flexShrink: 0 }}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        <div className="tk-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, paddingTop: 16,
        }}>
          {tools.map((tool, i) => {
            const status = tab === "advisor" ? getToolStatus(tool, i) : 'available';
            let btnText = "開啟工具";
            if (tab === "advisor") {
              if (status === 'completed') btnText = "查看結果";
              else if (status === 'in_progress') btnText = "繼續作答";
              else btnText = "查看環節";
            }
            return (
              <ToolCard key={tool.id} tool={tool} index={i} onSelect={onSelectTool} buttonText={btnText} status={status} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════ ACTION CANVAS (70:30 split, PRD p.27) ══════ */
function ActionCanvas({ tool, onBack }) {
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", fontFamily: FONT }}>
      <div style={{ flex: 7, background: "#fff", overflowY: "auto", borderRight: "1px solid #E8ECF2" }}>
        <div style={{ padding: "16px 28px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 12 }}>
          <BrandLogo height={28} />
          <div style={{ width: 1, height: 20, background: "#ddd", margin: "0 4px" }} />
          <span style={{ fontSize: 13, color: "#999", fontFamily: FONT_MONO }}>{tool.title}</span>
        </div>
        <div style={{ padding: "32px 36px" }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", cursor: "pointer", display: "flex",
            alignItems: "center", gap: 6, color: C.blue, fontSize: 13, fontWeight: 600,
            padding: "4px 0", marginBottom: 28, fontFamily: FONT,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            回到工具箱
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.dark, margin: "0 0 8px" }}>{tool.title}</h1>
          <p style={{ fontSize: 14, color: "#888", margin: "0 0 36px" }}>{tool.desc}</p>
          <div style={{
            background: `linear-gradient(135deg, ${C.cloud} 0%, ${C.gradLight}12 100%)`,
            border: `2px dashed ${C.gradLight}`, borderRadius: 16,
            padding: "56px 32px", textAlign: "center", color: C.blue, fontSize: 14, fontWeight: 500,
          }}>在此開始填寫，右側 AI Agent 將即時給予回饋</div>
        </div>
      </div>

      <div style={{
        flex: 3, background: `linear-gradient(180deg, ${C.cloud} 0%, ${C.gradLight}18 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 32, textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: `${C.blue}12`,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <BrandLogo height={36} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 8px" }}>AI Agent</p>
        <p style={{ fontSize: 13, color: "#999", lineHeight: 1.7, maxWidth: 200 }}>
          開始填寫左側內容後，Agent 會即時提供分析建議
        </p>
        <div style={{
          marginTop: 24, padding: "8px 16px", borderRadius: 8,
          background: `${C.blue}08`, fontSize: 11, color: C.blue, fontFamily: FONT_MONO,
        }}>waiting for input...</div>
      </div>
    </div>
  );
}

/* ══════ ADVISOR PANEL (View 2) ══════ */
const STAGE_CONTENT = {
  "define": {
    intro: "協助團隊先對齊 CEO 目標與部門 KPI，釐清目前最核心、最值得優先處理的問題，作為後續流程分析與 AI 設計的基礎。",
    outputs: ["部門 KPI 與 CEO 目標關聯", "核心問題定義", "痛點影響分析"]
  },
  "workflow": {
    intro: "將實際工作流程逐步拆開，整理任務步驟、角色分工、資訊流與決策節點，還原工作真正的運作方式。",
    outputs: ["現況流程圖", "關鍵角色與分工整理", "資訊流與決策節點盤點"]
  },
  "painmap": {
    intro: "根據流程找出各環節中的卡點與阻礙，盤點造成效率低落、重工、延遲或溝通成本高的關鍵問題。",
    outputs: ["流程痛點盤點", "痛點類型分類", "高影響問題清單"]
  },
  "ai-collab": {
    intro: "將前面盤點出的問題轉化為具體的 AI 協作方式，判斷哪些任務適合由 AI 協助，建立可落地的應用場景。",
    outputs: ["AI 可介入場景清單", "人工與 AI 分工方式", "可驗證的協作情境設計"]
  },
  "knowledge": {
    intro: "整理完成工作所需的關鍵知識，包括判斷邏輯、作業規則、常見回應與隱性經驗，建立可被 AI 使用的知識基礎。",
    outputs: ["關鍵知識清單", "可結構化的規則與內容", "後續知識庫基礎資料"]
  },
  "priority": {
    intro: "綜合問題、流程、痛點與場景後，判斷哪些項目最值得先做，建立清楚的 AI 導入順序與推進方向。",
    outputs: ["AI 導入優先清單", "價值與可行性評估", "建議推進順序"]
  }
};

function StageIntroductionPage({ tool, onBack, onStart }) {
  const content = STAGE_CONTENT[tool.id] || STAGE_CONTENT["define"];

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "repeating-linear-gradient(45deg, rgba(0,0,0,0.006) 0px, rgba(0,0,0,0.006) 1px, transparent 1px, transparent 20px), linear-gradient(135deg, #F4F8FB 0%, #FFFFFF 100%)",
      fontFamily: FONT, overflowY: "auto",
      padding: "60px 40px",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center"
    }}>
      {/* Top Title */}
      <h1 style={{
        fontSize: 32, fontWeight: 800, color: C.dark, marginBottom: 32, fontFamily: FONT, letterSpacing: "0.5px"
      }}>{tool.title}</h1>

      {/* Main Container */}
      <div style={{
        background: "#fff",
        borderRadius: 32,
        boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.04)",
        maxWidth: 1000,
        width: "74%",
        display: "flex",
        overflow: "hidden",
        minHeight: 460
      }}>
        {/* Left Column */}
        <div style={{
          flex: "0 0 38%",
          background: "#FAFCFF",
          borderRight: "1px solid rgba(228, 234, 242, 0.6)",
          padding: "40px",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          justifyContent: "center"
        }}>
          <img src="https://i.ibb.co/QFs9t5ry/info.png" alt="info" style={{ 
            width: 200, height: 200, objectFit: "contain",
            filter: "contrast(1.15) drop-shadow(0 12px 24px rgba(0,0,0,0.08))"
          }} />
        </div>

        {/* Right Column */}
        <div style={{
          flex: "0 0 62%",
          padding: "48px 56px",
          display: "flex", flexDirection: "column"
        }}>
          {/* Section 1 & 2: 環節說明 */}
          <div style={{ marginBottom: 36 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 4, height: 18, background: C.blue, borderRadius: 4 }}></span>
              環節說明
            </h3>
            <p style={{ fontSize: 15, color: "#555", lineHeight: 1.7, maxWidth: "96%", paddingLeft: 16 }}>
              {content.intro}
            </p>
          </div>

          {/* Section 3: 預期產出 */}
          <div style={{ marginBottom: 36 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 4, height: 18, background: C.blue, borderRadius: 4 }}></span>
              預期產出
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 16 }}>
              {content.outputs.map((out, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", background: "#E8F0FE", color: C.blue,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0, marginTop: 2
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 15, color: "#444", lineHeight: 1.7, fontWeight: 600 }}>
                    {out}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: 按鈕區 */}
          <div style={{ marginTop: "auto", display: "flex", gap: 16, justifyContent: "flex-end", paddingTop: 16 }}>
            <button onClick={onBack} style={{
              background: "#fff", color: C.blue, border: `2px solid ${C.blue}`,
              padding: "12px 32px", borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F4F7FF"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
            >返回總覽</button>
            <button onClick={onStart} style={{
              background: C.blue, color: "#fff", border: "2px solid transparent",
              padding: "12px 32px", borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 6px 16px rgba(26, 115, 232, 0.25)"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1557B0"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(26, 115, 232, 0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.boxShadow = "0 6px 16px rgba(26, 115, 232, 0.25)"; }}
            >開始共創</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════ ADVISOR WORKFLOW (View 3) ══════ */
function DefineProblemWorkflow({ tool, onBack, onComplete, advisorData, setAdvisorData }) {
  const toolData = advisorData[tool.id]?.data || {};
  const toolStatus = advisorData[tool.id]?.status || 'in_progress';

  const [ceoGoal, setCeoGoal] = useState(toolData.ceoGoal || "");
  const [groupPainPoints, setGroupPainPoints] = useState(toolData.groupPainPoints || "");
  const [groupPriorityImprovement, setGroupPriorityImprovement] = useState(toolData.groupPriorityImprovement || "");

  const [individualInputs, setIndividualInputs] = useState(
    toolData.individualInputs || Array.from({ length: 5 }, () => ({
      name: "",
      role: "",
      directObstacle: "",
      personalContribution: ""
    }))
  );
  
  const [expandedCardIndex, setExpandedCardIndex] = useState(0);
  
  const [confirmedCeoGoal, setConfirmedCeoGoal] = useState(toolData.confirmedCeoGoal || "");

  const [currentState, setCurrentState] = useState(toolStatus === 'completed' ? 'completed_readonly' : 'editing'); // 'editing', 'summary_pending', 'needs_update', 'completed_readonly'
  const [hasConfirmedBefore, setHasConfirmedBefore] = useState(toolStatus === 'completed');

  const completedIndividualCardsCount = individualInputs.filter(input => 
    input.name.trim() !== "" || 
    input.role.trim() !== "" || 
    input.directObstacle.trim() !== "" || 
    input.personalContribution.trim() !== ""
  ).length;

  const isMinRequirementsMet = 
    ceoGoal.trim() !== "" && 
    groupPainPoints.trim() !== "" && 
    groupPriorityImprovement.trim() !== "" && 
    completedIndividualCardsCount >= 3;

  const isReadOnly = currentState === 'summary_pending' || currentState === 'completed_readonly';

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (hasConfirmedBefore && currentState === 'editing') {
      setCurrentState('needs_update');
    } else if (hasConfirmedBefore && currentState === 'confirmed') {
       setCurrentState('needs_update');
    }
  };

  const handleIndividualChange = (index, field, value) => {
    const newInputs = [...individualInputs];
    newInputs[index][field] = value;
    setIndividualInputs(newInputs);
    
    if (hasConfirmedBefore && currentState === 'editing') {
      setCurrentState('needs_update');
    } else if (hasConfirmedBefore && currentState === 'confirmed') {
       setCurrentState('needs_update');
    }
  };

  const requestSummary = () => {
    setCurrentState('summary_pending');
  };

  const returnToEdit = () => {
    setCurrentState('editing');
  };

  const confirmSummaryAndComplete = () => {
    setCurrentState('completed_readonly');
    setHasConfirmedBefore(true);
    setConfirmedCeoGoal(ceoGoal);
    
    setAdvisorData(prev => ({
      ...prev,
      [tool.id]: {
        status: 'completed',
        data: { ceoGoal, groupPainPoints, groupPriorityImprovement, individualInputs, confirmedCeoGoal: ceoGoal }
      }
    }));

    if (onComplete) {
      onComplete(tool.id);
    }
  };

  const cancelUpdate = () => {
    setCeoGoal(confirmedCeoGoal);
    setCurrentState('completed_readonly');
  };

  const handleBack = () => {
    if (currentState !== 'completed_readonly') {
      setAdvisorData(prev => ({
        ...prev,
        [tool.id]: {
          status: prev[tool.id]?.status === 'completed' ? 'completed' : 'in_progress',
          data: { ceoGoal, groupPainPoints, groupPriorityImprovement, individualInputs, confirmedCeoGoal }
        }
      }));
    }
    onBack();
  };

  const handleSaveDraft = () => {
    setAdvisorData(prev => ({
      ...prev,
      [tool.id]: {
        status: prev[tool.id]?.status === 'completed' ? 'completed' : 'in_progress',
        data: { ceoGoal, groupPainPoints, groupPriorityImprovement, individualInputs, confirmedCeoGoal }
      }
    }));
  };

  const isTooVague = (text) => {
    const vagueWords = ["效率不好", "很多問題", "希望改善", "加強溝通"];
    return vagueWords.some(word => text.includes(word));
  };

  const vaguePainPoints = isTooVague(groupPainPoints);
  const vagueImprovement = isTooVague(groupPriorityImprovement);

  let footerStatusText = "狀態：未達最低條件";
  let footerStatusColor = "#5F6368";
  if (currentState === 'completed_readonly') {
    footerStatusText = "狀態：已完成";
    footerStatusColor = "#389E0D";
  } else if (currentState === 'editing') {
    if (isMinRequirementsMet) {
      footerStatusText = "狀態：已達摘要生成條件";
      footerStatusColor = "#202124";
    }
  } else if (currentState === 'summary_pending') {
    footerStatusText = "狀態：待確認摘要";
    footerStatusColor = "#202124";
  } else if (currentState === 'needs_update') {
    footerStatusText = "狀態：已修改內容，後續階段基礎可能受影響，請重新產生摘要。";
    footerStatusColor = "#D48806";
  }

  // AI Agent text
  let aiAgentText = null;
  if (currentState === 'summary_pending' || currentState === 'needs_update' || currentState === 'completed_readonly') {
    aiAgentText = (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px", lineHeight: "1.6" }}>
        <div>
          <strong style={{ color: "#1F49A3", display: "block", marginBottom: 4 }}>1. 本組共同理解的 CEO 目標</strong>
          <p style={{ margin: 0, color: "#222A36" }}>{ceoGoal}</p>
        </div>
        <div>
          <strong style={{ color: "#1F49A3", display: "block", marginBottom: 4 }}>2. 本組共識認為的主要卡點</strong>
          <p style={{ margin: 0, color: "#222A36" }}>{groupPainPoints}</p>
        </div>
        <div>
          <strong style={{ color: "#1F49A3", display: "block", marginBottom: 4 }}>3. 本組共識認為的優先改善方向</strong>
          <p style={{ margin: 0, color: "#222A36" }}>{groupPriorityImprovement}</p>
        </div>
        <div>
          <strong style={{ color: "#1F49A3", display: "block", marginBottom: 4 }}>4. 組員個人工作阻礙與可協助改善的整理摘要</strong>
          <p style={{ margin: 0, color: "#222A36" }}>已整合 {completedIndividualCardsCount} 位組員的觀點。主要阻礙集中在現有流程的斷點，團隊成員建議透過跨部門協作與工具導入來提升效率，以支持核心指標的達成。</p>
        </div>
      </div>
    );
  } else if (!isMinRequirementsMet) {
    const missingItems = [];
    if (ceoGoal.trim() === "") missingItems.push("尚未填寫 CEO 目標");
    if (groupPainPoints.trim() === "") missingItems.push("缺少小組共識卡點描述");
    if (groupPriorityImprovement.trim() === "") missingItems.push("缺少優先改善方向");
    if (completedIndividualCardsCount < 3) missingItems.push(`目前僅有 ${completedIndividualCardsCount} 位組員完成個人填答（需至少 3 位）`);

    aiAgentText = (
      <>
        <strong style={{ color: "#D48806" }}>目前尚未達產出摘要條件，缺少以下內容：</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
          {missingItems.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
        </ul>
      </>
    );
  } else if (vaguePainPoints || vagueImprovement) {
    aiAgentText = (
      <>
        <strong style={{ color: "#D48806" }}>內容可能過於空泛，建議補充：</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
          {vaguePainPoints && <li style={{ marginBottom: 4 }}>卡點描述過於抽象，請補充具體情境或發生在哪一段旅程</li>}
          {vagueImprovement && <li style={{ marginBottom: 4 }}>改善方向過於抽象，請說明具體改善方式</li>}
        </ul>
      </>
    );
  } else {
    aiAgentText = (
      <>
        <strong style={{ color: "#389E0D" }}>已達可產出摘要條件</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
          <li style={{ marginBottom: 4 }}>已填寫 CEO 目標</li>
          <li style={{ marginBottom: 4 }}>已收集小組共識卡點</li>
          <li style={{ marginBottom: 4 }}>已收集優先改善方向</li>
          <li style={{ marginBottom: 4 }}>已收到至少 3 位組員個人觀點</li>
        </ul>
      </>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "#F6F8F9",
      color: "#222A36",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      display: "flex", flexDirection: "column",
      overflow: "hidden", zIndex: 100
    }}>
      <style>{`
        .app-header { background-color: #FFFFFF; padding: 0 32px; height: 64px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #E2E4E8; flex-shrink: 0; }
        .app-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .progress-header { background: #FFFFFF; padding: 16px 32px; border-bottom: 1px solid #E2E4E8; display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .progress-text { font-size: 14px; font-weight: 600; color: #1F49A3; }
        .stepper { display: flex; align-items: center; width: 100%; overflow-x: auto; padding-bottom: 4px; }
        .step { display: flex; align-items: center; gap: 8px; opacity: 0.4; transition: opacity 0.3s; white-space: nowrap; font-size: 14px; font-weight: 500; color: #5F6368; }
        .step.active { opacity: 1; color: #4586F0; font-weight: 600; }
        .step.completed { opacity: 1; color: #222A36; }
        .step.completed .step-text { color: #389E0D; }
        .step-line { height: 2px; width: 30px; background: #DADCE0; margin: 0 16px; flex-shrink: 0; transition: background 0.3s; }
        .step-line.completed { background: #389E0D; }
        .workspace-header { padding: 16px 32px; background: #FFFFFF; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #E2E4E8; }
        .back-btn { color: #5F6368; cursor: pointer; font-size: 14px; text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .back-btn:hover { color: #4586F0; }
        .main-content { padding: 32px; display: flex; justify-content: center; flex-grow: 1; overflow-y: auto; }
        .content-wrapper { display: flex; gap: 24px; width: 100%; max-width: 1200px; align-items: flex-start; }
        .form-area { flex: 1; display: flex; flex-direction: column; gap: 16px; }
        .white-card { background: #FFFFFF; border-radius: 8px; border: 1px solid #E2E4E8; padding: 32px; transition: opacity 0.3s; }
        .form-group { margin-bottom: 24px; }
        .form-group h4 { margin-bottom: 8px; font-size: 15px; color: #222A36; font-weight: 600;}
        .input-box { width: 100%; background: #FFFFFF; border: 1px solid #E2E4E8; border-radius: 6px; padding: 12px 16px; font-size: 14px; resize: vertical; min-height: 80px; font-family: inherit; transition: all 0.2s; }
        .input-box:focus { outline: none; border-color: #4586F0; box-shadow: 0 0 0 3px rgba(69, 134, 240, 0.1); }
        .input-box:disabled { background: #F6F8F9; color: #5F6368; cursor: not-allowed; }
        .summary-card { background: #F0F5FF; border: 1px solid #B5D1FE; border-radius: 8px; padding: 24px; animation: fadeIn 0.3s ease; }
        .summary-card h3 { color: #1F49A3; margin-bottom: 12px; font-size: 16px; }
        .ai-agent-widget { width: 340px; flex-shrink: 0; background: #FFFFFF; border-radius: 8px; border: 1px solid #E2E4E8; position: sticky; top: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.02); align-self: flex-start; }
        .ai-header { padding: 16px; font-weight: 600; font-size: 14px; border-bottom: 1px solid #E2E4E8; display: flex; align-items: center; gap: 8px; }
        .ai-body { padding: 20px 16px; font-size: 13px; line-height: 1.6; color: #5F6368; min-height: 120px; }
        .footer { background: #FFFFFF; border-top: 1px solid #E2E4E8; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;}
        .btn { background-color: #4586F0; color: #FFFFFF; border: none; padding: 8px 24px; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 500; transition: 0.2s; }
        .btn:hover:not(:disabled) { background-color: #1F49A3; }
        .btn-outline { background-color: transparent; color: #222A36; border: 1px solid #E2E4E8; }
        .btn-outline:hover:not(:disabled) { background-color: #F6F8F9; }
        .btn:disabled, .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
        .footer-state-group { display: flex; gap: 12px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <header className="workspace-header" style={{ height: 64, padding: "0 32px" }}>
        <a onClick={onBack} className="back-btn" style={{ fontSize: 15, fontWeight: 600 }}>← 返回上一頁</a>
        <div style={{ width: 1, height: 16, background: "#DADCE0", margin: "0 16px" }}></div>
        <strong id="workspace-title" style={{ fontSize: 16, color: "#222A36" }}>{tool.title}</strong>
      </header>

      <div className="progress-header">
        <div className="stepper">
          {ADVISOR_TOOLS.map((t, i) => {
            const isActive = t.id === tool.id;
            const isPast = ADVISOR_TOOLS.findIndex(x => x.id === tool.id) > i;
            return (
              <React.Fragment key={t.id}>
                <div className={`step ${isActive ? 'active' : ''} ${isPast ? 'completed' : ''}`}>
                  <span className="step-text">Step {i + 1} {t.title}</span>
                </div>
                {i < ADVISOR_TOOLS.length - 1 && (
                  <div className={`step-line ${isPast ? 'completed' : ''}`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="main-content">
        <div className="content-wrapper">
          <div className="form-area">
            <div className="white-card" id="form-section-group" style={{ opacity: isReadOnly ? 0.5 : 1, marginBottom: 24, padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F49A3", marginBottom: 24, borderBottom: "2px solid #F0F5FF", paddingBottom: 12 }}>A. 小組共識區</h3>
              
              <div className="form-group">
                <h4>1. 本次 CEO 目標是什麼？</h4>
                <p style={{ fontSize: 13, color: "#5F6368", marginBottom: 8, marginTop: 0 }}>這裡填寫這組對 CEO 目標的共同理解，請以工作坊現場已對齊的版本為準</p>
                <textarea className="input-box" value={ceoGoal} onChange={handleInputChange(setCeoGoal)} disabled={isReadOnly} />
              </div>

              <div className="form-group">
                <h4>2. 從小組共識來看，在顧客旅程中有哪些卡點正在影響目標無法達成？</h4>
                <p style={{ fontSize: 13, color: "#5F6368", marginBottom: 8, marginTop: 0 }}>請優先描述顧客旅程或營運流程中的卡點。不要只寫抽象抱怨，例如「很多問題」「效率不好」</p>
                <textarea className="input-box" value={groupPainPoints} onChange={handleInputChange(setGroupPainPoints)} disabled={isReadOnly} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <h4>3. 從小組共識來看，若要更接近目標，最應優先改善的是什麼？</h4>
                <p style={{ fontSize: 13, color: "#5F6368", marginBottom: 8, marginTop: 0 }}>這裡填的是小組認為最值得優先處理的方向。請寫具體改善方向，不要只寫「加強管理」「優化流程」</p>
                <textarea className="input-box" value={groupPriorityImprovement} onChange={handleInputChange(setGroupPriorityImprovement)} disabled={isReadOnly} />
              </div>
            </div>

            <div id="form-section-individual" style={{ opacity: isReadOnly ? 0.5 : 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F49A3", marginBottom: 8 }}>B. 個人填答區</h3>
              <p style={{ fontSize: 14, color: "#5F6368", marginBottom: 24, marginTop: 0 }}>收每位組員從自身工作執掌看到的阻礙與可行改善</p>

              {individualInputs.map((input, index) => {
                const isExpanded = expandedCardIndex === index;
                return (
                  <div key={index} className="white-card" style={{ marginBottom: 16, padding: isExpanded ? "24px 32px" : "16px 32px", cursor: isExpanded ? "default" : "pointer" }} onClick={() => !isExpanded && setExpandedCardIndex(index)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: isExpanded ? "1px solid #E2E4E8" : "none", paddingBottom: isExpanded ? 12 : 0, marginBottom: isExpanded ? 16 : 0 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 600, color: "#222A36", margin: 0 }}>
                        {index === 0 ? "組長" : `組員 ${index}`} {input.name ? `- ${input.name}` : ""}
                      </h4>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#5F6368", fontSize: 14 }} onClick={(e) => { e.stopPropagation(); setExpandedCardIndex(isExpanded ? -1 : index); }}>
                        {isExpanded ? "收合 ▲" : "展開 ▼"}
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <div style={{ animation: "fadeIn 0.3s ease" }}>
                        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>姓名</label>
                            <input type="text" className="input-box" style={{ minHeight: 40 }} value={input.name} onChange={(e) => handleIndividualChange(index, 'name', e.target.value)} disabled={isReadOnly} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>角色 / 部門</label>
                            <input type="text" className="input-box" style={{ minHeight: 40 }} placeholder="例如：行銷、會員營運、客服、門市" value={input.role} onChange={(e) => handleIndividualChange(index, 'role', e.target.value)} disabled={isReadOnly} />
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 20 }}>
                          <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>從你的工作執掌來看，這些卡點目前最直接卡住你的是什麼？</label>
                          <p style={{ fontSize: 12, color: "#5F6368", marginBottom: 8, marginTop: 0 }}>這裡填個人觀察，不必和其他人完全一致。請描述你實際工作中遇到的阻礙</p>
                          <textarea className="input-box" value={input.directObstacle} onChange={(e) => handleIndividualChange(index, 'directObstacle', e.target.value)} disabled={isReadOnly} />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>從你的工作角色出發，你可以怎麼調整或改善，協助組織更接近這個目標？</label>
                          <p style={{ fontSize: 12, color: "#5F6368", marginBottom: 8, marginTop: 0 }}>請寫你可以實際做的行動。可包含流程、資料、協作、執行方式的改變</p>
                          <textarea className="input-box" value={input.personalContribution} onChange={(e) => handleIndividualChange(index, 'personalContribution', e.target.value)} disabled={isReadOnly} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="ai-agent-widget">
            <div className="ai-header">
              <img src="https://i.ibb.co/tTMyH0Rm/robot.png" alt="AI" style={{ width: 20, height: 20 }} referrerPolicy="no-referrer" />
              AI 顧問摘要與檢查
            </div>
            <div className="ai-body" id="ai-agent-text">
              {aiAgentText}
            </div>
          </aside>
        </div>
      </div>

      <footer className="footer">
        <div style={{ fontSize: 14, fontWeight: 500, color: footerStatusColor }} id="footer-status-text">
          {footerStatusText}
        </div>
        
        <div>
          {currentState === 'editing' && (
            <div className="footer-state-group" id="actions-editing">
              <button className="btn btn-outline" style={{ borderRadius: 4 }} onClick={handleSaveDraft}>儲存草稿</button>
              <button className="btn" style={{ borderRadius: 4 }} id="btn-submit-summary" disabled={!isMinRequirementsMet} onClick={requestSummary}>產生摘要</button>
            </div>
          )}
          {currentState === 'summary_pending' && (
            <div className="footer-state-group" id="actions-summary">
              <button className="btn btn-outline" style={{ borderRadius: 4 }} onClick={returnToEdit}>返回修改</button>
              <button className="btn" style={{ borderRadius: 4 }} onClick={confirmSummaryAndComplete}>確認並完成本階段</button>
            </div>
          )}
          {currentState === 'needs_update' && (
            <div className="footer-state-group" id="actions-reedit">
              <button className="btn btn-outline" style={{ borderRadius: 4 }} onClick={cancelUpdate}>取消修改</button>
              <button className="btn" style={{ borderRadius: 4 }} onClick={requestSummary}>重新產生摘要</button>
            </div>
          )}
          {currentState === 'completed_readonly' && (
            <div className="footer-state-group" id="actions-readonly">
              <button className="btn btn-outline" style={{ borderRadius: 4 }} onClick={() => setCurrentState('editing')}>修改本階段</button>
              <button className="btn" style={{ borderRadius: 4 }} onClick={handleBack}>返回首頁</button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

/* ══════ ROUTER ══════ */
interface AppProps {
  initialData?: Record<string, { status: string; data: unknown }>;
  startOnToolbox?: boolean;
}

export default function App({ initialData, startOnToolbox }: AppProps = {}) {
  const [page, setPage] = useState(startOnToolbox ? "toolbox" : "hero");
  const [tool, setTool] = useState(null);
  const [tab, setTab] = useState(startOnToolbox ? "advisor" : "general");
  const [advisorData, setAdvisorData] = useState<Record<string, { status: string; data: unknown }>>(initialData || {});
  const { saveStep } = useSession();

  // Intercept advisorData updates: when a step becomes "completed", auto-save to API
  const setAdvisorDataWithSave = (updater: ((prev: Record<string, { status: string; data: unknown }>) => Record<string, { status: string; data: unknown }>) | Record<string, { status: string; data: unknown }>) => {
    setAdvisorData(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      Object.entries(next).forEach(([toolId, toolData]) => {
        if (toolData?.status === "completed" && prev[toolId]?.status !== "completed") {
          saveStep(toolId, "completed", toolData.data);
        }
      });
      return next;
    });
  };

  const handleSelectTool = (t) => {
    if (t.id === "export-report") {
      setPage("export-report");
      return;
    }
    if (t.id === "copywriter") {
      window.open("/copywriter.html", "_blank");
    } else if (t.id === "studio") {
      window.open("/studio.html", "_blank");
    } else if (t.id === "role-card") {
      window.open("/brand-dna.html", "_blank");
    } else if (t.id === "knowledge-extract") {
      window.open("/knowledge-extract.html", "_blank");
    } else if (t.id === "faq") {
      window.open("/faq-architect.html", "_blank");
    } else if (t.id === "brand-kb") {
      window.open("https://notebooklm.google.com/notebook/585b48d2-62af-4d2e-8fdc-d00b4dc63ef8", "_blank");
    } else {
      setTool(t);
      if (tab === "advisor") {
        const status = advisorData[t.id]?.status || 'not_started';
        if (status === 'not_started') {
          setPage("advisor-panel");
        } else {
          setPage("advisor-workflow");
        }
      } else {
        setPage("action");
      }
    }
  };

  const handleStartWorkflow = () => {
    setAdvisorData(prev => ({
      ...prev,
      [tool.id]: {
        ...prev[tool.id],
        status: prev[tool.id]?.status === 'completed' ? 'completed' : 'in_progress'
      }
    }));
    setPage("advisor-workflow");
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Noto+Sans+TC:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');`}</style>
      {page === "hero" && <HeroPage onEnter={() => setPage("toolbox")} />}
      {page === "toolbox" && <ToolboxGridPage tab={tab} setTab={setTab} onBack={() => setPage("hero")} onSelectTool={handleSelectTool} advisorData={advisorData} />}
      {page === "action" && tool && <ActionCanvas tool={tool} onBack={() => setPage("toolbox")} />}
      {page === "advisor-panel" && tool && <StageIntroductionPage tool={tool} onBack={() => setPage("toolbox")} onStart={handleStartWorkflow} />}
      {page === "advisor-workflow" && tool && tool.id === "define" && <DefineProblemWorkflow tool={tool} onBack={() => setPage("toolbox")} onComplete={(toolId) => {
        setPage("toolbox");
      }} advisorData={advisorData} setAdvisorData={setAdvisorDataWithSave} />}
      {page === "advisor-workflow" && tool && tool.id === "workflow" && <WorkflowBreakdownWorkflow tool={tool} onBack={() => setPage("toolbox")} onComplete={(toolId) => {
        setPage("toolbox");
      }} advisorData={advisorData} setAdvisorData={setAdvisorDataWithSave} />}
      {page === "advisor-workflow" && tool && tool.id === "painmap" && <PainMapWorkflow tool={tool} onBack={() => setPage("toolbox")} onComplete={(toolId) => {
        setPage("toolbox");
      }} advisorData={advisorData} setAdvisorData={setAdvisorDataWithSave} />}
      {page === "advisor-workflow" && tool && tool.id === "ai-collab" && <AICollabWorkflow tool={tool} onBack={() => setPage("toolbox")} onComplete={(toolId) => {
        setPage("toolbox");
      }} advisorData={advisorData} setAdvisorData={setAdvisorDataWithSave} />}
      {page === "advisor-workflow" && tool && tool.id === "knowledge" && <KnowledgeExtractionWorkflow tool={tool} onBack={() => setPage("toolbox")} onComplete={(toolId) => {
        setPage("toolbox");
      }} advisorData={advisorData} setAdvisorData={setAdvisorDataWithSave} />}
      {page === "advisor-workflow" && tool && tool.id === "priority" && <PrioritySortingWorkflow tool={tool} onBack={() => setPage("toolbox")} onComplete={(toolId) => {
        setPage("toolbox");
      }} advisorData={advisorData} setAdvisorData={setAdvisorDataWithSave} />}
      {page === "export-report" && <ExportReportPage onBack={() => setPage("toolbox")} advisorData={advisorData} />}
    </>
  );
}

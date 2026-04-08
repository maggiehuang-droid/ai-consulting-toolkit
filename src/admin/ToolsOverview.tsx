import React from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { C, Btn } from "./AdminLayout";

const GENERAL_TOOLS = [
  { id: "role-card", title: "品牌DNA", desc: "檢測品牌靈魂" },
  { id: "copywriter", title: "文案產生器", desc: "爆款文案公式" },
  { id: "knowledge-extract", title: "知識拆解", desc: "找出高價值隱性知識" },
  { id: "studio", title: "虛擬攝影棚", desc: "產出高質感商品圖" },
  { id: "brand-kb", title: "品牌知識庫", desc: "建立有記憶的品牌大腦" },
  { id: "faq", title: "FAQ建立", desc: "打造高品質客服回覆" },
];

export default function ToolsOverview() {
  const navigate = useNavigate();

  const handleOpenTool = (toolId: string) => {
    if (toolId === "copywriter") {
      window.open("/copywriter.html", "_blank");
    } else if (toolId === "studio") {
      window.open("/studio.html", "_blank");
    } else if (toolId === "role-card") {
      window.open("/brand-dna.html", "_blank");
    } else if (toolId === "knowledge-extract") {
      window.open("/knowledge-extract.html", "_blank");
    } else if (toolId === "faq") {
      window.open("/faq-architect.html", "_blank");
    } else if (toolId === "brand-kb") {
      window.open("https://notebooklm.google.com/notebook/585b48d2-62af-4d2e-8fdc-d00b4dc63ef8", "_blank");
    }
  };

  return (
    <AdminLayout title="工具入口總覽">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
        <Btn 
          onClick={() => window.open("/tools", "_blank")}
          style={{ 
            background: C.blue, 
            color: "#fff", 
            padding: "12px 24px", 
            fontSize: 16, 
            borderRadius: 8,
            boxShadow: `0 4px 12px ${C.blue}40`
          }}
        >
          Admin 進入畫面
        </Btn>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: 32 
      }}>
        {GENERAL_TOOLS.map((tool) => (
          <div 
            key={tool.id}
            style={{
              background: "#fff",
              border: `2px solid ${C.border}`,
              borderRadius: 24,
              padding: "32px 24px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 32px ${C.blue}15`;
              e.currentTarget.style.borderColor = `${C.blue}40`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.03)";
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <div style={{ position: "absolute", top: -24, left: 24 }}>
              <img 
                src="https://i.ibb.co/cSgSMhxg/icon-toolkit.png" 
                alt="toolkit" 
                style={{ width: 64, height: 64, objectFit: "contain" }} 
                referrerPolicy="no-referrer"
              />
            </div>
            
            <h3 style={{ 
              fontSize: 24, 
              fontWeight: 800, 
              color: C.blue, 
              margin: "16px 0 8px",
              letterSpacing: "0.5px"
            }}>
              {tool.title}
            </h3>
            
            <p style={{ 
              fontSize: 15, 
              color: C.gray, 
              margin: "0 0 24px",
              fontWeight: 500,
              flex: 1
            }}>
              {tool.desc}
            </p>

            <button 
              onClick={() => handleOpenTool(tool.id)}
              style={{
                background: C.blue,
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "12px 32px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                width: "fit-content"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = C.techBlue;
                e.currentTarget.style.boxShadow = `0 4px 12px ${C.blue}40`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = C.blue;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              開啟工具
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
                <path d="M10 8l4 4-4 4" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

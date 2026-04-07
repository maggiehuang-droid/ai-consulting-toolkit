import React, { useState } from "react";

const C = {
  blue: "#4586F0",
  techBlue: "#1F49A3",
  gradLight: "#B5D1FE",
  gray: "#36393D",
  cloud: "#F6F8F9",
  dark: "#222A36",
  red: "#D93025",
  orange: "#F29900",
  green: "#137333",
};

export default function ExportReportPage({ onBack, advisorData }: { onBack: () => void, advisorData: any }) {
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });
  
  const toggleChapter = (index: number) => {
    setExpandedChapters(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Extract data from all steps
  const defineData = advisorData['define']?.data || {};
  const workflowData = advisorData['workflow']?.data || {};
  const painmapData = advisorData['painmap']?.data?.analyzedData || {};
  const aiCollabData = advisorData['ai-collab']?.data?.scenes || {};
  const knowledgeData = advisorData['knowledge']?.data?.knowledgeList || [];
  const priorityData = advisorData['priority']?.data?.evaluations || {};

  const projectName = workflowData.journeyName || "未命名專案";
  const ceoGoal = defineData.ceoGoal || "未填寫";
  const groupPainPoints = defineData.groupPainPoints || "未填寫";
  const groupPriorityImprovement = defineData.groupPriorityImprovement || "未填寫";
  const individualInputs = defineData.individualInputs || [];

  // Root causes
  const rootCauses = Object.values(painmapData).filter((d: any) => d.rootCause);
  const categoriesCount = rootCauses.flatMap((d: any) => d.categories || []).reduce((acc: any, cat: string) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoriesCount).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

  // AI Scenes
  const scenes = Object.values(aiCollabData).filter((s: any) => s.name);
  
  // Priority
  const firstWaveScenes = Object.entries(priorityData)
    .filter(([_, evalData]: [string, any]) => evalData.isFirstWave === true)
    .map(([id, _]) => aiCollabData[id]?.name)
    .filter(Boolean);
    
  const secondWaveScenes = Object.entries(priorityData)
    .filter(([_, evalData]: [string, any]) => evalData.isFirstWave === false && evalData.impact !== "低")
    .map(([id, _]) => aiCollabData[id]?.name)
    .filter(Boolean);
    
  const postponedScenes = Object.entries(priorityData)
    .filter(([_, evalData]: [string, any]) => evalData.isFirstWave === false && evalData.impact === "低")
    .map(([id, _]) => aiCollabData[id]?.name)
    .filter(Boolean);

  const handleExportMarkdown = () => {
    let md = `# 顧問報告：${projectName}\n\n`;
    md += `## 任務總覽\n`;
    md += `- 本次聚焦問題：${ceoGoal}\n`;
    md += `- 主要根因：${topCategories.join("、") || "尚未分析"}\n`;
    md += `- AI 協作場景：共 ${scenes.length} 個\n`;
    md += `- 第一波優先建議：${firstWaveScenes.join("、") || "無"}\n\n`;
    
    md += `## 第 1 章：專案摘要\n`;
    md += `### CEO 目標\n${ceoGoal}\n\n`;
    md += `### 小組共識摘要\n${groupPainPoints}\n\n`;
    
    md += `## 第 2 章：問題定義\n`;
    md += `### 小組主要卡點\n${groupPainPoints}\n\n`;
    md += `### 優先改善方向\n${groupPriorityImprovement}\n\n`;
    md += `### 個人阻礙整理\n`;
    individualInputs.forEach((input: any) => {
      md += `- ${input.name}: ${input.painPoint}\n`;
    });
    md += `\n`;
    
    md += `## 第 3 章：顧客旅程與流程拆解\n`;
    md += `| 旅程階段 | 流程節點 | 主要卡點 | 影響程度 | 重點 |\n`;
    md += `|---|---|---|---|---|\n`;
    (workflowData.nodes || []).forEach((node: any) => {
      const stage = (workflowData.stages || []).find((s: any) => s.id === node.stageId);
      md += `| ${stage?.name || ""} | ${node.name || ""} | ${node.painPoint1 || ""} | ${node.impact || ""} | ${node.deepDive ? "是" : "否"} |\n`;
    });
    md += `\n`;
    
    md += `## 第 4 章：痛點地圖與根因分析\n`;
    md += `| 旅程階段 | 流程節點 | 主要卡點 | 顧客感受/影響 | 根因類別 | 具體根因 | 機會點/改善方向 |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    (workflowData.nodes || []).forEach((node: any) => {
      const stage = (workflowData.stages || []).find((s: any) => s.id === node.stageId);
      const analysis = painmapData[node.id];
      if (analysis && analysis.rootCause) {
        md += `| ${stage?.name || ""} | ${node.name || ""} | ${node.painPoint1 || ""} | ${analysis.customerImpact || ""} | ${(analysis.categories||[]).join(", ")} | ${analysis.rootCause || ""} | ${analysis.opportunity || ""} |\n`;
      }
    });
    md += `\n`;
    
    md += `## 第 5 章：AI 協作場景\n`;
    scenes.forEach((scene: any) => {
      md += `### ${scene.name}\n`;
      md += `- AI 角色：${scene.aiRole}\n`;
      md += `- 預期改善：${scene.expectedImprovement}\n\n`;
    });
    
    md += `## 第 6 章：知識與資料準備度\n`;
    md += `| 所需知識 | 現有來源 | 是否可用 | 缺漏內容 | 補齊建議 |\n`;
    md += `|---|---|---|---|---|\n`;
    knowledgeData.forEach((k: any) => {
      md += `| ${k.type || ""} | ${k.source || ""} | ${k.isReady ? "是" : "否"} | ${k.missingContent || ""} | ${k.suggestion || ""} |\n`;
    });
    md += `\n`;
    
    md += `## 第 7 章：優先排序與建議路徑\n`;
    md += `### 第一波優先執行\n${firstWaveScenes.join("、") || "無"}\n\n`;
    md += `### 第二波規劃\n${secondWaveScenes.join("、") || "無"}\n\n`;
    md += `### 暫緩項目\n${postponedScenes.join("、") || "無"}\n\n`;
    
    navigator.clipboard.writeText(md).then(() => {
      alert("報告 Markdown 已複製到剪貼簿！您可以貼上到 Notion 或 Word 中。");
    }).catch(err => {
      alert("複製失敗：" + err);
    });
  };

  const chapters = [
    {
      title: "第 1 章：專案摘要",
      content: (
        <div className="chapter-content-inner">
          <div className="ai-summary-box">
            <strong>🤖 AI 章首摘要：</strong> 本專案旨在解決「{ceoGoal}」的目標，團隊初步共識聚焦於「{groupPainPoints}」，後續將針對這些核心問題展開流程拆解與 AI 導入規劃。
          </div>
          <div className="data-section">
            <div className="data-block">
              <div className="data-label">CEO 目標</div>
              <div className="data-value">{ceoGoal}</div>
            </div>
            <div className="data-block">
              <div className="data-label">小組共識摘要</div>
              <div className="data-value">{groupPainPoints}</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "第 2 章：問題定義",
      content: (
        <div className="chapter-content-inner">
          <div className="ai-summary-box">
            <strong>🤖 AI 章首摘要：</strong> 團隊成員在日常作業中面臨多項阻礙，主要改善方向鎖定在「{groupPriorityImprovement}」，以下為各成員提出的具體痛點。
          </div>
          <div className="data-section">
            <div className="data-block">
              <div className="data-label">小組主要卡點</div>
              <div className="data-value">{groupPainPoints}</div>
            </div>
            <div className="data-block">
              <div className="data-label">優先改善方向</div>
              <div className="data-value">{groupPriorityImprovement}</div>
            </div>
            <div className="data-block">
              <div className="data-label">個人阻礙整理</div>
              <div className="data-value">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {individualInputs.map((input: any, i: number) => (
                    <li key={i} style={{ marginBottom: 4 }}><strong>{input.name}：</strong>{input.painPoint}</li>
                  ))}
                  {individualInputs.length === 0 && <li>尚未填寫個人阻礙</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "第 3 章：顧客旅程與流程拆解",
      content: (
        <div className="chapter-content-inner">
          <div className="ai-summary-box">
            <strong>🤖 AI 章首摘要：</strong> 透過拆解顧客旅程，我們盤點了各階段的流程節點，並標記出具有明顯問題的表象卡點，其中有 {(workflowData.nodes || []).filter((n:any) => n.deepDive).length} 個節點被列為下一步深挖重點。
          </div>
          <div className="table-responsive">
            <table className="report-table">
              <thead>
                <tr>
                  <th>旅程階段</th>
                  <th>流程節點</th>
                  <th>主要卡點</th>
                  <th>影響程度</th>
                  <th>重點</th>
                </tr>
              </thead>
              <tbody>
                {(workflowData.nodes || []).map((node: any) => {
                  const stage = (workflowData.stages || []).find((s: any) => s.id === node.stageId);
                  return (
                    <tr key={node.id}>
                      <td>{stage?.name || "-"}</td>
                      <td>{node.name || "-"}</td>
                      <td style={{ color: node.painPoint1 ? "#D93025" : "inherit" }}>{node.painPoint1 || "-"}</td>
                      <td>{node.impact || "-"}</td>
                      <td>{node.deepDive ? <span style={{ color: "#D97706", fontWeight: "bold" }}>是</span> : "否"}</td>
                    </tr>
                  );
                })}
                {(!workflowData.nodes || workflowData.nodes.length === 0) && (
                  <tr><td colSpan={5} style={{ textAlign: "center" }}>無資料</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      title: "第 4 章：痛點地圖與根因分析",
      content: (
        <div className="chapter-content-inner">
          <div className="ai-summary-box">
            <strong>🤖 AI 章首摘要：</strong> 針對重點卡點進行 5 Whys 追問與 MECE 分類後，發現主要根因集中在「{topCategories.join("、") || "尚未分析"}」，並初步擬定了改善方向。
          </div>
          <div className="table-responsive">
            <table className="report-table">
              <thead>
                <tr>
                  <th>旅程階段</th>
                  <th>流程節點</th>
                  <th>主要卡點</th>
                  <th>顧客感受/影響</th>
                  <th>根因類別</th>
                  <th>具體根因</th>
                  <th>機會點/改善方向</th>
                </tr>
              </thead>
              <tbody>
                {(workflowData.nodes || []).map((node: any) => {
                  const stage = (workflowData.stages || []).find((s: any) => s.id === node.stageId);
                  const analysis = painmapData[node.id];
                  if (!analysis || !analysis.rootCause) return null;
                  return (
                    <tr key={node.id}>
                      <td>{stage?.name || "-"}</td>
                      <td>{node.name || "-"}</td>
                      <td style={{ color: "#D93025" }}>{node.painPoint1 || "-"}</td>
                      <td>{analysis.customerImpact || "-"}</td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(analysis.categories || []).map((c: string) => <span key={c} className="tag-chip">{c}</span>)}
                        </div>
                      </td>
                      <td style={{ fontWeight: "bold", color: "#991B1B" }}>{analysis.rootCause || "-"}</td>
                      <td style={{ color: "#137333" }}>{analysis.opportunity || "-"}</td>
                    </tr>
                  );
                })}
                {Object.keys(painmapData).length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center" }}>無資料</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      title: "第 5 章：AI 協作場景",
      content: (
        <div className="chapter-content-inner">
          <div className="ai-summary-box">
            <strong>🤖 AI 章首摘要：</strong> 根據根因分析與改善方向，我們設計了 {scenes.length} 個 AI 協作場景，期望透過 AI 賦能解決現有痛點。
          </div>
          <div className="scene-cards-grid">
            {scenes.map((scene: any, i: number) => (
              <div key={i} className="scene-card">
                <div className="scene-card-title">{scene.name}</div>
                <div className="scene-card-row"><strong>AI 角色：</strong>{scene.aiRole}</div>
                <div className="scene-card-row"><strong>預期改善：</strong>{scene.expectedImprovement}</div>
              </div>
            ))}
            {scenes.length === 0 && <div style={{ padding: 16, color: "#6B7280" }}>無資料</div>}
          </div>
        </div>
      )
    },
    {
      title: "第 6 章：知識與資料準備度",
      content: (
        <div className="chapter-content-inner">
          <div className="ai-summary-box">
            <strong>🤖 AI 章首摘要：</strong> 為了讓 AI 場景順利落地，我們盤點了所需的知識與資料，發現有 {knowledgeData.filter((k:any) => !k.isReady).length} 項資料尚未準備齊全，需要優先補齊。
          </div>
          <div className="table-responsive">
            <table className="report-table">
              <thead>
                <tr>
                  <th>所需知識</th>
                  <th>現有來源</th>
                  <th>是否可用</th>
                  <th>缺漏內容</th>
                  <th>補齊建議</th>
                </tr>
              </thead>
              <tbody>
                {knowledgeData.map((k: any) => (
                  <tr key={k.id}>
                    <td>{k.type || "-"}</td>
                    <td>{k.source || "-"}</td>
                    <td>{k.isReady ? <span style={{ color: "#137333", fontWeight: "bold" }}>是</span> : <span style={{ color: "#D93025", fontWeight: "bold" }}>否</span>}</td>
                    <td>{k.missingContent || "-"}</td>
                    <td>{k.suggestion || "-"}</td>
                  </tr>
                ))}
                {knowledgeData.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center" }}>無資料</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      title: "第 7 章：優先排序與建議路徑",
      content: (
        <div className="chapter-content-inner">
          <div className="ai-summary-box">
            <strong>🤖 AI 章首摘要：</strong> 綜合評估各場景的業務價值與實作可行性，建議優先推動第一波場景，並將部分低影響或高門檻項目暫緩。
          </div>
          <div className="priority-section">
            <div className="priority-block first-wave">
              <h4>第一波優先執行</h4>
              <p>{firstWaveScenes.join("、") || "無"}</p>
            </div>
            <div className="priority-block second-wave">
              <h4>第二波規劃</h4>
              <p>{secondWaveScenes.join("、") || "無"}</p>
            </div>
            <div className="priority-block postponed">
              <h4>暫緩項目</h4>
              <p>{postponedScenes.join("、") || "無"}</p>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>排序理由摘要</h4>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "#374151" }}>
              {Object.entries(priorityData).map(([id, evalData]: [string, any]) => {
                const sceneName = aiCollabData[id]?.name;
                if (!sceneName || !evalData.reason) return null;
                return <li key={id} style={{ marginBottom: 4 }}><strong>{sceneName}：</strong>{evalData.reason}</li>;
              })}
            </ul>
          </div>
        </div>
      )
    }
  ];

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
        
        .main-content { flex: 1; overflow-y: auto; padding: 40px; display: flex; justify-content: center; }
        .report-container { max-width: 1000px; width: 100%; display: flex; flex-direction: column; gap: 32px; padding-bottom: 80px; }
        
        .status-banner { background: #1F49A3; color: #fff; border-radius: 12px; padding: 32px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(31,73,163,0.1); }
        .status-title { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .status-subtitle { font-size: 16px; opacity: 0.9; }
        
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .summary-card { background: #fff; border: 1px solid #E2E4E8; border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .summary-card-title { font-size: 14px; font-weight: 700; color: #5F6368; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-card-content { font-size: 16px; font-weight: 600; color: #1F2937; line-height: 1.5; }
        
        .chapter-list { background: #fff; border: 1px solid #E2E4E8; border-radius: 12px; overflow: hidden; }
        .chapter-header { background: #FAFAFA; padding: 16px 24px; border-bottom: 1px solid #E2E4E8; font-size: 18px; font-weight: 700; color: #1F2937; display: flex; justify-content: space-between; align-items: center; }
        
        .chapter-item { border-bottom: 1px solid #E2E4E8; }
        .chapter-item:last-child { border-bottom: none; }
        .chapter-title-bar { padding: 16px 24px; display: flex; align-items: center; gap: 16px; cursor: pointer; background: #fff; transition: background 0.2s; }
        .chapter-title-bar:hover { background: #F9FAFB; }
        .chapter-num { width: 32px; height: 32px; border-radius: 50%; background: #E8F0FE; color: #1F49A3; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .chapter-title { font-size: 16px; font-weight: 700; color: #1F2937; flex: 1; }
        .chapter-icon { color: #9CA3AF; transition: transform 0.3s; }
        .chapter-icon.expanded { transform: rotate(180deg); }
        
        .chapter-content { padding: 0; max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out, padding 0.3s ease-out; background: #FAFAFA; }
        .chapter-content.expanded { max-height: 2000px; padding: 24px; border-top: 1px solid #F3F4F6; }
        
        .chapter-content-inner { display: flex; flex-direction: column; gap: 20px; }
        
        .ai-summary-box { background: #E8F0FE; border: 1px solid #B5D1FE; border-radius: 8px; padding: 16px; font-size: 14px; color: #1F49A3; line-height: 1.6; }
        
        .data-section { display: flex; flex-direction: column; gap: 16px; }
        .data-block { background: #fff; border: 1px solid #E2E4E8; border-radius: 8px; padding: 16px; }
        .data-label { font-size: 13px; font-weight: 700; color: #5F6368; margin-bottom: 8px; text-transform: uppercase; }
        .data-value { font-size: 15px; color: #1F2937; line-height: 1.5; white-space: pre-wrap; }
        
        .table-responsive { overflow-x: auto; background: #fff; border: 1px solid #E2E4E8; border-radius: 8px; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px; }
        .report-table th { background: #F3F4F6; padding: 12px 16px; text-align: left; border-bottom: 1px solid #E2E4E8; border-right: 1px solid #E2E4E8; font-weight: 600; color: #374151; }
        .report-table td { padding: 12px 16px; border-bottom: 1px solid #E2E4E8; border-right: 1px solid #E2E4E8; vertical-align: top; color: #1F2937; }
        .report-table tr:last-child td { border-bottom: none; }
        .report-table th:last-child, .report-table td:last-child { border-right: none; }
        
        .tag-chip { background: #F3F4F6; padding: 2px 8px; border-radius: 4px; font-size: 12px; color: #4B5563; display: inline-block; }
        
        .scene-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .scene-card { background: #fff; border: 1px solid #E2E4E8; border-radius: 8px; padding: 16px; }
        .scene-card-title { font-size: 15px; font-weight: 700; color: #1F49A3; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #F3F4F6; }
        .scene-card-row { font-size: 13px; color: #374151; margin-bottom: 8px; line-height: 1.5; }
        
        .priority-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .priority-block { padding: 16px; border-radius: 8px; border: 1px solid #E2E4E8; background: #fff; }
        .priority-block h4 { margin: 0 0 12px 0; font-size: 14px; font-weight: 700; }
        .priority-block p { margin: 0; font-size: 14px; color: #374151; line-height: 1.5; }
        .first-wave { border-top: 4px solid #137333; }
        .second-wave { border-top: 4px solid #F29900; }
        .postponed { border-top: 4px solid #9CA3AF; }
        
        .action-bar { display: flex; justify-content: flex-end; gap: 16px; margin-top: 16px; position: sticky; bottom: 20px; background: rgba(246, 248, 249, 0.9); padding: 16px; border-radius: 12px; backdrop-filter: blur(4px); box-shadow: 0 -4px 12px rgba(0,0,0,0.05); }
        .btn { padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-outline { background: #FFFFFF; border: 1px solid #D1D5DB; color: #374151; }
        .btn-outline:hover { background: #F3F4F6; }
        .btn-primary { background: #4586F0; color: #FFFFFF; }
        .btn-primary:hover { background: #3B73CE; box-shadow: 0 4px 6px rgba(69,134,240,0.2); }
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>

      <header className="app-header">
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#5F6368", padding: "4px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div className="app-title">
          <img src="https://i.ibb.co/MxgTGTLH/Logo-black.png" alt="Logo" style={{ height: 24 }} referrerPolicy="no-referrer" />
          <span style={{ color: "#E2E4E8" }}>|</span>
          AI 顧問工具箱
        </div>
      </header>

      <div className="main-content">
        <div className="report-container">
          
          <div className="status-banner">
            <div>
              <div className="status-title">任務已完成</div>
              <div className="status-subtitle">專案：{projectName} | 已完成 6/6 階段分析</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px 24px", borderRadius: 8, fontWeight: 600 }}>
              報告可導出
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-card-title">
                <span style={{ color: "#4586F0" }}>■</span> 本次聚焦問題
              </div>
              <div className="summary-card-content">
                <div style={{ marginBottom: 8 }}><span style={{ color: "#5F6368", fontSize: 13 }}>目標：</span>{ceoGoal}</div>
                <div><span style={{ color: "#5F6368", fontSize: 13 }}>範圍：</span>{groupPriorityImprovement}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-title">
                <span style={{ color: "#D93025" }}>■</span> 主要根因
              </div>
              <div className="summary-card-content">
                高影響卡點背後，最主要的根因集中在：<br/>
                <span style={{ color: "#991B1B" }}>{topCategories.join("、") || "尚未分析"}</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-title">
                <span style={{ color: "#137333" }}>■</span> AI 協作場景
              </div>
              <div className="summary-card-content">
                共設計了 {scenes.length} 個 AI 協作場景，涵蓋：<br/>
                <span style={{ color: "#059669" }}>{scenes.slice(0, 2).map((s:any) => s.name).join("、")}{scenes.length > 2 ? "..." : ""}</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-title">
                <span style={{ color: "#F29900" }}>■</span> 第一波優先建議
              </div>
              <div className="summary-card-content">
                綜合價值與可行性，建議優先推進：<br/>
                <span style={{ color: "#D97706" }}>{firstWaveScenes.length > 0 ? firstWaveScenes.join("、") : "無"}</span>
              </div>
            </div>
          </div>

          <div className="chapter-list">
            <div className="chapter-header">
              <span>報告章節預覽</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#6B7280" }}>點擊展開查看完整內容</span>
            </div>
            {chapters.map((ch, i) => (
              <div key={i} className="chapter-item">
                <div className="chapter-title-bar" onClick={() => toggleChapter(i)}>
                  <div className="chapter-num">{i + 1}</div>
                  <div className="chapter-title">{ch.title}</div>
                  <div className={`chapter-icon ${expandedChapters[i] ? 'expanded' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
                <div className={`chapter-content ${expandedChapters[i] ? 'expanded' : ''}`}>
                  {ch.content}
                </div>
              </div>
            ))}
            
            <div className="chapter-item" style={{ background: "#F8FAFC", borderTop: "2px solid #E2E4E8" }}>
              <div className="chapter-title-bar" style={{ background: "transparent", cursor: "default" }}>
                <div className="chapter-num" style={{ background: "#1F49A3", color: "#fff" }}>★</div>
                <div className="chapter-title">AI 顧問最終結論</div>
              </div>
              <div className="chapter-content expanded" style={{ background: "transparent", paddingTop: 0 }}>
                <div className="chapter-content-inner">
                  <div style={{ fontSize: 15, color: "#1F2937", lineHeight: 1.6, padding: "0 24px 24px 24px" }}>
                    <p>綜觀本次工作坊的分析結果，團隊已明確定義出核心問題，並透過流程拆解與根因分析，鎖定了高影響的痛點。我們設計了 {scenes.length} 個 AI 協作場景，並依據價值與可行性進行了優先排序。</p>
                    <p><strong>下一步行動建議：</strong></p>
                    <ol style={{ paddingLeft: 20, margin: "8px 0" }}>
                      <li>優先啟動第一波場景（{firstWaveScenes.join("、") || "無"}）的 PoC 驗證。</li>
                      <li>針對尚未齊全的知識與資料（共 {knowledgeData.filter((k:any) => !k.isReady).length} 項），指派專人進行盤點與補齊。</li>
                      <li>建立定期回顧機制，追蹤 AI 導入後的實際效益與流程改善狀況。</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="action-bar">
            <button className="btn btn-outline" onClick={onBack}>返回導覽頁</button>
            <button className="btn btn-primary" onClick={handleExportMarkdown}>複製報告 (Markdown)</button>
          </div>

        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";

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

const MECE_CATEGORIES = [
  "流程問題",
  "資料問題",
  "工具 / 系統問題",
  "角色 / 權責問題",
  "規則 / SOP 問題",
  "其他"
];

export default function PainMapWorkflow({ tool, onBack, onComplete, advisorData, setAdvisorData }) {
  const toolData = advisorData[tool.id]?.data || {};
  const toolStatus = advisorData[tool.id]?.status || 'in_progress';

  // Get data from Step 2
  const workflowData = advisorData['workflow']?.data || {};
  const stages = workflowData.stages || [];
  const allNodes = workflowData.nodes || [];
  
  const targetNodes = allNodes.filter(n => n.painPoint1 && n.painPoint1.trim() !== "" && n.deepDive);

  const [analyzedData, setAnalyzedData] = useState(toolData.analyzedData || {});
  const [selectedNodeId, setSelectedNodeId] = useState(targetNodes.length > 0 ? targetNodes[0].id : null);
  const [showMoreWhys, setShowMoreWhys] = useState({});

  const [currentState, setCurrentState] = useState(toolStatus === 'completed' ? 'completed_readonly' : 'editing');
  const [hasConfirmedBefore, setHasConfirmedBefore] = useState(toolStatus === 'completed');
  const [confirmedData, setConfirmedData] = useState(toolData.confirmedData || null);

  const isReadOnly = currentState === 'summary_pending' || currentState === 'completed_readonly';

  const handleStateChange = () => {
    if (hasConfirmedBefore && currentState === 'editing') {
      setCurrentState('needs_update');
    } else if (hasConfirmedBefore && currentState === 'confirmed') {
      setCurrentState('needs_update');
    }
  };

  const updateAnalysis = (nodeId, field, value) => {
    setAnalyzedData(prev => ({
      ...prev,
      [nodeId]: {
        ...(prev[nodeId] || { why1: "", why2: "", why3: "", why4: "", why5: "", rootCause: "", categories: [], customerImpact: "", opportunity: "" }),
        [field]: value
      }
    }));
    handleStateChange();
  };

  const toggleCategory = (nodeId, category) => {
    const currentCategories = analyzedData[nodeId]?.categories || [];
    let newCategories;
    if (currentCategories.includes(category)) {
      newCategories = currentCategories.filter(c => c !== category);
    } else {
      newCategories = [...currentCategories, category];
    }
    updateAnalysis(nodeId, 'categories', newCategories);
  };

  // Validation
  const analyzedNodesCount = Object.keys(analyzedData).filter(id => {
    const data = analyzedData[id];
    return data && data.why1 && data.rootCause && data.categories.length > 0;
  }).length;

  const isMinRequirementsMet = analyzedNodesCount > 0;

  const requestSummary = () => setCurrentState('summary_pending');
  const returnToEdit = () => setCurrentState('editing');

  const confirmSummaryAndComplete = () => {
    setCurrentState('completed_readonly');
    setHasConfirmedBefore(true);
    const currentData = { analyzedData };
    setConfirmedData(currentData);
    
    setAdvisorData(prev => ({
      ...prev,
      [tool.id]: {
        status: 'completed',
        data: { ...currentData, confirmedData: currentData }
      }
    }));

    if (onComplete) onComplete(tool.id);
  };

  const cancelUpdate = () => {
    if (confirmedData) {
      setAnalyzedData(confirmedData.analyzedData);
    }
    setCurrentState('completed_readonly');
  };

  const handleBack = () => {
    if (currentState !== 'completed_readonly') {
      setAdvisorData(prev => ({
        ...prev,
        [tool.id]: {
          status: prev[tool.id]?.status === 'completed' ? 'completed' : 'in_progress',
          data: { analyzedData, confirmedData }
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
        data: { analyzedData, confirmedData }
      }
    }));
  };

  // AI Logic
  let aiAgentText = null;
  if (currentState === 'summary_pending' || currentState === 'needs_update' || currentState === 'completed_readonly') {
    const completedAnalyses = Object.values(analyzedData).filter(d => d.why1 && d.rootCause && d.categories.length > 0);
    const allCategories = completedAnalyses.flatMap(d => d.categories);
    const categoryCounts = allCategories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

    aiAgentText = (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px", lineHeight: "1.6" }}>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>1. 分析進度</strong>
          <p style={{ margin: 0, color: C.dark }}>已完成 {completedAnalyses.length} 個重點卡點的根因分析。</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>2. 根因集中類別</strong>
          <p style={{ margin: 0, color: C.dark }}>主要集中在：{topCategories.join("、") || "無"}</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>3. 優先處理建議</strong>
          <p style={{ margin: 0, color: C.dark }}>根據分析，建議優先從「{topCategories[0] || "主要問題"}」著手改善，這能解決多數表象卡點。</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>4. 機會點摘要</strong>
          <ul style={{ margin: 0, paddingLeft: 20, color: C.dark }}>
            {completedAnalyses.filter(d => d.opportunity).slice(0, 3).map((d, i) => (
              <li key={i}>{d.opportunity}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  } else if (!isMinRequirementsMet) {
    const missingItems = [];
    if (analyzedNodesCount === 0) {
      missingItems.push("請先選擇一筆重點卡點並完成分析");
      missingItems.push("請至少補充一層原因 (Why 1)");
      missingItems.push("請填寫暫定根因");
      missingItems.push("請整理出至少一個根因類別");
    }

    aiAgentText = (
      <>
        <strong style={{ color: "#D48806" }}>目前尚未達產出摘要條件，缺少以下內容：</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
          {missingItems.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
        </ul>
      </>
    );
  } else {
    aiAgentText = (
      <>
        <strong style={{ color: "#389E0D" }}>已達產出摘要條件，可以整理本階段重點</strong>
      </>
    );
  }

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
    footerStatusText = "狀態：已修改內容，請重新產生摘要。";
    footerStatusColor = "#D48806";
  }

  const selectedNode = targetNodes.find(n => n.id === selectedNodeId);
  const currentAnalysis = analyzedData[selectedNodeId] || { why1: "", why2: "", why3: "", why4: "", why5: "", rootCause: "", categories: [], customerImpact: "", opportunity: "" };

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
        .step-line { width: 30px; height: 2px; background: #E4EAF2; margin: 0 16px; flex-shrink: 0; }
        .step-line.completed { background: #389E0D; }
        
        .main-workspace { flex: 1; display: flex; overflow: hidden; }
        .left-sidebar { width: 280px; background: #FFFFFF; border-right: 1px solid #E2E4E8; display: flex; flex-direction: column; flex-shrink: 0; }
        .editor-area { flex: 1; display: flex; flex-direction: column; background: #F6F8F9; overflow-y: auto; overflow-x: hidden; }
        .ai-agent-widget { width: 300px; background: #FFFFFF; border-left: 1px solid #E2E4E8; display: flex; flex-direction: column; flex-shrink: 0; }
        
        .sidebar-header { padding: 16px 20px; border-bottom: 1px solid #E2E4E8; font-weight: 700; font-size: 15px; background: #FAFAFA; }
        .sidebar-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .node-item { padding: 12px; border-radius: 8px; border: 1px solid #E2E4E8; cursor: pointer; transition: all 0.2s; background: #fff; }
        .node-item:hover { border-color: #B5D1FE; }
        .node-item.active { border-color: #4586F0; background: #E8F0FE; box-shadow: 0 2px 4px rgba(69,134,240,0.1); }
        .node-item.completed { border-left: 3px solid #389E0D; }
        
        .ai-header { padding: 16px 24px; border-bottom: 1px solid #E2E4E8; font-weight: 700; display: flex; align-items: center; gap: 8px; font-size: 15px; }
        .ai-body { padding: 24px; overflow-y: auto; flex: 1; font-size: 14px; }
        
        .footer { background: #FFFFFF; border-top: 1px solid #E2E4E8; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; z-index: 10; }
        .btn { padding: 8px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-outline { background: #FFFFFF; border: 1px solid #D1D5DB; color: #374151; }
        .btn-outline:hover { background: #F3F4F6; }
        .btn { background: #4586F0; color: #FFFFFF; }
        .btn:hover { background: #3B73CE; }
        .btn:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; }
        .footer-state-group { display: flex; gap: 12px; }

        .input-box { width: 100%; padding: 10px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 14px; font-family: inherit; transition: border-color 0.2s; }
        .input-box:focus { outline: none; border-color: #4586F0; box-shadow: 0 0 0 2px rgba(69,134,240,0.1); }
        .input-box:disabled { background: #F3F4F6; color: #6B7280; }
        
        .section-card { background: #fff; border-radius: 8px; border: 1px solid #E2E4E8; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .section-title { font-size: 16px; font-weight: 700; margin: 0 0 16px 0; color: #1F2937; display: flex; align-items: center; gap: 8px; }
        
        .category-chip { padding: 6px 12px; border-radius: 16px; border: 1px solid #D1D5DB; font-size: 13px; cursor: pointer; transition: all 0.2s; background: #fff; color: #374151; }
        .category-chip:hover { background: #F3F4F6; }
        .category-chip.selected { background: #E8F0FE; border-color: #4586F0; color: #1F49A3; font-weight: 600; }
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>

      <header className="app-header">
        <button onClick={handleBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#5F6368", padding: "4px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div className="app-title">
          <img src="https://i.ibb.co/MxgTGTLH/Logo-black.png" alt="Logo" style={{ height: 24 }} referrerPolicy="no-referrer" />
          <span style={{ color: "#E2E4E8" }}>|</span>
          AI 顧問工具箱
        </div>
      </header>

      <div className="progress-header">
        <div className="progress-text">顧問引導流程</div>
        <div className="stepper">
          {[
            { id: "define", title: "定義問題" },
            { id: "workflow", title: "拆解工作流" },
            { id: "painmap", title: "痛點地圖" },
            { id: "ai-collab", title: "AI 協作場景" },
            { id: "knowledge", title: "知識提取" },
            { id: "priority", title: "優先排序" }
          ].map((t, i) => {
            const isActive = t.id === tool.id;
            const isCompleted = advisorData[t.id]?.status === 'completed';
            return (
              <React.Fragment key={t.id}>
                <div className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                  {isCompleted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#389E0D" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: isActive ? "#4586F0" : "#E4EAF2", color: isActive ? "#fff" : "#9AA0A6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                      {i + 1}
                    </div>
                  )}
                  <span className="step-text">Step {i + 1} {t.title}</span>
                </div>
                {i < 5 && <div className={`step-line ${isCompleted ? 'completed' : ''}`}></div>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="main-workspace">
        <div className="left-sidebar">
          <div className="sidebar-header">
            A. 待分析卡點清單
          </div>
          <div className="sidebar-list">
            {targetNodes.length === 0 ? (
              <div style={{ padding: 16, color: "#5F6368", fontSize: 13, textAlign: "center" }}>
                尚未在 Step 2 標記下一步重點卡點
              </div>
            ) : (
              targetNodes.map(node => {
                const stage = stages.find(s => s.id === node.stageId);
                const isAnalyzed = analyzedData[node.id] && analyzedData[node.id].why1 && analyzedData[node.id].rootCause;
                return (
                  <div 
                    key={node.id} 
                    className={`node-item ${selectedNodeId === node.id ? 'active' : ''} ${isAnalyzed ? 'completed' : ''}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <div style={{ fontSize: 11, color: "#5F6368", marginBottom: 4 }}>{stage?.name} &gt; {node.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", marginBottom: 6 }}>{node.painPoint1}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {node.deepDive && <span style={{ fontSize: 10, background: "#FEF3C7", color: "#D97706", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>重點</span>}
                      {isAnalyzed && <span style={{ fontSize: 10, background: "#F6FFED", color: "#389E0D", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>已分析</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="editor-area">
          {selectedNode ? (
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Step 3: {tool.title}</h2>
                <p style={{ fontSize: 14, color: "#5F6368", margin: 0 }}>將表象卡點拆解成真正根因，並掛回顧客旅程脈絡。</p>
              </div>

              <div className="section-card">
                <h3 className="section-title">
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F0FE", color: "#1F49A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>B</span>
                  5 Whys 根因拆解區
                </h3>
                <p style={{ fontSize: 13, color: "#5F6368", margin: "0 0 16px 0" }}>請一路往下追問，直到找到可以採取行動的根因，不一定要寫滿 5 層。</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>表象卡點</label>
                    <input type="text" className="input-box" value={selectedNode.painPoint1} disabled style={{ background: "#F3F4F6", color: "#374151", fontWeight: 600 }} />
                  </div>
                  
                  <div style={{ paddingLeft: 16, borderLeft: "2px solid #E2E4E8", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#1F49A3" }}>為什麼會發生？（Why 1）</label>
                      <input type="text" className="input-box" value={currentAnalysis.why1} onChange={(e) => updateAnalysis(selectedNode.id, 'why1', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#1F49A3" }}>如果再追一層，原因是什麼？（Why 2）</label>
                      <input type="text" className="input-box" value={currentAnalysis.why2} onChange={(e) => updateAnalysis(selectedNode.id, 'why2', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#1F49A3" }}>再往下看，真正卡住的是什麼？（Why 3）</label>
                      <input type="text" className="input-box" value={currentAnalysis.why3} onChange={(e) => updateAnalysis(selectedNode.id, 'why3', e.target.value)} disabled={isReadOnly} />
                    </div>
                    
                    {showMoreWhys[selectedNode.id] ? (
                      <>
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#1F49A3" }}>Why 4（選填）</label>
                          <input type="text" className="input-box" value={currentAnalysis.why4} onChange={(e) => updateAnalysis(selectedNode.id, 'why4', e.target.value)} disabled={isReadOnly} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#1F49A3" }}>Why 5（選填）</label>
                          <input type="text" className="input-box" value={currentAnalysis.why5} onChange={(e) => updateAnalysis(selectedNode.id, 'why5', e.target.value)} disabled={isReadOnly} />
                        </div>
                      </>
                    ) : (
                      !isReadOnly && (
                        <button 
                          onClick={() => setShowMoreWhys(prev => ({...prev, [selectedNode.id]: true}))}
                          style={{ background: "none", border: "1px dashed #D1D5DB", borderRadius: 6, padding: "8px", color: "#6B7280", fontSize: 13, cursor: "pointer", alignSelf: "flex-start" }}
                        >
                          + 繼續追問 (Why 4, Why 5)
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="section-card">
                <h3 className="section-title">
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F0FE", color: "#1F49A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>C</span>
                  MECE 根因整理區
                </h3>
                <p style={{ fontSize: 13, color: "#5F6368", margin: "0 0 16px 0" }}>把剛剛拆出的原因整理成不重疊、較完整的根因類別。</p>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
                  {MECE_CATEGORIES.map(cat => (
                    <div 
                      key={cat} 
                      className={`category-chip ${currentAnalysis.categories.includes(cat) ? 'selected' : ''}`}
                      onClick={() => !isReadOnly && toggleCategory(selectedNode.id, cat)}
                    >
                      {cat}
                    </div>
                  ))}
                </div>

                {currentAnalysis.categories.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                    {currentAnalysis.categories.map(cat => (
                      <div key={cat} style={{ padding: 16, background: "#F9FAFB", borderRadius: 8, border: "1px solid #E2E4E8" }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#1F49A3" }}>
                          請補充這個卡點背後的「{cat}」根因
                        </label>
                        <textarea 
                          className="input-box" 
                          style={{ minHeight: 60, resize: "vertical" }} 
                          placeholder={`填寫具體的${cat}細節...`}
                          value={currentAnalysis[`rootCause_${cat}`] || ""} 
                          onChange={(e) => updateAnalysis(selectedNode.id, `rootCause_${cat}`, e.target.value)} 
                          disabled={isReadOnly} 
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid #E2E4E8" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#991B1B" }}>本卡點根因總結</label>
                  <textarea 
                    className="input-box" 
                    style={{ minHeight: 80, resize: "vertical", borderColor: "#FCA5A5", background: "#FFF5F5" }} 
                    placeholder="總結上述追問與分類，寫下最核心的根因..."
                    value={currentAnalysis.rootCause} 
                    onChange={(e) => updateAnalysis(selectedNode.id, 'rootCause', e.target.value)} 
                    disabled={isReadOnly} 
                  />
                </div>

                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>顧客感受 / 影響</label>
                    <input type="text" className="input-box" placeholder="這對顧客造成什麼具體影響？" value={currentAnalysis.customerImpact} onChange={(e) => updateAnalysis(selectedNode.id, 'customerImpact', e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>機會點 / 改善方向</label>
                    <input type="text" className="input-box" placeholder="針對這個根因，初步的改善方向是？" value={currentAnalysis.opportunity} onChange={(e) => updateAnalysis(selectedNode.id, 'opportunity', e.target.value)} disabled={isReadOnly} />
                  </div>
                </div>
              </div>

              <div className="section-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E4E8", background: "#FAFAFA" }}>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F0FE", color: "#1F49A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>D</span>
                    痛點地圖預覽區
                  </h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
                    <thead>
                      <tr style={{ background: "#F3F4F6", textAlign: "left" }}>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "12%" }}>旅程階段</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "12%" }}>流程節點</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "15%" }}>表象卡點</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "15%" }}>顧客感受 / 影響</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "12%" }}>根因類別</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "17%" }}>具體根因</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8" }}>機會點 / 改善方向</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targetNodes.map(node => {
                        const stage = stages.find(s => s.id === node.stageId);
                        const analysis = analyzedData[node.id];
                        if (!analysis || !analysis.rootCause) return null;
                        
                        return (
                          <tr key={node.id} style={{ borderBottom: "1px solid #E2E4E8", background: selectedNodeId === node.id ? "#F8FAFC" : "#fff" }}>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top" }}>{stage?.name}</td>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top" }}>{node.name}</td>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", color: "#DC2626" }}>{node.painPoint1}</td>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top" }}>{analysis.customerImpact}</td>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {analysis.categories.map(c => <span key={c} style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{c}</span>)}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", fontWeight: 600, color: "#991B1B" }}>{analysis.rootCause}</td>
                            <td style={{ padding: "12px 16px", verticalAlign: "top", color: "#059669" }}>{analysis.opportunity}</td>
                          </tr>
                        );
                      })}
                      {analyzedNodesCount === 0 && (
                        <tr>
                          <td colSpan="7" style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>
                            尚未完成任何卡點分析
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ padding: "48px", textAlign: "center", color: "#6B7280" }}>
              請先在 Step 2 標記下一步重點卡點
            </div>
          )}
        </div>

        <aside className="ai-agent-widget">
          <div className="ai-header">
            <img src="https://i.ibb.co/tTMyH0Rm/robot.png" alt="AI" style={{ width: 20, height: 20 }} referrerPolicy="no-referrer" />
            AI 摘要與檢查
          </div>
          <div className="ai-body">
            {aiAgentText}
          </div>
        </aside>
      </div>

      <footer className="footer">
        <div style={{ fontSize: 14, fontWeight: 500, color: footerStatusColor }}>
          {footerStatusText}
        </div>
        
        <div>
          {currentState === 'editing' && (
            <div className="footer-state-group">
              <button className="btn btn-outline" onClick={handleSaveDraft}>儲存草稿</button>
              <button className="btn" disabled={!isMinRequirementsMet} onClick={requestSummary}>產生摘要</button>
            </div>
          )}
          {currentState === 'summary_pending' && (
            <div className="footer-state-group">
              <button className="btn btn-outline" onClick={returnToEdit}>返回修改</button>
              <button className="btn" onClick={confirmSummaryAndComplete}>確認並完成本階段</button>
            </div>
          )}
          {currentState === 'needs_update' && (
            <div className="footer-state-group">
              <button className="btn btn-outline" onClick={cancelUpdate}>取消修改</button>
              <button className="btn" disabled={!isMinRequirementsMet} onClick={requestSummary}>重新產生摘要</button>
            </div>
          )}
          {currentState === 'completed_readonly' && (
            <div className="footer-state-group">
              <button className="btn btn-outline" onClick={returnToEdit}>返回修改</button>
              <button className="btn btn-outline" onClick={requestSummary}>重新產生摘要</button>
              <button className="btn" onClick={() => { if (onComplete) onComplete(tool.id); }}>確認並完成本階段</button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

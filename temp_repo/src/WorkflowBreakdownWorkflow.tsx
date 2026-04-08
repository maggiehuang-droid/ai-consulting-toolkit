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

export default function WorkflowBreakdownWorkflow({ tool, onBack, onComplete, advisorData, setAdvisorData }) {
  const toolData = advisorData[tool.id]?.data || {};
  const toolStatus = advisorData[tool.id]?.status || 'in_progress';

  const [targetJourney, setTargetJourney] = useState(toolData.targetJourney || "");
  const [selectedTemplate, setSelectedTemplate] = useState("general");
  const [stages, setStages] = useState(toolData.stages || [
    { id: "s1", name: "接觸前" },
    { id: "s2", name: "接觸中" },
    { id: "s3", name: "完成服務 / 交易" },
    { id: "s4", name: "後續維繫" },
  ]);
  const [nodes, setNodes] = useState(toolData.nodes || []);
  const [activeStageId, setActiveStageId] = useState(stages[0]?.id || null);

  const templates = {
    general: [
      { id: "s1", name: "接觸前" },
      { id: "s2", name: "接觸中" },
      { id: "s3", name: "完成服務 / 交易" },
      { id: "s4", name: "後續維繫" },
    ],
    retail: [
      { id: "s1", name: "認識 / 導流" },
      { id: "s2", name: "評估 / 比較" },
      { id: "s3", name: "下單 / 交易" },
      { id: "s4", name: "使用 / 收貨" },
      { id: "s5", name: "回購 / 留存" },
    ],
    hotel: [
      { id: "s1", name: "住房前" },
      { id: "s2", name: "住房中" },
      { id: "s3", name: "住房後" },
    ],
    food: [
      { id: "s1", name: "到店前" },
      { id: "s2", name: "消費中" },
      { id: "s3", name: "消費後" },
    ],
    medical: [
      { id: "s1", name: "看診前" },
      { id: "s2", name: "看診中" },
      { id: "s3", name: "看診後" },
    ],
    custom: []
  };

  const handleTemplateChange = (e) => {
    const templateKey = e.target.value;
    setSelectedTemplate(templateKey);
    const newStages = templates[templateKey].map(s => ({...s, id: `s${Date.now()}_${s.id}`}));
    setStages(newStages);
    setActiveStageId(newStages[0]?.id || null);
    handleStateChange();
  };

  const [currentState, setCurrentState] = useState(toolStatus === 'completed' ? 'completed_readonly' : 'editing');
  const [hasConfirmedBefore, setHasConfirmedBefore] = useState(toolStatus === 'completed');
  const [confirmedData, setConfirmedData] = useState(toolData.confirmedData || null);

  const isReadOnly = currentState === 'summary_pending' || currentState === 'completed_readonly';

  // Validation checks
  const hasJourneySkeleton = targetJourney.trim() !== "" && stages.length >= 2;
  const hasEnoughNodes = nodes.length >= 3;
  const hasPainPoint = nodes.some(n => n.painPoint1 && n.painPoint1.trim() !== "");
  const hasDeepDive = nodes.some(n => n.deepDive);

  const isMinRequirementsMet = hasJourneySkeleton && hasEnoughNodes && hasPainPoint && hasDeepDive;

  const handleStateChange = () => {
    if (hasConfirmedBefore && currentState === 'editing') {
      setCurrentState('needs_update');
    } else if (hasConfirmedBefore && currentState === 'confirmed') {
      setCurrentState('needs_update');
    }
  };

  const addStage = () => {
    setStages([...stages, { id: `s${Date.now()}`, name: "新階段" }]);
    handleStateChange();
  };

  const updateStage = (id, name) => {
    setStages(stages.map(s => s.id === id ? { ...s, name } : s));
    handleStateChange();
  };

  const removeStage = (id) => {
    setStages(stages.filter(s => s.id !== id));
    setNodes(nodes.filter(n => n.stageId !== id));
    handleStateChange();
  };

  const addNode = (stageId) => {
    setNodes([...nodes, {
      id: `n${Date.now()}`,
      stageId,
      name: "",
      role: "",
      tools: "",
      hasProblem: false,
      painPoint1: "",
      impact: "",
      painPoint2: "",
      painPoint3: "",
      deepDive: false
    }]);
    handleStateChange();
  };

  const updateNode = (id, field, value) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, [field]: value } : n));
    handleStateChange();
  };

  const removeNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    handleStateChange();
  };

  const requestSummary = () => setCurrentState('summary_pending');
  const returnToEdit = () => setCurrentState('editing');

  const confirmSummaryAndComplete = () => {
    setCurrentState('completed_readonly');
    setHasConfirmedBefore(true);
    const currentData = { targetJourney, stages, nodes };
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
      setTargetJourney(confirmedData.targetJourney);
      setStages(confirmedData.stages);
      setNodes(confirmedData.nodes);
    }
    setCurrentState('completed_readonly');
  };

  const handleBack = () => {
    if (currentState !== 'completed_readonly') {
      setAdvisorData(prev => ({
        ...prev,
        [tool.id]: {
          status: prev[tool.id]?.status === 'completed' ? 'completed' : 'in_progress',
          data: { targetJourney, stages, nodes, confirmedData }
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
        data: { targetJourney, stages, nodes, confirmedData }
      }
    }));
  };

  // AI Summary Logic
  let aiAgentText = null;
  if (currentState === 'summary_pending' || currentState === 'needs_update' || currentState === 'completed_readonly') {
    const painPointNodes = nodes.filter(n => n.painPoint1 && n.painPoint1.trim() !== "");
    const deepDiveNodes = nodes.filter(n => n.deepDive);
    
    const painPointStages = [...new Set(painPointNodes.map(n => stages.find(s => s.id === n.stageId)?.name).filter(Boolean))];

    aiAgentText = (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px", lineHeight: "1.6" }}>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>1. 顧客旅程階段</strong>
          <p style={{ margin: 0, color: C.dark }}>{stages.map(s => s.name).join(" → ")}</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>2. 流程節點總覽</strong>
          <p style={{ margin: 0, color: C.dark }}>共建立 {nodes.length} 個流程節點，其中 {painPointNodes.length} 個節點標記有卡點。</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>3. 卡點分佈熱區</strong>
          <p style={{ margin: 0, color: C.dark }}>卡點主要集中在：{painPointStages.join("、") || "無"}</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>4. 建議優先深挖節點</strong>
          <ul style={{ margin: 0, paddingLeft: 20, color: C.dark }}>
            {deepDiveNodes.map(n => (
              <li key={n.id}>{n.name}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  } else if (!isMinRequirementsMet) {
    const missingItems = [];
    if (!hasJourneySkeleton) missingItems.push("請至少建立 2 個旅程階段");
    if (!hasEnoughNodes) missingItems.push("請至少填入 3 個流程步驟");
    if (!hasPainPoint) missingItems.push("請至少標記 1 個卡點");
    if (!hasDeepDive) missingItems.push("請至少選出 1 個下一步重點節點");

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
        .editor-area { flex: 7; display: flex; flex-direction: column; background: #F6F8F9; overflow-y: auto; overflow-x: hidden; }
        .ai-agent-widget { flex: 3; background: #FFFFFF; border-left: 1px solid #E2E4E8; display: flex; flex-direction: column; }
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
        
        /* Board Styles */
        .board-container { display: flex; flex-direction: column; gap: 24px; padding: 24px; flex: 1; align-items: stretch; }
        .node-card { background: #fff; border-radius: 8px; border: 1px solid #E2E4E8; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; flex-direction: column; overflow: hidden; }
        .node-card-header { padding: 12px 16px; border-bottom: 1px solid #F0F0F0; display: flex; justify-content: space-between; align-items: center; background: #FAFAFA; }
        .node-card-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .node-card-painpoint { padding: 16px; background: #FFF5F5; border-top: 1px dashed #FECACA; display: flex; flex-direction: column; gap: 12px; }
        
        .radio-group { display: flex; gap: 16px; }
        .radio-label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
        
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
        <div className="editor-area">
          <div style={{ padding: "24px 24px 0", flexShrink: 0 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Step 2: {tool.title}</h2>
            <p style={{ fontSize: 14, color: "#5F6368", margin: "0 0 8px" }}>把這段顧客旅程一步一步拆開，找出每一步是怎麼做的，以及卡點發生在哪裡。</p>
            <div style={{ background: "#E8F0FE", padding: "12px 16px", borderRadius: 8, marginBottom: 24, borderLeft: "4px solid #4586F0" }}>
              <p style={{ fontSize: 14, color: "#1F49A3", margin: "0 0 4px", fontWeight: 600 }}>💡 填寫提示</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#1F49A3" }}>
                <li>這一關只收集流程節點上的表象問題，不分析原因。原因拆解會在下一階段進行。</li>
                <li>請從所有節點中，選出 3 到 5 個最值得往下分析的主要卡點，進入下一階段。</li>
              </ul>
            </div>
            
            {!isReadOnly && (
              <div style={{ background: "#fff", padding: "20px", borderRadius: 8, border: "1px solid #E2E4E8", display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", width: 180 }}>請選擇顧客旅程模板</label>
                  <select 
                    className="input-box" 
                    style={{ flex: 1, maxWidth: 400 }}
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                  >
                    <option value="general">通用版</option>
                    <option value="retail">零售 / 電商</option>
                    <option value="hotel">飯店 / 住宿</option>
                    <option value="food">餐飲</option>
                    <option value="medical">醫療 / 診所</option>
                    <option value="custom">自訂</option>
                  </select>
                </div>
                <p style={{ fontSize: 12, color: "#5F6368", margin: "-8px 0 0 196px" }}>先選一個最接近的旅程版本，後面都還可以自己改。</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", width: 180 }}>這次要拆解的是哪一段旅程？</label>
                  <input 
                    type="text" 
                    className="input-box" 
                    style={{ flex: 1, maxWidth: 400 }} 
                    placeholder="請幫這次要分析的旅程取一個名字，例如：新客諮詢到預約、住房前客服回覆、首購後回訪流程" 
                    value={targetJourney}
                    onChange={(e) => { setTargetJourney(e.target.value); handleStateChange(); }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "0 24px", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>這段旅程有哪些主要階段？</h3>
            <p style={{ fontSize: 13, color: "#5F6368", margin: 0 }}>先把這段旅程拆成幾個大階段，例如飯店業可以是：住房前、住房中、住房後</p>
          </div>
          <div style={{ display: "flex", gap: 16, padding: "0 24px", overflowX: "auto", flexShrink: 0, borderBottom: "1px solid #E2E4E8", paddingBottom: 16 }}>
            {stages.map((stage, sIndex) => (
              <div 
                key={stage.id} 
                onClick={() => setActiveStageId(stage.id)}
                style={{ 
                  width: 200, height: 60, flexShrink: 0,
                  padding: "0 16px", 
                  background: activeStageId === stage.id ? "#4586F0" : "#fff", 
                  color: activeStageId === stage.id ? "#fff" : "#374151",
                  borderRadius: 8, 
                  border: `1px solid ${activeStageId === stage.id ? "#4586F0" : "#E2E4E8"}`,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  fontWeight: 600, fontSize: 14,
                  boxShadow: activeStageId === stage.id ? "0 4px 12px rgba(69,134,240,0.2)" : "0 1px 2px rgba(0,0,0,0.05)",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: activeStageId === stage.id ? "rgba(255,255,255,0.2)" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{sIndex + 1}</div>
                {!isReadOnly ? (
                  <input 
                    type="text" 
                    style={{ border: "none", background: "transparent", color: "inherit", fontWeight: "inherit", fontSize: "inherit", width: "100%", outline: "none" }} 
                    value={stage.name}
                    onChange={(e) => updateStage(stage.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="階段名稱"
                  />
                ) : (
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stage.name}</span>
                )}
                {!isReadOnly && (
                  <button onClick={(e) => { e.stopPropagation(); removeStage(stage.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: activeStageId === stage.id ? "rgba(255,255,255,0.6)" : "#9CA3AF", padding: 0, display: "flex", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <button 
                onClick={addStage}
                style={{ width: 200, height: 60, flexShrink: 0, background: "transparent", border: "1px dashed #D1D5DB", borderRadius: 8, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 600, gap: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                新增旅程階段
              </button>
            )}
          </div>

          {!isReadOnly ? (
            <div className="board-container" style={{ flexDirection: "column", alignItems: "stretch", padding: "24px" }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>這個階段裡，會發生哪些步驟？</h3>
                <p style={{ fontSize: 13, color: "#5F6368", margin: 0 }}>請把這個階段裡的實際流程一步一步寫出來，並標記卡點</p>
              </div>
              {activeStageId && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24, alignItems: "stretch" }}>
                  {nodes.filter(n => n.stageId === activeStageId).map((node, nIndex) => (
                    <div key={node.id} className="node-card">
                      <div className="node-card-header">
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#5F6368" }}>節點 {nIndex + 1}</span>
                        <button onClick={() => removeNode(node.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                      <div className="node-card-body">
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>節點名稱</label>
                          <input type="text" className="input-box" style={{ padding: "6px 10px" }} placeholder="例如：客人發問、確認需求、建立訂單" value={node.name} onChange={(e) => updateNode(node.id, 'name', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>誰負責這一步？</label>
                          <input type="text" className="input-box" style={{ padding: "6px 10px" }} placeholder="例如：客服、門市、會員營運" value={node.role} onChange={(e) => updateNode(node.id, 'role', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>會用到哪些工具或系統？（可選）</label>
                          <input type="text" className="input-box" style={{ padding: "6px 10px" }} placeholder="例如：LINE、CRM、電話、POS" value={node.tools} onChange={(e) => updateNode(node.id, 'tools', e.target.value)} />
                        </div>
                        
                        <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px dashed #E2E4E8", display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#991B1B" }}>這一步有明顯問題嗎？</label>
                            <div className="radio-group">
                              <label className="radio-label">
                                <input type="radio" name={`hasproblem-${node.id}`} checked={node.hasProblem === true} onChange={() => updateNode(node.id, 'hasProblem', true)} />
                                有
                              </label>
                              <label className="radio-label">
                                <input type="radio" name={`hasproblem-${node.id}`} checked={node.hasProblem === false} onChange={() => updateNode(node.id, 'hasProblem', false)} />
                                沒有
                              </label>
                            </div>
                          </div>
                          {node.hasProblem && (
                            <>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#991B1B" }}>最主要的問題是什麼？</label>
                                <input type="text" className="input-box" style={{ padding: "6px 10px", borderColor: "#FCA5A5" }} placeholder="例如：等待時間長、資料不同步" value={node.painPoint1 || ""} onChange={(e) => updateNode(node.id, 'painPoint1', e.target.value)} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#991B1B" }}>這個問題影響程度如何？</label>
                                <select className="input-box" style={{ padding: "6px 10px", borderColor: "#FCA5A5" }} value={node.impact || ""} onChange={(e) => updateNode(node.id, 'impact', e.target.value)}>
                                  <option value="">請選擇</option>
                                  <option value="high">高 (嚴重影響體驗或流程)</option>
                                  <option value="medium">中 (造成不便但可完成)</option>
                                  <option value="low">低 (輕微瑕疵)</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#991B1B" }}>要不要列為下一步重點？</label>
                                <div className="radio-group">
                                  <label className="radio-label">
                                    <input type="radio" name={`deepdive-${node.id}`} checked={node.deepDive === true} onChange={() => updateNode(node.id, 'deepDive', true)} />
                                    是
                                  </label>
                                  <label className="radio-label">
                                    <input type="radio" name={`deepdive-${node.id}`} checked={node.deepDive === false} onChange={() => updateNode(node.id, 'deepDive', false)} />
                                    否
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#991B1B" }}>新增次要卡點 2（選填）</label>
                                <input type="text" className="input-box" style={{ padding: "6px 10px", borderColor: "#FCA5A5" }} placeholder="其他卡點" value={node.painPoint2 || ""} onChange={(e) => updateNode(node.id, 'painPoint2', e.target.value)} />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#991B1B" }}>新增次要卡點 3（選填）</label>
                                <input type="text" className="input-box" style={{ padding: "6px 10px", borderColor: "#FCA5A5" }} placeholder="其他卡點" value={node.painPoint3 || ""} onChange={(e) => updateNode(node.id, 'painPoint3', e.target.value)} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => addNode(activeStageId)}
                    className="node-card"
                    style={{ background: "transparent", border: "1px dashed #D1D5DB", color: "#6B7280", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 220 }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>新增流程步驟</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "24px", overflowX: "auto" }}>
              <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #E2E4E8", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "12%" }}>旅程階段</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "15%" }}>流程節點</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "10%" }}>負責角色</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "12%" }}>工具 / 系統</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "12%" }}>主要卡點</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "8%" }}>影響程度</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "12%" }}>次要卡點 2</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "12%" }}>次要卡點 3</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", width: "6%", textAlign: "center" }}>重點</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map(stage => {
                      const stageNodes = nodes.filter(n => n.stageId === stage.id);
                      if (stageNodes.length === 0) return null;
                      return stageNodes.map((node, index) => (
                        <tr key={node.id} style={{ borderBottom: "1px solid #E2E4E8" }}>
                          {index === 0 && (
                            <td rowSpan={stageNodes.length} style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", fontWeight: 600, verticalAlign: "top", background: "#fff" }}>
                              {stage.name}
                            </td>
                          )}
                          <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top" }}>{node.name}</td>
                          <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", color: "#5F6368" }}>{node.role}</td>
                          <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", color: "#5F6368" }}>{node.tools}</td>
                          <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", color: "#DC2626" }}>{node.hasProblem ? node.painPoint1 : "-"}</td>
                          <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", color: "#DC2626" }}>
                            {node.hasProblem && node.impact === 'high' ? '高' : node.hasProblem && node.impact === 'medium' ? '中' : node.hasProblem && node.impact === 'low' ? '低' : '-'}
                          </td>
                          <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", color: "#DC2626" }}>{node.hasProblem ? node.painPoint2 : "-"}</td>
                          <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", color: "#DC2626" }}>{node.hasProblem ? node.painPoint3 : "-"}</td>
                          <td style={{ padding: "12px 16px", verticalAlign: "top", textAlign: "center" }}>
                            {node.deepDive ? <span style={{ color: "#D97706", fontWeight: 700, fontSize: 16 }}>★</span> : ""}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
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

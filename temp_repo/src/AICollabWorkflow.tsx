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

const AI_ROLES = [
  "分類", "搜尋", "生成", "判斷輔助", "回覆建議", "推薦", "提醒 / 預警"
];

const TARGET_USERS = [
  "客服", "行銷", "門市", "顧客", "主管", "其他"
];

export default function AICollabWorkflow({ tool, onBack, onComplete, advisorData, setAdvisorData }) {
  const toolData = advisorData[tool.id]?.data || {};
  const toolStatus = advisorData[tool.id]?.status || 'in_progress';

  // Get data from Step 2 & 3
  const workflowData = advisorData['workflow']?.data || {};
  const stages = workflowData.stages || [];
  const nodes = workflowData.nodes || [];
  const painmapData = advisorData['painmap']?.data?.analyzedData || {};

  const targetRootCauses = Object.entries(painmapData).map(([nodeId, analysis]) => {
    const node = nodes.find(n => n.id === nodeId);
    const stage = stages.find(s => s.id === node?.stageId);
    return {
      nodeId,
      stageId: node?.stageId,
      stageName: stage?.name,
      nodeName: node?.name,
      painPoint: node?.painPoint1,
      rootCause: analysis.rootCause,
      categories: analysis.categories,
    };
  }).filter(item => item.rootCause);

  const [scenes, setScenes] = useState(toolData.scenes || {});
  const [selectedNodeId, setSelectedNodeId] = useState(targetRootCauses.length > 0 ? targetRootCauses[0].nodeId : null);

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

  const updateScene = (nodeId, field, value) => {
    setScenes(prev => ({
      ...prev,
      [nodeId]: {
        ...(prev[nodeId] || { name: "", aiRole: "", targetUser: "", currentProcess: "", aiProcess: "", expectedImprovement: "", isPriority: false }),
        [field]: value
      }
    }));
    handleStateChange();
  };

  // Validation
  const completedScenesCount = Object.keys(scenes).filter(id => {
    const data = scenes[id];
    return data && data.name && data.aiRole && data.expectedImprovement;
  }).length;

  const isMinRequirementsMet = completedScenesCount > 0;

  const requestSummary = () => setCurrentState('summary_pending');
  const returnToEdit = () => setCurrentState('editing');

  const confirmSummaryAndComplete = () => {
    setCurrentState('completed_readonly');
    setHasConfirmedBefore(true);
    const currentData = { scenes };
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
      setScenes(confirmedData.scenes);
    }
    setCurrentState('completed_readonly');
  };

  const handleBack = () => {
    if (currentState !== 'completed_readonly') {
      setAdvisorData(prev => ({
        ...prev,
        [tool.id]: {
          status: prev[tool.id]?.status === 'completed' ? 'completed' : 'in_progress',
          data: { scenes, confirmedData }
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
        data: { scenes, confirmedData }
      }
    }));
  };

  // AI Logic
  let aiAgentText = null;
  if (currentState === 'summary_pending' || currentState === 'needs_update' || currentState === 'completed_readonly') {
    const completedScenes = Object.values(scenes).filter(d => d.name && d.aiRole && d.expectedImprovement);
    const rolesCount = completedScenes.reduce((acc, s) => {
      acc[s.aiRole] = (acc[s.aiRole] || 0) + 1;
      return acc;
    }, {});
    const topRoles = Object.entries(rolesCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);
    const priorityScenes = completedScenes.filter(s => s.isPriority);

    aiAgentText = (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px", lineHeight: "1.6" }}>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>1. 場景建立進度</strong>
          <p style={{ margin: 0, color: C.dark }}>已建立 {completedScenes.length} 個 AI 協作場景。</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>2. AI 角色分佈</strong>
          <p style={{ margin: 0, color: C.dark }}>AI 主要扮演的角色為：{topRoles.join("、") || "無"}</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>3. 優先推進建議</strong>
          <ul style={{ margin: 0, paddingLeft: 20, color: C.dark }}>
            {priorityScenes.length > 0 ? priorityScenes.map((s, i) => (
              <li key={i}>{s.name}</li>
            )) : <li>尚未標記優先場景</li>}
          </ul>
        </div>
      </div>
    );
  } else if (!isMinRequirementsMet) {
    const missingItems = [];
    if (completedScenesCount === 0) {
      missingItems.push("請至少完成 1 個 AI 協作場景");
      missingItems.push("請補充 AI 在這裡要幫忙做什麼");
      missingItems.push("請說明預期改善效果");
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

  const selectedRootCause = targetRootCauses.find(n => n.nodeId === selectedNodeId);
  const currentScene = scenes[selectedNodeId] || { name: "", aiRole: "", targetUser: "", currentProcess: "", aiProcess: "", expectedImprovement: "", isPriority: false };

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
        
        .radio-group { display: flex; gap: 16px; flex-wrap: wrap; }
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
        <div className="left-sidebar">
          <div className="sidebar-header">
            A. 待轉換根因清單
          </div>
          <div className="sidebar-list">
            {targetRootCauses.length === 0 ? (
              <div style={{ padding: 16, color: "#5F6368", fontSize: 13, textAlign: "center" }}>
                尚未在 Step 3 完成重點卡點分析
              </div>
            ) : (
              targetRootCauses.map(node => {
                const isAnalyzed = scenes[node.nodeId] && scenes[node.nodeId].name;
                return (
                  <div 
                    key={node.nodeId} 
                    className={`node-item ${selectedNodeId === node.nodeId ? 'active' : ''} ${isAnalyzed ? 'completed' : ''}`}
                    onClick={() => setSelectedNodeId(node.nodeId)}
                  >
                    <div style={{ fontSize: 11, color: "#5F6368", marginBottom: 4 }}>{node.stageName} &gt; {node.nodeName}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", marginBottom: 6 }}>{node.rootCause}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {node.categories.map(c => <span key={c} style={{ fontSize: 10, background: "#F3F4F6", color: "#374151", padding: "2px 6px", borderRadius: 4 }}>{c}</span>)}
                      {isAnalyzed && <span style={{ fontSize: 10, background: "#F6FFED", color: "#389E0D", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>已設計</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="editor-area">
          {selectedRootCause ? (
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Step 4: {tool.title}</h2>
                <p style={{ fontSize: 14, color: "#5F6368", margin: 0 }}>將痛點地圖中的根因，轉成 AI 可實際介入場景。</p>
              </div>

              <div className="section-card">
                <h3 className="section-title">
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F0FE", color: "#1F49A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>B</span>
                  AI 協作場景設計區
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ background: "#F9FAFB", padding: 16, borderRadius: 8, border: "1px solid #E2E4E8", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 12, color: "#5F6368" }}>對應旅程：{selectedRootCause.stageName} &gt; {selectedRootCause.nodeName}</div>
                    <div style={{ fontSize: 13, color: "#DC2626" }}>表象卡點：{selectedRootCause.painPoint}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#991B1B" }}>對應根因：{selectedRootCause.rootCause}</div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#374151" }}>1. 場景名稱</label>
                    <input type="text" className="input-box" placeholder="例如：智能客服問答輔助、自動標籤分類器" value={currentScene.name} onChange={(e) => updateScene(selectedRootCause.nodeId, 'name', e.target.value)} disabled={isReadOnly} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#374151" }}>2. AI 在這裡扮演什麼角色？</label>
                    <div className="radio-group">
                      {AI_ROLES.map(role => (
                        <label key={role} className="radio-label">
                          <input type="radio" name={`role-${selectedRootCause.nodeId}`} value={role} checked={currentScene.aiRole === role} onChange={(e) => updateScene(selectedRootCause.nodeId, 'aiRole', e.target.value)} disabled={isReadOnly} />
                          {role}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#374151" }}>3. AI 要幫誰？</label>
                    <div className="radio-group">
                      {TARGET_USERS.map(user => (
                        <label key={user} className="radio-label">
                          <input type="radio" name={`user-${selectedRootCause.nodeId}`} value={user} checked={currentScene.targetUser === user} onChange={(e) => updateScene(selectedRootCause.nodeId, 'targetUser', e.target.value)} disabled={isReadOnly} />
                          {user}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#374151" }}>4. 目前人工怎麼做？</label>
                      <textarea className="input-box" style={{ minHeight: 80, resize: "vertical" }} placeholder="描述目前的處理方式..." value={currentScene.currentProcess} onChange={(e) => updateScene(selectedRootCause.nodeId, 'currentProcess', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#1F49A3" }}>5. AI 介入後怎麼做？</label>
                      <textarea className="input-box" style={{ minHeight: 80, resize: "vertical", borderColor: "#B5D1FE", background: "#F8FAFC" }} placeholder="描述 AI 介入後的新流程..." value={currentScene.aiProcess} onChange={(e) => updateScene(selectedRootCause.nodeId, 'aiProcess', e.target.value)} disabled={isReadOnly} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#059669" }}>6. 預期改善效果</label>
                    <input type="text" className="input-box" style={{ borderColor: "#A7F3D0" }} placeholder="例如：減少 30% 查詢時間、提高回覆一致性" value={currentScene.expectedImprovement} onChange={(e) => updateScene(selectedRootCause.nodeId, 'expectedImprovement', e.target.value)} disabled={isReadOnly} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#D97706" }}>7. 是否列為優先場景？</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input type="radio" name={`priority-${selectedRootCause.nodeId}`} checked={currentScene.isPriority === true} onChange={() => updateScene(selectedRootCause.nodeId, 'isPriority', true)} disabled={isReadOnly} />
                        是
                      </label>
                      <label className="radio-label">
                        <input type="radio" name={`priority-${selectedRootCause.nodeId}`} checked={currentScene.isPriority === false} onChange={() => updateScene(selectedRootCause.nodeId, 'isPriority', false)} disabled={isReadOnly} />
                        否
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              <div className="section-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E4E8", background: "#FAFAFA" }}>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F0FE", color: "#1F49A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>C</span>
                    場景摘要區
                  </h3>
                </div>
                <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {Object.entries(scenes).filter(([_, s]) => s.name).map(([id, s]) => {
                    const rc = targetRootCauses.find(r => r.nodeId === id);
                    return (
                      <div key={id} style={{ border: "1px solid #E2E4E8", borderRadius: 8, padding: 16, background: "#fff", position: "relative" }}>
                        {s.isPriority && <div style={{ position: "absolute", top: -10, right: 16, background: "#FEF3C7", color: "#D97706", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: "1px solid #FDE68A" }}>優先</div>}
                        <div style={{ fontSize: 11, color: "#5F6368", marginBottom: 4 }}>{rc?.nodeName}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", marginBottom: 8 }}>{s.name}</div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 11, background: "#E8F0FE", color: "#1F49A3", padding: "2px 6px", borderRadius: 4 }}>{s.aiRole}</span>
                          <span style={{ fontSize: 11, background: "#F3F4F6", color: "#374151", padding: "2px 6px", borderRadius: 4 }}>幫 {s.targetUser}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>預期：{s.expectedImprovement}</div>
                      </div>
                    );
                  })}
                  {Object.keys(scenes).filter(id => scenes[id].name).length === 0 && (
                    <div style={{ color: "#6B7280", fontSize: 13, gridColumn: "1 / -1", textAlign: "center", padding: "20px 0" }}>尚未建立任何場景</div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ padding: "48px", textAlign: "center", color: "#6B7280" }}>
              請先在左側選擇一個重點根因
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

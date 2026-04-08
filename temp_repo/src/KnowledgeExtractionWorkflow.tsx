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

const KNOWLEDGE_TYPES = [
  "FAQ", "SOP", "話術", "規則", "決策條件", "案例", "商品 / 服務資訊", "表單 / 欄位定義", "其他"
];

const KNOWLEDGE_SOURCES = [
  "文件", "系統資料", "某個人腦中", "尚未整理"
];

export default function KnowledgeExtractionWorkflow({ tool, onBack, onComplete, advisorData, setAdvisorData }) {
  const toolData = advisorData[tool.id]?.data || {};
  const toolStatus = advisorData[tool.id]?.status || 'in_progress';

  // Get data from Step 4
  const aiCollabData = advisorData['ai-collab']?.data?.scenes || {};
  const workflowData = advisorData['workflow']?.data || {};
  const nodes = workflowData.nodes || [];

  const targetScenes = Object.entries(aiCollabData).filter(([_, s]) => s.name).map(([nodeId, scene]) => {
    const node = nodes.find(n => n.id === nodeId);
    return {
      nodeId,
      sceneId: nodeId, // using nodeId as sceneId for simplicity
      sceneName: scene.name,
      nodeName: node?.name,
      aiRole: scene.aiRole,
      isPriority: scene.isPriority,
      expectedImprovement: scene.expectedImprovement
    };
  });

  const [knowledgeList, setKnowledgeList] = useState(toolData.knowledgeList || []);
  const [selectedSceneId, setSelectedSceneId] = useState(targetScenes.length > 0 ? targetScenes[0].sceneId : null);

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

  const addKnowledge = (sceneId) => {
    setKnowledgeList(prev => [
      ...prev,
      { id: Date.now().toString(), sceneId, type: "", source: "", isReady: false, missingContent: "", suggestion: "" }
    ]);
    handleStateChange();
  };

  const updateKnowledge = (id, field, value) => {
    setKnowledgeList(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
    handleStateChange();
  };

  const removeKnowledge = (id) => {
    setKnowledgeList(prev => prev.filter(k => k.id !== id));
    handleStateChange();
  };

  // Validation
  const completedKnowledgeCount = knowledgeList.filter(k => k.type && k.source && k.missingContent).length;
  const scenesWithKnowledge = new Set(knowledgeList.filter(k => k.type).map(k => k.sceneId)).size;

  const isMinRequirementsMet = completedKnowledgeCount > 0;

  const requestSummary = () => setCurrentState('summary_pending');
  const returnToEdit = () => setCurrentState('editing');

  const confirmSummaryAndComplete = () => {
    setCurrentState('completed_readonly');
    setHasConfirmedBefore(true);
    const currentData = { knowledgeList };
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
      setKnowledgeList(confirmedData.knowledgeList);
    }
    setCurrentState('completed_readonly');
  };

  const handleBack = () => {
    if (currentState !== 'completed_readonly') {
      setAdvisorData(prev => ({
        ...prev,
        [tool.id]: {
          status: prev[tool.id]?.status === 'completed' ? 'completed' : 'in_progress',
          data: { knowledgeList, confirmedData }
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
        data: { knowledgeList, confirmedData }
      }
    }));
  };

  // AI Logic
  let aiAgentText = null;
  if (currentState === 'summary_pending' || currentState === 'needs_update' || currentState === 'completed_readonly') {
    const typesCount = knowledgeList.reduce((acc, k) => {
      if (k.type) acc[k.type] = (acc[k.type] || 0) + 1;
      return acc;
    }, {});
    const topTypes = Object.entries(typesCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    
    const missingTypesCount = knowledgeList.filter(k => !k.isReady).reduce((acc, k) => {
      if (k.type) acc[k.type] = (acc[k.type] || 0) + 1;
      return acc;
    }, {});
    const topMissingTypes = Object.entries(missingTypesCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);

    const readyScenes = targetScenes.filter(s => {
      const sceneK = knowledgeList.filter(k => k.sceneId === s.sceneId);
      return sceneK.length > 0 && sceneK.every(k => k.isReady);
    });

    const notReadyScenes = targetScenes.filter(s => {
      const sceneK = knowledgeList.filter(k => k.sceneId === s.sceneId);
      return sceneK.length > 0 && sceneK.some(k => !k.isReady);
    });

    aiAgentText = (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px", lineHeight: "1.6" }}>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>1. 盤點進度</strong>
          <p style={{ margin: 0, color: C.dark }}>已盤點 {scenesWithKnowledge} 個 AI 場景的知識需求。</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>2. 知識類型分佈</strong>
          <p style={{ margin: 0, color: C.dark }}>主要需要的知識為：{topTypes.join("、") || "無"}</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>3. 缺漏警訊</strong>
          <p style={{ margin: 0, color: C.dark }}>最常缺漏的知識類型為：{topMissingTypes.join("、") || "無"}</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>4. 執行建議</strong>
          <p style={{ margin: 0, color: C.dark }}>
            {readyScenes.length > 0 ? `「${readyScenes[0].sceneName}」等 ${readyScenes.length} 個場景可直接推進。` : "目前沒有可直接推進的場景。"}
            {notReadyScenes.length > 0 ? `「${notReadyScenes[0].sceneName}」等 ${notReadyScenes.length} 個場景需先補齊資料。` : ""}
          </p>
        </div>
      </div>
    );
  } else if (!isMinRequirementsMet) {
    const missingItems = [];
    if (scenesWithKnowledge === 0) missingItems.push("請至少完成 1 個場景的知識盤點");
    if (knowledgeList.some(k => !k.source)) missingItems.push("請補充知識來源");
    if (knowledgeList.some(k => k.missingContent === "")) missingItems.push("請補充缺漏內容");

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

  const selectedScene = targetScenes.find(n => n.sceneId === selectedSceneId);
  const currentKnowledges = knowledgeList.filter(k => k.sceneId === selectedSceneId);

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
        
        .knowledge-card { border: 1px solid #E2E4E8; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #FAFAFA; position: relative; }
        .knowledge-card-remove { position: absolute; top: 16px; right: 16px; color: #9CA3AF; cursor: pointer; background: none; border: none; }
        .knowledge-card-remove:hover { color: #DC2626; }

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
            A. AI 場景清單
          </div>
          <div className="sidebar-list">
            {targetScenes.length === 0 ? (
              <div style={{ padding: 16, color: "#5F6368", fontSize: 13, textAlign: "center" }}>
                尚未在 Step 4 建立 AI 協作場景
              </div>
            ) : (
              targetScenes.map(scene => {
                const isAnalyzed = knowledgeList.some(k => k.sceneId === scene.sceneId);
                return (
                  <div 
                    key={scene.sceneId} 
                    className={`node-item ${selectedSceneId === scene.sceneId ? 'active' : ''} ${isAnalyzed ? 'completed' : ''}`}
                    onClick={() => setSelectedSceneId(scene.sceneId)}
                  >
                    <div style={{ fontSize: 11, color: "#5F6368", marginBottom: 4 }}>{scene.nodeName}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", marginBottom: 6 }}>{scene.sceneName}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, background: "#E8F0FE", color: "#1F49A3", padding: "2px 6px", borderRadius: 4 }}>{scene.aiRole}</span>
                      {scene.isPriority && <span style={{ fontSize: 10, background: "#FEF3C7", color: "#D97706", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>優先</span>}
                      {isAnalyzed && <span style={{ fontSize: 10, background: "#F6FFED", color: "#389E0D", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>已盤點</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="editor-area">
          {selectedScene ? (
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Step 5: {tool.title}</h2>
                <p style={{ fontSize: 14, color: "#5F6368", margin: 0 }}>盤點 AI 協作場景所需的知識、規則、資料與判斷依據。</p>
              </div>

              <div className="section-card">
                <h3 className="section-title">
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F0FE", color: "#1F49A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>B</span>
                  知識需求盤點區
                </h3>
                
                <div style={{ background: "#F9FAFB", padding: 16, borderRadius: 8, border: "1px solid #E2E4E8", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "#5F6368" }}>場景名稱：{selectedScene.sceneName}</div>
                  <div style={{ fontSize: 13, color: "#1F49A3", marginTop: 4 }}>AI 角色：{selectedScene.aiRole}</div>
                  <div style={{ fontSize: 13, color: "#059669", marginTop: 4 }}>預期改善：{selectedScene.expectedImprovement}</div>
                </div>

                {currentKnowledges.map((k, index) => (
                  <div key={k.id} className="knowledge-card">
                    {!isReadOnly && (
                      <button className="knowledge-card-remove" onClick={() => removeKnowledge(k.id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#1F2937" }}>知識需求 {index + 1}</div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>需要的知識類型</label>
                        <select className="input-box" value={k.type} onChange={(e) => updateKnowledge(k.id, 'type', e.target.value)} disabled={isReadOnly}>
                          <option value="">請選擇...</option>
                          {KNOWLEDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>目前來源</label>
                        <select className="input-box" value={k.source} onChange={(e) => updateKnowledge(k.id, 'source', e.target.value)} disabled={isReadOnly}>
                          <option value="">請選擇...</option>
                          {KNOWLEDGE_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>是否已可直接使用？</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input type="radio" name={`ready-${k.id}`} checked={k.isReady === true} onChange={() => updateKnowledge(k.id, 'isReady', true)} disabled={isReadOnly} />
                          是，資料已整理好
                        </label>
                        <label className="radio-label">
                          <input type="radio" name={`ready-${k.id}`} checked={k.isReady === false} onChange={() => updateKnowledge(k.id, 'isReady', false)} disabled={isReadOnly} />
                          否，尚有缺漏或未整理
                        </label>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#DC2626" }}>缺漏內容</label>
                        <input type="text" className="input-box" placeholder="例如：缺少最新退換貨規則" value={k.missingContent} onChange={(e) => updateKnowledge(k.id, 'missingContent', e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#059669" }}>建議補齊方式</label>
                        <input type="text" className="input-box" placeholder="例如：請客服主管盤點成 QA 表格" value={k.suggestion} onChange={(e) => updateKnowledge(k.id, 'suggestion', e.target.value)} disabled={isReadOnly} />
                      </div>
                    </div>
                  </div>
                ))}

                {!isReadOnly && (
                  <button 
                    onClick={() => addKnowledge(selectedScene.sceneId)}
                    style={{ width: "100%", padding: "12px", background: "#fff", border: "1px dashed #4586F0", color: "#4586F0", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                  >
                    + 新增知識需求
                  </button>
                )}
              </div>

              <div className="section-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E4E8", background: "#FAFAFA" }}>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F0FE", color: "#1F49A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>C</span>
                    知識缺漏整理區
                  </h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
                    <thead>
                      <tr style={{ background: "#F3F4F6", textAlign: "left" }}>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "15%" }}>場景名稱</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "15%" }}>所需知識</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "12%" }}>現有來源</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "10%" }}>是否可用</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8", borderRight: "1px solid #E2E4E8", width: "24%" }}>缺漏內容</th>
                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #E2E4E8" }}>補齊建議</th>
                      </tr>
                    </thead>
                    <tbody>
                      {knowledgeList.map(k => {
                        const scene = targetScenes.find(s => s.sceneId === k.sceneId);
                        if (!scene) return null;
                        return (
                          <tr key={k.id} style={{ borderBottom: "1px solid #E2E4E8", background: selectedSceneId === k.sceneId ? "#F8FAFC" : "#fff" }}>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", fontWeight: 600 }}>{scene.sceneName}</td>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top" }}>{k.type}</td>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top" }}>{k.source}</td>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top" }}>
                              {k.isReady ? <span style={{ color: "#059669", fontWeight: 600 }}>是</span> : <span style={{ color: "#DC2626", fontWeight: 600 }}>否</span>}
                            </td>
                            <td style={{ padding: "12px 16px", borderRight: "1px solid #E2E4E8", verticalAlign: "top", color: "#DC2626" }}>{k.missingContent}</td>
                            <td style={{ padding: "12px 16px", verticalAlign: "top", color: "#059669" }}>{k.suggestion}</td>
                          </tr>
                        );
                      })}
                      {knowledgeList.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>
                            尚未新增任何知識需求
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
              請先在左側選擇一個 AI 場景
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

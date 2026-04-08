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

export default function PrioritySortingWorkflow({ tool, onBack, onComplete, advisorData, setAdvisorData }) {
  const toolData = advisorData[tool.id]?.data || {};
  const toolStatus = advisorData[tool.id]?.status || 'in_progress';

  // Get data from Step 4 & 5
  const aiCollabData = advisorData['ai-collab']?.data?.scenes || {};
  const knowledgeData = advisorData['knowledge']?.data?.knowledgeList || [];
  const workflowData = advisorData['workflow']?.data || {};
  const nodes = workflowData.nodes || [];
  const painmapData = advisorData['painmap']?.data?.analyzedData || {};

  const targetScenes = Object.entries(aiCollabData).filter(([_, s]) => s.name).map(([nodeId, scene]) => {
    const node = nodes.find(n => n.id === nodeId);
    const rootCause = painmapData[nodeId]?.rootCause || "";
    const sceneKnowledges = knowledgeData.filter(k => k.sceneId === nodeId);
    
    let knowledgeReadiness = "不足";
    if (sceneKnowledges.length > 0) {
      if (sceneKnowledges.every(k => k.isReady)) {
        knowledgeReadiness = "已具備";
      } else if (sceneKnowledges.some(k => k.isReady)) {
        knowledgeReadiness = "部分具備";
      }
    }

    return {
      sceneId: nodeId,
      sceneName: scene.name,
      rootCause: rootCause,
      expectedImprovement: scene.expectedImprovement,
      isPriority: scene.isPriority,
      knowledgeReadiness
    };
  });

  const [evaluations, setEvaluations] = useState(toolData.evaluations || {});
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

  const updateEvaluation = (sceneId, field, value) => {
    setEvaluations(prev => ({
      ...prev,
      [sceneId]: {
        ...(prev[sceneId] || { impact: "", feasibility: "", isFirstWave: null, reason: "" }),
        [field]: value
      }
    }));
    handleStateChange();
  };

  // Validation
  const completedEvaluationsCount = Object.keys(evaluations).filter(id => {
    const data = evaluations[id];
    return data && data.impact && data.feasibility && data.isFirstWave !== null;
  }).length;

  const isMinRequirementsMet = completedEvaluationsCount > 0;

  const requestSummary = () => setCurrentState('summary_pending');
  const returnToEdit = () => setCurrentState('editing');

  const confirmSummaryAndComplete = () => {
    setCurrentState('completed_readonly');
    setHasConfirmedBefore(true);
    const currentData = { evaluations };
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
      setEvaluations(confirmedData.evaluations);
    }
    setCurrentState('completed_readonly');
  };

  const handleBack = () => {
    if (currentState !== 'completed_readonly') {
      setAdvisorData(prev => ({
        ...prev,
        [tool.id]: {
          status: prev[tool.id]?.status === 'completed' ? 'completed' : 'in_progress',
          data: { evaluations, confirmedData }
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
        data: { evaluations, confirmedData }
      }
    }));
  };

  // Groupings for Results
  const firstWave = targetScenes.filter(s => evaluations[s.sceneId]?.isFirstWave === true);
  const secondWave = targetScenes.filter(s => evaluations[s.sceneId]?.isFirstWave === false && evaluations[s.sceneId]?.impact !== "低");
  const postponed = targetScenes.filter(s => evaluations[s.sceneId]?.isFirstWave === false && evaluations[s.sceneId]?.impact === "低");

  // AI Logic
  let aiAgentText = null;
  if (currentState === 'summary_pending' || currentState === 'needs_update' || currentState === 'completed_readonly') {
    const highImpactLowReady = targetScenes.filter(s => evaluations[s.sceneId]?.impact === "高" && s.knowledgeReadiness === "不足");
    const lowImpactHighFeasible = targetScenes.filter(s => evaluations[s.sceneId]?.impact === "低" && evaluations[s.sceneId]?.feasibility === "高");

    aiAgentText = (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "13px", lineHeight: "1.6" }}>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>1. 排序結果</strong>
          <p style={{ margin: 0, color: C.dark }}>第一波優先場景：{firstWave.length} 個<br/>第二波場景：{secondWave.length} 個<br/>暫緩項目：{postponed.length} 個</p>
        </div>
        <div>
          <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>2. 建議執行起點</strong>
          <p style={{ margin: 0, color: C.dark }}>
            {firstWave.length > 0 ? `建議從「${firstWave[0].sceneName}」開始，因為${evaluations[firstWave[0].sceneId]?.reason || "其具備高價值與可行性"}。` : "尚未選定第一波場景。"}
          </p>
        </div>
        {(highImpactLowReady.length > 0 || lowImpactHighFeasible.length > 0) && (
          <div>
            <strong style={{ color: C.techBlue, display: "block", marginBottom: 4 }}>3. 排序提醒</strong>
            <ul style={{ margin: 0, paddingLeft: 20, color: C.dark }}>
              {highImpactLowReady.map(s => <li key={s.sceneId} style={{ color: "#D97706" }}>「{s.sceneName}」價值高但資料不足，建議盡快補齊。</li>)}
              {lowImpactHighFeasible.map(s => <li key={s.sceneId} style={{ color: "#5F6368" }}>「{s.sceneName}」雖易執行但價值偏低，請留意資源投入。</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  } else if (!isMinRequirementsMet) {
    const missingItems = [];
    if (completedEvaluationsCount === 0) {
      missingItems.push("請至少完成 1 個場景的排序評估");
      missingItems.push("請補充影響價值");
      missingItems.push("請補充執行可行性");
      missingItems.push("請標記是否列入第一波");
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

  const selectedScene = targetScenes.find(n => n.sceneId === selectedSceneId);
  const currentEval = evaluations[selectedSceneId] || { impact: "", feasibility: "", isFirstWave: null, reason: "" };

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
        
        .result-zone { border: 1px solid #E2E4E8; border-radius: 8px; padding: 16px; background: #FAFAFA; min-height: 150px; }
        .result-zone-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .result-card { background: #fff; border: 1px solid #E2E4E8; border-radius: 6px; padding: 12px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }

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
            A. 場景清單
          </div>
          <div className="sidebar-list">
            {targetScenes.length === 0 ? (
              <div style={{ padding: 16, color: "#5F6368", fontSize: 13, textAlign: "center" }}>
                尚未在 Step 4 建立 AI 協作場景
              </div>
            ) : (
              targetScenes.map(scene => {
                const isEvaluated = evaluations[scene.sceneId] && evaluations[scene.sceneId].impact;
                return (
                  <div 
                    key={scene.sceneId} 
                    className={`node-item ${selectedSceneId === scene.sceneId ? 'active' : ''} ${isEvaluated ? 'completed' : ''}`}
                    onClick={() => setSelectedSceneId(scene.sceneId)}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", marginBottom: 6 }}>{scene.sceneName}</div>
                    <div style={{ fontSize: 11, color: "#5F6368", marginBottom: 6 }}>根因：{scene.rootCause}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, background: "#F3F4F6", color: "#374151", padding: "2px 6px", borderRadius: 4 }}>預期：{scene.expectedImprovement}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, background: scene.knowledgeReadiness === '已具備' ? "#D1FAE5" : scene.knowledgeReadiness === '部分具備' ? "#FEF3C7" : "#FEE2E2", color: scene.knowledgeReadiness === '已具備' ? "#065F46" : scene.knowledgeReadiness === '部分具備' ? "#92400E" : "#991B1B", padding: "2px 6px", borderRadius: 4 }}>知識：{scene.knowledgeReadiness}</span>
                      {isEvaluated && <span style={{ fontSize: 10, background: "#F6FFED", color: "#389E0D", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>已評估</span>}
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
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Step 6: {tool.title}</h2>
                <p style={{ fontSize: 14, color: "#5F6368", margin: 0 }}>綜合影響價值與執行可行性，決定哪些場景先做、哪些後做、哪些暫緩。</p>
              </div>

              <div className="section-card">
                <h3 className="section-title">
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F0FE", color: "#1F49A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>B</span>
                  排序評估區
                </h3>
                
                <div style={{ background: "#F9FAFB", padding: 16, borderRadius: 8, border: "1px solid #E2E4E8", marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>{selectedScene.sceneName}</div>
                  <div style={{ fontSize: 13, color: "#991B1B", marginBottom: 4 }}>對應根因：{selectedScene.rootCause}</div>
                  <div style={{ fontSize: 13, color: "#5F6368" }}>知識準備度：<span style={{ fontWeight: 600, color: selectedScene.knowledgeReadiness === '已具備' ? "#059669" : selectedScene.knowledgeReadiness === '部分具備' ? "#D97706" : "#DC2626" }}>{selectedScene.knowledgeReadiness}</span></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#374151" }}>影響價值</label>
                    <div className="radio-group">
                      {["高", "中", "低"].map(val => (
                        <label key={val} className="radio-label">
                          <input type="radio" name={`impact-${selectedScene.sceneId}`} value={val} checked={currentEval.impact === val} onChange={(e) => updateEvaluation(selectedScene.sceneId, 'impact', e.target.value)} disabled={isReadOnly} />
                          {val}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#374151" }}>執行可行性</label>
                    <div className="radio-group">
                      {["高", "中", "低"].map(val => (
                        <label key={val} className="radio-label">
                          <input type="radio" name={`feasibility-${selectedScene.sceneId}`} value={val} checked={currentEval.feasibility === val} onChange={(e) => updateEvaluation(selectedScene.sceneId, 'feasibility', e.target.value)} disabled={isReadOnly} />
                          {val}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 24, padding: "16px", background: currentEval.isFirstWave === true ? "#F0FDF4" : "#fff", border: `1px solid ${currentEval.isFirstWave === true ? "#86EFAC" : "#E2E4E8"}`, borderRadius: 8 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#1F2937" }}>是否建議第一波執行？</label>
                  <div className="radio-group">
                    <label className="radio-label" style={{ fontSize: 14, fontWeight: 600 }}>
                      <input type="radio" name={`firstwave-${selectedScene.sceneId}`} checked={currentEval.isFirstWave === true} onChange={() => updateEvaluation(selectedScene.sceneId, 'isFirstWave', true)} disabled={isReadOnly} />
                      是，列入第一波
                    </label>
                    <label className="radio-label" style={{ fontSize: 14, fontWeight: 600 }}>
                      <input type="radio" name={`firstwave-${selectedScene.sceneId}`} checked={currentEval.isFirstWave === false} onChange={() => updateEvaluation(selectedScene.sceneId, 'isFirstWave', false)} disabled={isReadOnly} />
                      否，後續再做或暫緩
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#374151" }}>排序理由</label>
                  <input type="text" className="input-box" placeholder="簡短說明為什麼這樣排序..." value={currentEval.reason} onChange={(e) => updateEvaluation(selectedScene.sceneId, 'reason', e.target.value)} disabled={isReadOnly} />
                </div>
              </div>

              <div className="section-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E4E8", background: "#FAFAFA" }}>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E8F0FE", color: "#1F49A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>C</span>
                    優先級結果區
                  </h3>
                </div>
                <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  <div className="result-zone" style={{ borderColor: "#86EFAC", background: "#F0FDF4" }}>
                    <div className="result-zone-title" style={{ color: "#166534" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#166534" }}></div>
                      第一波優先執行
                    </div>
                    {firstWave.map(s => (
                      <div key={s.sceneId} className="result-card" style={{ borderColor: "#86EFAC" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>{s.sceneName}</div>
                        <div style={{ fontSize: 11, color: "#5F6368" }}>{evaluations[s.sceneId]?.reason}</div>
                      </div>
                    ))}
                    {firstWave.length === 0 && <div style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 20 }}>無</div>}
                  </div>

                  <div className="result-zone" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
                    <div className="result-zone-title" style={{ color: "#B45309" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#B45309" }}></div>
                      第二波規劃
                    </div>
                    {secondWave.map(s => (
                      <div key={s.sceneId} className="result-card" style={{ borderColor: "#FDE68A" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>{s.sceneName}</div>
                        <div style={{ fontSize: 11, color: "#5F6368" }}>{evaluations[s.sceneId]?.reason}</div>
                      </div>
                    ))}
                    {secondWave.length === 0 && <div style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 20 }}>無</div>}
                  </div>

                  <div className="result-zone" style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
                    <div className="result-zone-title" style={{ color: "#4B5563" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4B5563" }}></div>
                      暫緩項目
                    </div>
                    {postponed.map(s => (
                      <div key={s.sceneId} className="result-card" style={{ borderColor: "#E5E7EB" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>{s.sceneName}</div>
                        <div style={{ fontSize: 11, color: "#5F6368" }}>{evaluations[s.sceneId]?.reason}</div>
                      </div>
                    ))}
                    {postponed.length === 0 && <div style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 20 }}>無</div>}
                  </div>
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

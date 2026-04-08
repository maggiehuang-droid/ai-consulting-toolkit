import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { C, Btn } from './AdminLayout';

export default function CertificateModal({ onClose }: { onClose: () => void }) {
  const [names, setNames] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const certRef = useRef<HTMLDivElement>(null);
  const [currentName, setCurrentName] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const extractedNames: string[] = [];
      data.forEach((row: any, idx) => {
        if (row[0]) {
          const name = String(row[0]).trim();
          if (idx === 0 && (name.includes('姓名') || name.toLowerCase().includes('name'))) return;
          if (name) extractedNames.push(name);
        }
      });
      setNames(extractedNames);
    };
    reader.readAsBinaryString(file);
  };

  const generateCertificates = async () => {
    if (names.length === 0 || !certRef.current) return;
    setGenerating(true);
    const zip = new JSZip();
    
    for (let i = 0; i < names.length; i++) {
      setCurrentName(names[i]);
      setProgress(Math.round((i / names.length) * 100));
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });
      
      const imgData = canvas.toDataURL('image/png').split(',')[1];
      zip.file(`${names[i]}_完課證明.png`, imgData, { base64: true });
    }
    
    setProgress(100);
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Download ZIP
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = '完課證明.zip';
    a.click();
    URL.revokeObjectURL(url);
    
    setGenerating(false);
    setTimeout(onClose, 1000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 24, width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', display: 'flex', gap: 32 }}>
        
        {/* Left: Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, color: C.text }}>匯出完課證明</h2>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>上傳包含學員名單的 Excel 檔案 (請將姓名放在第一欄)，系統將自動生成 IG 格式 (1080x1920) 的完課證明圖片。</p>
          
          <div style={{ border: `2px dashed ${C.border}`, padding: 24, borderRadius: 12, textAlign: 'center' }}>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} id="excel-upload" />
            <label htmlFor="excel-upload" style={{ cursor: 'pointer', color: C.blue, fontWeight: 700 }}>
              選擇 Excel 檔案
            </label>
            {names.length > 0 && <div style={{ marginTop: 12, color: C.green, fontWeight: 600 }}>已讀取 {names.length} 位學員</div>}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={onClose} disabled={generating}>取消</Btn>
            <Btn onClick={generateCertificates} disabled={names.length === 0 || generating}>
              {generating ? `生成中 ${progress}%` : '開始生成 ZIP'}
            </Btn>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: C.bg, borderRadius: 16, padding: 24 }}>
          {/* Scale down for preview, but actual size is 1080x1920 (aspect ratio 9:16) */}
          <div style={{ width: 270, height: 480, position: 'relative', overflow: 'hidden', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
            
            {/* The actual element to capture, scaled using transform for preview but capturing at full size */}
            <div 
              ref={certRef}
              style={{ 
                width: 1080, height: 1920, 
                background: 'linear-gradient(135deg, #FFF 0%, #F0F5FF 100%)',
                position: 'absolute', top: 0, left: 0,
                transform: 'scale(0.25)', transformOrigin: 'top left',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '160px 80px', boxSizing: 'border-box',
                fontFamily: "'Outfit', 'Noto Sans TC', sans-serif"
              }}
            >
              {/* Cute Design Elements */}
              <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: `${C.blue}20`, borderRadius: '50%', filter: 'blur(40px)' }} />
              <div style={{ position: 'absolute', bottom: -100, right: -100, width: 500, height: 500, background: `${C.yellow}20`, borderRadius: '50%', filter: 'blur(60px)' }} />
              
              <img src="https://i.ibb.co/MxgTGTLH/Logo-black.png" alt="Logo" style={{ height: 80, marginBottom: 120 }} crossOrigin="anonymous" />
              
              <h1 style={{ fontSize: 120, fontWeight: 900, color: C.blue, margin: '0 0 40px', letterSpacing: 8 }}>CERTIFICATE</h1>
              <h2 style={{ fontSize: 64, fontWeight: 700, color: C.text, margin: '0 0 160px', letterSpacing: 16 }}>完課證明</h2>
              
              <p style={{ fontSize: 40, color: C.gray, margin: '0 0 40px' }}>茲證明</p>
              <div style={{ fontSize: 140, fontWeight: 800, color: C.text, margin: '0 0 40px', borderBottom: `6px solid ${C.blue}`, paddingBottom: 20, minWidth: 600, textAlign: 'center' }}>
                {currentName || '學員姓名'}
              </div>
              <p style={{ fontSize: 40, color: C.gray, margin: '0 0 120px', lineHeight: 1.6, textAlign: 'center' }}>
                完成 Crescendo Lab<br/>AI 導入實戰工作坊
              </p>
              
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 40 }}>
                <div style={{ width: 240, height: 240, background: '#fff', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.05)' }}>
                  <img src="https://i.ibb.co/cSgSMhxg/icon-toolkit.png" alt="Badge" style={{ width: 160, height: 160 }} crossOrigin="anonymous" />
                </div>
                <div>
                  <p style={{ fontSize: 32, color: C.muted, margin: '0 0 12px' }}>Date</p>
                  <p style={{ fontSize: 48, fontWeight: 700, color: C.text, margin: 0 }}>{new Date().toLocaleDateString('zh-TW')}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

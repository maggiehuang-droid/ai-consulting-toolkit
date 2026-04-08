import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { C, Btn, InputField, Card } from "./AdminLayout";
import DatePicker from "./DatePicker";

export default function WorkshopNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", date: "", client_name: "", notes: "", hubspot_url: "" });
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState(false);

  const set = (key: string) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || dateError) return;
    setSaving(true);
    const res = await fetch("/api/workshops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const ws = await res.json();
    navigate(`/admin/workshops/${ws.id}`);
  };

  return (
    <AdminLayout title="建立工作坊">
      <div style={{ maxWidth: 580 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, marginBottom: 6, color: C.text }}>
            建立新工作坊
          </h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            填寫基本資訊後即可開始新增小組並指派進入連結
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <InputField label="工作坊名稱" name="title" value={form.title} onChange={set("title")} placeholder="例：2025 Q3 AI 顧問工作坊" required />
            <InputField label="說明（選填）" name="description" value={form.description} onChange={set("description")} placeholder="簡短描述這場工作坊的目標或背景" />
            <InputField label="客戶名稱（選填）" name="client_name" value={form.client_name} onChange={set("client_name")} placeholder="例：某某股份有限公司" />

            <div>
              <label style={{ fontSize: 13, color: C.gray, fontWeight: 600, display: "block", marginBottom: 6 }}>
                日期（選填）
              </label>
              <DatePicker
                value={form.date}
                onChange={iso => {
                  setForm(f => ({ ...f, date: iso }));
                  setDateError(false);
                }}
              />
            </div>

            <InputField label="HubSpot 連結（選填）" name="hubspot_url" value={form.hubspot_url} onChange={set("hubspot_url")} placeholder="https://app.hubspot.com/contacts/..." />
            <InputField label="備註（選填）" name="notes" value={form.notes} onChange={set("notes")} placeholder="其他備忘事項" />

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: "flex", gap: 10 }}>
              <Btn type="submit" disabled={saving || !form.title.trim() || dateError}>
                {saving ? "建立中..." : "建立工作坊"}
              </Btn>
              <Btn variant="ghost" onClick={() => navigate("/admin")}>取消</Btn>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}

import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout, { C, Btn, InputField, Card } from "./AdminLayout";

export default function GroupNew() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", facilitator: "" });
  const [saving, setSaving] = useState(false);

  const set = (key: string) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch(`/api/workshops/${workshopId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    navigate(`/admin/workshops/${workshopId}`);
  };

  return (
    <AdminLayout title="新增小組">
      <div style={{ maxWidth: 520 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, marginBottom: 6, color: C.text }}>
            新增小組
          </h1>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            建立後系統會自動產生專屬入口連結
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <InputField
              label="小組名稱"
              name="name"
              value={form.name}
              onChange={set("name")}
              placeholder="例：A 組、財務團隊、行銷小組"
              required
            />
            <InputField
              label="小幫手 / Facilitator（選填）"
              name="facilitator"
              value={form.facilitator}
              onChange={set("facilitator")}
              placeholder="負責引導這組的人名"
            />

            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 20,
                display: "flex",
                gap: 10,
              }}
            >
              <Btn type="submit" disabled={saving || !form.name.trim()}>
                {saving ? "建立中..." : "新增小組"}
              </Btn>
              <Btn variant="ghost" onClick={() => navigate(`/admin/workshops/${workshopId}`)}>
                取消
              </Btn>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}

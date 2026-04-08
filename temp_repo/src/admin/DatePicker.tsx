import React, { useEffect, useRef, useState } from "react";
import { C } from "./AdminLayout";

const FONT = "'Outfit', 'Noto Sans TC', sans-serif";
const MONTH_ZH = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const DAY_ZH   = ["日","一","二","三","四","五","六"];

/** "YYYY/MM/DD" | "YYYY-MM-DD" → Date, null if invalid */
export function parseDate(str: string): Date | null {
  const m = str.trim().match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/** Date → "YYYY-MM-DD" */
export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Date → "YYYY/MM/DD" */
export function toDisplay(d: Date) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  /** ISO string "YYYY-MM-DD" or "" */
  value: string;
  onChange: (iso: string) => void;
}

/**
 * DatePicker — text input + calendar popup.
 * Accepts YYYY/MM/DD or YYYY-MM-DD, auto-formats on blur, validates inline.
 */
export default function DatePicker({ value, onChange }: Props) {
  const initDisplay = value ? toDisplay(new Date(value + "T00:00:00")) : "";
  const [text, setText] = useState(initDisplay);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [pickYear, setPickYear] = useState(() => {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    return d.getFullYear();
  });
  const [pickMonth, setPickMonth] = useState(() => {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    return d.getMonth();
  });
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value → display text (e.g. when modal resets)
  useEffect(() => {
    const display = value ? toDisplay(new Date(value + "T00:00:00")) : "";
    setText(display);
    setError("");
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleChange = (val: string) => {
    setText(val);
    if (!val.trim()) { setError(""); onChange(""); return; }
    const d = parseDate(val);
    if (!d) { setError("請輸入有效日期，格式：YYYY/MM/DD"); onChange(""); }
    else { setError(""); onChange(toISO(d)); }
  };

  const handleBlur = () => {
    const d = parseDate(text);
    if (d) { setText(toDisplay(d)); setError(""); }
  };

  const handlePickDay = (day: number) => {
    const d = new Date(pickYear, pickMonth, day);
    setText(toDisplay(d));
    onChange(toISO(d));
    setError("");
    setOpen(false);
  };

  const prevM = () => { const d = new Date(pickYear, pickMonth - 1); setPickYear(d.getFullYear()); setPickMonth(d.getMonth()); };
  const nextM = () => { const d = new Date(pickYear, pickMonth + 1); setPickYear(d.getFullYear()); setPickMonth(d.getMonth()); };

  const firstDow = new Date(pickYear, pickMonth, 1).getDay();
  const daysInMonth = new Date(pickYear, pickMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const selected = parseDate(text);
  const today = new Date();

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={text}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={() => setOpen(true)}
          placeholder="YYYY/MM/DD"
          style={{
            background: "#fff",
            border: `1px solid ${error ? C.red : open ? C.blue : C.border}`,
            borderRadius: 10,
            padding: "10px 40px 10px 14px",
            color: C.text,
            fontSize: 14,
            fontFamily: FONT,
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
        />
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: open ? C.blue : C.muted, padding: 4,
            display: "flex", alignItems: "center",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
      </div>

      {error && <p style={{ margin: "5px 0 0", fontSize: 12, color: C.red }}>{error}</p>}

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300,
          background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 16, width: 280,
          boxShadow: "0 8px 32px rgba(69,134,240,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
              {pickYear} 年 {MONTH_ZH[pickMonth]}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ fn: prevM, d: "M15 18l-6-6 6-6" }, { fn: nextM, d: "M9 18l6-6-6-6" }].map((btn, i) => (
                <button key={i} type="button" onClick={btn.fn} style={{
                  border: `1px solid ${C.border}`, background: "#fff", borderRadius: 6,
                  width: 26, height: 26, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.gray} strokeWidth="2.5" strokeLinecap="round">
                    <path d={btn.d} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAY_ZH.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.muted, padding: "2px 0" }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isToday = today.getFullYear() === pickYear && today.getMonth() === pickMonth && today.getDate() === day;
              const isSel = selected && selected.getFullYear() === pickYear && selected.getMonth() === pickMonth && selected.getDate() === day;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePickDay(day)}
                  style={{
                    border: "none", borderRadius: 7, padding: "6px 0",
                    cursor: "pointer", fontSize: 13,
                    fontWeight: isSel ? 800 : isToday ? 700 : 400,
                    background: isSel ? C.blue : isToday ? `${C.blue}12` : "transparent",
                    color: isSel ? "#fff" : isToday ? C.blue : C.gray,
                    textAlign: "center", fontFamily: FONT,
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = `${C.blue}10`; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isToday ? `${C.blue}12` : "transparent"; }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

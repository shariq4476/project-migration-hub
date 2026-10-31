export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export function statusTone(status: string): Tone {
  if (status === "approved" || status === "sold") return "success";
  if (status === "pending" || status === "in_progress") return "warning";
  if (status === "rejected" || status === "suspended") return "danger";
  return "neutral";
}

export function stageTone(stage: string): Tone {
  if (stage === "completed") return "success";
  if (stage === "disputed" || stage === "refunded" || stage === "cancelled") return "danger";
  if (stage === "agreement") return "info";
  return "warning";
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0] ?? {});
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => cell(r[k])).join(","))].join("\n");
}

/** Stable colour + status metadata for the Time Off module. */

const NAMED: Record<string, string> = {
  annual: "#1890ff",
  sick: "#722ed1",
  emergency: "#fa541c",
  casual: "#13c2c2",
  unpaid: "#8c8c8c",
  maternity: "#eb2f96",
  paternity: "#2f54eb",
  bereavement: "#595959",
};

const PALETTE = ["#1890ff", "#722ed1", "#13c2c2", "#fa8c16", "#52c41a", "#eb2f96"];

/** Deterministic colour for a leave-type name (named types get a fixed hue). */
export function leaveColor(name?: string): string {
  const n = (name || "").toLowerCase();
  for (const key of Object.keys(NAMED)) {
    if (n.includes(key)) return NAMED[key];
  }
  let h = 0;
  for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export type LeaveStatus =
  | "pending"
  | "clarification_requested"
  | "approved_by_manager"
  | "approved"
  | "rejected";

export const STATUS_META: Record<
  LeaveStatus,
  { color: string; text: string }
> = {
  pending: { color: "gold", text: "To approve" },
  clarification_requested: { color: "orange", text: "Clarification Needed" },
  approved_by_manager: { color: "blue", text: "Manager OK · admin next" },
  approved: { color: "green", text: "Approved" },
  rejected: { color: "red", text: "Rejected" },
};

export function statusMeta(status: string) {
  return (
    STATUS_META[status as LeaveStatus] ?? { color: "default", text: status }
  );
}

export const FAMILIES = [
  "Trucking",
  "Cyber",
] as const;

export const STATUSES = [
  "draft",
  "review",
  "approved",
  "published",
  "superseded",
  "retired",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  published: "Published",
  superseded: "Superseded",
  retired: "Retired",
};

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso() {
  return new Date().toISOString();
}

export function displayDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-");
}

export function relativeDay(iso?: string | null, fallback = "—") {
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const then = new Date(date);
  then.setHours(0, 0, 0, 0);
  const days = Math.round((start.getTime() - then.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return fallback;
}

export function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function nextId(prefix: string, existing: string[]) {
  const max = existing.reduce((n, id) => {
    const num = Number(String(id).replace(/\D/g, "")) || 0;
    return Math.max(n, num);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function nextVersionLabel(used: string[]) {
  const taken = new Set(used.map(String));
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  for (let i = 0; i < 36; i++) {
    const y = year + Math.floor((month + i - 1) / 12);
    const m = String(((month + i - 1) % 12) + 1).padStart(2, "0");
    const label = `${y}.${m}`;
    if (!taken.has(label)) return label;
  }
  return `${year}.${String(month).padStart(2, "0")}-2`;
}

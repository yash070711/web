export type IconName =
  | "eye"
  | "edit"
  | "trash"
  | "power"
  | "plus"
  | "users"
  | "building"
  | "arrow-left"
  | "check"
  | "shield"
  | "link"
  | "search"
  | "chevron-down"
  | "x"
  | "filter"
  | "tag";

export function Icon({ name, size = 15 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "eye":
      return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "edit":
      return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>;
    case "trash":
      return <svg {...common}><path d="M4 7h16M9 7V4h6v3M8 7l1 13h6l1-13" /></svg>;
    case "power":
      return <svg {...common}><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "users":
      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "building":
      return <svg {...common}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" /></svg>;
    case "arrow-left":
      return <svg {...common}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
    case "check":
      return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>;
    case "shield":
      return <svg {...common}><path d="M12 3 5 6v5c0 5 3.2 8.4 7 10 3.8-1.6 7-5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "link":
      return <svg {...common}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    case "chevron-down":
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
    case "x":
      return <svg {...common}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case "filter":
      return <svg {...common}><path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z" /></svg>;
    case "tag":
      return <svg {...common}><path d="M20.6 13.4 12 22l-8.6-8.6A2 2 0 0 1 3 12V4h8a2 2 0 0 1 1.4.6l8.2 8.2a1.2 1.2 0 0 1 0 1.6Z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}

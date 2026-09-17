"use client";

import { useMemo, useState } from "react";
import { constraintSummary, constraintsOf, defaultLinkedWordingDocs, dependenciesOf, wordingDocsOf } from "@/lib/studio-data";
import {
  Accordion,
  ContextBar,
  EditorActions,
  Field,
  PublishedBanner,
  SaveToast,
  StudioHeader,
  availClass,
  availLabel,
  money,
  patchRow,
  str,
  useStudioSave,
  type Row,
} from "./shared";

const COVER_TYPES = [
  "First Party — Property Damage",
  "Third Party Liability",
  "Commercial Auto Liability",
  "Benefit — Personal Accident",
  "First Party — Cargo",
  "First Party — Crime",
  "Service Benefit",
  "First Party — Working Risk",
];

const BASIS = [
  { id: "AV", name: "Agreed Value", desc: "Claims paid based on the agreed value at policy inception.", tone: "#22C55E", bg: "rgba(34,197,94,.16)" },
  { id: "MV", name: "Market Value", desc: "Claims paid based on the current market value at time of loss.", tone: "#A78BFA", bg: "rgba(167,139,250,.16)" },
  { id: "SA", name: "Stated Amount", desc: "Commercial stated amount for truck / trailer.", tone: "#38BDF8", bg: "rgba(56,189,248,.16)" },
  { id: "RC", name: "Reinstatement Cost", desc: "Claims paid based on the cost to replace or restore the asset.", tone: "#F59E0B", bg: "rgba(245,158,11,.16)" },
  { id: "LOI", name: "Limit of Indemnity", desc: "Maximum legal liability payout.", tone: "#F87171", bg: "rgba(248,113,113,.16)" },
  { id: "DV", name: "Declared Value", desc: "Cargo value declared at transit.", tone: "#2DD4BF", bg: "rgba(45,212,191,.16)" },
];
const VB_PCT_OF = ["Insured Value", "Sum Insured", "Agreed Value", "Market Value", "Reinstatement Cost"];
const DEP_TYPES = ["Requires", "Excludes", "Bundles with"];
const WAITING_PERIODS = ["None", "30 days", "60 days", "90 days"];
const ITEM_SUBTYPES: Record<string, string[]> = {
  Vehicle: ["Vehicle — Truck", "Vehicle — Car", "Vehicle — Trailer", "Vehicle"],
  Building: ["Building — Commercial", "Building — Residential", "Building"],
  Contents: ["Contents — Stock", "Contents — Equipment", "Contents"],
  Cargo: ["Cargo — General", "Cargo — Refrigerated", "Cargo"],
  Person: ["Person — Driver", "Person — Passenger", "Person"],
  Other: ["Other"],
};
const OVERRIDE_TYPES = [
  { id: "increase", label: "Increase only" },
  { id: "decrease", label: "Decrease only" },
  { id: "both", label: "Increase or decrease" },
];
const PAYMENT_RULES = ["Maximum payable for this insured item", "Pro-rata by item value", "Lesser of item limit or total loss"];
const UW_OVERRIDE_DEFAULTS = [
  { id: "deductible", title: "Deductible", description: "Allow the underwriter to change deductible amount or percentage." },
  { id: "sublimits", title: "Sub-limits / aggregate", description: "Allow the underwriter to change sub-limits or the annual aggregate." },
  { id: "availability", title: "Availability / optionality", description: "Allow the underwriter to add, remove, or default this cover at quote time." },
  { id: "eligibility", title: "Eligibility constraints", description: "Allow the underwriter to waive a cover-level eligibility constraint." },
  { id: "valuation", title: "Valuation", description: "Allows a permitted valuation basis to be changed for this item with audit reason." },
];

function uwOverridesOf(cover: Row) {
  const stored = Array.isArray(cover.uwOverrides) ? (cover.uwOverrides as Row[]) : null;
  if (stored) return stored;
  return UW_OVERRIDE_DEFAULTS.map((d) => ({ ...d, enabled: d.id === "valuation" ? cover.uwOverrideValuation !== false : false }));
}
const CONSTRAINT_FIELDS = ["Vehicle Age", "Vehicle Type", "Insured Value", "Vehicle Registration", "Driver Age", "Usage", "Sum Insured", "NCD"];
const CONSTRAINT_OPS = ["≤", "≥", "=", "is", "is one of", "is not"];
const WORDING_LIBRARY = [
  { name: "Own Damage Clause — Standard", version: "v2026.04", code: "DOC-OD-CL-001" },
  { name: "Third Party Liability Clause", version: "v2026.04", code: "DOC-TP-CL-001" },
  { name: "Personal Accident Schedule", version: "v2026.04", code: "DOC-PA-CL-001" },
  { name: "General Exclusions Endorsement", version: "v2026.01", code: "DOC-GEN-EX-001" },
  { name: "Policy Wording — Motor Comp.", version: "v2026.04", code: "DOC-WORD-001" },
  { name: "Roadside Assistance Add-On", version: "v2026.04", code: "DOC-END-002" },
  { name: "Policy Schedule Template", version: "v2026.04", code: "DOC-SCH-001" },
];

type ValRow = { id: string; limitMode: string; limit: string; limitOf: string; maxMode: string; max: string; maxOf: string };
type ValConfigRow = {
  id: string;
  valueMode: string;
  value: string;
  valueOf: string;
  minMode: string;
  min: string;
  maxMode: string;
  max: string;
  maxOf: string;
};
type SubRow = { id: string; target: string; limitMode: string; limit: string; of: string };
type InsuredItem = {
  id: string;
  name: string;
  type: string;
  description: string;
  allowedBases: string[];
  defaultBasis: string;
  quoteChoice: string;
  uwOverrideValuation: boolean;
  valuationConfig: ValConfigRow[];
  limitBasisMode: string;
  limitBasis: string;
  uwLimitOverride: boolean;
  limitPct: string;
  limitPctOf: string;
  limitAmount: string;
  maxLimit: string;
  paymentRule: string;
  overrideType: string;
  maxOverride: string;
  itemCopay: string;
  itemWaitingPeriod: string;
  itemAnnualAggregate: boolean;
  itemAggregateLimit: string;
};

const ITEM_TYPES = ["Vehicle", "Building", "Contents", "Cargo", "Person", "Other"];
const QUOTE_CHOICE_OPTS = ["Customer / agent may choose", "Default only — not changeable at quote", "Underwriter only", "Valuation Selection at Quote"];
const LIMIT_BASIS_OPTS = ["Fixed Amount", "Percentage of SI"];

function basisMeta(name: string) {
  return BASIS.find((b) => b.name === name || b.id === name) || BASIS[0];
}

function defaultValRows(cover: Row): ValRow[] {
  const si = str(cover, "sumInsured", "1,000,000");
  const max = str(cover, "maxSingleLimit", str(cover, "sumInsured", "500,000"));
  const primary = basisMeta(str(cover, "basisOfCoverage")).id;
  return BASIS.filter((b) => ["AV", "MV", "RC"].includes(b.id) || b.id === primary).map((b) => ({
    id: b.id,
    limitMode: b.id === "MV" ? "percent" : "amount",
    limit: b.id === "MV" ? "80" : si,
    limitOf: "Insured Value",
    maxMode: b.id === "MV" ? "percent" : "amount",
    max: b.id === "MV" ? "40" : max,
    maxOf: "Insured Value",
  }));
}

function valRowsOf(cover: Row): ValRow[] {
  const rows = cover.valuationRows;
  return Array.isArray(rows) && rows.length ? (rows as ValRow[]) : defaultValRows(cover);
}

function subLimitsOf(cover: Row): SubRow[] {
  const rows = cover.subLimits;
  if (Array.isArray(rows)) return rows as SubRow[];
  const legacy = str(cover, "subLimit");
  return legacy ? [{ id: "sl-1", target: "General", limitMode: "amount", limit: legacy, of: "Insured Value" }] : [];
}

function iiTiles() {
  const icons: Record<string, string> = { AV: "shield", MV: "chart", RC: "refresh", SA: "shield", LOI: "shield", DV: "shield" };
  return [
    ...BASIS.map((b) => ({ ...b, icon: icons[b.id] || "shield" })),
    { id: "NA", name: "Not Applicable", desc: "Valuation basis does not apply to this item.", tone: "#94A3B8", bg: "rgba(148,163,184,.16)", icon: "minus" },
  ];
}

function vbIcon(kind: string, color: string) {
  const fill = color || "currentColor";
  if (kind === "shield") {
    return (
      <svg viewBox="0 0 256 256" fill={fill} width="16" height="16">
        <path d="M208 40H48a16 16 0 00-16 16v56c0 52.72 25.52 84.67 46.93 102.19 23.06 18.86 46 25.27 47 25.53a8 8 0 004.14 0c1-.26 23.91-6.67 47-25.53C198.48 196.67 224 164.72 224 112V56a16 16 0 00-16-16zm0 72c0 37.74-13.67 63.31-40.69 80.61A109.31 109.31 0 01128 217c-8.11-2.38-29.44-10.3-47.31-24.39C53.67 175.31 40 149.74 40 112V56h168z" />
      </svg>
    );
  }
  if (kind === "chart") {
    return (
      <svg viewBox="0 0 256 256" fill={fill} width="16" height="16">
        <path d="M224 200h-8V40a8 8 0 00-16 0v160h-56V88a8 8 0 00-16 0v112h-56V136a8 8 0 00-16 0v64H40V88a8 8 0 00-16 0v120a8 8 0 008 8h192a8 8 0 000-16z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 256 256" fill={fill} width="16" height="16">
      <path d="M240 56v48a8 8 0 01-8 8h-48a8 8 0 010-16h28.6l-22.3-22.3A88 88 0 10128 216a8 8 0 010 16 104 104 0 1173.54-177.54L224 77.17V56a8 8 0 0116 0z" />
    </svg>
  );
}

function scrollCoverSection(targetId: string) {
  const sectionMap: Record<string, string> = {
    identity: "sec-body-identity",
    "ii-item": "ii-item",
    "ii-val": "ii-val",
    "ii-limit": "ii-limit",
    "ii-limit-amt": "ii-limit-amt",
  };
  const el = document.getElementById(sectionMap[targetId] || targetId);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function defaultValConfigRow(id: string, cover: Row): ValConfigRow {
  const cr = valRowsOf(cover).find((r) => r.id === id);
  return {
    id,
    valueMode: cr?.limitMode || (id === "MV" ? "percent" : "amount"),
    value: cr?.limit || (id === "MV" ? "80" : str(cover, "sumInsured", "1,000,000")),
    valueOf: cr?.limitOf || "Sum Insured",
    minMode: "amount",
    min: "",
    maxMode: cr?.maxMode || "amount",
    max: cr?.max || str(cover, "maxSingleLimit", "500,000"),
    maxOf: cr?.maxOf || "Sum Insured",
  };
}

function ensureItemValConfig(item: InsuredItem, cover: Row): ValConfigRow[] {
  const allowed = item.allowedBases.filter((id) => id && id !== "NA");
  let config = Array.isArray(item.valuationConfig) ? [...item.valuationConfig] : [];
  allowed.forEach((id) => {
    if (!config.some((r) => r.id === id)) config.push(defaultValConfigRow(id, cover));
  });
  return config.filter((r) => allowed.includes(r.id));
}

function itemSubtypes(type: string) {
  const key = ITEM_TYPES.find((t) => type === t || type.startsWith(t)) || "Other";
  const list = ITEM_SUBTYPES[key] || ITEM_SUBTYPES.Other;
  return list.includes(type) ? list : [type, ...list];
}

function guessItemType(cover: Row) {
  const hay = `${str(cover, "type")} ${str(cover, "name")}`.toLowerCase();
  if (/vehicle|motor|auto|truck|fleet/.test(hay)) return "Vehicle";
  if (/cargo|goods|transit/.test(hay)) return "Cargo";
  if (/building|property|home|dwelling/.test(hay)) return "Building";
  if (/content/.test(hay)) return "Contents";
  if (/person|accident|life|pa\b|benefit/.test(hay)) return "Person";
  return "Other";
}

function defaultInsuredItem(cover: Row, index: number): InsuredItem {
  const primary = basisMeta(str(cover, "basisOfCoverage")).id;
  const rows = valRowsOf(cover);
  const allowed = (rows.length ? rows.map((r) => r.id) : [primary, "AV", "MV", "RC"]).filter((id, i, a) => Boolean(id) && a.indexOf(id) === i);
  const guessed = guessItemType(cover);
  const type = index === 0 && guessed === "Vehicle" ? "Vehicle — Truck" : guessed;
  const item: InsuredItem = {
    id: `ii-${Date.now()}-${index}`,
    name: type,
    type,
    description: "",
    allowedBases: allowed.length ? allowed : [primary],
    defaultBasis: primary,
    quoteChoice: "Customer / agent may choose",
    uwOverrideValuation: cover.uwOverrideValuation !== false,
    valuationConfig: [],
    limitBasisMode: "percent",
    limitBasis: "Percentage of SI",
    uwLimitOverride: true,
    limitPct: "50",
    limitPctOf: "Sum Insured",
    limitAmount: str(cover, "sumInsured", "50,000"),
    maxLimit: str(cover, "maxSingleLimit", "500,000"),
    paymentRule: "Maximum payable for this insured item",
    overrideType: "both",
    maxOverride: "100,000",
    itemCopay: str(cover, "copay", "0"),
    itemWaitingPeriod: str(cover, "waitingPeriod", "None"),
    itemAnnualAggregate: Boolean(cover.annualAggregate),
    itemAggregateLimit: "",
  };
  item.valuationConfig = allowed.filter((id) => id !== "NA").map((id) => defaultValConfigRow(id, cover));
  return item;
}

function normalizeInsuredItem(item: InsuredItem, cover: Row, index: number): InsuredItem {
  const normalized: InsuredItem = {
    ...defaultInsuredItem(cover, index),
    ...item,
    id: item.id || `ii-${index}-${Date.now()}`,
    name: item.type || item.name || guessItemType(cover),
    type: item.type || guessItemType(cover),
    description: item.description ?? "",
    allowedBases: Array.isArray(item.allowedBases) && item.allowedBases.length
      ? item.allowedBases
      : [basisMeta(item.defaultBasis || str(cover, "basisOfCoverage")).id],
    defaultBasis: item.defaultBasis
      && (item.defaultBasis === "NA" || item.allowedBases?.includes(item.defaultBasis))
      ? item.defaultBasis
      : (item.allowedBases?.[0] || basisMeta(str(cover, "basisOfCoverage")).id),
    quoteChoice: item.quoteChoice || "Customer / agent may choose",
    uwOverrideValuation: item.uwOverrideValuation ?? cover.uwOverrideValuation !== false,
    limitBasis: item.limitBasis === "Sum Insured" || item.limitBasis === "Not Applicable" ? "Fixed Amount" : (item.limitBasis || "Fixed Amount"),
    limitBasisMode: item.limitBasisMode || (/percent/i.test(item.limitBasis || "") ? "percent" : "fixed"),
    uwLimitOverride: item.uwLimitOverride ?? true,
    limitPct: item.limitPct || "50",
    limitPctOf: item.limitPctOf || "Sum Insured",
    limitAmount: item.limitAmount ?? str(cover, "sumInsured", ""),
    maxLimit: item.maxLimit || str(cover, "maxSingleLimit", "500,000"),
    paymentRule: item.paymentRule || "Maximum payable for this insured item",
    overrideType: item.overrideType || "both",
    maxOverride: item.maxOverride || "100,000",
    itemCopay: item.itemCopay ?? str(cover, "copay", "0"),
    itemWaitingPeriod: item.itemWaitingPeriod || str(cover, "waitingPeriod", "None"),
    itemAnnualAggregate: item.itemAnnualAggregate ?? Boolean(cover.annualAggregate),
    itemAggregateLimit: item.itemAggregateLimit ?? "",
    valuationConfig: Array.isArray(item.valuationConfig) ? item.valuationConfig : [],
  };
  normalized.valuationConfig = ensureItemValConfig(normalized, cover);
  return normalized;
}

function insuredItemsOf(cover: Row): InsuredItem[] {
  const stored = cover.insuredItems;
  if (Array.isArray(stored) && stored.length) {
    return (stored as InsuredItem[]).map((it, i) => normalizeInsuredItem(it, cover, i));
  }
  return [defaultInsuredItem(cover, 0)];
}

const LIBRARY: Row[] = [
  { name: "Auto Liability", code: "COV-AL", type: "Commercial Auto Liability", availability: "mandatory", basisOfCoverage: "Limit of Indemnity", sumInsured: "1000000", description: "Third-party bodily injury and property damage for commercial auto use.", icon: "shield", iconBg: "rgba(34,197,94,.16)", iconColor: "#4ADE80" },
  { name: "Uninsured / Underinsured Motorist", code: "COV-UIM", type: "Third Party Liability", availability: "default", basisOfCoverage: "Limit of Indemnity", sumInsured: "1000000", description: "Protection when the other driver lacks adequate insurance.", icon: "person", iconBg: "rgba(56,189,248,.16)", iconColor: "#38BDF8" },
  { name: "Medical Payments / PIP", code: "COV-MP", type: "Benefit — Personal Accident", availability: "default", basisOfCoverage: "Agreed Value", sumInsured: "25000", description: "Medical expenses and personal injury protection for occupants.", icon: "heart", iconBg: "rgba(248,113,113,.16)", iconColor: "#F87171" },
  { name: "Motor Truck Cargo", code: "COV-MTC", type: "First Party — Cargo", availability: "default", basisOfCoverage: "Declared Value", sumInsured: "250000", description: "Loss or damage to lawful cargo while in transit.", icon: "truck", iconBg: "rgba(249,115,22,.18)", iconColor: "#FB923C" },
  { name: "Trailer Interchange", code: "COV-TI", type: "First Party — Property Damage", availability: "optional", basisOfCoverage: "Stated Amount", sumInsured: "80000", description: "Damage to non-owned trailers under interchange agreements.", icon: "trailer", iconBg: "rgba(45,212,191,.16)", iconColor: "#2DD4BF" },
  { name: "Non-Trucking Liability", code: "COV-NTL", type: "Commercial Auto Liability", availability: "addon", basisOfCoverage: "Limit of Indemnity", sumInsured: "1000000", description: "Liability when operating without a trailer, not under dispatch.", icon: "truck", iconBg: "rgba(167,139,250,.18)", iconColor: "#A78BFA" },
  { name: "Physical Damage", code: "COV-PD", type: "First Party — Property Damage", availability: "mandatory", basisOfCoverage: "Stated Amount", sumInsured: "180000", description: "Collision and comprehensive damage to insured vehicles.", icon: "shield", iconBg: "rgba(234,179,8,.18)", iconColor: "#FACC15" },
];

const TRUCKING_COVER_ORDER = LIBRARY.map((c) => str(c, "name").toLowerCase());

function coverIconPath(kind: string) {
  const icons: Record<string, string> = {
    shield: "M208 40H48a16 16 0 00-16 16v56c0 87.31 75.21 117.14 90.77 122.3a15.43 15.43 0 0010.46 0C149.79 229.14 224 199.31 224 112V56a16 16 0 00-16-16z",
    person: "M128 24a40 40 0 1040 40 40 40 0 00-40-40zm72 176v8a8 8 0 01-8 8H64a8 8 0 01-8-8v-8a56 56 0 0156-56 24 24 0 0124 24 8 8 0 0016 0 24 24 0 0124-24 56 56 0 0156 56z",
    heart: "M178 40c-20.65 0-38.73 8.88-50 23.89C116.73 48.88 98.65 40 78 40a62.07 62.07 0 00-62 62c0 70 103.79 126.66 108.21 129a8 8 0 007.58 0C136.21 228.66 240 172 240 102a62.07 62.07 0 00-62-62z",
    truck: "M255.42 117l-14-35A15.93 15.93 0 00226.58 72H192V64a16 16 0 00-16-16H32A16 16 0 0016 64v96a16 16 0 0016 16h16.06A32 32 0 0064 192a32 32 0 0032-32h64a32 32 0 0032 32 32 32 0 0064 0h16.06a16 16 0 0016-16v-8.43a16.07 16.07 0 00-3.64-10.57zM192 88h34.58l9.6 24H192zm2 96a16 16 0 11-16-16 16 16 0 0116 16zm-128 0a16 16 0 11-16-16 16 16 0 0116 16z",
    trailer: "M224 104h-8V88a16 16 0 00-16-16H40a16 16 0 00-16 16v96a16 16 0 0016 16h16.06A32 32 0 0064 216a32 32 0 0064 0h32a32 32 0 0064 0H240a16 16 0 0016-16v-8a40 40 0 00-32-39.2V104zm-64 96a16 16 0 1116-16 16 16 0 01-16 16zm-96 0a16 16 0 1116-16 16 16 0 01-16 16zM224 128v24h-40v-24z",
  };
  return icons[kind] || icons.shield;
}

function coverCatalogMeta(row: Row) {
  if (row.icon) return row;
  return LIBRARY.find((c) => namesMatch(str(c, "name"), str(row, "name"))) || row;
}

function CoverSidebarIcon({ row }: { row: Row }) {
  const meta = coverCatalogMeta(row);
  return (
    <span
      className="coverage-sidebar-icon"
      style={{ background: str(meta, "iconBg", "rgba(34,197,94,.16)"), color: str(meta, "iconColor", "#4ADE80") }}
    >
      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
        <path d={coverIconPath(str(meta, "icon", "shield"))} />
      </svg>
    </span>
  );
}

function sortedCoverRows(list: Row[]) {
  return [...list].sort((a, b) => {
    const ai = TRUCKING_COVER_ORDER.indexOf(str(a, "name").toLowerCase());
    const bi = TRUCKING_COVER_ORDER.indexOf(str(b, "name").toLowerCase());
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function isTruckingCoverageSet(list: Row[]) {
  return list.some((row) => TRUCKING_COVER_ORDER.includes(str(row, "name").toLowerCase()));
}

type Tab = "attached" | "library" | "groups" | "deps" | "summary";

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function nextCoverCode(name: string, type: string, existing: Row[]) {
  const token = (type || name || "COV").replace(/[^A-Za-z]/g, "").slice(0, 5).toUpperCase() || "COV";
  const used = new Set(existing.map((row) => String(row.code || "").toLowerCase()).filter(Boolean));
  let n = existing.length + 1;
  let code = `COV-${token}-${String(n).padStart(3, "0")}`;
  while (used.has(code.toLowerCase())) {
    n += 1;
    code = `COV-${token}-${String(n).padStart(3, "0")}`;
  }
  return code;
}

function codesMatch(a: string, b: string) {
  if (!a || !b) return false;
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  return shorter.length >= 5 && longer.startsWith(shorter);
}

function namesMatch(a: string, b: string) {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

function isSameCover(a: Row, b: Row) {
  return codesMatch(str(a, "code"), str(b, "code")) || namesMatch(str(a, "name"), str(b, "name"));
}

function isAttached(item: Row, attached: Row[]) {
  return attached.some((row) => isSameCover(item, row));
}

function uniqueLibrary() {
  const seen = new Set<string>();
  return LIBRARY.filter((item) => {
    const name = normalize(str(item, "name"));
    const code = normalize(str(item, "code"));
    if ((name && seen.has(name)) || (code && [...seen].some((key) => codesMatch(key, code)))) return false;
    if (name) seen.add(name);
    if (code) seen.add(code);
    return true;
  });
}

function insuredItemsSummary(cover: Row) {
  const items = insuredItemsOf(cover);
  const first = items[0];
  const basis = first?.defaultBasis === "NA" ? "Not Applicable" : basisMeta(first?.defaultBasis || str(cover, "basisOfCoverage")).name;
  return `${items.length} Insured Item${items.length === 1 ? "" : "s"} — ${basis} — Limits configured per item`;
}

function financialSummary(cover: Row) {
  const items = insuredItemsOf(cover);
  const first = items[0];
  const limit = money(first?.limitAmount || str(cover, "sumInsured"));
  const dtype = str(cover, "deductibleType");
  const ded = dtype === "percentage"
    ? `${str(cover, "deductiblePct") || "0"}% deductible`
    : dtype === "none"
      ? "No deductible"
      : `${money(str(cover, "deductibleAmount") || "0")} deductible`;
  const n = `${items.length} item${items.length === 1 ? "" : "s"}`;
  const basisId = first?.defaultBasis && first.defaultBasis !== "NA" ? basisMeta(first.defaultBasis).id : basisMeta(str(cover, "basisOfCoverage")).id;
  return `${n} · ${limit} · ${ded} · ${basisId}`;
}

function ValConfigCell({
  itemId,
  row,
  field,
  readOnly,
  onPatch,
}: {
  itemId: string;
  row: ValConfigRow;
  field: "value" | "min" | "max";
  readOnly: boolean;
  onPatch: (itemId: string, basisId: string, key: string, value: string) => void;
}) {
  const modeKey = field === "value" ? "valueMode" : field === "min" ? "minMode" : "maxMode";
  const mode = row[modeKey] || "amount";
  const val = row[field] || "";
  const of = field === "value" ? row.valueOf : field === "max" ? row.maxOf : "";
  const ofKey = field === "value" ? "valueOf" : field === "max" ? "maxOf" : "";

  return (
    <div className="vb-limit">
      <div className="vb-seg" role="group" aria-label="Value type">
        <button type="button" className={`vb-seg-btn ${mode === "amount" ? "active" : ""}`} disabled={readOnly} onClick={() => onPatch(itemId, row.id, modeKey, "amount")} title="Amount">$</button>
        <button type="button" className={`vb-seg-btn ${mode === "percent" ? "active" : ""}`} disabled={readOnly} onClick={() => onPatch(itemId, row.id, modeKey, "percent")} title="Percentage">%</button>
      </div>
      {mode === "percent" ? (
        <div className="vb-pct">
          <div className="pct-wrap">
            <input className="form-control" disabled={readOnly} value={val} onChange={(e) => onPatch(itemId, row.id, field, e.target.value)} aria-label="Percent" />
            <span className="pct-suffix">%</span>
          </div>
          {ofKey ? (
            <>
              <span>of</span>
              <select className="form-control" disabled={readOnly} value={of} onChange={(e) => onPatch(itemId, row.id, ofKey, e.target.value)} aria-label="Percent of">
                {VB_PCT_OF.map((o) => <option key={o}>{o}</option>)}
              </select>
            </>
          ) : null}
        </div>
      ) : (
        <div className="currency-wrap">
          <span className="currency-prefix">$</span>
          <input className="form-control currency-input" disabled={readOnly} value={val} onChange={(e) => onPatch(itemId, row.id, field, e.target.value)} aria-label="Amount" />
        </div>
      )}
    </div>
  );
}

function InsuredItemCard({
  it,
  index,
  readOnly,
  onPatch,
  onToggleBasis,
  onPatchValConfig,
  onSetLimitBasisMode,
  onRemove,
}: {
  it: InsuredItem;
  index: number;
  readOnly: boolean;
  onPatch: (id: string, patch: Partial<InsuredItem>) => void;
  onToggleBasis: (id: string, basisId: string, on: boolean) => void;
  onPatchValConfig: (itemId: string, basisId: string, key: string, value: string) => void;
  onSetLimitBasisMode: (itemId: string, mode: "fixed" | "percent") => void;
  onRemove: (id: string) => void;
}) {
  const tiles = iiTiles();
  const allowed = it.allowedBases;
  const defaultOpts = allowed.length ? tiles.filter((t) => allowed.includes(t.id) || t.id === it.defaultBasis) : tiles;
  const types = itemSubtypes(it.type);
  const quoteOpts = QUOTE_CHOICE_OPTS.includes(it.quoteChoice) ? QUOTE_CHOICE_OPTS : [it.quoteChoice, ...QUOTE_CHOICE_OPTS];
  const limitMode = it.limitBasisMode === "percent" || /percent/i.test(it.limitBasis || "") ? "percent" : "fixed";
  const valRows = (it.valuationConfig || []).filter((r) => allowed.includes(r.id) && r.id !== "NA");

  return (
    <div className="ii-item" id={index === 0 ? "ii-item" : undefined}>
      {index > 0 ? (
        <div className="ii-item-head">
          <strong>Insured item {index + 1}</strong>
          {!readOnly ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemove(it.id)}>Remove</button>
          ) : null}
        </div>
      ) : null}
      <div className="ii-workspace">
        <section className="ii-sub">
          <div className="ii-sub-head"><span className="ii-sub-num">1</span> Insured Item Details</div>
          <div className="form-grid-2">
            <Field label="Insured item type">
              <select className="form-control" disabled={readOnly} value={it.type} onChange={(e) => onPatch(it.id, { type: e.target.value, name: e.target.value })}>
                {types.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <div className="form-group span-2">
              <label className="form-label">Description <span className="form-hint">(optional)</span></label>
              <textarea className="form-control" rows={2} placeholder="Describe this insured item…" disabled={readOnly} value={it.description} onChange={(e) => onPatch(it.id, { description: e.target.value })} />
            </div>
            <div className="form-group span-2">
              <label className="form-label">Allowed Valuation Basis</label>
              <div className="ii-vb-grid">
                {tiles.map((b) => {
                  const on = allowed.includes(b.id);
                  return (
                    <label key={b.id} className={`ii-vb-tile ${on ? "on" : ""}`}>
                      <input type="checkbox" disabled={readOnly} checked={on} onChange={(e) => onToggleBasis(it.id, b.id, e.target.checked)} />
                      <span className="ii-vb-icon" style={{ background: b.bg, color: b.tone }}>{vbIcon(b.icon || "shield", b.tone)}</span>
                      <strong>{b.name}</strong>
                      <p>{b.desc || ""}</p>
                      {b.id !== "NA" ? (
                        <button type="button" className="ii-vb-link" onClick={() => scrollCoverSection("ii-val")}>Configure →</button>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </div>
            <Field label="Default Valuation Basis">
              <select className="form-control" disabled={readOnly} value={it.defaultBasis} onChange={(e) => onPatch(it.id, { defaultBasis: e.target.value })}>
                {defaultOpts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Valuation Selection at Quote">
              <select className="form-control" disabled={readOnly} value={it.quoteChoice} onChange={(e) => onPatch(it.id, { quoteChoice: e.target.value })}>
                {quoteOpts.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <div className="form-group span-2">
              <div className="ii-toggle-row">
                <div>
                  <strong>Underwriter can override valuation</strong>
                  <p>Allows a permitted valuation basis to be changed for this item with audit reason.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ii-en">{it.uwOverrideValuation ? "Enabled" : "Disabled"}</span>
                  <label className="toggle-switch">
                    <input type="checkbox" disabled={readOnly} checked={it.uwOverrideValuation} onChange={(e) => onPatch(it.id, { uwOverrideValuation: e.target.checked })} aria-label="Underwriter can override valuation" />
                    <div className="toggle-slider" /><div className="toggle-dot" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ii-sub" id={index === 0 ? "ii-val" : undefined}>
          <div className="ii-sub-head"><span className="ii-sub-num">2</span> Valuation Configuration</div>
          <div className="ii-val-table-wrap">
            <table className="ii-val-table">
              <thead>
                <tr>
                  <th>Valuation Basis</th>
                  <th>Value</th>
                  <th>Minimum Value</th>
                  <th>Maximum Value</th>
                </tr>
              </thead>
              <tbody>
                {valRows.length ? valRows.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{basisMeta(r.id).name}</strong></td>
                    <td><ValConfigCell itemId={it.id} row={r} field="value" readOnly={readOnly} onPatch={onPatchValConfig} /></td>
                    <td><ValConfigCell itemId={it.id} row={r} field="min" readOnly={readOnly} onPatch={onPatchValConfig} /></td>
                    <td><ValConfigCell itemId={it.id} row={r} field="max" readOnly={readOnly} onPatch={onPatchValConfig} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="ft-help">Select at least one valuation basis above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="ii-val-foot">Value type and min/max apply per permitted valuation basis for this item.</p>
        </section>

        <section className="ii-sub" id={index === 0 ? "ii-limit" : undefined}>
          <div className="ii-sub-head"><span className="ii-sub-num">3</span> Limit Configuration</div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Limit Basis</label>
            <div className="ii-radio-row" role="radiogroup" aria-label="Limit basis">
              <label className={`ii-radio-opt ${limitMode === "fixed" ? "on" : ""}`}>
                <input type="radio" name={`lim-${it.id}`} value="fixed" disabled={readOnly} checked={limitMode === "fixed"} onChange={() => onSetLimitBasisMode(it.id, "fixed")} /> Fixed Amount
              </label>
              <label className={`ii-radio-opt ${limitMode === "percent" ? "on" : ""}`}>
                <input type="radio" name={`lim-${it.id}`} value="percent" disabled={readOnly} checked={limitMode === "percent"} onChange={() => onSetLimitBasisMode(it.id, "percent")} /> Percentage of Sum Insured
              </label>
            </div>
          </div>
          <div className="form-grid-2">
            {limitMode === "percent" ? (
              <>
                <div className="form-group">
                  <label className="form-label">Limit Percentage</label>
                  <div className="split-inputs">
                    <div className="pct-wrap" style={{ flex: 1 }}>
                      <input className="form-control" disabled={readOnly} value={it.limitPct || ""} onChange={(e) => onPatch(it.id, { limitPct: e.target.value })} />
                      <span className="pct-suffix">%</span>
                    </div>
                    <span style={{ alignSelf: "center", fontSize: 13, color: "var(--color-muted)" }}>of</span>
                    <select className="form-control" style={{ flex: 1 }} disabled={readOnly} value={it.limitPctOf || "Sum Insured"} onChange={(e) => onPatch(it.id, { limitPctOf: e.target.value })}>
                      {["Sum Insured", ...VB_PCT_OF.filter((o) => o !== "Sum Insured")].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" id={index === 0 ? "ii-limit-amt" : undefined}>
                  <label className="form-label">Maximum Limit</label>
                  <div className="currency-wrap">
                    <span className="currency-prefix">$</span>
                    <input className="form-control currency-input" disabled={readOnly} value={it.maxLimit || ""} onChange={(e) => onPatch(it.id, { maxLimit: e.target.value })} />
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group" id={index === 0 ? "ii-limit-amt" : undefined}>
                <label className="form-label">Limit Amount ($)</label>
                <div className="currency-wrap">
                  <span className="currency-prefix">$</span>
                  <input className="form-control currency-input" disabled={readOnly} value={it.limitAmount} onChange={(e) => onPatch(it.id, { limitAmount: e.target.value })} />
                </div>
              </div>
            )}
            <Field label="Payment Rule" span>
              <select className="form-control" disabled={readOnly} value={it.paymentRule} onChange={(e) => onPatch(it.id, { paymentRule: e.target.value })}>
                {PAYMENT_RULES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="ii-sub">
          <div className="ii-sub-head" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="ii-sub-num">4</span> Underwriter Limit Override</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="ii-en">{it.uwLimitOverride ? "Enabled" : "Disabled"}</span>
              <label className="toggle-switch">
                <input type="checkbox" disabled={readOnly} checked={it.uwLimitOverride} onChange={(e) => onPatch(it.id, { uwLimitOverride: e.target.checked })} aria-label="Underwriter limit override" />
                <div className="toggle-slider" /><div className="toggle-dot" />
              </label>
            </div>
          </div>
          {it.uwLimitOverride ? (
            <div className="form-grid-2">
              <div className="form-group span-2">
                <label className="form-label">Override Type</label>
                <div className="ii-radio-row" role="radiogroup" aria-label="Override type">
                  {OVERRIDE_TYPES.map((o) => (
                    <label key={o.id} className={`ii-radio-opt ${it.overrideType === o.id ? "on" : ""}`}>
                      <input type="radio" name={`ov-${it.id}`} value={o.id} disabled={readOnly} checked={it.overrideType === o.id} onChange={() => onPatch(it.id, { overrideType: o.id })} /> {o.label}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Maximum Override">
                <div className="currency-wrap">
                  <span className="currency-prefix">$</span>
                  <input className="form-control currency-input" disabled={readOnly} value={it.maxOverride || ""} onChange={(e) => onPatch(it.id, { maxOverride: e.target.value })} />
                </div>
              </Field>
            </div>
          ) : (
            <p className="ft-help" style={{ margin: 0 }}>Underwriters cannot change the limit for this item.</p>
          )}
        </section>

        <section className="ii-sub">
          <div className="ii-sub-head"><span className="ii-sub-num">5</span> Additional Controls</div>
          <div className="form-grid-3">
            <Field label="Co-pay (%)">
              <div className="pct-wrap">
                <input className="form-control" disabled={readOnly} value={it.itemCopay ?? "0"} onChange={(e) => onPatch(it.id, { itemCopay: e.target.value.replace("%", "") })} />
                <span className="pct-suffix">%</span>
              </div>
            </Field>
            <Field label="Waiting Period">
              <select className="form-control" disabled={readOnly} value={it.itemWaitingPeriod || "None"} onChange={(e) => onPatch(it.id, { itemWaitingPeriod: e.target.value })}>
                {WAITING_PERIODS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Annual Aggregate">
              <div className="ii-toggle-row" style={{ margin: 0, minHeight: 38, padding: "8px 14px" }}>
                <span style={{ fontSize: 13 }}>{it.itemAnnualAggregate ? "Cap enabled" : "No cap"}</span>
                <label className="toggle-switch">
                  <input type="checkbox" disabled={readOnly} checked={it.itemAnnualAggregate} onChange={(e) => onPatch(it.id, { itemAnnualAggregate: e.target.checked })} aria-label="Annual aggregate" />
                  <div className="toggle-slider" /><div className="toggle-dot" />
                </label>
              </div>
            </Field>
          </div>
        </section>
      </div>
    </div>
  );
}

export function CoverageStudio({
  productId,
  version,
  productName,
  status,
  items,
}: {
  productId: string;
  version: string;
  productName: string;
  status: string;
  items: Row[];
}) {
  const [rows, setRows] = useState(() => items.map((cover) => {
    const linked = Array.isArray(cover.wordingDocs) ? cover.wordingDocs : [];
    return linked.length ? cover : { ...cover, wordingDocs: defaultLinkedWordingDocs() };
  }));
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState({ identity: true, insuredItems: true, deductible: true, sublimits: true, overrides: true, dependencies: true, constraints: true, claims: true, wording: true });
  const [tab, setTab] = useState<Tab>("attached");
  const [mode, setMode] = useState<"hub" | "edit">("hub");
  const [addOpen, setAddOpen] = useState(false);
  const [reorder, setReorder] = useState(false);
  const [slQuery, setSlQuery] = useState("");
  const [docPick, setDocPick] = useState("");
  const readOnly = status === "published";
  const { pending, saved, save } = useStudioSave(productId, version, "covers", rows);
  const cover = rows[active];
  const catalog = useMemo(() => uniqueLibrary(), []);
  const available = useMemo(() => catalog.filter((item) => !isAttached(item, rows)), [catalog, rows]);

  const counts = useMemo(() => {
    const n = (a: string) => rows.filter((r) => str(r, "availability") === a).length;
    return { all: rows.length, mandatory: n("mandatory"), optional: n("optional") + n("addon"), defaultOn: n("default") };
  }, [rows]);

  const groups = useMemo(() => {
    const map = new Map<string, Row[]>();
    rows.forEach((row) => {
      const type = str(row, "type", "Uncategorised");
      map.set(type, [...(map.get(type) || []), row]);
    });
    return [...map.entries()];
  }, [rows]);

  const dependencies = useMemo(
    () => rows.filter((row) => dependenciesOf(row).length || str(row, "requiresCover") || str(row, "conditionalOn") || str(row, "mutualExclusions")),
    [rows]
  );

  function update(key: string, value: unknown) {
    if (readOnly || !cover) return;
    if (key === "code") {
      const next = String(value || "").trim();
      if (!next) return;
      const dup = rows.some((row, i) => i !== active && String(row.code || "").trim().toLowerCase() === next.toLowerCase());
      if (dup) return;
    }
    setRows(patchRow(rows, active, key, value));
  }

  function scrollInsuredSection(targetId: string) {
    if (targetId === "identity") {
      setOpen((s) => ({ ...s, identity: true }));
    } else {
      setOpen((s) => ({ ...s, insuredItems: true }));
    }
    window.setTimeout(() => scrollCoverSection(targetId), 40);
  }

  function setSubRows(next: SubRow[]) {
    update("subLimits", next);
  }

  function setInsuredItems(next: InsuredItem[]) {
    if (readOnly || !cover) return;
    const first = next[0];
    setRows(rows.map((r, i) => (i !== active ? r : {
      ...r,
      insuredItems: next,
      basisOfCoverage: first && first.defaultBasis !== "NA" ? basisMeta(first.defaultBasis).name : r.basisOfCoverage,
      sumInsured: first ? first.limitAmount : r.sumInsured,
      uwOverrideValuation: first ? first.uwOverrideValuation : r.uwOverrideValuation,
    })));
  }

  function patchInsured(id: string, patch: Partial<InsuredItem>) {
    if (!cover) return;
    setInsuredItems(insuredItemsOf(cover).map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function toggleInsuredBasis(id: string, basisId: string, on: boolean) {
    if (!cover || readOnly) return;
    const item = insuredItemsOf(cover).find((it) => it.id === id);
    if (!item) return;
    let allowed = item.allowedBases.slice();
    if (on) {
      if (!allowed.includes(basisId)) allowed.push(basisId);
    } else {
      allowed = allowed.filter((x) => x !== basisId);
      if (!allowed.length) allowed = [basisId];
    }
    const defaultBasis = item.defaultBasis !== "NA" && !allowed.includes(item.defaultBasis) ? allowed[0] : item.defaultBasis;
    patchInsured(id, {
      allowedBases: allowed,
      defaultBasis,
      valuationConfig: ensureItemValConfig({ ...item, allowedBases: allowed, defaultBasis }, cover),
    });
  }

  function patchValConfig(itemId: string, basisId: string, key: string, value: string) {
    if (!cover || readOnly) return;
    setInsuredItems(insuredItemsOf(cover).map((it) => {
      if (it.id !== itemId) return it;
      const config = ensureItemValConfig(it, cover);
      return {
        ...it,
        valuationConfig: config.map((row) => (row.id === basisId ? { ...row, [key]: value } : row)),
      };
    }));
  }

  function setItemLimitBasisMode(itemId: string, mode: "fixed" | "percent") {
    patchInsured(itemId, {
      limitBasisMode: mode,
      limitBasis: mode === "percent" ? "Percentage of SI" : "Fixed Amount",
    });
  }

  function addInsuredItem() {
    if (!cover || readOnly) return;
    const items = insuredItemsOf(cover);
    setInsuredItems([...items, {
      ...defaultInsuredItem(cover, items.length),
      id: `ii-${Date.now()}`,
      name: `Insured item ${items.length + 1}`,
      limitAmount: str(cover, "sumInsured"),
    }]);
  }

  function removeInsuredItem(id: string) {
    if (!cover || readOnly) return;
    const items = insuredItemsOf(cover);
    if (items.length <= 1) return;
    setInsuredItems(items.filter((it) => it.id !== id));
  }

  function setDeps(next: Row[]) {
    update("dependencies", next);
  }

  function setConstraints(next: Row[]) {
    update("constraints", next);
  }

  function setWording(next: Row[]) {
    update("wordingDocs", next);
  }

  function addCover(seed?: Row, fromLibrary = false) {
    if (readOnly) return;
    if (seed && isAttached(seed, rows)) {
      setTab("attached");
      const index = rows.findIndex((row) => isSameCover(row, seed));
      if (index >= 0) setActive(index);
      return;
    }
    const id = `COV-CT-${String(rows.length + 1).padStart(3, "0")}`;
    const row: Row = {
      id,
      name: str(seed, "name", "New Cover"),
      code: str(seed, "code") || nextCoverCode(str(seed, "name", "New Cover"), str(seed, "type", "Commercial Auto Liability"), rows),
      availability: str(seed, "availability", "optional"),
      complete: true,
      type: str(seed, "type", "Commercial Auto Liability"),
      description: str(seed, "description", ""),
      basisOfCoverage: str(seed, "basisOfCoverage", "Stated Amount"),
      sumInsured: str(seed, "sumInsured", "1000000"),
      deductibleType: "fixed",
      deductibleAmount: "1000",
      coverVersion: version,
      maxSingleLimit: str(seed, "sumInsured", "1000000"),
      defaultSelected: str(seed, "availability") !== "addon",
      constraints: [],
      dependencies: [],
      wordingDocs: Array.isArray(seed?.wordingDocs) && (seed.wordingDocs as Row[]).length
        ? (seed.wordingDocs as Row[])
        : defaultLinkedWordingDocs(),
      fromLibrary: fromLibrary || Boolean(seed),
    };
    const next = [...rows, row];
    setRows(next);
    setActive(next.length - 1);
    setAddOpen(false);
    setTab("attached");
  }

  function detach(index: number) {
    if (readOnly) return;
    const next = rows.filter((_, i) => i !== index);
    setRows(next);
    setActive(Math.max(0, Math.min(active, next.length - 1)));
    if (!next.length) setMode("hub");
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setRows(next);
    setActive(to);
  }

  function openEditor(index: number) {
    setActive(index);
    setMode("edit");
  }

  return (
    <>
      <StudioHeader
        title="Coverage Guide"
        subtitle={`${productName} · v${version} — ${counts.all} covers configured · ${counts.mandatory} mandatory · ${counts.optional} optional add-ons`}
        productId={productId}
        moduleId="coverage"
        extra={(
          <>
            <button className="btn btn-secondary" type="button" onClick={() => setReorder(true)}>Reorder Covers</button>
          </>
        )}
      />
      <ContextBar
        productId={productId}
        version={version}
        summary={`${counts.all} attached · ${available.length} in library`}
        studioId="coverage"
        itemCount={counts.all}
      />
      <PublishedBanner productId={productId} studio="coverage" readOnly={readOnly} />

      {mode === "edit" && cover ? (
        <div className="studio-layout">
          <aside className="cover-sidebar coverage-sidebar">
            <div className="card">
              <div className="coverage-sidebar-header">
                <div className="coverage-sidebar-title">Covers</div>
              </div>
              <div className="cover-list">
                {sortedCoverRows(rows).map((row) => {
                  const index = rows.findIndex((r) => r === row);
                  return (
                    <div key={str(row, "id", String(index))} className={`cover-item ${index === active ? "active" : ""}`} onClick={() => setActive(index)}>
                      <CoverSidebarIcon row={row} />
                      <div className="cover-item-name">{str(row, "name")}</div>
                      <span className={`avail-badge ${availClass(str(row, "availability"))}`}>{availLabel(str(row, "availability"))}</span>
                      {!readOnly ? (
                        <button
                          type="button"
                          className="coverage-item-remove"
                          aria-label={`Remove ${str(row, "name")}`}
                          onClick={(e) => { e.stopPropagation(); detach(index); }}
                        >
                          ×
                        </button>
                      ) : <span />}
                    </div>
                  );
                })}
              </div>
              {isTruckingCoverageSet(rows) ? (
                <div className="coverage-about-card">
                  <div className="coverage-about-head">
                    <span className="coverage-sidebar-icon" style={{ background: "rgba(249,115,22,.18)", color: "#FB923C" }}>
                      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                        <path d={coverIconPath("truck")} />
                      </svg>
                    </span>
                    <div className="coverage-about-title">About Commercial Trucking Covers</div>
                  </div>
                  <p className="coverage-about-text">These covers are tailored for Commercial Trucking operations — liability, cargo, physical damage, and bobtail exposures. Select a cover to configure limits, deductibles, and wording.</p>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="detail-panel">
            <div className="detail-head">
              <div>
                <h2>{str(cover, "name")}</h2>
                <div className="flex-center gap-2 mt-2">
                  <span className={`avail-badge ${availClass(str(cover, "availability"))}`}>{availLabel(str(cover, "availability"))}</span>
                  <input
                    className="form-control text-mono"
                    style={{ width: 168, height: 30, fontSize: 12, padding: "0 10px" }}
                    disabled={readOnly}
                    value={str(cover, "code")}
                    aria-label="Cover code"
                    onChange={(e) => update("code", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" type="button" onClick={() => setMode("hub")}>Back to attached</button>
                <button className="btn btn-ghost" type="button" disabled={readOnly} onClick={() => detach(active)}>Unattach</button>
              </div>
            </div>

            <div id="sec-body-identity">
            <Accordion n={1} title="Cover Identity" subtitle={str(cover, "type")} open={open.identity} onToggle={() => setOpen((s) => ({ ...s, identity: !s.identity }))}>
              <div className="form-grid-2">
                <Field label="Cover Name">
                  <input className="form-control" disabled={readOnly} value={str(cover, "name")} onChange={(e) => update("name", e.target.value)} />
                </Field>
                <Field label="Cover Code">
                  <input className="form-control text-mono" disabled={readOnly} value={str(cover, "code")} onChange={(e) => update("code", e.target.value)} />
                </Field>
                <Field label="Cover Type">
                  <select className="form-control" disabled={readOnly} value={str(cover, "type")} onChange={(e) => update("type", e.target.value)}>
                    {[str(cover, "type"), ...COVER_TYPES.filter((t) => t !== str(cover, "type"))].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Cover Version">
                  <input className="form-control text-mono" readOnly value={version.replace(/^v/i, "") ? `v${version.replace(/^v/i, "")}` : version} />
                </Field>
                <Field label="Availability">
                  <select className="form-control" disabled={readOnly} value={str(cover, "availability")} onChange={(e) => update("availability", e.target.value)}>
                    <option value="mandatory">Mandatory</option>
                    <option value="default">Default-on</option>
                    <option value="optional">Optional</option>
                    <option value="addon">Add-on</option>
                  </select>
                </Field>
                <Field label="Constraints" span>
                  <input className="form-control" disabled value={constraintSummary(cover) || "None"} />
                </Field>
                <Field label="Description" span>
                  <textarea className="form-control" rows={3} disabled={readOnly} value={str(cover, "description")} onChange={(e) => update("description", e.target.value)} />
                </Field>
              </div>
            </Accordion>
            </div>

            <Accordion n={2} title="Insured Items, Valuation & Limits" subtitle={insuredItemsSummary(cover)} open={open.insuredItems} onToggle={() => setOpen((s) => ({ ...s, insuredItems: !s.insuredItems }))}>
              <nav className="ii-tabs" aria-label="Insured item steps">
                {([
                  ["identity", "Coverage"],
                  ["ii-item", "Insured item"],
                  ["ii-val", "Valuation basis"],
                  ["ii-limit", "Limit basis"],
                  ["ii-limit-amt", "Limit"],
                ] as const).map(([id, label]) => (
                  <button key={id} type="button" className={id === "ii-item" ? "on" : ""} onClick={() => scrollInsuredSection(id)}>{label}</button>
                ))}
              </nav>
              <div className="callout callout-info" style={{ marginBottom: 14 }}>
                <div className="callout-body" style={{ fontSize: 13 }}>Valuation and limit are separate. Valuation determines how the loss value is calculated. Limit determines the maximum amount payable.</div>
              </div>
              {insuredItemsOf(cover).map((it, index) => (
                <InsuredItemCard
                  key={it.id}
                  it={it}
                  index={index}
                  readOnly={readOnly}
                  onPatch={patchInsured}
                  onToggleBasis={toggleInsuredBasis}
                  onPatchValConfig={patchValConfig}
                  onSetLimitBasisMode={setItemLimitBasisMode}
                  onRemove={removeInsuredItem}
                />
              ))}
              {!readOnly && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={addInsuredItem}>+ Add Another Insured Item</button>
              )}
            </Accordion>

            <Accordion n={4} title="Sub-limits" subtitle={subLimitsOf(cover).length ? `${subLimitsOf(cover).length} configured` : "Optional"} open={open.sublimits} onToggle={() => setOpen((s) => ({ ...s, sublimits: !s.sublimits }))}>
              {(() => {
                const subs = subLimitsOf(cover);
                const sq = slQuery.trim().toLowerCase();
                const shownSubs = subs.filter((row) => !sq || `${row.target} ${row.limit}`.toLowerCase().includes(sq));
                return (
                  <>
                    {subs.length ? (
                      <div className="vb-table-wrap">
                        <div className="vb-table-bar">
                          <div className="vb-search">
                            <svg className="vb-search-icon" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66 218.34l-50.07-50.07a88 88 0 10-11.31 11.31l50.06 50.07a8 8 0 0011.32-11.31zM40 112a72 72 0 1172 72 72.08 72.08 0 01-72-72z" /></svg>
                            <input type="search" placeholder="Filter by item, location or peril…" value={slQuery} onChange={(e) => setSlQuery(e.target.value)} aria-label="Filter sub-limits" />
                          </div>
                        </div>
                        <table className="vb-table">
                          <thead><tr><th>Item / location / peril</th><th>Limit</th>{!readOnly && <th style={{ width: 44 }} />}</tr></thead>
                          <tbody>
                            {shownSubs.length ? shownSubs.map((row) => (
                              <tr key={row.id}>
                                <td><input className="form-control" disabled={readOnly} placeholder="e.g. windscreen" value={row.target} onChange={(e) => setSubRows(subs.map((s) => s.id === row.id ? { ...s, target: e.target.value } : s))} /></td>
                                <td>
                                  <div className="vb-limit">
                                    <div className="vb-seg">
                                      <button type="button" className={`vb-seg-btn ${row.limitMode !== "percent" ? "active" : ""}`} disabled={readOnly} onClick={() => setSubRows(subs.map((s) => s.id === row.id ? { ...s, limitMode: "amount" } : s))}>$</button>
                                      <button type="button" className={`vb-seg-btn ${row.limitMode === "percent" ? "active" : ""}`} disabled={readOnly} onClick={() => setSubRows(subs.map((s) => s.id === row.id ? { ...s, limitMode: "percent" } : s))}>%</button>
                                    </div>
                                    {row.limitMode === "percent" ? (
                                      <div className="vb-pct">
                                        <div className="pct-wrap">
                                          <input className="form-control" disabled={readOnly} value={row.limit} onChange={(e) => setSubRows(subs.map((s) => s.id === row.id ? { ...s, limit: e.target.value } : s))} />
                                          <span className="pct-suffix">%</span>
                                        </div>
                                        <span>of</span>
                                        <select className="form-control" disabled={readOnly} value={row.of} onChange={(e) => setSubRows(subs.map((s) => s.id === row.id ? { ...s, of: e.target.value } : s))}>{VB_PCT_OF.map((opt) => <option key={opt}>{opt}</option>)}</select>
                                      </div>
                                    ) : (
                                      <div className="currency-wrap">
                                        <span className="currency-prefix">$</span>
                                        <input className="form-control currency-input" disabled={readOnly} placeholder="None" value={row.limit} onChange={(e) => setSubRows(subs.map((s) => s.id === row.id ? { ...s, limit: e.target.value } : s))} />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {!readOnly && <td><button type="button" className="btn btn-ghost btn-sm" onClick={() => setSubRows(subs.filter((s) => s.id !== row.id))} aria-label="Remove">✕</button></td>}
                              </tr>
                            )) : <tr><td colSpan={readOnly ? 2 : 3} className="vb-empty">No matching sub-limits</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="vb-empty-state">
                        <div className="vb-empty-title">No sub-limits</div>
                        <p>Add a cap for a specific item, location, or peril.</p>
                      </div>
                    )}
                    {!readOnly && (
                      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setSubRows([...subs, { id: `sl-${Date.now()}`, target: "", limitMode: "amount", limit: "", of: "Insured Value" }])}>+ Add sub-limit</button>
                    )}
                  </>
                );
              })()}
            </Accordion>

            <Accordion n={5} title="Underwriter Override Authority" subtitle={`${uwOverridesOf(cover).filter((r) => r.enabled).length} override permission${uwOverridesOf(cover).filter((r) => r.enabled).length === 1 ? "" : "s"} enabled`} open={open.overrides} onToggle={() => setOpen((s) => ({ ...s, overrides: !s.overrides }))}>
              <div className="callout callout-warning" style={{ marginBottom: 16 }}>
                <div className="callout-body" style={{ fontSize: 13 }}>Override permissions are explicit. Every override requires the underwriter identity, old value, new value, reason, and timestamp in the audit trail.</div>
              </div>
              <div className="uw-auth-grid">
                {uwOverridesOf(cover).map((row, i) => (
                  <div className="uw-auth-card" key={str(row, "id", String(i))}>
                    {Boolean((row as { custom?: boolean }).custom) && !readOnly ? (
                      <>
                        <input className="form-control" style={{ fontWeight: 650, marginBottom: 8 }} value={str(row, "title")} placeholder="Override name" onChange={(e) => {
                          const next = uwOverridesOf(cover).map((r, idx) => idx === i ? { ...r, title: e.target.value } : r);
                          update("uwOverrides", next);
                        }} />
                        <input className="form-control" value={str(row, "description")} placeholder="What the underwriter may change" onChange={(e) => {
                          const next = uwOverridesOf(cover).map((r, idx) => idx === i ? { ...r, description: e.target.value } : r);
                          update("uwOverrides", next);
                        }} />
                      </>
                    ) : (
                      <>
                        <h4>{str(row, "title", "Override")}</h4>
                        <p>{str(row, "description")}</p>
                      </>
                    )}
                    <label className="toggle-switch">
                      <input type="checkbox" disabled={readOnly} checked={Boolean(row.enabled)} onChange={(e) => {
                        const next = uwOverridesOf(cover).map((r, idx) => idx === i ? { ...r, enabled: e.target.checked } : r);
                        update("uwOverrides", next);
                        if (str(row, "id") === "valuation") update("uwOverrideValuation", e.target.checked);
                      }} aria-label={str(row, "title", "Override")} />
                      <div className="toggle-slider" /><div className="toggle-dot" />
                    </label>
                    {readOnly ? null : (
                      <button type="button" className="btn btn-ghost btn-sm uw-auth-remove" onClick={() => {
                        const next = uwOverridesOf(cover).filter((_, idx) => idx !== i);
                        update("uwOverrides", next);
                        if (str(row, "id") === "valuation") update("uwOverrideValuation", false);
                      }}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
              {readOnly ? null : (
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => {
                  update("uwOverrides", [...uwOverridesOf(cover), { id: `uw-${Date.now()}`, title: "New override", description: "Allow the underwriter to change this term with audit reason.", enabled: true, custom: true }]);
                }}>+ Add override permission</button>
              )}
              <div className="uw-auth-fields">
                <Field label="Maximum variation (%)">
                  <input className="form-control" disabled={readOnly} value={str(cover, "uwMaxVariation", "20")} onChange={(e) => update("uwMaxVariation", e.target.value)} />
                </Field>
                <Field label="Referral requirement">
                  <select className="form-control" disabled={readOnly} value={str(cover, "uwReferral", "Referral required")} onChange={(e) => update("uwReferral", e.target.value)}>
                    {["Referral required", "No referral", "Referral above max variation"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Reason requirement">
                  <select className="form-control" disabled={readOnly} value={str(cover, "uwReason", "Reason required")} onChange={(e) => update("uwReason", e.target.value)}>
                    {["Reason required", "Reason optional", "No reason"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <p className="uw-auth-foot">Valuation and item-limit override permissions can also be toggled above. Availability of this cover is set in the cover header.</p>
            </Accordion>

            <Accordion n={6} title="Dependencies" subtitle={dependenciesOf(cover).length ? `${dependenciesOf(cover).length} rule${dependenciesOf(cover).length === 1 ? "" : "s"} configured` : "No dependencies"} open={open.dependencies} onToggle={() => setOpen((s) => ({ ...s, dependencies: !s.dependencies }))}>
              <div className="dep-relations">
                <Field label="Default selected">
                  <div className="toggle-wrap">
                    <label className="toggle-switch">
                      <input type="checkbox" disabled={readOnly || str(cover, "availability") === "mandatory"} checked={Boolean(cover.defaultSelected)} onChange={(e) => update("defaultSelected", e.target.checked)} />
                      <div className="toggle-slider" /><div className="toggle-dot" />
                    </label>
                    <span>{cover.defaultSelected ? "Yes" : "No"}{str(cover, "availability") === "mandatory" ? " (enforced as Mandatory)" : ""}</span>
                  </div>
                </Field>
                <Field label="Conditional On">
                  <select className="form-control" disabled={readOnly} value={str(cover, "conditionalOn")} onChange={(e) => update("conditionalOn", e.target.value)}>
                    <option value="">None</option>
                    {rows.filter((_, i) => i !== active).map((row) => (
                      <option key={str(row, "id", str(row, "name"))}>{str(row, "name")}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Mutual Exclusions" span>
                  <div className="dep-mx">
                    <div className="dep-mx-chips">
                      {(Array.isArray(cover.mutualExclusions) ? cover.mutualExclusions : []).length
                        ? (cover.mutualExclusions as string[]).map((n) => (
                          <span className="ci-city-chip" key={n}>
                            {n}
                            {readOnly ? null : <button type="button" onClick={() => update("mutualExclusions", (cover.mutualExclusions as string[]).filter((x) => x !== n))} aria-label={`Remove ${n}`}>×</button>}
                          </span>
                        ))
                        : <span className="dep-mx-empty">None selected</span>}
                    </div>
                    {readOnly ? null : (
                      <div className="dep-mx-opts">
                        {rows.filter((_, i) => i !== active).map((row) => {
                          const n = str(row, "name");
                          const selected = Array.isArray(cover.mutualExclusions) ? (cover.mutualExclusions as string[]).includes(n) : false;
                          return (
                            <label className="dep-mx-opt" key={str(row, "id", n)}>
                              <input type="checkbox" checked={selected} onChange={(e) => {
                                const cur = Array.isArray(cover.mutualExclusions) ? [...(cover.mutualExclusions as string[])] : [];
                                update("mutualExclusions", e.target.checked ? [...cur, n] : cur.filter((x) => x !== n));
                              }} />
                              {n}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Field>
              </div>
              <div className="dep-rules-label">Dependency rules</div>
              <table className="val-table">
                <thead><tr><th>Type</th><th>Depends on</th><th>Condition</th>{!readOnly && <th style={{ width: 40 }} />}</tr></thead>
                <tbody>
                  {dependenciesOf(cover).length === 0 ? (
                    <tr><td colSpan={readOnly ? 3 : 4} className="vb-empty"><div className="vb-empty-title">No dependency rules</div>This cover is independent until you add one.</td></tr>
                  ) : dependenciesOf(cover).map((d, i) => {
                    const names = rows.filter((_, idx) => idx !== active).map((row) => str(row, "name")).filter(Boolean);
                    const depOpts = str(d, "dependsOn") && !names.includes(str(d, "dependsOn")) ? [str(d, "dependsOn"), ...names] : names;
                    return (
                      <tr key={i}>
                        <td>
                          {readOnly ? str(d, "type") : (
                            <select className="form-control" value={str(d, "type") || "Requires"} onChange={(e) => setDeps(dependenciesOf(cover).map((row, idx) => idx === i ? { ...row, type: e.target.value } : row))}>
                              {DEP_TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                          )}
                        </td>
                        <td>
                          {readOnly ? str(d, "dependsOn") : (
                            <select className="form-control" value={str(d, "dependsOn")} onChange={(e) => setDeps(dependenciesOf(cover).map((row, idx) => idx === i ? { ...row, dependsOn: e.target.value } : row))}>
                              {depOpts.map((n) => <option key={n}>{n}</option>)}
                            </select>
                          )}
                        </td>
                        <td>
                          {readOnly ? str(d, "condition") : (
                            <input className="form-control" value={str(d, "condition")} placeholder="e.g. Always" onChange={(e) => setDeps(dependenciesOf(cover).map((row, idx) => idx === i ? { ...row, condition: e.target.value } : row))} />
                          )}
                        </td>
                        {!readOnly && <td><button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeps(dependenciesOf(cover).filter((_, idx) => idx !== i))} aria-label="Remove dependency">✕</button></td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!readOnly && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => {
                  const names = rows.filter((_, i) => i !== active).map((row) => str(row, "name"));
                  setDeps([...dependenciesOf(cover), { type: "Requires", dependsOn: names[0] || "", condition: "Always" }]);
                }}>+ Add Dependency Rule</button>
              )}
              <p className="ft-help" style={{ marginTop: 12 }}>Dependencies control how this cover interacts with others at quote time. Use Eligibility Guide for risk-level rules.</p>
            </Accordion>

            <Accordion n={7} title="Eligibility Constraints" subtitle={`${constraintsOf(cover).length} constraint${constraintsOf(cover).length === 1 ? "" : "s"} configured`} open={open.constraints} onToggle={() => setOpen((s) => ({ ...s, constraints: !s.constraints }))}>
              <table className="val-table">
                <thead><tr><th>Field</th><th>Operator</th><th>Value</th>{!readOnly && <th style={{ width: 40 }} />}</tr></thead>
                <tbody>
                  {constraintsOf(cover).length === 0 ? (
                    <tr><td colSpan={readOnly ? 3 : 4} className="vb-empty"><div className="vb-empty-title">No constraints</div>Add a cover-level pre-filter before eligibility rules.</td></tr>
                  ) : constraintsOf(cover).map((con, i) => {
                    const fields = str(con, "field") && !CONSTRAINT_FIELDS.includes(str(con, "field")) ? [str(con, "field"), ...CONSTRAINT_FIELDS] : CONSTRAINT_FIELDS;
                    const ops = str(con, "operator") && !CONSTRAINT_OPS.includes(str(con, "operator")) ? [str(con, "operator"), ...CONSTRAINT_OPS] : CONSTRAINT_OPS;
                    return (
                      <tr key={i}>
                        <td>
                          {readOnly ? str(con, "field") : (
                            <select className="form-control" value={str(con, "field")} onChange={(e) => setConstraints(constraintsOf(cover).map((row, idx) => idx === i ? { ...row, field: e.target.value } : row))}>
                              {fields.map((f) => <option key={f}>{f}</option>)}
                            </select>
                          )}
                        </td>
                        <td>
                          {readOnly ? str(con, "operator") : (
                            <select className="form-control" value={str(con, "operator")} onChange={(e) => setConstraints(constraintsOf(cover).map((row, idx) => idx === i ? { ...row, operator: e.target.value } : row))}>
                              {ops.map((o) => <option key={o}>{o}</option>)}
                            </select>
                          )}
                        </td>
                        <td>
                          {readOnly ? str(con, "value") : (
                            <input className="form-control" value={str(con, "value")} placeholder="e.g. 15 years" onChange={(e) => setConstraints(constraintsOf(cover).map((row, idx) => idx === i ? { ...row, value: e.target.value } : row))} />
                          )}
                        </td>
                        {!readOnly && <td><button type="button" className="btn btn-ghost btn-sm" onClick={() => setConstraints(constraintsOf(cover).filter((_, idx) => idx !== i))} aria-label="Remove constraint">✕</button></td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!readOnly && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setConstraints([...constraintsOf(cover), { field: "Vehicle Age", operator: "≤", value: "" }])}>+ Add eligibility filter</button>
              )}
              <p className="ft-help" style={{ marginTop: 12 }}>Full eligibility logic is managed in Eligibility Guide. These constraints are cover-level pre-filters applied before eligibility rules.</p>
            </Accordion>

            <Accordion n={8} title="Claims behaviour" subtitle={`${str(cover, "lossBasis", "Per Occurrence")} · ${str(cover, "benefitBasis", "Indemnity")}`} open={open.claims} onToggle={() => setOpen((s) => ({ ...s, claims: !s.claims }))}>
              <div className="form-grid-2">
                <Field label="Loss basis"><input className="form-control" disabled={readOnly} value={str(cover, "lossBasis", "Per Occurrence")} onChange={(e) => update("lossBasis", e.target.value)} /></Field>
                <Field label="Reinstatement"><input className="form-control" disabled={readOnly} value={str(cover, "reinstatement", "Automatic")} onChange={(e) => update("reinstatement", e.target.value)} /></Field>
                <Field label="Benefit basis"><input className="form-control" disabled={readOnly} value={str(cover, "benefitBasis", "Indemnity")} onChange={(e) => update("benefitBasis", e.target.value)} /></Field>
                <Field label="Claims notification (days)"><input className="form-control" disabled={readOnly} value={str(cover, "claimsNotifPeriod", "14")} onChange={(e) => update("claimsNotifPeriod", e.target.value)} /></Field>
              </div>
            </Accordion>

            <Accordion n={10} title="Wording Reference" subtitle={wordingDocsOf(cover).length ? `${wordingDocsOf(cover).length} document${wordingDocsOf(cover).length === 1 ? "" : "s"} linked` : "0 documents linked"} open={open.wording} onToggle={() => setOpen((s) => ({ ...s, wording: !s.wording }))}>
              {wordingDocsOf(cover).length ? (
                wordingDocsOf(cover).map((d) => (
                  <div className="doc-row" key={str(d, "code", str(d, "name"))}>
                    <svg className="doc-row-icon" width="18" height="18" viewBox="0 0 256 256" fill="none" aria-hidden>
                      <path d="M213.66 82.34l-56-56A8 8 0 00152 24H56a16 16 0 00-16 16v176a16 16 0 0016 16h144a16 16 0 0016-16V88a8 8 0 00-2.34-5.66zM160 51.31L188.69 80H160zM200 216H56V40h88v48a8 8 0 008 8h48v120z" fill="currentColor" />
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div className="doc-row-name">{str(d, "name")}</div>
                      <div className="doc-row-code">{str(d, "code")}</div>
                    </div>
                    <span className="doc-row-ver">{str(d, "version")}</span>
                    <a href={`/products/${productId}/document`} className="btn btn-ghost btn-sm">View →</a>
                    {!readOnly && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWording(wordingDocsOf(cover).filter((doc) => str(doc, "code") !== str(d, "code")))} aria-label={`Unlink ${str(d, "name")}`}>✕</button>
                    )}
                  </div>
                ))
              ) : (
                <div className="vb-empty-state" style={{ marginBottom: 12 }}>
                  <div className="vb-empty-title">No documents linked</div>
                  <p>Link a clause, endorsement, or schedule from the library.</p>
                </div>
              )}
              {!readOnly && (
                <div className="vb-toolbar" style={{ marginTop: 8 }}>
                  <select className="form-control" value={docPick} onChange={(e) => setDocPick(e.target.value)} style={{ maxWidth: 360 }}>
                    <option value="">Select a document to link…</option>
                    {WORDING_LIBRARY.filter((d) => !wordingDocsOf(cover).some((linked) => str(linked, "code") === d.code)).map((d) => (
                      <option key={d.code} value={d.code}>{d.name} · {d.code}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!docPick} onClick={() => {
                    const doc = WORDING_LIBRARY.find((d) => d.code === docPick);
                    if (!doc) return;
                    setWording([...wordingDocsOf(cover), { ...doc }]);
                    setDocPick("");
                  }}>+ Link Document</button>
                </div>
              )}
              <div style={{ marginTop: "var(--space-4)" }}>
                <a href={`/products/${productId}/document`} className="btn btn-ghost btn-sm">View in Document Guide →</a>
              </div>
            </Accordion>

            <EditorActions pending={pending} readOnly={readOnly} onDiscard={() => { setRows(items); setMode("hub"); }} onSave={() => save()} />
          </div>
        </div>
      ) : (
        <>
          <div className="cs-tabs" role="tablist">
            <button type="button" className={tab === "attached" ? "active" : ""} onClick={() => setTab("attached")}>Attached Coverages ({rows.length})</button>
            <button type="button" className={tab === "library" ? "active" : ""} onClick={() => setTab("library")}>Coverage Library ({available.length})</button>
            <button type="button" className={tab === "groups" ? "active" : ""} onClick={() => setTab("groups")}>Coverage Groups ({groups.length})</button>
            <button type="button" className={tab === "deps" ? "active" : ""} onClick={() => setTab("deps")}>Dependency Rules ({dependencies.length})</button>
            <button type="button" className={tab === "summary" ? "active" : ""} onClick={() => setTab("summary")}>Summary</button>
            <div className="cs-tabs-end cs-add-wrap">
              <button className="btn btn-blue" type="button" disabled={readOnly} onClick={() => setAddOpen((v) => !v)}>+ Add Coverage ▾</button>
              {addOpen ? (
                <div className="cs-add-menu">
                  <button type="button" onClick={() => addCover()}>Blank cover</button>
                  <button type="button" onClick={() => { setAddOpen(false); setTab("library"); }}>Attach from library</button>
                </div>
              ) : null}
            </div>
          </div>

          {tab === "attached" ? (
            <div className="card elg-table-card">
              <div className="elg-toolbar">
                <div className="card-title" style={{ border: 0, padding: 0 }}>Attached Coverages</div>
                <button className="btn btn-blue" type="button" disabled={readOnly} onClick={() => setTab("library")}>+ Attach coverage</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Coverage</th>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Default limit</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted" style={{ height: 72 }}>
                          No coverages attached yet. Use <strong>Attach coverage</strong> to add from the library.
                        </td>
                      </tr>
                    ) : rows.map((row, index) => (
                      <tr key={str(row, "id", String(index))} className={index === active ? "selected" : ""} onClick={() => setActive(index)}>
                        <td className="fw-600">{str(row, "name")}</td>
                        <td className="mono">{str(row, "code")}</td>
                        <td>{str(row, "type")}</td>
                        <td>{money(str(row, "sumInsured"))}</td>
                        <td>
                          <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="btn btn-secondary btn-sm" type="button" onClick={() => openEditor(index)}>Edit</button>
                            <button className="btn btn-ghost btn-sm" type="button" disabled={readOnly} onClick={() => detach(index)}>Unattach</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {tab === "library" ? (
            <div className="card elg-table-card">
              <div className="elg-toolbar">
                <div className="card-title" style={{ border: 0, padding: 0 }}>Coverage Library</div>
                <span className="text-muted" style={{ fontSize: 13 }}>{available.length} available to attach</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Coverage</th>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Default limit</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {available.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted" style={{ height: 72 }}>All library coverages are already attached to this product.</td>
                      </tr>
                    ) : available.map((item) => (
                      <tr key={str(item, "code")}>
                        <td className="fw-600">{str(item, "name")}</td>
                        <td className="mono">{str(item, "code")}</td>
                        <td>{str(item, "type")}</td>
                        <td>{money(str(item, "sumInsured"))}</td>
                        <td>
                          <button className="btn btn-blue btn-sm" type="button" disabled={readOnly} onClick={() => addCover(item, true)}>Add</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {tab === "groups" ? (
            <div className="cs-groups">
              {groups.length === 0 ? <div className="card"><div className="card-body empty-state">Attach coverages to form groups by type.</div></div> : groups.map(([type, list]) => (
                <div className="card" key={type}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">{type}</div>
                      <div className="card-subtitle">{list.length} attached</div>
                    </div>
                  </div>
                  <div className="card-body" style={{ paddingTop: 8 }}>
                    {list.map((row) => (
                      <div className="cs-group-row" key={str(row, "id")}>
                        <span>{str(row, "name")}</span>
                        <span className="text-muted">{str(row, "code")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "deps" ? (
            <div className="card">
              <div className="card-header"><div className="card-title">Dependency Rules</div></div>
              <div className="card-body">
                {dependencies.length === 0 ? (
                  <p className="text-muted">No cover-to-cover dependencies configured yet. Open an attached cover and set Requires cover, Conditional on, or Mutual exclusions.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Cover</th>
                        <th>Type</th>
                        <th>Depends on</th>
                        <th>Condition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.flatMap((row) => {
                        const deps = dependenciesOf(row);
                        if (deps.length) return deps.map((d, i) => (
                          <tr key={`${str(row, "id")}-${i}`}>
                            <td className="fw-600">{str(row, "name")}</td>
                            <td>{str(d, "type")}</td>
                            <td>{str(d, "dependsOn")}</td>
                            <td>{str(d, "condition")}</td>
                          </tr>
                        ));
                        if (str(row, "requiresCover") || str(row, "conditionalOn")) {
                          return [(
                            <tr key={str(row, "id")}>
                              <td className="fw-600">{str(row, "name")}</td>
                              <td>Requires</td>
                              <td>{str(row, "requiresCover") || str(row, "conditionalOn")}</td>
                              <td>{str(row, "conditionalOn") || "Always"}</td>
                            </tr>
                          )];
                        }
                        return [];
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : null}

          {tab === "summary" ? (
            <div className="card">
              <div className="card-header"><div className="card-title">Coverage summary</div></div>
              <div className="card-body">
                <div className="elg-summary-grid">
                  <div><div className="elg-kpi">{rows.length}</div><div className="text-muted">Attached</div></div>
                  <div><div className="elg-kpi">{available.length}</div><div className="text-muted">Available in library</div></div>
                  <div><div className="elg-kpi">{counts.mandatory}</div><div className="text-muted">Mandatory</div></div>
                  <div><div className="elg-kpi">{counts.optional}</div><div className="text-muted">Optional / add-on</div></div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      <SaveToast show={saved} />

      {reorder ? (
        <div className="studio-modal-overlay" onClick={() => setReorder(false)}>
          <div className="studio-modal" onClick={(e) => e.stopPropagation()}>
            <div className="studio-modal-header">
              <div className="card-title">Reorder covers</div>
              <button className="btn btn-ghost" type="button" onClick={() => setReorder(false)}>Close</button>
            </div>
            <div className="studio-modal-body">
              {rows.map((row, i) => (
                <div className="lib-row" key={str(row, "id", String(i))}>
                  <div className="fw-500">{str(row, "name")}</div>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" type="button" disabled={readOnly || i === 0} onClick={() => move(i, i - 1)}>Up</button>
                    <button className="btn btn-secondary btn-sm" type="button" disabled={readOnly || i === rows.length - 1} onClick={() => move(i, i + 1)}>Down</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

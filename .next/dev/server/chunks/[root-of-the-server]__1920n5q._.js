module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/app/api/runtime/products/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/session.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/format.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(_, { params }) {
    const { id } = await params;
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSession"])();
    const workspace = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadWorkspace"])(session);
    const product = workspace.products.find((p)=>p.id === id);
    if (!product) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Product not found"
    }, {
        status: 404
    });
    const version = product.version;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        product: {
            id: product.id,
            name: product.name,
            family: product.family,
            version,
            status: product.status,
            description: product.description,
            segment: product.segment,
            jurisdictions: product.jurisdictions
        },
        covers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCollection"])(workspace, id, version, "covers"),
        questions: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCollection"])(workspace, id, version, "questionGroups"),
        eligibility: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCollection"])(workspace, id, version, "eligibilityRules"),
        rating: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCollection"])(workspace, id, version, "ratingComponents"),
        underwriting: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCollection"])(workspace, id, version, "underwritingRules"),
        channels: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCollection"])(workspace, id, version, "channels"),
        documents: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCollection"])(workspace, id, version, "documents")
    });
}
async function PATCH(req, { params }) {
    const { id } = await params;
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSession"])();
    let body = {};
    try {
        body = await req.json();
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Invalid JSON"
        }, {
            status: 400
        });
    }
    const allowed = [
        "name",
        "family",
        "owner",
        "description",
        "segment",
        "code",
        "jurisdictions"
    ];
    const cleaned = {};
    for (const key of allowed){
        if (key in body) cleaned[key] = body[key];
    }
    if (typeof cleaned.name === "string" && !String(cleaned.name).trim()) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Product name is required"
        }, {
            status: 400
        });
    }
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mutateWorkspace"])(session, (ws)=>{
            const product = ws.products.find((p)=>p.id === id);
            if (!product) throw new Error("Product not found");
            Object.assign(product, cleaned, {
                lastModified: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["displayDate"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["todayIso"])()) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["todayIso"])(),
                lastModifiedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nowIso"])(),
                lastModifiedBy: session.name
            });
            if (ws.details[id]) Object.assign(ws.details[id], cleaned);
        }, {
            action: "MODIFIED",
            page: "product-detail",
            productId: id,
            description: `Updated ${id}`
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Update failed";
        const status = message === "Product not found" ? 404 : 400;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: message
        }, {
            status
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true,
        id
    });
}
}),
"[project]/lib/format.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FAMILIES",
    ()=>FAMILIES,
    "STATUSES",
    ()=>STATUSES,
    "STATUS_LABEL",
    ()=>STATUS_LABEL,
    "displayDate",
    ()=>displayDate,
    "initials",
    ()=>initials,
    "money",
    ()=>money,
    "nextId",
    ()=>nextId,
    "nextVersionLabel",
    ()=>nextVersionLabel,
    "nowIso",
    ()=>nowIso,
    "relativeDay",
    ()=>relativeDay,
    "todayIso",
    ()=>todayIso
]);
const FAMILIES = [
    "Trucking",
    "Cyber"
];
const STATUSES = [
    "draft",
    "review",
    "approved",
    "published",
    "superseded",
    "retired"
];
const STATUS_LABEL = {
    draft: "Draft",
    review: "In Review",
    approved: "Approved",
    published: "Published",
    superseded: "Superseded",
    retired: "Retired"
};
function todayIso() {
    return new Date().toISOString().slice(0, 10);
}
function nowIso() {
    return new Date().toISOString();
}
function displayDate(value) {
    if (!value) return null;
    const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).replace(/ /g, "-");
}
function relativeDay(iso, fallback = "—") {
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
function money(n) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(n || 0);
}
function initials(name) {
    return name.split(/\s+/).map((p)=>p[0]).join("").slice(0, 2).toUpperCase();
}
function nextId(prefix, existing) {
    const max = existing.reduce((n, id)=>{
        const num = Number(String(id).replace(/\D/g, "")) || 0;
        return Math.max(n, num);
    }, 0);
    return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
function nextVersionLabel(used) {
    const taken = new Set(used.map(String));
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    for(let i = 0; i < 36; i++){
        const y = year + Math.floor((month + i - 1) / 12);
        const m = String((month + i - 1) % 12 + 1).padStart(2, "0");
        const label = `${y}.${m}`;
        if (!taken.has(label)) return label;
    }
    return `${year}.${String(month).padStart(2, "0")}-2`;
}
}),
"[project]/lib/questionnaire-seed.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "QUESTION_TYPES",
    ()=>QUESTION_TYPES,
    "privateCarQuestionGroups",
    ()=>privateCarQuestionGroups,
    "questionTypeLabel",
    ()=>questionTypeLabel,
    "truckingQuestionGroups",
    ()=>truckingQuestionGroups
]);
const QUESTION_TYPES = [
    {
        id: "text",
        label: "Text"
    },
    {
        id: "textarea",
        label: "Textarea"
    },
    {
        id: "number",
        label: "Number"
    },
    {
        id: "currency",
        label: "Currency"
    },
    {
        id: "date",
        label: "Date"
    },
    {
        id: "daterange",
        label: "Date Range"
    },
    {
        id: "boolean",
        label: "Boolean"
    },
    {
        id: "select",
        label: "Single-select"
    },
    {
        id: "multisel",
        label: "Multi-select"
    },
    {
        id: "entity",
        label: "Entity Lookup"
    },
    {
        id: "attachment",
        label: "Attachment"
    },
    {
        id: "repeat",
        label: "Repeatable Group"
    },
    {
        id: "address",
        label: "Address"
    }
];
function questionTypeLabel(type) {
    return QUESTION_TYPES.find((t)=>t.id === type)?.label || type;
}
function channels(list = [
    "web",
    "mobile",
    "agent",
    "api"
]) {
    return list.map((c)=>c[0].toUpperCase() + c.slice(1)).join(", ");
}
function privateCarQuestionGroups() {
    return [
        {
            id: "grp-1",
            name: "Vehicle Details",
            label: "Vehicle Details",
            questions: [
                {
                    id: "QST-VEH-001",
                    label: "Make & Model",
                    internalName: "vehicle_make_model",
                    type: "entity",
                    typeLabel: "Entity Lookup",
                    required: true,
                    displayOrder: 1,
                    channels: channels(),
                    helpText: "Search the vehicle make and model from the manufacturer catalogue.",
                    fieldType: "entity",
                    inputFormat: "Entity lookup",
                    validations: [
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "Make and model is required."
                        }
                    ],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-VEH-002",
                    label: "Year of Manufacture",
                    internalName: "vehicle_year_of_manufacture",
                    type: "number",
                    typeLabel: "Number",
                    required: true,
                    displayOrder: 2,
                    derived: {
                        attr: "vehicle_age",
                        formula: 'FLOOR(DATEDIFF(TODAY(), vehicle_year_of_manufacture, "years"))',
                        dataType: "Number",
                        usedIn: "Rating factors (vehicle age band), Eligibility rules"
                    },
                    helpText: "The year the vehicle was manufactured, as shown on the registration document.",
                    channels: channels(),
                    fieldType: "number",
                    inputFormat: "4-digit year (YYYY)",
                    min: "2005",
                    max: "[Current Year]",
                    step: "1",
                    placeholder: "e.g., 2019",
                    validations: [
                        {
                            rule: "Min Value",
                            expr: "2005",
                            msg: "Vehicle must be manufactured in 2005 or later."
                        },
                        {
                            rule: "Max Value",
                            expr: "Current Year",
                            msg: "Year of manufacture cannot be in the future."
                        },
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "This field is required."
                        }
                    ],
                    conditions: [
                        {
                            field: "Purpose of Use",
                            op: "is not",
                            value: "hire"
                        },
                        {
                            connector: "AND",
                            field: "Insured Value",
                            op: ">",
                            value: "0"
                        }
                    ],
                    exprPreview: 'purpose_of_use != "hire" AND insured_value > 0',
                    evidence: []
                },
                {
                    id: "QST-VEH-003",
                    label: "Insured Value",
                    internalName: "vehicle_insured_value",
                    type: "currency",
                    typeLabel: "Currency",
                    required: true,
                    displayOrder: 3,
                    channels: channels(),
                    helpText: "Agreed or market value of the vehicle.",
                    fieldType: "currency",
                    validations: [
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "Insured value is required."
                        }
                    ],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-VEH-004",
                    label: "Vehicle Modifications?",
                    internalName: "vehicle_modifications",
                    type: "boolean",
                    typeLabel: "Boolean",
                    required: true,
                    displayOrder: 4,
                    evidence: [
                        {
                            condition: "vehicle_modifications = Yes",
                            type: "Inspection Required",
                            message: "A vehicle inspection is required for modified vehicles. Our team will contact you to arrange."
                        }
                    ],
                    helpText: "Please indicate whether the vehicle has been modified from its original factory specification.",
                    channels: channels(),
                    fieldType: "boolean",
                    inputFormat: "Yes / No toggle",
                    validations: [
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "This field is required."
                        }
                    ],
                    conditions: []
                },
                {
                    id: "QST-VEH-005",
                    label: "Purpose of Use",
                    internalName: "purpose_of_use",
                    type: "select",
                    typeLabel: "Single-select",
                    required: true,
                    displayOrder: 5,
                    channels: channels(),
                    helpText: "Select the primary purpose for which the vehicle is used.",
                    fieldType: "select",
                    inputFormat: "Dropdown",
                    options: [
                        {
                            value: "private",
                            label: "Private use only"
                        },
                        {
                            value: "commercial_light",
                            label: "Commercial — light use (deliveries, trade)"
                        },
                        {
                            value: "hire",
                            label: "Hire or reward"
                        }
                    ],
                    validations: [
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "Please select a purpose of use."
                        }
                    ],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-VEH-006",
                    label: "Annual Mileage",
                    internalName: "annual_mileage",
                    type: "number",
                    typeLabel: "Number",
                    required: false,
                    displayOrder: 6,
                    conditional: true,
                    channels: channels(),
                    fieldType: "number",
                    conditions: [
                        {
                            field: "Purpose of Use",
                            op: "is",
                            value: "private"
                        }
                    ],
                    validations: [],
                    evidence: []
                }
            ]
        },
        {
            id: "grp-2",
            name: "Driver Details",
            label: "Driver Details",
            questions: [
                {
                    id: "QST-DRV-001",
                    label: "Primary Driver — Full Name",
                    internalName: "driver_full_name",
                    type: "text",
                    typeLabel: "Text",
                    required: true,
                    displayOrder: 1,
                    channels: channels(),
                    fieldType: "text",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-DRV-002",
                    label: "Primary Driver — Date of Birth",
                    internalName: "driver_date_of_birth",
                    type: "date",
                    typeLabel: "Date",
                    required: true,
                    displayOrder: 2,
                    derived: {
                        attr: "driver_age",
                        formula: 'FLOOR(DATEDIFF(TODAY(), driver_date_of_birth, "years"))',
                        dataType: "Number",
                        usedIn: "Rating factors (driver age band), Eligibility rules (minimum age 21)"
                    },
                    helpText: "Enter the primary driver's date of birth as shown on their identity document.",
                    channels: channels(),
                    fieldType: "date",
                    inputFormat: "DD-MM-YYYY",
                    max: "Today - 18 years",
                    validations: [
                        {
                            rule: "Max Value",
                            expr: "Today - 18 years",
                            msg: "Primary driver must be at least 18 years old."
                        },
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "Date of birth is required."
                        }
                    ],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-DRV-003",
                    label: "Primary Driver — Licence No.",
                    internalName: "driver_licence_number",
                    type: "text",
                    typeLabel: "Text",
                    required: true,
                    displayOrder: 3,
                    channels: channels(),
                    fieldType: "text",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-DRV-004",
                    label: "Primary Driver — Licence Issue Date",
                    internalName: "driver_licence_date",
                    type: "date",
                    typeLabel: "Date",
                    required: true,
                    displayOrder: 4,
                    derived: true,
                    channels: channels(),
                    fieldType: "date",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-DRV-005",
                    label: "Conviction History?",
                    internalName: "driver_conviction_history",
                    type: "boolean",
                    typeLabel: "Boolean",
                    required: true,
                    displayOrder: 5,
                    channels: channels(),
                    fieldType: "boolean",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-DRV-006",
                    label: "Named Additional Drivers",
                    internalName: "named_drivers",
                    type: "repeat",
                    typeLabel: "Repeatable Group",
                    required: false,
                    displayOrder: 6,
                    channels: channels(),
                    helpText: "Add details for all additional named drivers on this policy.",
                    fieldType: "repeat",
                    inputFormat: "Repeatable Group",
                    repeatMin: 0,
                    repeatMax: 5,
                    addLabel: "Add Named Driver",
                    removeLabel: "Remove Driver",
                    displayLabel: "Named Driver {n}",
                    repeatQuestions: [
                        {
                            label: "Full Name",
                            type: "text",
                            required: true
                        },
                        {
                            label: "Date of Birth",
                            type: "date",
                            required: true
                        },
                        {
                            label: "Relationship to Policyholder",
                            type: "select",
                            required: true
                        },
                        {
                            label: "Licence Number",
                            type: "text",
                            required: true
                        }
                    ],
                    validations: [],
                    conditions: [],
                    evidence: []
                }
            ]
        },
        {
            id: "grp-3",
            name: "Policy Details",
            label: "Policy Details",
            questions: [
                {
                    id: "QST-POL-001",
                    label: "Cover Start Date",
                    internalName: "policy_start_date",
                    type: "date",
                    typeLabel: "Date",
                    required: true,
                    displayOrder: 1,
                    channels: channels(),
                    fieldType: "date",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-POL-002",
                    label: "Policy Period",
                    internalName: "policy_period",
                    type: "select",
                    typeLabel: "Single-select",
                    required: true,
                    displayOrder: 2,
                    channels: channels(),
                    fieldType: "select",
                    options: [
                        {
                            value: "12m",
                            label: "12 months"
                        },
                        {
                            value: "6m",
                            label: "6 months"
                        }
                    ],
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-POL-003",
                    label: "Covers Required",
                    internalName: "covers_required",
                    type: "multisel",
                    typeLabel: "Multi-select",
                    required: true,
                    displayOrder: 3,
                    channels: channels(),
                    fieldType: "multisel",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-POL-004",
                    label: "Payment Preference",
                    internalName: "payment_preference",
                    type: "select",
                    typeLabel: "Single-select",
                    required: true,
                    displayOrder: 4,
                    channels: channels(),
                    fieldType: "select",
                    options: [
                        {
                            value: "annual",
                            label: "Annual"
                        },
                        {
                            value: "monthly",
                            label: "Monthly"
                        }
                    ],
                    validations: [],
                    conditions: [],
                    evidence: []
                }
            ]
        }
    ];
}
function slug(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
function truckingQuestion(prefix, index, label, type, required = true) {
    return {
        id: `QST-${prefix}-${String(index).padStart(3, "0")}`,
        label,
        internalName: slug(label),
        type,
        typeLabel: questionTypeLabel(type),
        fieldType: type,
        required,
        displayOrder: index,
        channels: channels(),
        validations: [],
        conditions: [],
        evidence: []
    };
}
function truckingGroup(id, label, prefix, rows, extra) {
    return {
        id,
        name: label,
        label,
        open: false,
        bindPhase: "pre-bind",
        questions: rows.map(([questionLabel, type, required], i)=>truckingQuestion(prefix, i + 1, questionLabel, type, required !== false)),
        ...extra
    };
}
function truckingQuestionGroups() {
    return [
        truckingGroup("grp-ops", "Operations", "OPS", [
            [
                "Business Type",
                "select"
            ],
            [
                "Years in Business",
                "number"
            ],
            [
                "DOT Number",
                "text"
            ],
            [
                "MC Number",
                "text"
            ],
            [
                "Operating Authority",
                "select"
            ],
            [
                "Interstate / Intrastate",
                "select"
            ],
            [
                "Operating Radius",
                "select"
            ],
            [
                "Annual Mileage",
                "number"
            ],
            [
                "Annual Revenue",
                "currency"
            ],
            [
                "States Operated",
                "multisel"
            ],
            [
                "Primary Garaging State",
                "select"
            ],
            [
                "For-Hire / Private Carrier",
                "select"
            ],
            [
                "Common / Contract Carrier",
                "select"
            ],
            [
                "Owner Operator Usage",
                "boolean"
            ],
            [
                "Brokerage Operations",
                "boolean"
            ],
            [
                "Hazmat Operations",
                "boolean"
            ]
        ]),
        truckingGroup("grp-fleet", "Fleet", "FLT", [
            [
                "Fleet Size",
                "number"
            ],
            [
                "Power Units",
                "number"
            ],
            [
                "Trailers",
                "number"
            ],
            [
                "Owned Vehicles",
                "number"
            ],
            [
                "Leased Vehicles",
                "number"
            ],
            [
                "Owner-Operator Vehicles",
                "number"
            ],
            [
                "Average Vehicle Age",
                "number"
            ],
            [
                "Maximum Vehicle Age",
                "number"
            ],
            [
                "Fleet Growth",
                "select"
            ],
            [
                "Vehicle Replacement Program",
                "boolean"
            ]
        ]),
        truckingGroup("grp-vehicle", "Vehicle", "VEH", [
            [
                "VIN",
                "text"
            ],
            [
                "Year",
                "number"
            ],
            [
                "Make",
                "text"
            ],
            [
                "Model",
                "text"
            ],
            [
                "Vehicle Type",
                "select"
            ],
            [
                "Body Type",
                "select"
            ],
            [
                "GVW",
                "number"
            ],
            [
                "Vehicle Value",
                "currency"
            ],
            [
                "Stated Amount",
                "currency"
            ],
            [
                "Ownership Type",
                "select"
            ],
            [
                "Lease Type",
                "select"
            ],
            [
                "Garaging Location",
                "address"
            ],
            [
                "Annual Mileage",
                "number"
            ],
            [
                "Operating Radius",
                "select"
            ],
            [
                "Primary Use",
                "select"
            ],
            [
                "Safety Equipment",
                "multisel"
            ]
        ]),
        truckingGroup("grp-driver", "Driver", "DRV", [
            [
                "Driver Name",
                "text"
            ],
            [
                "Date of Birth",
                "date"
            ],
            [
                "License Number",
                "text"
            ],
            [
                "License State",
                "select"
            ],
            [
                "CDL Class",
                "select"
            ],
            [
                "CDL Status",
                "select"
            ],
            [
                "Years CDL Experience",
                "number"
            ],
            [
                "Years Trucking Experience",
                "number"
            ],
            [
                "Major Violations",
                "number"
            ],
            [
                "Minor Violations",
                "number"
            ],
            [
                "At-Fault Accidents",
                "number"
            ],
            [
                "Suspensions",
                "number"
            ],
            [
                "DUI/DWI",
                "boolean"
            ],
            [
                "MVR Status",
                "select"
            ],
            [
                "Driver Status",
                "select"
            ]
        ]),
        truckingGroup("grp-commodity", "Commodity", "CMD", [
            [
                "General Freight",
                "boolean",
                false
            ],
            [
                "Dry Goods",
                "boolean",
                false
            ],
            [
                "Refrigerated Goods",
                "boolean",
                false
            ],
            [
                "Food Products",
                "boolean",
                false
            ],
            [
                "Building Materials",
                "boolean",
                false
            ],
            [
                "Automobiles",
                "boolean",
                false
            ],
            [
                "Machinery",
                "boolean",
                false
            ],
            [
                "Electronics",
                "boolean",
                false
            ],
            [
                "Household Goods",
                "boolean",
                false
            ],
            [
                "Livestock",
                "boolean",
                false
            ],
            [
                "Hazardous Materials",
                "boolean",
                false
            ],
            [
                "Explosives",
                "boolean",
                false
            ],
            [
                "Fuel",
                "boolean",
                false
            ],
            [
                "Commodity Type",
                "select"
            ],
            [
                "Percentage of Revenue",
                "number"
            ],
            [
                "Maximum Load Value",
                "currency"
            ],
            [
                "Average Load Value",
                "currency"
            ],
            [
                "Hazardous",
                "boolean"
            ],
            [
                "Refrigerated",
                "boolean"
            ]
        ]),
        truckingGroup("grp-safety", "Safety", "SAF", [
            [
                "DOT Safety Rating",
                "select"
            ],
            [
                "SAFER Score",
                "number"
            ],
            [
                "CSA Score",
                "number"
            ],
            [
                "Out-of-Service Rate",
                "number"
            ],
            [
                "Vehicle Inspection Rate",
                "number"
            ],
            [
                "Driver Inspection Rate",
                "number"
            ],
            [
                "ELD Used",
                "boolean"
            ],
            [
                "Telematics Used",
                "boolean"
            ],
            [
                "Dash Cameras",
                "boolean"
            ],
            [
                "Driver Monitoring",
                "boolean"
            ],
            [
                "Safety Program",
                "boolean"
            ],
            [
                "Drug Testing Program",
                "boolean"
            ],
            [
                "Driver Training Program",
                "boolean"
            ],
            [
                "Maintenance Program",
                "boolean"
            ]
        ]),
        truckingGroup("grp-loss", "Loss-history", "LSS", [
            [
                "Loss Period",
                "daterange"
            ],
            [
                "Number of Claims",
                "number"
            ],
            [
                "Paid Losses",
                "currency"
            ],
            [
                "Outstanding Losses",
                "currency"
            ],
            [
                "Incurred Losses",
                "currency"
            ],
            [
                "Loss Ratio",
                "number"
            ],
            [
                "Large Losses",
                "number"
            ],
            [
                "Fatality Claims",
                "number"
            ],
            [
                "Open Claims",
                "number"
            ],
            [
                "Prior Carrier",
                "text"
            ],
            [
                "Prior Premium",
                "currency"
            ],
            [
                "Cancellation History",
                "boolean"
            ],
            [
                "Non-Renewal History",
                "boolean"
            ]
        ]),
        truckingGroup("grp-policy", "Policy Administration", "POL", [
            [
                "Billing Method",
                "select"
            ],
            [
                "Payment Plan",
                "select"
            ],
            [
                "Policy Delivery Preference",
                "select"
            ],
            [
                "Named Insured Contact",
                "text"
            ],
            [
                "Certificate Holder Requirements",
                "textarea"
            ]
        ], {
            bindPhase: "post-bind"
        }),
        truckingGroup("grp-claims", "Claims", "CLM", [
            [
                "Claims Contact Name",
                "text"
            ],
            [
                "Claims Contact Phone",
                "text"
            ],
            [
                "Claims Reporting Method",
                "select"
            ],
            [
                "Average Claim Response Time",
                "number"
            ],
            [
                "Open Claims Count",
                "number"
            ],
            [
                "Claims Made vs Occurrence",
                "select"
            ],
            [
                "Deductible Responsibility",
                "select"
            ],
            [
                "Subrogation Interest",
                "boolean"
            ]
        ], {
            bindPhase: "post-bind"
        }),
        truckingGroup("grp-renewal", "Renewal", "RNW", [
            [
                "Renewal Date",
                "date"
            ],
            [
                "Renewal Notice Period",
                "select"
            ],
            [
                "Auto-Renewal Preference",
                "boolean"
            ],
            [
                "Renewal Pricing Review",
                "boolean"
            ],
            [
                "Mid-Term Change Policy",
                "select"
            ],
            [
                "Non-Renewal Notice",
                "boolean"
            ]
        ], {
            bindPhase: "post-bind"
        })
    ];
}
}),
"[project]/lib/seed.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyTruckDemo",
    ()=>applyTruckDemo,
    "emptyWorkspace",
    ()=>emptyWorkspace,
    "productDetailFrom",
    ()=>productDetailFrom,
    "starterCovers",
    ()=>starterCovers,
    "starterQuestionGroups",
    ()=>starterQuestionGroups
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/format.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/truck-demo.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$questionnaire$2d$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/questionnaire-seed.ts [app-route] (ecmascript)");
;
;
;
const CATALOGUE = [
    {
        id: "PRD-015",
        name: "Commercial Truck Comprehensive",
        family: "Trucking",
        version: "2026.08",
        status: "published",
        owner: "Sunita Pillai",
        effectiveFrom: "01-Aug-2026",
        effectiveTo: "31-Jul-2027"
    },
    {
        id: "PRD-011",
        name: "Commercial Vehicle Fleet",
        family: "Trucking",
        version: "2026.05-DRAFT",
        status: "draft",
        owner: "Anika Sharma"
    }
];
function studios(id) {
    return [
        {
            id: "coverage",
            name: "Coverage Guide",
            href: `/products/${id}/coverage`,
            status: "complete",
            summary: "Configured"
        },
        {
            id: "questionnaire",
            name: "Questionnaire Guide",
            href: `/products/${id}/questionnaire`,
            status: "complete",
            summary: "Configured"
        },
        {
            id: "eligibility",
            name: "Eligibility Guide",
            href: `/products/${id}/eligibility`,
            status: "complete",
            summary: "Configured"
        },
        {
            id: "rating",
            name: "Rating & Pricing Guide",
            href: `/products/${id}/rating`,
            status: "partial",
            summary: "Base rate set"
        },
        {
            id: "underwriting",
            name: "Underwriting Rules Guide",
            href: `/products/${id}/underwriting`,
            status: "partial",
            summary: "Core rules"
        },
        {
            id: "distribution",
            name: "Distribution Guide",
            href: `/products/${id}/distribution`,
            status: "complete",
            summary: "Direct + broker"
        },
        {
            id: "document",
            name: "Document Guide",
            href: `/products/${id}/document`,
            status: "complete",
            summary: "Wording pack"
        }
    ];
}
function productDetailFrom(product) {
    return {
        id: product.id,
        name: product.name,
        family: product.family,
        code: product.code || `${product.family.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${product.id.slice(-3)}`,
        segment: String(product.segment || (product.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"] ? "Commercial Lines" : "Personal Lines")),
        riskType: product.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"] ? "Truck + Driver + Cargo" : "Risk + Policyholder",
        jurisdictions: product.jurisdictions || (product.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"] ? [
            "India",
            "UAE",
            "UK"
        ] : [
            "India"
        ]),
        distribution: product.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"] ? [
            "Commercial Broker Portal",
            "Direct (Web) — Owner Operators",
            "Fleet TMS API"
        ] : [
            "Direct (Web)",
            "Broker Portal"
        ],
        owner: product.owner,
        description: product.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"] ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_DESCRIPTION"] : product.description || `${product.name} configuration.`,
        notes: product.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"] ? "Version 2026.08: Commercial truck demo — 8 covers, HGV eligibility, GVW/radius rating, broker/TMS distribution." : `Version ${product.version}: managed in Veridex Product Guide.`,
        status: product.status,
        activeVersion: product.version,
        versions: [
            {
                label: product.version,
                status: product.status,
                from: product.effectiveFrom,
                to: product.effectiveTo,
                by: product.owner,
                on: product.lastModified,
                gates: product.status === "published" ? 5 : 0,
                sim: product.status === "published" ? "Passed" : "Not Run"
            }
        ],
        studios: studios(product.id),
        governance: [
            "Product Owner",
            "Actuarial",
            "Underwriting",
            "Compliance",
            "Ops/Tech"
        ].map((gate)=>({
                gate,
                approver: product.status === "published" ? product.owner : "—",
                action: product.status === "published" ? "Approved" : "Pending",
                date: product.status === "published" ? product.lastModified : "—",
                comment: product.status === "published" ? "Approved in seeded workspace." : "—"
            })),
        checklist: studios(product.id).map((s)=>({
                studio: s.name,
                status: s.status === "complete" ? "done" : s.status === "partial" ? "warn" : "empty",
                note: s.summary
            })),
        completion: product.status === "published" ? 100 : product.status === "draft" ? 35 : 70,
        lastSim: null
    };
}
function col(id, version, name) {
    return `${id}::${version}::${name}`;
}
function motorCovers() {
    return [
        {
            id: "COV-AL",
            name: "Auto Liability",
            code: "COV-AL",
            availability: "mandatory",
            complete: true,
            type: "Commercial Auto Liability",
            description: "Third-party bodily injury and property damage for commercial auto use.",
            basisOfCoverage: "Limit of Indemnity",
            sumInsured: "1000000",
            deductibleType: "none",
            deductibleAmount: "0",
            defaultSelected: true
        },
        {
            id: "COV-UIM",
            name: "Uninsured / Underinsured Motorist",
            code: "COV-UIM",
            availability: "default",
            complete: true,
            type: "Third Party Liability",
            description: "Protection when the other driver lacks adequate insurance.",
            basisOfCoverage: "Limit of Indemnity",
            sumInsured: "1000000",
            deductibleType: "none",
            deductibleAmount: "0",
            defaultSelected: true
        },
        {
            id: "COV-MP",
            name: "Medical Payments / PIP",
            code: "COV-MP",
            availability: "default",
            complete: true,
            type: "Benefit — Personal Accident",
            description: "Medical expenses and personal injury protection for occupants.",
            basisOfCoverage: "Agreed Value",
            sumInsured: "25000",
            deductibleType: "none",
            deductibleAmount: "0",
            defaultSelected: true
        },
        {
            id: "COV-MTC",
            name: "Motor Truck Cargo",
            code: "COV-MTC",
            availability: "default",
            complete: true,
            type: "First Party — Cargo",
            description: "Loss or damage to lawful cargo while in transit.",
            basisOfCoverage: "Declared Value",
            sumInsured: "250000",
            deductibleType: "none",
            deductibleAmount: "0",
            defaultSelected: true
        },
        {
            id: "COV-TI",
            name: "Trailer Interchange",
            code: "COV-TI",
            availability: "optional",
            complete: true,
            type: "First Party — Property Damage",
            description: "Damage to non-owned trailers under interchange agreements.",
            basisOfCoverage: "Stated Amount",
            sumInsured: "80000",
            deductibleType: "none",
            deductibleAmount: "0",
            defaultSelected: true
        },
        {
            id: "COV-NTL",
            name: "Non-Trucking Liability",
            code: "COV-NTL",
            availability: "addon",
            complete: true,
            type: "Commercial Auto Liability",
            description: "Liability when operating without a trailer, not under dispatch.",
            basisOfCoverage: "Limit of Indemnity",
            sumInsured: "1000000",
            deductibleType: "none",
            deductibleAmount: "0",
            defaultSelected: false
        },
        {
            id: "COV-PD",
            name: "Physical Damage",
            code: "COV-PD",
            availability: "mandatory",
            complete: true,
            type: "First Party — Property Damage",
            description: "Collision and comprehensive damage to insured vehicles.",
            basisOfCoverage: "Stated Amount",
            sumInsured: "180000",
            deductibleType: "fixed",
            deductibleAmount: "1000",
            defaultSelected: true
        }
    ];
}
function starterQuestionGroups(family) {
    if (family === "Trucking" || family === "Motor" || family === "Commercial Auto") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$questionnaire$2d$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["truckingQuestionGroups"])();
    return [
        {
            id: "GRP-001",
            name: "Risk details",
            label: "Risk details",
            questions: [
                {
                    id: "Q-001",
                    label: "Full name",
                    type: "text",
                    typeLabel: "Text",
                    fieldType: "text",
                    required: true,
                    internalName: "full_name",
                    displayOrder: 1,
                    channels: "Web, Mobile, Agent, API",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "Q-002",
                    label: "Age",
                    type: "number",
                    typeLabel: "Number",
                    fieldType: "number",
                    required: true,
                    internalName: "age",
                    displayOrder: 2,
                    channels: "Web, Mobile, Agent, API",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "Q-003",
                    label: "Sum insured",
                    type: "currency",
                    typeLabel: "Currency",
                    fieldType: "currency",
                    required: true,
                    internalName: "sum_insured",
                    displayOrder: 3,
                    channels: "Web, Mobile, Agent, API",
                    validations: [],
                    conditions: [],
                    evidence: []
                }
            ]
        }
    ];
}
function starterCovers(family) {
    const familyDefaults = {
        Trucking: motorCovers(),
        Motor: motorCovers(),
        "Commercial Auto": motorCovers(),
        Cyber: [
            {
                id: "COV-CYB-001",
                name: "Network Security Liability",
                code: "COV-NSL-001",
                availability: "mandatory",
                complete: true,
                type: "Third Party Liability",
                description: "Failure to prevent unauthorised access or malware.",
                basisOfCoverage: "Limit of Indemnity",
                sumInsured: "1000000",
                deductibleType: "fixed",
                deductibleAmount: "10000",
                defaultSelected: true
            }
        ],
        "Cyber Liability": [
            {
                id: "COV-CYB-001",
                name: "Cyber Liability",
                code: "COV-CYB-001",
                availability: "mandatory",
                complete: true,
                type: "Third Party Liability",
                description: "Failure to prevent unauthorised access or malware.",
                basisOfCoverage: "Limit of Indemnity",
                sumInsured: "1000000",
                deductibleType: "fixed",
                deductibleAmount: "10000",
                defaultSelected: true
            }
        ]
    };
    return familyDefaults[family] || familyDefaults["Commercial Auto"];
}
function defaultCollections(product) {
    const k = (name)=>col(product.id, product.version, name);
    const familyDefaults = {
        Trucking: motorCovers(),
        Motor: motorCovers(),
        Cyber: [
            {
                id: "COV-CYB-001",
                name: "Network Security Liability",
                availability: "mandatory",
                description: "Unauthorized access and malware liability.",
                sumInsured: "1000000",
                defaultSelected: true
            }
        ]
    };
    return {
        [k("covers")]: familyDefaults[product.family] || familyDefaults.Trucking,
        [k("questionGroups")]: product.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$questionnaire$2d$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["truckingQuestionGroups"])() : [
            {
                id: "GRP-001",
                name: "Risk details",
                label: "Risk details",
                questions: [
                    {
                        id: "Q-001",
                        label: "Full name",
                        type: "text",
                        typeLabel: "Text",
                        fieldType: "text",
                        required: true,
                        internalName: "full_name",
                        displayOrder: 1,
                        channels: "Web, Mobile, Agent, API",
                        validations: [],
                        conditions: [],
                        evidence: []
                    },
                    {
                        id: "Q-002",
                        label: "Age",
                        type: "number",
                        typeLabel: "Number",
                        fieldType: "number",
                        required: true,
                        internalName: "age",
                        displayOrder: 2,
                        channels: "Web, Mobile, Agent, API",
                        validations: [],
                        conditions: [],
                        evidence: []
                    },
                    {
                        id: "Q-003",
                        label: "Sum insured",
                        type: "currency",
                        typeLabel: "Currency",
                        fieldType: "currency",
                        required: true,
                        internalName: "sum_insured",
                        displayOrder: 3,
                        channels: "Web, Mobile, Agent, API",
                        validations: [],
                        conditions: [],
                        evidence: []
                    }
                ]
            }
        ],
        [k("eligibilityRules")]: [
            {
                id: "ELG-001",
                name: "Minimum age",
                field: "driver_age",
                operator: "<",
                value: "18",
                outcome: "ineligible",
                category: "Product Eligibility",
                cover: "All Covers",
                priority: 10,
                status: "active",
                description: "Policyholder must be at least 18.",
                conditions: [
                    {
                        field: "driver_age",
                        op: "<",
                        value: "18"
                    }
                ],
                reasonCode: "ELIG-MIN-AGE",
                effectiveFrom: "01-Apr-2026",
                effectiveTo: "30-Sep-2026"
            },
            {
                id: "ELG-002",
                name: "Maximum age",
                field: "driver_age",
                operator: ">",
                value: "70",
                outcome: "refer",
                category: "Product Eligibility",
                cover: "All Covers",
                priority: 20,
                status: "active",
                description: "Drivers over 70 are referred.",
                conditions: [
                    {
                        field: "driver_age",
                        op: ">",
                        value: "70"
                    }
                ],
                reasonCode: "ELIG-MAX-AGE",
                effectiveFrom: "01-Apr-2026",
                effectiveTo: "30-Sep-2026"
            }
        ],
        [k("ratingComponents")]: [
            {
                id: "RATE-001",
                name: "Base premium",
                type: "base",
                amount: product.family === "Trucking" || product.family === "Motor" ? 350 : 2400,
                unit: "per year"
            },
            {
                id: "RATE-002",
                name: "Age factor",
                type: "factor",
                field: "Age",
                amount: 1
            }
        ],
        [k("underwritingRules")]: [
            {
                id: "UW-001",
                name: "High sum insured refer",
                field: "sum_insured",
                operator: ">",
                value: "100000",
                outcome: "refer",
                conditions: [
                    {
                        field: "sum_insured",
                        op: ">",
                        value: "100000"
                    }
                ]
            }
        ],
        [k("channels")]: [
            {
                id: "CHAN-001",
                name: "Direct (Web)",
                accessModel: "Open Access",
                status: "active"
            },
            {
                id: "CHAN-002",
                name: "Broker Portal",
                accessModel: "Restricted",
                status: "active"
            }
        ],
        [k("documents")]: [
            {
                id: "DOC-001",
                name: "Policy Wording",
                type: "wording",
                version: product.version
            },
            {
                id: "DOC-002",
                name: "Certificate of Insurance",
                type: "certificate",
                version: product.version
            }
        ],
        [k("testCases")]: [
            {
                id: "TEST-001",
                name: "Standard quote",
                expected: "accept",
                premium: 350,
                result: "not-run"
            }
        ]
    };
}
function applyTruckDemo(workspace) {
    const product = workspace.products.find((p)=>p.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"]);
    if (product) {
        product.description = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_DESCRIPTION"];
        product.segment = "Commercial Lines";
        product.name = "Commercial Truck Comprehensive";
        product.family = "Trucking";
        const others = workspace.products.filter((p)=>p.id !== __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"]);
        workspace.products = [
            product,
            ...others
        ];
    }
    const seedRev = Number(workspace.settings?.truckSeed || 0);
    const TRUCK_SEED_REV = 6;
    if (seedRev < TRUCK_SEED_REV) {
        Object.assign(workspace.collections, (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["truckCollections"])());
        workspace.settings = {
            ...workspace.settings,
            truckSeed: TRUCK_SEED_REV
        };
    }
    const carSeed = Number(workspace.settings?.carSeed || 0);
    if (carSeed < 1) {
        const truck = workspace.products.find((p)=>p.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"]);
        if (truck) {
            workspace.collections[col(truck.id, truck.version, "questionGroups")] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$questionnaire$2d$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["truckingQuestionGroups"])();
        }
        workspace.settings = {
            ...workspace.settings,
            carSeed: 1
        };
    }
    const detail = workspace.details[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"]];
    if (detail) {
        Object.assign(detail, {
            name: "Commercial Truck Comprehensive",
            segment: "Commercial Lines",
            riskType: "Truck + Driver + Cargo",
            description: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_DESCRIPTION"],
            notes: "Version 2026.08: Commercial truck demo — 8 covers, HGV eligibility, GVW/radius rating.",
            jurisdictions: [
                "India",
                "UAE",
                "UK"
            ],
            distribution: [
                "Commercial Broker Portal",
                "Direct (Web) — Owner Operators",
                "Fleet TMS API"
            ]
        });
    } else if (product) {
        workspace.details[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"]] = productDetailFrom(product);
    }
    return workspace;
}
function emptyWorkspace(ownerName) {
    const products = CATALOGUE.map((row)=>({
            ...row,
            effectiveFrom: row.effectiveFrom ?? null,
            effectiveTo: row.effectiveTo ?? null,
            lastModified: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["displayDate"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["todayIso"])()) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["todayIso"])(),
            lastModifiedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nowIso"])(),
            lastModifiedBy: row.owner,
            description: row.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"] ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_DESCRIPTION"] : `${row.name} — seeded into your workspace. Edit or delete any field.`,
            pending: row.status === "draft" || row.status === "review"
        }));
    const details = {};
    const collections = {};
    for (const product of products){
        details[product.id] = productDetailFrom(product);
        Object.assign(collections, defaultCollections(product));
        if (product.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRUCK_ID"]) Object.assign(collections, (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["truckCollections"])());
    }
    return {
        products,
        details,
        collections,
        audit: [
            {
                id: "EVT-seed",
                at: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nowIso"])(),
                user: ownerName,
                role: "Product Manager",
                action: "SEEDED",
                page: "workspace",
                description: "Workspace created with Commercial Truck Comprehensive as the featured demo."
            }
        ],
        notifications: [
            {
                id: "NTF-welcome",
                title: "Commercial truck demo is live",
                detail: "Open Coverage Guide and Questionnaire (risk) on Commercial Truck Comprehensive — 8 covers, GVW, HGV licence, cargo class.",
                href: "/products/PRD-015/coverage",
                read: false,
                at: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nowIso"])()
            }
        ],
        team: [
            {
                id: "U001",
                name: ownerName,
                email: "",
                role: "Product Manager",
                status: "ACTIVE",
                products: products.map((p)=>p.id)
            },
            {
                id: "U002",
                name: "Rajan Mehta",
                email: "rajan@veridex.local",
                role: "Pricing Actuary",
                status: "ACTIVE",
                products: [
                    "PRD-015",
                    "PRD-020"
                ]
            },
            {
                id: "U003",
                name: "Sunita Pillai",
                email: "sunita@veridex.local",
                role: "Underwriting Manager",
                status: "ACTIVE",
                products: [
                    "PRD-015"
                ]
            }
        ],
        pricing: [
            {
                id: "TPL-001",
                name: "Commercial truck · Comprehensive",
                family: "Trucking",
                base: 1850,
                unit: "per year",
                status: "active"
            },
            {
                id: "TPL-002",
                name: "Cyber liability · SME",
                family: "Cyber",
                base: 2400,
                unit: "per year",
                status: "active"
            }
        ],
        glossary: [
            {
                id: "GLS-001",
                term: "Effective From",
                definition: "The first date the version may be sold.",
                category: "Lifecycle"
            },
            {
                id: "GLS-002",
                term: "Deductible",
                definition: "Amount the insured pays before the insurer pays a claim.",
                category: "Coverage"
            },
            {
                id: "GLS-003",
                term: "Refer",
                definition: "Underwriting outcome that requires a human decision.",
                category: "Underwriting"
            }
        ],
        quotes: [],
        webhooks: [
            {
                id: "WH-001",
                name: "Quote issued",
                url: "https://hooks.example.com/quote",
                events: "quote.created",
                status: "active"
            }
        ],
        settings: {
            orgName: "Veridex",
            timezone: "Asia/Kolkata",
            truckSeed: 4
        }
    };
}
}),
"[project]/lib/session.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GUEST_USER",
    ()=>GUEST_USER,
    "clearSession",
    ()=>clearSession,
    "getSession",
    ()=>getSession,
    "hasSessionCookie",
    ()=>hasSessionCookie,
    "hashPassword",
    ()=>hashPassword,
    "patchSession",
    ()=>patchSession,
    "setSession",
    ()=>setSession,
    "verifyPassword",
    ()=>verifyPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
const COOKIE = "ps_session";
const SECRET = process.env.SESSION_SECRET || "veridex-product-studio-dev-secret-change-me";
const GUEST_USER = {
    userId: "USR-LOCAL",
    email: "studio@veridex.local",
    name: "Anika Sharma",
    role: "Product Manager",
    productId: "PRD-015",
    version: "2026.08"
};
function sign(payload) {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHmac"])("sha256", SECRET).update(payload).digest("base64url");
}
function encode(user) {
    const payload = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
    return `${payload}.${sign(payload)}`;
}
function decode(token) {
    if (!token) return null;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !(0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["timingSafeEqual"])(a, b)) return null;
    try {
        return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch  {
        return null;
    }
}
function hashPassword(password) {
    const salt = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomBytes"])(16).toString("hex");
    const hash = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["scryptSync"])(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const next = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["scryptSync"])(password, salt, 64).toString("hex");
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(next, "hex");
    return a.length === b.length && (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["timingSafeEqual"])(a, b);
}
async function getSession() {
    const jar = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    return decode(jar.get(COOKIE)?.value) || {
        ...GUEST_USER
    };
}
async function setSession(user) {
    const jar = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    jar.set(COOKIE, encode(user), {
        httpOnly: true,
        sameSite: "lax",
        secure: ("TURBOPACK compile-time value", "development") === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30
    });
}
async function clearSession() {
    const jar = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    jar.delete(COOKIE);
}
async function patchSession(patch) {
    const current = await getSession();
    const next = {
        ...current,
        ...patch
    };
    await setSession(next);
    return next;
}
function hasSessionCookie(value) {
    return Boolean(decode(value));
}
}),
"[project]/lib/store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clone",
    ()=>clone,
    "collectionKey",
    ()=>collectionKey,
    "findUserByEmail",
    ()=>findUserByEmail,
    "getCollection",
    ()=>getCollection,
    "listUsers",
    ()=>listUsers,
    "loadWorkspace",
    ()=>loadWorkspace,
    "mutateWorkspace",
    ()=>mutateWorkspace,
    "saveUsers",
    ()=>saveUsers,
    "saveWorkspace",
    ()=>saveWorkspace,
    "setCollection",
    ()=>setCollection,
    "workspacePath",
    ()=>workspacePath
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/seed.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/format.ts [app-route] (ecmascript)");
;
;
;
;
const ROOT = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(process.cwd(), "data");
const USERS = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(ROOT, "users.json");
const WORKSPACES = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(ROOT, "workspaces");
function ensureDirs() {
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["mkdirSync"])(WORKSPACES, {
        recursive: true
    });
}
function readJson(path, fallback) {
    try {
        return JSON.parse((0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["readFileSync"])(path, "utf8"));
    } catch  {
        return fallback;
    }
}
function writeJson(path, value) {
    ensureDirs();
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["writeFileSync"])(path, JSON.stringify(value, null, 2), "utf8");
}
function listUsers() {
    ensureDirs();
    return readJson(USERS, {
        users: []
    }).users;
}
function saveUsers(users) {
    writeJson(USERS, {
        users
    });
}
function findUserByEmail(email) {
    return listUsers().find((u)=>u.email.toLowerCase() === email.toLowerCase()) || null;
}
function workspacePath(userId) {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(WORKSPACES, `${userId}.json`);
}
function loadWorkspace(user) {
    ensureDirs();
    const path = workspacePath(user.userId);
    let workspace;
    if (!(0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["existsSync"])(path)) {
        workspace = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyWorkspace"])(user.name);
    } else {
        workspace = readJson(path, (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyWorkspace"])(user.name));
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyTruckDemo"])(workspace);
    writeJson(path, workspace);
    return workspace;
}
function saveWorkspace(user, workspace) {
    writeJson(workspacePath(user.userId), workspace);
}
function mutateWorkspace(user, mutator, audit) {
    const workspace = loadWorkspace(user);
    mutator(workspace);
    if (audit) {
        workspace.audit.unshift({
            id: `EVT-${Date.now()}`,
            at: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$format$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nowIso"])(),
            user: user.name,
            role: user.role,
            ...audit
        });
    }
    saveWorkspace(user, workspace);
    return workspace;
}
function collectionKey(productId, version, name) {
    return `${productId}::${version}::${name}`;
}
function getCollection(workspace, productId, version, name) {
    const exact = workspace.collections[collectionKey(productId, version, name)];
    if (Array.isArray(exact)) return exact;
    const fallback = Object.keys(workspace.collections).find((k)=>k.startsWith(`${productId}::`) && k.endsWith(`::${name}`));
    if (fallback && Array.isArray(workspace.collections[fallback])) return workspace.collections[fallback];
    return [];
}
function setCollection(workspace, productId, version, name, items) {
    workspace.collections[collectionKey(productId, version, name)] = items;
}
function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
}),
"[project]/lib/truck-demo.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TRUCK_DESCRIPTION",
    ()=>TRUCK_DESCRIPTION,
    "TRUCK_ID",
    ()=>TRUCK_ID,
    "TRUCK_VERSION",
    ()=>TRUCK_VERSION,
    "truckChannels",
    ()=>truckChannels,
    "truckCollections",
    ()=>truckCollections,
    "truckCovers",
    ()=>truckCovers,
    "truckDocuments",
    ()=>truckDocuments,
    "truckEligibility",
    ()=>truckEligibility,
    "truckQuestionGroups",
    ()=>truckQuestionGroups,
    "truckRating",
    ()=>truckRating,
    "truckTests",
    ()=>truckTests,
    "truckUnderwriting",
    ()=>truckUnderwriting
]);
const TRUCK_ID = "PRD-015";
const TRUCK_VERSION = "2026.08";
function truckCovers() {
    return [
        {
            id: "COV-CT-001",
            name: "Own Damage — Truck & Chassis",
            code: "COV-OD-CT-001",
            availability: "mandatory",
            complete: true,
            type: "First Party — Property Damage",
            description: "Covers accidental damage, fire, explosion, and natural peril loss to the insured truck, chassis, and permanently fitted equipment.",
            basisOfCoverage: "Agreed Value",
            sumInsured: "180000",
            maxSingleLimit: "180000",
            subLimit: "",
            deductibleType: "percentage",
            deductibleAmount: "",
            deductiblePct: "2.5",
            minDeductible: "1000",
            maxDeductible: "8000",
            copay: "0",
            waitingPeriod: "None",
            annualAggregate: false,
            defaultSelected: true,
            mutualExclusions: "",
            coverVersion: "2026.08",
            conditionalOn: "",
            requiresCover: "",
            dependencies: [
                {
                    type: "Bundles with",
                    dependsOn: "Third Party Liability",
                    condition: "Always"
                }
            ],
            constraints: [
                {
                    field: "Gross Vehicle Weight",
                    operator: "≤",
                    value: "49 tonnes"
                },
                {
                    field: "Vehicle Age",
                    operator: "≤",
                    value: "20 years"
                },
                {
                    field: "Body Type",
                    operator: "is one of",
                    value: "Rigid, Tractor Unit, Tipper, Tanker, Box, Flatbed"
                }
            ],
            lossBasis: "Per Occurrence",
            reinstatement: "Automatic (full limit)",
            benefitBasis: "Indemnity",
            claimsNotifPeriod: "24",
            claimsNotifUnit: "hours",
            wordingDoc: "Own Damage Clause — Standard",
            wordingDocs: [
                {
                    name: "Own Damage Clause — Standard",
                    version: "v2026.04",
                    code: "DOC-OD-CL-001"
                },
                {
                    name: "General Exclusions Endorsement",
                    version: "v2026.01",
                    code: "DOC-GEN-EX-001"
                }
            ]
        },
        {
            id: "COV-CT-002",
            name: "Third Party Liability",
            code: "COV-TP-CT-001",
            availability: "mandatory",
            complete: true,
            type: "Third Party Liability",
            description: "Statutory and excess third-party liability for death, bodily injury, and property damage arising from commercial truck use.",
            basisOfCoverage: "Limit of Indemnity",
            sumInsured: "1000000",
            maxSingleLimit: "1000000",
            subLimit: "5000000",
            deductibleType: "fixed",
            deductibleAmount: "2500",
            deductiblePct: "",
            coverVersion: "2026.08",
            defaultSelected: true,
            dependencies: [],
            constraints: [
                {
                    field: "Vehicle Registration",
                    operator: "is",
                    value: "Active CMV / HGV"
                },
                {
                    field: "Operator Licence",
                    operator: "is",
                    value: "Valid"
                }
            ],
            wordingDocs: [
                {
                    name: "Commercial Motor TPL Clause",
                    version: "v2026.08",
                    code: "DOC-TP-CT-001"
                }
            ]
        },
        {
            id: "COV-CT-003",
            name: "Driver & Cleaner Personal Accident",
            code: "COV-PA-CT-001",
            availability: "mandatory",
            complete: true,
            type: "Benefit — Personal Accident",
            description: "Fixed benefit for accidental death or permanent disability of the named driver and cleaner while on duty.",
            basisOfCoverage: "Agreed Value",
            sumInsured: "50000",
            deductibleType: "none",
            deductibleAmount: "0",
            coverVersion: "2026.08",
            maxSingleLimit: "50000",
            defaultSelected: true,
            dependencies: [],
            constraints: [
                {
                    field: "Driver Licence Class",
                    operator: "in",
                    value: "HGV, CMV, Class 4/5"
                },
                {
                    field: "Named Driver Age",
                    operator: "≥",
                    value: "25 years"
                }
            ],
            wordingDocs: [
                {
                    name: "Commercial PA Schedule",
                    version: "v2026.08",
                    code: "DOC-PA-CT-001"
                }
            ]
        },
        {
            id: "COV-CT-004",
            name: "Goods in Transit",
            code: "COV-GIT-001",
            availability: "default",
            complete: true,
            type: "First Party — Cargo",
            description: "Covers loss or damage to lawful cargo carried on the insured truck, including loading and unloading at declared locations.",
            basisOfCoverage: "Declared Value",
            sumInsured: "250000",
            deductibleType: "percentage",
            deductiblePct: "1",
            coverVersion: "2026.08",
            maxSingleLimit: "250000",
            defaultSelected: true,
            conditionalOn: "Own Damage — Truck & Chassis",
            requiresCover: "Own Damage — Truck & Chassis",
            dependencies: [
                {
                    type: "Requires",
                    dependsOn: "Own Damage — Truck & Chassis",
                    condition: "Always"
                }
            ],
            constraints: [
                {
                    field: "Goods Class",
                    operator: "not in",
                    value: "Class 1 explosives, radioactive"
                },
                {
                    field: "Radius of Operation",
                    operator: "≤",
                    value: "1,500 km"
                }
            ],
            wordingDocs: [
                {
                    name: "Goods in Transit Clause",
                    version: "v2026.08",
                    code: "DOC-GIT-001"
                }
            ]
        },
        {
            id: "COV-CT-005",
            name: "Trailer & Semi-Trailer",
            code: "COV-TRL-001",
            availability: "optional",
            complete: true,
            type: "First Party — Property Damage",
            description: "Extends own-damage and theft cover to declared trailers and semi-trailers attached to the insured tractor unit.",
            basisOfCoverage: "Agreed Value",
            sumInsured: "80000",
            deductibleType: "fixed",
            deductibleAmount: "1500",
            coverVersion: "2026.08",
            maxSingleLimit: "80000",
            defaultSelected: false,
            conditionalOn: "Own Damage — Truck & Chassis",
            dependencies: [
                {
                    type: "Requires",
                    dependsOn: "Own Damage — Truck & Chassis",
                    condition: "Body type is Tractor Unit"
                }
            ],
            constraints: [
                {
                    field: "Trailer Count",
                    operator: "≤",
                    value: "2"
                }
            ],
            wordingDocs: [
                {
                    name: "Trailer Extension Endorsement",
                    version: "v2026.08",
                    code: "DOC-TRL-001"
                }
            ]
        },
        {
            id: "COV-CT-006",
            name: "Theft & Hijack",
            code: "COV-TH-CT-001",
            availability: "default",
            complete: true,
            type: "First Party — Crime",
            description: "Covers theft of the truck, trailer, or cargo following forcible entry, hijack, or armed robbery while in transit.",
            basisOfCoverage: "Agreed Value",
            sumInsured: "180000",
            deductibleType: "percentage",
            deductiblePct: "10",
            coverVersion: "2026.08",
            maxSingleLimit: "180000",
            defaultSelected: true,
            conditionalOn: "Own Damage — Truck & Chassis",
            dependencies: [
                {
                    type: "Requires",
                    dependsOn: "Own Damage — Truck & Chassis",
                    condition: "Always"
                }
            ],
            constraints: [
                {
                    field: "Tracking Device",
                    operator: "is",
                    value: "Fitted and active"
                }
            ],
            wordingDocs: [
                {
                    name: "Theft & Hijack Clause",
                    version: "v2026.08",
                    code: "DOC-TH-CT-001"
                }
            ]
        },
        {
            id: "COV-CT-007",
            name: "Breakdown & Recovery",
            code: "COV-RSA-CT-001",
            availability: "addon",
            complete: true,
            type: "Service Benefit",
            description: "24/7 commercial recovery, towing to nearest authorised workshop, and roadside mechanical assistance. Up to 6 call-outs per year.",
            basisOfCoverage: "Service Limit",
            sumInsured: "Service",
            deductibleType: "none",
            deductibleAmount: "0",
            coverVersion: "2026.08",
            maxSingleLimit: "Service",
            defaultSelected: false,
            conditionalOn: "Own Damage — Truck & Chassis",
            dependencies: [
                {
                    type: "Requires",
                    dependsOn: "Own Damage — Truck & Chassis",
                    condition: "Vehicle age ≤ 15 years"
                }
            ],
            constraints: [
                {
                    field: "Vehicle Age",
                    operator: "≤",
                    value: "15 years"
                }
            ],
            wordingDocs: [
                {
                    name: "Commercial Recovery Terms",
                    version: "v2026.08",
                    code: "DOC-RSA-CT-001"
                }
            ]
        },
        {
            id: "COV-CT-008",
            name: "Loading, Unloading & Overturning",
            code: "COV-LU-001",
            availability: "addon",
            complete: true,
            type: "First Party — Working Risk",
            description: "Covers damage to the truck, trailer, or cargo caused by loading, unloading, tipping, or overturning during commercial operations.",
            basisOfCoverage: "Agreed Value",
            sumInsured: "180000",
            deductibleType: "fixed",
            deductibleAmount: "3000",
            coverVersion: "2026.08",
            maxSingleLimit: "180000",
            defaultSelected: false,
            conditionalOn: "Own Damage — Truck & Chassis",
            dependencies: [
                {
                    type: "Requires",
                    dependsOn: "Own Damage — Truck & Chassis",
                    condition: "Always"
                }
            ],
            constraints: [
                {
                    field: "Body Type",
                    operator: "in",
                    value: "Tipper, Tanker, Mixer"
                }
            ],
            wordingDocs: [
                {
                    name: "Loading & Overturning Endorsement",
                    version: "v2026.08",
                    code: "DOC-LU-001"
                }
            ]
        }
    ];
}
function truckQuestionGroups() {
    const ch = "Web, Mobile, Agent, API";
    return [
        {
            id: "grp-1",
            name: "Truck Details",
            label: "Truck Details",
            questions: [
                {
                    id: "QST-CT-001",
                    label: "Make & Model",
                    internalName: "vehicle_make_model",
                    type: "entity",
                    typeLabel: "Entity Lookup",
                    required: true,
                    displayOrder: 1,
                    helpText: "Manufacturer and model of the truck, e.g. Tata Prima 4928.S",
                    channels: ch,
                    example: "Tata Prima 4928.S",
                    fieldType: "entity",
                    inputFormat: "Entity lookup",
                    validations: [
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "Make and model is required."
                        }
                    ],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-002",
                    label: "Year of Manufacture",
                    internalName: "vehicle_year_of_manufacture",
                    type: "number",
                    typeLabel: "Number",
                    required: true,
                    displayOrder: 2,
                    helpText: "The year the vehicle was manufactured, as shown on the registration document. Used against the 20-year commercial cap.",
                    channels: ch,
                    fieldType: "number",
                    inputFormat: "4-digit year (YYYY)",
                    min: "2005",
                    max: "[Current Year]",
                    step: "1",
                    placeholder: "e.g., 2019",
                    validations: [
                        {
                            rule: "Min Value",
                            expr: "2005",
                            msg: "Vehicle must be manufactured in 2005 or later."
                        },
                        {
                            rule: "Max Value",
                            expr: "Current Year",
                            msg: "Year of manufacture cannot be in the future."
                        },
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "This field is required."
                        }
                    ],
                    conditions: [],
                    derived: {
                        attr: "vehicle_age",
                        formula: 'FLOOR(DATEDIFF(TODAY(), vehicle_year_of_manufacture, "years"))',
                        dataType: "Number",
                        usedIn: "Rating factors (vehicle age band), Eligibility rules (max 20 years)"
                    },
                    evidence: []
                },
                {
                    id: "QST-CT-003",
                    label: "Gross Vehicle Weight (tonnes)",
                    internalName: "gvw_tonnes",
                    type: "number",
                    typeLabel: "Number",
                    required: true,
                    displayOrder: 3,
                    helpText: "Must be 49 tonnes or less for this product.",
                    channels: ch,
                    example: "16",
                    min: "1",
                    max: "49",
                    fieldType: "number",
                    validations: [
                        {
                            rule: "Max Value",
                            expr: "49",
                            msg: "GVW must not exceed 49 tonnes."
                        }
                    ],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-004",
                    label: "Body Type",
                    internalName: "body_type",
                    type: "select",
                    typeLabel: "Single-select",
                    required: true,
                    displayOrder: 4,
                    helpText: "Tankers and tippers may refer to operations underwriting.",
                    channels: ch,
                    fieldType: "select",
                    options: [
                        {
                            value: "Rigid",
                            label: "Rigid"
                        },
                        {
                            value: "Tractor Unit",
                            label: "Tractor Unit"
                        },
                        {
                            value: "Tipper",
                            label: "Tipper"
                        },
                        {
                            value: "Tanker",
                            label: "Tanker"
                        },
                        {
                            value: "Box",
                            label: "Box"
                        },
                        {
                            value: "Flatbed",
                            label: "Flatbed"
                        }
                    ],
                    validations: [
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "Select a body type."
                        }
                    ],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-005",
                    label: "Insured Value",
                    internalName: "vehicle_insured_value",
                    type: "currency",
                    typeLabel: "Currency",
                    required: true,
                    displayOrder: 5,
                    helpText: "Agreed value of the truck and chassis.",
                    channels: ch,
                    example: "180000",
                    fieldType: "currency",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-006",
                    label: "Axle Count",
                    internalName: "axle_count",
                    type: "number",
                    typeLabel: "Number",
                    required: true,
                    displayOrder: 6,
                    channels: ch,
                    fieldType: "number",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-007",
                    label: "Tracking Device Fitted?",
                    internalName: "tracking_fitted",
                    type: "boolean",
                    typeLabel: "Boolean",
                    required: true,
                    displayOrder: 7,
                    helpText: "Required for full Theft & Hijack and GIT limits.",
                    channels: ch,
                    fieldType: "boolean",
                    inputFormat: "Yes / No toggle",
                    evidence: [
                        {
                            condition: "tracking_fitted = No",
                            type: "Tracker Certificate",
                            message: "Upload tracker fitment certificate to restore full GIT and theft limits."
                        }
                    ],
                    validations: [
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "Confirm whether a tracker is fitted."
                        }
                    ],
                    conditions: []
                }
            ]
        },
        {
            id: "grp-2",
            name: "Operator & Driver",
            label: "Operator & Driver",
            questions: [
                {
                    id: "QST-CT-008",
                    label: "Operator / Registered Owner",
                    internalName: "operator_name",
                    type: "text",
                    typeLabel: "Text",
                    required: true,
                    displayOrder: 1,
                    example: "Singh Logistics Pvt Ltd",
                    channels: ch,
                    fieldType: "text",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-009",
                    label: "Primary Driver — Full Name",
                    internalName: "driver_full_name",
                    type: "text",
                    typeLabel: "Text",
                    required: true,
                    displayOrder: 2,
                    channels: ch,
                    fieldType: "text",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-010",
                    label: "Primary Driver — Date of Birth",
                    internalName: "driver_date_of_birth",
                    type: "date",
                    typeLabel: "Date",
                    required: true,
                    displayOrder: 3,
                    helpText: "Enter the primary driver's date of birth as shown on their identity document. Driver must be 25 or older at cover start.",
                    channels: ch,
                    fieldType: "date",
                    inputFormat: "DD-MM-YYYY",
                    derived: {
                        attr: "driver_age",
                        formula: 'FLOOR(DATEDIFF(TODAY(), driver_date_of_birth, "years"))',
                        dataType: "Number",
                        usedIn: "Rating factors (driver age band), Eligibility rules (minimum age 25)"
                    },
                    evidence: [
                        {
                            condition: "always",
                            type: "HGV licence scan",
                            message: "Upload a scan of the heavy-vehicle licence with date of birth."
                        }
                    ],
                    validations: [
                        {
                            rule: "Required",
                            expr: "true",
                            msg: "Date of birth is required."
                        }
                    ],
                    conditions: []
                },
                {
                    id: "QST-CT-011",
                    label: "HGV / CMV Licence Class",
                    internalName: "licence_class",
                    type: "select",
                    typeLabel: "Single-select",
                    required: true,
                    displayOrder: 4,
                    channels: ch,
                    fieldType: "select",
                    options: [
                        {
                            value: "HGV",
                            label: "HGV"
                        },
                        {
                            value: "CMV",
                            label: "CMV"
                        },
                        {
                            value: "Class 4",
                            label: "Class 4"
                        },
                        {
                            value: "Class 5",
                            label: "Class 5"
                        }
                    ],
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-012",
                    label: "Years of HGV Experience",
                    internalName: "hgv_experience_years",
                    type: "number",
                    typeLabel: "Number",
                    required: true,
                    displayOrder: 5,
                    channels: ch,
                    fieldType: "number",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-013",
                    label: "Conviction History?",
                    internalName: "driver_conviction_history",
                    type: "boolean",
                    typeLabel: "Boolean",
                    required: true,
                    displayOrder: 6,
                    channels: ch,
                    fieldType: "boolean",
                    validations: [],
                    conditions: [],
                    evidence: []
                }
            ]
        },
        {
            id: "grp-3",
            name: "Operations",
            label: "Operations",
            questions: [
                {
                    id: "QST-CT-014",
                    label: "Goods Class Carried",
                    internalName: "goods_class",
                    type: "select",
                    typeLabel: "Single-select",
                    required: true,
                    displayOrder: 1,
                    helpText: "Class 1 explosives and radioactive cargo are declined on this product.",
                    channels: ch,
                    fieldType: "select",
                    options: [
                        {
                            value: "General merchandise",
                            label: "General merchandise"
                        },
                        {
                            value: "Perishable / refrigerated",
                            label: "Perishable / refrigerated"
                        },
                        {
                            value: "Construction materials",
                            label: "Construction materials"
                        },
                        {
                            value: "Fuel / flammable liquids",
                            label: "Fuel / flammable liquids"
                        },
                        {
                            value: "Chemicals (non-explosive)",
                            label: "Chemicals (non-explosive)"
                        }
                    ],
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-015",
                    label: "Radius of Operation (km)",
                    internalName: "radius_km",
                    type: "number",
                    typeLabel: "Number",
                    required: true,
                    displayOrder: 2,
                    channels: ch,
                    fieldType: "number",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-016",
                    label: "Night Operations?",
                    internalName: "night_operations",
                    type: "boolean",
                    typeLabel: "Boolean",
                    required: true,
                    displayOrder: 3,
                    helpText: "Night haul and tankers may be referred.",
                    channels: ch,
                    fieldType: "boolean",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-017",
                    label: "Annual Mileage",
                    internalName: "annual_mileage",
                    type: "number",
                    typeLabel: "Number",
                    required: true,
                    displayOrder: 4,
                    channels: ch,
                    fieldType: "number",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-018",
                    label: "Trailer Attached?",
                    internalName: "trailer_attached",
                    type: "boolean",
                    typeLabel: "Boolean",
                    required: true,
                    displayOrder: 5,
                    channels: ch,
                    fieldType: "boolean",
                    conditional: true,
                    conditions: [
                        {
                            field: "Body Type",
                            op: "=",
                            value: "Tractor Unit"
                        }
                    ],
                    exprPreview: "body_type = Tractor Unit",
                    visibleWhen: "body_type = Tractor Unit",
                    validations: [],
                    evidence: []
                }
            ]
        },
        {
            id: "grp-4",
            name: "Policy Details",
            label: "Policy Details",
            questions: [
                {
                    id: "QST-CT-019",
                    label: "Cover Start Date",
                    internalName: "policy_start_date",
                    type: "date",
                    typeLabel: "Date",
                    required: true,
                    displayOrder: 1,
                    channels: ch,
                    fieldType: "date",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-020",
                    label: "Policy Period",
                    internalName: "policy_period",
                    type: "select",
                    typeLabel: "Single-select",
                    required: true,
                    displayOrder: 2,
                    channels: ch,
                    fieldType: "select",
                    options: [
                        {
                            value: "12m",
                            label: "12 months"
                        },
                        {
                            value: "6m",
                            label: "6 months"
                        }
                    ],
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-021",
                    label: "Covers Required",
                    internalName: "covers_required",
                    type: "multisel",
                    typeLabel: "Multi-select",
                    required: true,
                    displayOrder: 3,
                    channels: ch,
                    fieldType: "multisel",
                    validations: [],
                    conditions: [],
                    evidence: []
                },
                {
                    id: "QST-CT-022",
                    label: "Payment Preference",
                    internalName: "payment_preference",
                    type: "select",
                    typeLabel: "Single-select",
                    required: true,
                    displayOrder: 4,
                    channels: ch,
                    fieldType: "select",
                    options: [
                        {
                            value: "annual",
                            label: "Annual"
                        },
                        {
                            value: "monthly",
                            label: "Monthly"
                        }
                    ],
                    validations: [],
                    conditions: [],
                    evidence: []
                }
            ]
        }
    ];
}
function truckEligibility() {
    return [
        {
            id: "ELG-CT-001",
            name: "Min Driver Age — Commercial",
            field: "driver_age",
            operator: "<",
            value: "25",
            outcome: "ineligible",
            outcomeType: "hard",
            category: "Product Eligibility",
            cover: "All Covers",
            priority: 10,
            status: "active",
            description: "Named driver must be at least 25 years old for commercial truck cover.",
            customerMsg: "Commercial truck cover is only available to drivers aged 25 and over.",
            internalMsg: "Driver age below commercial minimum (25).",
            reasonCode: "ELIG-CT-MIN-AGE",
            direction: "ineligible",
            logic: "and",
            conditions: [
                {
                    field: "driver_age",
                    op: "<",
                    value: "25"
                }
            ],
            effectiveFrom: "01-Aug-2026",
            effectiveTo: "31-Jul-2027"
        },
        {
            id: "ELG-CT-002",
            name: "Valid HGV / CMV Licence",
            field: "licence_class",
            operator: "not in",
            value: "HGV, CMV, Class 4, Class 5",
            outcome: "ineligible",
            outcomeType: "hard",
            category: "Product Eligibility",
            cover: "All Covers",
            priority: 5,
            status: "active",
            description: "Primary driver must hold a valid heavy goods or commercial motor vehicle licence.",
            customerMsg: "A valid heavy vehicle licence is required for this product.",
            internalMsg: "Licence class not in HGV/CMV allowlist.",
            reasonCode: "ELIG-CT-LICENCE",
            conditions: [
                {
                    field: "licence_class",
                    op: "not in",
                    value: "HGV, CMV, Class 4, Class 5"
                }
            ],
            effectiveFrom: "01-Aug-2026",
            effectiveTo: "31-Jul-2027"
        },
        {
            id: "ELG-CT-003",
            name: "Max Vehicle Age",
            field: "vehicle_age",
            operator: ">",
            value: "20",
            outcome: "ineligible",
            outcomeType: "hard",
            category: "Product Eligibility",
            cover: "All Covers",
            priority: 20,
            status: "active",
            description: "Truck must be 20 years old or newer.",
            customerMsg: "This product is only available for trucks manufactured within the last 20 years.",
            reasonCode: "ELIG-CT-MAX-AGE",
            conditions: [
                {
                    field: "vehicle_age",
                    op: ">",
                    value: "20"
                }
            ],
            effectiveFrom: "01-Aug-2026",
            effectiveTo: "31-Jul-2027"
        },
        {
            id: "ELG-CT-004",
            name: "GVW Cap",
            field: "gvw_tonnes",
            operator: ">",
            value: "49",
            outcome: "ineligible",
            outcomeType: "hard",
            category: "Product Eligibility",
            cover: "All Covers",
            priority: 15,
            status: "active",
            description: "Gross vehicle weight must not exceed 49 tonnes.",
            customerMsg: "Vehicles above 49 tonnes require a specialist fleet product.",
            reasonCode: "ELIG-CT-GVW",
            conditions: [
                {
                    field: "gvw_tonnes",
                    op: ">",
                    value: "49"
                }
            ],
            effectiveFrom: "01-Aug-2026",
            effectiveTo: "31-Jul-2027"
        },
        {
            id: "ELG-CT-007",
            name: "Min HGV Experience",
            field: "hgv_experience_years",
            operator: "<",
            value: "2",
            outcome: "ineligible",
            outcomeType: "soft",
            category: "Product Eligibility",
            cover: "All Covers",
            priority: 18,
            status: "active",
            description: "Primary driver must have at least 2 years of heavy-vehicle experience.",
            customerMsg: "Drivers with under 2 years of HGV experience may receive a premium loading.",
            reasonCode: "ELIG-CT-EXP",
            conditions: [
                {
                    field: "hgv_experience_years",
                    op: "<",
                    value: "2"
                }
            ],
            effectiveFrom: "01-Aug-2026",
            effectiveTo: "31-Jul-2027"
        },
        {
            id: "ELG-CT-005",
            name: "Hazardous Goods Refer",
            field: "goods_class",
            operator: "in",
            value: "Class 1 explosives, radioactive",
            outcome: "refer",
            outcomeType: "refer",
            category: "Cover Eligibility",
            cover: "Goods in Transit",
            priority: 25,
            status: "active",
            description: "Class 1 explosives and radioactive cargo are referred to specialist underwriting.",
            customerMsg: "Hazardous cargo of this class needs a specialist review before we can quote.",
            reasonCode: "ELIG-CT-HAZMAT",
            conditions: [
                {
                    field: "goods_class",
                    op: "in",
                    value: "Class 1 explosives, radioactive"
                }
            ],
            effectiveFrom: "01-Aug-2026",
            effectiveTo: "31-Jul-2027"
        },
        {
            id: "ELG-CT-006",
            name: "Tracking Device for Theft Cover",
            field: "tracking_fitted",
            operator: "=",
            value: "No",
            outcome: "ineligible",
            outcomeType: "soft",
            category: "Cover Eligibility",
            cover: "Theft & Hijack",
            priority: 30,
            status: "active",
            description: "Theft & Hijack requires an active GPS tracking device.",
            customerMsg: "Theft cover can be added once an approved tracking device is fitted.",
            reasonCode: "ELIG-CT-TRACK",
            conditions: [
                {
                    field: "tracking_fitted",
                    op: "=",
                    value: "No"
                }
            ],
            effectiveFrom: "01-Aug-2026",
            effectiveTo: "31-Jul-2027"
        }
    ];
}
function truckRating() {
    const gvw = [
        {
            band: "≤ 7.5t",
            mult: "0.85",
            note: "Light commercial"
        },
        {
            band: "7.6–16t",
            mult: "1.00",
            note: "Base band"
        },
        {
            band: "16.1–26t",
            mult: "1.25",
            note: ""
        },
        {
            band: "26.1–40t",
            mult: "1.55",
            note: ""
        },
        {
            band: "40.1–49t",
            mult: "1.85",
            note: "Maximum GVW"
        }
    ];
    const radius = [
        {
            band: "0–150 km",
            mult: "0.90",
            note: "Local"
        },
        {
            band: "151–500 km",
            mult: "1.00",
            note: "Regional"
        },
        {
            band: "501–1,000 km",
            mult: "1.20",
            note: "Long haul"
        },
        {
            band: "1,001–1,500 km",
            mult: "1.40",
            note: "Interstate"
        }
    ];
    const goods = [
        {
            band: "General merchandise",
            mult: "1.00",
            note: ""
        },
        {
            band: "Perishable / refrigerated",
            mult: "1.15",
            note: ""
        },
        {
            band: "Construction materials",
            mult: "1.10",
            note: ""
        },
        {
            band: "Fuel / flammable liquids",
            mult: "1.45",
            note: "ADR / hazmat"
        },
        {
            band: "Chemicals (non-explosive)",
            mult: "1.35",
            note: ""
        }
    ];
    const exp = [
        {
            band: "2–4 years",
            mult: "1.30",
            note: "Inexperienced loading"
        },
        {
            band: "5–9 years",
            mult: "1.10",
            note: ""
        },
        {
            band: "10–14 years",
            mult: "1.00",
            note: "Base"
        },
        {
            band: "15+ years",
            mult: "0.90",
            note: "Preferred"
        }
    ];
    const toBands = (rows)=>rows.map((r)=>`${r.band} ×${r.mult}`).join(" · ");
    return [
        {
            id: "RAT-CT-BR-001",
            name: "Base Rate — Commercial Truck",
            type: "base",
            amount: 1850,
            unit: "per year",
            cover: "Own Damage — Truck & Chassis (primary)",
            value: "$1,850/yr",
            notes: "Commercial motor base rate validated 12-Aug-2026 against 2025 heavy-vehicle loss ratios."
        },
        {
            id: "RAT-CT-FAC-001",
            name: "GVW Factor",
            type: "factor",
            field: "gvw_tonnes",
            lookupAttr: "gvw_tonnes",
            table1D: gvw,
            bands: toBands(gvw)
        },
        {
            id: "RAT-CT-FAC-002",
            name: "Radius of Operation",
            type: "factor",
            field: "radius_km",
            lookupAttr: "radius_km",
            table1D: radius,
            bands: toBands(radius)
        },
        {
            id: "RAT-CT-FAC-003",
            name: "Goods Class Factor",
            type: "factor",
            field: "goods_class",
            lookupAttr: "goods_class",
            table1D: goods,
            bands: toBands(goods)
        },
        {
            id: "RAT-CT-FAC-004",
            name: "Driver Experience Factor",
            type: "factor",
            field: "hgv_experience_years",
            lookupAttr: "hgv_experience_years",
            table1D: exp,
            bands: toBands(exp)
        },
        {
            id: "RAT-CT-LOAD-001",
            name: "Night Operations Loading",
            type: "loading",
            amount: "18%",
            condition: "night_operations = Yes",
            loadingType: "Percentage",
            loadingValue: "18"
        },
        {
            id: "RAT-CT-LOAD-002",
            name: "Inexperienced Driver",
            type: "loading",
            amount: "20%",
            condition: "hgv_experience_years < 2",
            loadingType: "Percentage",
            loadingValue: "20"
        },
        {
            id: "RAT-CT-DISC-001",
            name: "Tracker discount",
            type: "discount",
            amount: "5%",
            condition: "tracking_fitted = Yes"
        },
        {
            id: "RAT-CT-MIN-001",
            name: "Minimum premium",
            type: "minimum",
            amount: 1200,
            unit: "per year"
        },
        {
            id: "RAT-CT-FEE-001",
            name: "Policy Admin Fee",
            type: "fee",
            amount: 45,
            feeType: "Fixed"
        },
        {
            id: "RAT-CT-TAX-001",
            name: "GST / Insurance Tax",
            type: "tax",
            amount: "18%",
            taxType: "Percentage"
        },
        {
            id: "RAT-CT-FOR-001",
            name: "Payable premium formula",
            type: "formula",
            expression: "Base Premium × Risk Factors + Loadings − Discounts + Add-ons + Fees + Taxes = Payable Premium"
        }
    ];
}
function truckUnderwriting() {
    return [
        {
            id: "UW-CT-DCL-001",
            name: "Disqualified HGV licence",
            outcome: "decline",
            field: "licence_status",
            operator: "in",
            value: "Suspended, Revoked, Disqualified",
            conditions: [
                {
                    field: "licence_status",
                    op: "in",
                    value: "Suspended, Revoked, Disqualified"
                }
            ]
        },
        {
            id: "UW-CT-DCL-002",
            name: "Explosives / radioactive cargo",
            outcome: "decline",
            field: "goods_class",
            operator: "in",
            value: "Class 1 explosives, radioactive",
            conditions: [
                {
                    field: "goods_class",
                    op: "in",
                    value: "Class 1 explosives, radioactive"
                }
            ]
        },
        {
            id: "UW-CT-REF-001",
            name: "High GVW or high value",
            outcome: "refer",
            field: "gvw_tonnes",
            operator: ">",
            value: "40",
            conditions: [
                {
                    field: "gvw_tonnes",
                    op: ">",
                    value: "40"
                },
                {
                    connector: "OR",
                    field: "vehicle_insured_value",
                    op: ">",
                    value: "250000"
                }
            ],
            logic: "or"
        },
        {
            id: "UW-CT-REF-002",
            name: "Fuel tanker / night haul",
            outcome: "refer",
            field: "body_type",
            operator: "=",
            value: "Tanker",
            conditions: [
                {
                    field: "body_type",
                    op: "=",
                    value: "Tanker"
                },
                {
                    connector: "OR",
                    field: "night_operations",
                    op: "=",
                    value: "Yes"
                }
            ],
            logic: "or"
        },
        {
            id: "UW-CT-LOAD-001",
            name: "Recent at-fault commercial claim",
            outcome: "load",
            field: "at_fault_claims_24m",
            operator: ">=",
            value: "1",
            loading: "20%",
            conditions: [
                {
                    field: "at_fault_claims_24m",
                    op: ">=",
                    value: "1"
                }
            ]
        },
        {
            id: "UW-CT-RSTR-001",
            name: "Cap GIT without tracker",
            outcome: "restrict",
            field: "tracking_fitted",
            operator: "=",
            value: "No",
            restriction: "GIT limit $50,000",
            conditions: [
                {
                    field: "tracking_fitted",
                    op: "=",
                    value: "No"
                }
            ]
        },
        {
            id: "UW-CT-EVD-001",
            name: "Require inspection for high SI",
            outcome: "evidence",
            field: "vehicle_insured_value",
            operator: ">",
            value: "250000",
            description: "Request physical inspection and tracker certificate before bind.",
            conditions: [
                {
                    field: "vehicle_insured_value",
                    op: ">",
                    value: "250000"
                }
            ]
        },
        {
            id: "UW-CT-ACC-001",
            name: "Standard commercial accept",
            outcome: "accept",
            description: "Accept if no decline, refer, load, or restrict rule has fired.",
            conditions: []
        }
    ];
}
function truckChannels() {
    return [
        {
            id: "CHAN-CT-B01",
            name: "Commercial Broker Portal",
            accessModel: "Restricted Access",
            commission: "18%",
            comm: "18%",
            status: "active",
            description: "Appointed commercial motor brokers. Bind up to $200k OD SI.",
            territories: [
                {
                    j: "India",
                    p: "Yes",
                    n: "All zones"
                },
                {
                    j: "UAE",
                    p: "Yes",
                    n: "Zones A, B, D"
                },
                {
                    j: "UK",
                    p: "Yes",
                    n: "HGV licensed operators"
                }
            ],
            commConfig: {
                type: "Percentage of Gross Premium (excluding taxes)",
                rate: "18%",
                code: "COMM-CT-BROKER"
            }
        },
        {
            id: "CHAN-CT-D01",
            name: "Direct (Web) — Owner Operators",
            accessModel: "Open Access",
            commission: "0%",
            comm: "0%",
            status: "active",
            description: "Self-serve quotes for single-truck owner-operators.",
            territories: [
                {
                    j: "India",
                    p: "Yes",
                    n: "All zones"
                },
                {
                    j: "UAE",
                    p: "No",
                    n: "Broker only"
                }
            ]
        },
        {
            id: "CHAN-CT-API01",
            name: "Fleet TMS API",
            accessModel: "API Partners Only",
            commission: "8%",
            comm: "8%",
            status: "active",
            description: "Headless quoting for transport-management systems.",
            territories: [
                {
                    j: "India",
                    p: "Yes",
                    n: "Connected TMS operators"
                }
            ]
        }
    ];
}
function truckDocuments() {
    return [
        {
            id: "DOC-CT-WORD-001",
            name: "Commercial Truck Policy Wording",
            type: "Core",
            version: TRUCK_VERSION,
            ver: "v2026.08",
            status: "approved",
            identity: {
                type: "Core — Policy Wording",
                format: "PDF",
                lang: "English (UK)",
                jur: "India, UAE, UK",
                author: "David Okonkwo"
            },
            vars: [
                {
                    tok: "{{policy_number}}",
                    src: "Policy System",
                    ex: "POL-CT-2026-00811"
                },
                {
                    tok: "{{operator_name}}",
                    src: "Risk data",
                    ex: "Singh Logistics Pvt Ltd"
                }
            ]
        },
        {
            id: "DOC-CT-SCH-001",
            name: "Commercial Truck Schedule",
            type: "Core",
            version: TRUCK_VERSION,
            status: "approved",
            identity: {
                type: "Core — Policy Schedule",
                format: "PDF (dynamic fields)",
                lang: "English (UK)",
                jur: "India, UAE, UK"
            },
            vars: [
                {
                    tok: "{{vehicle_make_model}}",
                    src: "Risk data",
                    ex: "Tata Prima 4928.S"
                },
                {
                    tok: "{{gvw_tonnes}}",
                    src: "Risk data",
                    ex: "49"
                }
            ]
        },
        {
            id: "DOC-CT-CERT-001",
            name: "Certificate of Insurance (CMV)",
            type: "Core",
            version: TRUCK_VERSION,
            status: "approved"
        },
        {
            id: "DOC-CT-END-001",
            name: "Goods in Transit Endorsement",
            type: "Endorsement",
            version: TRUCK_VERSION,
            status: "approved",
            vars: [
                {
                    tok: "{{git_limit}}",
                    src: "Coverage",
                    ex: "$250,000"
                }
            ]
        },
        {
            id: "DOC-CT-END-002",
            name: "Trailer Extension Endorsement",
            type: "Endorsement",
            version: TRUCK_VERSION,
            status: "approved"
        }
    ];
}
function truckTests() {
    return [
        {
            id: "TEST-CT-001",
            name: "Standard rigid 16t — 12yr HGV driver",
            expected: "Accept",
            premium: 3240,
            result: "pass",
            answers: {
                driver_age: 38,
                licence_class: "HGV",
                vehicle_age: 8,
                gvw_tonnes: 16,
                goods_class: "General merchandise",
                tracking_fitted: "Yes",
                hgv_experience_years: 12,
                night_operations: "No",
                body_type: "Rigid"
            }
        },
        {
            id: "TEST-CT-002",
            name: "Long-haul 40t tractor — 800 km radius",
            expected: "Accept, higher premium",
            premium: 5110,
            result: "pass",
            answers: {
                driver_age: 42,
                licence_class: "HGV",
                vehicle_age: 5,
                gvw_tonnes: 40,
                radius_km: 800,
                goods_class: "Construction materials",
                tracking_fitted: "Yes",
                hgv_experience_years: 14,
                night_operations: "No"
            }
        },
        {
            id: "TEST-CT-003",
            name: "Driver age 23",
            expected: "Ineligible (hard block)",
            premium: 0,
            result: "pass",
            answers: {
                driver_age: 23,
                licence_class: "HGV",
                gvw_tonnes: 16,
                tracking_fitted: "Yes",
                hgv_experience_years: 3
            }
        },
        {
            id: "TEST-CT-004",
            name: "Class 1 explosives cargo",
            expected: "Decline",
            premium: 0,
            result: "pass",
            answers: {
                driver_age: 35,
                licence_class: "HGV",
                gvw_tonnes: 18,
                goods_class: "Class 1 explosives",
                tracking_fitted: "Yes",
                hgv_experience_years: 8
            }
        },
        {
            id: "TEST-CT-005",
            name: "Fuel tanker night operations",
            expected: "Refer (operations)",
            premium: 6480,
            result: "pass",
            answers: {
                driver_age: 40,
                licence_class: "HGV",
                gvw_tonnes: 26,
                body_type: "Tanker",
                night_operations: "Yes",
                tracking_fitted: "Yes",
                hgv_experience_years: 10,
                goods_class: "Fuel / flammable liquids"
            }
        },
        {
            id: "TEST-CT-006",
            name: "No tracker — GIT selected",
            expected: "Restrict GIT to $50k",
            premium: 3390,
            result: "pass",
            answers: {
                driver_age: 36,
                licence_class: "HGV",
                gvw_tonnes: 16,
                tracking_fitted: "No",
                hgv_experience_years: 7,
                goods_class: "General merchandise"
            }
        }
    ];
}
function truckCollections() {
    const k = (name)=>`${TRUCK_ID}::${TRUCK_VERSION}::${name}`;
    return {
        [k("covers")]: truckCovers(),
        [k("questionGroups")]: truckQuestionGroups(),
        [k("eligibilityRules")]: truckEligibility(),
        [k("ratingComponents")]: truckRating(),
        [k("underwritingRules")]: truckUnderwriting(),
        [k("channels")]: truckChannels(),
        [k("documents")]: truckDocuments(),
        [k("testCases")]: truckTests()
    };
}
const TRUCK_DESCRIPTION = "Comprehensive commercial motor cover for rigid trucks, tractor units, tippers, and tankers. Includes own damage, statutory and excess third-party liability, driver PA, goods in transit, theft/hijack, and optional trailer, breakdown, and loading/overturning extensions. GVW up to 49t. Tracker required for full theft and GIT limits.";
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1920n5q._.js.map
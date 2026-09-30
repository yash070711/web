module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/admin/organizations/new/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NewOrganizationPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StudioFrame$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/StudioFrame.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$org$2f$OrganizationForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/org/OrganizationForm.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$org$2d$fields$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/org-fields.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$organizations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/organizations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
async function NewOrganizationPage({ searchParams }) {
    const { error } = await searchParams;
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSession"])();
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$organizations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isParentCompanyAdmin"])(session)) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/admin/organizations");
    const workspace = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loadWorkspace"])(session);
    const parentCompany = workspace.parentCompanies.find((p)=>p.id === session.parentCompanyId) || workspace.parentCompanies.find((p)=>p.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$organizations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEFAULT_PARENT_COMPANY_ID"]) || workspace.parentCompanies[0];
    const audit = workspace.audit.filter((event)=>event.page === "organizations" && event.description.includes("ORG-"));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StudioFrame$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StudioFrame"], {
        active: "organizations",
        crumbs: [
            {
                label: "Admin",
                href: "/admin"
            },
            {
                label: "Organization Management",
                href: "/admin/organizations"
            },
            {
                label: "Create",
                href: "/admin/organizations/new"
            }
        ],
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "page-inner",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$org$2f$OrganizationForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["OrganizationForm"], {
                parentCompany: parentCompany,
                audit: audit,
                error: error,
                products: workspace.products,
                coverages: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$org$2d$fields$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["collectCoverages"])(workspace),
                organizations: workspace.organizations
            }, void 0, false, {
                fileName: "[project]/app/admin/organizations/new/page.tsx",
                lineNumber: 38,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/admin/organizations/new/page.tsx",
            lineNumber: 37,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/admin/organizations/new/page.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/admin/organizations/new/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", (function(__turbopack_context__){

__turbopack_context__.n(__turbopack_context__.i("[project]/app/admin/organizations/new/page.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/favicon.ico (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/favicon.2vob68tjqpejf.ico" + (globalThis["NEXT_CLIENT_ASSET_SUFFIX"] || ''));}),
"[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/app/favicon.ico (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 256,
    height: 256
};
}),
"[project]/components/Shell.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Shell",
    ()=>Shell
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const Shell = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Shell() from the server but Shell is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/components/Shell.tsx", "Shell");
}),
"[project]/components/Shell.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Shell",
    ()=>Shell
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const Shell = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Shell() from the server but Shell is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/components/Shell.tsx <module evaluation>", "Shell");
}),
"[project]/components/Shell.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/components/Shell.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/components/Shell.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/components/StudioFrame.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StudioFrame",
    ()=>StudioFrame,
    "studioContext",
    ()=>studioContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/truck-demo.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Shell.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
async function StudioFrame({ active, crumbs, children }) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSession"])();
    const workspace = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loadWorkspace"])(session);
    const productId = session.productId || __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TRUCK_ID"] || workspace.products[0]?.id;
    const version = session.version || __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TRUCK_VERSION"] || workspace.products.find((p)=>p.id === productId)?.version;
    let user = session;
    if (session.context === "parent") {
        const parent = workspace.parentCompanies.find((p)=>p.id === session.parentCompanyId) || workspace.parentCompanies[0];
        if (parent) user = {
            ...session,
            name: parent.name
        };
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Shell"], {
        user: user,
        active: active,
        crumbs: crumbs,
        productId: productId,
        version: version,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/StudioFrame.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
async function studioContext() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSession"])();
    const workspace = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loadWorkspace"])(session);
    const productId = session.productId || __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TRUCK_ID"];
    const product = workspace.products.find((p)=>p.id === productId) || workspace.products.find((p)=>p.id === __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TRUCK_ID"]) || workspace.products[0];
    const version = session.version || product?.version || __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$truck$2d$demo$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TRUCK_VERSION"];
    return {
        session,
        workspace,
        product,
        productId: product?.id || "",
        version
    };
}
}),
"[project]/components/org/OrganizationForm.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OrganizationForm",
    ()=>OrganizationForm
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const OrganizationForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call OrganizationForm() from the server but OrganizationForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/components/org/OrganizationForm.tsx", "OrganizationForm");
}),
"[project]/components/org/OrganizationForm.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OrganizationForm",
    ()=>OrganizationForm
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const OrganizationForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call OrganizationForm() from the server but OrganizationForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/components/org/OrganizationForm.tsx <module evaluation>", "OrganizationForm");
}),
"[project]/components/org/OrganizationForm.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$org$2f$OrganizationForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/components/org/OrganizationForm.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$org$2f$OrganizationForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/components/org/OrganizationForm.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$org$2f$OrganizationForm$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/lib/org-fields.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AUTHORITY_TYPES",
    ()=>AUTHORITY_TYPES,
    "AUTHORITY_TYPE_TARGETS",
    ()=>AUTHORITY_TYPE_TARGETS,
    "AUTHORIZED_TERRITORIES",
    ()=>AUTHORIZED_TERRITORIES,
    "CLASSES_OF_BUSINESS",
    ()=>CLASSES_OF_BUSINESS,
    "LEGAL_ENTITY_TYPES",
    ()=>LEGAL_ENTITY_TYPES,
    "LINES_OF_BUSINESS",
    ()=>LINES_OF_BUSINESS,
    "ORG_FIELD_CONFIG",
    ()=>ORG_FIELD_CONFIG,
    "PARTICIPATION_TYPES",
    ()=>PARTICIPATION_TYPES,
    "REINSURANCE_AUTHORIZATION_TYPES",
    ()=>REINSURANCE_AUTHORIZATION_TYPES,
    "RISK_TYPES",
    ()=>RISK_TYPES,
    "SETTLEMENT_CURRENCIES",
    ()=>SETTLEMENT_CURRENCIES,
    "SETTLEMENT_FREQUENCIES",
    ()=>SETTLEMENT_FREQUENCIES,
    "STUDIOS",
    ()=>STUDIOS,
    "STUDIO_PERMISSIONS",
    ()=>STUDIO_PERMISSIONS,
    "collectCoverages",
    ()=>collectCoverages,
    "configSearchText",
    ()=>configSearchText,
    "hasOrgFieldConfig",
    ()=>hasOrgFieldConfig,
    "isAuthorityTypeTarget",
    ()=>isAuthorityTypeTarget,
    "orgConfigFields",
    ()=>orgConfigFields,
    "orgConfigFieldsWithAuthority",
    ()=>orgConfigFieldsWithAuthority,
    "orgFieldByKey",
    ()=>orgFieldByKey,
    "orgFieldSections",
    ()=>orgFieldSections
]);
const opt = (value, label)=>({
        value,
        label: label || value
    });
const AUTHORITY_TYPES = [
    {
        value: "binding",
        label: "Binding"
    },
    {
        value: "brokerage",
        label: "Brokerage"
    },
    {
        value: "binding-rating",
        label: "Binding Rating"
    }
];
const AUTHORITY_TYPE_TARGETS = [
    "market-company",
    "risk-company",
    "mga",
    "mgu",
    "broker"
];
const AUTHORITY_FIELD = {
    key: "authorityType",
    label: "Authority Type",
    type: "select",
    options: AUTHORITY_TYPES
};
function isAuthorityTypeTarget(type) {
    return AUTHORITY_TYPE_TARGETS.includes(type);
}
const AUTHORIZED_TERRITORIES = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "DC",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "Canada",
    "UK",
    "EU",
    "UAE",
    "India",
    "Australia"
];
const LINES_OF_BUSINESS = [
    "Commercial Auto",
    "Commercial Property",
    "General Liability",
    "Workers Compensation",
    "Inland Marine",
    "Excess / Umbrella",
    "Professional Liability",
    "Cyber Liability",
    "Marine",
    "Aviation",
    "Surety",
    "Fleet (Motor)"
];
const CLASSES_OF_BUSINESS = [
    "Auto Liability",
    "Auto Physical Damage",
    "Cargo / Goods in Transit",
    "General Liability",
    "Commercial Property",
    "Inland Marine",
    "Workers Compensation",
    "Excess Liability",
    "Umbrella",
    "Marine",
    "Aviation",
    "Cyber Liability",
    "Surety",
    "Professional Liability",
    "Fleet (Motor)"
];
const RISK_TYPES = [
    "Primary",
    "Excess",
    "Quota Share",
    "Facultative",
    "Treaty",
    "Catastrophe",
    "Proportional",
    "Non-Proportional"
];
const LEGAL_ENTITY_TYPES = [
    "Corporation",
    "LLC",
    "Partnership",
    "Sole Proprietorship",
    "Trust",
    "Mutual Company",
    "Crown / State Enterprise"
];
const SETTLEMENT_CURRENCIES = [
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "INR",
    "JPY",
    "CHF"
];
const SETTLEMENT_FREQUENCIES = [
    "Monthly",
    "Quarterly",
    "Semi-Annual",
    "Annual",
    "Upon Settlement"
];
const PARTICIPATION_TYPES = [
    {
        key: "lead",
        label: "Lead"
    },
    {
        key: "following",
        label: "Following"
    },
    {
        key: "participating",
        label: "Participating"
    }
];
const REINSURANCE_AUTHORIZATION_TYPES = [
    "Treaty Reinsurance",
    "Facultative Reinsurance",
    "Both (Treaty & Facultative)"
];
const STUDIOS = [
    {
        key: "product-definition",
        label: "Product Definition"
    },
    {
        key: "coverage-studio",
        label: "Coverage Studio"
    },
    {
        key: "question-studio",
        label: "Question Studio"
    },
    {
        key: "risk-studio",
        label: "Risk Studio"
    },
    {
        key: "underwriting-studio",
        label: "Underwriting Studio"
    },
    {
        key: "eligibility-studio",
        label: "Eligibility Studio"
    },
    {
        key: "rating-pricing-studio",
        label: "Rating & Pricing Studio"
    },
    {
        key: "document-studio",
        label: "Document Studio"
    },
    {
        key: "distribution-studio",
        label: "Distribution Studio"
    }
];
const STUDIO_PERMISSIONS = [
    {
        key: "view",
        label: "View"
    },
    {
        key: "configure",
        label: "Configure/Edit"
    },
    {
        key: "submit",
        label: "Submit for Review"
    },
    {
        key: "approve",
        label: "Approve"
    },
    {
        key: "publish",
        label: "Publish"
    }
];
const riskCompanySections = [
    {
        key: "basic-information",
        title: "Basic Information",
        fields: [
            {
                key: "name",
                bind: "name",
                label: "Risk Carrier Name",
                type: "text",
                required: true,
                placeholder: "e.g. Southlake"
            },
            {
                key: "legalName",
                bind: "legalName",
                label: "Legal Name",
                type: "text",
                required: true,
                placeholder: "Registered legal entity name"
            },
            {
                key: "dbaName",
                label: "DBA Name",
                type: "text",
                placeholder: "Trading / brand name"
            },
            {
                key: "type",
                bind: "type",
                label: "Organization Type",
                type: "readonly"
            },
            {
                key: "authorityType",
                label: "Authority Type",
                type: "select",
                options: AUTHORITY_TYPES
            },
            {
                key: "status",
                bind: "status",
                label: "Status",
                type: "select",
                required: true,
                options: [
                    opt("active", "Active"),
                    opt("inactive", "Inactive")
                ]
            },
            {
                key: "statusReason",
                label: "Status Reason",
                type: "text",
                placeholder: "Reason for the current status"
            },
            {
                key: "notes",
                bind: "notes",
                label: "Description / Notes",
                type: "textarea",
                wide: true
            },
            {
                key: "carrierLogo",
                label: "Carrier Logo",
                type: "file",
                help: "PNG or SVG. Stored as the file name in this demo."
            }
        ]
    },
    {
        key: "parent-company",
        title: "Parent Company",
        fields: [
            {
                key: "parentCompanyName",
                bind: "parentCompanyName",
                label: "Parent Company",
                type: "readonly",
                required: true
            },
            {
                key: "ownershipType",
                label: "Ownership Type",
                type: "select",
                options: [
                    opt("wholly-owned", "Wholly Owned"),
                    opt("majority", "Majority Owned"),
                    opt("minority", "Minority Owned"),
                    opt("joint-venture", "Joint Venture"),
                    opt("affiliate", "Affiliate")
                ]
            },
            {
                key: "ownershipPercentage",
                label: "Ownership Percentage",
                type: "percent",
                placeholder: "e.g. 100"
            }
        ]
    },
    {
        key: "regulatory-licensing",
        title: "Regulatory & Licensing",
        fields: [
            {
                key: "naicNumber",
                label: "NAIC Number",
                type: "text",
                placeholder: "e.g. 10001"
            },
            {
                key: "regulatoryId",
                label: "Regulatory ID",
                type: "text"
            },
            {
                key: "domicileState",
                label: "Domicile State",
                type: "text",
                placeholder: "e.g. NY"
            },
            {
                key: "admissionStatus",
                label: "Admission Status",
                type: "select",
                options: [
                    opt("admitted", "Admitted"),
                    opt("non-admitted", "Non-Admitted"),
                    opt("surplus-lines", "Surplus Lines"),
                    opt("conditional", "Conditional")
                ]
            },
            {
                key: "regulatoryStatus",
                label: "Regulatory Status",
                type: "select",
                options: [
                    opt("active", "Active"),
                    opt("suspended", "Suspended"),
                    opt("revoked", "Revoked"),
                    opt("pending", "Pending"),
                    opt("inactive", "Inactive")
                ]
            },
            {
                key: "licenseNumber",
                label: "License Number",
                type: "text"
            },
            {
                key: "licenseType",
                label: "License Type",
                type: "select",
                options: [
                    opt("certificate-of-authority", "Certificate of Authority"),
                    opt("surplus-lines-license", "Surplus Lines License"),
                    opt("provisional", "Provisional"),
                    opt("limited", "Limited"),
                    opt("foreign", "Foreign")
                ]
            },
            {
                key: "licenseStatus",
                label: "License Status",
                type: "select",
                options: [
                    opt("active", "Active"),
                    opt("expired", "Expired"),
                    opt("pending-renewal", "Pending Renewal"),
                    opt("suspended", "Suspended"),
                    opt("revoked", "Revoked")
                ]
            },
            {
                key: "licenseIssueDate",
                label: "License Issue Date",
                type: "date"
            },
            {
                key: "licenseExpirationDate",
                label: "License Expiration Date",
                type: "date"
            },
            {
                key: "licensedStates",
                label: "Licensed States",
                type: "list",
                wide: true,
                placeholder: "Comma separated, e.g. NY, NJ, CT",
                help: "Comma separated state codes."
            }
        ]
    },
    {
        key: "business-authority",
        title: "Business Authority",
        fields: [
            {
                key: "linesOfBusiness",
                label: "Lines of Business",
                type: "list",
                wide: true,
                placeholder: "Comma separated, e.g. Commercial Auto, Property"
            },
            {
                key: "insuranceClasses",
                label: "Insurance Classes",
                type: "list",
                wide: true,
                placeholder: "Comma separated, e.g. Trucking, Fleet"
            },
            {
                key: "authorizedProductTypes",
                label: "Authorized Product Types",
                type: "list",
                wide: true,
                placeholder: "Comma separated"
            },
            {
                key: "geographicRestrictions",
                label: "Geographic Restrictions",
                type: "text"
            },
            {
                key: "restrictedStates",
                label: "Restricted States",
                type: "list",
                wide: true,
                placeholder: "Comma separated state codes"
            },
            {
                key: "restrictedClasses",
                label: "Restricted Classes",
                type: "list",
                wide: true,
                placeholder: "Comma separated"
            }
        ]
    },
    {
        key: "underwriting-authority",
        title: "Underwriting Authority",
        fields: [
            {
                key: "riskAppetite",
                label: "Risk Appetite",
                type: "select",
                options: [
                    opt("conservative", "Conservative"),
                    opt("moderate", "Moderate"),
                    opt("balanced", "Balanced"),
                    opt("aggressive", "Aggressive")
                ]
            },
            {
                key: "targetBusinessTypes",
                label: "Target Business Types",
                type: "list",
                wide: true,
                placeholder: "Comma separated"
            },
            {
                key: "targetClasses",
                label: "Target Classes",
                type: "list",
                wide: true,
                placeholder: "Comma separated"
            },
            {
                key: "targetIndustries",
                label: "Target Industries",
                type: "list",
                wide: true,
                placeholder: "Comma separated"
            },
            {
                key: "minimumRiskSize",
                label: "Minimum Risk Size",
                type: "currency"
            },
            {
                key: "maximumRiskSize",
                label: "Maximum Risk Size",
                type: "currency"
            },
            {
                key: "underwritingAuthority",
                label: "Underwriting Authority",
                type: "textarea",
                wide: true
            },
            {
                key: "referralThreshold",
                label: "Referral Threshold",
                type: "currency"
            },
            {
                key: "approvalAuthority",
                label: "Approval Authority",
                type: "text"
            },
            {
                key: "declineAuthority",
                label: "Decline Authority",
                type: "text"
            },
            {
                key: "underwritingRestrictions",
                label: "Underwriting Restrictions",
                type: "textarea",
                wide: true
            }
        ]
    },
    {
        key: "contact-address",
        title: "Contact & Address",
        fields: [
            {
                key: "primaryContactName",
                bind: "contactName",
                label: "Primary Contact Name",
                type: "text"
            },
            {
                key: "primaryContactEmail",
                bind: "contactEmail",
                label: "Primary Contact Email",
                type: "email"
            },
            {
                key: "generalMailboxEmail",
                label: "General Mailbox Email",
                type: "email"
            },
            {
                key: "phone",
                bind: "contactPhone",
                label: "Phone",
                type: "tel"
            },
            {
                key: "alternatePhone",
                label: "Alternate Phone",
                type: "tel"
            },
            {
                key: "fax",
                label: "Fax",
                type: "tel"
            },
            {
                key: "website",
                label: "Website",
                type: "url",
                placeholder: "https://"
            },
            {
                key: "address1",
                bind: "address",
                label: "Address 1",
                type: "text",
                wide: true
            },
            {
                key: "address2",
                label: "Address 2",
                type: "text",
                wide: true
            },
            {
                key: "city",
                label: "City",
                type: "text"
            },
            {
                key: "state",
                label: "State",
                type: "text"
            },
            {
                key: "zip",
                label: "ZIP / Postal Code",
                type: "text"
            },
            {
                key: "country",
                label: "Country",
                type: "text"
            }
        ]
    },
    {
        key: "contracts-agreements",
        title: "Contracts & Agreements",
        fields: [
            {
                key: "contractNumber",
                label: "Contract Number",
                type: "text"
            },
            {
                key: "contractType",
                label: "Contract Type",
                type: "select",
                options: [
                    opt("master", "Master"),
                    opt("product", "Product"),
                    opt("underwriting", "Underwriting"),
                    opt("distribution", "Distribution"),
                    opt("service", "Service"),
                    opt("nda", "Non-Disclosure")
                ]
            },
            {
                key: "contractDate",
                label: "Contract Date",
                type: "date"
            },
            {
                key: "contractEffectiveDate",
                label: "Effective Date",
                type: "date"
            },
            {
                key: "contractExpirationDate",
                label: "Expiration Date",
                type: "date"
            },
            {
                key: "terminationDate",
                label: "Termination Date",
                type: "date"
            },
            {
                key: "contractStatus",
                label: "Contract Status",
                type: "select",
                options: [
                    opt("draft", "Draft"),
                    opt("active", "Active"),
                    opt("expired", "Expired"),
                    opt("terminated", "Terminated"),
                    opt("pending", "Pending")
                ]
            },
            {
                key: "productAgreement",
                label: "Product Agreement",
                type: "text"
            },
            {
                key: "underwritingAgreement",
                label: "Underwriting Agreement",
                type: "text"
            },
            {
                key: "distributionAgreement",
                label: "Distribution Agreement",
                type: "text"
            },
            {
                key: "specialAgreements",
                label: "Special Agreements",
                type: "textarea",
                wide: true
            }
        ]
    },
    {
        key: "reinsurance",
        title: "Reinsurance",
        fields: [
            {
                key: "reinsuranceProgram",
                label: "Reinsurance Program",
                type: "text"
            },
            {
                key: "reinsurer",
                label: "Reinsurer",
                type: "text"
            },
            {
                key: "treatyType",
                label: "Treaty Type",
                type: "select",
                options: [
                    opt("quota-share", "Quota Share"),
                    opt("surplus", "Surplus"),
                    opt("excess-of-loss", "Excess of Loss"),
                    opt("facultative", "Facultative")
                ]
            },
            {
                key: "participationPercent",
                label: "Participation %",
                type: "percent"
            },
            {
                key: "retentionPercent",
                label: "Retention %",
                type: "percent"
            },
            {
                key: "cededPercent",
                label: "Ceded %",
                type: "percent"
            },
            {
                key: "reinsuranceCapacity",
                label: "Reinsurance Capacity",
                type: "currency"
            },
            {
                key: "reinsuranceEffectiveDate",
                label: "Effective Date",
                type: "date"
            },
            {
                key: "reinsuranceExpirationDate",
                label: "Expiration Date",
                type: "date"
            }
        ]
    },
    {
        key: "audit-governance",
        title: "Audit & Governance",
        fields: [
            {
                key: "createdBy",
                bind: "createdBy",
                label: "Created By",
                type: "readonly"
            },
            {
                key: "createdDate",
                bind: "createdDate",
                label: "Created Date",
                type: "readonly"
            },
            {
                key: "lastModifiedBy",
                bind: "lastModifiedBy",
                label: "Last Modified By",
                type: "readonly"
            },
            {
                key: "lastModifiedDate",
                bind: "lastModifiedDate",
                label: "Last Modified Date",
                type: "readonly"
            },
            {
                key: "approvalStatus",
                label: "Approval Status",
                type: "select",
                options: [
                    opt("pending", "Pending"),
                    opt("under-review", "Under Review"),
                    opt("approved", "Approved"),
                    opt("rejected", "Rejected")
                ]
            },
            {
                key: "approvedBy",
                label: "Approved By",
                type: "text"
            },
            {
                key: "approvalDate",
                label: "Approval Date",
                type: "date"
            },
            {
                key: "auditHistory",
                label: "Audit History",
                type: "audit-history",
                wide: true
            }
        ]
    },
    {
        key: "product-configuration",
        title: "Product Configuration Authority",
        hint: "Define which Product Studio areas this Risk Carrier can configure, and the permissions granted for each.",
        fields: [
            {
                key: "studioPermissions",
                label: "Studio Permissions",
                type: "studio-permissions",
                wide: true
            }
        ]
    }
];
const cedingCompanySections = [
    {
        key: "ceding-company-information",
        title: "Company Information",
        fields: [
            {
                key: "legalCompanyName",
                bind: "legalName",
                label: "Legal Company Name",
                type: "text",
                required: true,
                placeholder: "Registered legal entity name"
            },
            {
                key: "tradingName",
                label: "Display / Trading Name",
                type: "text",
                placeholder: "Trading / brand name"
            },
            {
                key: "organizationType",
                bind: "type",
                label: "Organization Type",
                type: "readonly",
                required: true
            },
            {
                key: "companyCode",
                bind: "code",
                label: "Company Code",
                type: "readonly",
                required: true,
                help: "Auto-generated from the organization name."
            },
            {
                key: "parentOrganization",
                bind: "parentCompanyName",
                label: "Parent Organization",
                type: "readonly",
                required: true
            },
            {
                key: "companyStatus",
                bind: "status",
                label: "Company Status",
                type: "select",
                required: true,
                options: [
                    opt("active", "Active"),
                    opt("inactive", "Inactive")
                ]
            },
            {
                key: "countryOfIncorporation",
                label: "Country of Incorporation",
                type: "text",
                required: true,
                placeholder: "e.g. United States"
            },
            {
                key: "legalEntityType",
                label: "Legal Entity Type",
                type: "select",
                required: true,
                options: LEGAL_ENTITY_TYPES.map((t)=>opt(t))
            }
        ]
    },
    {
        key: "ceding-regulatory-licensing",
        title: "Regulatory & Licensing",
        fields: [
            {
                key: "licenseNumber",
                label: "Insurance / Reinsurance License Number",
                type: "text",
                required: true,
                placeholder: "e.g. RE-LIC-8821"
            },
            {
                key: "regulator",
                label: "Regulator / Supervisory Authority",
                type: "text",
                required: true,
                placeholder: "e.g. UK PRA"
            },
            {
                key: "naicNumber",
                label: "NAIC Number",
                type: "text",
                placeholder: "e.g. 10008"
            },
            {
                key: "taxId",
                label: "Tax ID / EIN",
                type: "text",
                placeholder: "e.g. 88-7712345"
            },
            {
                key: "authorizedTerritories",
                label: "Licensed / Authorized Territories",
                type: "multiselect",
                ui: "dropdown",
                required: true,
                options: AUTHORIZED_TERRITORIES.map((t)=>opt(t)),
                wide: true
            },
            {
                key: "reinsuranceAuthorizationType",
                label: "Reinsurance Authorization Type",
                type: "select",
                required: true,
                options: REINSURANCE_AUTHORIZATION_TYPES.map((t)=>opt(t))
            }
        ]
    },
    {
        key: "ceding-reinsurance-capability",
        title: "Reinsurance Capability",
        fields: [
            {
                key: "linesOfBusiness",
                label: "Lines of Business",
                type: "multiselect",
                required: true,
                optionsSource: "product-families",
                wide: true
            },
            {
                key: "classesOfBusiness",
                label: "Classes of Business",
                type: "multiselect",
                ui: "dropdown",
                required: true,
                options: CLASSES_OF_BUSINESS.map((c)=>opt(c)),
                wide: true
            },
            {
                key: "riskTypes",
                label: "Risk Types",
                type: "multiselect",
                ui: "dropdown",
                required: true,
                options: RISK_TYPES.map((r)=>opt(r)),
                wide: true
            },
            {
                key: "reinsuranceType",
                label: "Reinsurance Type",
                type: "select",
                required: true,
                options: [
                    opt("treaty", "Treaty Reinsurance"),
                    opt("facultative", "Facultative Reinsurance"),
                    opt("both", "Both (Treaty & Facultative)")
                ]
            },
            {
                key: "supportedCedingCompanies",
                label: "Supported Ceding Companies",
                type: "list",
                wide: true,
                placeholder: "Comma separated, e.g. Southlake, Westkale"
            },
            {
                key: "supportedProducts",
                label: "Supported Products",
                type: "list",
                wide: true,
                placeholder: "Comma separated product names"
            },
            {
                key: "maximumCapacity",
                label: "Maximum Capacity",
                type: "currency",
                placeholder: "e.g. 25,000,000"
            },
            {
                key: "geographicCapacity",
                label: "Geographic Capacity",
                type: "text",
                placeholder: "e.g. US, UK, UAE"
            }
        ]
    },
    {
        key: "ceding-reinsurance-agreements",
        title: "Reinsurance Agreements",
        fields: [
            {
                key: "treatyName",
                label: "Treaty / Agreement Name",
                type: "text",
                placeholder: "e.g. Westlake Trucking Quota Share"
            },
            {
                key: "treatyNumber",
                label: "Treaty / Agreement Number",
                type: "text",
                placeholder: "e.g. TRTY-2026-101"
            },
            {
                key: "effectiveDate",
                label: "Effective Date",
                type: "date"
            },
            {
                key: "expirationDate",
                label: "Expiration Date",
                type: "date"
            },
            {
                key: "participationType",
                label: "Participation Type",
                type: "select",
                required: true,
                options: PARTICIPATION_TYPES.map((p)=>opt(p.key, p.label))
            },
            {
                key: "riskParticipationPercent",
                label: "Risk Participation %",
                type: "percent",
                required: true,
                placeholder: "e.g. 20"
            },
            {
                key: "premiumParticipationPercent",
                label: "Premium Participation %",
                type: "percent",
                placeholder: "e.g. 20"
            },
            {
                key: "limitCapacity",
                label: "Limit / Capacity",
                type: "currency",
                placeholder: "e.g. 50,000,000"
            },
            {
                key: "attachmentPoint",
                label: "Attachment Point",
                type: "currency",
                placeholder: "e.g. 1,000,000"
            },
            {
                key: "reinsuranceCommissionPercent",
                label: "Reinsurance Commission %",
                type: "percent"
            },
            {
                key: "cedingCommissionPercent",
                label: "Ceding Commission %",
                type: "percent"
            },
            {
                key: "minimumPremium",
                label: "Minimum Premium",
                type: "currency"
            },
            {
                key: "maximumPremium",
                label: "Maximum Premium",
                type: "currency"
            }
        ]
    },
    {
        key: "ceding-contacts-settlement",
        title: "Contacts & Settlement",
        fields: [
            {
                key: "registeredAddress",
                label: "Registered Address",
                type: "textarea",
                required: true,
                wide: true,
                placeholder: "Full registered office address"
            },
            {
                key: "mailingAddress",
                label: "Mailing Address",
                type: "textarea",
                wide: true
            },
            {
                key: "primaryContactName",
                bind: "contactName",
                label: "Primary Contact Name",
                type: "text",
                required: true
            },
            {
                key: "primaryContactEmail",
                bind: "contactEmail",
                label: "Email",
                type: "email",
                required: true
            },
            {
                key: "primaryContactPhone",
                bind: "contactPhone",
                label: "Phone",
                type: "tel",
                required: true
            },
            {
                key: "claimsContact",
                label: "Claims Contact",
                type: "text"
            },
            {
                key: "financeContact",
                label: "Finance Contact",
                type: "text"
            },
            {
                key: "settlementCurrency",
                label: "Settlement Currency",
                type: "select",
                required: true,
                options: SETTLEMENT_CURRENCIES.map((c)=>opt(c))
            },
            {
                key: "settlementFrequency",
                label: "Settlement Frequency",
                type: "select",
                required: true,
                options: SETTLEMENT_FREQUENCIES.map((f)=>opt(f))
            },
            {
                key: "paymentTerms",
                label: "Payment Terms",
                type: "text",
                required: true,
                placeholder: "e.g. Net 30"
            },
            {
                key: "bankPaymentDetails",
                label: "Bank / Payment Details",
                type: "textarea",
                wide: true
            },
            {
                key: "accountingReference",
                label: "Accounting Reference",
                type: "text"
            },
            {
                key: "taxTreatment",
                label: "Tax Treatment",
                type: "text"
            }
        ]
    }
];
const brokerSections = [
    {
        key: "broker-information",
        title: "Broker Information",
        fields: [
            {
                key: "name",
                bind: "name",
                label: "Broker Name",
                type: "text",
                required: true,
                placeholder: "e.g. HTI Brokerage"
            },
            {
                key: "legalName",
                bind: "legalName",
                label: "DBA / Legal Name",
                type: "text",
                placeholder: "Registered legal / trading name"
            },
            {
                key: "type",
                bind: "type",
                label: "Organization Type",
                type: "readonly",
                required: true
            },
            {
                key: "authorityType",
                label: "Authority Type",
                type: "select",
                options: AUTHORITY_TYPES
            },
            {
                key: "status",
                bind: "status",
                label: "Status",
                type: "select",
                required: true,
                options: [
                    opt("active", "Active"),
                    opt("inactive", "Inactive")
                ]
            },
            {
                key: "statusReason",
                label: "Status Reason",
                type: "text",
                placeholder: "Reason for the current status"
            },
            {
                key: "taxId",
                label: "Tax ID / EIN",
                type: "text",
                placeholder: "e.g. 88-7712345"
            },
            {
                key: "form1099",
                label: "Form 1099",
                type: "checkbox",
                help: "Enable when a 1099 must be issued to this broker."
            },
            {
                key: "brokerLogo",
                label: "Broker Logo",
                type: "file",
                help: "PNG or SVG. Stored as the file name in this demo."
            }
        ]
    },
    {
        key: "broker-parent-hierarchy",
        title: "Parent / Hierarchy",
        fields: [
            {
                key: "parentOrganization",
                label: "Parent Organization",
                type: "text",
                placeholder: "e.g. Southlake Holdings",
                help: "The parent organization this broker reports into."
            },
            {
                key: "parentBroker",
                label: "Parent Broker",
                type: "select",
                optionsSource: "brokers",
                help: "Select from existing broker organizations in this workspace."
            },
            {
                key: "billToParent",
                label: "Bill to Parent",
                type: "checkbox",
                help: "Bill invoices to the parent broker / organization."
            }
        ]
    },
    {
        key: "broker-licensing-regulatory",
        title: "Licensing & Regulatory",
        fields: [
            {
                key: "licenseNumber",
                label: "License Number",
                type: "text",
                required: true,
                placeholder: "e.g. BRK-LIC-5541"
            },
            {
                key: "licenseType",
                label: "License Type",
                type: "select",
                options: [
                    opt("insurance-agent-license", "Insurance Agent License"),
                    opt("broker-license", "Broker License"),
                    opt("surplus-lines", "Surplus Lines"),
                    opt("mga-license", "MGA License"),
                    opt("other", "Other")
                ]
            },
            {
                key: "licensingAuthority",
                label: "Licensing Authority",
                type: "text",
                placeholder: "e.g. New York Department of Financial Services"
            },
            {
                key: "licenseIssueDate",
                label: "License Issue Date",
                type: "date"
            },
            {
                key: "licenseExpirationDate",
                label: "License Expiration Date",
                type: "date"
            },
            {
                key: "licensedTerritories",
                label: "Licensed States / Territories",
                type: "multiselect",
                ui: "dropdown",
                required: true,
                options: AUTHORIZED_TERRITORIES.map((t)=>opt(t)),
                wide: true
            },
            {
                key: "linesOfBusiness",
                label: "Lines of Business",
                type: "multiselect",
                ui: "dropdown",
                options: LINES_OF_BUSINESS.map((l)=>opt(l)),
                wide: true
            },
            {
                key: "classesOfBusiness",
                label: "Classes of Business",
                type: "multiselect",
                ui: "dropdown",
                options: CLASSES_OF_BUSINESS.map((c)=>opt(c)),
                wide: true
            }
        ]
    },
    {
        key: "broker-contact-address",
        title: "Contact & Address",
        fields: [
            {
                key: "primaryContactName",
                bind: "contactName",
                label: "Primary Contact Name",
                type: "text"
            },
            {
                key: "primaryContactEmail",
                bind: "contactEmail",
                label: "Email",
                type: "email",
                required: true
            },
            {
                key: "phone",
                bind: "contactPhone",
                label: "Phone",
                type: "tel"
            },
            {
                key: "alternatePhone",
                label: "Alternate Phone",
                type: "tel"
            },
            {
                key: "fax",
                label: "Fax",
                type: "tel"
            },
            {
                key: "website",
                label: "Website",
                type: "url",
                placeholder: "https://"
            },
            {
                key: "address1",
                bind: "address",
                label: "Main Address",
                type: "text",
                wide: true,
                required: true,
                placeholder: "Registered / main office address"
            },
            {
                key: "mailingAddress",
                label: "Mailing Address",
                type: "textarea",
                wide: true
            },
            {
                key: "billingAddress",
                label: "Billing Address",
                type: "textarea",
                wide: true
            },
            {
                key: "generalMailboxEmail",
                label: "General Mailbox Email",
                type: "email"
            }
        ]
    },
    {
        key: "broker-contracts-agreements",
        title: "Contract & Agreements",
        fields: [
            {
                key: "contractNumber",
                label: "Contract Number",
                type: "text",
                placeholder: "e.g. BRC-2026-091"
            },
            {
                key: "contractDate",
                label: "Contract Date",
                type: "date"
            },
            {
                key: "effectiveDate",
                label: "Effective Date",
                type: "date"
            },
            {
                key: "terminationDate",
                label: "Termination Date",
                type: "date"
            },
            {
                key: "correspondenceAgreement",
                label: "Correspondence Agreement",
                type: "checkbox",
                help: "Agree to electronic correspondence for notices and renewals."
            },
            {
                key: "emailAgreement",
                label: "Email Agreement",
                type: "checkbox",
                help: "Agree to receive policy documents by email."
            },
            {
                key: "specialAgreements",
                label: "Special Agreements",
                type: "textarea",
                wide: true
            }
        ]
    },
    {
        key: "broker-business-operational",
        title: "Business / Operational",
        fields: [
            {
                key: "numberOfEmployees",
                label: "No. of Employees",
                type: "number",
                placeholder: "e.g. 120"
            },
            {
                key: "brokerGroup",
                label: "Broker Group",
                type: "text",
                placeholder: "e.g. HTI Network"
            },
            {
                key: "brokerGrade",
                label: "Broker Grade",
                type: "select",
                options: [
                    opt("platinum", "Platinum"),
                    opt("gold", "Gold"),
                    opt("silver", "Silver"),
                    opt("standard", "Standard"),
                    opt("provisional", "Provisional")
                ]
            },
            {
                key: "brokerDistrict",
                label: "Broker District",
                type: "text",
                placeholder: "e.g. Northeast"
            },
            {
                key: "informationSystem",
                label: "Information System",
                type: "text",
                placeholder: "e.g. Applied EPIC, Vertafore, TAM"
            },
            {
                key: "primaryOffice",
                label: "Primary Office",
                type: "select",
                options: [
                    opt("head-office", "Head Office"),
                    opt("branch", "Branch"),
                    opt("satellite", "Satellite")
                ]
            },
            {
                key: "coverage",
                label: "Coverage",
                type: "text",
                placeholder: "Markets / capacity this broker covers"
            },
            {
                key: "notes",
                bind: "notes",
                label: "Notes",
                type: "textarea",
                wide: true
            }
        ]
    },
    {
        key: "broker-commission-billing",
        title: "Commission & Billing",
        fields: [
            {
                key: "billingType",
                label: "Billing Type",
                type: "select",
                options: [
                    opt("agency-bill", "Agency Bill"),
                    opt("direct-bill", "Direct Bill"),
                    opt("hybrid", "Hybrid")
                ]
            },
            {
                key: "commissionType",
                label: "Commission Type",
                type: "select",
                options: [
                    opt("flat-percent", "Flat %"),
                    opt("tiered", "Tiered"),
                    opt("flat-fee", "Flat Fee"),
                    opt("effective-rate", "Effective Rate")
                ]
            },
            {
                key: "defaultCommissionPercent",
                label: "Default Commission %",
                type: "percent",
                placeholder: "e.g. 15"
            },
            {
                key: "withholdDirectBillCommission",
                label: "Withhold Direct-Bill Commission",
                type: "checkbox"
            },
            {
                key: "suppressFinanceQuote",
                label: "Suppress Finance Quote",
                type: "checkbox"
            },
            {
                key: "includeOnParentStatement",
                label: "Include on Parent Statement",
                type: "checkbox"
            }
        ]
    },
    {
        key: "broker-product-market-access",
        title: "Product / Market Access",
        hint: "Reference existing Product Studio products, coverages and approved organizations. No new records are created.",
        fields: [
            {
                key: "assignedProducts",
                label: "Assigned Products",
                type: "multiselect",
                ui: "dropdown",
                optionsSource: "products",
                wide: true
            },
            {
                key: "assignedCoverages",
                label: "Assigned Coverages",
                type: "multiselect",
                ui: "dropdown",
                optionsSource: "coverages",
                wide: true
            },
            {
                key: "authorizedRiskCarriers",
                label: "Authorized Risk Carriers",
                type: "multiselect",
                ui: "dropdown",
                optionsSource: "carriers",
                wide: true
            },
            {
                key: "authorizedMgasMgus",
                label: "Authorized MGAs / MGUs",
                type: "multiselect",
                ui: "dropdown",
                optionsSource: "mgas-mgus",
                wide: true
            },
            {
                key: "geographicRestrictions",
                label: "Geographic Restrictions",
                type: "multiselect",
                ui: "dropdown",
                options: AUTHORIZED_TERRITORIES.map((t)=>opt(t)),
                wide: true
            },
            {
                key: "productAccessStatus",
                label: "Product Access Status",
                type: "select",
                options: [
                    opt("active", "Active"),
                    opt("restricted", "Restricted"),
                    opt("disabled", "Disabled")
                ]
            }
        ]
    },
    {
        key: "broker-portal-communication",
        title: "Portal & Communication",
        fields: [
            {
                key: "portalAccess",
                label: "Portal Access",
                type: "select",
                options: [
                    opt("none", "None"),
                    opt("full", "Full Access"),
                    opt("limited", "Limited Access")
                ]
            },
            {
                key: "portalAccessAllUsers",
                label: "Portal Access For All Users",
                type: "checkbox"
            },
            {
                key: "preferredBroker",
                label: "Preferred Broker",
                type: "checkbox",
                help: "Flag as a preferred broker for placements."
            },
            {
                key: "preferredBrokerReason",
                label: "Preferred Broker Reason",
                type: "text"
            },
            {
                key: "policyDelivery",
                label: "Policy Delivery",
                type: "select",
                options: [
                    opt("email", "Email"),
                    opt("portal-download", "Portal Download"),
                    opt("print-courier", "Print / Courier")
                ]
            },
            {
                key: "brokerStatement",
                label: "Broker Statement",
                type: "select",
                options: [
                    opt("monthly", "Monthly"),
                    opt("quarterly", "Quarterly"),
                    opt("annual", "Annual"),
                    opt("none", "None")
                ]
            },
            {
                key: "emailConfiguration",
                label: "Email Configuration",
                type: "text",
                placeholder: "e.g. binding@broker.example.com"
            }
        ]
    }
];
const ORG_FIELD_CONFIG = {
    "risk-company": {
        sections: riskCompanySections
    },
    "risk-carrier": {
        sections: riskCompanySections
    },
    "ceding-company": {
        sections: cedingCompanySections
    },
    broker: {
        sections: brokerSections
    }
};
function orgFieldSections(type) {
    return ORG_FIELD_CONFIG[type]?.sections ?? [];
}
function hasOrgFieldConfig(type) {
    return orgFieldSections(type).length > 0;
}
function orgConfigFields(type) {
    const fields = [];
    for (const section of orgFieldSections(type))fields.push(...section.fields);
    return fields;
}
function orgConfigFieldsWithAuthority(type) {
    const fields = orgConfigFields(type);
    if (isAuthorityTypeTarget(type) && !fields.some((field)=>field.key === AUTHORITY_FIELD.key)) {
        return [
            ...fields,
            AUTHORITY_FIELD
        ];
    }
    return fields;
}
function orgFieldByKey(type, key) {
    return orgConfigFields(type).find((field)=>field.key === key);
}
function configSearchText(config) {
    if (!config || typeof config !== "object") return "";
    const parts = [];
    for (const raw of Object.values(config)){
        if (Array.isArray(raw)) parts.push(raw.join(", "));
        else if (typeof raw === "string") parts.push(raw);
        else if (raw && typeof raw === "object") parts.push(Object.values(raw).flat().join(", "));
    }
    return parts.join(" ");
}
function collectCoverages(workspace) {
    const seen = new Set();
    const out = [];
    for (const [key, value] of Object.entries(workspace.collections)){
        if (!key.endsWith("::covers") || !Array.isArray(value)) continue;
        for (const raw of value){
            if (!raw || typeof raw !== "object") continue;
            const item = raw;
            const id = String(item.id ?? "");
            const name = String(item.name ?? "");
            if (!id || !name || seen.has(id)) continue;
            seen.add(id);
            out.push({
                value: name,
                label: name
            });
        }
    }
    return out;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__09a23_a._.js.map
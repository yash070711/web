(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__1zgni1l._.js",
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[project]/lib/html-pages.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HTML_PAGES",
    ()=>HTML_PAGES,
    "STUDIO_HTML",
    ()=>STUDIO_HTML,
    "getActiveProfile",
    ()=>getActiveProfile,
    "htmlHrefToNext",
    ()=>htmlHrefToNext,
    "profilePrefix",
    ()=>profilePrefix,
    "rewriteAsset",
    ()=>rewriteAsset
]);
const PROFILE_STORAGE_KEY = "ps-profile";
function getActiveProfile() {
    if ("TURBOPACK compile-time truthy", 1) return "vikram";
    //TURBOPACK unreachable
    ;
}
function profilePrefix() {
    return getActiveProfile() === "southlake" ? "/ps-southlake" : "/ps";
}
const HTML_PAGES = {
    dashboard: "index.html",
    catalogue: "catalogue.html",
    jurisdiction: "jurisdiction-studio.html",
    coverage: "coverage-studio.html",
    questionnaire: "questionnaire-studio.html",
    risk: "risk-studio.html",
    eligibility: "eligibility-studio.html",
    rating: "rating-studio.html",
    underwriting: "underwriting-studio.html",
    distribution: "distribution-studio.html",
    "distribution-create": "distribution-create.html",
    document: "document-studio.html",
    simulation: "simulation-studio.html",
    audit: "audit-log.html",
    governance: "governance.html",
    admin: "admin-panel.html",
    "pricing-library": "pricing-library.html",
    integration: "integration-monitor.html",
    roles: "roles-access.html",
    glossary: "glossary.html",
    "product-detail": "product-detail.html",
    "product-view": "product-view.html"
};
const STUDIO_HTML = {
    jurisdiction: "jurisdiction-studio.html",
    coverage: "coverage-studio.html",
    questionnaire: "questionnaire-studio.html",
    risk: "risk-studio.html",
    eligibility: "eligibility-studio.html",
    rating: "rating-studio.html",
    underwriting: "underwriting-studio.html",
    distribution: "distribution-studio.html",
    document: "document-studio.html"
};
function htmlHrefToNext(href, fallbackProductId) {
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return href;
    if (/^(mailto:|tel:)/i.test(href)) return href;
    let file = "";
    let qs;
    try {
        const url = new URL(href, "http://local.invalid/ps/");
        file = (url.pathname.split("/").pop() || "").split("?")[0];
        qs = url.searchParams;
    } catch  {
        return href;
    }
    if (/^https?:/i.test(href) && !file.endsWith(".html")) return href;
    const id = qs.get("product") || qs.get("id") || fallbackProductId || "";
    const version = qs.get("version") || "";
    const rest = new URLSearchParams(qs);
    if (id) {
        rest.set("product", id);
        rest.set("id", id);
    }
    if (version) rest.set("version", version);
    const q = rest.toString();
    const suffix = q ? `?${q}` : "";
    if (file === "index.html" || file === "") return `/dashboard${suffix}`;
    if (file === "catalogue.html") return `/catalogue${suffix}`;
    if (file === "product-detail.html") return id ? `/products/${id}${suffix}` : `/catalogue${suffix}`;
    if (file === "product-view.html") return id ? `/products/${id}/view${suffix}` : `/catalogue${suffix}`;
    if (file === "coverage-studio.html") return id ? `/products/${id}/coverage${suffix}` : `/coverage-studio${suffix}`;
    if (file === "questionnaire-studio.html") return id ? `/products/${id}/questionnaire${suffix}` : `/questionnaire-studio${suffix}`;
    if (file === "risk-studio.html") return id ? `/products/${id}/risk${suffix}` : `/risk-studio${suffix}`;
    if (file === "eligibility-studio.html") return id ? `/products/${id}/eligibility${suffix}` : `/eligibility-studio${suffix}`;
    if (file === "rating-studio.html") return id ? `/products/${id}/rating${suffix}` : `/rating-pricing${suffix}`;
    if (file === "underwriting-studio.html") return id ? `/products/${id}/underwriting${suffix}` : `/underwriting${suffix}`;
    if (file === "distribution-studio.html") return id ? `/products/${id}/distribution${suffix}` : `/distribution${suffix}`;
    if (file === "distribution-create.html") return `/distribution/create${suffix}`;
    if (file === "document-studio.html") return id ? `/products/${id}/document${suffix}` : `/document-studio${suffix}`;
    if (file === "jurisdiction-studio.html") return id ? `/products/${id}/jurisdiction${suffix}` : `/jurisdiction${suffix}`;
    if (file === "simulation-studio.html") return `/simulation${suffix}`;
    if (file === "audit-log.html") return `/audit-log${suffix}`;
    if (file === "governance.html") return `/governance${suffix}`;
    if (file === "admin-panel.html") return `/admin${suffix}`;
    if (file === "pricing-library.html") return `/pricing-library${suffix}`;
    if (file === "integration-monitor.html") return `/integration${suffix}`;
    if (file === "roles-access.html") return `/roles${suffix}`;
    if (file === "glossary.html") return `/glossary${suffix}`;
    return href;
}
function rewriteAsset(url) {
    if (!url) return url;
    if (/^(https?:|data:)/i.test(url)) return url;
    if (url.startsWith("/ps/") || url.startsWith("/ps-southlake/")) return url;
    const prefix = profilePrefix();
    const clean = url.replace(/^\.\//, "").replace(/^\//, "");
    if (clean.startsWith("assets/")) return `${prefix}/${clean}`;
    if (clean.endsWith(".css") || clean.endsWith(".js")) {
        const mapped = `${prefix}/assets/${clean.replace(/^assets\//, "")}`;
        if (mapped.endsWith("nav.js") || mapped.endsWith("prototype-app.js")) return `${mapped}?v=next-routes`;
        return mapped;
    }
    return url;
}
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/html-pages.ts [middleware-edge] (ecmascript)");
;
;
function middleware(request) {
    const { pathname, search } = request.nextUrl;
    if (pathname.startsWith("/ps/") || pathname.startsWith("/ps-southlake/") || pathname.startsWith("/ps-nta/") || pathname.startsWith("/_next/")) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/login/") || pathname.startsWith("/register/")) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/catalogue", request.url));
    }
    if (pathname === "/") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/catalogue", request.url));
    }
    if (pathname.endsWith(".html")) {
        const mapped = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["htmlHrefToNext"])(`${pathname.split("/").pop()}${search}`);
        if (mapped.startsWith("/")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(mapped, request.url));
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__1zgni1l._.js.map
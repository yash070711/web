module.exports = [
"[project]/components/HtmlAppPage.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HtmlAppPage",
    ()=>HtmlAppPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/html-pages.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function patchReady(code) {
    return code.replace(/document\.addEventListener\(\s*(['"])DOMContentLoaded\1\s*,/g, "document.addEventListener($1ps-page-ready$1,").replace(/window\.addEventListener\(\s*(['"])DOMContentLoaded\1\s*,/g, "window.addEventListener($1ps-page-ready$1,");
}
function HtmlAppPage({ file, productId, version }) {
    const host = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const root = host.current;
        if (!root) return;
        let cancelled = false;
        const extras = [];
        let intercept = null;
        if (productId) {
            const u = new URL(window.location.href);
            u.searchParams.set("product", productId);
            u.searchParams.set("id", productId);
            if (version) u.searchParams.set("version", version);
            window.history.replaceState(null, "", `${u.pathname}${u.search}${u.hash}`);
        }
        (async ()=>{
            try {
                const res = await fetch(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["profilePrefix"])()}/${file}`);
                if (!res.ok) throw new Error(`Could not load ${file}`);
                const html = await res.text();
                if (cancelled) return;
                const doc = new DOMParser().parseFromString(html, "text/html");
                doc.querySelectorAll("link[rel='stylesheet']").forEach((link)=>{
                    const href = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rewriteAsset"])(link.getAttribute("href") || "");
                    if (!href || document.querySelector(`link[data-ps-css="${href}"]`)) return;
                    const el = document.createElement("link");
                    el.rel = "stylesheet";
                    el.href = href;
                    el.setAttribute("data-ps-css", href);
                    document.head.appendChild(el);
                    extras.push(el);
                });
                doc.querySelectorAll("style").forEach((style)=>{
                    const el = document.createElement("style");
                    el.setAttribute("data-ps-style", file);
                    el.textContent = style.textContent;
                    document.head.appendChild(el);
                    extras.push(el);
                });
                if (doc.title) document.title = doc.title;
                doc.querySelectorAll("a[href]").forEach((a)=>{
                    const href = a.getAttribute("href") || "";
                    if (href.startsWith("assets/")) a.setAttribute("href", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rewriteAsset"])(href));
                    else a.setAttribute("href", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["htmlHrefToNext"])(href, productId));
                });
                doc.querySelectorAll("script[src], img[src]").forEach((el)=>{
                    const src = el.getAttribute("src");
                    if (src) el.setAttribute("src", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rewriteAsset"])(src));
                });
                const scripts = Array.from(doc.querySelectorAll("script"));
                scripts.forEach((s)=>s.remove());
                root.innerHTML = doc.body.innerHTML;
                const go = (raw)=>{
                    const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["htmlHrefToNext"])(raw, productId);
                    window.location.assign(next.startsWith("/") || next.startsWith("http") ? next : raw);
                };
                intercept = (event)=>{
                    const a = event.target?.closest?.("a[href]");
                    if (!a || a.target === "_blank") return;
                    const href = a.getAttribute("href") || a.href || "";
                    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
                    if (/^(mailto:|tel:)/i.test(href)) return;
                    if (href.includes("/ps/assets/") || href.includes("/ps-southlake/assets/")) return;
                    const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["htmlHrefToNext"])(href, productId);
                    if (!next || next === href) {
                        if (!/\.html(\?|#|$)/i.test(href) && !href.endsWith(".html")) return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    go(href);
                };
                root.addEventListener("click", intercept, true);
                document.addEventListener("click", intercept, true);
                const rewriteAllLinks = ()=>{
                    document.querySelectorAll("a[href]").forEach((a)=>{
                        const href = a.getAttribute("href") || "";
                        if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
                        if (href.startsWith("assets/") || href.includes("/ps/assets/") || href.includes("/ps-southlake/assets/")) return;
                        const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["htmlHrefToNext"])(href, productId);
                        if (next && next !== href) a.setAttribute("href", next);
                    });
                };
                const observer = new MutationObserver(()=>rewriteAllLinks());
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: [
                        "href"
                    ]
                });
                extras.push({
                    remove: ()=>observer.disconnect()
                });
                const boot = document.createElement("script");
                boot.textContent = `window.__PS_HTML_FILE__=${JSON.stringify(file)};`;
                document.body.appendChild(boot);
                extras.push(boot);
                for (const old of scripts){
                    if (cancelled) return;
                    const s = document.createElement("script");
                    const src = old.getAttribute("src");
                    if (src) {
                        const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rewriteAsset"])(src);
                        const jsRes = await fetch(url);
                        if (!jsRes.ok) throw new Error(`Failed ${url}`);
                        s.textContent = patchReady(await jsRes.text());
                        s.setAttribute("data-ps-src", url);
                        document.body.appendChild(s);
                        extras.push(s);
                    } else {
                        s.textContent = patchReady(old.textContent || "");
                        document.body.appendChild(s);
                        extras.push(s);
                    }
                }
                document.dispatchEvent(new Event("ps-page-ready"));
                rewriteAllLinks();
                setTimeout(rewriteAllLinks, 50);
                setTimeout(rewriteAllLinks, 300);
                setTimeout(rewriteAllLinks, 1000);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load page");
            }
        })();
        return ()=>{
            cancelled = true;
            if (intercept) document.removeEventListener("click", intercept, true);
            extras.forEach((el)=>el.remove());
        };
    }, [
        file,
        productId,
        version
    ]);
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "page-inner",
            style: {
                padding: 32
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    children: "Page could not load"
                }, void 0, false, {
                    fileName: "[project]/components/HtmlAppPage.tsx",
                    lineNumber: 159,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: error
                }, void 0, false, {
                    fileName: "[project]/components/HtmlAppPage.tsx",
                    lineNumber: 160,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/HtmlAppPage.tsx",
            lineNumber: 158,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: host,
        id: "ps-html-root"
    }, void 0, false, {
        fileName: "[project]/components/HtmlAppPage.tsx",
        lineNumber: 165,
        columnNumber: 10
    }, this);
}
}),
"[project]/lib/html-pages.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime;
}),
];

//# sourceMappingURL=_00an3e4._.js.map
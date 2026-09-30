(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/HtmlAppPage.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HtmlAppPage",
    ()=>HtmlAppPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/html-pages.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function patchReady(code) {
    return code.replace(/document\.addEventListener\(\s*(['"])DOMContentLoaded\1\s*,/g, "document.addEventListener($1ps-page-ready$1,").replace(/window\.addEventListener\(\s*(['"])DOMContentLoaded\1\s*,/g, "window.addEventListener($1ps-page-ready$1,");
}
function HtmlAppPage({ file, productId, version }) {
    _s();
    const host = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HtmlAppPage.useEffect": ()=>{
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
            ({
                "HtmlAppPage.useEffect": async ()=>{
                    try {
                        const res = await fetch(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["profilePrefix"])()}/${file}`);
                        if (!res.ok) throw new Error(`Could not load ${file}`);
                        const html = await res.text();
                        if (cancelled) return;
                        const doc = new DOMParser().parseFromString(html, "text/html");
                        doc.querySelectorAll("link[rel='stylesheet']").forEach({
                            "HtmlAppPage.useEffect": (link)=>{
                                const href = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rewriteAsset"])(link.getAttribute("href") || "");
                                if (!href || document.querySelector(`link[data-ps-css="${href}"]`)) return;
                                const el = document.createElement("link");
                                el.rel = "stylesheet";
                                el.href = href;
                                el.setAttribute("data-ps-css", href);
                                document.head.appendChild(el);
                                extras.push(el);
                            }
                        }["HtmlAppPage.useEffect"]);
                        doc.querySelectorAll("style").forEach({
                            "HtmlAppPage.useEffect": (style)=>{
                                const el = document.createElement("style");
                                el.setAttribute("data-ps-style", file);
                                el.textContent = style.textContent;
                                document.head.appendChild(el);
                                extras.push(el);
                            }
                        }["HtmlAppPage.useEffect"]);
                        if (doc.title) document.title = doc.title;
                        doc.querySelectorAll("a[href]").forEach({
                            "HtmlAppPage.useEffect": (a)=>{
                                const href = a.getAttribute("href") || "";
                                if (href.startsWith("assets/")) a.setAttribute("href", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rewriteAsset"])(href));
                                else a.setAttribute("href", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["htmlHrefToNext"])(href, productId));
                            }
                        }["HtmlAppPage.useEffect"]);
                        doc.querySelectorAll("script[src], img[src]").forEach({
                            "HtmlAppPage.useEffect": (el)=>{
                                const src = el.getAttribute("src");
                                if (src) el.setAttribute("src", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rewriteAsset"])(src));
                            }
                        }["HtmlAppPage.useEffect"]);
                        const scripts = Array.from(doc.querySelectorAll("script"));
                        scripts.forEach({
                            "HtmlAppPage.useEffect": (s)=>s.remove()
                        }["HtmlAppPage.useEffect"]);
                        root.innerHTML = doc.body.innerHTML;
                        const go = {
                            "HtmlAppPage.useEffect.go": (raw)=>{
                                const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["htmlHrefToNext"])(raw, productId);
                                window.location.assign(next.startsWith("/") || next.startsWith("http") ? next : raw);
                            }
                        }["HtmlAppPage.useEffect.go"];
                        intercept = ({
                            "HtmlAppPage.useEffect": (event)=>{
                                const a = event.target?.closest?.("a[href]");
                                if (!a || a.target === "_blank") return;
                                const href = a.getAttribute("href") || a.href || "";
                                if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
                                if (/^(mailto:|tel:)/i.test(href)) return;
                                if (href.includes("/ps/assets/") || href.includes("/ps-southlake/assets/")) return;
                                const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["htmlHrefToNext"])(href, productId);
                                if (!next || next === href) {
                                    if (!/\.html(\?|#|$)/i.test(href) && !href.endsWith(".html")) return;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                                go(href);
                            }
                        })["HtmlAppPage.useEffect"];
                        root.addEventListener("click", intercept, true);
                        document.addEventListener("click", intercept, true);
                        const rewriteAllLinks = {
                            "HtmlAppPage.useEffect.rewriteAllLinks": ()=>{
                                document.querySelectorAll("a[href]").forEach({
                                    "HtmlAppPage.useEffect.rewriteAllLinks": (a)=>{
                                        const href = a.getAttribute("href") || "";
                                        if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
                                        if (href.startsWith("assets/") || href.includes("/ps/assets/") || href.includes("/ps-southlake/assets/")) return;
                                        const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["htmlHrefToNext"])(href, productId);
                                        if (next && next !== href) a.setAttribute("href", next);
                                    }
                                }["HtmlAppPage.useEffect.rewriteAllLinks"]);
                            }
                        }["HtmlAppPage.useEffect.rewriteAllLinks"];
                        const observer = new MutationObserver({
                            "HtmlAppPage.useEffect": ()=>rewriteAllLinks()
                        }["HtmlAppPage.useEffect"]);
                        observer.observe(document.body, {
                            childList: true,
                            subtree: true,
                            attributes: true,
                            attributeFilter: [
                                "href"
                            ]
                        });
                        extras.push({
                            remove: {
                                "HtmlAppPage.useEffect": ()=>observer.disconnect()
                            }["HtmlAppPage.useEffect"]
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
                                const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$html$2d$pages$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rewriteAsset"])(src);
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
                }
            })["HtmlAppPage.useEffect"]();
            return ({
                "HtmlAppPage.useEffect": ()=>{
                    cancelled = true;
                    if (intercept) document.removeEventListener("click", intercept, true);
                    extras.forEach({
                        "HtmlAppPage.useEffect": (el)=>el.remove()
                    }["HtmlAppPage.useEffect"]);
                }
            })["HtmlAppPage.useEffect"];
        }
    }["HtmlAppPage.useEffect"], [
        file,
        productId,
        version
    ]);
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "page-inner",
            style: {
                padding: 32
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    children: "Page could not load"
                }, void 0, false, {
                    fileName: "[project]/components/HtmlAppPage.tsx",
                    lineNumber: 159,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: host,
        id: "ps-html-root"
    }, void 0, false, {
        fileName: "[project]/components/HtmlAppPage.tsx",
        lineNumber: 165,
        columnNumber: 10
    }, this);
}
_s(HtmlAppPage, "Hak7ToDsLolFt30YhM/ffSyKarY=");
_c = HtmlAppPage;
var _c;
__turbopack_context__.k.register(_c, "HtmlAppPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/html-pages.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return window.localStorage.getItem(PROFILE_STORAGE_KEY) === "southlake" ? "southlake" : "vikram";
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=_1ok2mzf._.js.map
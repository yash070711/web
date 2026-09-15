"use client";

import { useEffect, useRef, useState } from "react";
import { htmlHrefToNext, profilePrefix, rewriteAsset } from "@/lib/html-pages";

function patchReady(code: string) {
  return code
    .replace(/document\.addEventListener\(\s*(['"])DOMContentLoaded\1\s*,/g, "document.addEventListener($1ps-page-ready$1,")
    .replace(/window\.addEventListener\(\s*(['"])DOMContentLoaded\1\s*,/g, "window.addEventListener($1ps-page-ready$1,");
}

export function HtmlAppPage({
  file,
  productId,
  version,
}: {
  file: string;
  productId?: string;
  version?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let cancelled = false;
    const extras: HTMLElement[] = [];
    let intercept: ((event: Event) => void) | null = null;

    if (productId) {
      const u = new URL(window.location.href);
      u.searchParams.set("product", productId);
      u.searchParams.set("id", productId);
      if (version) u.searchParams.set("version", version);
      window.history.replaceState(null, "", `${u.pathname}${u.search}${u.hash}`);
    }

    (async () => {
      try {
        const res = await fetch(`${profilePrefix()}/${file}`);
        if (!res.ok) throw new Error(`Could not load ${file}`);
        const html = await res.text();
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(html, "text/html");

        doc.querySelectorAll("link[rel='stylesheet']").forEach((link) => {
          const href = rewriteAsset(link.getAttribute("href") || "");
          if (!href || document.querySelector(`link[data-ps-css="${href}"]`)) return;
          const el = document.createElement("link");
          el.rel = "stylesheet";
          el.href = href;
          el.setAttribute("data-ps-css", href);
          document.head.appendChild(el);
          extras.push(el);
        });
        doc.querySelectorAll("style").forEach((style) => {
          const el = document.createElement("style");
          el.setAttribute("data-ps-style", file);
          el.textContent = style.textContent;
          document.head.appendChild(el);
          extras.push(el);
        });
        if (doc.title) document.title = doc.title;

        doc.querySelectorAll("a[href]").forEach((a) => {
          const href = a.getAttribute("href") || "";
          if (href.startsWith("assets/")) a.setAttribute("href", rewriteAsset(href));
          else a.setAttribute("href", htmlHrefToNext(href, productId));
        });
        doc.querySelectorAll("script[src], img[src]").forEach((el) => {
          const src = el.getAttribute("src");
          if (src) el.setAttribute("src", rewriteAsset(src));
        });

        const scripts = Array.from(doc.querySelectorAll("script"));
        scripts.forEach((s) => s.remove());
        root.innerHTML = doc.body.innerHTML;

        const go = (raw: string) => {
          const next = htmlHrefToNext(raw, productId);
          window.location.assign(next.startsWith("/") || next.startsWith("http") ? next : raw);
        };

        intercept = (event: Event) => {
          const a = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
          if (!a || a.target === "_blank") return;
          const href = a.getAttribute("href") || a.href || "";
          if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
          if (/^(mailto:|tel:)/i.test(href)) return;
          if (href.includes("/ps/assets/") || href.includes("/ps-southlake/assets/")) return;
          const next = htmlHrefToNext(href, productId);
          if (!next || next === href) {
            if (!/\.html(\?|#|$)/i.test(href) && !href.endsWith(".html")) return;
          }
          event.preventDefault();
          event.stopPropagation();
          go(href);
        };
        root.addEventListener("click", intercept, true);
        document.addEventListener("click", intercept, true);

        const rewriteAllLinks = () => {
          document.querySelectorAll("a[href]").forEach((a) => {
            const href = a.getAttribute("href") || "";
            if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
            if (href.startsWith("assets/") || href.includes("/ps/assets/") || href.includes("/ps-southlake/assets/")) return;
            const next = htmlHrefToNext(href, productId);
            if (next && next !== href) a.setAttribute("href", next);
          });
        };
        const observer = new MutationObserver(() => rewriteAllLinks());
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
        extras.push({ remove: () => observer.disconnect() } as HTMLElement);

        const boot = document.createElement("script");
        boot.textContent = `window.__PS_HTML_FILE__=${JSON.stringify(file)};`;
        document.body.appendChild(boot);
        extras.push(boot);

        for (const old of scripts) {
          if (cancelled) return;
          const s = document.createElement("script");
          const src = old.getAttribute("src");
          if (src) {
            const url = rewriteAsset(src);
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

    return () => {
      cancelled = true;
      if (intercept) document.removeEventListener("click", intercept, true);
      extras.forEach((el) => el.remove());
    };
  }, [file, productId, version]);

  if (error) {
    return (
      <div className="page-inner" style={{ padding: 32 }}>
        <h1>Page could not load</h1>
        <p>{error}</p>
      </div>
    );
  }

  return <div ref={host} id="ps-html-root" />;
}

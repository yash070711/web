import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { htmlHrefToNext } from "@/lib/html-pages";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/ps/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }
  if (pathname === "/register" || pathname.startsWith("/register/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname.endsWith(".html")) {
    const mapped = htmlHrefToNext(`${pathname.split("/").pop()}${search}`);
    if (mapped.startsWith("/")) {
      return NextResponse.redirect(new URL(mapped, request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
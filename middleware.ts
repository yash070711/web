import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { htmlHrefToNext } from "@/lib/html-pages";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/ps/") || pathname.startsWith("/ps-southlake/") || pathname.startsWith("/ps-nta/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }
  if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/login/") || pathname.startsWith("/register/")) {
    return NextResponse.redirect(new URL("/catalogue", request.url));
  }
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/catalogue", request.url));
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

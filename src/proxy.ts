import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

// /api/test is the E2E auth-bypass endpoint — it has its own internal guards
// (NODE_ENV + secret check, see src/app/api/test/login/route.ts) that make it
// a no-op everywhere except local/test runs; exempting it here only lets an
// unauthenticated request reach those guards instead of bouncing to /login.
const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth", "/api/test"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|ico|webp|woff2?)$/.test(pathname);

  if (!req.auth && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users with no university set to onboarding
  // (skip: already on onboarding, API routes, or public paths)
  if (
    req.auth &&
    !req.auth.user?.universityId &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/api/") &&
    !isPublic
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

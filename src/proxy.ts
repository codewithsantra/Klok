import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = "daylog_session";

const PROTECTED_PATHS = [
  "/dashboard",
  "/today",
  "/analytics",
  "/templates",
  "/recurring-blocks",
  "/settings",
  "/onboarding",
];

const AUTH_PATHS = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Check if session is valid
  let isLoggedIn = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      isLoggedIn = true;
    } catch {
      isLoggedIn = false;
    }
  }

  // Block unauthenticated access to protected routes
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Redirect logged-in users away from auth pages
  if (AUTH_PATHS.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next static files
     * - favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

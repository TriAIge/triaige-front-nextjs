import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "triaige_session";

/** Presence check only; route handlers validate the session against the database. */
export function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") return NextResponse.next();
  if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/portal/:path*", "/redefinir-senha"],
};

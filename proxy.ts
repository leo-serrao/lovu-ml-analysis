import { NextResponse, type NextRequest } from "next/server";

const UNAUTHORIZED_RESPONSE = () =>
  new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Lovu Market Intelligence"' },
  });

/**
 * Protects the panel with HTTP Basic Auth (PANEL-04). Fails closed: if the
 * credentials env vars aren't set, every request is rejected rather than
 * silently letting the panel through unprotected.
 */
export function proxy(request: NextRequest): NextResponse {
  const expectedUser = process.env.PANEL_BASIC_AUTH_USER;
  const expectedPassword = process.env.PANEL_BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    console.error("PANEL_BASIC_AUTH_USER/PASSWORD not configured; denying panel access");
    return UNAUTHORIZED_RESPONSE();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (user === expectedUser && password === expectedPassword) {
      return NextResponse.next();
    }
  }

  return UNAUTHORIZED_RESPONSE();
}

export const config = {
  // Everything except the ML OAuth callback (must stay open for the redirect
  // from Mercado Livre) and Next's own static/internal assets.
  matcher: ["/((?!api/ml-auth|_next/static|_next/image|favicon.ico).*)"],
};

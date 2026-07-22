import { NextRequest, NextResponse } from "next/server";

/**
 * Stub for the Mercado Livre OAuth redirect URI (T1.5).
 * Exists early so a stable HTTPS URL can be registered with the ML app.
 * Real token exchange + Vault storage lands in T5.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  console.log("[ml-auth/callback] received code:", code);

  return NextResponse.json({ received: true, code });
}

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, storeTokens } from "@/lib/ml/oauth";

/**
 * Mercado Livre OAuth redirect URI. Exchanges the authorization code for
 * access/refresh tokens and persists them in Supabase Vault.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "missing code" }, { status: 400 });
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  const redirectUri = process.env.ML_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("[ml-auth/callback] missing ML OAuth env vars");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  try {
    const tokens = await exchangeCodeForToken({ code, clientId, clientSecret, redirectUri });
    await storeTokens(tokens, new Date());

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[ml-auth/callback] token exchange failed:", error);
    return NextResponse.json({ error: "token exchange failed" }, { status: 502 });
  }
}

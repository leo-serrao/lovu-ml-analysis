import { createClient } from "@supabase/supabase-js";

export interface MlTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  scope: string | null;
  userId: number | null;
}

export class MlOAuthError extends Error {}

/**
 * Parses and validates the raw JSON body from ML's /oauth/token endpoint.
 * Throws MlOAuthError if required fields are missing or malformed.
 */
export function parseTokenExchangeResponse(raw: unknown): MlTokenResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new MlOAuthError("token exchange response is not an object");
  }

  const body = raw as Record<string, unknown>;

  if (typeof body.access_token !== "string" || body.access_token.length === 0) {
    throw new MlOAuthError("token exchange response missing access_token");
  }
  if (typeof body.refresh_token !== "string" || body.refresh_token.length === 0) {
    throw new MlOAuthError("token exchange response missing refresh_token");
  }
  if (typeof body.expires_in !== "number" || !Number.isFinite(body.expires_in)) {
    throw new MlOAuthError("token exchange response missing expires_in");
  }

  return {
    accessToken: body.access_token,
    tokenType: typeof body.token_type === "string" ? body.token_type : "bearer",
    expiresIn: body.expires_in,
    refreshToken: body.refresh_token,
    scope: typeof body.scope === "string" ? body.scope : null,
    userId: typeof body.user_id === "number" ? body.user_id : null,
  };
}

/** Computes the ISO expiry timestamp from an issuance instant + expires_in seconds. */
export function computeExpiresAt(issuedAt: Date, expiresIn: number): string {
  return new Date(issuedAt.getTime() + expiresIn * 1000).toISOString();
}

export interface ExchangeCodeParams {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/** Exchanges an authorization code for tokens via ML's /oauth/token endpoint. */
export async function exchangeCodeForToken(
  params: ExchangeCodeParams,
): Promise<MlTokenResponse> {
  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new MlOAuthError(
      `token exchange failed with status ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return parseTokenExchangeResponse(json);
}

/**
 * Persists tokens to Supabase Vault via the ml_auth_set_secret RPC (see
 * supabase/migrations/0003_ml_auth_vault.sql). Called at request time from the
 * callback route with an issuance instant of "now".
 */
export async function storeTokens(tokens: MlTokenResponse, issuedAt: Date): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new MlOAuthError("missing Supabase service-role env vars");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const expiresAt = computeExpiresAt(issuedAt, tokens.expiresIn);

  const secrets: Array<[string, string]> = [
    ["ml_access_token", tokens.accessToken],
    ["ml_refresh_token", tokens.refreshToken],
    ["ml_token_expires_at", expiresAt],
  ];

  for (const [name, value] of secrets) {
    const { error } = await supabase.rpc("ml_auth_set_secret", {
      secret_name: name,
      secret_value: value,
    });
    if (error) {
      throw new MlOAuthError(`failed to persist secret ${name}: ${error.message}`);
    }
  }
}

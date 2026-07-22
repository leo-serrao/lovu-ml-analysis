import { createClient } from "@supabase/supabase-js";
import {
  computeExpiresAt,
  MlOAuthError,
  parseTokenExchangeResponse,
  type MlTokenResponse,
} from "./oauth";

export interface RefreshTokenParams {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

/** Exchanges a refresh token for a new access + refresh token pair via ML's /oauth/token endpoint. */
export async function refreshAccessToken(
  params: RefreshTokenParams,
  fetchFn: typeof fetch = fetch,
): Promise<MlTokenResponse> {
  const response = await fetchFn("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: params.clientId,
      client_secret: params.clientSecret,
      refresh_token: params.refreshToken,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new MlOAuthError(
      `token refresh failed with status ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return parseTokenExchangeResponse(json);
}

export interface SecretStore {
  getSecret(name: string): Promise<string>;
  setSecret(name: string, value: string): Promise<void>;
}

/** SecretStore backed by Supabase Vault via the ml_auth_get_secret/ml_auth_set_secret RPCs. */
export function createVaultSecretStore(): SecretStore {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new MlOAuthError("missing Supabase service-role env vars");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  return {
    async getSecret(name) {
      const { data, error } = await supabase.rpc("ml_auth_get_secret", { secret_name: name });
      if (error) {
        throw new MlOAuthError(`failed to read ${name}: ${error.message}`);
      }
      if (typeof data !== "string" || data.length === 0) {
        throw new MlOAuthError(`no ${name} found in Vault`);
      }
      return data;
    },
    async setSecret(name, value) {
      const { error } = await supabase.rpc("ml_auth_set_secret", {
        secret_name: name,
        secret_value: value,
      });
      if (error) {
        throw new MlOAuthError(`failed to persist secret ${name}: ${error.message}`);
      }
    },
  };
}

export interface GetAccessTokenParams {
  clientId: string;
  clientSecret: string;
  vault: SecretStore;
  fetchFn?: typeof fetch;
  now?: () => Date;
}

/**
 * Always refreshes (weekly cadence > 6h access token lifetime), rotates and
 * re-persists the refresh_token returned by ML, and returns the fresh access token.
 */
export async function getAccessToken(params: GetAccessTokenParams): Promise<string> {
  const { clientId, clientSecret, vault, fetchFn = fetch, now = () => new Date() } = params;

  const currentRefreshToken = await vault.getSecret("ml_refresh_token");
  const tokens = await refreshAccessToken(
    { refreshToken: currentRefreshToken, clientId, clientSecret },
    fetchFn,
  );
  const expiresAt = computeExpiresAt(now(), tokens.expiresIn);

  await vault.setSecret("ml_access_token", tokens.accessToken);
  await vault.setSecret("ml_refresh_token", tokens.refreshToken);
  await vault.setSecret("ml_token_expires_at", expiresAt);

  return tokens.accessToken;
}

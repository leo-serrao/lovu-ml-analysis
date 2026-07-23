import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class ReadClientError extends Error {}

/**
 * Server-only Supabase client for the panel. Uses the service_role key because
 * the panel data isn't publicly readable (see 0004_grants.sql) and the panel has
 * no user auth of its own -- access control is HTTP Basic Auth at the edge (T14).
 * Never import this into a Client Component.
 */
export function createSupabaseReadClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new ReadClientError("missing Supabase service-role env vars");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export interface TrendCategoryRow {
  id: string;
  label: string;
  active: boolean;
}

/** Active tracked categories (config, from trend_categories). */
export async function getTrackedCategories(
  client: SupabaseClient,
): Promise<TrendCategoryRow[]> {
  const { data, error } = await client
    .from("trend_categories")
    .select("id, label, active")
    .eq("active", true)
    .order("label");

  if (error) {
    throw new ReadClientError(`failed to load tracked categories: ${error.message}`);
  }

  return data ?? [];
}

export interface LatestTrendSnapshotRow {
  run_id: string;
  category_id: string;
  keyword: string;
  trend_type: "rising" | "most_wanted" | "popular";
  position: number;
  captured_at: string;
}

/** All trend types for the most recent run, per category (v_latest_trend_snapshots). */
export async function getLatestTrendSnapshots(
  client: SupabaseClient,
): Promise<LatestTrendSnapshotRow[]> {
  const { data, error } = await client
    .from("v_latest_trend_snapshots")
    .select("run_id, category_id, keyword, trend_type, position, captured_at");

  if (error) {
    throw new ReadClientError(`failed to load latest trend snapshots: ${error.message}`);
  }

  return data ?? [];
}

export interface TrendTermHistoryRow {
  category_id: string;
  keyword: string;
  run_id: string;
  started_at: string;
  trend_type: "rising" | "most_wanted" | "popular";
  position: number;
}

/** Cross-run history per category + keyword (v_trend_term_history), for movement display. */
export async function getTrendTermHistory(
  client: SupabaseClient,
): Promise<TrendTermHistoryRow[]> {
  const { data, error } = await client
    .from("v_trend_term_history")
    .select("category_id, keyword, run_id, started_at, trend_type, position");

  if (error) {
    throw new ReadClientError(`failed to load trend term history: ${error.message}`);
  }

  return data ?? [];
}

/** Number of finished collection runs -- drives the single-run fallback (spec P1 AC2). */
export async function getRunCount(client: SupabaseClient): Promise<number> {
  const { count, error } = await client
    .from("collection_runs")
    .select("id", { count: "exact", head: true })
    .in("status", ["complete", "partial"]);

  if (error) {
    throw new ReadClientError(`failed to count collection runs: ${error.message}`);
  }

  return count ?? 0;
}

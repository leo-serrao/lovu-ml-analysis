-- SPEC_DEVIATION: not an originally listed T5 file.
-- Reason: Supabase Vault (vault.create_secret / vault.decrypted_secrets) is not exposed
-- via PostgREST by design. These SECURITY DEFINER wrappers are the minimum surface needed
-- for the panel app (using the service-role supabase-js client) to persist/read ML OAuth
-- tokens in Vault at request time, per design.md's Vault decision.

create or replace function ml_auth_set_secret(secret_name text, secret_value text)
returns void
language plpgsql
security definer
set search_path = vault, public
as $$
declare
  existing_id uuid;
begin
  select id into existing_id from vault.secrets where name = secret_name;

  if existing_id is null then
    perform vault.create_secret(secret_value, secret_name);
  else
    perform vault.update_secret(existing_id, secret_value);
  end if;
end;
$$;

create or replace function ml_auth_get_secret(secret_name text)
returns text
language sql
security definer
set search_path = vault, public
as $$
  select decrypted_secret from vault.decrypted_secrets where name = secret_name limit 1;
$$;

revoke all on function ml_auth_set_secret(text, text) from public, anon, authenticated;
revoke all on function ml_auth_get_secret(text) from public, anon, authenticated;
grant execute on function ml_auth_set_secret(text, text) to service_role;
grant execute on function ml_auth_get_secret(text) to service_role;

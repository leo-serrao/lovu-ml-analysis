-- Market Intelligence MVP: service_role table/view grants
-- Discovered during T10 smoke test: service_role had no SELECT/INSERT/UPDATE/DELETE
-- on any public table/view (only TRUNCATE/REFERENCES/TRIGGER), project-wide. T5/T6
-- didn't surface this because Vault access goes through SECURITY DEFINER RPCs, and
-- other verification ran as postgres (superuser) via execute_sql, not through PostgREST.

grant select, insert, update, delete on all tables in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

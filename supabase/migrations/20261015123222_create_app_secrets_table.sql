/*
# Create app_secrets table for storing API keys

1. New Tables
- `app_secrets` — stores app-level secrets like API keys
  - `id` (uuid, primary key)
  - `key_name` (text, unique) — name of the secret
  - `key_value` (text) — the secret value

2. Security
- Enable RLS on `app_secrets`.
- Deny access to anon and authenticated — only service role can read (used by edge functions).
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- No policies = deny all access to anon/authenticated. Only service_role bypasses RLS.

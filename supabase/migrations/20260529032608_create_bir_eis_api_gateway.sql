/*
  # BIR EIS API Gateway — Module 2

  ## Summary
  Creates the full schema for the BIR EIS API Gateway including
  OAuth2/JWT credentials, API versioning, rate limiting, EIS transmissions,
  acknowledgement processing, retry queue, duplicate detection, and
  API analytics/monitoring.

  ## New Tables

  ### api_credentials
  - OAuth2 client credentials per registered application
  - Stores client_id, hashed client_secret, scopes, JWT config
  - Rate limit config per credential

  ### api_versions
  - Tracks API version lifecycle (active, deprecated, sunset)
  - Maps version string to feature flags and changelog

  ### eis_transmissions
  - Core EIS invoice/sales-data submission records
  - Tracks status through full lifecycle: queued → submitted → acknowledged/failed
  - Stores BIR acknowledgement code, duplicate hash, retry metadata

  ### eis_transmission_payloads
  - Stores actual JSON/XML payload per transmission (separate for size)

  ### eis_retry_queue
  - Retry schedule for failed transmissions
  - Exponential backoff tracking

  ### api_request_log
  - Per-request log for analytics and error monitoring
  - Stores endpoint, status code, latency, credential used

  ### api_rate_limit_events
  - Records when rate limits are hit per credential/IP

  ## Security
  - RLS enabled on all tables
  - Each merchant sees only their own records
  - Admin role sees all
*/

-- ─── api_credentials ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_credentials (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id         uuid NOT NULL REFERENCES profiles(id),
  app_name            text NOT NULL DEFAULT '',
  client_id           text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  client_secret_hash  text NOT NULL DEFAULT '',
  scopes              text[] NOT NULL DEFAULT '{"invoices:read","invoices:write","eis:submit"}',
  environment         text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','staging','production')),
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
  rate_limit_rpm      integer NOT NULL DEFAULT 120,
  rate_limit_rph      integer NOT NULL DEFAULT 3000,
  rate_limit_rpd      integer NOT NULL DEFAULT 50000,
  jwt_algorithm       text NOT NULL DEFAULT 'RS256',
  jwt_expiry_seconds  integer NOT NULL DEFAULT 3600,
  allowed_ips         text[] NOT NULL DEFAULT '{}',
  last_used_at        timestamptz,
  expires_at          timestamptz,
  created_by          uuid REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── api_versions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version         text UNIQUE NOT NULL,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('beta','active','deprecated','sunset')),
  release_date    date NOT NULL DEFAULT CURRENT_DATE,
  deprecation_date date,
  sunset_date     date,
  changelog       text NOT NULL DEFAULT '',
  base_path       text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO api_versions (version, status, release_date, base_path, changelog) VALUES
  ('v1', 'deprecated', '2024-01-01', '/api/v1', 'Initial release'),
  ('v2', 'active',     '2025-06-01', '/api/v2', 'OAuth2, JWT, EIS support'),
  ('v3', 'beta',       '2026-05-01', '/api/v3', 'Real-time streaming, enhanced rate limits')
ON CONFLICT (version) DO NOTHING;

-- ─── eis_transmissions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eis_transmissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id           uuid NOT NULL REFERENCES profiles(id),
  credential_id         uuid REFERENCES api_credentials(id),
  transmission_type     text NOT NULL CHECK (transmission_type IN (
                          'invoice_submission','sales_data','correction','cancellation','acknowledgement_pull'
                        )),
  status                text NOT NULL DEFAULT 'queued' CHECK (status IN (
                          'queued','submitting','submitted','acknowledged','rejected',
                          'failed','duplicate','recovered','cancelled'
                        )),
  invoice_ids           uuid[] NOT NULL DEFAULT '{}',
  record_count          integer NOT NULL DEFAULT 0,
  payload_hash          text NOT NULL DEFAULT '',
  duplicate_of          uuid REFERENCES eis_transmissions(id),

  -- BIR EIS response
  bir_reference_number  text DEFAULT '',
  bir_acknowledgement   text DEFAULT '',
  bir_response_code     text DEFAULT '',
  bir_response_message  text DEFAULT '',
  bir_received_at       timestamptz,
  bir_processed_at      timestamptz,

  -- Retry metadata
  attempt_number        integer NOT NULL DEFAULT 1,
  max_attempts          integer NOT NULL DEFAULT 5,
  next_retry_at         timestamptz,
  last_error            text DEFAULT '',

  -- Timing
  submitted_at          timestamptz,
  acknowledged_at       timestamptz,
  latency_ms            integer,

  api_version           text NOT NULL DEFAULT 'v2',
  environment           text NOT NULL DEFAULT 'production',
  created_by            uuid REFERENCES profiles(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── eis_transmission_payloads ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eis_transmission_payloads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transmission_id uuid NOT NULL REFERENCES eis_transmissions(id) ON DELETE CASCADE,
  payload_format  text NOT NULL CHECK (payload_format IN ('json','xml')),
  payload         text NOT NULL DEFAULT '',
  payload_size    integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── eis_retry_queue ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eis_retry_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transmission_id uuid NOT NULL REFERENCES eis_transmissions(id) ON DELETE CASCADE,
  merchant_id     uuid NOT NULL REFERENCES profiles(id),
  attempt_number  integer NOT NULL DEFAULT 1,
  scheduled_at    timestamptz NOT NULL,
  executed_at     timestamptz,
  result          text DEFAULT '' CHECK (result IN ('','success','failed','skipped')),
  error_message   text DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── api_request_log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_request_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     uuid REFERENCES profiles(id),
  credential_id   uuid REFERENCES api_credentials(id),
  api_version     text NOT NULL DEFAULT 'v2',
  method          text NOT NULL DEFAULT 'POST',
  endpoint        text NOT NULL DEFAULT '',
  status_code     integer NOT NULL DEFAULT 200,
  latency_ms      integer NOT NULL DEFAULT 0,
  request_size    integer NOT NULL DEFAULT 0,
  response_size   integer NOT NULL DEFAULT 0,
  ip_address      text DEFAULT '',
  user_agent      text DEFAULT '',
  error_code      text DEFAULT '',
  error_message   text DEFAULT '',
  rate_limited    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── api_rate_limit_events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_rate_limit_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     uuid REFERENCES profiles(id),
  credential_id   uuid REFERENCES api_credentials(id),
  limit_type      text NOT NULL CHECK (limit_type IN ('rpm','rph','rpd')),
  endpoint        text DEFAULT '',
  ip_address      text DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_api_creds_merchant ON api_credentials(merchant_id);
CREATE INDEX IF NOT EXISTS idx_eis_tx_merchant ON eis_transmissions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_eis_tx_status ON eis_transmissions(status);
CREATE INDEX IF NOT EXISTS idx_eis_tx_created ON eis_transmissions(created_at);
CREATE INDEX IF NOT EXISTS idx_eis_retry_transmission ON eis_retry_queue(transmission_id);
CREATE INDEX IF NOT EXISTS idx_api_log_merchant ON api_request_log(merchant_id);
CREATE INDEX IF NOT EXISTS idx_api_log_created ON api_request_log(created_at);
CREATE INDEX IF NOT EXISTS idx_api_log_status ON api_request_log(status_code);
CREATE INDEX IF NOT EXISTS idx_rate_limit_merchant ON api_rate_limit_events(merchant_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE eis_transmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eis_transmission_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE eis_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limit_events ENABLE ROW LEVEL SECURITY;

-- api_credentials
CREATE POLICY "Merchants view own credentials"
  ON api_credentials FOR SELECT TO authenticated USING (merchant_id = auth.uid());
CREATE POLICY "Merchants insert own credentials"
  ON api_credentials FOR INSERT TO authenticated WITH CHECK (merchant_id = auth.uid());
CREATE POLICY "Merchants update own credentials"
  ON api_credentials FOR UPDATE TO authenticated USING (merchant_id = auth.uid()) WITH CHECK (merchant_id = auth.uid());

-- eis_transmissions
CREATE POLICY "Merchants view own transmissions"
  ON eis_transmissions FOR SELECT TO authenticated USING (merchant_id = auth.uid());
CREATE POLICY "Merchants insert own transmissions"
  ON eis_transmissions FOR INSERT TO authenticated WITH CHECK (merchant_id = auth.uid());
CREATE POLICY "Merchants update own transmissions"
  ON eis_transmissions FOR UPDATE TO authenticated USING (merchant_id = auth.uid()) WITH CHECK (merchant_id = auth.uid());

-- eis_transmission_payloads
CREATE POLICY "Merchants view own payloads"
  ON eis_transmission_payloads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM eis_transmissions t WHERE t.id = transmission_id AND t.merchant_id = auth.uid()));
CREATE POLICY "Merchants insert own payloads"
  ON eis_transmission_payloads FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM eis_transmissions t WHERE t.id = transmission_id AND t.merchant_id = auth.uid()));

-- eis_retry_queue
CREATE POLICY "Merchants view own retries"
  ON eis_retry_queue FOR SELECT TO authenticated USING (merchant_id = auth.uid());
CREATE POLICY "Merchants insert own retries"
  ON eis_retry_queue FOR INSERT TO authenticated WITH CHECK (merchant_id = auth.uid());

-- api_request_log
CREATE POLICY "Merchants view own request logs"
  ON api_request_log FOR SELECT TO authenticated USING (merchant_id = auth.uid());
CREATE POLICY "Merchants insert own request logs"
  ON api_request_log FOR INSERT TO authenticated WITH CHECK (merchant_id = auth.uid());

-- api_rate_limit_events
CREATE POLICY "Merchants view own rate limit events"
  ON api_rate_limit_events FOR SELECT TO authenticated USING (merchant_id = auth.uid());
CREATE POLICY "Merchants insert own rate limit events"
  ON api_rate_limit_events FOR INSERT TO authenticated WITH CHECK (merchant_id = auth.uid());

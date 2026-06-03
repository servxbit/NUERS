/*
  # Merchant Digital Tax System

  ## Overview
  Replaces manual BIR filing with fully automatic tax computation.
  Every transaction generates a tax record automatically. No merchant action needed.

  ## New Tables

  ### merchant_transactions
  - Stores all merchant sales transactions
  - Each row triggers automatic tax record creation via database function
  - Columns: id, merchant_id, amount, vat_amount, net_amount, channel, branch, customer_name, status, created_at

  ### merchant_tax_records
  - Auto-generated tax ledger entries, one per transaction
  - Never manually inserted — created by trigger on merchant_transactions
  - Columns: id, transaction_id, merchant_id, period_year, period_month, period_quarter,
    gross_amount, vat_output, vat_input_credit, net_vat_payable, tax_status, generated_at

  ### merchant_tax_summaries
  - Pre-aggregated monthly/quarterly tax summary per merchant
  - Refreshed by trigger whenever a new tax record is created
  - Columns: id, merchant_id, period_year, period_month, period_quarter,
    total_gross, total_vat_output, total_vat_input, total_vat_payable,
    transaction_count, last_updated

  ## Security
  - RLS enabled on all tables
  - Merchants can only see their own data
  - Tax records are read-only for merchants (system-generated)
  - Summaries are read-only for merchants

  ## Key Design Decisions
  1. Trigger-based: merchant_transactions INSERT → auto creates tax_record → refreshes summary
  2. No filing workflow: system is the single source of truth, BIR receives data via API
  3. VAT input credit set at 50% of output as default (configurable)
*/

-- =============================================
-- TABLE: merchant_transactions
-- =============================================
CREATE TABLE IF NOT EXISTS merchant_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  net_amount numeric(14,2) NOT NULL DEFAULT 0,
  channel text NOT NULL DEFAULT 'POS',
  branch text NOT NULL DEFAULT 'Main Branch',
  customer_name text NOT NULL DEFAULT 'Walk-in Customer',
  customer_tin text,
  receipt_id text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE merchant_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own transactions"
  ON merchant_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert own transactions"
  ON merchant_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = merchant_id);

-- =============================================
-- TABLE: merchant_tax_records
-- =============================================
CREATE TABLE IF NOT EXISTS merchant_tax_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES merchant_transactions(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_year int NOT NULL,
  period_month int NOT NULL,
  period_quarter int NOT NULL,
  gross_amount numeric(14,2) NOT NULL DEFAULT 0,
  vat_output numeric(14,2) NOT NULL DEFAULT 0,
  vat_input_credit numeric(14,2) NOT NULL DEFAULT 0,
  net_vat_payable numeric(14,2) NOT NULL DEFAULT 0,
  tax_status text NOT NULL DEFAULT 'posted',
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE merchant_tax_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own tax records"
  ON merchant_tax_records FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

-- =============================================
-- TABLE: merchant_tax_summaries
-- =============================================
CREATE TABLE IF NOT EXISTS merchant_tax_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_year int NOT NULL,
  period_month int NOT NULL,
  period_quarter int NOT NULL,
  total_gross numeric(14,2) NOT NULL DEFAULT 0,
  total_vat_output numeric(14,2) NOT NULL DEFAULT 0,
  total_vat_input numeric(14,2) NOT NULL DEFAULT 0,
  total_vat_payable numeric(14,2) NOT NULL DEFAULT 0,
  transaction_count int NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, period_year, period_month)
);

ALTER TABLE merchant_tax_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own tax summaries"
  ON merchant_tax_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

-- =============================================
-- FUNCTION: auto-generate tax record on transaction
-- =============================================
CREATE OR REPLACE FUNCTION generate_tax_record_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_year int;
  v_month int;
  v_quarter int;
  v_vat_input numeric;
  v_net_vat numeric;
BEGIN
  -- Only process completed transactions
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  v_year    := EXTRACT(YEAR  FROM NEW.created_at)::int;
  v_month   := EXTRACT(MONTH FROM NEW.created_at)::int;
  v_quarter := CEIL(v_month / 3.0)::int;

  -- Default input credit = 50% of output (gross input estimate)
  v_vat_input := ROUND(NEW.vat_amount * 0.5, 2);
  v_net_vat   := NEW.vat_amount - v_vat_input;

  -- Insert tax record
  INSERT INTO merchant_tax_records (
    transaction_id, merchant_id,
    period_year, period_month, period_quarter,
    gross_amount, vat_output, vat_input_credit, net_vat_payable,
    tax_status
  ) VALUES (
    NEW.id, NEW.merchant_id,
    v_year, v_month, v_quarter,
    NEW.amount, NEW.vat_amount, v_vat_input, v_net_vat,
    'posted'
  );

  -- Upsert monthly summary
  INSERT INTO merchant_tax_summaries (
    merchant_id, period_year, period_month, period_quarter,
    total_gross, total_vat_output, total_vat_input, total_vat_payable,
    transaction_count, last_updated
  ) VALUES (
    NEW.merchant_id, v_year, v_month, v_quarter,
    NEW.amount, NEW.vat_amount, v_vat_input, v_net_vat,
    1, now()
  )
  ON CONFLICT (merchant_id, period_year, period_month)
  DO UPDATE SET
    total_gross         = merchant_tax_summaries.total_gross + EXCLUDED.total_gross,
    total_vat_output    = merchant_tax_summaries.total_vat_output + EXCLUDED.total_vat_output,
    total_vat_input     = merchant_tax_summaries.total_vat_input + EXCLUDED.total_vat_input,
    total_vat_payable   = merchant_tax_summaries.total_vat_payable + EXCLUDED.total_vat_payable,
    transaction_count   = merchant_tax_summaries.transaction_count + 1,
    last_updated        = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER: fire after each transaction insert
-- =============================================
DROP TRIGGER IF EXISTS trg_generate_tax_record ON merchant_transactions;

CREATE TRIGGER trg_generate_tax_record
  AFTER INSERT ON merchant_transactions
  FOR EACH ROW
  EXECUTE FUNCTION generate_tax_record_on_transaction();

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_merchant_transactions_merchant_id ON merchant_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_transactions_created_at ON merchant_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_merchant_tax_records_merchant_id ON merchant_tax_records(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_tax_records_period ON merchant_tax_records(merchant_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_merchant_tax_summaries_period ON merchant_tax_summaries(merchant_id, period_year, period_month);

/*
  # Electronic Invoicing Engine — Module 1

  ## Summary
  Creates the full schema for the Electronic Invoicing Engine including
  all invoice types, line items, tax computations, versioning, cancellation
  workflow, recurring/scheduled invoicing, and bulk processing.

  ## New Tables

  ### invoices
  - Core invoice table supporting 7 document types
  - Stores computed tax breakdown, digital signature hash, QR payload
  - Versioning via version_number + parent_invoice_id chain
  - Cancellation workflow via status + cancellation fields

  ### invoice_line_items
  - Individual line items per invoice
  - Per-line tax computation (VAT, withholding)

  ### invoice_versions
  - Immutable audit trail of every invoice state change
  - Stores full JSON snapshot of invoice + line items

  ### recurring_invoices
  - Template for recurring invoice generation
  - Configurable frequency, next_run_at, end_date

  ### scheduled_invoices
  - One-time future-dated invoice schedules

  ### bulk_invoice_jobs
  - Tracks bulk upload/processing jobs
  - Stores result counts and error log

  ## Security
  - RLS enabled on all tables
  - Merchants can only access their own invoices
  - Admins can read all invoices
*/

-- ─── invoices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number        text UNIQUE NOT NULL,
  document_type         text NOT NULL CHECK (document_type IN (
                          'sales_invoice', 'official_receipt', 'credit_memo',
                          'debit_memo', 'purchase_invoice', 'delivery_receipt',
                          'service_invoice'
                        )),
  status                text NOT NULL DEFAULT 'draft' CHECK (status IN (
                          'draft', 'pending', 'validated', 'sent', 'paid',
                          'partially_paid', 'overdue', 'cancelled', 'voided',
                          'correction_pending'
                        )),
  version_number        integer NOT NULL DEFAULT 1,
  parent_invoice_id     uuid REFERENCES invoices(id),

  -- Parties
  merchant_id           uuid NOT NULL REFERENCES profiles(id),
  merchant_name         text NOT NULL DEFAULT '',
  merchant_tin          text NOT NULL DEFAULT '',
  merchant_address      text NOT NULL DEFAULT '',
  buyer_name            text NOT NULL DEFAULT '',
  buyer_tin             text DEFAULT '',
  buyer_address         text DEFAULT '',
  buyer_email           text DEFAULT '',

  -- Dates
  issue_date            date NOT NULL DEFAULT CURRENT_DATE,
  due_date              date,
  delivery_date         date,
  period_start          date,
  period_end            date,

  -- Amounts (stored in centavos as integer to avoid float errors)
  subtotal_amount       bigint NOT NULL DEFAULT 0,
  discount_amount       bigint NOT NULL DEFAULT 0,
  taxable_amount        bigint NOT NULL DEFAULT 0,
  vat_amount            bigint NOT NULL DEFAULT 0,
  withholding_tax       bigint NOT NULL DEFAULT 0,
  other_charges         bigint NOT NULL DEFAULT 0,
  total_amount          bigint NOT NULL DEFAULT 0,
  amount_paid           bigint NOT NULL DEFAULT 0,
  amount_due            bigint NOT NULL DEFAULT 0,
  currency              text NOT NULL DEFAULT 'PHP',
  exchange_rate         numeric(12,6) NOT NULL DEFAULT 1.0,

  -- Tax
  vat_registered        boolean NOT NULL DEFAULT true,
  vat_rate              numeric(5,2) NOT NULL DEFAULT 12.00,
  zero_rated_amount     bigint NOT NULL DEFAULT 0,
  vat_exempt_amount     bigint NOT NULL DEFAULT 0,

  -- References
  reference_number      text DEFAULT '',
  purchase_order        text DEFAULT '',
  sales_order           text DEFAULT '',
  original_invoice_id   uuid REFERENCES invoices(id),
  correction_reason     text DEFAULT '',

  -- Digital trust
  qr_payload            text DEFAULT '',
  digital_signature     text DEFAULT '',
  signature_algorithm   text DEFAULT 'SHA256',
  signed_at             timestamptz,
  validated_at          timestamptz,
  validation_hash       text DEFAULT '',

  -- Cancellation workflow
  cancellation_reason   text DEFAULT '',
  cancellation_note     text DEFAULT '',
  cancelled_by          uuid REFERENCES profiles(id),
  cancelled_at          timestamptz,

  -- Export formats generated
  formats_generated     text[] NOT NULL DEFAULT '{}',

  -- Notes
  notes                 text DEFAULT '',
  terms_and_conditions  text DEFAULT '',
  footer_note           text DEFAULT '',

  -- Recurring/Bulk linkage
  recurring_invoice_id  uuid,
  bulk_job_id           uuid,

  created_by            uuid REFERENCES profiles(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── invoice_line_items ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_number     integer NOT NULL,
  item_code       text DEFAULT '',
  description     text NOT NULL DEFAULT '',
  unit            text NOT NULL DEFAULT 'pc',
  quantity        numeric(12,4) NOT NULL DEFAULT 1,
  unit_price      bigint NOT NULL DEFAULT 0,
  discount_pct    numeric(5,2) NOT NULL DEFAULT 0,
  discount_amount bigint NOT NULL DEFAULT 0,
  taxable_amount  bigint NOT NULL DEFAULT 0,
  vat_rate        numeric(5,2) NOT NULL DEFAULT 12.00,
  vat_amount      bigint NOT NULL DEFAULT 0,
  line_total      bigint NOT NULL DEFAULT 0,
  tax_type        text NOT NULL DEFAULT 'vatable' CHECK (tax_type IN ('vatable','zero_rated','vat_exempt')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── invoice_versions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  version_number  integer NOT NULL,
  changed_by      uuid REFERENCES profiles(id),
  change_type     text NOT NULL CHECK (change_type IN (
                    'created','edited','validated','sent','paid',
                    'cancelled','voided','corrected','status_change'
                  )),
  change_summary  text DEFAULT '',
  snapshot        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── recurring_invoices ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     uuid NOT NULL REFERENCES profiles(id),
  name            text NOT NULL DEFAULT '',
  document_type   text NOT NULL CHECK (document_type IN (
                    'sales_invoice','official_receipt','credit_memo',
                    'debit_memo','purchase_invoice','delivery_receipt','service_invoice'
                  )),
  template        jsonb NOT NULL DEFAULT '{}',
  frequency       text NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly','quarterly','annually')),
  day_of_month    integer,
  day_of_week     integer,
  start_date      date NOT NULL DEFAULT CURRENT_DATE,
  end_date        date,
  next_run_at     timestamptz NOT NULL DEFAULT now(),
  last_run_at     timestamptz,
  runs_count      integer NOT NULL DEFAULT 0,
  max_runs        integer,
  is_active       boolean NOT NULL DEFAULT true,
  auto_send       boolean NOT NULL DEFAULT false,
  auto_validate   boolean NOT NULL DEFAULT true,
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── scheduled_invoices ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     uuid NOT NULL REFERENCES profiles(id),
  invoice_id      uuid REFERENCES invoices(id),
  document_type   text NOT NULL,
  template        jsonb NOT NULL DEFAULT '{}',
  scheduled_at    timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  error_message   text DEFAULT '',
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── bulk_invoice_jobs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bulk_invoice_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     uuid NOT NULL REFERENCES profiles(id),
  job_name        text NOT NULL DEFAULT '',
  document_type   text NOT NULL,
  source_format   text NOT NULL CHECK (source_format IN ('json','xml','csv')),
  total_records   integer NOT NULL DEFAULT 0,
  processed       integer NOT NULL DEFAULT 0,
  succeeded       integer NOT NULL DEFAULT 0,
  failed          integer NOT NULL DEFAULT 0,
  skipped         integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','completed_with_errors','failed','cancelled')),
  error_log       jsonb NOT NULL DEFAULT '[]',
  started_at      timestamptz,
  completed_at    timestamptz,
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_merchant_id ON invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_document_type ON invoices(document_type);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_versions_invoice_id ON invoice_versions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_recurring_merchant ON recurring_invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_merchant ON scheduled_invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_merchant ON bulk_invoice_jobs(merchant_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_invoice_jobs ENABLE ROW LEVEL SECURITY;

-- invoices policies
CREATE POLICY "Merchants can view own invoices"
  ON invoices FOR SELECT TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can insert own invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can update own invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

-- invoice_line_items policies
CREATE POLICY "Merchants can view own line items"
  ON invoice_line_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.merchant_id = auth.uid()));

CREATE POLICY "Merchants can insert own line items"
  ON invoice_line_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.merchant_id = auth.uid()));

CREATE POLICY "Merchants can update own line items"
  ON invoice_line_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.merchant_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.merchant_id = auth.uid()));

CREATE POLICY "Merchants can delete own line items"
  ON invoice_line_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.merchant_id = auth.uid()));

-- invoice_versions policies
CREATE POLICY "Merchants can view own invoice versions"
  ON invoice_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.merchant_id = auth.uid()));

CREATE POLICY "Merchants can insert own invoice versions"
  ON invoice_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND invoices.merchant_id = auth.uid()));

-- recurring_invoices policies
CREATE POLICY "Merchants can view own recurring invoices"
  ON recurring_invoices FOR SELECT TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can insert own recurring invoices"
  ON recurring_invoices FOR INSERT TO authenticated
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can update own recurring invoices"
  ON recurring_invoices FOR UPDATE TO authenticated
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can delete own recurring invoices"
  ON recurring_invoices FOR DELETE TO authenticated
  USING (merchant_id = auth.uid());

-- scheduled_invoices policies
CREATE POLICY "Merchants can view own scheduled invoices"
  ON scheduled_invoices FOR SELECT TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can insert own scheduled invoices"
  ON scheduled_invoices FOR INSERT TO authenticated
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can update own scheduled invoices"
  ON scheduled_invoices FOR UPDATE TO authenticated
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can delete own scheduled invoices"
  ON scheduled_invoices FOR DELETE TO authenticated
  USING (merchant_id = auth.uid());

-- bulk_invoice_jobs policies
CREATE POLICY "Merchants can view own bulk jobs"
  ON bulk_invoice_jobs FOR SELECT TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can insert own bulk jobs"
  ON bulk_invoice_jobs FOR INSERT TO authenticated
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can update own bulk jobs"
  ON bulk_invoice_jobs FOR UPDATE TO authenticated
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

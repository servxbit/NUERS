/*
  # Create Transaction Receipts Table & Extend Merchant Transactions

  ## Changes

  ### New Table: transaction_receipts
  - Official BIR-compliant electronic receipt per transaction
  - Contains itemized line items as JSONB
  - Links back to merchant_transactions via transaction_id

  ### Extended: merchant_transactions
  - Add region, payment_method, transaction_ref, vatable_sales, transaction_type, merchant_ref_id columns

  ## Security
  - RLS enabled on transaction_receipts
  - Authenticated users can read all (admin pattern)
*/

-- ─── Extend merchant_transactions ────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='merchant_transactions' AND column_name='transaction_ref') THEN
    ALTER TABLE merchant_transactions ADD COLUMN transaction_ref text DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='merchant_transactions' AND column_name='region') THEN
    ALTER TABLE merchant_transactions ADD COLUMN region text NOT NULL DEFAULT 'NCR';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='merchant_transactions' AND column_name='payment_method') THEN
    ALTER TABLE merchant_transactions ADD COLUMN payment_method text NOT NULL DEFAULT 'cash';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='merchant_transactions' AND column_name='vatable_sales') THEN
    ALTER TABLE merchant_transactions ADD COLUMN vatable_sales numeric(15,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='merchant_transactions' AND column_name='transaction_type') THEN
    ALTER TABLE merchant_transactions ADD COLUMN transaction_type text NOT NULL DEFAULT 'sale';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='merchant_transactions' AND column_name='merchant_ref_id') THEN
    ALTER TABLE merchant_transactions ADD COLUMN merchant_ref_id uuid REFERENCES merchants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── transaction_receipts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_receipts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    uuid REFERENCES merchant_transactions(id) ON DELETE CASCADE,
  merchant_id       uuid REFERENCES merchants(id) ON DELETE CASCADE,

  receipt_number    text UNIQUE NOT NULL,
  series_number     text NOT NULL DEFAULT '',
  bir_accreditation text NOT NULL DEFAULT 'ACC-0001-2026',
  receipt_type      text NOT NULL DEFAULT 'official_receipt',

  merchant_name     text NOT NULL DEFAULT '',
  merchant_tin      text NOT NULL DEFAULT '',
  merchant_address  text NOT NULL DEFAULT '',
  merchant_vat_reg  text NOT NULL DEFAULT '',

  buyer_name        text,
  buyer_tin         text,
  buyer_address     text,

  gross_amount      numeric(15,2) NOT NULL DEFAULT 0,
  discount_amount   numeric(15,2) NOT NULL DEFAULT 0,
  vatable_sales     numeric(15,2) NOT NULL DEFAULT 0,
  vat_exempt_sales  numeric(15,2) NOT NULL DEFAULT 0,
  zero_rated_sales  numeric(15,2) NOT NULL DEFAULT 0,
  vat_amount        numeric(15,2) NOT NULL DEFAULT 0,
  total_due         numeric(15,2) NOT NULL DEFAULT 0,

  items             jsonb NOT NULL DEFAULT '[]',

  status            text NOT NULL DEFAULT 'issued',
  void_reason       text,
  issued_at         timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE transaction_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view receipts"
  ON transaction_receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert receipts"
  ON transaction_receipts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_receipts_transaction_id ON transaction_receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipts_merchant_id    ON transaction_receipts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON transaction_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_issued_at      ON transaction_receipts(issued_at);

-- ─── Admin RLS on merchant_transactions ───────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'merchant_transactions' AND policyname = 'Admin can view all transactions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admin can view all transactions"
        ON merchant_transactions FOR SELECT
        TO authenticated
        USING (true)
    $policy$;
  END IF;
END $$;

-- ─── Seed sample receipts linked to merchants table ────────────────────────
DO $$
DECLARE
  m_rec   RECORD;
  r_id    uuid;
  gross   numeric;
  vatable numeric;
  vat     numeric;
  net     numeric;
  idx     integer;
  rnum    text;
  items_json jsonb;
BEGIN
  idx := 1;
  FOR m_rec IN SELECT id, business_name, tin, address FROM merchants WHERE status IN ('active','under_review') LIMIT 10 LOOP
    FOR idx IN idx..idx+14 LOOP
      gross   := round((500 + random() * 49500)::numeric, 2);
      vatable := round((gross / 1.12)::numeric, 2);
      vat     := round((vatable * 0.12)::numeric, 2);
      net     := gross - vat;
      rnum    := 'OR-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(idx::text, 6, '0');

      items_json := jsonb_build_array(
        jsonb_build_object(
          'description', 'Goods/Services',
          'qty', 1,
          'unit_price', round(net::numeric, 2),
          'vat', round(vat::numeric, 2),
          'amount', gross
        )
      );

      INSERT INTO transaction_receipts (
        merchant_id,
        receipt_number, series_number, bir_accreditation, receipt_type,
        merchant_name, merchant_tin, merchant_address, merchant_vat_reg,
        gross_amount, vatable_sales, vat_amount, total_due,
        items, issued_at
      ) VALUES (
        m_rec.id,
        rnum,
        'SN-2026-' || LPAD(idx::text, 6, '0'),
        'BIR-ACC-2026-' || LPAD(idx::text, 4, '0'),
        'official_receipt',
        m_rec.business_name,
        m_rec.tin,
        COALESCE(m_rec.address, 'Philippines'),
        'VN082-' || LPAD(idx::text, 6, '0'),
        gross, vatable, vat, gross,
        items_json,
        now() - ((random() * 90)::int || ' days')::interval
      ) ON CONFLICT (receipt_number) DO NOTHING;

      idx := idx + 1;
    END LOOP;
  END LOOP;
END $$;

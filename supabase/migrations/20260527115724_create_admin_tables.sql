/*
  # Create Government Admin Tables

  ## New Tables
  - `merchants` - Registered merchant businesses with TIN, compliance status, sector
  - `tax_filings` - VAT/income tax filing records per merchant per period
  - `audit_logs` - System-wide audit trail for all admin actions
  - `notifications` - Admin alerts and system notifications
  - `compliance_scores` - Per-merchant compliance scoring history

  ## Security
  - RLS enabled on all tables
  - Authenticated users (admin role) can read/write their relevant data
*/

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tin text UNIQUE NOT NULL,
  business_name text NOT NULL,
  owner_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT 'retail',
  region text NOT NULL DEFAULT 'NCR',
  address text NOT NULL DEFAULT '',
  registration_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  compliance_score integer DEFAULT 100,
  monthly_revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view merchants"
  ON merchants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert merchants"
  ON merchants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update merchants"
  ON merchants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tax filings table
CREATE TABLE IF NOT EXISTS tax_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
  filing_type text NOT NULL DEFAULT 'VAT',
  period text NOT NULL,
  gross_sales numeric DEFAULT 0,
  vat_payable numeric DEFAULT 0,
  income_tax numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  filed_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tax_filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tax filings"
  ON tax_filings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tax filings"
  ON tax_filings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tax filings"
  ON tax_filings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  priority text NOT NULL DEFAULT 'medium',
  is_read boolean DEFAULT false,
  target_role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Compliance scores table
CREATE TABLE IF NOT EXISTS compliance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES merchants(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 100,
  period text NOT NULL,
  issues jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view compliance scores"
  ON compliance_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert compliance scores"
  ON compliance_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed sample merchants
INSERT INTO merchants (tin, business_name, owner_name, email, sector, region, status, compliance_score, monthly_revenue) VALUES
  ('123-456-789-000', 'SM Supermalls Corp.', 'Henry Sy Jr.', 'compliance@sm.com.ph', 'retail', 'NCR', 'active', 98, 125000000),
  ('234-567-890-001', 'Jollibee Foods Corp.', 'Ernesto Tanmantiong', 'tax@jollibee.com.ph', 'food_beverage', 'NCR', 'active', 97, 89000000),
  ('345-678-901-002', 'Mercury Drug Corp.', 'Vivian Askilo', 'bir@mercurydrug.com', 'retail', 'NCR', 'active', 99, 67000000),
  ('456-789-012-003', 'Robinsons Retail', 'Robina Gokongwei', 'tax@robinsons.com.ph', 'retail', 'NCR', 'active', 96, 54000000),
  ('567-890-123-004', 'Puregold Price Club', 'Lucio Co', 'finance@puregold.com.ph', 'retail', 'NCR', 'active', 94, 48000000),
  ('678-901-234-005', 'ABC Trading Co.', 'Unknown Owner', 'abc@email.com', 'wholesale', 'NCR', 'under_review', 42, 2400000),
  ('789-012-345-006', 'XYZ Enterprises', 'Jane Doe', 'xyz@email.com', 'services', 'Region III', 'under_review', 58, 890000),
  ('890-123-456-007', 'Quick Mart Chain', 'John Smith', 'quick@email.com', 'retail', 'NCR', 'suspended', 31, 5100000),
  ('901-234-567-008', 'Cebu Pacific Air', 'Lance Gokongwei', 'tax@cebupacificair.com', 'services', 'Region VII', 'active', 99, 78000000),
  ('012-345-678-009', 'BDO Unibank', 'Nestor Tan', 'tax@bdo.com.ph', 'banking', 'NCR', 'active', 100, 210000000)
ON CONFLICT (tin) DO NOTHING;

-- Seed sample notifications
INSERT INTO notifications (title, message, type, priority) VALUES
  ('High Risk Merchant Detected', 'ABC Trading Co. has been flagged for sales suppression. Risk score: 94.', 'fraud', 'critical'),
  ('VAT Filing Deadline', '847 merchants have VAT returns due in 3 days. Automated reminders sent.', 'deadline', 'high'),
  ('System Maintenance', 'Scheduled maintenance window on 2026-06-01 02:00-04:00 PHT.', 'system', 'low'),
  ('Compliance Milestone', 'National compliance rate reached 98.2% — highest in system history.', 'achievement', 'medium'),
  ('New API Integration', '12 new POS vendors completed API certification this week.', 'info', 'low'),
  ('Audit Alert', 'Quick Mart Chain suspended pending investigation of phantom returns.', 'fraud', 'critical'),
  ('Revenue Target', 'May 2026 revenue collection exceeded monthly target by 8.7%.', 'achievement', 'medium')
ON CONFLICT DO NOTHING;

/*
  # Enhance Merchants Table for Enterprise Registry

  ## Changes
  1. Add new columns to merchants table:
     - `phone` - business phone number
     - `address` - full business address
     - `city` - city
     - `zip_code` - postal code
     - `business_type` - sole prop, partnership, corporation, etc.
     - `bir_registration_date` - official BIR registration date
     - `vat_registered` - whether VAT registered
     - `annual_revenue` - annual revenue estimate
     - `employee_count` - number of employees
     - `pos_system` - POS system they use
     - `api_key_id` - linked API key
     - `merchant_account_id` - linked merchant portal account (auth user)
     - `notes` - internal admin notes
     - `last_audit_date` - last audit timestamp
     - `next_audit_date` - scheduled next audit

  2. Security
     - Maintain existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'phone') THEN
    ALTER TABLE merchants ADD COLUMN phone text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'address') THEN
    ALTER TABLE merchants ADD COLUMN address text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'city') THEN
    ALTER TABLE merchants ADD COLUMN city text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'zip_code') THEN
    ALTER TABLE merchants ADD COLUMN zip_code text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'business_type') THEN
    ALTER TABLE merchants ADD COLUMN business_type text DEFAULT 'corporation';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'bir_registration_date') THEN
    ALTER TABLE merchants ADD COLUMN bir_registration_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'vat_registered') THEN
    ALTER TABLE merchants ADD COLUMN vat_registered boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'annual_revenue') THEN
    ALTER TABLE merchants ADD COLUMN annual_revenue numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'employee_count') THEN
    ALTER TABLE merchants ADD COLUMN employee_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'pos_system') THEN
    ALTER TABLE merchants ADD COLUMN pos_system text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'merchant_account_email') THEN
    ALTER TABLE merchants ADD COLUMN merchant_account_email text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'notes') THEN
    ALTER TABLE merchants ADD COLUMN notes text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'last_audit_date') THEN
    ALTER TABLE merchants ADD COLUMN last_audit_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'next_audit_date') THEN
    ALTER TABLE merchants ADD COLUMN next_audit_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'website') THEN
    ALTER TABLE merchants ADD COLUMN website text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'merchants' AND column_name = 'branch_count') THEN
    ALTER TABLE merchants ADD COLUMN branch_count integer DEFAULT 1;
  END IF;
END $$;

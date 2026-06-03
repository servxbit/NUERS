/*
  # Taxpayer Management System — Module 3

  ## Summary
  Full taxpayer lifecycle management schema covering registration, TIN management,
  business entities, branches, company hierarchy, verification workflows,
  customer portal subscriptions, billing, and service requests.

  ## New Tables

  ### taxpayers
  - Core taxpayer record linked to an auth user
  - Stores TIN, taxpayer type (individual/corporate), registration status
  - Links to business entity, verification status, risk score

  ### business_entities
  - Legal business registration details (SEC/DTI registered name, industry)
  - Stores business type, industry classification, registration numbers

  ### business_branches
  - Branch offices under a business entity
  - Tracks branch TIN, address, contact, status

  ### company_hierarchy
  - Parent-child relationships between business entities
  - Supports holding companies, subsidiaries, affiliates

  ### taxpayer_users
  - Users (employees) associated with a taxpayer/business
  - Role-based: owner, admin, accountant, viewer

  ### verification_requests
  - Verification workflow for SEC, DTI, Gov ID, Business Permit
  - Tracks document uploads, reviewer, status, risk score

  ### verification_documents
  - Individual documents per verification request

  ### subscriptions
  - Taxpayer subscription plans (free/basic/professional/enterprise)
  - Billing cycle, status, feature flags

  ### billing_records
  - Invoices/payment records for subscription billing

  ### service_requests
  - Customer portal service requests (TIN inquiry, corrections, etc.)

  ## Security
  - RLS enabled on all tables
  - Taxpayers see only their own records
  - Admin users can see all (checked via profiles role)
*/

-- ─── business_entities ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_entities (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name            text NOT NULL DEFAULT '',
  trade_name            text NOT NULL DEFAULT '',
  business_type         text NOT NULL DEFAULT 'sole_proprietorship' CHECK (business_type IN (
                          'sole_proprietorship','partnership','corporation','cooperative',
                          'government','non_profit','branch_office','representative_office'
                        )),
  industry_code         text NOT NULL DEFAULT '',
  industry_description  text NOT NULL DEFAULT '',
  sec_registration_no   text DEFAULT '',
  dti_registration_no   text DEFAULT '',
  bir_registration_no   text DEFAULT '',
  registration_date     date,
  registered_address    text NOT NULL DEFAULT '',
  city                  text NOT NULL DEFAULT '',
  province              text NOT NULL DEFAULT '',
  zip_code              text NOT NULL DEFAULT '',
  country               text NOT NULL DEFAULT 'Philippines',
  phone                 text NOT NULL DEFAULT '',
  email                 text NOT NULL DEFAULT '',
  website               text DEFAULT '',
  authorized_capital    numeric(20,2) DEFAULT 0,
  paid_up_capital       numeric(20,2) DEFAULT 0,
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended','dissolved','cancelled')),
  created_by            uuid REFERENCES profiles(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── taxpayers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taxpayers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            uuid NOT NULL REFERENCES profiles(id),
  business_entity_id    uuid REFERENCES business_entities(id),
  tin                   text UNIQUE,
  tin_type              text NOT NULL DEFAULT 'individual' CHECK (tin_type IN ('individual','non_individual','government')),
  taxpayer_type         text NOT NULL DEFAULT 'individual' CHECK (taxpayer_type IN (
                          'individual','sole_proprietor','professional','corporation',
                          'partnership','cooperative','estate','trust','government'
                        )),
  registration_status   text NOT NULL DEFAULT 'pending' CHECK (registration_status IN (
                          'pending','under_review','registered','active','suspended',
                          'delinquent','cancelled','revoked'
                        )),
  verification_status   text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN (
                          'unverified','pending','in_review','verified','rejected','flagged'
                        )),
  risk_score            integer DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level            text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  rdo_code              text DEFAULT '',
  rdo_name              text DEFAULT '',
  tax_types             text[] NOT NULL DEFAULT '{"income_tax"}',
  vat_registered        boolean NOT NULL DEFAULT false,
  vat_registration_date date,
  vat_threshold_reached boolean NOT NULL DEFAULT false,
  registration_date     date,
  cancellation_date     date,
  notes                 text DEFAULT '',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── business_branches ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_branches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_entity_id  uuid NOT NULL REFERENCES business_entities(id),
  taxpayer_id         uuid REFERENCES taxpayers(id),
  branch_name         text NOT NULL DEFAULT '',
  branch_code         text NOT NULL DEFAULT '',
  branch_tin          text DEFAULT '',
  branch_type         text NOT NULL DEFAULT 'regular' CHECK (branch_type IN ('head_office','regular','satellite','warehouse','kiosk')),
  address             text NOT NULL DEFAULT '',
  city                text NOT NULL DEFAULT '',
  province            text NOT NULL DEFAULT '',
  zip_code            text NOT NULL DEFAULT '',
  phone               text DEFAULT '',
  email               text DEFAULT '',
  manager_name        text DEFAULT '',
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','closed','pending')),
  opened_at           date,
  closed_at           date,
  created_by          uuid REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── company_hierarchy ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_hierarchy (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_entity_id    uuid NOT NULL REFERENCES business_entities(id),
  child_entity_id     uuid NOT NULL REFERENCES business_entities(id),
  relationship_type   text NOT NULL DEFAULT 'subsidiary' CHECK (relationship_type IN (
                        'subsidiary','affiliate','branch','associate','joint_venture','holding'
                      )),
  ownership_pct       numeric(5,2) DEFAULT 0,
  effective_date      date NOT NULL DEFAULT CURRENT_DATE,
  end_date            date,
  notes               text DEFAULT '',
  created_by          uuid REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_entity_id, child_entity_id)
);

-- ─── taxpayer_users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taxpayer_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id     uuid NOT NULL REFERENCES taxpayers(id),
  profile_id      uuid NOT NULL REFERENCES profiles(id),
  role            text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','admin','accountant','preparer','approver','viewer')),
  branch_access   uuid[] NOT NULL DEFAULT '{}',
  is_primary      boolean NOT NULL DEFAULT false,
  invited_by      uuid REFERENCES profiles(id),
  invited_at      timestamptz,
  accepted_at     timestamptz,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended','removed')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(taxpayer_id, profile_id)
);

-- ─── verification_requests ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id         uuid NOT NULL REFERENCES taxpayers(id),
  verification_type   text NOT NULL CHECK (verification_type IN (
                        'sec','dti','government_id','business_permit','tin_verification',
                        'address_verification','financial_statement','risk_assessment'
                      )),
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending','submitted','under_review','additional_docs_required',
                        'approved','rejected','expired'
                      )),
  priority            text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  risk_score          integer DEFAULT 0,
  risk_flags          text[] NOT NULL DEFAULT '{}',
  reviewer_id         uuid REFERENCES profiles(id),
  reviewed_at         timestamptz,
  review_notes        text DEFAULT '',
  rejection_reason    text DEFAULT '',
  expires_at          timestamptz,
  submitted_at        timestamptz,
  approved_at         timestamptz,
  created_by          uuid REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── verification_documents ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_documents (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id uuid NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
  document_type           text NOT NULL DEFAULT '',
  file_name               text NOT NULL DEFAULT '',
  file_url                text NOT NULL DEFAULT '',
  file_size               integer DEFAULT 0,
  mime_type               text DEFAULT '',
  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  rejection_reason        text DEFAULT '',
  uploaded_by             uuid REFERENCES profiles(id),
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ─── subscriptions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taxpayer_subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id       uuid NOT NULL REFERENCES taxpayers(id),
  plan              text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','basic','professional','enterprise','government')),
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','cancelled','expired')),
  billing_cycle     text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','quarterly','annual')),
  amount            numeric(12,2) NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'PHP',
  current_period_start  timestamptz NOT NULL DEFAULT now(),
  current_period_end    timestamptz,
  trial_end             timestamptz,
  cancelled_at          timestamptz,
  max_invoices_month    integer NOT NULL DEFAULT 100,
  max_branches          integer NOT NULL DEFAULT 1,
  max_users             integer NOT NULL DEFAULT 3,
  eis_enabled           boolean NOT NULL DEFAULT false,
  api_access            boolean NOT NULL DEFAULT false,
  priority_support      boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── billing_records ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taxpayer_billing (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id       uuid NOT NULL REFERENCES taxpayers(id),
  subscription_id   uuid REFERENCES taxpayer_subscriptions(id),
  billing_type      text NOT NULL DEFAULT 'subscription' CHECK (billing_type IN ('subscription','usage','setup','addon','credit')),
  description       text NOT NULL DEFAULT '',
  amount            numeric(12,2) NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'PHP',
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded','voided')),
  due_date          date,
  paid_at           timestamptz,
  payment_method    text DEFAULT '',
  invoice_number    text DEFAULT '',
  period_start      date,
  period_end        date,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── service_requests ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS taxpayer_service_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taxpayer_id       uuid NOT NULL REFERENCES taxpayers(id),
  request_type      text NOT NULL CHECK (request_type IN (
                      'tin_inquiry','tin_correction','registration_update','branch_registration',
                      'cancellation','reactivation','vat_registration','document_request',
                      'dispute','general_inquiry','technical_support'
                    )),
  subject           text NOT NULL DEFAULT '',
  description       text NOT NULL DEFAULT '',
  priority          text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status            text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','pending_info','resolved','closed','cancelled')),
  assigned_to       uuid REFERENCES profiles(id),
  resolution        text DEFAULT '',
  resolved_at       timestamptz,
  created_by        uuid NOT NULL REFERENCES profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_taxpayers_profile ON taxpayers(profile_id);
CREATE INDEX IF NOT EXISTS idx_taxpayers_tin ON taxpayers(tin);
CREATE INDEX IF NOT EXISTS idx_taxpayers_status ON taxpayers(registration_status);
CREATE INDEX IF NOT EXISTS idx_business_entities_status ON business_entities(status);
CREATE INDEX IF NOT EXISTS idx_branches_entity ON business_branches(business_entity_id);
CREATE INDEX IF NOT EXISTS idx_taxpayer_users_profile ON taxpayer_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_verif_taxpayer ON verification_requests(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_verif_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_taxpayer ON taxpayer_subscriptions(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_billing_taxpayer ON taxpayer_billing(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_service_req_taxpayer ON taxpayer_service_requests(taxpayer_id);
CREATE INDEX IF NOT EXISTS idx_service_req_status ON taxpayer_service_requests(status);

-- ─── RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE business_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxpayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxpayer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxpayer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxpayer_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxpayer_service_requests ENABLE ROW LEVEL SECURITY;

-- business_entities
CREATE POLICY "Users can view entities they belong to"
  ON business_entities FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM taxpayers t
    JOIN taxpayer_users tu ON tu.taxpayer_id = t.id
    WHERE t.business_entity_id = business_entities.id AND tu.profile_id = auth.uid()
  ));
CREATE POLICY "Users can create business entities"
  ON business_entities FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their entities"
  ON business_entities FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- taxpayers
CREATE POLICY "Taxpayers can view own record"
  ON taxpayers FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Taxpayers can insert own record"
  ON taxpayers FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Taxpayers can update own record"
  ON taxpayers FOR UPDATE TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- business_branches
CREATE POLICY "Users view branches of their entities"
  ON business_branches FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM taxpayers t
    JOIN taxpayer_users tu ON tu.taxpayer_id = t.id
    WHERE t.business_entity_id = business_branches.business_entity_id AND tu.profile_id = auth.uid()
  ));
CREATE POLICY "Users create branches"
  ON business_branches FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users update branches"
  ON business_branches FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- company_hierarchy
CREATE POLICY "Users view hierarchy of their entities"
  ON company_hierarchy FOR SELECT TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "Users create hierarchy"
  ON company_hierarchy FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- taxpayer_users
CREATE POLICY "Users view own taxpayer memberships"
  ON taxpayer_users FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Users insert taxpayer memberships"
  ON taxpayer_users FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM taxpayer_users tu2 WHERE tu2.taxpayer_id = taxpayer_id AND tu2.profile_id = auth.uid() AND tu2.role IN ('owner','admin'))
    OR profile_id = auth.uid()
  );

-- verification_requests
CREATE POLICY "Taxpayers view own verifications"
  ON verification_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()));
CREATE POLICY "Taxpayers create verifications"
  ON verification_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()));
CREATE POLICY "Taxpayers update own verifications"
  ON verification_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()));

-- verification_documents
CREATE POLICY "Users view docs for their verifications"
  ON verification_documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM verification_requests vr
    JOIN taxpayers t ON t.id = vr.taxpayer_id
    WHERE vr.id = verification_request_id AND t.profile_id = auth.uid()
  ));
CREATE POLICY "Users upload docs for their verifications"
  ON verification_documents FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- taxpayer_subscriptions
CREATE POLICY "Taxpayers view own subscriptions"
  ON taxpayer_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()));
CREATE POLICY "Taxpayers create subscriptions"
  ON taxpayer_subscriptions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()));
CREATE POLICY "Taxpayers update subscriptions"
  ON taxpayer_subscriptions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()));

-- taxpayer_billing
CREATE POLICY "Taxpayers view own billing"
  ON taxpayer_billing FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()));
CREATE POLICY "Taxpayers insert billing"
  ON taxpayer_billing FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()));

-- taxpayer_service_requests
CREATE POLICY "Taxpayers view own service requests"
  ON taxpayer_service_requests FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM taxpayers t WHERE t.id = taxpayer_id AND t.profile_id = auth.uid()));
CREATE POLICY "Taxpayers create service requests"
  ON taxpayer_service_requests FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Taxpayers update own service requests"
  ON taxpayer_service_requests FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

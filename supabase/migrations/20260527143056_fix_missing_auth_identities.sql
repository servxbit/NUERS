/*
  # Fix Missing Auth Identities

  Both manually-created users (admin@nuers.com, customer@nuers.com) are missing
  rows in auth.identities, which Supabase requires to authenticate via email/password.
  This migration inserts the missing identity records.
*/

DO $$
DECLARE
  v_admin_id uuid;
  v_customer_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@nuers.com';
  SELECT id INTO v_customer_id FROM auth.users WHERE email = 'customer@nuers.com';

  IF v_admin_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_admin_id
  ) THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_admin_id,
      v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@nuers.com'),
      'email',
      v_admin_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  IF v_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_customer_id
  ) THEN
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_customer_id,
      v_customer_id,
      jsonb_build_object('sub', v_customer_id::text, 'email', 'customer@nuers.com'),
      'email',
      v_customer_id::text,
      now(),
      now(),
      now()
    );
  END IF;
END $$;

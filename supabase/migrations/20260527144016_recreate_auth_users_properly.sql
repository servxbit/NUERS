/*
  # Recreate Auth Users Properly

  Delete and fully recreate admin@nuers.com and customer@nuers.com with all
  required auth fields populated correctly so GoTrue can authenticate them.
*/

-- Remove existing identities and sessions
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@nuers.com', 'customer@nuers.com')
);
DELETE FROM auth.sessions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@nuers.com', 'customer@nuers.com')
);
DELETE FROM auth.refresh_tokens WHERE user_id::uuid IN (
  SELECT id FROM auth.users WHERE email IN ('admin@nuers.com', 'customer@nuers.com')
);

DO $$
DECLARE
  v_admin_id uuid := 'cd52ef19-a186-4856-a742-cdcf5ac80beb';
  v_customer_id uuid := '43f6a9f1-beee-4de9-9ad9-e04422fb1829';
BEGIN
  UPDATE auth.users SET
    instance_id = '00000000-0000-0000-0000-000000000000',
    aud = 'authenticated',
    role = 'authenticated',
    email = 'admin@nuers.com',
    encrypted_password = crypt('123456', gen_salt('bf')),
    email_confirmed_at = now(),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{"full_name":"NUERS Government Admin"}',
    is_super_admin = false,
    updated_at = now(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    is_sso_user = false,
    deleted_at = null,
    is_anonymous = false
  WHERE id = v_admin_id;

  UPDATE auth.users SET
    instance_id = '00000000-0000-0000-0000-000000000000',
    aud = 'authenticated',
    role = 'authenticated',
    email = 'customer@nuers.com',
    encrypted_password = crypt('123456', gen_salt('bf')),
    email_confirmed_at = now(),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{"full_name":"NUERS Customer"}',
    is_super_admin = false,
    updated_at = now(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    is_sso_user = false,
    deleted_at = null,
    is_anonymous = false
  WHERE id = v_customer_id;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    (
      gen_random_uuid(),
      v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@nuers.com', 'email_verified', true),
      'email',
      'admin@nuers.com',
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      v_customer_id,
      jsonb_build_object('sub', v_customer_id::text, 'email', 'customer@nuers.com', 'email_verified', true),
      'email',
      'customer@nuers.com',
      now(),
      now(),
      now()
    );
END $$;

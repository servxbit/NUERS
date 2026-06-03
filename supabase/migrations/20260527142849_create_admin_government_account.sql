/*
  # Create Government Admin Account

  Creates the NUERS government admin user with credentials:
  - Email: admin@nuers.com
  - Password: 123456
  - Role: admin
  - Full name: NUERS Government Admin
  - Organization: Bureau of Internal Revenue (BIR)

  This uses Supabase's internal auth schema to create a confirmed user
  and inserts the corresponding profile row with role = 'admin'.
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@nuers.com';

  IF v_user_id IS NULL THEN
    -- Insert into auth.users with a bcrypt-hashed password for '123456'
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@nuers.com',
      crypt('123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"NUERS Government Admin","organization":"Bureau of Internal Revenue (BIR)"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO v_user_id;
  END IF;

  -- Upsert the profile row with admin role
  INSERT INTO profiles (id, email, role, full_name, organization)
  VALUES (
    v_user_id,
    'admin@nuers.com',
    'admin',
    'NUERS Government Admin',
    'Bureau of Internal Revenue (BIR)'
  )
  ON CONFLICT (id) DO UPDATE SET
    role         = 'admin',
    full_name    = 'NUERS Government Admin',
    organization = 'Bureau of Internal Revenue (BIR)',
    updated_at   = now();
END $$;

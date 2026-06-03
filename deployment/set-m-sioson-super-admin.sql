UPDATE profiles
SET role = 'super_admin',
    full_name = 'Mark Sioson',
    organization = 'Servxbit',
    updated_at = NOW()
WHERE email = 'm.sioson@servxbit.com';

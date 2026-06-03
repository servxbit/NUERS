UPDATE profiles
SET role = 'merchant',
    full_name = 'Servxbit Business Account',
    organization = 'Servxbit',
    updated_at = NOW()
WHERE email = 'm.sioson@servxbit.com';

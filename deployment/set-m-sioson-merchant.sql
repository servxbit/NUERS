UPDATE users
SET name = 'Servxbit Business Account',
    password = '$2y$10$Zkd2IuvsNhGbA3OvjmCdxuMJ/oP/TYBb55yPUQlO.CBacUIomw2aS',
    api_token = NULL,
    updated_at = NOW()
WHERE email = 'm.sioson@servxbit.com';

UPDATE profiles
SET role = 'merchant',
    full_name = 'Servxbit Business Account',
    organization = 'Servxbit Business Account',
    updated_at = NOW()
WHERE email = 'm.sioson@servxbit.com';

UPDATE merchants
SET merchant_account_email = 'm.sioson@servxbit.com',
    merchant_account_id = (SELECT id FROM users WHERE email = 'm.sioson@servxbit.com')
WHERE email = 'm.sioson@servxbit.com'
   OR merchant_account_email = 'm.sioson@servxbit.com'
   OR business_name LIKE 'Servxbit%';

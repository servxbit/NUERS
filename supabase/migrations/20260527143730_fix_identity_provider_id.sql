/*
  # Fix Auth Identity Provider IDs

  Manually created identities used UUID as provider_id but GoTrue expects
  the email address as provider_id for email/password auth. This fixes both accounts.
*/

UPDATE auth.identities
SET provider_id = 'admin@nuers.com',
    identity_data = jsonb_build_object('sub', user_id::text, 'email', 'admin@nuers.com', 'email_verified', true, 'provider_id', 'admin@nuers.com')
WHERE provider = 'email' AND user_id = (SELECT id FROM auth.users WHERE email = 'admin@nuers.com');

UPDATE auth.identities
SET provider_id = 'customer@nuers.com',
    identity_data = jsonb_build_object('sub', user_id::text, 'email', 'customer@nuers.com', 'email_verified', true, 'provider_id', 'customer@nuers.com')
WHERE provider = 'email' AND user_id = (SELECT id FROM auth.users WHERE email = 'customer@nuers.com');

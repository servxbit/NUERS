# Local and Live Database Workflow

The local NUERS app should use the same MySQL database as the live site at `nuers.net`.

## Local Runtime

- Keep live database credentials in the local `.env` file only.
- `.env` is ignored by git and must not be committed.
- Use `deployment/nuers-net-mysql.env.example` as the safe template for local or server environment setup.
- The expected local database connection is:
  - `DB_CONNECTION=mysql`
  - `DB_HOST=194.233.94.62`
  - `DB_DATABASE=NUERS`

## Git Deployment

- Code changes, migrations, seeders, and deployment scripts should be committed and deployed through git.
- After deploying code to the live server, run Laravel migrations on the server so schema changes are applied to the same live database.
- Do not deploy SQLite `.env` settings to live.

## Live Server Check

If `nuers.net` shows no invoices while MySQL has records, the live server is still reading a different database or using stale Laravel config cache.

Expected proof for the Servxbit account:

- MySQL `business_invoices` has invoice `VI-2026-001001`.
- The invoice `merchant_id` is `b17965a6-b371-4230-940d-15d18197daca`.
- The current Servxbit merchant row uses the same id.

After updating the live `.env` from `deployment/nuers-net-mysql.env.example`, run these commands on the live server:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan migrate --force
```

## Safety Rule

Because local and live use the same database, local data edits are production data edits. Test UI/code locally, but treat database writes as live changes.

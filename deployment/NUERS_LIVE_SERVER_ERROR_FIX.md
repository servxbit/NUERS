# NUERS Live Server Error Fix

The live `Server Error` happens when Laravel can run but cannot read the live database.

For the MySQL deployment on `nuers.net`, update the server `.env`:

- Set `APP_ENV=production`
- Set `APP_DEBUG=false`
- Set `APP_URL=https://nuers.net`
- Set `DB_CONNECTION=mysql`
- Set `DB_HOST=194.233.94.62`
- Set `DB_PORT=3306`
- Set `DB_DATABASE=NUERS`
- Set `DB_USERNAME=nuers`
- Set `DB_PASSWORD` to the production database password
- Remove any old SQLite-only `DB_DATABASE=/Applications/XAMPP/...` line

After upload, clear Laravel cached config:

```sh
php artisan optimize:clear
```

If SSH is unavailable, delete this cached config file in Plesk File Manager:

```text
bootstrap/cache/config.php
```

The remote MySQL database has the NUERS schema and data. The screenshot account currently exists in MySQL:

```text
m.sioson@servxbit.com
```

If this account should be Super Admin, update its profile role to `super_admin`.

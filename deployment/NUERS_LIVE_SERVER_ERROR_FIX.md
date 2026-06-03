# NUERS Live Server Error Fix

The live login `Server Error` happens when Laravel can run but cannot read the live database.

For the SQLite deployment, upload `database/database.sqlite` into the Laravel project root on the server and update the server `.env`:

- Set `APP_ENV=production`
- Set `APP_DEBUG=false`
- Set `APP_URL=https://nuers.net`
- Set `DB_CONNECTION=sqlite`
- Remove the local Mac-only `DB_DATABASE=/Applications/XAMPP/...` line

After upload, clear Laravel cached config:

```sh
php artisan optimize:clear
```

The packaged SQLite database includes the screenshot account:

```text
m.sioson@servxbit.com
role: super_admin
```

Use the current known password, then change it after first successful login.

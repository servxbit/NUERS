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

## Safety Rule

Because local and live use the same database, local data edits are production data edits. Test UI/code locally, but treat database writes as live changes.

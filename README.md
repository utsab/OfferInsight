Dependencies:
- **Node.js** `>=24.11.0` (this repo targets **Node 24**; Prisma 7 expects it)
- **pnpm** — version pinned via `packageManager` in `package.json` (use [Corepack](https://nodejs.org/api/corepack.html) to match)
- **PostgreSQL** (see below)

### Node 24, pnpm, and Prisma (setup for a new machine)

1. **Install Node 24 with nvm**
   ```bash
   nvm install 24
   nvm alias default 24
   node -v   # should show v24.x
   ```

2. **Enable pnpm via Corepack** (recommended so your pnpm matches the repo)
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   pnpm -v
   ```
   After installing a **new** Node version with nvm, run `corepack enable` again if `pnpm` is missing from your PATH.

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Generate Prisma Client**
   ```bash
   pnpm prisma generate
   ```
   If Prisma fails with an ESM error on an older Node (e.g. some tooling still on Node 20), use the nvm-pinned scripts (see `package.json` → `prisma:*:nvm`). Those prepend `~/.nvm/versions/node/<version>/bin` so Prisma runs on Node 24.

5. **Optional: upgrade packages**
   ```bash
   pnpm outdated
   pnpm update --latest   # review and test after upgrading
   ```

6. **Pinned nvm path in `package.json`**  
   The `prisma:*:nvm` scripts include a path like `v24.15.0`. If you install a **different patch** of Node 24 (new folder under `~/.nvm/versions/node/`), update those three `PATH=...` lines and commit so teammates get the same path when they pull.

**Production (e.g. Vercel):** set the project to **Node 24**. The default `build` / `prisma:generate` flow does not rely on local nvm paths on the server; `vercel.json` uses `pnpm install` and `pnpm run build`.

---

Setting up oAuth to allow Github authentication: 
1. Make a Github developer app
2. For the homepage url, put anything (google.com)
3. For the callback url, if you're on codespaces, then find out your codespace public url and append the following: /api/auth/callback/
4. You can uncheck the "webhooks" option when creating the github app
5. Generate a new client secret, copy that value into AUTH_GITHUB_SECRET
6. For AUTH_SECRET, you can put in any random value, e.g ("12345")
7. For NEXTAUTH_URL, it should either be http://localhost:3000 or your custom Github codespace public url

   
Commands used to install dependencies:
---
```
pnpm install

npx auth secret
|_
	say yes to install
```

Installing and starting PostgreSQL:
---
```
Linux commands to install and start POSTGRESQL:

sudo apt-get update  
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

sudo vim /etc/sudoers.d/codespace
|_
    change root to ALL in the first line (lookup VIM cheatsheet)

sudo -i -u postgres

Mac:
brew install postgresql
brew services start postgresql
```

After starting the service, commands to setup postgresql:
---
```
Linux:
psql

Mac:
psql -d postgres

postgres=# CREATE USER <your_name> WITH PASSWORD '<your_password>';
postgres=# ALTER USER <your_name> WITH SUPERUSER;
postgres=# CREATE DATABASE offer_insight;
postgres=# GRANT ALL PRIVILEGES ON DATABASE offer_insight TO <your_name>;
postgres=# \q
postgres@codespaces-c5d24c:/workspaces/JobSearchTracker$ exit
```

Setup .env (enviroment variables) DATABASE_URL before running below pnpm commands (also NOT .env.local)
---
Copy the .env.sample file to make a new file named .env

DATABASE_URL="postgresql://<your_username>:<your_password>@localhost:5432/offer_insight"

---
```
pnpm prisma migrate dev --name init   # only when postgresql is running
pnpm prisma generate
pnpm prisma studio
```


Commands to start every instance of codespace:
---
```
If postgresql not already running:

Linux:
sudo service postgresql start

Mac:
brew services start postgresql

If major changes were pulled with new dependencies:
pnpm install

If changes were made to database:
pnpm prisma migrate dev
pnpm prisma generate

If you want GUI for databasae ala Prisma:
pnpm prisma studio (optional if you want GUI)

Starts the website:
pnpm dev
```

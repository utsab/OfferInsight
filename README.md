## Next.js App Router Course - Starter

This is the starter template for the Next.js App Router Course. It contains the starting code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.

Commands used to install and start Prisma/PostgreSQL:

pnpm add -D prisma
pnpm add @prisma/client
pnpm add pg
pnpm prisma init
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
pnpm prisma generate
sudo vim /etc/sudoers.d/codespace
sudo systemctl start postgresql
sudo -i -u postgres
postgres=# CREATE USER johndoe WITH PASSWORD 'randompassword';
postgres=# CREATE USER ttran913 WITH PASSWORD '********';
postgres=# ALTER USER ttran913 WITH SUPERUSER;
postgres=# CREATE DATABASE offer_insight;
postgres=# GRANT ALL PRIVILEGES ON DATABASE offer_insight TO ttran913;
postgres=# \q
postgres@codespaces-c5d24c:/workspaces/JobSearchTracker$ exit
pnpm prisma migrate dev --name init
pnpm prisma generate
pnpm prisma studio
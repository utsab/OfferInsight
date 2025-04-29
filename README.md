## Next.js App Router Course - Starter

This is the starter template for the Next.js App Router Course. It contains the starting code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.

Dependencies: 
- npm (>=10.9.0)
- pnpm (>=9.15.2) 
- node (>=20.12.0)
  
Setting up oAuth to allow Github authentication: 
1. Make a Github developer app
2. For the homepage url, put anything (google.com)
3. For the callback url, if you're on codespaces, then find out your codespace public url and append the following: /api/auth/callback/
4. You can uncheck the "webhooks" option when creating the github app
5. Generate a new client secret, copy that value into AUTH_GITHUB_SECRET
6. For AUTH_SECRET, you can put in any random value, e.g ("12345")
7. For NEXTAUTH_URL, it should either be http://localhost:3000 or your custom Github codespace public url

   
Commands used to install and start Prisma/PostgreSQL:
---
```
pnpm install

npx auth secret
|_
	say yes to install

(Note: the following 4 commands will not work on Mac.  Find an alternative. ) 
sudo apt-get update  
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

sudo vim /etc/sudoers.d/codespace
|_
    change root to ALL in the first line (lookup VIM cheatsheet)

sudo -i -u postgres
psql
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
pnpm prisma migrate dev --name init  //only works when postgresql is running
pnpm prisma generate
pnpm prisma studio
```


Commands to start every instance of codespace:
---
```
sudo service postgresql start
sudo service postgresql status
pnpm prisma generate (maybe not needed, seems only if made changes to schema)
pnpm prisma migrate dev (also maybe not needed if no changes made to database??)
pnpm prisma studio (optional if I want GUI)
pnpm dev
```

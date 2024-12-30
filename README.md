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
```

npx prisma generate
npx prisma db push


(Note: the following 3 commands will not work on Mac.  Find an alternative. ) 
sudo apt-get update  
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

pnpm prisma generate
sudo vim /etc/sudoers.d/codespace
sudo systemctl start postgresql (TODO: Do we need this?  Seems redundant, because we ran "sudo service postgresql start" above) 

sudo -i -u postgres
psql
postgres=# CREATE USER johndoe WITH PASSWORD 'randompassword';
postgres=# CREATE USER ttran913 WITH PASSWORD '********';
postgres=# ALTER USER ttran913 WITH SUPERUSER;
postgres=# CREATE DATABASE offer_insight;
postgres=# GRANT ALL PRIVILEGES ON DATABASE offer_insight TO ttran913;
postgres=# \q
postgres@codespaces-c5d24c:/workspaces/JobSearchTracker$ exit
pnpm prisma migrate dev --name init  //only works when postgresql is running
pnpm prisma generate
pnpm prisma studio
```

Update the .env file. Set database url to include your postgres login details. 

```
DATABASE_URL="postgresql://<your_username>:<your_password>@localhost:5432/offerinsight"
```

Commands to start every instance of codespace:
```
sudo service postgresql start
sudo service postgresql status
pnpm prisma generate (maybe not needed, seems only if made changes to schema)
pnpm prisma migrate dev (also maybe not needed if no changes made to database??)
pnpm prisma studio (optional if I want GUI)
pnpm dev
```

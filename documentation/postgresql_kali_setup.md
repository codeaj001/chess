# PostgreSQL Setup on Kali Linux for CompChess

This document provides step-by-step instructions for setting up PostgreSQL on Kali Linux for the CompChess AI Chess Betting Platform.

## 1. Installing PostgreSQL

First, update your package lists and install PostgreSQL:

```bash
# Update package lists
sudo apt update

# Install PostgreSQL and the PostgreSQL contrib package
sudo apt install postgresql postgresql-contrib
```

## 2. Verifying the Installation

Check if PostgreSQL service is running:

```bash
sudo systemctl status postgresql
```

If it's not running, start it:

```bash
sudo systemctl start postgresql
```

Enable PostgreSQL to start on boot:

```bash
sudo systemctl enable postgresql
```

## 3. Setting Up PostgreSQL User and Database

By default, PostgreSQL creates a user named 'postgres'. Switch to this user:

```bash
sudo -i -u postgres
```

Create a database user for CompChess:

```bash
createuser --interactive --pwprompt
```

When prompted:
- Enter name of role to add: `compchess`
- Enter password for new role: `[your-secure-password]`
- Shall the new role be a superuser? `n`
- Shall the new role be allowed to create databases? `y`
- Shall the new role be allowed to create more new roles? `n`

Create a database for the application:

```bash
createdb compchess_db -O compchess
```

Exit the postgres user shell:

```bash
exit
```

## 4. Configuring PostgreSQL Access

Edit the PostgreSQL client authentication configuration file:

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Add the following line to allow password authentication for local connections:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    compchess_db    compchess       127.0.0.1/32            md5
host    compchess_db    compchess       ::1/128                 md5
```

Save and close the file.

Edit the PostgreSQL configuration file to allow connections:

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Find the line with `listen_addresses` and change it to:

```
listen_addresses = 'localhost'
```

Save and close the file.

Restart PostgreSQL to apply changes:

```bash
sudo systemctl restart postgresql
```

## 5. Setting Up Environment Variables

Create environment variables for the application:

```bash
# Add these to your ~/.bashrc or ~/.zshrc file
echo 'export DATABASE_URL="postgresql://compchess:[your-secure-password]@localhost:5432/compchess_db"' >> ~/.bashrc
echo 'export PGUSER="compchess"' >> ~/.bashrc
echo 'export PGPASSWORD="[your-secure-password]"' >> ~/.bashrc
echo 'export PGDATABASE="compchess_db"' >> ~/.bashrc
echo 'export PGHOST="localhost"' >> ~/.bashrc
echo 'export PGPORT="5432"' >> ~/.bashrc
```

Apply the changes:

```bash
source ~/.bashrc
```

## 6. Database Schema Setup

Navigate to your CompChess project directory and run:

```bash
# Install dependencies if not already done
npm install

# Generate and apply the database schema
npm run db:push
```

This will create all the necessary tables based on the schema defined in `shared/schema.ts`.

## 7. Seeding the Database

Populate the database with initial data:

```bash
npm run db:seed
```

This will add AI models, sample matches, and bets to the database.

## 8. Verifying the Setup

Connect to the database to verify the setup:

```bash
psql -U compchess -d compchess_db
```

Once connected, you can list the tables:

```sql
\dt
```

You should see the following tables:
- users
- ai_models
- chess_matches
- bets

To view the data in a table:

```sql
SELECT * FROM ai_models;
```

Exit the PostgreSQL shell:

```sql
\q
```

## 9. Connecting the Application

Update your application's database connection configuration in `db/index.ts` to use the environment variables:

```typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/pg-pool";
import * as schema from "@shared/schema";

// Create a connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Or use individual parameters:
  // user: process.env.PGUSER,
  // password: process.env.PGPASSWORD,
  // host: process.env.PGHOST,
  // port: parseInt(process.env.PGPORT || '5432'),
  // database: process.env.PGDATABASE,
});

// Create the Drizzle ORM instance
export const db = drizzle({ client: pool, schema });
```

## 10. Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Check if PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Verify your environment variables:
   ```bash
   echo $DATABASE_URL
   ```

3. Ensure the PostgreSQL port is open:
   ```bash
   sudo ss -tunelp | grep 5432
   ```

### Permission Issues

If you encounter permission issues:

1. Check the PostgreSQL logs:
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

2. Verify the user has appropriate permissions:
   ```bash
   sudo -u postgres psql -c "SELECT rolname, rolsuper, rolcreatedb FROM pg_roles WHERE rolname='compchess';"
   ```

### Database Backup and Restore

To backup your database:

```bash
pg_dump -U compchess -d compchess_db > compchess_backup.sql
```

To restore from a backup:

```bash
psql -U compchess -d compchess_db < compchess_backup.sql
```

## 11. PostgreSQL Management Tools (Optional)

For a graphical interface to manage your PostgreSQL database, you can install pgAdmin:

```bash
# Add PostgreSQL repository
curl https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo apt-key add -
sudo sh -c 'echo "deb https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list'

# Update package lists
sudo apt update

# Install pgAdmin4
sudo apt install pgadmin4
```

Launch pgAdmin4 and connect to your database using the credentials you created.
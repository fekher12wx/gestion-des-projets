# PostgreSQL Connection Troubleshooting

## Issue
Authentication failed when trying to connect to PostgreSQL database.

## Quick Fix Steps

### Step 1: Test PostgreSQL Connection Manually

Open a new terminal and run:

```bash
psql -U postgres
```

This will prompt you for the postgres user password. **Enter the password you set during PostgreSQL installation.**

If this works, you'll see:
```
Password for user postgres:
psql (17.5)
Type "help" for help.

postgres=#
```

### Step 2: Once Connected, Create the Database

Inside the psql prompt:

```sql
CREATE DATABASE poi_ftth_db;
\l
\q
```

### Step 3: Update Your .env File

Replace line 16 in `backend/.env` with the ACTUAL password you just used:

**Before:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/poi_ftth_db?schema=public"
```

**After** (replace YOUR_PASSWORD with your actual PostgreSQL password):
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/poi_ftth_db?schema=public"
```

Also update line 21:
```env
DB_PASSWORD=YOUR_PASSWORD
```

### Step 4: Run Migration Again

```bash
npx prisma migrate dev --name init
```

---

## Alternative: If You Don't Remember the Password

### Option A: Find PostgreSQL Password

Check if you have it saved in:
- pgAdmin connection settings
- Windows Credential Manager
- Your password manager

### Option B: Reset PostgreSQL Password

1. Find your PostgreSQL data directory (usually `C:\Program Files\PostgreSQL\17\data`)

2. Edit `pg_hba.conf`:
   - Change the METHOD from `scram-sha-256` to `trust` for local connections
   - Save the file

3. Restart PostgreSQL service:
```powershell
Restart-Service postgresql-x64-17
```

4. Connect without password:
```bash
psql -U postgres
```

5. Reset the password:
```sql
ALTER USER postgres WITH PASSWORD 'new_password_here';
\q
```

6. Restore `pg_hba.conf` (change `trust` back to `scram-sha-256`)

7. Restart PostgreSQL again

8. Update your `.env` file with the new password

---

## Option C: Use pgAdmin (Easiest)

1. Open **pgAdmin** (should be installed with PostgreSQL)
2. It will prompt for your master password
3. Once in, expand "Servers" → "PostgreSQL 17"
4. Right-click "Databases" → Create → Database
5. Name: `poi_ftth_db`
6. Click Save

Then find your password in pgAdmin's connection settings:
- Right-click "PostgreSQL 17"
- Properties
- Connection tab
- The password might be saved there

---

## Quick Test Command

Try this to isolate the issue:

```bash
# This will show if PostgreSQL is accessible
psql -U postgres -d postgres -c "SELECT version();"
```

If this prompts for password and then works, **that password** is what you need in your `.env` file.

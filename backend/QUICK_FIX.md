# Quick Fix for Prisma DATABASE_URL Issue

## The Problem
Prisma CLI is not reading your `.env` file properly. Your DATABASE_URL exists but Prisma can't find it.

## Quick Solution

**Option 1: Fix your .env file format**

Make sure your `.env` file in the `backend` directory has NO SPACES around the `=` sign:

```env
DATABASE_URL="postgresql://jubril:jubril1178@postgres:5432/moniedup"
```

NOT:
```env
DATABASE_URL = "postgresql://..."  ❌ (spaces around =)
```

**Option 2: If running app on host machine (not in Docker)**

Change `postgres` to `localhost` in your DATABASE_URL:

```env
DATABASE_URL="postgresql://jubril:jubril1178@localhost:5432/moniedup"
```

**Option 3: Test if Prisma can see it**

Run this to verify:
```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

If this prints your URL, the issue is with Prisma config loading.
If it prints `undefined`, your .env file has formatting issues.

## Temporary Workaround

If nothing works, you can set it as an environment variable directly:

**Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://jubril:jubril1178@localhost:5432/moniedup"
npx prisma validate
```

**Windows CMD:**
```cmd
set DATABASE_URL=postgresql://jubril:jubril1178@localhost:5432/moniedup
npx prisma validate
```


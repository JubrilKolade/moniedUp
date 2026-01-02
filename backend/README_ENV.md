# Environment Setup

## Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Connection (PostgreSQL)
# For Docker PostgreSQL running on localhost:
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# For Docker Compose (if database service is named 'postgres'):
# DATABASE_URL="postgresql://username:password@postgres:5432/database_name?schema=public"

# JWT Secret (change this in production!)
JWT_SECRET=your-secret-key-here-change-this-in-production

# Server Port (optional, defaults to 3000)
PORT=3000

# CORS Origin (optional)
CORS_ORIGIN=http://localhost:3000

# Environment (optional)
NODE_ENV=development
```

## Docker PostgreSQL Example

If you're using Docker for PostgreSQL, your `DATABASE_URL` should look like:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/moniedup?schema=public"
```

Replace:
- `postgres` (first) = your PostgreSQL username
- `postgres` (second) = your PostgreSQL password  
- `localhost` = use `localhost` if app runs on host, or service name if in Docker Compose
- `5432` = PostgreSQL port (default)
- `moniedup` = your database name

## Verifying Your Setup

1. Make sure your `.env` file exists in the `backend` directory
2. Check that `DATABASE_URL` is set correctly
3. Test the connection: `npx prisma db pull` or `npx prisma studio`


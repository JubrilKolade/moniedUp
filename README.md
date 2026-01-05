# MoniedUp (Backend)

A simple fintech backend built with TypeScript, Express and Sequelize (PostgreSQL).

**Features**

- User registration, login (JWT), profile management ✅
- Account creation and balance retrieval ✅
- Transactions: transfers, deposits, withdrawals (with limits & checks) ✅
- Two-factor authentication (TOTP) with QR code generation ✅
- Card issuance and management ✅
- Admin endpoints to manage users ✅
- Validation with Zod and centralized error handling ✅

---

## 🔧 Tech stack

- Node.js + TypeScript
- Express
- Sequelize ORM (Postgres)
- JWT (jsonwebtoken)
- Zod (request validation)
- bcryptjs, speakeasy, qrcode

---

## 🚀 Getting started

1. Clone the repo and install dependencies

```bash
cd backend
npm install
```

2. Create a `.env` file in `backend/` (see **Environment** below)

3. Run in development

```bash
npm run dev
```

4. Build and run production

```bash
npm run build
npm start
```

> The server defaults to port `3000` (override with `PORT`). Health check: `GET /health`.

---

## 🔐 Environment variables

Create `backend/.env` with the following (example):

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
JWT_SECRET=your-secret-key-here-change-this-in-production
PORT=3000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Notes:
- `DATABASE_URL` must be a valid PostgreSQL connection string.
- `JWT_SECRET` is required — server will exit if missing.

---

## 🗂 Project structure (relevant)

- `server.ts` — app entry, route mounting and DB connect
- `config/db.ts` — Sequelize connection
- `models/` — Sequelize models and relationships
- `controllers/` — request handlers
- `services/` — business logic (DB operations)
- `routes/` — API routes
- `middleware/` — auth, validations, error handlers
- `validators/` — Zod schemas for request validation

---

## 📡 API (main endpoints)

All endpoints are prefixed with `/api/v1`.

- Users
  - POST `/api/v1/users/register` — register (body: name, email, password, phone, address)
  - POST `/api/v1/users/login` — login (body: email, password) → returns `{ token }`
  - POST `/api/v1/users/logout` — logout (auth)
  - GET `/api/v1/users/profile` — get authenticated user's profile (auth)
  - PUT `/api/v1/users/:userId` — update user (auth + ownership)
  - DELETE `/api/v1/users/:userId` — delete user (auth + ownership)

- Accounts
  - POST `/api/v1/accounts` — create account (auth)
  - GET `/api/v1/accounts/:userId/balance` — get balance (auth + ownership)

- Transactions
  - POST `/api/v1/transactions` — create transaction (transfer, deposit, withdrawal)
    - body for transfer: `{ type: 'transfer', fromAccountId, toAccountId, amount, description? }`
    - deposit: `{ type: 'deposit', toAccountId, amount }`
    - withdrawal: `{ type: 'withdrawal', fromAccountId, amount }`
  - GET `/api/v1/transactions/:accountId/history` — transaction history (auth + access control)

- Two-factor (2FA)
  - POST `/api/v1/two-factor/generate` — generate TOTP secret & QR (auth)
  - POST `/api/v1/two-factor/validate` — validate 2FA token (auth)

- Cards
  - POST `/api/v1/cards/apply` — apply for card (auth + account access)
  - GET `/api/v1/cards/:accountId` — list cards for account (auth + account access)
  - DELETE `/api/v1/cards/:cardId` — delete card (auth)

- Admin
  - GET `/api/v1/admin/users` — list all users (auth + admin role)

---

## 🔑 Authentication & authorization

- JWT-based authentication. Include header: `Authorization: Bearer <token>`.
- `authenticateToken` middleware validates token and attaches `userId` (and optional `userRole`) to the request.
- `authorizeUser` enforces ownership or admin rights where needed.

---

## ✅ Validation & Error handling

- Requests are validated using Zod schemas in `validators/` and `middleware/validation.middleware.ts`.
- Centralized error handling via `middleware/error.middleware.ts` and `AppError` for predictable responses.

---

## ⚠️ Database

- The app uses Sequelize. On non-production starts, it runs `sequelize.sync()` to create tables automatically. For production, use real migrations.
- See `config/db.ts` and `SEQUELIZE_GUIDE.md` for notes and migration guidance.

---

## 📋 Example curl requests

Register & Login

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"pass123","phone":"1234567890","address":"123 Main St"}'

curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"pass123"}'
# Response contains a JWT token to use in Authorization header
```

Create account (authenticated)

```bash
curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"savings"}'
```

Transfer (authenticated)

```bash
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"transfer","fromAccountId":"<from>","toAccountId":"<to>","amount":100.5}'
```

---

## 🧪 Tests

There are no tests included at present. Contributions adding tests are welcome.

---

## 🤝 Contributing

PRs welcome. Please open issues for bugs or feature requests. Maintain coding conventions (TypeScript, ESLint if present) and add tests when possible.

---

## 📄 License

This project does not include an explicit license file. Add a `LICENSE` if you wish to set one.

---


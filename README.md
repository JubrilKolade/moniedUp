# 🏦 MoniedUp

A premium, modern fintech backend built with **TypeScript**, **Express**, and **Sequelize**. MoniedUp provides a robust foundation for building banking applications with a focus on security, compliance, and social features.

---

## ✨ Key Features

### 👤 User Management & Compliance
- **Secure Authentication**: JWT-based login, registration, and profile management.
- **2FA Security**: Integrated Two-Factor Authentication (TOTP) with QR code generation for enhanced account security.
- **KYC Workflow**: Automated identity verification process with multi-tier limits (Tier 1 → Tier 2 upon verification).
- **Unique Usernames**: Human-readable handles (e.g., `@alex`) for social interactions.

### 💰 Core Banking
- **Account Management**: Multiple account support with real-time balance tracking.
- **Transactions**: Secure deposits, withdrawals, and peer-to-peer transfers.
- **Limit Enforcement**: Dynamic transaction limits based on user tier and verification status.
- **Idempotency**: Safe transaction handling to prevent duplicate processing.

### 💳 Card Services
- **Virtual Cards**: Instant card issuance and lifecycle management linked to specific accounts.

### 🤝 Social & Notifications
- **Social Transfers**: Send money using `@usernames` instead of complex account IDs.
- **Bill Splitting**: Group split functionality to share expenses effortlessly.
- **Notification System**: Real-time alerts for transactions (deposits, credits, transfers) and system updates (KYC status).

---

## 🔧 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Database Architecture**: [Sequelize ORM](https://sequelize.org/) with PostgreSQL
- **Validation**: [Zod](https://zod.dev/) for type-safe request schemas
- **Security**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [speakeasy](https://github.com/speakeasyjs/speakeasy)
- **Utilities**: [qrcode](https://github.com/soldair/node-qrcode), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL instance

### Installation

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/moniedup"
   JWT_SECRET="your_secure_secret"
   PORT=3000
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ```

3. **Initialize Database**
   ```bash
   npm run build
   # Optional: run seeds/migrations if using them
   ```

4. **Launch Server**
   ```bash
   npm run dev
   ```
   > The API will be accessible at `http://localhost:3000/api/v1`. Health check: `GET /health`.

---

## 🛰 API Reference

### 🛡 KYC & Compliance
- `POST /api/v1/kyc/submit` — Submit identity documents for review.
- `PATCH /api/v1/kyc/admin/review/:userId` — [Admin] Approve or reject KYC submissions.

### 👯 Social & Splitting
- `POST /api/v1/split/bill` — Split a total amount among multiple users.
- *Transfers*: Both `toAccountId` and `@username` are supported in the transfer endpoint.

### 🔐 Authentication
- `POST /api/v1/users/register` — Create a new account.
- `POST /api/v1/users/login` — Authenticate and receive JWT.
- `POST /api/v1/two-factor/generate` — Setup 2FA.

### 💳 Transactions
- `POST /api/v1/transactions` — Perform deposits, withdrawals, or transfers.
- `GET /api/v1/transactions/:accountId/history` — Paginated transaction history.

---

## 🗂 Project Structure

- `src/services/` — Core business logic and database interactions.
- `src/routes/` — API endpoint definitions.
- `src/models/` — Database schemas and relationships.
- `src/middleware/` — Auth, error handling, and request validation.
- `src/controllers/` — Request/Response handling.

---

## 🧪 Future Roadmap
- [ ] Integration with real-world payment providers (Stripe/Paystack).
- [ ] Multi-currency support and real-time exchange rates.
- [ ] Advanced fraud detection algorithms.
- [ ] Full integration testing suite (Jest/Supertest).

---

## 🤝 Community
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
ISC


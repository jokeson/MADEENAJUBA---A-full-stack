# MADEENAJUBA

A full-stack web application built with Next.js that connects residents, visitors, and communities through a central digital hub with integrated e-wallet functionality.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd app_image
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your actual values:
   - MongoDB connection string
   - Cloudinary credentials
   - JWT secret

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Creating an Admin User

After setting up the database, create your first admin user:

```bash
# Using the API endpoint (recommended)
curl -X POST http://localhost:3000/api/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your-secure-password"}'
```

Or use the script in `scripts/create-admin.ts` (if configured).

---

## 📖 Documentation

Product and tech README compiled from your 7-page brief about the MADEENAJUBA platform (city portal + fintech wallet "Kilimanjaro").

Overview

MADEENAJUBA is a full-stack web application built with Next.js and designed to connect residents, visitors, and communities through a central digital hub. The platform renders real-time news, events, job listings, business directories, and includes a fully integrated electronic wallet system called Kilimanjaro E-Wallet for peer-to-peer transactions.

The project uses:

- Next.js App Router
- Tailwind CSS
- MongoDB + Mongoose
- Zod Validation
- JWT / NextAuth Authentication
- Role-Based Permissions
- PDF generation for financial documents

🚀 Core Features

1. News Publishing System

Renders multiple categories:

- Politics
- Articles & Opinions
- Sports
- Breaking News

Journalists (assigned by Admin) can create and publish news posts.

Visitors and authenticated users can explore news by category.

2. Events Module

Supports community and entertainment events such as:

- Music concerts
- Conferences
- Fundraisers
- Campaigns
- Local gatherings

Event Logic:

Authenticated users can create events (free or paid).

Paid events require Admin approval before public rendering.

Event detail page renders:

- Event info
- Ticket price
- Organizer
- Live status

If event is live → "Live Now" animated tag renders automatically or via organizer trigger.

Ticket purchase system:

- If event is free → renders "Free Event"
- If paid → renders "Buy Ticket Now"

3. Job Listings Module

Companies and employers can create job posts.

All job listings render in the "Jobs" section.

Authenticated logic:

- Logged-in user → Apply Now
- Guest → Sign In To Apply

4. Advertisements Banner

Admins and Journalists can post advertisements.

Ads render across designated banner sections of the website.

Supports business promotions, community announcements, and events.

5. Business Directory (Real-Time Status)

The landing page renders real-time business status for:

- Pharmacies
- Clinics
- Restaurants
- Stores

Each listing shows:

- Business name
- Phone
- Address
- Manager
- Open / Closed status in real time

💳 Kilimanjaro E-Wallet System

The most important system inside MADEENAJUBA is Kilimanjaro, a secure peer-to-peer e-wallet.

6. Wallet Registration & Verification

Users must submit:

- First & Last Name
- Active phone number (receives OTP code)
- Email
- Residential address
- Valid ID (front & back)

Submission is validated with Zod schemas and stored in MongoDB.

After submitting, users see:

"YOUR APPLICATION IS UNDER REVIEW BY ADMIN. EXPECT A RESPONSE WITHIN 24 HOURS."

Admins receive a dashboard notification to review the application.

Admins can:

- Approve — user wallet activates
- Reject — user receives rejection reason

7. Wallet Dashboard (Upon Approval)

The wallet renders:

- Current Balance
- Send Money
- Deposit
- Withdraw
- Pay
- Unique Wallet ID (e.g., STR456)

If application was rejected → rejection message renders.

8. Peer-to-Peer Payment

Users can transfer funds using a recipient's Wallet ID.

Backend verifies:

- Existence of receiver
- Sender balance
- Zod schema validation
- Transaction logs
- Ledger update

9. Deposit System (Admin-Issued Redeem Codes)

Admins generate:

- Redeem Code (e.g. 7646-6789-7865-5000)
- 4-digit PIN (e.g. 8966)

Users enter both → wallet balance updates if valid.

10. Withdrawal Workflow (Cash Request)

User Withdrawal Steps

User enters withdrawal amount.

Backend checks sufficient balance.

If insufficient → renders "Insufficient Funds".

If successful:

- System generates a PDF Cash Request Document containing:
  - Wallet ID
  - Full Name
  - Amount
  - Timestamp
  - Reference Number (e.g. 456778)
- PDF becomes downloadable.
- Amount moves into a Pending Pool (expires after 24 hours).

24-Hour Expiry Logic

If finance/admin does not process payment:

- Amount automatically returns to wallet.
- Withdrawal canceled.
- User notified.

11. Finance/Admin Payout System

Only the Finance role has access to the Pay button.

Flow:

Finance clicks Pay → system asks for Reference Number.

System renders:

- User data (Full Name, Email, Wallet ID)
- Valid ID images (Front & Back from KYC documents)
- Withdrawal timestamp (when request was created)
- Transaction status (pending/success/failed)
- Withdrawal amount and expiration date

Finance confirms the payout.

System Actions

- Validates withdrawal is still pending and not expired
- Calculates 5% system fee from withdrawal amount
- Credits 5% fee to Admin wallet
- Records fee in fee ledger
- Updates withdrawal status to "processed"
- Updates transaction status to "success"
- Records Finance user who processed it
- Removes pending amount from system
- Generate Successful Transaction PDF for printing (future implementation)

PDF Documents Generated

- Cash Request PDF
- Withdrawal Confirmation PDF
- Transaction Receipt PDF

## Fee Ledger System

The Fee Ledger is a comprehensive admin dashboard feature that tracks and displays all system fees collected from various transactions.

### Fee Types & Rates

- **P2P Transfers**: 5% fee collected from sender
- **Ticket Sales**: 10% fee (when implemented)
- **Invoice Payments**: 5% fee (when implemented)
- **Cash Withdrawals**: 5% fee collected during payout processing

### Fee Ledger Features

- **Real-Time Fee Tracking**: Automatically records all fees when transactions occur
- **Fee Dashboard**: Displays summary cards with:
  - Total fees collected
  - Breakdown by category (P2P, Ticket, Invoice, Withdrawal)
  - Individual totals for each fee type
- **Detailed Transaction Table**: Shows:
  - Fee type with color-coded badges
  - Reference number for transaction tracking
  - Original transaction amount
  - Fee amount collected
  - Fee percentage rate (5% or 10%)
  - Transaction date
- **Automatic Categorization**: Fees are automatically categorized by transaction type
- **Transaction Linking**: Each fee is linked to its source transaction via reference number
- **Financial Reporting**: All fees are stored in the `fees` collection for accounting and reconciliation

### How Fees Are Recorded

1. **P2P Transfer Fees**: Recorded automatically when a user sends money
   - Fee amount: 5% of transfer amount
   - Stored in `fees` collection with type "transaction"
   - Linked to the sender's transaction via `transactionId`

2. **Withdrawal Fees**: Recorded when Finance processes a cash payout
   - Fee amount: 5% of withdrawal amount
   - Stored in `fees` collection with type "withdrawal"
   - Linked to the withdrawal transaction

3. **Ticket Fees**: Will be recorded when ticket sales are implemented
   - Fee amount: 10% of ticket sale
   - Stored in `fees` collection with type "transaction"

4. **Invoice Fees**: Will be recorded when invoice payments are implemented
   - Fee amount: 5% of invoice payment
   - Stored in `fees` collection with type "transaction"

### Admin Access

- Accessible via Admin Dashboard → Fee Ledger tab
- View all historical fees collected
- Monitor fee revenue in real-time
- Track fee collection trends
- Export fee data for accounting (future implementation)

Key Fees & Rules

P2P transfers: Sender pays 5% system fee (credited to Admin fee ledger).

Ticketing: Seller pays 10%; buyer pays face value.

Invoices: Payer pays 5%; issuer receives full invoice amount.

Withdrawals: User pays 5% system fee when Finance processes cash payout.

No self-transactions. Suspended/terminated wallets cannot transact.

Roles & Permissions

| Role           | Permissions                                                                            |
| -------------- | -------------------------------------------------------------------------------------- |
| **Admin**      | Approve events, wallets, jobs, ads. Assign roles. Generate redeem codes. Manage users. |
| **Journalist** | Post news, post advertisements.                                                        |
| **Employer**   | Post jobs.                                                                             |
| **User**       | Create events, buy tickets, apply for jobs, use wallet.                                |

### Admin Role - Detailed Capabilities

The **Admin** role is the highest privilege level in the MADEENAJUBA platform with comprehensive access to all system features and management functions.

#### Admin Dashboard Access

The Admin Dashboard (`/admin`) provides a centralized interface for managing all aspects of the platform through the following tabs:

1. **Users Management**
   - View all registered users in the system
   - Display user information: Email, Role, Creation Date, User ID
   - Update user roles (user, admin, journalist, employer, finance)
   - Real-time user count and statistics
   - Role-based filtering and management
   - **Important:** Role changes preserve all wallet data:
     - Wallet balance remains unchanged
     - Wallet ID remains the same
     - All transaction history is preserved
     - Wallet status (active/suspended/terminated) remains unchanged
     - Users retain full access to their wallet with all previous transactions
     - Role changes are purely permission-based and do not impact financial data

2. **Wallets Management**
   - View all wallet accounts in the system
   - Display wallet details: Wallet ID (STR### format), User Information, Balance, Status (active/suspended/terminated), Creation Date
   - View detailed transaction logs for each wallet
   - Monitor wallet activity and transaction history
   - Track wallet status and manage wallet lifecycle

3. **Fee Ledger**
   - View all system fees collected
   - Track fee transactions (P2P fees, ticket fees, invoice fees, withdrawal fees)
   - Monitor fee revenue and accounting
   - Export fee reports for financial reconciliation

4. **Redeem Code Generator**
   - Generate redeem codes for wallet deposits
   - Create codes with format: `####-####-####-####`
   - Generate 4-digit PINs for code security
   - Set redemption amounts
   - Set expiration dates for codes
   - Track code usage and redemption status

5. **KYC Review**
   - Review pending Know Your Customer (KYC) applications
   - View submitted user information: First Name, Last Name, Phone, Address
   - Review ID documents (Front & Back images)
   - Approve or reject wallet applications
   - Provide rejection reasons when denying applications
   - Process applications within 24-hour review window

#### Admin System Actions

**User Management:**
- Create admin users (via API endpoint `/api/create-admin`)
- Assign and modify user roles
- View complete user database
- Manage user access and permissions
- **Wallet Data Preservation:** When updating a user's role, all wallet data is preserved:
  - Wallet balance, ID, and status remain unchanged
  - Complete transaction history is maintained
  - No financial data is affected by role changes
  - Users continue to have access to their existing wallet and all previous transactions

**Wallet Operations:**
- Monitor all wallet transactions
- View wallet balances and status
- Access detailed transaction logs
- Track wallet creation and lifecycle

**Financial Management:**
- Receive 5% system fees from P2P transfers
- Receive 5% system fees from invoice payments
- Receive 10% system fees from ticket sales
- Manage fee ledger and accounting
- Generate redeem codes for wallet top-ups

**Content Moderation:**
- Approve or reject paid events before public listing
- Review and manage event submissions
- Moderate job postings
- Manage advertisement content

**KYC Verification:**
- Review identity verification documents
- Approve wallet registrations
- Reject applications with documented reasons
- Ensure compliance with KYC requirements

#### Admin Authentication

- Admin users are created with the `admin` role in MongoDB
- Admin credentials are securely hashed using PBKDF2 (SHA-512)
- Admin sessions are managed through MongoDB user IDs
- Admin access is protected by role-based access control (RBAC)

#### Admin Security Features

- All admin actions are server-side validated
- Role checks prevent unauthorized access
- Admin operations are logged for audit purposes
- Secure password hashing for admin accounts
- Session management through MongoDB authentication

#### Admin Workflow Examples

**Creating an Admin User:**
1. Access `/api/create-admin` endpoint (one-time setup)
2. System creates user with `admin` role in MongoDB
3. Password is securely hashed before storage
4. Admin can immediately sign in and access dashboard

**Reviewing KYC Application:**
1. Admin navigates to KYC Review tab
2. Views pending applications with user details and ID documents
3. Reviews identity verification documents
4. Approves application → Wallet is created for user
5. Rejects application → User receives rejection reason

**Managing User Roles:**
1. Admin navigates to Users tab
2. Views all users in system
3. Selects user and changes role via dropdown
4. System updates user role in MongoDB
5. Changes take effect immediately

**Generating Redeem Code:**
1. Admin navigates to Redeem Generator tab
2. Sets amount and expiration date
3. System generates unique code and PIN
4. Code is stored in MongoDB
5. Code can be shared with users for wallet deposits
UX & Navigation

Top Nav: News · Events · Jobs · Businesses · Wallet · Dashboard · Sign in/Up

Landing: Hero, “Explore Events” with status badges (Coming Up, Live Now), Business open/closed tiles, ads, latest news/jobs.

Detail Pages:

Event: cover, schedule, organizer, buy tickets, status chip.

Job: details + Apply Now (auth).

Wallet: Balance, Activity, Send, Redeem, Request Cash, Invoices/Receipts.

Admin: Users/Roles, KYC queue, Wallet registry, Fee ledger, Redeem generator, Transactions with refs.

Live status logic: Event becomes Live Now at start time automatically or when host taps Go Live.

Data Model (indicative)
// users
{ _id, firstName, lastName, email, phone, role: 'user'|'journalist'|'finance'|'employee'|'admin', status, createdAt }

// kycApplications
{ _id, userId, firstName, lastName, phone, address, idFrontUrl, idBackUrl,
  status: 'pending'|'approved'|'rejected', reviewerId, reason?, createdAt, updatedAt }

// wallets
{ _id, userId, walletId: 'STR###', balanceCents, status: 'active'|'suspended'|'terminated', createdAt }

// transactions
{ _id, type: 'send'|'fee'|'deposit'|'ticket_payout'|'invoice_payment'|'cash_payout',
  fromWalletId?, toWalletId?, amountCents, feeCents, ref: '######', status, meta: { eventId?, invoiceId?, redeemId? }, createdAt }

// redeemCodes
{ _id, code: '####-####-####-####', pin: '####', amountCents, issuedByAdminId, usedByWalletId?, usedAt? }

// events
{ _id, creatorUserId, title, details, startAt, endAt, imageUrl,
  isPaid, ticketPriceCents?, ticketQty?, approved: boolean,
  status: 'scheduled'|'live'|'ended'|'rejected', rejectedReason?, createdAt }

// tickets
{ _id, eventId, buyerUserId, qty, totalPaidCents, feeCents, netCents, createdAt }

// invoices
{ _id, issuerUserId, recipientWalletId, amountCents, purpose, note?,
  status: 'unpaid'|'paid', createdAt, paidAt? }

// businesses
{ _id, name, category, phone, address, managerName, isOpen: boolean, updatedAt }

Domain Rules

P2P: Deduct amount + 5% from sender; credit recipient amount; record a fee transaction to Admin ledger.

Event ticketing: Buyer balance ≥ price; seller receives price * 0.9; price * 0.1 to Admin.

Invoices: Payer charged amount + 5%; issuer credited amount; 5% to Admin.

Redeem: Valid code+PIN; single-use; atomic credit.

Cash Request: Sufficient funds → generate printable reference → Finance verifies and pays out → deduct & archive proof.

Protections: Block self-transfers; block suspended/terminated wallets; enforce auth for post/apply/buy/pay actions.

Project Structure (Next.js App Router)
apps/
  web/
    app/
      (public)/
        page.tsx                      # Landing
      news/
        page.tsx
        [slug]/page.tsx
      events/
        page.tsx
        [id]/page.tsx
      jobs/
        page.tsx
        [id]/page.tsx
      businesses/page.tsx
      wallet/
        page.tsx                      # Balance & activity
        send/page.tsx
        redeem/page.tsx
        request-cash/page.tsx
        invoices/
          page.tsx
          create/page.tsx
          [id]/page.tsx
      dashboard/page.tsx
      admin/
        page.tsx
        users/page.tsx
        kyc/page.tsx
        wallets/page.tsx
        fees/page.tsx
        redeem/page.tsx
        transactions/page.tsx
      auth/
        sign-in/page.tsx
        sign-up/page.tsx

    components/
      badges/{LiveNowBadge,ComingUpBadge}.tsx
      cards/{EventCard,JobCard,BusinessCard,NewsCard}.tsx
      wallet/{BalanceTile,SendForm,RedeemForm,CashRequestModal,InvoiceForm,TransactionsTable}.tsx
      admin/{UserTable,RoleDropdown,KycReviewDrawer,WalletTable,FeeLedger,RedeemGeneratorForm}.tsx
      ui/*

    lib/
      auth.ts
      rbac.ts
      zod-schemas.ts
      format.ts
      server-actions/
        wallet.ts
        events.ts
        invoices.ts
        admin.ts

    styles/globals.css
    tailwind.config.ts
    postcss.config.js
    next.config.mjs

🛠️ Tech Stack

Frontend

- Next.js (App Router)
- React Server Components
- Client Components for interactions
- TailwindCSS
- shadcn/ui
- Framer Motion

Backend

- Next.js API Routes
- Node.js
- MongoDB / Mongoose
- JWT / NextAuth
- Zod Validation
- File uploads (ID verification)
- PDF generation

🗄️ Database Structure (MongoDB Collections)

- users
- roles
- news
- events
- jobs
- ads
- wallets
- transactions
- redeemCodes
- pendingWithdrawals

Schemas validated using Zod + Mongoose.

Database Setup

MongoDB Configuration

1. Install MongoDB locally or use MongoDB Atlas (cloud).

2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local` with your actual configuration values:
   - MongoDB connection string
   - Cloudinary credentials (see `CLOUDINARY_SETUP.md` for details)
   - JWT secret (generate using: `openssl rand -base64 32`)

   See `.env.example` for all required environment variables.

3. The database connection is configured in `lib/db.ts` and uses connection pooling for optimal performance in serverless environments.

4. Database models and types are defined in `lib/db/models.ts`.

5. Utility functions for common database operations are available in `lib/db/utils.ts`.

Usage Example:

```typescript
import { getCollection } from "@/lib/db";
import { COLLECTIONS } from "@/lib/db/models";
import type { UserModel } from "@/lib/db/models";

// Get a collection
const users = await getCollection<UserModel>(COLLECTIONS.USERS);

// Or use utility functions
import { getUserByEmail, createUser } from "@/lib/db/utils";
const user = await getUserByEmail("user@example.com");
```# MADEENAJUBA---A-full-stack

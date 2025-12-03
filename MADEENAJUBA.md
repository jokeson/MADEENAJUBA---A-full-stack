# MADEENAJUBA

## Overview

MADEENAJUBA is a full-stack web application built with Next.js and designed to connect residents, visitors, and communities through a central digital hub. The platform renders real-time news, events, job listings, business directories, and includes a fully integrated electronic wallet system called Kilimanjaro E-Wallet for peer-to-peer transactions.

The project uses:

- Next.js App Router
- Tailwind CSS
- MongoDB + Mongoose
- Zod Validation
- JWT / NextAuth Authentication
- Role-Based Permissions
- PDF generation for financial documents

## 2) Core Feature Set

🚀 Core Features

### 1. News Publishing System

Renders multiple categories:

- Politics
- Sports
- Business & Economy
- Technology
- Entertainment
- Community & Local News
- Breaking News
- Opinion and Article
- Events
- Interview
- Lifestyle

Journalists (assigned by Admin) can create and publish news posts.

Visitors and authenticated users can explore news by category.

#### Post Creation & Publishing Module

This module enables authorized users to create and publish news articles within the application. It covers the entire workflow—from post creation to frontend rendering, full-page display, and user interaction features.

**🔐 Roles Allowed to Create Posts**

Only authenticated users with one of the following roles can create posts:

- **Journalist**
- **Employee**
- **Admin**

These users can access the Create Post interface directly from their dashboard accounts.

**✏️ Post Creation Workflow**

The Create Post page features a tabbed interface with two main sections:

**Tab 1: Create Post**

When creating a news post, the user can:

- Write content directly in the rich text input or paste text from an external source.
- Upload a news image (file upload or URL).
- Provide a news title.
- **Select a category** from the following options:
  - Politics
  - Sports
  - Business & Economy
  - Technology
  - Entertainment
  - Community & Local News
  - Breaking News
  - Opinion and Article
  - Events
  - Interview
  - Lifestyle
- Submit the post for immediate publishing.

After submission:

- The post is saved in the database with the selected category.
- The post automatically renders in the frontend Latest News section.

**Tab 2: Posts**

The Posts tab displays a list of all posts created by the current user (or all posts for admins):

- **For Journalists/Employees:** Shows only their own posts
- **For Admins:** Shows all posts created by all users
- Each post card displays:
  - Post image with category tag overlay
  - Post title
  - Publication date
  - View count
  - Category badge
- Posts are clickable and open the full details page
- **Delete functionality:**
  - Authors can delete their own posts
  - Admins can delete any post
  - Deletion removes the post and all associated comments

**🧩 Frontend Rendering (Latest News Section)**

Each post is displayed as a card component, containing:

- Feature image with **category tag** displayed as a badge overlay on the top-left of the image
- Title
- Publish date & time
- Short excerpt of the news
- A READ MORE button

When the user clicks READ MORE, they are routed to the full news details page using a dynamic URL that includes the post ID.

**📄 Full News Details Page**

The details page renders additional information in full layout:

- Large header image
- News title
- Date & time of publication
- Full content/details

At the bottom of the page, the author information is displayed:

- Author name
- Email address
- Profile avatar

**⭐ User Interaction Features**

The news details page supports multiple engagement options:

- **Like button** - Users can like posts (one like per user)
- **Share options** - Facebook, Email, TikTok (copy link)
- **Comment section** - Visible only to logged-in users

**Comment Features:**

- **Commenting:** Logged-in users can write comments that appear below the post
- **Reply to Comments:** Users can reply to existing comments, creating nested comment threads
- **Hide/Show Comments:** Post authors can hide or show the entire comments section
- **Comment Threading:** Replies are displayed in a nested structure under parent comments
- **Author Controls:** Post authors can manage comment visibility for their posts

**📌 Summary**

This feature provides a complete publishing flow allowing journalists, employees, and admins to publish news articles that are fully interactive on the frontend. It includes:

- **Category-based organization** with visual tags on post cards
- **Tabbed interface** for creating and managing posts
- **Post management** with delete functionality for authors and admins
- **Structured content rendering** with category display
- **Author attribution** with profile information
- **Engagement tools** including likes, shares, and threaded comments
- **Comment moderation** with hide/show functionality for authors
- **Clean routing** with dynamic IDs for post details

### 2. Events Module

Supports community and entertainment events such as:

- Music concerts
- Conferences
- Fundraisers
- Campaigns
- Local gatherings

#### Event Creation Flow (Free & Payable Events)

Authenticated users can create new events directly from their create event navigation link. The flow is similar to creating an invoice.

**Create Event Page:**

The Create Event page will render a "Create Event" button. When the user clicks this button, a modal component will be displayed, allowing the user to input all required event data, including:

- **title** - Event title/name
- **description / event details** - Full event description and details
- **startTime** - Event start time
- **endTime** - Event end time
- **eventDate** - Date of the event
- **eventImage** - Event image displayed on the landing page
- **isFree** - Boolean indicating if the event is free or payable
- **ticketPrice** - Required only if `isFree === false` (price per ticket)
- **ticketQuantity** - Number of tickets available for sale

When the user submits the form, the system will persist the event data in the database.

**Event Status Logic:**

- **If the event is payable:** It will be assigned a `PENDING` review status.
- **If the event is free:** It will be published immediately and render instantly on the landing page.

#### Admin Review Logic

**Payable Events:**

Payable events enter a `PENDING` state upon creation.

A notification will render to the creator saying:

> "Your event is under review. Admin will respond within 24 hours."

**Approval Process:**

Once approved by admin:

- The event status becomes `APPROVED`.
- The event will render automatically in the landing page section "Explore Madeenajuba's Events".
- A "Coming Up" tag will appear on the event card image.

**Rejection Process:**

If rejected:

- The system will send a message to the event creator with the reason for rejection.
- The event status becomes `REJECTED`.
- The event will not appear on the landing page.

**Free Events:**

Free events do not require admin approval. They are published immediately and render instantly on the landing page with status `APPROVED`.

#### Explore Madeenajuba's Event Section

The landing page will fetch all approved/free events and render cards displaying:

- **Event image** - The event cover image
- **Tag** - Status badge showing:
  - `FREE` - For free events
  - `COMING UP` - For approved payable events that haven't started
  - `LIVE NOW` - For events that are currently live
- **Event price** - Displayed if payable (e.g., "$50.00")
- **Title** - Event name
- **Short description** - Truncated description preview
- **More Details button** - Links to full event details page

**Live Event Status:**

If an event is live, the system will show an animated "Live Now" tag. This tag can be triggered:

- **Manually** by the event creator
- **Automatically** by the system when the current time matches the event's start time

#### Ticket Purchasing Flow

Authenticated users with sufficient balance in their e-wallet can purchase tickets from the event details page.

**Purchase Process:**

1. **User clicks "Buy Ticket"** on the event details page.

2. **Purchase Modal:**
   - A modal will render, letting the user choose:
     - **Number of tickets** - Quantity to purchase
     - **Total cost** - Auto-calculated (ticket price × quantity)

3. **When the user confirms:**

   **Balance Verification:**
   - The system checks the user's wallet balance.
   
   **If balance is sufficient:**
   - The ticket price is deducted from the buyer's wallet.
   - A ticket object is generated and stored in the database.
   - User is redirected to their Tickets tab, where the new ticket will be rendered.
   - Transaction is recorded with reference number.
   
   **If balance is insufficient:**
   - The system returns an error notification.
   - Purchase is blocked.
   - User must deposit funds before purchasing.

#### System Fees for Event Tickets

**Ticket Buyers:**
- Ticket buyers do not pay any fee.
- They pay only the ticket price.

**Ticket Sellers (Event Creators):**
- Ticket sellers pay a system fee.
- **Fee Rate:** 10% of ticket sales revenue

**Example:**
- If the event creator earns $500 from ticket sales:
  - The system deducts $50 (10%) as ticket sales fee.
  - The fee is transferred to admin as platform revenue.
  - The event creator receives $450 (90% of ticket sales).

**Fee Recording:**
- The 10% fee is recorded in the Admin Fee Ledger.
- Fee type: "ticket" or "ticket_sale"
- Fee appears in the Fee Ledger -> All Fees tab with:
  - Type: TICKET (color-coded badge)
  - Reference number: Transaction reference
  - Amount: Original ticket sale amount
  - Fee: 10% of the sale amount
  - Rate: 10%
  - Date: When the ticket was purchased

### 3. Job Listings Module

Companies and employers can create job posts.

All job listings render in the "Jobs" section.

Authenticated logic:

- Logged-in user → Apply Now
- Guest → Sign In To Apply

### 4. Advertisements Banner

Admins and Journalists can post advertisements.

Ads render across designated banner sections of the website.

Supports business promotions, community announcements, and events.

### 5. Business Directory (Real-Time Status)

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

### 6. Wallet Registration & Verification

**Wallet Application Flow:**

When a new user visits the wallet page (`/wallet`) without an existing wallet, they see an "Apply for Wallet" button. Clicking this button redirects them to the KYC application form (`/kyc`).

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

### 7. Wallet Dashboard (Upon Approval)

**For Users with Active Wallets:**

The wallet renders:

- Current Balance
- Send Money
- Deposit
- Withdraw
- Create Invoice/Receipt
- Invoices Tab (view received and issued invoices)
- Unique Wallet ID (e.g., STR456)
- Recent Transactions

**Pay Button Visibility:**

- **Admin and Finance roles:** Can see and use the "Pay" button to process cash withdrawal payouts
- **Regular users (user, journalist, employer, employee):** The "Pay" button is hidden from their wallet interface

**For Users with Suspended Wallets:**

If a user's wallet has been suspended by an admin, the wallet page displays:

- **Suspension Message:** "Your wallet has been suspended by an administrator"
- **Warning:** "Suspended wallets cannot send, receive, deposit, or withdraw funds"
- **Wallet ID:** Displayed for reference
- **No Wallet Functionality:** The wallet interface (balance, action buttons, transactions) is NOT rendered
- Users are instructed to contact support for more information

**For Users with Terminated Wallets:**

If a user's wallet has been terminated by an admin, the wallet page displays:

- **Termination Message:** "Your wallet has been terminated by an administrator"
- **Warning:** "This wallet is no longer active and all wallet functionality has been disabled"
- **Wallet ID:** Displayed for reference
- **No Wallet Functionality:** The wallet interface (balance, action buttons, transactions) is NOT rendered
- Users are instructed to contact support for more information

**For Users Without Wallets:**

If a user has not yet applied for a wallet or their application is pending/rejected, the wallet page displays:

- "Wallet Not Available" message
- "Apply for Wallet" button that redirects to the KYC application form

If application was rejected → rejection message renders on the KYC page.

### 8. Peer-to-Peer Payment

**Send Money Process:**

1. **Form Entry:**
   - User enters recipient Wallet ID (format: 3 letters + 3 digits, e.g., VXE445).
   - User enters amount to send.
   - User can optionally add a note.

2. **Recipient Verification:**
   - System validates Wallet ID format.
   - System verifies recipient wallet exists and is active.
   - System fetches recipient information (first name, last name from KYC data).

3. **Confirmation Step:**
   - After clicking "Continue", user sees a confirmation screen.
   - Confirmation UI displays:
     - **Amount:** Formatted as currency (e.g., $50.00)
     - **Recipient Wallet ID:** Displayed in monospace font
     - **Recipient Name:** First and last name from approved KYC
     - **Note:** Optional note if provided
   - User can review all transaction details before proceeding.

4. **Confirmation Actions:**
   - **Cancel Button:** Returns user to form entry step.
   - **Send Button:** Proceeds with money transfer.

5. **Backend Processing:**
   - Backend verifies:
     - Recipient wallet exists (double-checked)
     - Recipient wallet is active
     - Sender has sufficient balance (including 5% system fee, unless sender is admin)
     - Not a self-transaction
     - Wallet ID format is valid
   - If validation passes:
     - **Admin Fee Exemption:** Admin accounts are exempt from all fees. If the sender is an admin, no fee is deducted.
     - Deducts amount + 5% fee from sender (0% fee if sender is admin)
     - Credits amount to recipient
     - Records transaction logs
     - Updates fee ledger (5% fee to Admin, only if sender is not admin)
     - Returns success with reference number

### 9. Deposit System (Admin-Issued Redeem Codes)

Admins generate:

- Redeem Code (e.g. 7646-6789-7865-5000)
- 4-digit PIN (e.g. 8966)

Users enter both → wallet balance updates if valid.

### 10. Withdrawal Workflow (Cash Request)

**Withdraw Button Functionality:**

The **Withdraw button** allows users to take out money from their wallet balance through a **Cash Request Document** system. When a user initiates a withdrawal:

1. **Money is deducted from wallet balance** and moved into a **Pending Pool** for 24 hours
2. **System issues a Cash Request Document** with reference number
3. **Finance user processes the cash payout** within 24 hours
4. **If finance user doesn't process payment within 24 hours**, the full amount automatically returns to the user's wallet **without any fee deduction**

**User Withdrawal Steps:**

1. **Form Entry:**
   - User clicks the **Withdraw button** in their wallet interface
   - User enters withdrawal amount in the withdrawal modal
   - System validates amount format and ensures it's greater than 0

2. **Confirmation Step:**
   - After entering amount and clicking "Continue", user sees a confirmation screen
   - Confirmation UI displays:
     - **Withdrawal Amount:** Formatted as currency (e.g., $100.00)
     - **Important Notice:** Blue information box explaining the 24-hour return policy
   - User can review details before proceeding

3. **Confirmation Actions:**
   - **Cancel Button:** Returns user to form entry step
   - **Withdraw Button:** Proceeds with withdrawal request

4. **Backend Processing:**
   - Backend checks sufficient balance
   - If insufficient → renders "Insufficient Funds" error
   - If successful:
     - **Money is deducted from wallet balance** and moved to Pending Pool
     - System generates a **Cash Request Document** (PDF) containing:
       - Wallet ID
       - Full Name
       - Amount
       - Timestamp
       - Reference Number (e.g. 456778)
     - PDF becomes downloadable
     - Amount remains in **Pending Pool** for exactly 24 hours, waiting to be cashed out by Finance user

**24-Hour Expiry Logic:**

The withdrawal system operates with a strict 24-hour window:

- **Pending Pool:** Money is held in a pending pool for 24 hours from the time of withdrawal request
- **Finance Processing:** Finance user must process the cash payout within 24 hours
- **Automatic Return:** If finance user does not process payment within 24 hours:
  - **Full amount automatically returns to user wallet**
  - **No fee is deducted** from the returned amount
  - **Withdrawal request is deleted from the pool** (pool is cleared of expired data)
  - Transaction status is updated to "failed"
  - User receives full refund of their withdrawal amount

**Important Notice Displayed to Users:**

The confirmation screen includes a prominent notice informing users:
- "If your withdrawal request is not processed within 24 hours, the money will automatically be returned to your wallet account."
- This notice helps users understand the withdrawal process and ensures transparency about the 24-hour return policy
- Users are assured that if Finance doesn't process the payment, they will receive their full amount back without any deductions

### 11. Invoice/Receipt System

The Invoice/Receipt system is the second major integration in the application, allowing users to create and manage invoices or receipts for various transactions. This system enables users to request payments for services, rent, purchases, or any other financial obligations.

**Purpose of the System:**

The invoice/receipt system allows users to:
- Request money from other users by sending invoices to their wallet IDs
- Pay rent or bills through invoice requests
- Create receipts for purchases (e.g., car, bike, or other items)
- Track payment status for all issued and received invoices

**Invoice Creation Process (Sender/Issuer):**

1. **Accessing Invoice Creation:**
   - Users navigate to the wallet page (`/wallet`) or invoices section (`/wallet/invoices`)
   - Click the **"Create Invoice"** button
   - A modal window opens for invoice creation

2. **Invoice Form Fields:**
   The invoice creation modal requires the following information:
   - **Recipient Wallet ID:** The wallet ID of the user who will receive the invoice (format: 3 letters + 3 digits, e.g., VXE445)
   - **Item Description:** Details about the invoice item or service (e.g., "Monthly Rent", "Car Purchase", "Consultation Services")
   - **Amount:** The monetary amount requested (in dollars)
   - **Quantity:** Optional field for quantity if applicable (e.g., number of items, hours of service)
   - **Total:** Automatically calculated total amount (amount × quantity, if quantity is provided)

3. **Invoice Modal Actions:**
   - **Send Button:** Submits the invoice and sends it to the specified recipient wallet ID
   - **Cancel Button:** Closes the modal without creating the invoice

4. **Backend Processing (When Send is Clicked):**
   - System validates recipient wallet ID format
   - System verifies recipient wallet exists and is active
   - System prevents self-invoicing (issuer cannot send invoice to their own wallet)
   - System creates invoice record in database with status "unpaid"
   - Invoice is immediately available in the recipient's invoice tab
   - System generates invoice reference number for tracking

**Invoice Reception and Payment (Recipient):**

1. **Invoice Notification:**
   - Sent invoices appear in the **Invoices tab** (`/wallet/invoices`) of the recipient's wallet
   - Recipient can view all invoices sent to their wallet ID
   - Invoices are displayed with status indicators (unpaid/paid)

2. **Invoice Details Display:**
   When a recipient views a received invoice, they see:
   - **All details sent by the issuer:**
     - Item description
     - Amount requested
     - Quantity (if provided)
     - Total amount
     - Invoice reference number
     - Date created
     - Issuer information

3. **Recipient Actions:**
   Each received invoice displays two action buttons:
   - **Pay Button:** Allows the recipient to pay the invoice amount to the sender's wallet
   - **Cancel Button:** Allows the recipient to decline or cancel the invoice

4. **Payment Process (When Pay is Clicked):**
   - **Balance Verification:**
     - System checks if recipient has sufficient balance to cover the invoice amount plus fees
     - Payment requires recipient to have enough balance to cover:
       - Invoice amount
       - 5% system fee (unless recipient is admin - admin accounts are exempt from fees)
   - **If Insufficient Balance:**
     - Payment is blocked
     - Error message displayed: "Insufficient funds to pay this invoice"
     - Recipient must deposit funds before paying
   - **If Sufficient Balance:**
     - **Admin Fee Exemption:** Admin accounts are exempt from all invoice payment fees. If the payer is an admin, no fee is deducted.
     - System deducts invoice amount + 5% fee from recipient wallet (0% fee if recipient is admin)
     - System credits full invoice amount to issuer wallet
     - System records 5% fee in Admin fee ledger (only if recipient is not admin)
     - System creates transaction records for both parties:
       - Recipient: "invoice_payment" transaction (deducted amount)
       - Issuer: "receive" transaction (credited amount)
     - Invoice status is updated to "paid"
     - Payment timestamp is recorded
     - Success message displayed with transaction reference number

**Invoice Status Tracking:**
- **Unpaid:** Invoice is pending payment from recipient
- **Paid:** Invoice has been successfully paid and funds transferred

**Invoice Management:**
- Users can view all invoices they have issued (sent invoices)
- Users can view all invoices they have received (received invoices)
- Users can view invoice details including payment status and transaction history
- Invoice reference numbers allow tracking and verification

**System Fees for Invoice Payments:**
- **Standard Users:** 5% system fee deducted from invoice amount when paying
- **Admin Users:** 0% fee (admin accounts are completely exempt from invoice payment fees)
- Fee is recorded in Admin fee ledger for accounting purposes
- Fee percentage can be configured in system settings (default: 5%)

**Example Invoice Payment Flow:**
1. User A creates invoice for $1,000 and sends to User B's wallet ID (VXE445)
2. User B sees invoice in their Invoices tab
3. User B clicks "Pay" button
4. System checks User B's balance (must have at least $1,050 if not admin, or $1,000 if admin)
5. If sufficient:
   - User B's wallet: -$1,050 (or -$1,000 if admin)
   - User A's wallet: +$1,000
   - Admin fee ledger: +$50 (or $0 if User B is admin)
   - Invoice status: "paid"

**Domain Rules:**
- Self-invoicing is blocked (users cannot send invoices to their own wallet)
- Only active wallets can create and receive invoices
- Suspended/terminated wallets cannot create or pay invoices
- Invoice payments require sufficient balance (amount + fee, unless payer is admin)
- Admin accounts are exempt from all invoice payment fees

### 12. Finance/Admin Payout System

**Pay Button Access:**

**Only Finance and Admin roles** can pay cash to users who have withdrawal reference numbers. Regular users (user, journalist, employer, employee) do not see the Pay button and cannot process cash payouts.

**Pay Button in Wallet Interface:**

The Pay button in the wallet interface is used for **cash withdrawal payouts**. It allows Finance/Admin users to process cash payouts to users who have requested withdrawals from their wallets.

**Cash Withdrawal Payout Flow (Wallet Pay Button):**

**Pay Button Visibility:**
- The **Pay button** is rendered only if the user's role is **"finance"** or **"admin"**
- Located in the **wallet interface** (`/wallet`) and on the Finance dashboard (`/finance`) page
- Allows finance/admin users to pay cash to users who have a reference number from a **Cash Request Document**

**Workflow When Pay Button is Clicked:**

1. **Modal Opening:**
   - A **"Check Reference Number"** modal opens
   - Finance/Admin user is prompted to enter the reference number that the end-user received when they withdrew cash from their wallet

2. **Reference Number Input:**
   - Finance/Admin enters the withdrawal reference number (e.g., 456778)
   - System validates if the entered reference number exists and is valid

3. **Details Rendering:**
   - If valid, the system retrieves and renders details from the **Pending Pool** by finding the user associated with that reference number
   - The following details are displayed:
     - **Reference Number:** The withdrawal reference number
     - **Time of Withdrawal:** Timestamp when the withdrawal request was created
     - **Expires At:** Expiration date (24 hours from creation)
     - **Transaction Status:** Current status of the withdrawal
     - **Wallet ID:** User's wallet identifier (e.g., VXE445)
     - **First Name:** User's first name from KYC data
     - **Last Name:** User's last name from KYC data
     - **Email:** User's email address
     - **Valid ID Images:** Front & Back from KYC documents
   - **Amount Breakdown Section:**
     - **Withdrawal Amount (in pool):** The original withdrawal amount (e.g., $100.00)
     - **5% System Fee:** The fee amount that will be deducted (e.g., $5.00)
     - **Amount User Will Receive:** The payout amount after fee deduction (e.g., $95.00)
   - **Note:** Information explaining that the 5% fee will be recorded in Fee Ledger as "cash out fee" and must be manually deposited to admin wallet

4. **Modal Footer Buttons:**
   - **"Pay cash"** button: Proceeds with processing the cash payout
   - **"Cancel"** button: Aborts the entire process and closes the modal

**Action When "Pay cash" is Clicked:**

1. **Validation:**
   - System validates withdrawal is still pending and not expired
   - **Self-Payout Prevention:** System checks if the Finance/Admin user's wallet ID matches the withdrawal wallet ID
     - If wallet IDs match → **Process is immediately stopped**
     - Error message displayed: "You cannot pay cash to yourself. Finance/Admin users cannot process cash payouts for their own withdrawal requests."
     - No database changes are made
     - No fees are deducted
   - If expired → **Full amount automatically returns to user wallet without any fee deduction**
   - If expired → **Withdrawal is deleted from the pool** (pool is cleared)
   - If expired → Transaction status updated to "failed"
   - If expired → Finance cannot process expired withdrawals

2. **If Not Expired (Within 24 Hours):**
   - **5% System Fee Calculation:** 
     - The system calculates 5% of the total amount in the pending pool (the full withdrawal amount)
     - Example: If user requested $100 withdrawal, the system calculates $5 (5%) as the system fee
   - **Fee Recording:**
     - **5% System Fee** is deducted from the amount in the pool
     - The **5% fee is recorded in the Fee Ledger -> All Fees tab** as "cash out fee" (displayed as "CASH OUT")
     - The fee is **NOT automatically deposited** to admin wallet - admin must manually deposit it
     - Fee status is marked as "not deposited" (deposited: false)
   - **User Payout:**
     - The remaining **95% of the amount** (e.g., $95 from $100) is paid out to the user as cash
     - The payout amount is the original withdrawal amount minus the 5% system fee
     - User receives the deducted amount (95%) as physical cash
   - **Database Updates:**
     - **Withdrawal is deleted from the pool** (pool is cleared after processing)
     - Transaction status is updated to "success" with fee information
     - **Transaction record created for Finance/Admin user:**
       - Type: "cash_payout"
       - Amount: Payout amount (95% - amount paid to user)
       - Note: "paid cash"
       - Status: "success"
       - This transaction appears in Finance/Admin wallet in the "Paid" tab with title "paid cash"
   - Generate Successful Transaction PDF for printing (future implementation)

**Action When "Cancel" is Clicked:**
- The entire process is aborted
- Modal closes without processing any payment
- No changes are made to the database

**5% System Fee Implementation:**

When Finance or Admin processes a cash payout to a user with a reference number:
- **5% of the total withdrawal amount** is deducted from the amount in the pool
- The **5% fee is recorded in the Fee Ledger -> All Fees tab** as "cash out fee" (displayed as "CASH OUT")
- The **5% fee is NOT automatically deposited** to admin wallet - admin must manually deposit it through the Fee Ledger
- The **remaining 95% is paid out to the user** as physical cash
- The fee appears in the fee ledger with:
  - Type: "withdrawal" (displayed as "CASH OUT")
  - Amount: 5% of the withdrawal amount
  - Status: "not deposited" (deposited: false) - requires manual deposit
  - Reference number: The withdrawal reference number
  - Date: When the payout was processed
- **Transaction Record:**
  - A transaction record is created for the Finance/Admin user who processed the payout
  - Type: "cash_payout"
  - Amount: Payout amount (95% - the amount paid to user)
  - Note: "paid cash"
  - Status: "success"
  - This transaction appears in Finance/Admin wallet transactions in the "Paid" tab
  - Title displayed: "paid cash"
  - Amount shown: The payout amount (95%) that was paid to the user

**Example:**
- Regular user requests $100 withdrawal → Amount moves to pending pool
- Finance processes payout within 24 hours:
  - **$5 (5%)** → Credited to Admin wallet as system fee
  - **$95 (95%)** → Paid to user as cash
- **Admin user requests $100 withdrawal → Amount moves to pending pool**
- **Finance processes payout within 24 hours:**
  - **$0 (0%)** → No fee (admin accounts exempt)
  - **$100 (100%)** → Paid to admin as cash
- If Finance does NOT process within 24 hours:
  - **$100 (100%)** → Automatically returned to user wallet
  - **No fee deducted** (user receives full amount back)

**Important:** 
- The 5% fee is **only deducted when Finance or Admin processes the payout within 24 hours**
- If the withdrawal expires, the user receives their full amount back with no fees
- The 5% system fee is **recorded in the Fee Ledger as "cash out fee"** (NOT automatically deposited - admin must manually deposit it)
- The fee **appears in the Fee Ledger -> All Fees tab** as a "withdrawal" type fee with:
  - Type: WITHDRAWAL (orange badge)
  - Reference number: The withdrawal reference number
  - Amount: Original withdrawal amount
  - Fee: 5% of the withdrawal amount
  - Rate: 5%
  - Date: When the payout was processed
- The "paid cash" label allows admins to track and render processed payouts for accounting and audit purposes

PDF Documents Generated

- Cash Request PDF
- Withdrawal Confirmation PDF
- Transaction Receipt PDF

## 3) Roles & Permissions

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

1. **Statistics Dashboard**
   - View comprehensive platform statistics at a glance
   - **Total Wallets:** Count of all wallets in the system
   - **Active Wallets:** Count of wallets with active status
   - **Suspended Wallets:** Count of wallets with suspended status (inactive)
   - **Terminated Wallets:** Count of wallets with terminated status
   - **Total Users:** Count of all registered users in the platform
   - **Total Wallet Balance:** Sum of all wallet balances across the entire platform
   - **Summary Metrics:**
     - Wallet status distribution (percentage breakdown)
     - Users with wallets vs total users
     - Average balance per wallet
   - Real-time statistics updated on page load
   - Visual cards with color-coded indicators for each metric

2. **Users Management**
   - View all registered users in the system
   - Display user information: Email, Role, Creation Date, User ID
   - Update user roles (user, admin, journalist, employer, finance)
   - **Delete Users:** Admins can permanently delete users from the system
     - **Deletion Requirements:** User can only be deleted if their wallet balance is 0 or less than 1
     - **Deletion Process:** When a user is deleted, the system permanently removes:
       - User account (email, password, role)
       - Wallet (if exists)
       - All transactions (sent, received, fees, deposits, withdrawals)
       - KYC application and documents
       - All fees associated with the user
       - Pending withdrawals (if any)
       - Invoices (issued and received)
       - Redeem codes used by the user (codes are reset to unused state)
     - **Safety Features:**
       - Admins cannot delete their own account
       - Deletion requires confirmation modal
       - Error message displayed if wallet balance is greater than 0
       - All related data is completely removed from the database
   - Real-time user count and statistics
   - Role-based filtering and management
   - **Important:** Role changes preserve all wallet data:
     - Wallet balance remains unchanged
     - Wallet ID remains the same
     - All transaction history is preserved
     - Wallet status (active/suspended/terminated) remains unchanged
     - Users retain full access to their wallet with all previous transactions
     - Role changes are purely permission-based and do not impact financial data
   - **Wallet Creation:** Wallets are automatically created when KYC applications are approved. Admins can also manually create wallets for users via server action `createWalletForUser()` if needed.

2. **Wallets Management**
   - View all wallet accounts in the system
   - Display wallet details: Wallet ID (STR### format), User Information, Balance, Status (active/suspended/terminated), Creation Date
   - View detailed transaction logs for each wallet
   - Monitor wallet activity and transaction history
   - Track wallet status and manage wallet lifecycle
   - **Suspend Wallets:** Admin can temporarily suspend wallets. Suspended wallets cannot send, receive, deposit, or withdraw funds. Wallets can be reactivated later.
   - **Terminate Wallets:** Admin can terminate wallets by setting their status to "terminated". Terminated wallets cannot perform any transactions. When a user with a terminated wallet visits their wallet page, they see a termination message: "Your wallet has been terminated by an administrator" instead of the wallet interface. The wallet record is preserved for audit purposes. Transaction history is preserved.
   - **Wallet Actions:** Only admins can see and use the Suspend, Reactivate, and Terminate buttons in the Wallet Registry list

3. **Fee Ledger**
   - View all system fees collected in real-time
   - Track fee transactions by type:
     - **P2P Fees**: 5% of peer-to-peer transfers
     - **Ticket Fees**: 10% of ticket sales (when implemented)
     - **Invoice Fees**: 5% of invoice payments (when implemented)
     - **Cash Out Fees**: 5% of cash withdrawal requests (displayed as "CASH OUT" in fee ledger, NOT automatically deposited - admin must manually deposit)
   - Display comprehensive fee details:
     - Fee type with color-coded badges
     - Reference number for transaction tracking
     - Original transaction amount
     - Fee amount collected
     - Fee percentage rate (5% or 10%)
     - Transaction date
   - Summary cards showing:
     - Total fees collected across all types
     - Breakdown by fee category (P2P, Ticket, Invoice, Withdrawal)
     - Individual totals for each fee type
   - Monitor fee revenue and accounting
   - Real-time updates when new fees are collected
   - Detailed transaction table with sorting by date (newest first)
   - Export fee reports for financial reconciliation (future implementation)

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
- **Delete Users:** Permanently delete users and all related data from the system
  - **Requirement:** User's wallet balance must be 0 or less than 1 before deletion
  - **Deletion Scope:** Removes user account, wallet, transactions, KYC data, fees, pending withdrawals, invoices, and resets redeem codes
  - **Safety:** Admins cannot delete their own account
  - **Process:** Delete button in User Management tab → Confirmation modal → Server-side validation → Complete data removal
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
- Receive 5% system fees from P2P transfers (admin accounts are exempt from fees when sending)
- Receive 5% system fees from invoice payments (admin accounts are exempt from fees when paying invoices)
- Receive 10% system fees from ticket sales (ticket buyers pay no fees; sellers pay 10% of revenue)
- Receive 5% system fees from cash withdrawal payouts (recorded as "cash out fee" in Fee Ledger, must be manually deposited)
  - The 5% fee is automatically deducted from the total withdrawal amount in the pending pool
  - **Admin Fee Exemption:** Admin accounts are exempt from withdrawal fees. When an admin withdraws cash, no fee is deducted and they receive 100% of the withdrawal amount.
  - The fee is credited to the Admin wallet as platform revenue (only for non-admin users)
  - The remaining 95% is paid out to the user as physical cash (100% for admin users)
- Manage fee ledger and accounting
- View real-time fee collection dashboard
- Track all fee transactions with reference numbers
- Monitor fee revenue by category (P2P, Ticket, Invoice, Withdrawal)
- Access detailed fee transaction history
- Export fee reports for financial reconciliation
- Generate redeem codes for wallet top-ups

**Content Moderation:**
- Approve or reject payable events before public listing (events with PENDING status)
- Review and manage event submissions within 24-hour window
- Send rejection messages to event creators with reasons
- Free events are published immediately without admin review
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

## 4) UX & Navigation (Next.js + Tailwind)

**Top-level nav:** News, Events, Jobs, Ads, Businesses, Wallet, Dashboard, Sign in/Up.

**Landing page:**

- Hero + "Explore Madeenajuba's Event" grid with status badges (Coming Up, Live Now).
- Real-time Open/Closed business cards.
- Ads banner slots.
- Latest News & Jobs teasers.

**Detail pages:**

- **Event:** cover image, schedule (startTime, endTime, eventDate), organizer, ticket price (if payable), Buy Ticket modal (quantity selector, total cost), status chip (FREE/COMING UP/LIVE NOW), full description.
- **Job:** description, company, location, Apply Now (auth-gated).
- **Wallet:** balance, recent activity, Send, Deposit (Redeem), Request Cash, Invoices/Receipts.
- **Admin:** user table (avatar, names, created date, actions), wallet registry (ID, balance, created, tx log: to/from, amount, status, ref), fee ledger, redeem generator, KYC review queue.

## 5) Data Model (MongoDB — indicative)

```javascript
// users
{ _id, firstName, lastName, email, phone, role: 'user'|'journalist'|'finance'|'employee'|'admin',
  createdAt, passwordHash, status }

// kycApplications
{ _id, userId, firstName, lastName, phone, address, idFrontUrl, idBackUrl,
  status: 'pending'|'approved'|'rejected', reviewerId, reason?, createdAt, updatedAt }

// wallets
{ _id, userId, walletId: 'STR###', balanceCents, status: 'active'|'suspended'|'terminated', createdAt }

// transactions (P2P & fees & deposits & ticket payouts)
{ _id, type: 'send'|'fee'|'deposit'|'ticket_payout'|'invoice_payment'|'cash_payout',
  fromWalletId?, toWalletId?, amountCents, feeCents, ref: '######', status: 'success'|'failed',
  meta: { eventId?, invoiceId?, redeemId? }, createdAt }

// fees (system fee ledger)
{ _id, type: 'transaction'|'withdrawal'|'deposit', amount: number (cents), percentage?: number,
  userId?: ObjectId, transactionId?: ObjectId, createdAt: Date }

// redeemCodes
{ _id, code: '####-####-####-####', pin: '####', amountCents, issuedByAdminId, usedByWalletId?, usedAt? }

// events
{ _id, creatorUserId, title, description, startTime, endTime, eventDate, eventImage,
  isFree: boolean, ticketPriceCents? (required if isFree === false), ticketQuantity?,
  status: 'PENDING'|'APPROVED'|'REJECTED'|'LIVE'|'ENDED',
  rejectedReason?, createdAt, updatedAt }

// tickets
{ _id, eventId, buyerUserId, qty, totalPaidCents, feeCents, netCents, createdAt }

// invoices
{ _id, issuerUserId, recipientWalletId, amountCents, purpose, note?,
  status: 'unpaid'|'paid', createdAt, paidAt? }

// businesses
{ _id, name, category, phone, address, managerName, isOpen: boolean, updatedAt }
```

## 6) Domain Rules & Validations

- **Self-transactions blocked:** sender and recipient wallet IDs cannot match (applies to P2P and invoices).
- **Self-payout prevention:** Finance/Admin users cannot process cash payouts for their own withdrawal requests. If a Finance/Admin user's wallet ID matches the withdrawal wallet ID, the process is immediately stopped with an error message. No database changes or fee deductions occur.
- **Negative balance prevention:** Wallet balances cannot go negative. All balance operations (subtract, set) are validated to ensure the resulting balance is never less than 0. If a transaction would result in a negative balance, it is prevented and an error is returned. This validation is enforced at both the application level and database level.
- **Admin Fee Exemption:** Admin accounts are completely exempt from all system fees:
  - **P2P Transfers:** Admin accounts do not pay the 5% system fee when sending money
  - **Invoice Payments:** Admin accounts do not pay the 5% system fee when paying invoices
  - **Cash Withdrawals:** Admin accounts do not pay the 5% withdrawal fee when withdrawing cash (they receive 100% of the withdrawal amount)
  - **Deposits:** Admin accounts do not pay any fees on deposits (deposits already have no fees for all users)
  - This exemption applies automatically when the system detects the user has the "admin" role
- **Suspended/terminated wallets:** 
  - Suspended wallets: Cannot send/receive, deposit, or cash request. When a user with a suspended wallet visits their wallet page, they see a suspension message: "Your wallet has been suspended by an administrator" instead of the wallet interface. The wallet page does not render wallet functionality for suspended wallets.
  - Terminated wallets: Wallet is permanently disabled. Users see a termination message on their wallet page.
  - Only active wallets can access wallet features (Send, Deposit, Withdraw, Pay).
- **Event ticketing:** 
  - Free events: Published immediately, no approval required.
  - Payable events: Require admin approval (PENDING status) before public listing.
  - Ticket buyers: Pay only ticket price (no fees).
  - Ticket sellers: Pay 10% system fee on ticket sales revenue.
  - Disallow purchases without sufficient buyer balance.
  - Event statuses: PENDING (awaiting approval), APPROVED (listed publicly), REJECTED (not listed), LIVE (currently happening), ENDED (completed).
- **P2P system fee:** 5% taken from sender and recorded to Admin fee ledger; Admin may move fees to Admin wallet. **Admin accounts are exempt from this fee when sending money.**
- **Redeem:** code+PIN must match and not be previously used; amount is atomic credit.
- **Cash request:** success only if wallet has sufficient funds; generates printable proof with reference number; Finance must validate KYC match before paying out.

## 7) Flows (Happy Paths)

### 7.1 Wallet Onboarding

User submits KYC → status banner "Under Review ≤24h" → Admin/Employee reviews → Approve → Wallet appears with ID & balance 0.

### 7.2 P2P Transfer

Sender enters recipient Wallet-ID + amount → Validate (not self, not suspended, sufficient funds) → Deduct amount + 5% fee → Credit recipient amount → Record fee to Admin ledger.

### 7.3 Event Creation & Live

**Free Events:**
User creates free event → Published immediately → Listed on landing page → Auto "Live Now" at start time or host taps Go Live.

**Payable Events:**
User creates payable event → Status: PENDING → Notification: "Under review, admin will respond within 24 hours" → Admin reviews → If approved: Status: APPROVED → Listed with "Coming Up" tag → Auto "Live Now" at start time or host taps Go Live. If rejected: Status: REJECTED → Creator receives rejection reason → Event not listed.

### 7.4 Ticket Purchase

Buyer clicks "Buy Ticket" → Modal opens (select quantity, see total cost) → System checks buyer balance → If sufficient: Deduct ticket price from buyer → Generate ticket object → Record transaction → Redirect to Tickets tab → Seller receives 90% of ticket price → Admin receives 10% fee (recorded in Fee Ledger). If insufficient: Show error notification, block purchase.

### 7.5 Invoice Payment

Issuer creates invoice via Create Invoice modal → Enters recipient Wallet-ID, item description, amount, quantity (optional), total → Sends invoice → Invoice appears in recipient's Invoices tab → Recipient views invoice details → If paid: deduct amount + 5% fee from recipient (0% if recipient is admin); credit issuer amount; send 5% fee to Admin (only if recipient is not admin); mark invoice as Paid. See **Section 11: Invoice/Receipt System** for complete details.

### 7.6 Deposit via Redeem

User enters code + PIN → Validate & one-time credit → Mark code as used.

### 7.7 Cash Request & Payout

User inputs amount → If sufficient balance: generate document & ref no. → Finance verifies identity + ref → Pay → Deduct funds and archive receipt.

## 8) Pages (Next.js App Router)

- `/` (Landing): hero, events, businesses open/closed, ads, latest news/jobs.
- `/news` → `/news/[slug]`
- `/events` → `/events/[id]` (Buy) → `/dashboard/tickets`
- `/jobs` → `/jobs/[id]` (Apply Now → auth gate)
- `/ads` (catalogue)
- `/businesses`
- `/auth/sign-in`, `/auth/sign-up`
- `/wallet` (balance, send, deposit/redeem, request-cash, activity)
- `/wallet/invoices` (list/create/detail)
- `/dashboard` (user profile, purchases, posts)
- `/admin` (users, roles, KYC review, wallets, transactions, fees, redeem generator, messaging)
- `/finance` (cash payouts console)

## 9) Components (Tailwind + Headless/Server Actions)

**Badges:** LiveNowBadge, ComingUpBadge, StatusOpenClosed.

**Cards:** EventCard, JobCard, BusinessCard, NewsCard, AdBanner.

**Wallet UI:** BalanceTile, SendForm, RedeemForm, CashRequestModal, InvoiceForm, TransactionsTable.

**Admin:** UserTable, RoleDropdown, KycReviewDrawer, WalletTable, FeeLedger, RedeemGeneratorForm.

#### Fee Ledger Component Details

The `FeeLedger` component provides a comprehensive view of all system fees:

**Features:**
- Real-time fee data fetching from MongoDB `fees` collection
- Automatic fee categorization (P2P, Ticket, Invoice, Withdrawal)
- Summary cards displaying totals by fee type
- Detailed transaction table with:
  - Fee type badges (color-coded)
  - Reference numbers for transaction tracking
  - Original transaction amounts
  - Fee amounts in dollars
  - Fee percentage rates
  - Transaction dates
- Loading and error states
- Automatic conversion from cents to dollars for display
- Optimized database queries (batch fetching for performance)

**Server Action: `getAllFees()`**
- Fetches all fees from `fees` collection
- Links fees to related transactions for reference numbers
- Categorizes fees by transaction type
- Converts amounts from cents to dollars
- Returns serialized data for client components
- Sorted by creation date (newest first)

**Feedback:** ToastSuccess/Error, InlineAlert, GuardRailNotice (self-transaction, suspension).

## 10) Security & Compliance

**Auth:** Email/password with strong hashing; optional OTP via phone for KYC verification.

**RBAC:** Middleware to guard routes by role; server-side checks for all wallet operations.

**Data:** Store KYC images securely (e.g., object storage) with signed URLs; audit logs for payouts and role changes.

**Integrity:** Idempotent writes for payments/redeems; transaction references unique and searchable.

**Abuse:** Rate-limit send/invoice attempts; block self-transfers and suspended wallets by rule.

## 11) Fees & Accounting (Examples)

**P2P:** Sender pays 5% (admin accounts exempt). Example: send $600 → fee $30 to Admin → recipient gets $600 credited; sender debited $630. **If sender is admin:** send $600 → no fee → recipient gets $600 credited; admin debited $600 only.

**Ticketing:** 10% from seller. Example: ticket price $500 → buyer pays $500 (no fee); seller receives $450 (90%); $50 (10%) to Admin as platform fee.

**Invoice:** Payer pays 5% (admin accounts exempt). Example: $1,500 → fee $75 → issuer gets $1,500; payer debited $1,575; $75 to Admin. **If payer is admin:** $1,500 → no fee → issuer gets $1,500; admin debited $1,500 only.

## 12) Notifications

In-app toasts/banners: KYC status; event approvals; invoice received/paid; cash request statuses.

Live indicators: "Live Now" auto at start time or manual Go Live by host.

Admin red badge: new wallet applications.

## 13) Edge Cases

- Attempt to send/invoice self → show rule notice and block.
- Insufficient funds on cash request or ticket buy → block with guidance.
- Redeem code reused/invalid → decline with reason.
- Wallet suspended → lock all money functions, show suspension message.

## 14) Tech Stack & Conventions

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
- invoices
- redeemCodes
- pendingWithdrawals
- fees

Schemas validated using Zod + Mongoose.

**Time & Status:** Server time authoritative for "Live Now"; CRON/queue can flip event status.

**IDs/Refs:** Wallet-ID (STR###) and Tx reference numbers are unique, human-readable.

## 15) Roadmap (Phased)

**MVP:** Auth, roles, events (free), news reading, jobs reading, businesses, basic Admin, KYC submission.

**Wallet Alpha:** Approvals, balance, P2P (5% fee), redeem deposits, invoices (5%), cash requests (manual Finance).

**Ticketing:** Paid events, purchase flow, seller settlement (10%), receipts.

**Ops Hardening:** Full audit logs, fee dashboards, exportable reports, rate limits, signed media.

**Polish:** Ads rotation, journalist CMS, SEO, notifications inbox, analytics.

## 16) Glossary

**KYC:** Know Your Customer (identity verification to enable wallet).

**P2P:** Peer-to-peer money transfer between wallets.

**Redeem Code/PIN:** Admin-generated top-up instruments.

**System Fee:** Platform revenue from P2P (5%), invoice payments (5%), and ticket sales (10%).

**Finance Role:** Handles physical cash payouts for approved requests.

0nPc36hK0yB5gPla, ayuelmjok_db_user

6599-8601-1353-8044	3197

1624-6531-7509-8224	2664
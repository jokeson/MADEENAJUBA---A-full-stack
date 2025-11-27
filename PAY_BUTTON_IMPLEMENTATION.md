# Pay Button Implementation - Finance Payout System

## Overview

The Pay button is a Finance role-exclusive feature that allows authorized users to process cash withdrawal payouts. This system follows a secure workflow where Finance staff can review withdrawal requests, verify user identity, and process payouts with proper fee deductions.

## Access Control

- **Role Required:** Finance or Admin
- **Location:** `/finance` page
- **Permission Check:** Uses `canHandleFinance()` function from RBAC

## Workflow

### Step 1: Access Pay Button
- Finance/Admin user navigates to `/finance` page
- **Pay button is rendered only if user's role is "finance" or "admin"**
- Clicks the "Pay" button
- **"Check Reference Number" modal opens**

### Step 2: Enter Reference Number
- Finance/Admin is prompted to enter the reference number that the end-user received when they withdrew cash from their wallet
- Finance enters the withdrawal reference number (e.g., 456778)
- System validates if the entered reference number exists and is valid
- Validates:
  - Reference number exists
  - Withdrawal status is "pending"
  - Withdrawal has not expired

### Step 3: Review Withdrawal Details
If valid, the system retrieves and renders details from the **Pending Pool** by finding the user associated with that reference number. System displays:

#### User Data
- **First Name:** User's first name from KYC data
- **Last Name:** User's last name from KYC data
- **Wallet ID:** User's wallet identifier (e.g., VXE445)
- Email Address

#### Valid ID Images
- ID Front image
- ID Back image
- Retrieved from KYC application documents

#### Withdrawal Information
- Reference Number
- **Shown Amount:** The withdrawal amount (e.g., $100.00)
- **Time of Withdrawal:** Timestamp when the withdrawal request was created
- Expiration Date (24 hours from creation)
- Transaction Status
- **Note:** Information about the **5% fee** that will be deducted from the amount

### Step 4: Process Payout
- Finance reviews all information
- Verifies identity matches ID images
- Confirms withdrawal details
- Modal footer displays two buttons:
  - **"Pay cash"** button: Proceeds with processing the cash payout
  - **"Cancel"** button: Aborts the entire process and closes the modal
- Clicks **"Pay cash"** button to proceed

### Step 5: System Processing
Upon confirmation, the system:

1. **Validates Request**
   - Checks withdrawal is still pending
   - Verifies not expired
   - Ensures sufficient data exists

2. **Calculates Fees**
   - 5% system fee deducted from withdrawal amount
   - Fee amount calculated: `amount * 0.05`
   - Payout amount: `amount - fee`

3. **Credits Admin Wallet**
   - Finds or creates Admin wallet
   - Credits 5% fee to Admin wallet balance
   - Records fee in fee ledger

4. **Database Updates**
   - **Withdrawal Amount:** The amount remaining after deducting the 5% fee is removed from the pending pool in the system database
   - **Paid Cash Label:** The details are sent to the database and **labeled as "paid cash"** (status = "processed") so that the admin can render it later for record-keeping
   - Records processing timestamp
   - Records Finance user who processed it
   - Updates transaction status to "success"

5. **Returns Result**
   - Success message with reference number
   - Payout amount (after fee)
   - Fee amount deducted

## Error Handling

### Withdrawal Not Found
- Error: "Pending withdrawal not found or already processed"
- Action: User must verify reference number

### Withdrawal Expired
- Error: "Withdrawal request has expired. Full amount has been returned to wallet without any fee deduction."
- Action: System automatically returns full amount to user's wallet (no fee deducted)
- Status: Withdrawal marked as "expired"
- Transaction Status: Updated to "failed"
- Important: User receives 100% of their withdrawal amount back when Finance doesn't process within 24 hours

### Invalid Reference Number
- Error: "Withdrawal request not found"
- Action: User must check reference number and try again

### Already Processed
- Error: "This withdrawal has already been processed"
- Action: Cannot process same withdrawal twice

## Technical Implementation

### Server Actions

#### `getPendingWithdrawalByRef(referenceNumber: string)`
- Fetches withdrawal details by reference number
- Returns user data, KYC images, transaction info
- Used for review before processing

#### `processCashPayout(financeUserId: string, referenceNumber: string)`
- Processes the actual payout
- Handles fee calculation and Admin wallet credit
- Updates all relevant records
- Returns success/error status

### Components

#### `FinancePayoutModal`
- Client component for Finance payout interface
- Two-step process: Lookup → Review → Confirm
- Displays all required information
- Handles form submission and error states

#### `FinancePage` (`/app/finance/page.tsx`)
- Main Finance dashboard page
- Contains Pay button
- Role-based access control
- Instructions for payout process

## Security Features

1. **Role-Based Access:** Only Finance/Admin can access
2. **Reference Number Validation:** Must match existing pending withdrawal
3. **Expiration Check:** Prevents processing expired requests
4. **Status Verification:** Ensures withdrawal is in "pending" state
5. **Audit Trail:** Records who processed and when

## Fee Structure

- **System Fee:** 5% of withdrawal amount
- **Fee Destination:** Admin wallet
- **Payout Amount:** Original amount minus 5% fee
- **Example:**
  - Withdrawal: $100.00
  - Fee (5%): $5.00
  - Payout: $95.00
  - Admin receives: $5.00

## Database Updates

When payout is processed:

1. **Pending Withdrawals Collection**
   - Status: "pending" → "processed"
   - `processedAt`: Current timestamp
   - `processedBy`: Finance user ID

2. **Transactions Collection**
   - Status: "pending" → "success"
   - `feeCents`: Fee amount added

3. **Fees Collection**
   - New fee record created
   - Type: "withdrawal"
   - Amount: 5% fee
   - Linked to transaction

4. **Wallets Collection**
   - Admin wallet balance increased by fee amount

## PDF Generation (Future)

The system is designed to support PDF generation for:
- Cash Request PDF (already mentioned in requirements)
- Withdrawal Confirmation PDF (after processing)
- Transaction Receipt PDF (for Finance records)

## User Experience

1. **Clear Instructions:** Finance page includes step-by-step guide
2. **Visual Feedback:** Loading states, error messages, success confirmations
3. **ID Image Display:** Large, clear images for verification
4. **Information Layout:** Organized sections for easy review
5. **Confirmation Step:** Prevents accidental processing

## Integration Points

- **KYC System:** Retrieves ID images from KYC documents
- **Wallet System:** Updates balances and creates transactions
- **Fee Ledger:** Records all fees for accounting
- **User Management:** Links to user data for verification
- **Transaction Log:** Maintains complete audit trail


# Pay Cash Workflow - Complete Summary

## Overview
The "Pay Cash" system allows users to withdraw money from their wallet balance. The process involves two main actors:
1. **Regular Users**: Request cash withdrawal from their wallet
2. **Finance/Admin Users**: Process the cash payout after verifying the request

---

## Complete Workflow

### Phase 1: User Requests Cash Withdrawal

#### Step 1: User Initiates Withdrawal
- **Location**: `/wallet` page
- **Component**: `WithdrawModal` (`components/wallet/WithdrawModal.tsx`)
- **Action**: User clicks "Withdraw" button and enters withdrawal amount

#### Step 2: Confirmation Screen
- User reviews withdrawal amount
- System displays 24-hour expiration notice
- User confirms withdrawal

#### Step 3: Backend Processing (`requestCash` function)
**File**: `lib/server-actions/wallet.ts` (lines 365-467)

**What Happens:**
1. **Validations:**
   - User ID exists
   - Wallet exists and is `active`
   - Amount > 0
   - Sufficient balance in wallet

2. **Database Operations:**
   - **Generate Reference Number**: Unique reference (e.g., `456778`)
   - **Create Pending Withdrawal Record**:
     - Collection: `pending_withdrawals`
     - Status: `"pending"`
     - Expires: 24 hours from creation
     - Amount: Stored in cents
   - **Deduct from Wallet Balance**: Amount is moved to "pending pool"
   - **Create Transaction Record**:
     - Collection: `transactions`
     - Type: `"cash_payout"`
     - Status: `"pending"`
     - Amount: Original withdrawal amount

3. **Result:**
   - User receives reference number
   - Money is deducted from wallet balance
   - Money is held in "pending pool" for 24 hours

**Key Point**: At this stage, **NO FEE IS DEDUCTED**. The full amount is moved to pending pool.

---

### Phase 2: Finance/Admin Processes Payout

#### Step 1: Finance Opens Pay Modal
- **Locations**: 
  - `/finance` page (Finance dashboard)
  - `/wallet` page (Pay button - only visible to Finance/Admin roles)
- **Component**: `FinancePayoutModal` (`components/wallet/FinancePayoutModal.tsx`)
- **Access Control**: Only users with `finance` or `admin` roles can see/use this

#### Step 2: Enter Reference Number
- Finance/Admin enters the reference number provided by the user
- System looks up withdrawal request using `getPendingWithdrawalByRef()`
- **File**: `lib/server-actions/wallet.ts` (lines 670-741)

**Validations:**
- Reference number exists
- Withdrawal status is `"pending"`
- Withdrawal has not expired

#### Step 3: Review Withdrawal Details
System displays:
- **User Information**: First name, last name, wallet ID, email
- **KYC ID Images**: Front and back of valid ID (for identity verification)
- **Withdrawal Details**:
  - Reference number
  - Shown amount (original withdrawal amount)
  - Time of withdrawal
  - Expiration date
  - Transaction status
  - **Note**: 5% fee will be deducted

#### Step 4: Process Payout (`processCashPayout` function)
**File**: `lib/server-actions/wallet.ts` (lines 744-903)

**What Happens:**

1. **Validations:**
   - Withdrawal exists and is `"pending"`
   - Not expired (if expired, full amount returned to wallet - see below)
   - Finance user is not paying themselves (self-payout prevention)

2. **Expiration Check:**
   - If withdrawal expired (>24 hours):
     - **Full amount returned to user's wallet** (NO FEE DEDUCTED)
     - Status updated to `"expired"`
     - Transaction status: `"failed"`
     - Process stops here

3. **Fee Calculation** (if not expired):
   - **5% System Fee**: `feeCents = amount * 0.05`
   - **Payout Amount**: `payoutAmountCents = amount - feeCents` (95% of original)

4. **Database Updates** (if not expired):

   a. **Credit Admin Wallet:**
      - Find or create Admin wallet
      - Add 5% fee to Admin wallet balance
   
   b. **Record Fee in Fee Ledger:**
      - Collection: `fees`
      - Type: `"withdrawal"`
      - Amount: 5% fee
      - Percentage: 5%
      - `deposited: true` (automatically deposited)
   
   c. **Update Pending Withdrawal:**
      - Status: `"processed"` (this means "paid cash")
      - Store `feeCents` and `payoutAmountCents` for tracking
      - Record `processedAt` timestamp
      - Record `processedBy` (Finance user ID)
   
   d. **Update Transaction:**
      - Status: `"success"`
      - Store `feeCents` (5% fee deducted)

5. **Result:**
   - User receives 95% of original amount as cash
   - Admin wallet receives 5% fee
   - Withdrawal removed from pending pool
   - Record kept for admin tracking

---

## Key Concepts & Important Points

### 1. **Pending Pool**
- When user requests cash, money is **deducted from wallet** and moved to "pending pool"
- Money stays in pending pool until:
  - Finance processes payout (within 24 hours) → 5% fee deducted, 95% paid out
  - OR 24 hours expires → **Full 100% returned to wallet** (no fee)

### 2. **Fee Deduction Timing**
- **NO FEE** when user requests withdrawal
- **5% FEE** only deducted when Finance processes payout
- If Finance doesn't process within 24 hours, **NO FEE** - full amount returned

### 3. **Amount Flow**
```
User Request: $100.00
  ↓
Pending Pool: $100.00 (full amount)
  ↓
Finance Processes:
  - Admin receives: $5.00 (5% fee)
  - User receives: $95.00 (95% payout)
  - OR if expired: User gets $100.00 back (no fee)
```

### 4. **Status Values**
- **Pending Withdrawal Status:**
  - `"pending"`: Waiting for Finance to process
  - `"processed"`: Finance paid cash (labeled as "paid cash")
  - `"expired"`: 24 hours passed, full amount returned

- **Transaction Status:**
  - `"pending"`: Waiting for Finance
  - `"success"`: Finance processed payout
  - `"failed"`: Expired (full amount returned)

### 5. **Self-Payout Prevention**
- Finance/Admin users **cannot** process payouts for their own withdrawal requests
- System checks if Finance user's wallet ID matches withdrawal wallet ID
- If match found, error: "You cannot pay cash to yourself"

---

## Components & Files

### Frontend Components:
1. **`WithdrawModal.tsx`**: User withdrawal request form
2. **`FinancePayoutModal.tsx`**: Finance payout processing interface
3. **`/wallet/page.tsx`**: Wallet page with Pay button (Finance/Admin only)
4. **`/finance/page.tsx`**: Finance dashboard with Pay button

### Backend Functions:
1. **`requestCash()`**: Creates withdrawal request (lines 365-467)
2. **`getPendingWithdrawalByRef()`**: Looks up withdrawal by reference (lines 670-741)
3. **`processCashPayout()`**: Processes cash payout (lines 744-903)

### Database Collections:
1. **`pending_withdrawals`**: Stores withdrawal requests
2. **`transactions`**: Records all transactions
3. **`fees`**: Records fee transactions
4. **`wallets`**: User wallet balances

---

## Common Misunderstandings & Issues

### Issue 1: Fee Deduction Timing
**Misunderstanding**: Fee is deducted when user requests withdrawal
**Reality**: Fee is only deducted when Finance processes payout

### Issue 2: Expiration Behavior
**Misunderstanding**: Expired withdrawals still charge fee
**Reality**: Expired withdrawals return **full amount** to wallet with **no fee**

### Issue 3: Amount Display
**Misunderstanding**: "Shown Amount" in Finance modal is the payout amount
**Reality**: "Shown Amount" is the **original withdrawal amount**. Payout is 95% of this.

### Issue 4: Pending Pool Location
**Misunderstanding**: Money stays in user's wallet during pending period
**Reality**: Money is **deducted from wallet** and held in pending pool (separate system)

### Issue 5: Status "processed" vs "paid cash"
**Misunderstanding**: These are different statuses
**Reality**: `"processed"` status = "paid cash" (same thing, different terminology)

---

## Workflow Diagram

```
User Request Cash ($100)
  ↓
[requestCash()]
  - Deduct $100 from wallet
  - Create pending_withdrawal (status: "pending")
  - Create transaction (status: "pending")
  - Generate reference number
  ↓
Money in Pending Pool ($100)
  ↓
[24 Hour Timer Starts]
  ↓
Finance Enters Reference Number
  ↓
[getPendingWithdrawalByRef()]
  - Display user info, KYC images, withdrawal details
  ↓
Finance Clicks "Pay cash"
  ↓
[processCashPayout()]
  ↓
Is Expired? (>24 hours)
  ├─ YES → Return $100 to wallet (NO FEE)
  │         Status: "expired", Transaction: "failed"
  │
  └─ NO → Calculate 5% fee ($5)
          ├─ Credit $5 to Admin wallet
          ├─ Record fee in fee ledger
          ├─ Update pending_withdrawal: status "processed"
          ├─ Update transaction: status "success"
          └─ User receives $95 cash
```

---

## Testing Checklist

When fixing issues, verify:

1. ✅ User can request withdrawal (amount deducted from wallet)
2. ✅ Reference number is generated and returned
3. ✅ Finance can lookup withdrawal by reference
4. ✅ Finance sees correct user info and KYC images
5. ✅ Finance cannot pay themselves
6. ✅ 5% fee calculated correctly
7. ✅ Admin wallet receives 5% fee
8. ✅ Fee recorded in fee ledger
9. ✅ Pending withdrawal status updated to "processed"
10. ✅ Transaction status updated to "success"
11. ✅ Expired withdrawals return full amount (no fee)
12. ✅ Expired withdrawals marked as "expired" and "failed"

---

## Summary

The Pay Cash workflow is a **two-phase process**:
1. **User Phase**: Request withdrawal → Money moves to pending pool
2. **Finance Phase**: Process payout → 5% fee deducted, 95% paid out

**Key Rule**: Fee is only deducted when Finance processes payout. If Finance doesn't process within 24 hours, user gets full amount back with no fee.


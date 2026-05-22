# 30-Day Payment Setup Action Plan

**Goal:** Get company registered and Stripe connected account live  
**Current Date:** May 22, 2026  
**Target Completion:** June 22, 2026  

---

## Week 1 (May 22-29): Business Registration

### Monday-Tuesday (May 22-23): Decide & File
- [ ] **Decide:** LLC in which state? (Delaware, Wyoming, or your home state?)
  - **Recommendation:** Delaware if scaling nationally, home state if local MVP
  - **Decision:** _____________

- [ ] **File Articles of Organization** with Secretary of State
  - Online application (takes ~20 mins)
  - Cost: $50-300 depending on state
  - Processing time: 1-3 weeks
  - Examples:
    - Delaware: https://dnrec.delaware.gov/companies/
    - Wyoming: https://wyoming.gov/business-industry/business-licensing
    - California: https://www.sos.ca.gov/business-programs/filings-and-registrations

### Wednesday (May 24): Get EIN
- [ ] **Apply for EIN** at https://www.irs.gov/ein
  - Click "Apply for an EIN Online"
  - Takes ~15 minutes
  - Get EIN instantly (screenshot confirmation)
  - **Save confirmation to:** `/Users/mco/Documents/Tuition/Legal/EIN_Confirmation.pdf`

### Thursday-Friday (May 25-26): Bank Account
- [ ] **Apply for business bank account**
  - Recommended: Mercury, Chase, or Bank of America
  - Bring: ID, EIN letter, proof of address, Articles of Organization
  - Start with $500-1000 deposit
  - Get debit card + account details

- [ ] **Save account details**
  - Routing number: _______________
  - Account number: _______________
  - Account type: Checking

### Weekend (May 27-29): Get Ready
- [ ] **Get business license** (search "[Your City] Business License")
  - Usually free or $0-150
  - Often online approval (same day)

- [ ] **Download W-9 form** from IRS
  - https://www.irs.gov/pub/irs-pdf/fw9.pdf
  - Print and fill out completely (don't sign yet)

---

## Week 2 (May 29-June 5): Stripe Account

### Monday (June 2): Create Stripe Account
- [ ] **Go to:** https://dashboard.stripe.com/register
- [ ] **Sign up** with: tech@astracollective.biz
- [ ] **Verify email**
- [ ] **Create password** (save in password manager)

### Tuesday (June 3): Complete Business Information
- [ ] **Activate account** in Settings
- [ ] **Enter business info:**
  - Legal name: _________________________
  - DBA: AEO
  - Website: (leave blank for now, will add URL later)
  - Address: _________________________
  - Business type: Online Services / Education
  - Expected annual volume: $100,000 (conservative)

### Wednesday (June 4): Owner Information
- [ ] **Enter your info:**
  - Full name: _________________________
  - DOB: _________________________
  - SSN (last 4): _________________________
  - Phone: _________________________

### Thursday (June 5): Bank Connection
- [ ] **Connect business bank account:**
  - Routing number: _________________________
  - Account number: _________________________
  - Stripe will verify with 2 small deposits

---

## Week 3 (June 5-12): Verification & Integration

### Monday-Wednesday (June 5-7): Document Upload
- [ ] **Upload to Stripe:**
  - Driver's license (both sides)
  - Proof of address (utility bill or lease)
  - Certificate of Formation (LLC doc)
  - W-9 form (filled out)

- [ ] **Stripe verification deposits arrive** (1-2 business days)

### Thursday (June 8): Verify Deposits
- [ ] **Check bank account** for 2 deposits from Stripe
  - Usually like $0.12 + $0.10
  - **Amount 1:** $________
  - **Amount 2:** $________

- [ ] **Log into Stripe** → Settings → Bank Accounts
- [ ] **Verify amounts** you received
- [ ] **Submit verification**

### Friday (June 9): Approval Status
- [ ] **Wait for Stripe approval** (usually 1-2 hours after verification)
- [ ] **Stripe sends confirmation email** to tech@astracollective.biz
- [ ] **Check email** for "Your Stripe account is ready"

### Weekend (June 9-12): Backend Integration
- [ ] **Get Stripe API keys:**
  - Publishable Key: pk_live_...
  - Secret Key: sk_live_... (never share)
  - Webhook Secret: whsec_...

- [ ] **Add to `.env` file:**
  ```
  STRIPE_PUBLIC_KEY=pk_live_xxxxx
  STRIPE_SECRET_KEY=sk_live_xxxxx
  STRIPE_WEBHOOK_SECRET=whsec_xxxxx
  ```

---

## Week 4 (June 12-19): Testing & Launch Prep

### Monday-Tuesday (June 12-13): Test Mode
- [ ] **Switch backend to test mode first**
  - Use test keys while learning
  - Test payment flow
  - Test refund flow
  - Test 1099 tutor payout tracking

- [ ] **Run test transactions:**
  - Parent pays $50 for session
  - 12% platform fee = $6 to your account
  - 88% = $44 to tutor's connected account
  - Verify money arrives in your bank

### Wednesday-Thursday (June 14-15): Go Live
- [ ] **Switch to live keys** in `.env`
- [ ] **Enable payments on frontend** (set `LIVE_MODE=true`)
- [ ] **Test 1-2 real transactions** with small amounts ($5-10)
- [ ] **Verify:**
  - Money arrives in business account ✓
  - Stripe Dashboard shows transactions ✓
  - Email receipts sent correctly ✓

### Friday-Sunday (June 16-19): Polish
- [ ] **Add Stripe to docs** (update API_REFERENCE.md)
- [ ] **Document tutor onboarding** flow
- [ ] **Create tutor W-9 process**
- [ ] **Test tutor payout** (if tutors registered)
- [ ] **Set up webhook monitoring** (errors, refunds)

---

## Parallel Path: Code Integration (Can Start Now)

While waiting for business registration/Stripe (which takes 2-3 weeks), you can:

### Right Now:
- [ ] **Update `.env.example`** to include Stripe keys template
- [ ] **Create `/routes/payments.js`** with Stripe integration
- [ ] **Add tutor account creation** to onboarding
- [ ] **Build payment form** in frontend booking flow
- [ ] **Add 1099 tracking** to backend

### Implement in Backend (`/routes/payments.js`):
```javascript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Endpoint 1: Process payment from parent
router.post('/charge', async (req, res) => {
  try {
    const { bookingId, amount, parentId } = req.body;
    
    // Amount in cents
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      source: req.body.tokenId, // From frontend form
      description: `Session booking ${bookingId}`
    });
    
    // Save payment to database
    const payment = new Payment({
      bookingId,
      parentId,
      amount,
      stripeChargeId: charge.id,
      status: 'completed',
      platformFee: Math.round(amount * 0.12), // 12%
      tutorPayout: Math.round(amount * 0.88) // 88%
    });
    
    await payment.save();
    res.json({ success: true, chargeId: charge.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint 2: Payout to tutor
router.post('/payout-tutor', async (req, res) => {
  try {
    const { tutorId, amount } = req.body;
    const tutor = await User.findById(tutorId);
    
    // Send to tutor's connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: tutor.stripeAccountId // Tutor's connected account
    });
    
    res.json({ success: true, transferId: transfer.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint 3: Process refund
router.post('/refund/:chargeId', async (req, res) => {
  try {
    const refund = await stripe.refunds.create({
      charge: req.params.chargeId
    });
    
    res.json({ success: true, refundId: refund.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## Critical Dates

| Date | Milestone | Status |
|------|-----------|--------|
| May 24 | Apply for EIN | ⏳ In Progress |
| May 26 | Open business bank account | ⏳ Waiting |
| May 29 | Get business license + W-9 ready | ⏳ Pending |
| June 2 | Create Stripe account | ⏳ Not started |
| June 8 | Verify bank deposits in Stripe | ⏳ Pending |
| June 9 | Stripe approval (expected) | ⏳ Pending |
| June 12 | Switch to live keys + test | ⏳ Ready to start |
| June 15 | Go live with payments | 🎯 Target |
| June 22 | All payment features tested | 🎯 Final |

---

## Important Notes

### ⚠️ Don't Rush:
- Take time to choose the right business entity
- Verify all information is correct before submitting to Stripe
- Test extensively in test mode before going live

### ✅ What You CAN Do Now:
- Code the payment backend (even without Stripe keys)
- Build the payment UI/forms
- Set up database models for payments
- Prepare documentation for tutors
- Write the tutor W-9 process

### ✅ What You CANNOT Do Until Later:
- Accept real payments (need Stripe live)
- Enable payments on platform (need Stripe live keys)
- Process tutor payouts (need connected accounts set up)
- Charge transaction fees (Stripe fees start on first charge)

---

## Resources You'll Need

### Government:
- IRS EIN: https://www.irs.gov/ein
- Secretary of State: [Your state].gov
- Business license: [Your city] business licensing office
- W-9 form: https://www.irs.gov/pub/irs-pdf/fw9.pdf

### Banking:
- Mercury: https://mercury.com
- Chase Business: https://www.chase.com/business
- Bank of America: https://www.bankofamerica.com/business

### Stripe:
- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs/connect
- Support: support@stripe.com

---

## Success Criteria (By June 22)

- [ ] LLC registered and approved
- [ ] EIN received and saved
- [ ] Business bank account open and funded
- [ ] Stripe account created and verified
- [ ] Stripe keys added to backend
- [ ] Payment endpoints implemented
- [ ] Tutor connected account flow working
- [ ] Test transactions completed successfully
- [ ] Live payments enabled
- [ ] First real transaction processed (even $1)
- [ ] Team trained on payment process

---

**You're on track. This is a standard process. Follow the timeline and you'll have full payment processing by mid-June.**

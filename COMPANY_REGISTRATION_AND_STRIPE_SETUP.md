# Company Registration & Stripe Connected Account Setup

**Platform:** AEO (Tutor Marketplace)  
**Purpose:** Enable payment processing and tutor payouts  
**Timeline:** 2-4 weeks (business registration) + 3-5 business days (Stripe approval)  

---

## Phase 1: Choose Your Business Structure

### Option 1: LLC (Limited Liability Company) - **RECOMMENDED**
**Pros:**
- Lower setup costs ($50-300 depending on state)
- Personal liability protection
- Pass-through taxation (no double taxation)
- Easier to manage than C-Corp
- Stripe-friendly structure

**Cons:**
- Requires state registration
- Annual filing requirements (varies by state)
- Self-employment taxes

**Timeline:** 1-3 weeks (varies by state)  
**Cost:** $50-300 + state filing fees

**Steps:**
1. Choose state of incorporation (Delaware, Wyoming, or your home state)
2. File Articles of Organization with state Secretary of State
3. Get EIN from IRS
4. Open business bank account
5. Create Operating Agreement (template)

**Recommended states:**
- **Delaware**: Best for scaling; startup-friendly; $150-300
- **Wyoming**: Privacy-friendly; 50-state recognition; $100-150
- **Your home state**: Simplest if you're operating locally

---

### Option 2: Sole Proprietorship
**Pros:**
- No registration needed
- Simplest tax filing
- Lowest cost ($0)

**Cons:**
- No liability protection
- Personal responsibility for all debts
- Harder to scale
- Some payment processors hesitant

**Timeline:** Same day  
**Cost:** $0-50 (assumed business license only)

---

### Option 3: C-Corporation
**Pros:**
- Strongest liability protection
- Easier to raise venture capital
- Professional structure

**Cons:**
- Most complex (higher accounting costs)
- Double taxation (corporate + personal)
- Most expensive setup
- Overkill for MVP stage

**Timeline:** 2-4 weeks  
**Cost:** $500-2000 (legal + filing)

---

## Phase 2: Get Your EIN (Employer Identification Number)

Your EIN is like a SSN for your business. Required for Stripe.

### For LLC/C-Corp:
1. **Go to:** https://www.irs.gov/ein
2. **Click:** "Apply for an EIN Online"
3. **Fill out:** Form SS-4 with these details:
   - Business name (should match your registration)
   - Business address (physical, not PO Box)
   - Owner name & SSN
   - Type of entity (LLC, Corporation, etc.)
   - Business activity (Online Tutoring Services / Educational Services)
   - Expected employees: 0 (for now)

4. **Submit:** Takes ~15 minutes, get EIN instantly
5. **Save:** Screenshot or download confirmation

### For Sole Proprietorship:
- Use your SSN instead of EIN (you can still get an EIN if you want)
- ⚠️ This makes personal business more risky; not recommended for platforms handling payments

---

## Phase 3: Get a Business Bank Account

### Required documents:
- ✅ EIN letter (from IRS)
- ✅ Articles of Organization (LLC) or Articles of Incorporation (Corp)
- ✅ ID (passport or driver's license)
- ✅ Proof of address (utility bill, lease, etc.)

### Recommended banks for Stripe platforms:
1. **Mercury** - Best for startups; automated, no minimums; https://mercury.com
2. **Stripe Bank Account Partner** - Direct integration; https://stripe.com/en-gb/atlas
3. **Chase Business** - Traditional, widely accepted
4. **Bank of America Business** - Large network, good for payouts
5. **Wells Fargo Business** - Good if you plan to handle high volumes

### Setup steps:
1. Apply online or visit branch with documents
2. Start with $500-1000 minimum deposit
3. Keep account active (even if you don't need funds yet)
4. Get debit card + checkbook
5. Set up ACH for accepting payments

---

## Phase 4: Tax Documents Setup

### Get these ready BEFORE Stripe:
1. **Business License** - From your city/county (cost: $0-150)
   - Search: "[Your City] Business License"
   - Application usually online, instant approval

2. **Sales Tax License** (if applicable in your state)
   - Required if you collect sales tax
   - Search: "[Your State] Sales Tax License"
   - Most states: online application, free

3. **1099 Contractor Setup** (for paying tutors)
   - Prepare to track tutor income
   - Will issue 1099-NEC at year-end (if tutor earnings > $600)
   - You'll need tutors' SSNs/EINs and W-9 forms

4. **W-9 Form** (for Stripe to collect YOUR info)
   - Available at: https://www.irs.gov/pub/irs-pdf/fw9.pdf
   - Fill out BEFORE Stripe onboarding
   - Stripe will request this

---

## Phase 5: Stripe Connected Account Setup

### Prerequisites BEFORE starting:
- ✅ EIN (or SSN if sole proprietor)
- ✅ Business address
- ✅ Business bank account (US account required)
- ✅ W-9 form filled out
- ✅ Business license (helpful, not always required)

### Your Stripe Setup:
Since you're operating a **two-sided marketplace** (taking payments from parents, paying tutors), you need **Stripe Connect** (connected accounts), not just regular Stripe.

### Step-by-Step Stripe Setup:

#### Step 1: Create Stripe Account
1. Go to https://dashboard.stripe.com/register
2. Sign up with business email (tech@astracollective.biz)
3. Verify email
4. Create password

#### Step 2: Activate Live Mode
1. In Stripe Dashboard → Settings → Account
2. Click "Activate your account"
3. Select country: **United States**
4. Answer business questions:
   - What type of business are you operating? → **Marketplace / Platform**
   - Do you operate a marketplace? → **Yes**
   - Which countries/regions do you process payments from? → **United States**

#### Step 3: Business Information (Stripe will ask):
- **Legal business name** → Exact match to your registration
- **Doing Business As (DBA)** → AEO (if different from legal name)
- **Business website** → (will add URL once you deploy)
- **Business address** → Physical address of your business
- **Business type** → Select **Online Services** or **Education**
- **Annual expected volume** → Estimate how much tutoring happens yearly
  - Start: $50,000-100,000 (conservative estimate)

#### Step 4: Owner Information:
- **Full name** → Your legal name
- **Date of birth** → MM/DD/YYYY
- **SSN** → Last 4 digits (for verification)
- **Personal address** → Where you live
- **Phone number** → Active number

#### Step 5: EIN Information:
- **EIN** → Your 9-digit EIN (XX-XXXXXXX)
- **Tax ID Type** → Business EIN
- **Company registration** → LLC, Corporation, etc.

#### Step 6: Bank Account:
- **Routing number** → Your business bank's routing #
- **Account number** → Your business checking account
- **Account type** → Checking

#### Step 7: Documents (Stripe may ask):
- Driver's license photo (clear, both sides)
- Proof of address (utility bill, lease, or bank statement)
- Sometimes: Certificate of Formation (LLC registration doc)

#### Step 8: Verify
- Stripe will deposit 2 small amounts ($0.01 each) to your bank account
- Confirmation takes 1-2 business days
- You'll verify these amounts in Stripe Dashboard

### Timeline:
- **Application submission:** ~20 minutes
- **Initial review:** 1-2 hours
- **Deposits verification:** 2-3 business days
- **Full activation:** 3-5 business days
- **Payments enabled:** Immediately after approval

---

## Phase 6: Configure Stripe Connect for Tutors

Once your Stripe account is live:

### Create Application for Tutor Onboarding:
1. **Stripe Dashboard** → **Developers** → **API Keys**
2. Copy your **Publishable Key** and **Secret Key**
3. Add to your `.env` file:
```
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Set Up Tutor Connected Accounts:
Tutors will go through Express onboarding:

```javascript
// In your /routes/tutors.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Generate tutor onboarding link
router.post('/tutor/:tutorId/stripe-onboarding', async (req, res) => {
  const tutor = await User.findById(req.params.tutorId);
  
  // Create connected account
  const account = await stripe.accounts.create({
    type: 'express',
    email: tutor.email,
    business_type: 'individual',
    individual: {
      first_name: tutor.name.split(' ')[0],
      last_name: tutor.name.split(' ')[1]
    }
  });
  
  // Store account ID
  tutor.stripeAccountId = account.id;
  await tutor.save();
  
  // Generate onboarding link
  const link = await stripe.accountLinks.create({
    account: account.id,
    type: 'account_onboarding',
    refresh_url: 'http://localhost:3000/tutor/stripe-refresh',
    return_url: 'http://localhost:3000/tutor/stripe-success'
  });
  
  res.json({ onboarding_url: link.url });
});
```

---

## Checklist: Before Going Live

### Business Setup (Week 1-2):
- [ ] Choose business entity (LLC recommended)
- [ ] File registration with state Secretary of State
- [ ] Receive EIN from IRS (apply online)
- [ ] Get business bank account
- [ ] Get business license (city/county)
- [ ] Get sales tax license (if applicable)

### Documentation (Week 2):
- [ ] Print/save EIN letter from IRS
- [ ] Print/save Articles of Organization
- [ ] Fill out W-9 form
- [ ] Get business address proof (utility bill)
- [ ] Get government ID (passport/driver's license)
- [ ] Get tutor W-9 template ready for distribution

### Stripe Setup (Week 3):
- [ ] Create Stripe account
- [ ] Complete business information
- [ ] Enter EIN
- [ ] Connect bank account
- [ ] Upload documents (ID, address proof)
- [ ] Wait for verification (2-5 days)

### Code Integration (Week 3-4):
- [ ] Add Stripe keys to .env
- [ ] Implement tutor connected account creation
- [ ] Test payment flow (use test mode first)
- [ ] Test tutor payout flow
- [ ] Set up webhook for payment confirmations

### Testing (Week 4):
- [ ] Test payment from parent → platform account
- [ ] Test tutor onboarding flow
- [ ] Test tutor payout
- [ ] Test refund flow
- [ ] Verify emails are sent correctly

### Go Live:
- [ ] Switch Stripe to live keys
- [ ] Enable payments on frontend
- [ ] Monitor first transactions carefully
- [ ] Have support process for payment issues

---

## Common Questions

### Q: Do I need an LLC to use Stripe?
**A:** No, but highly recommended. Stripe can work with sole proprietors, but you lose liability protection and look less professional.

### Q: How long does business registration take?
**A:** 1-3 weeks depending on state. Delaware is fastest (3-5 days). Some states are slower (4 weeks).

### Q: Can I use my personal bank account?
**A:** Technically yes, but Stripe will ask for business account. You also create tax complications (personal + business funds mixed). Not recommended.

### Q: What's the minimum I need to start?
**A:** For MVP: EIN + business bank account + Stripe account. Other docs help but not required.

### Q: How much does this cost?
**A:** 
- LLC registration: $50-300
- EIN: Free
- Business bank account: Free (some have minimums)
- Business license: $0-150
- Stripe fees: 2.9% + $0.30 per transaction (you pay this from parent payments)

**Total upfront:** ~$200-500

### Q: Can I change my business structure later?
**A:** Yes, but it's complex. Choose carefully now (LLC is best for MVP).

### Q: When can I start accepting payments?
**A:** Immediately after Stripe approval (3-5 days), even if business registration is pending.

---

## Next Steps

1. **This week:** Decide on business entity → File registration
2. **Next week:** Apply for EIN → Open business bank account
3. **Week 3:** Set up Stripe account → Complete verification
4. **Week 4:** Integrate Stripe Connect for tutors → Test payments

**Questions during setup?**
- IRS EIN: https://www.irs.gov/businesses/small-businesses-self-employed/whats-new-with-ein
- Stripe Connect docs: https://stripe.com/docs/connect
- State business registration: Search "[Your State] Secretary of State business registration"

---

**Status:** Ready to build payments once you've completed Phase 1-2 (2-3 weeks minimum)

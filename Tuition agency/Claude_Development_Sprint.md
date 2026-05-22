# TutorMatch MVP Development Sprint
## Month 1-4: Build 40% → 100% Complete

**Goal:** Ship launch-ready MVP by Month 4 with Claude Code doing 80% of the work

---

## Current State (Week 6)
- ✅ Database schema designed
- ✅ User authentication working
- ✅ Basic tutor profiles & search functional
- ✅ Booking flow wireframes complete
- ❌ Payment processing NOT started
- ❌ Matching algorithm NOT started
- ❌ Session management NOT started
- ❌ Admin dashboard NOT started

**Overall: 40% MVP complete**

---

## Critical Path to MVP Launch

### Phase 0: Foundation (Week 1-2) - BLOCKER
🔴 **Must complete BEFORE any payment coding**

**Task: Register Business Entity & Stripe Account**
- Register TutorMatch company in Singapore
- Get UEN/Tax ID
- Set up Stripe Connected Account (for tutor payouts)
- Configure webhook endpoints
- Generate test & production API keys
- Create Terms of Service (legal will review)

**Owner:** Founder/CEO + CTO
**Timeline:** 1-2 weeks
**Dependencies:** None (start immediately)
**Blocker For:** Payment processing task

**Deliverables:**
- [ ] Company registered + UEN obtained
- [ ] Stripe Connected Account set up
- [ ] Test/production API keys in environment
- [ ] Webhook URLs configured in Stripe
- [ ] Terms of Service drafted

---

### Phase 1: Core Platform (Weeks 3-8) - PARALLEL WORK

#### 🔴 CRITICAL PATH #1: Payment Processing
**What:** Accept parent payments, hold in escrow, pay tutors after session

**Tasks Claude Should Build:**
1. Payment intent creation
   - Parent initiates booking → Stripe payment intent created
   - Amount = session price (parent pays, 88% to tutor, 12% platform fee)
   - Status tracking (pending → charged → completed)

2. Tutor payout system
   - Track completed sessions per tutor
   - Calculate weekly payout amount
   - Send to tutor bank account via Stripe Connect
   - Payout confirmation email

3. Escrow logic
   - Payment held on Stripe, not in your bank account
   - Only released to tutor after session check-out
   - Refund handling if session cancelled <24hrs before

4. Webhook handling
   - Listen for payment.intent.succeeded
   - Listen for payment.intent.payment_failed
   - Update database, send confirmations

5. Receipt generation
   - Send parent receipt after payment
   - Include invoice number, amount, tutor info

**Tech Stack:**
- Node.js + Express (API endpoints)
- Stripe Node library
- PostgreSQL (transaction logs)
- Email service (SendGrid/Mailgun)

**Timeline:** 2 weeks (Weeks 3-4)
**Owner:** Claude + CTO
**Dependencies:** 
- ⚠️ BLOCKED BY: Business entity registration + Stripe account setup
- ⏳ THEN UNBLOCKS: Parent booking flow

**Code Structure:**
```
/api
  /payments
    POST /create-payment-intent (parent books)
    POST /confirm-payment (Stripe webhook)
    POST /refund-booking (cancel session)
  /payouts
    POST /generate-payout (admin trigger)
    GET /payout-history (tutor view)
```

**Testing Checklist:**
- [ ] Can create payment intent for $50 session
- [ ] Test card charges successfully
- [ ] Webhook receives payment confirmation
- [ ] Database logs transaction
- [ ] Tutor sees pending payout
- [ ] Refund flow reverses charges
- [ ] Email confirmations send

---

#### 🔴 CRITICAL PATH #2: Matching Algorithm
**What:** Find 3-5 best tutor matches for parent (85%+ match success target)

**The 9-Criteria Scoring System:**

```
MATCH_SCORE = (
  subject_alignment * 0.25 +       // Does tutor teach this subject?
  grade_fit * 0.20 +                // Experience with this grade?
  teaching_style * 0.15 +           // Match parent's preferred style?
  availability * 0.15 +             // Can schedule when parent needs?
  location_proximity * 0.10 +       // Within reasonable distance?
  tutor_success_rate * 0.10 +       // Do their students succeed?
  parent_preferences * 0.05 +       // Meets special requests?
  special_needs_compat * 0.05 +     // Can handle ADHD/dyslexia if needed?
  price_fit * 0.05                  // Within budget range?
) / 10

Result: 0-100 score, only show tutors with 70+
```

**Scoring Rules (Claude builds these):**

| Criteria | Scoring | Example |
|----------|---------|---------|
| **Subject Alignment** | Exact match = 100, Related = 70, No match = 0 | Parent needs "PSLE Math" → Tutor teaches "Primary Math" = 90 |
| **Grade Fit** | ±1 grade = 100, ±2 grades = 70, ±3+ = 0 | Parent has P5 → Tutor teaches P4-P6 = 100 |
| **Teaching Style** | Parent requested "conceptual" → Tutor reviews notes = match = 100 | |
| **Availability** | Overlap >5hrs/week = 100, 2-5hrs = 70, <2hrs = 0 | Parent wants Tue/Wed eve → Tutor available = 100 |
| **Location** | Same area = 100, 5km away = 70, 20km+ = 0 | Use postal codes |
| **Success Rate** | 90%+ match rate = 100, 70% = 70, <50% = 0 | Track from historical data |
| **Parent Preferences** | "Female tutor" + "PSLE focused" = +10 per match | |
| **Special Needs** | "Dyslexia certified" + parent needs = 100 | |
| **Price** | Within ±$5 of target = 100, ±$10 = 70, >$10 = 0 | Target $60/hr, tutor $55 = 100 |

**Tasks Claude Should Build:**

1. Data retrieval
   - Get parent profile (grade, subjects, budget, preferences, special needs)
   - Get all active tutors (subjects, grades, rates, availability, history)

2. Scoring engine
   - Calculate score for each tutor-parent pair
   - Filter tutors with score ≥70
   - Rank by score (highest first)
   - Return top 5 matches

3. Match explainer
   - For each match, explain WHY (e.g., "90% match: Teaches PSLE Math, same area, $60/hr")
   - Show to parent for transparency

4. A/B testing hooks
   - Tag which algorithm version used (v1 rules, v2 ML model later)
   - Track success rate of each match
   - Use data to improve scoring weights

**Tech Stack:**
- Node.js (algorithm)
- PostgreSQL queries (get data efficiently)
- Caching (Redis for performance)

**Timeline:** 3 weeks (Weeks 3-5)
**Owner:** Claude + CTO
**Dependencies:** 
- Tutor onboarding (need profiles)
- Parent profiles (need data to score)

**Code Structure:**
```
/matching
  /algorithm
    calculateScore(parentId, tutorId) → 0-100
    findMatches(parentId) → [tutor1, tutor2, ...]
    explainMatch(match) → string explanation
  /calibration
    getHistoricalSuccessRate(tutorId) → %
    recordMatchOutcome(parentId, tutorId, success/fail)
    updateScoringWeights(newWeights) → void
```

**Testing Checklist:**
- [ ] Score function returns 0-100
- [ ] Exact subject match = high score
- [ ] Wrong grade level = low score
- [ ] Availability overlap affects score
- [ ] Find top 5 matches in <1sec
- [ ] Explanation text is clear to parents
- [ ] Track 10 matches, verify 85%+ success

---

#### Tutor Onboarding (Complete)
**What:** Get tutors signed up, verified, and listing sessions

**Tasks Claude Should Complete:**
1. Application form
   - Name, email, phone
   - Subjects taught (checkboxes)
   - Grade levels (checkboxes: P1-P6, Sec1-4, JC, Adult)
   - Years of experience
   - Qualifications (degree, certifications)
   - Teaching philosophy (short text)
   - Availability (calendar view)
   - Rates ($30-120/hr)
   - Bank account for payouts
   - Accept terms + CoC

2. Avatar/privacy system
   - Upload profile photo
   - Photo only shows after parent books trial
   - Default avatar until then

3. Verification flow
   - Admin reviews application
   - Admin requests credentials (degree scan, etc.)
   - Credentials uploaded/verified
   - Tutor marked "Verified" ✓

4. Profile display
   - Public profile (subjects, rates, availability, reviews)
   - Credentials badge (if verified)
   - Match success rate %
   - Parent reviews/testimonials

**Timeline:** 1 week (Week 3)
**Owner:** Claude
**Status:** 30% done (basic profiles exist, needs completion)
**Dependencies:** Payment system (tutor needs to link bank account)

**Testing Checklist:**
- [ ] Tutor can sign up in <5 min
- [ ] Form saves to database
- [ ] Admin sees 10 pending applications
- [ ] Can mark tutor verified
- [ ] Profile displays on parent search

---

#### Parent Booking Flow (Complete)
**What:** Parent finds tutor, books session, pays, confirms

**Tasks Claude Should Complete:**
1. Parent profile
   - Child's name, grade, subjects needed
   - Learning challenges (select: dyslexia, ADHD, gifted, none)
   - Preferred teaching style (conceptual vs rote, etc.)
   - Budget ($40-100/hr)
   - Availability (preferred times)
   - Special requests (female tutor, ex-MOE teacher, etc.)

2. Search & browse
   - Search by subject + grade
   - Filter by availability, rate, distance
   - See tutor cards (name, rate, availability, reviews)
   - Click to see full profile + credentials

3. Matching results
   - Click "Find Matches" button
   - Show top 5 tutors ranked by match score
   - Display match rationale ("90% match because...")
   - Show tutor details

4. Booking
   - Select tutor
   - Choose session time (from availability)
   - Select trial (1 session) or 4-week package
   - Pay via Stripe
   - Confirmation email

5. Confirmation
   - Parent sees "Booking confirmed"
   - Tutor sees "New booking request"
   - Messaging thread opens for coordination
   - Calendar updated for both

**Timeline:** 2 weeks (Weeks 4-5)
**Owner:** Claude
**Status:** 40% done (search exists, matching/payment not integrated)
**Dependencies:** Matching algorithm, payment processing

**Testing Checklist:**
- [ ] Parent signs up in <3 min
- [ ] Can search "PSLE Math" → see results
- [ ] Can request matches → get top 5
- [ ] Can book tutor → payment works
- [ ] Confirmation email sends
- [ ] Tutor gets notification

---

#### Session Management (Check-in/Notes)
**What:** Document tutoring sessions, track progress

**Tasks Claude Should Build:**
1. Check-in/check-out
   - Tutor clicks "Start Session" at lesson time
   - System records start time
   - Tutor clicks "End Session" after lesson
   - System records end time, calculates duration

2. Session notes (mandatory, structured)
   - Topics covered: (dropdown) "Fractions", "Decimals", "Word Problems", Other
   - Homework assigned: "3x Practice Set B, due Friday"
   - Student understanding: Radio button [Struggling] [OK] [Mastered]
   - Parent action items: "Practice counting money at home"
   - Red flags: "Student confused about place value - may need diagnostic"
   - Tutor signature/confirmation

3. Parent view
   - See session notes in timeline
   - Track progress (% of topics mastered)
   - View tutor's recommendations

4. Cancellation handling
   - <24hrs before = no charge, refund
   - <1hr before = 50% charge
   - No-show = full charge, refund to platform

**Timeline:** 2 weeks (Weeks 5-6)
**Owner:** Claude
**Status:** 0% done
**Dependencies:** Booking system, payment system

**Testing Checklist:**
- [ ] Tutor can start/end session
- [ ] Notes form saves
- [ ] Parent sees notes next day
- [ ] Can track "2 of 10 topics mastered"
- [ ] Cancellation refund processes
- [ ] Match success tracked (match success rate = % mastered goals)

---

#### Admin Dashboard (MVP Version)
**What:** Manage users, verify tutors, track platform health

**Tasks Claude Should Build:**
1. User management
   - View all parents (filter, search)
   - View all tutors (filter, search)
   - Approve/reject registrations
   - View user details

2. Tutor verification queue
   - Pending applications (count, list)
   - Click tutor → review credentials
   - Accept/reject decision
   - Send email notification

3. Booking overview
   - Active bookings this week
   - Completed sessions (with match outcome)
   - Cancelled bookings (reason)
   - Revenue summary

4. Platform metrics (dashboard cards)
   - Active parents: 100
   - Active tutors: 50
   - Bookings this month: 342
   - Match success rate: 87%
   - Revenue: $3,420
   - Tutor payouts: $3,000

5. Dispute/support
   - Flag issues
   - Track resolution

**Timeline:** 1 week (Week 6)
**Owner:** Claude
**Status:** 0% done
**Dependencies:** All other systems

**Testing Checklist:**
- [ ] Login as admin
- [ ] See 100 parents listed
- [ ] 10 pending tutor applications visible
- [ ] Can approve/reject tutors
- [ ] Dashboard shows correct metrics
- [ ] Can view booking details

---

### Phase 2: Polish & Testing (Weeks 7-8)

#### Mobile Responsiveness
- [ ] All flows work on mobile (parent & tutor)
- [ ] Touch-friendly buttons
- [ ] Fast load times (<2sec)
- [ ] No broken layouts

#### Bug Fixes & Edge Cases
- [ ] Payment failures handled gracefully
- [ ] Timezone issues (parent in different TZ than tutor)
- [ ] Availability sync (if someone books same slot)
- [ ] Message delivery reliability

#### Security & Compliance
- [ ] Passwords hashed (bcrypt)
- [ ] API rate limiting
- [ ] GDPR/privacy compliance (parent data)
- [ ] Terms of Service displayed

#### Performance
- [ ] Database indexes optimized
- [ ] Stripe API calls cached where possible
- [ ] Payment webhook responses <100ms

---

## Development Timeline

```
Week 1-2:    Foundation (Entity reg + Stripe setup)
Week 3:      Tutor onboarding (finish) + Payment API design
Week 4:      Payment processing + Parent profile
Week 5:      Matching algorithm + Parent booking
Week 6:      Session management + Admin dashboard  
Week 7-8:    Testing, bug fixes, mobile polish
Week 9:      MVP Ready for Launch (50 tutors, 100 beta users)
```

---

## What Claude Can Build (80% of MVP)

Claude Code is perfect for:
- ✅ Payment processing (Stripe API integration)
- ✅ Matching algorithm (logic, scoring, optimization)
- ✅ Database queries (tutor search, availability checks)
- ✅ API endpoints (all CRUD operations)
- ✅ Form UI (parent onboarding, booking forms)
- ✅ Admin dashboard (tables, filters, metrics)
- ✅ Email templates (confirmations, notifications)
- ✅ Validation & error handling
- ✅ Testing & debugging

What needs human review:
- 🔍 Architecture decisions (should match algo be rules or ML?)
- 🔍 UX decisions (should booking show 3 matches or 5?)
- 🔍 Security review (payment handling, data protection)
- 🔍 Business logic validation (commission rates, refund terms)

---

## Success Metrics (Month 4 Checkpoint)

MVP is complete when:
- ✅ Payment processing works end-to-end
- ✅ Matching algorithm achieves 85%+ match success rate
- ✅ 50 verified tutors onboarded
- ✅ 100 beta parents signed up
- ✅ 50+ bookings completed with session notes
- ✅ Admin can manage platform
- ✅ Mobile-responsive on all flows
- ✅ No critical bugs blocking usage

---

## Next Steps This Week

**For Founder/CEO:**
1. Register business entity (Singapore company registration)
2. Get UEN/Tax ID
3. Prepare for Stripe Connected Account setup

**For CTO + Claude:**
1. Design payment database schema
2. Design matching algorithm weights
3. Start building payment processing API
4. Have Stripe test keys ready

**For Everyone:**
- Confirm: Are we raising $900K, or bootstrapping?
- Confirm: Timeline realistic (8 weeks for MVP)?
- Confirm: Launch with 50 tutors or fewer?

---

## Tools & Dependencies

```json
{
  "backend": ["Node.js", "Express", "PostgreSQL"],
  "payment": ["Stripe API", "Stripe Node library"],
  "email": ["SendGrid or Mailgun"],
  "authentication": ["JWT", "bcrypt"],
  "frontend": ["React", "Responsive CSS", "mobile optimization"],
  "deployment": ["Vercel or AWS", "GitHub CI/CD"],
  "monitoring": ["Sentry for errors", "DataDog for performance"]
}
```

---

## Questions to Clarify Before Starting

1. **Payment model finalized?**
   - Parent pays $60 → Platform takes 12% = $7.20 → Tutor gets $52.80?
   - Or different split?

2. **Matching algorithm weights locked?**
   - Are these 9 criteria correct?
   - Should subject alignment be 25% or 30%?

3. **Tutor verification process?**
   - Manual admin review, or automated checks?
   - Background check service, or just document verification?

4. **Launch criteria finalized?**
   - Need 50 tutors before launch, or 30?
   - How many beta parents (100? 50?)?

5. **Tech stack confirmed?**
   - React frontend? Or different?
   - PostgreSQL? Or MongoDB?
   - Deployment target? AWS? Vercel?

---

**Let's build this. Claude can ship 80% of this MVP in the next 6-8 weeks. 💪**

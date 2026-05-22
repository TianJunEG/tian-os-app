# WhatsApp Chatbot Specification
## Tuition Platform - Parent Tutor Discovery & Booking

---

## 1. OVERVIEW

**Goal:** Enable parents to discover, evaluate, and contact suitable tutors directly through WhatsApp without completing lengthy forms or waiting for coordinator callbacks.

**Impact:** 
- Reduce time-to-first-contact from 24 hours (coordinator) to 5 minutes (chatbot)
- Increase conversion from inquiry to booking (frictionless discovery)
- Free up coordinator time for complex matching only
- Unique differentiator vs. competitors

**Timeline:** Month 1-2 (Phase 1) — can run parallel with website MVP
**Budget:** $2,000-3,000 (Twilio + development)

---

## 2. USER FLOWS

### 2.1 PARENT DISCOVERY FLOW

```
Parent → Saves WhatsApp number to contacts → Messages "Hi" or "Get Tutor"
↓
Bot: "Welcome to [Platform]! 👋 
I'll help you find a tutor in minutes.
What subject does your child need help with?"
↓
Parent: "English PSLE"
↓
Bot: "Got it - English for PSLE. 
What's your child's current level?
(A) Struggling (need 20+ point improvement)
(B) Average (aiming for 80+)
(C) Strong (aiming for 85+)"
↓
Parent: "B"
↓
Bot: "Perfect. What's your preferred lesson frequency?
(1) 1x per week
(2) 2x per week
(3) 3x per week"
↓
Parent: "2"
↓
Bot: "Great! In what area do you stay?
(Type postal code or area: Bukit Timah, Clementi, etc.)"
↓
Parent: "Clementi"
↓
Bot: "Found 4 tutors available in Clementi for English PSLE! 📋

Tutor #1: Ms Sarah (MOE Teacher, 8 years exp)
- Rate: $40/hr
- Specialization: PSLE, focus on writing
- 4.9⭐ (12 reviews)
[View Profile] [Contact]

Tutor #2: Mr Raj (Ex-MOE, 5 years exp)
- Rate: $35/hr
- Specialization: PSLE, grammar + comprehension
- 4.8⭐ (8 reviews)
[View Profile] [Contact]"
↓
Parent: [View Profile]
↓
Bot: "Ms Sarah - PSLE English Specialist
📍 Clementi
👨‍🎓 MOE Teacher, Primary English
⭐ 4.9 (12 reviews)
💰 $40/hr
📅 Available: Tues 3-5pm, Wed 4-6pm, Sat 10am-12pm

Recent feedback:
'Sarah helped my daughter jump from 65 to 78!' - Parent, Mar 2026
'Clear explanations, very patient' - Parent, Feb 2026

[Book Free Trial] [Chat with Tutor] [More Info]"
↓
Parent: [Chat with Tutor]
↓
Bot: "Great! I'm connecting you to Ms Sarah.
She typically replies within 15 minutes.

In the meantime, you can:
- Set preferred lesson times
- Ask about trial lesson
- Discuss learning goals"
↓
Ms Sarah: (Human takes over) "Hi! I'm Sarah. Happy to help with your daughter's PSLE English..."
```

### 2.2 DIRECT TUTOR INQUIRY FLOW

```
Parent: "Do you have a tutor for Math?"
↓
Bot: "Yes! For what level?
(A) Primary (P1-P6)
(B) Secondary (Sec 1-2)
(C) O-Level (Sec 3-4)
(D) IB/International"
↓
Parent: "C"
↓
Bot: "O-Level Math help needed. Great!
Current performance?
(A) Failing/D-F grades
(B) C-D grades
(C) B-C grades (aiming for A)
(D) Exam prep only"
↓
Parent: "D"
↓
Bot: "Perfect - exam prep. Preferred frequency?
(1) 1x week
(2) 2x week
(3) 3x week"
↓
[Continue with area selection → show matching tutors]
```

### 2.3 BOOKING FLOW

```
Parent: [Book Free Trial]
↓
Bot: "Free trial lesson booked! 🎉
Ms Sarah will confirm time within 5 minutes.
Payment only after first lesson."
↓
(24 hours later)
Bot reminder: "Your trial with Ms Sarah is in 2 hours!
Feel free to reach out if questions."
↓
(Post-lesson)
Bot: "How was the lesson? ⭐
1. Excellent - book more lessons
2. Good - think about it
3. Not a fit - find another tutor"
```

---

## 3. CHATBOT CAPABILITIES

### 3.1 INITIAL MVP (Phase 1 - Weeks 1-4)

✅ **What Bot Does:**
- Collect subject, level, frequency, location via buttons/text input
- Query tutor database and return 3-4 matching profiles
- Display tutor name, rate, experience, specialization, ratings
- Generate "contact tutor" links
- Collect parent details for CRM (name, phone number implicit from WhatsApp, child age)
- Handoff to human tutor/coordinator
- Send booking confirmations

❌ **What Bot Does NOT Do (Phase 2+):**
- AI-powered natural language understanding
- Complex scheduling across tutors
- Payment processing via WhatsApp
- Lesson material recommendations
- Student progress tracking

### 3.2 PHASE 2 ENHANCEMENTS (Months 4-6)

- Smart matching: Remember parent preferences
- Availability calendar sync
- Payment integration (Accept payment link in WhatsApp)
- Trial lesson scheduling automation
- Post-lesson satisfaction survey
- Lesson scheduling reminders

### 3.3 PHASE 3+ ADVANCED (Months 7+)

- AI-powered conversation (natural language → subject/level inference)
- Multi-lesson packages and discounts
- Referral tracking through WhatsApp link
- Lesson outcome reports sent via bot
- Community features (parent groups, tips sent via bot)

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 TECH STACK

| Component | Technology | Why |
|-----------|-----------|-----|
| **Messaging Platform** | Twilio WhatsApp API | Reliable, 15-min SLA, easy integration |
| **Bot Logic** | Node.js + OpenAI (optional) | Fast response, rule-based for MVP |
| **Database Queries** | PostgreSQL + Node | Access existing tutor DB |
| **Webhook Handler** | Express.js | Receive incoming messages, parse, respond |
| **Session Management** | Redis | Track conversation state (user at step 2 of 4) |
| **Handoff System** | WhatsApp Business API groups | Route to tutor or coordinator |

### 4.2 CONVERSATION STATE MACHINE

```
┌─────────────────────────┐
│   START                 │
│ "What subject?"         │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│   SUBJECT_SELECTED      │
│ "What level?"           │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│   LEVEL_SELECTED        │
│ "What frequency?"       │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│   FREQUENCY_SELECTED    │
│ "What area?"            │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│   AREA_SELECTED         │
│ Query DB, show tutors   │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│   TUTOR_DISPLAYED       │
│ "View profile/Contact?" │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│   HANDOFF_TO_TUTOR      │
│ Human takes over        │
└─────────────────────────┘
```

### 4.3 API INTEGRATION POINTS

**From Chatbot to Platform:**

```
POST /api/chatbot/search-tutors
{
  subject: "English",
  level: "PSLE",
  frequency: 2,
  area: "Clementi"
}

Response:
{
  tutors: [
    {
      tutorId: 123,
      name: "Ms Sarah",
      rate: 40,
      experience: 8,
      rating: 4.9,
      reviews: 12,
      specializations: ["PSLE", "Writing"],
      whatsappNumber: "+65 9xxx xxxx"
    }
  ]
}

---

POST /api/chatbot/start-session
{
  parentPhoneNumber: "+65 9xxx xxxx",
  parentName: "John Tan",
  childAge: 11,
  initialSubject: "English"
}

Response:
{
  sessionId: "session_123abc",
  timestamp: "2026-05-22T10:15:00Z"
}

---

POST /api/chatbot/log-interaction
{
  sessionId: "session_123abc",
  step: "AREA_SELECTED",
  userInput: "Clementi",
  botResponse: "Showing 4 tutors..."
}
```

### 4.4 DEPLOYMENT ARCHITECTURE

```
WhatsApp Message
       ↓
Twilio (webhooks to)
       ↓
Express.js Server (Node.js)
   ├─ Route: /webhook/message (POST)
   ├─ Parse: Extract phone, text, timestamp
   ├─ Session Lookup: Redis cache
   ├─ State Machine: Determine next step
   ├─ Query: PostgreSQL for tutors
   ├─ Generate: Response message + buttons
   ├─ Store: Interaction log
   └─ Send: Response via Twilio API
       ↓
Twilio (sends back)
       ↓
Parent's WhatsApp
```

---

## 5. CONVERSATION TEMPLATES

### 5.1 QUICK REPLY BUTTONS (WhatsApp Native)

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+65912345678",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "What subject does your child need help with?"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "subject_english",
            "title": "English"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "subject_math",
            "title": "Math"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "subject_science",
            "title": "Science"
          }
        }
      ]
    }
  }
}
```

### 5.2 TEXT-BASED INPUT

For open-ended responses (parent types "Clementi" for area):

```json
{
  "messaging_product": "whatsapp",
  "to": "+65912345678",
  "type": "text",
  "text": {
    "body": "Got it! In what area do you stay? (Type postal code or area)"
  }
}
```

### 5.3 TUTOR CARD (List Format)

```json
{
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": {
      "text": "📋 Found 4 tutors for English PSLE in Clementi"
    },
    "action": {
      "button": "Choose Tutor",
      "sections": [
        {
          "title": "Available Tutors",
          "rows": [
            {
              "id": "tutor_123",
              "title": "Ms Sarah (MOE, 8y exp)",
              "description": "$40/hr | ⭐4.9 | Writing specialist"
            },
            {
              "id": "tutor_124",
              "title": "Mr Raj (Ex-MOE, 5y exp)",
              "description": "$35/hr | ⭐4.8 | Grammar & Comp"
            }
          ]
        }
      ]
    }
  }
}
```

---

## 6. DATA FLOW & CRM INTEGRATION

### 6.1 PARENT SESSION TRACKING

**Table: `chatbot_sessions`**

```sql
CREATE TABLE chatbot_sessions (
  id VARCHAR(50) PRIMARY KEY,
  parent_phone_number VARCHAR(20),
  parent_name VARCHAR(100),
  child_age INTEGER,
  initial_subject VARCHAR(50),
  current_step VARCHAR(50), -- SUBJECT_SELECTED, LEVEL_SELECTED, etc.
  conversation_state JSONB, -- {subject: "English", level: "PSLE", frequency: 2, area: "Clementi"}
  created_at TIMESTAMP,
  last_interaction TIMESTAMP,
  status VARCHAR(20), -- ACTIVE, COMPLETED, ABANDONED
  handoff_tutor_id INTEGER,
  handoff_timestamp TIMESTAMP
);
```

### 6.2 INTERACTION LOGGING

**Table: `chatbot_interactions`**

```sql
CREATE TABLE chatbot_interactions (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(50),
  step VARCHAR(50),
  user_input TEXT,
  bot_response TEXT,
  timestamp TIMESTAMP,
  response_time_ms INTEGER,
  FOREIGN KEY (session_id) REFERENCES chatbot_sessions(id)
);
```

### 6.3 ANALYTICS QUERIES

```sql
-- Conversion funnel
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN current_step = 'SUBJECT_SELECTED' THEN 1 END) as step1,
  COUNT(CASE WHEN current_step = 'LEVEL_SELECTED' THEN 1 END) as step2,
  COUNT(CASE WHEN current_step = 'FREQUENCY_SELECTED' THEN 1 END) as step3,
  COUNT(CASE WHEN current_step = 'TUTOR_DISPLAYED' THEN 1 END) as step4,
  COUNT(CASE WHEN handoff_tutor_id IS NOT NULL THEN 1 END) as handoff_completed
FROM chatbot_sessions
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Average conversation time
SELECT 
  AVG(EXTRACT(EPOCH FROM (last_interaction - created_at))) as avg_duration_seconds
FROM chatbot_sessions
WHERE status = 'COMPLETED';

-- Drop-off analysis
SELECT 
  current_step,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM chatbot_sessions
WHERE status = 'ABANDONED'
GROUP BY current_step;
```

---

## 7. IMPLEMENTATION TIMELINE

### **Week 1-2: Foundation**
- Set up Twilio WhatsApp API account + credentials
- Create Express.js webhook handler (/webhook/message)
- Build Redis session management
- Write conversation state machine logic
- Connect to PostgreSQL for tutor queries
- Test webhook locally

### **Week 3: Core Flows**
- Implement subject selection flow
- Implement level selection flow
- Implement frequency selection flow
- Implement area/location selection
- Implement tutor search & display
- Create 5-10 sample tutor profiles for testing

### **Week 4: Handoff & Polish**
- Build tutor contact/handoff logic
- Create booking confirmation messages
- Add error handling (no tutors found, invalid input)
- Implement session logging & analytics
- User testing with 10-20 parents
- Bug fixes & optimization

### **Soft Launch (End of Month 1)**
- Deploy to staging environment
- Monitor performance & response times
- Collect user feedback
- Refine conversation flows based on feedback

---

## 8. SUCCESS METRICS

### Phase 1 MVP Target (Month 2)

| Metric | Target | Current |
|--------|--------|---------|
| Avg response time per message | < 2 seconds | - |
| Conversation completion rate | > 70% | - |
| Time from "Hi" to tutor match | < 5 minutes | - |
| User satisfaction rating | > 4.5/5 | - |
| Handoff-to-booking rate | > 40% | - |
| Daily active conversations | 20-50 | - |
| Messages processed per day | 200+ | - |

### Phase 2+ Enhancements (Month 4+)

- Payment conversion via WhatsApp link
- Repeat inquiry rate (parents coming back to find second tutor)
- Referral links shared via bot
- Session duration before handoff (targeting <10 min)

---

## 9. COST BREAKDOWN

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Twilio WhatsApp API | $200-500 | Based on message volume (0.01 per message) |
| Hosting (AWS/GCP) | $100-200 | Small Express.js server |
| Database | $50 (PostgreSQL AWS) | Shared with main platform |
| Development (Sprint) | $2,000 (one-time) | 2 weeks dev + QA |
| **Total Month 1** | **$2,300-2,700** | Includes development |
| **Monthly ongoing** | **$350-700** | After Month 1 |

---

## 10. RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| Webhook timeout (message not delivered) | Retry logic in Twilio; log all interactions |
| Poor tutor matching | Start with manual rules; A/B test conversation flow |
| Parent abandons mid-conversation | Send "We saw you started..." reminder after 2 hours |
| Tutor overwhelmed with chat requests | Queue system; coordinator filters bot requests |
| Message delivery delays | Monitor Twilio SLA; fallback to SMS for critical updates |
| Security (parent data) | Encrypt phone numbers in Redis; GDPR compliance for message logs |

---

## 11. HANDOFF PROTOCOL

### 11.1 BOT → COORDINATOR

```
Parent selects tutor
     ↓
Bot: "Great choice! I'm connecting you to [Tutor Name].
Please wait while I notify them..."
     ↓
(Bot sends internal message to coordinator)
Coordinator: "Parent John (Clementi) seeking English PSLE,
2x/week, budget $40/hr. Wants to chat with Ms Sarah."
     ↓
Coordinator directs tutor to contact parent
     ↓
Tutor initiates direct WhatsApp conversation
(Now human-to-human, bot steps back)
```

### 11.2 BOT DOESN'T INTERVENE

Once handoff occurs:
- Bot does NOT continue the conversation
- Tutor & parent communicate directly
- Bot can send periodic reminders only
  - "Have you booked your free trial?" (24 hours later)
  - "How was your first lesson?" (post-lesson survey)

---

## 12. FUTURE ENHANCEMENTS (Phase 2+)

1. **Availability Calendar Integration**
   - Parent: "When can we start?"
   - Bot: Shows tutor's available slots directly from calendar
   - Parent: Books time slot via bot

2. **Payment Integration**
   - Bot: "First lesson is free. Click to pay deposit for follow-up lessons"
   - Parent: Clicks Stripe/Paynow link in WhatsApp
   - Bot: Confirms payment received

3. **Automated Scheduling**
   - Bot connects to Google Calendar/Outlook
   - Auto-schedules lesson reminders
   - Parent gets 24-hour before lesson

4. **Lesson Report Cards**
   - Post-lesson, bot asks: "How did it go?"
   - Parent rates 1-5 stars
   - Bot: Sends summary to tutor
   - Next week: "Would you like to continue?"

5. **Community Features**
   - Parent group: PSLE tips, study schedules, parent Q&A
   - Bot: Posts tips from library to group
   - Drives engagement & referrals

---

## 13. SUCCESS CRITERIA FOR LAUNCH

✅ **Go/No-Go Checklist:**

- [ ] Webhook receives and responds to messages within 2 seconds
- [ ] All 4 steps (subject → level → frequency → area) work without error
- [ ] Tutor search returns relevant matches 100% of the time
- [ ] Session data logged correctly for 10+ test conversations
- [ ] Parent can complete full flow without human intervention
- [ ] Handoff to tutor works smoothly (message arrives within 5 min)
- [ ] Mobile-friendly (works on all WhatsApp clients)
- [ ] 5+ tutors enrolled and trained on chatbot flow
- [ ] Feedback from 10 test users: avg rating ≥ 4/5
- [ ] Twilio webhooks secured (IP whitelist + signature verification)

**Go-Live Target:** End of Month 1 (early February 2026)

---

## 14. APPENDIX: SAMPLE CODE STRUCTURE

**Project Structure:**
```
whatsapp-chatbot/
├── src/
│   ├── server.js              # Express app
│   ├── routes/
│   │   └── webhook.js         # POST /webhook/message
│   ├── controllers/
│   │   ├── chatbot.js         # Main bot logic
│   │   ├── matching.js        # Tutor search queries
│   │   └── handoff.js         # Tutor notification
│   ├── services/
│   │   ├── redis.js           # Session state
│   │   ├── database.js        # PostgreSQL queries
│   │   └── twilio.js          # Twilio API wrapper
│   ├── models/
│   │   ├── conversation.js    # State machine
│   │   └── templates.js       # Message templates
│   └── utils/
│       ├── logger.js          # Analytics logging
│       └── validators.js      # Input validation
├── .env                        # API keys
├── package.json
└── README.md
```

**Key Dependencies:**
```json
{
  "twilio": "^4.x",
  "express": "^4.x",
  "pg": "^8.x",
  "redis": "^4.x",
  "dotenv": "^16.x"
}
```

---

**Document prepared for:** Development Team
**Status:** Ready for Sprint Planning
**Next Step:** Assign developer & schedule kickoff meeting

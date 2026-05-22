# WhatsApp Tutor Chatbot
A production-ready WhatsApp chatbot for tutor discovery and booking in Singapore

## 📋 Features

✅ **Conversational Tutor Discovery**
- 5-step guided flow (Subject → Level → Frequency → Area → Tutor)
- Real-time tutor matching from database
- Tutor profiles with ratings, rates, specializations

✅ **Session Management**
- Redis-based state tracking
- PostgreSQL persistence
- Automatic session timeout handling
- Analytics and reporting

✅ **WhatsApp Integration**
- Interactive buttons and lists
- Real-time message delivery
- Webhook signature verification
- Message status tracking

✅ **Scalability**
- Connection pooling (PostgreSQL)
- Redis caching
- Twilio rate limiting compliance
- Comprehensive logging

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ (install from [nodejs.org](https://nodejs.org))
- **PostgreSQL** 12+ (install from [postgresql.org](https://www.postgresql.org))
- **Redis** 6+ (install from [redis.io](https://redis.io))
- **Twilio Account** (free tier available at [twilio.com](https://www.twilio.com))
- **ngrok** (for local testing - download from [ngrok.com](https://ngrok.com))

### Installation

**1. Clone/Extract the codebase**
```bash
cd whatsapp-chatbot
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
nano .env
```

**4. Create PostgreSQL database**
```bash
createdb tuition_platform
```

**5. Verify Redis is running**
```bash
redis-cli ping
# Should return: PONG
```

**6. Start the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server should be running on `http://localhost:3000`

---

## ⚙️ Configuration

### Twilio Setup

1. **Create Twilio Account**
   - Go to [twilio.com/console](https://twilio.com/console)
   - Sign up for free trial (includes $15 credit)

2. **Get WhatsApp Number**
   - In Twilio Console: Messaging → Channels → WhatsApp
   - Sandbox or production number
   - Copy **Account SID** and **Auth Token**
   - WhatsApp number format: `whatsapp:+1234567890`

3. **Configure Webhook**
   - Set webhook URL in Twilio: `https://yourapp.com/webhook/message`
   - For local testing: use ngrok tunnel (see below)

4. **Generate Content SID** (optional, for pre-approved templates)
   - Contact Twilio support for WhatsApp Business Account
   - Request content approval for message templates

### Local Testing with ngrok

```bash
# Terminal 1: Start your Node server
npm run dev

# Terminal 2: Create ngrok tunnel
ngrok http 3000

# You'll get a URL like:
# Forwarding https://abc123.ngrok.io -> http://localhost:3000

# In Twilio Console, set webhook URL:
# https://abc123.ngrok.io/webhook/message
```

### Database Setup

```bash
# Connect to database
psql tuition_platform

# Create tutors table (if not exists)
CREATE TABLE IF NOT EXISTS tutors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rate INTEGER NOT NULL,
  experience_years INTEGER,
  rating DECIMAL(2,1),
  specializations JSONB,
  area VARCHAR(100),
  service_areas JSONB,
  whatsapp_number VARCHAR(20),
  moe_teacher BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  subject_level_mapping JSONB,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# Insert sample tutors
INSERT INTO tutors (name, rate, experience_years, rating, specializations, area, whatsapp_number, moe_teacher, bio, subject_level_mapping)
VALUES
  ('Ms Sarah', 40, 8, 4.9, '["English"]', 'Clementi', '+6591234567', true, 'MOE Teacher, Expert in writing skills', '{"English": "PSLE"}'),
  ('Mr Raj', 35, 5, 4.8, '["English"]', 'Clementi', '+6591234568', true, 'Ex-MOE, Focuses on grammar', '{"English": "PSLE"}');
```

---

## 📡 API Endpoints

### Webhook Endpoints

**POST /webhook/message**
- Receives incoming WhatsApp messages from Twilio
- Requires valid Twilio signature verification
- Response: 200 OK (always)

```bash
curl -X POST http://localhost:3000/webhook/message \
  -H "X-Twilio-Signature: <signature>" \
  -d "From=whatsapp:%2B65912345678&Body=Hello&MessageSid=SM123"
```

**POST /webhook/status**
- Receives message delivery status updates
- Useful for analytics and tracking

**GET /health**
- Simple health check
- Response: `{ status: 'ok', timestamp: '...' }`

---

## 🗂️ Project Structure

```
src/
├── server.js                 # Express app entry point
├── routes/
│   └── webhook.js           # Webhook routes
├── controllers/
│   └── chatbot.js           # Conversation logic
├── services/
│   ├── twilio.js            # Twilio API wrapper
│   ├── database.js          # PostgreSQL queries
│   ├── redis.js             # Redis session management
│   ├── pg-pool.js           # Connection pooling
│   └── index.js             # Service exports
├── models/
│   ├── conversation.js      # Session state machine
│   └── templates.js         # WhatsApp message templates
└── utils/
    ├── logger.js            # Winston logging
    └── validators.js        # Input validation
```

---

## 📝 Conversation Flow

```
User sends "Hi"
    ↓
Bot: "What subject?" [Buttons: English, Math, Science, ...]
    ↓
User selects: "English"
    ↓
Bot: "What level?" [Buttons: Primary, Secondary, O-Level, ...]
    ↓
User selects: "PSLE"
    ↓
Bot: "How often?" [Buttons: 1x week, 2x week, 3x week]
    ↓
User selects: "2"
    ↓
Bot: "Which area?" [Open text input]
    ↓
User types: "Clementi"
    ↓
Bot: "Here are 4 tutors in Clementi for English PSLE" [List]
    ↓
User selects: "1"
    ↓
Bot: "Connecting you to Ms Sarah..."
    ↓
Tutor receives notification & contacts parent
    ↓
Conversation handed off (bot steps back)
```

---

## 🔍 Monitoring & Analytics

### View Logs

```bash
# Real-time combined logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# Filter by session
grep "session_id_here" logs/combined.log
```

### Check Database

```bash
# Active sessions
SELECT * FROM chatbot_sessions WHERE status = 'ACTIVE';

# Completed sessions (handoffs)
SELECT * FROM chatbot_sessions WHERE status = 'COMPLETED';

# Conversation interactions
SELECT * FROM chatbot_interactions WHERE session_id = 'abc-123';

# Conversion funnel
SELECT
  current_step,
  COUNT(*) as count
FROM chatbot_sessions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY current_step
ORDER BY count DESC;
```

### Key Metrics

Track these in your dashboard:

| Metric | Query |
|--------|-------|
| Daily inquiries | SELECT COUNT(*) FROM chatbot_sessions WHERE DATE(created_at) = TODAY |
| Conversion rate | COMPLETED sessions / ACTIVE sessions × 100 |
| Avg response time | SELECT AVG(response_time_ms) FROM chatbot_interactions |
| Drop-off step | SELECT current_step, COUNT(*) FROM chatbot_sessions WHERE status = 'ABANDONED' GROUP BY current_step |

---

## 🧪 Testing

### Manual Testing

1. **Save Twilio WhatsApp number in phone contacts**
2. **Send a message** (e.g., "Hello")
3. **Bot responds** with subject buttons
4. **Select options** and verify flow completes

### Integration Testing

```bash
npm test
```

### Load Testing (optional)

```bash
# Install Apache Bench
apt-get install apache2-utils

# Send 1000 requests with 10 concurrent
ab -n 1000 -c 10 http://localhost:3000/health
```

---

## 🚢 Deployment

### Deploy to Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL add-on
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis add-on
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set TWILIO_ACCOUNT_SID=AC...
heroku config:set TWILIO_AUTH_TOKEN=...
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Webhook URL: https://your-app-name.herokuapp.com/webhook/message
```

### Deploy to AWS

```bash
# Create EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name your-key

# SSH into instance
ssh -i your-key.pem ec2-user@<instance-ip>

# Install Node, PostgreSQL, Redis
sudo yum update -y
sudo yum install nodejs postgresql redis -y

# Clone repo, install deps, start server
git clone <repo>
cd whatsapp-chatbot
npm install
npm start

# Configure firewall
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0
```

### Deploy to Google Cloud Run

```bash
# Create Dockerfile in project root
docker build -t whatsapp-chatbot .

# Push to Google Container Registry
docker tag whatsapp-chatbot gcr.io/your-project/whatsapp-chatbot
docker push gcr.io/your-project/whatsapp-chatbot

# Deploy to Cloud Run
gcloud run deploy whatsapp-chatbot \
  --image gcr.io/your-project/whatsapp-chatbot \
  --platform managed \
  --region us-central1 \
  --memory 256Mi

# Set environment variables
gcloud run services update whatsapp-chatbot \
  --update-env-vars NODE_ENV=production,TWILIO_ACCOUNT_SID=AC...
```

---

## 🔒 Security Best Practices

✅ **DO:**
- Always verify Twilio signatures
- Use HTTPS for webhooks
- Encrypt sensitive data (passwords, API keys)
- Implement rate limiting
- Log all interactions
- Validate all user input
- Use environment variables for secrets

❌ **DON'T:**
- Commit .env file to git
- Log phone numbers or sensitive data
- Send raw credentials in messages
- Skip Twilio verification in production
- Store unencrypted passwords
- Use default database credentials

---

## 🐛 Troubleshooting

### "Cannot find module 'twilio'"
```bash
npm install
npm list twilio
```

### "Database connection refused"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Test connection
psql -U postgres -h localhost -d tuition_platform
```

### "Redis connection timeout"
```bash
# Check Redis is running
redis-cli ping

# Start if not running
redis-server

# Check port
netstat -tulpn | grep 6379
```

### "Invalid Twilio signature"
- Verify `TWILIO_AUTH_TOKEN` in .env is correct
- Make sure webhook URL in Twilio console matches exactly
- Check request body hasn't been modified before verification

### "No tutors found"
- Verify tutors table has data: `SELECT * FROM tutors;`
- Check specializations field is valid JSON
- Test search manually: `SELECT * FROM tutors WHERE specializations @> '["English"]';`

---

## 📞 Support

- **Twilio Docs:** https://www.twilio.com/docs/whatsapp
- **Node.js Docs:** https://nodejs.org/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Redis Docs:** https://redis.io/documentation

---

## 📄 License

MIT License - feel free to use in production

---

## 🎯 Next Steps (Phase 2+)

- [ ] Add automated lesson reminders
- [ ] Implement payment processing
- [ ] Build parent dashboard
- [ ] Add AI tutor matching
- [ ] Create mobile app
- [ ] Implement referral tracking
- [ ] Add lesson feedback surveys
- [ ] Build admin panel

---

**Ready to launch!** 🚀

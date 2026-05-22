# WhatsApp Chatbot - Complete Setup Guide
## Step-by-step instructions for getting the chatbot running

---

## Phase 1: Prerequisites (30 minutes)

### 1.1 Install Node.js

**macOS:**
```bash
brew install node@18
node --version  # Should be v18.x or higher
```

**Windows/Linux:**
- Download from https://nodejs.org
- Choose LTS version (18+)
- Verify: `node --version`

### 1.2 Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
psql --version
```

**Windows:**
- Download from https://www.postgresql.org/download/windows
- During installation, set password for `postgres` user
- Add to PATH

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 1.3 Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
redis-cli ping  # Should return: PONG
```

**Windows:**
- Use Windows Subsystem for Linux (WSL2)
- Or download from https://github.com/microsoftarchive/redis/releases

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
redis-cli ping
```

### 1.4 Install ngrok (for local testing)

```bash
# macOS
brew install ngrok/ngrok/ngrok

# OR download from https://ngrok.com/download

# Test
ngrok --version
```

---

## Phase 2: Twilio Setup (20 minutes)

### 2.1 Create Twilio Account

1. Go to https://www.twilio.com/console/
2. Click "Sign Up" and create account
3. Verify email address
4. You'll get **$15 free trial credit**

### 2.2 Get Your Credentials

1. In Twilio Console homepage, look for:
   - **Account SID** (starts with AC...)
   - **Auth Token** (hidden by default, click to reveal)

2. Copy these - you'll need them for `.env` file

**Example:**
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:  f4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.3 Set Up WhatsApp Sandbox

1. In Twilio Console, go to **Messaging → Channels → WhatsApp**
2. Click **WhatsApp Sandbox**
3. You'll see:
   - Sandbox number: `whatsapp:+1415...`
   - Join code: `join <code>`

4. **Save the WhatsApp number** - this goes in your `.env`

### 2.4 Join the Sandbox (Test Your Phone)

1. Save the Twilio WhatsApp sandbox number to your phone contacts
2. Send message: `join <code>` (use the code shown in dashboard)
3. You should receive: "You have joined the WhatsApp sandbox..."

**Now your phone is linked to Twilio for testing!**

---

## Phase 3: Project Setup (15 minutes)

### 3.1 Clone or Extract Code

```bash
# Navigate to where you want the project
cd ~/projects

# Extract the code (if in ZIP)
unzip whatsapp-chatbot.zip
cd WhatsApp_Chatbot_Code
```

### 3.2 Install Node Dependencies

```bash
npm install
```

This will install:
- express (web server)
- twilio (WhatsApp API)
- pg (PostgreSQL)
- redis (session management)
- dotenv (environment variables)
- winston (logging)

### 3.3 Create `.env` File

```bash
# Copy example to actual .env
cp .env.example .env

# Edit with your credentials
nano .env  # or use your favorite editor
```

**Fill in these required fields:**

```env
# From Twilio Console
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=f4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+1415XXXXXXX

# Database (local defaults are fine for testing)
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tuition_platform

# Redis (local defaults are fine)
REDIS_HOST=localhost
REDIS_PORT=6379

# Development mode
NODE_ENV=development
PORT=3000
```

---

## Phase 4: Database Setup (10 minutes)

### 4.1 Create Database

**macOS/Linux:**
```bash
# Connect as postgres user
psql -U postgres

# In psql prompt:
CREATE DATABASE tuition_platform;
\q  # Exit psql
```

**Windows (PowerShell):**
```powershell
# May need to add to PATH first
psql -U postgres
# Then same commands as above
```

### 4.2 Create Tables

```bash
# Connect to your database
psql -U postgres -d tuition_platform

# Paste these SQL commands:
```

```sql
-- Sessions table
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id VARCHAR(50) PRIMARY KEY,
  parent_phone_number VARCHAR(20) NOT NULL,
  parent_name VARCHAR(100),
  child_age INTEGER,
  initial_subject VARCHAR(50),
  current_step VARCHAR(50) DEFAULT 'START',
  conversation_state JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Interactions table
CREATE TABLE IF NOT EXISTS chatbot_interactions (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(50) NOT NULL,
  step VARCHAR(50),
  user_input TEXT,
  bot_response TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutors table
CREATE TABLE IF NOT EXISTS tutors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rate INTEGER NOT NULL,
  experience_years INTEGER,
  rating DECIMAL(2,1),
  specializations JSONB,
  area VARCHAR(100),
  whatsapp_number VARCHAR(20),
  moe_teacher BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample tutors for testing
INSERT INTO tutors (name, rate, experience_years, rating, specializations, area, whatsapp_number, moe_teacher, bio)
VALUES
  ('Ms Sarah', 40, 8, 4.9, '["English"]', 'Clementi', '+6591234567', true, 'MOE Teacher, Expert in writing'),
  ('Mr Raj', 35, 5, 4.8, '["English"]', 'Clementi', '+6591234568', true, 'Ex-MOE, Grammar specialist'),
  ('Ms Priya', 38, 6, 4.7, '["Math"]', 'Bukit Timah', '+6591234569', false, 'Patient, good with struggling students'),
  ('Mr David', 42, 10, 4.9, '["Math","Science"]', 'Orchard', '+6591234570', true, 'Exam specialist');

-- Exit
\q
```

**Verify tables were created:**
```bash
psql -U postgres -d tuition_platform -c "\dt"
```

---

## Phase 5: Local Testing (10 minutes)

### 5.1 Start All Services

**Terminal 1: Start Node server**
```bash
cd WhatsApp_Chatbot_Code
npm run dev

# Should output:
# 🚀 WhatsApp Chatbot Server running on port 3000
# Webhook URL: POST http://localhost:3000/webhook/message
```

**Terminal 2: Start ngrok tunnel**
```bash
ngrok http 3000

# You'll see:
# Forwarding https://abc123def45.ngrok.io -> http://localhost:3000
# (Copy the https URL)
```

### 5.2 Update Twilio Webhook

1. Go to Twilio Console → Messaging → WhatsApp Sandbox
2. Under "When a message comes in", paste your ngrok URL:
   ```
   https://abc123def45.ngrok.io/webhook/message
   ```
3. Make sure method is **POST**
4. Click **Save**

### 5.3 Test the Chatbot

1. Open WhatsApp on your phone
2. Send a message to the Twilio WhatsApp sandbox number
3. **You should get the welcome message with subject buttons!**
4. Test the full flow:
   - Select "English"
   - Select "PSLE"
   - Select "2x per week"
   - Type "Clementi"
   - Select a tutor

**If it works, congrats! 🎉**

---

## Phase 6: Troubleshooting

### "Database connection refused"

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# If error, start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux
```

### "Redis connection refused"

```bash
# Check Redis is running
redis-cli ping

# If no response, start Redis
brew services start redis         # macOS
sudo systemctl start redis-server # Linux
```

### "Cannot find module 'twilio'"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Invalid Twilio signature" in logs

- Verify `TWILIO_AUTH_TOKEN` in `.env` matches Twilio Console exactly
- Make sure webhook URL in Twilio matches your ngrok URL
- Ngrok tunnels change every restart - update Twilio webhook each time

### "No tutors found"

```bash
# Verify tutors table has data
psql -U postgres -d tuition_platform
SELECT * FROM tutors;

# Should show the sample tutors
```

### "ngrok tunnel expired"

- Each time you restart ngrok, it gets a new URL
- Update Twilio webhook URL with new ngrok URL
- Or upgrade ngrok to static domain (paid feature)

---

## Phase 7: Production Deployment

Once tested locally, deploy to production:

### Option A: Heroku (Easiest)

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set TWILIO_ACCOUNT_SID=AC...
heroku config:set TWILIO_AUTH_TOKEN=...
heroku config:set TWILIO_WHATSAPP_NUMBER=...
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Your webhook URL: https://your-app-name.herokuapp.com/webhook/message
```

### Option B: AWS EC2

See README.md section "Deploy to AWS"

### Option C: Google Cloud Run

See README.md section "Deploy to Google Cloud Run"

**After deployment:**
1. Update Twilio webhook URL to your production URL
2. Test end-to-end
3. Monitor logs: `heroku logs --tail`

---

## ✅ Checklist: You're Done When...

- [ ] Node.js, PostgreSQL, Redis installed locally
- [ ] Twilio account created with WhatsApp sandbox
- [ ] `.env` file filled with Twilio credentials
- [ ] Database created with sample tutors
- [ ] `npm run dev` runs without errors
- [ ] Ngrok tunnel is active
- [ ] Twilio webhook URL is set
- [ ] Bot responds to "Hello" with subject buttons
- [ ] Full conversation flow works (subject → level → frequency → area → tutor)
- [ ] Ready for production deployment

---

## 📞 Next Steps

1. **Add more tutors** to database
2. **Integrate with your main platform** (API calls to get real tutors)
3. **Customize message templates** (change company name, rates, etc.)
4. **Set up monitoring** (track metrics, errors)
5. **Deploy to production**
6. **Plan Phase 2 features** (payments, scheduling, AI matching)

---

**You're all set! Start with Phase 1 and work through sequentially.** 🚀

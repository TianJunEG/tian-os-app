# WhatsApp Chatbot - Quick Start (5 Minutes)

## For the impatient developer 🏃

### 1. Install everything
```bash
# macOS
brew install node@18 postgresql@15 redis ngrok

# Start services
brew services start postgresql@15
brew services start redis

# Verify
node --version   # should be v18+
psql --version   # should be 15+
redis-cli ping   # should return PONG
```

### 2. Setup project
```bash
cd WhatsApp_Chatbot_Code
npm install
cp .env.example .env
```

### 3. Get Twilio credentials
- Go to https://www.twilio.com/console
- Sign up (get $15 free trial)
- Copy **Account SID** and **Auth Token**
- Enable WhatsApp sandbox
- Save your **WhatsApp number**

### 4. Configure .env
```bash
nano .env
```

Set these:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=f4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+1415XXXXXXX
NODE_ENV=development
```

### 5. Create database
```bash
psql -U postgres

# In psql:
CREATE DATABASE tuition_platform;
\q

# Then populate:
psql -U postgres -d tuition_platform < db_init.sql
```

(See SETUP_GUIDE.md for full SQL)

### 6. Start chatbot
**Terminal 1:**
```bash
npm run dev
# Should show: 🚀 WhatsApp Chatbot Server running on port 3000
```

**Terminal 2:**
```bash
ngrok http 3000
# Copy the https URL: https://abc123...ngrok.io
```

### 7. Connect Twilio
1. Go to Twilio Console → Messaging → WhatsApp Sandbox
2. Paste your ngrok URL: `https://abc123...ngrok.io/webhook/message`
3. Save

### 8. Test it!
Send "Hello" to the Twilio WhatsApp number from your phone

**Expected:** Bot responds with subject selection buttons

---

## 🎯 What you got

✅ Full production-ready Node.js/Express server
✅ WhatsApp webhook integration with Twilio
✅ PostgreSQL database with session management
✅ Redis for conversation state
✅ Complete conversation state machine
✅ Tutor search and matching
✅ Error handling and logging
✅ Ready for deployment (Heroku/AWS/GCP)

---

## 📁 File Structure

```
WhatsApp_Chatbot_Code/
├── src/
│   ├── server.js                 ← Main server
│   ├── routes/webhook.js         ← Webhook handler
│   ├── controllers/chatbot.js    ← Conversation logic
│   ├── services/
│   │   ├── twilio.js            ← WhatsApp API
│   │   ├── database.js          ← PostgreSQL
│   │   ├── redis.js             ← Sessions
│   │   └── ...
│   ├── models/
│   │   ├── conversation.js      ← Session model
│   │   └── templates.js         ← Message templates
│   └── utils/
│       ├── logger.js            ← Logging
│       └── validators.js        ← Input validation
├── package.json
├── .env.example                 ← Copy to .env
├── README.md                    ← Full documentation
├── SETUP_GUIDE.md              ← Detailed setup (30 min)
└── QUICK_START.md              ← This file
```

---

## 🚀 Next (After Testing Locally)

### Deploy to Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:premium-0
heroku config:set TWILIO_ACCOUNT_SID=AC...
# ... set other env vars
git push heroku main
# Webhook URL: https://your-app-name.herokuapp.com/webhook/message
```

### Customize for Your Platform
1. Update `message templates` in `src/models/templates.js`
2. Change tutor search query in `src/services/database.js`
3. Add your actual tutors to PostgreSQL
4. Customize conversation flow in `src/controllers/chatbot.js`

---

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| "Cannot find module 'twilio'" | Run `npm install` |
| "Database connection refused" | Run `brew services start postgresql@15` |
| "Redis timeout" | Run `brew services start redis` |
| "Invalid Twilio signature" | Make sure `.env` matches Twilio Console exactly |
| "No tutors found" | Verify tutors table has data: `SELECT * FROM tutors;` |
| "Ngrok URL changed" | Update webhook URL in Twilio Console with new ngrok URL |

---

## 📚 Resources

- **Twilio Docs:** https://www.twilio.com/docs/whatsapp
- **Node.js:** https://nodejs.org/docs
- **PostgreSQL:** https://www.postgresql.org/docs
- **Redis:** https://redis.io/docs
- **Full setup guide:** See `SETUP_GUIDE.md`
- **Code docs:** See `README.md`

---

## ✨ You're ready!

That's it. The chatbot is built and running. Go ahead and:
1. Test the conversation flow
2. Customize for your tutors
3. Deploy to production
4. Start getting bookings!

For detailed setup, see `SETUP_GUIDE.md`
For full documentation, see `README.md`

**Questions? Check the troubleshooting section above or see README.md** 🚀

# QUICK FIX GUIDE - May 22, 2026

## Current Status
- ✅ Frontend code is working and correctly configured
- ✅ Frontend port issue (5000 vs 5001) has been FIXED
- ❌ MongoDB is NOT running (this is blocking all testing)
- ❌ Backend cannot start without MongoDB

## Root Cause
Backend crashes immediately on startup with:
```
Error connecting to MongoDB: connect ECONNREFUSED 127.0.0.1:27017
```

## IMMEDIATE FIX (Run in macOS Terminal)

### Step 1: Start MongoDB
```bash
mkdir -p ~/mongodb/data
mongod --dbpath ~/mongodb/data --port 27017
```

Keep this Terminal window open.

### Step 2: Start Backend (Open NEW Terminal window)
```bash
cd /Users/mco/Documents/Tuition
PORT=5001 npm run dev
```

You should see:
```
Server running on port 5001
MongoDB connected: localhost
```

### Step 3: Start Frontend (Open ANOTHER NEW Terminal window)
```bash
cd /Users/mco/Documents/Tuition/frontend
npm run dev
```

You should see:
```
VITE v4.5.14 ready in 254 ms
Local: http://localhost:3000/
```

## Verify Services Are Running

Once all three are running, test by opening browser to:
```
http://localhost:3000/register
```

If form loads and you can submit without errors → Services are working!

## What Was Fixed
**File:** `frontend/vite.config.js`

Changed from:
```javascript
define: {
  'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5001/api')
}
```

To:
```javascript
define: {
  'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5001/api')
}
```

This ensures frontend always sends requests to port 5001 where backend is running.

## Testing Can Resume Once Services Run

After all three services are running:
1. Register parent user account
2. Login and explore dashboard
3. Search for tutors
4. Create bookings
5. Test payments
6. Register as tutor
7. Test messaging and reviews

## Reference Documents
- **TESTING_LOG_MAY22_RESUMED.md** - Detailed technical analysis and findings
- **CORS_ISSUE_REPORT.md** - Previous CORS configuration fixes

---

**Time to Fix:** ~5 minutes (just start the three services)  
**Status:** Ready to test once MongoDB and services are running

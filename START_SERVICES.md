# Quick Start: Running TutorMatch Services

**Status:** 3 major features built and ready to test:
- ✅ 9-criteria matching algorithm
- ✅ Session management with structured notes
- ✅ Complete admin dashboard

---

## Step 1: Check & Clear Ports

Open Terminal and run:

```bash
cd /Users/mco/Documents/Tuition
bash diagnose-ports.sh
```

This will show you which ports are in use. If any ports are busy (⚠️), run the kill command shown.

**Example output:**
```
1️⃣  Checking port 5001 (Backend)...
   ✅ Port 5001 is FREE

2️⃣  Checking port 3000 (Frontend)...
   ⚠️  Port 3000 is IN USE
   Processes using port 3000:
   node    12345  user    6u  IPv4 0x...
   
   ☞ To kill: sudo lsof -ti :3000 | xargs kill -9
```

If you see ⚠️, copy and run the kill command (it will ask for your password):
```bash
sudo lsof -ti :3000 | xargs kill -9
```

**Repeat until all ports show ✅**

---

## Step 2: Start MongoDB

Open **NEW Terminal window** (first one will stay occupied):

```bash
# Start MongoDB locally
mongod --dbpath=/usr/local/var/mongodb

# OR if using Homebrew:
brew services start mongodb-community
```

Wait for message: `Waiting for connections on port 27017`

---

## Step 3: Start Backend Server

Open **ANOTHER NEW Terminal window**:

```bash
cd /Users/mco/Documents/Tuition
PORT=5001 npm run server
```

Wait for message: `Server running on port 5001`

---

## Step 4: Start Frontend

Open **ANOTHER NEW Terminal window**:

```bash
cd /Users/mco/Documents/Tuition/frontend
npm run dev
```

Wait for message: `Local: http://localhost:3000`

---

## Now You Have:

```
🗄️  MongoDB → localhost:27017
🖥️  Backend API → localhost:5001
🌐 Frontend → localhost:3000
```

---

## Test the Features

### Feature 1: Matching Algorithm
1. Go to `http://localhost:3000/search`
2. Enter parent preferences (subject, grade level, budget)
3. Should see top 5 tutors ranked by compatibility score
4. Each tutor shows why they matched (criteria breakdown)

**Backend logs:**
```
POST /api/search/match
✅ Returned 5 qualified tutors with 70+ scores
```

---

### Feature 2: Session Management
1. Go to `http://localhost:3000/admin` (login as admin first)
2. Navigate to "Bookings" tab
3. Click on a completed booking
4. You should see:
   - **Check-in** button (tutor starts session)
   - **Session Notes** form (after session)
   - Parent's **Progress View** (topics covered, understanding levels)

**Test flow:**
```bash
# 1. Tutor clicks "Check-in" on a booking
PUT http://localhost:5001/api/bookings/[bookingId]/checkin
# Response: status = "in_progress", actualStartTime recorded

# 2. Tutor submits notes after session
POST http://localhost:5001/api/bookings/[bookingId]/notes
{
  "topicsCovered": ["Fractions", "Decimals"],
  "studentUnderstanding": "ok",
  "homeworkAssigned": "Practice 10 problems"
}
# Response: Notes saved, tutor score updated

# 3. Parent views progress
GET http://localhost:5001/api/bookings/parent/[parentId]/progress
# Response: Dashboard showing total hours, topics, progress %
```

---

### Feature 3: Admin Dashboard
1. Go to `http://localhost:3000/admin`
2. Login with: `email: admin@tutormatch.com` (if exists in DB)
3. You should see 5 tabs:
   - **📊 Overview** - Key metrics (users, bookings, revenue, quality)
   - **👥 Users** - List of parents/tutors with filters
   - **✅ Verification** - Pending tutor approvals
   - **📅 Bookings** - All sessions with status breakdown
   - **⚠️ Disputes** - Flagged bookings and resolutions

**Test data included:**
- 6,001 tutors (from previous seed)
- 500 parents
- 1,500 bookings
- Average rating: 4.24/5

---

## Common Issues & Fixes

### Issue: "Address already in use" on port 5001
```bash
# Kill the process using 5001
sudo lsof -ti :5001 | xargs kill -9

# Verify it's free
lsof -i :5001
# Should return nothing

# Try again
PORT=5001 npm run server
```

### Issue: MongoDB won't start
```bash
# Check if mongod is already running
ps aux | grep mongod

# Kill if found
kill -9 [PID]

# Start fresh
mongod --dbpath=/usr/local/var/mongodb
```

### Issue: Frontend not connecting to backend
```bash
# Check backend is running:
curl http://localhost:5001/api/health
# Should return: { "status": "Backend is running" }

# If error, restart backend:
PORT=5001 npm run server
```

### Issue: Database connection fails
```bash
# Make sure MongoDB is running:
lsof -i :27017
# Should show mongod process

# If not, start MongoDB first
mongod --dbpath=/usr/local/var/mongodb
```

---

## Testing Endpoints via Terminal

While services are running, you can test API endpoints:

```bash
# Get all metrics
curl http://localhost:5001/api/admin/dashboard

# Get admin token (need admin user in DB)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tutormatch.com","password":"pass"}'

# List users (with token)
curl http://localhost:5001/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search tutors
curl -X POST http://localhost:5001/api/search/match \
  -H "Content-Type: application/json" \
  -d '{
    "grade": "high_school",
    "subject": "math",
    "budget": 50
  }'
```

---

## Window Layout (Recommended)

Keep these 4 windows open side-by-side:

```
┌──────────────┬──────────────┬──────────────┐
│  MongoDB     │  Backend     │  Frontend    │
│  Terminal 1  │  Terminal 2  │  Terminal 3  │
├──────────────┼──────────────┼──────────────┤
│ mongod       │ npm run      │ npm run      │
│              │ server       │ dev          │
│ Port: 27017  │ Port: 5001   │ Port: 3000   │
│              │              │              │
│ (running)    │ (running)    │ (running)    │
└──────────────┴──────────────┴──────────────┘
```

**Plus 1 extra window for testing commands**

---

## Next: Build What's Left

While company registration processes (2-3 weeks), you can:

### Build in parallel (no Stripe needed yet):
- [ ] Tutor Onboarding UI
  - Profile creation form
  - Qualification input
  - Availability calendar
  - Rate setting

- [ ] Parent Booking UI
  - Search refinement
  - Date/time picker
  - Session confirmation
  - Pre-payment UX (UI only, backend ready)

- [ ] Messaging System
  - In-app chat between parent/tutor
  - Message history
  - Notifications

- [ ] Mobile Polish
  - Responsive design
  - Touch-friendly buttons
  - Mobile navigation

### Payment features (requires Stripe):
- Once you have Stripe approved, enable:
  - Payment form in booking flow
  - Tutor connected accounts
  - Payout management
  - Refund handling

---

## Success Indicators

You'll know everything is working when:

✅ **All 3 terminals show no errors**
✅ **http://localhost:3000 loads** (frontend renders)
✅ **http://localhost:5001/api/health returns OK** (backend responds)
✅ **Admin dashboard loads** and shows test data
✅ **Search returns matching tutors** with scores
✅ **Matching algorithm scores are 70+** for returned tutors

---

## Troubleshooting Checklist

- [ ] MongoDB is running (port 27017)
- [ ] Backend is running (port 5001)
- [ ] Frontend is running (port 3000)
- [ ] No error messages in any terminal
- [ ] Browser console (F12) has no red errors
- [ ] Can access http://localhost:3000
- [ ] Admin dashboard loads and shows data
- [ ] Backend health check passes

---

## Ready?

Run this in order:
1. `bash diagnose-ports.sh` - Clear any blocking processes
2. `mongod --dbpath=/usr/local/var/mongodb` - Start database
3. `PORT=5001 npm run server` - Start backend
4. `cd frontend && npm run dev` - Start frontend
5. Open http://localhost:3000

You now have a fully functional MVP with:
- Smart matching (9 criteria)
- Session management (check-in + structured notes)
- Admin controls (5 tabs, 10+ endpoints)
- 6,000+ test users with realistic data

**The code is ready. Let's test it.** 🚀

# Quick Testing Checklist - Parent Booking Flow

**Time Required:** ~15 minutes  
**Goal:** Verify all critical functionality works

---

## ✅ Pre-Test: Services Running

Before starting, verify all 3 services are running:

```bash
# Check port 27017 (MongoDB)
lsof -i :27017
# Should show: mongod process

# Check port 5001 (Backend)
lsof -i :5001
# Should show: node process

# Check port 3000 (Frontend)
lsof -i :3000
# Should show: chrome or browser process
```

If any fail, restart:
```bash
# Terminal 1
mongod --dbpath=/usr/local/var/mongodb

# Terminal 2
cd /Users/mco/Documents/Tuition && PORT=5001 npm run server

# Terminal 3
cd /Users/mco/Documents/Tuition/frontend && npm run dev
```

---

## 🧪 Test 1: Backend API (5 minutes)

### Create Parent Profile
```bash
# Copy this entire block and run in Terminal:

# Step 1: Signup
SIGNUP=$(curl -s -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "test.parent.'$RANDOM'@example.com",
    "password": "password123",
    "role": "parent"
  }')

TOKEN=$(echo $SIGNUP | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✓ Got token: ${TOKEN:0:20}..."

# Step 2: Create parent profile
curl -s -X POST http://localhost:5001/api/parents/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Test Student",
    "studentAge": 15,
    "gradeLevel": "Grade 9-10",
    "primarySubject": "Mathematics",
    "otherSubjects": ["SAT Prep"],
    "learningGoals": "Get better grades in math",
    "specificChallenges": "Struggles with algebra",
    "preferredTutorGender": "any",
    "learningStyle": "adaptive",
    "preferredSessionType": "online",
    "timezone": "America/New_York",
    "budget": 60,
    "availability": {
      "monday": { "available": false },
      "tuesday": { "available": true, "start": "16:00", "end": "18:00" },
      "wednesday": { "available": true, "start": "16:00", "end": "18:00" },
      "thursday": { "available": true, "start": "16:00", "end": "18:00" },
      "friday": { "available": true, "start": "16:00", "end": "18:00" },
      "saturday": { "available": true, "start": "10:00", "end": "14:00" },
      "sunday": { "available": true, "start": "10:00", "end": "14:00" }
    }
  }' | python3 -m json.tool

echo "✓ Profile created successfully"
```

**Expected:** Should show `"success": true` and `"profileComplete": true`

### Get Parent Profile
```bash
curl -s -X GET http://localhost:5001/api/parents/profile \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected:** Should return parent profile with studentName, budget, etc.

### ✅ Test 1 Result
- [ ] Signup response has token
- [ ] Create profile returns success
- [ ] Profile has studentName and budget
- [ ] Get profile returns the data

---

## 🧪 Test 2: Tutor Search API (3 minutes)

### Search for Matching Tutors
```bash
curl -s -X POST http://localhost:5001/api/search/match \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grade": "Grade 9-10",
    "subject": "Mathematics",
    "budget": 60
  }' | python3 -m json.tool | head -100
```

**Expected:**
- `tutors` array with 5+ results
- Each tutor has: `name`, `hourlyRate`, `rating`, `specialties`
- Each tutor has: `compatibilityScore` (should be 70+)
- Each tutor has: `matchExplanation`

### ✅ Test 2 Result
- [ ] Returns array of tutors
- [ ] Tutors have all required fields
- [ ] Scores are 70+
- [ ] Match explanations present

---

## 🧪 Test 3: Booking Creation (2 minutes)

### Create Booking
```bash
# From the search results above, get first tutor's _id
# Then run:

TUTOR_ID="[paste_first_tutor_id_here]"

curl -s -X POST http://localhost:5001/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tutorId": "'$TUTOR_ID'",
    "subject": "Mathematics",
    "scheduledDate": "2026-05-25T00:00:00Z",
    "startTime": "15:00",
    "endTime": "16:00",
    "duration": 1,
    "hourlyRate": 55,
    "totalCost": 55,
    "sessionType": "online",
    "meetingLink": "https://zoom.us/j/123456789",
    "notes": "Focus on algebra"
  }' | python3 -m json.tool
```

**Expected:**
- `"success": true`
- `"status": "pending"`
- `totalCost: 55`

### ✅ Test 3 Result
- [ ] Booking created successfully
- [ ] Status is "pending"
- [ ] Total cost calculated correctly

---

## 🧪 Test 4: Frontend UI - Parent Profile Form (3 minutes)

1. **Open browser:** http://localhost:3000/parent/profile
   - [ ] Page loads with gradient background
   - [ ] Title shows "👨‍🎓 Tell Us About Your Student"
   - [ ] Progress bar shows 25%

2. **Fill Step 1:**
   - [ ] Enter student name: "Emma"
   - [ ] Enter age: "14"
   - [ ] Select grade: "Grade 9-10"
   - [ ] Click "Next →"
   - [ ] Page advances to Step 2

3. **Fill Step 2:**
   - [ ] Select primary subject: "Mathematics"
   - [ ] Check boxes for "SAT Prep" & "Physics"
   - [ ] Type learning goals: "Get A+ in algebra for college prep"
   - [ ] Click "Next →"
   - [ ] Page advances to Step 3

4. **Fill Step 3:**
   - [ ] Select learning style
   - [ ] Select session type: "Online"
   - [ ] Select budget: "60"
   - [ ] Click "Next →"
   - [ ] Page advances to Step 4

5. **Fill Step 4:**
   - [ ] Check "Tuesday" checkbox
   - [ ] Set times appear
   - [ ] Check "Saturday" checkbox
   - [ ] Check terms agreement checkbox
   - [ ] Click "Find Tutors"
   - [ ] Wait for loading spinner
   - [ ] Success page appears with checkmark

### ✅ Test 4 Result
- [ ] All 4 steps render correctly
- [ ] Form accepts input at each step
- [ ] Navigation works (Previous/Next)
- [ ] Validation works (missing required fields show errors)
- [ ] Success page appears after submission

---

## 🧪 Test 5: Frontend UI - Tutor Search (2 minutes)

1. **After profile form success, page auto-redirects to /search**
   - [ ] See list of tutor cards
   - [ ] Page title: "🔍 Find Your Perfect Tutor"
   - [ ] Shows number of tutors found

2. **Check Tutor Card Display:**
   - [ ] Each card shows:
     - [ ] Tutor name
     - [ ] Star rating (e.g., ⭐⭐⭐⭐⭐ 4.8/5)
     - [ ] Hourly rate (large, green text)
     - [ ] Bio (2 lines max)
     - [ ] Stats: Experience, Sessions, Success Rate
     - [ ] Specialties tags
     - [ ] Match score & explanation
     - [ ] "📅 Book Session" button
     - [ ] "💬 Message" button

3. **Test Filters:**
   - [ ] Try Subject dropdown → filters update
   - [ ] Adjust Price slider → tutors re-sort
   - [ ] Try Sort dropdown (change to "Highest Rating") → reorders

4. **Test Booking Navigation:**
   - [ ] Click "📅 Book Session" on first tutor
   - [ ] Should redirect to /booking page

### ✅ Test 5 Result
- [ ] Tutors display with all fields
- [ ] Filters work and update in real-time
- [ ] Book button navigates to booking flow

---

## 🧪 Test 6: Frontend UI - Booking Flow (2 minutes)

1. **Step 1: Date & Time**
   - [ ] Page shows "📅 Choose Date & Time"
   - [ ] Date picker works (select tomorrow or later)
   - [ ] Time dropdown shows slots
   - [ ] Duration dropdown works
   - [ ] Summary appears showing selected time
   - [ ] Click "Next →" advances

2. **Step 2: Session Details**
   - [ ] Progress bar shows 67%
   - [ ] Subject dropdown works
   - [ ] Session type: try "Online" → meeting link field appears
   - [ ] Add meeting link: "https://zoom.us/j/123456"
   - [ ] Click "Next →" advances

3. **Step 3: Confirmation**
   - [ ] Progress bar shows 100%
   - [ ] See booking summary with:
     - [ ] Tutor name
     - [ ] Date & time
     - [ ] Duration & cost
     - [ ] Session type
   - [ ] Payment breakdown shows:
     - [ ] Hourly rate
     - [ ] Total cost (bold)
     - [ ] Platform fee (12%)
     - [ ] Tutor earnings (88%)
   - [ ] Check terms checkbox
   - [ ] Click "Confirm & Pay $[amount]"

4. **Success Page:**
   - [ ] See checkmark ✓
   - [ ] Message: "Booking Confirmed!"
   - [ ] Auto-redirects after 2 seconds

### ✅ Test 6 Result
- [ ] All 3 booking steps work
- [ ] Validation prevents invalid submissions
- [ ] Cost calculation is correct
- [ ] Success page appears

---

## ✅ Final Results

### Summary:
```
Test 1 (Backend API):        [ ] PASS  [ ] FAIL
Test 2 (Tutor Search API):   [ ] PASS  [ ] FAIL
Test 3 (Booking Creation):   [ ] PASS  [ ] FAIL
Test 4 (Profile Form UI):    [ ] PASS  [ ] FAIL
Test 5 (Search UI):          [ ] PASS  [ ] FAIL
Test 6 (Booking Flow UI):    [ ] PASS  [ ] FAIL

Overall: [ ] ALL PASS → Ready for next feature
         [ ] Some failures → Debug & fix before next
```

---

## 🐛 If Something Fails

### API Tests Failed?
- [ ] Check backend terminal for error messages
- [ ] Verify token is being extracted correctly
- [ ] Try API endpoint in isolation with curl

### Frontend Tests Failed?
- [ ] Check browser console (F12) for JavaScript errors
- [ ] Verify routes are added to App.jsx
- [ ] Restart frontend: `npm run dev`

### Database Issue?
```bash
# Reset test data
mongosh
use tutormatch
db.users.deleteMany({ email: /test.parent/ })
db.bookings.deleteMany({ notes: "Focus on algebra" })
```

---

## 📝 Ready to Report?

After testing, reply with:

```
Backend API Tests: PASS / FAIL
Frontend UI Tests: PASS / FAIL
Database Tests: PASS / FAIL

Issues found:
- (list any)

Ready to build Feature #3?
```

If all pass ✅, we'll build **Messaging System** next.
If any fail ❌, we'll debug first.

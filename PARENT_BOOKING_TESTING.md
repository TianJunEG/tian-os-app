# Parent Booking Flow - Testing Guide

**Test Duration:** ~30 minutes for full flow  
**Prerequisites:** Services running (MongoDB, Backend, Frontend)

---

## 🚀 Quick Start: Run Services

**Terminal 1 - MongoDB:**
```bash
mongod --dbpath=/usr/local/var/mongodb
# Wait for: "Waiting for connections on port 27017"
```

**Terminal 2 - Backend:**
```bash
cd /Users/mco/Documents/Tuition
PORT=5001 npm run server
# Wait for: "Server running on port 5001"
```

**Terminal 3 - Frontend:**
```bash
cd /Users/mco/Documents/Tuition/frontend
npm run dev
# Wait for: "Local: http://localhost:3000"
```

---

## ✅ Test 1: Backend API - Parent Profile Endpoints

### Create Parent Profile

```bash
# 1. Sign up as parent
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "parent.test@example.com",
    "password": "password123",
    "role": "parent"
  }'

# Save the token from response

# 2. Create parent profile
TOKEN="your_token_here"
curl -X POST http://localhost:5001/api/parents/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Emma Smith",
    "studentAge": 14,
    "gradeLevel": "Grade 9-10",
    "primarySubject": "Mathematics",
    "otherSubjects": ["SAT Prep", "Physics"],
    "learningGoals": "Improve from B to A grade, prepare for SAT",
    "specificChallenges": "Struggles with word problems",
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
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Parent profile created successfully",
  "user": {
    "_id": "665a...",
    "email": "parent.test@example.com",
    "profileComplete": true,
    "parentProfile": {
      "studentName": "Emma Smith",
      "studentAge": 14,
      "primarySubject": "Mathematics",
      "budget": 60
    }
  }
}
```

### Get Parent Profile

```bash
curl -X GET http://localhost:5001/api/parents/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Returns parent profile with all fields

---

## ✅ Test 2: Tutor Search - Integration with Existing Match Endpoint

```bash
# Search for tutors matching parent's criteria
TOKEN="parent_token_here"

curl -X POST http://localhost:5001/api/search/match \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grade": "Grade 9-10",
    "subject": "Mathematics",
    "budget": 60
  }'
```

**Expected Response:**
- Array of 5+ tutors
- Each has: name, hourlyRate, rating, specialties, compatibilityScore (70+)
- matchExplanation describing why this is a good match

---

## ✅ Test 3: Create Booking

```bash
# Get a tutor ID from the search results above
TUTOR_ID="tutorId_from_search"

curl -X POST http://localhost:5001/api/bookings \
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
    "notes": "Focus on quadratic equations"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "booking": {
    "_id": "665a...",
    "parentId": "...",
    "tutorId": "...",
    "subject": "Mathematics",
    "status": "pending",
    "totalCost": 55,
    "sessionType": "online"
  }
}
```

---

## ✅ Test 4: Frontend - Parent Profile Form

### Step-by-step UI Test

1. **Navigate to profile form:**
   - Go to http://localhost:3000/parent/profile
   - Should see beautiful gradient background

2. **Step 1: Student Info**
   - [ ] Form title: "👨‍🎓 Tell Us About Your Student"
   - [ ] Input fields appear:
     - Student name (text)
     - Age (number, min 5, max 80)
     - Grade level (dropdown)
   - [ ] Progress bar shows 25%
   - [ ] "Next →" button works
   - [ ] Validation (leave name blank, click Next):
     - [ ] Error message appears
     - [ ] Page doesn't advance

3. **Step 2: Learning Goals**
   - [ ] Form title: "📚 What Subjects Need Help?"
   - [ ] Primary subject dropdown (working)
   - [ ] Checkbox grid for additional subjects
   - [ ] Learning goals textarea (50+ chars required)
   - [ ] Optional challenges field
   - [ ] Progress bar shows 50%
   - [ ] "Previous" button works (goes back to step 1)
   - [ ] Validation works (missing goals, click Next → error)

4. **Step 3: Preferences**
   - [ ] Form title: "🎯 Your Preferences"
   - [ ] Learning style dropdown
   - [ ] Session type dropdown
   - [ ] Tutor gender preference
   - [ ] Budget input with validation ($10 minimum)
   - [ ] Progress bar shows 75%
   - [ ] All inputs are functional

5. **Step 4: Availability**
   - [ ] Form title: "⏰ When Can You Schedule Sessions?"
   - [ ] 7 day checkboxes (Mon-Sun)
   - [ ] Time pickers appear when day enabled
   - [ ] Progress bar shows 100%
   - [ ] Terms checkbox at bottom
   - [ ] "Find Tutors" button appears
   - [ ] Validation (no days selected, click Find):
     - [ ] Error message appears

6. **Submit & Success**
   - [ ] All fields filled correctly
   - [ ] Click "Find Tutors"
   - [ ] Loading spinner appears
   - [ ] Success page shows with checkmark
   - [ ] "Your profile is all set..." message
   - [ ] Auto-redirects to /search after 2s

**Check responsiveness:**
- [ ] Resize browser to mobile (375px)
- [ ] Form still works (single column)
- [ ] Checkboxes stack vertically
- [ ] Buttons are full width
- [ ] Text readable on small screen

---

## ✅ Test 5: Frontend - Tutor Search Page

### Test Search Results

1. **Page Load**
   - [ ] Navigate to http://localhost:3000/search
   - [ ] Should see tutors displayed
   - [ ] Page title: "🔍 Find Your Perfect Tutor"
   - [ ] Shows count of found tutors

2. **Tutor Cards**
   - [ ] Each card shows:
     - [ ] Tutor name & rating (e.g., ⭐⭐⭐⭐⭐ 4.8/5.0)
     - [ ] Review count
     - [ ] Hourly rate (large, green)
     - [ ] Bio (truncated to 2 lines)
     - [ ] Stats grid: Experience, Sessions, Success Rate
     - [ ] Specialties tags
     - [ ] Match score (e.g., 95/100)
     - [ ] "Why this match?" dropdown with explanation
     - [ ] "📅 Book Session" button
     - [ ] "💬 Message" button

3. **Filters Sidebar (Mobile: top)**
   - [ ] Subject dropdown (working)
   - [ ] Price range slider (moves 10-200)
   - [ ] Rating range slider (0-5)
   - [ ] Sort dropdown:
     - [ ] Best Match
     - [ ] Highest Rating
     - [ ] Lowest Price
     - [ ] Most Experience
   - [ ] Each filter updates results in real-time
   - [ ] "Reset Filters" button clears all

4. **Tutor Card Actions**
   - [ ] Click "📅 Book Session"
     - [ ] Stores tutor data in localStorage
     - [ ] Redirects to /booking page
   - [ ] Click "💬 Message" 
     - [ ] (Optional: would open chat)

**Test sorting:**
- [ ] Change sort to "Highest Rating" → tutors reorder by rating
- [ ] Change sort to "Lowest Price" → tutors reorder by rate
- [ ] Change sort to "Most Experience" → tutors reorder by hours taught

**Test filtering:**
- [ ] Filter by subject "Physics" → only physics tutors show
- [ ] Adjust price slider to $40 → only tutors ≤$40 show
- [ ] Adjust rating to 4.5+ → only 4.5+ rated tutors show

---

## ✅ Test 6: Frontend - Booking Flow

### Test Booking Steps

1. **Navigate to Booking**
   - [ ] Click "📅 Book Session" on a tutor card
   - [ ] Redirects to http://localhost:3000/booking
   - [ ] Page title: "📅 Choose Date & Time"

2. **Step 1: Date & Time**
   - [ ] Date picker shows tomorrow's date as minimum
   - [ ] Can select any future date
   - [ ] Start time dropdown has slots (08:00, 08:30, 09:00, etc.)
   - [ ] Duration dropdown works (30 min, 1hr, 1.5hr, 2hr, 2.5hr, 3hr, 4hr)
   - [ ] Selecting time/duration shows summary:
     - [ ] "Session: [date] from [time] to [end-time]"
     - [ ] "Total Duration: [X] hours"
   - [ ] "Next →" button works
   - [ ] Progress bar shows 33%

3. **Step 2: Session Details**
   - [ ] Progress bar shows 67%
   - [ ] Subject dropdown (working)
   - [ ] Session type dropdown:
     - [ ] Online (shows Meeting Link field)
     - [ ] In-Person (shows Location field)
   - [ ] Meeting link input appears/disappears based on selection
   - [ ] Location input appears/disappears based on selection
   - [ ] Notes textarea (optional)
   - [ ] "Previous" button goes back to Step 1
   - [ ] "Next →" button validates & advances

4. **Step 3: Confirmation**
   - [ ] Progress bar shows 100%
   - [ ] Booking summary shows:
     - [ ] Booking Details (tutor, date, time, duration, subject, type)
     - [ ] Payment Summary:
       - [ ] Hourly rate
       - [ ] Duration
       - [ ] Total cost (bold, large)
       - [ ] Platform fee (12%)
       - [ ] Tutor earnings (88%)
   - [ ] Terms checkbox (required)
   - [ ] "Confirm & Pay $[amount]" button
   - [ ] Validation: Unchecked terms, click Confirm → error shows

5. **Submit & Success**
   - [ ] All fields filled correctly
   - [ ] Check terms checkbox
   - [ ] Click "Confirm & Pay $[amount]"
   - [ ] Loading indicator appears ("Processing...")
   - [ ] Success page shows:
     - [ ] Big checkmark ✓
     - [ ] "Booking Confirmed!"
     - [ ] "Your session with [tutor name] is booked."
     - [ ] "Check your email for confirmation..."
     - [ ] Spinner animates
   - [ ] Auto-redirects to /parent/bookings after 2s

**Test date/time scenarios:**
- [ ] Tomorrow, 3pm, 1 hour → total $55
- [ ] Next week, 10am, 2 hours → total $110
- [ ] 30 min session → shows as "0.5 hours"

**Test validation:**
- [ ] Click Next on Step 1 with no date → error "Please select a date"
- [ ] Online session with no link → error "Meeting link is required"
- [ ] In-person with no location → error "Location is required"
- [ ] Step 3 without checking terms → error appears

---

## ✅ Test 7: Database Verification

### Check MongoDB Collections

```bash
# Connect to MongoDB
mongosh

# Use tutormatch database
use tutormatch

# 1. Check parent profile was saved
db.users.findOne({ 
  email: "parent.test@example.com" 
})
# Should show: parentProfile object, profileComplete: true

# 2. Check tutor search (tutors exist)
db.tutorprofiles.countDocuments({ isActive: true })
# Should return 6000+ (from seed)

# 3. Check booking was created
db.bookings.findOne({ 
  status: "pending" 
})
# Should show: booking with parentId, tutorId, totalCost, etc.

# 4. Check booking indexes
db.bookings.getIndexes()
# Should include indexes on parentId, tutorId, status
```

---

## 🐛 Common Issues & Fixes

### Issue: "400 Bad Request" on parent profile

**Cause:** Missing required fields
**Fix:** Ensure all required fields are sent in request body

### Issue: "401 Unauthorized" 

**Cause:** Token missing or invalid
**Fix:** Use token from signup response, include `Authorization: Bearer $TOKEN`

### Issue: Tutors not showing in search

**Cause:** No matching tutors for criteria
**Fix:** Check if tutors have same subject & budget ≤ parent budget

### Issue: Booking creation fails with 404

**Cause:** Tutor ID doesn't exist or is wrong
**Fix:** Copy tutorId from search results, verify it matches a tutor

### Issue: Frontend form doesn't validate

**Cause:** JavaScript error in console
**Fix:** Check browser console (F12) for errors, verify API_URL in component

---

## ✅ Final Verification Checklist

### Backend ✅
- [ ] POST /api/parents/profile works
- [ ] GET /api/parents/profile works
- [ ] PUT /api/parents/profile works
- [ ] POST /api/bookings works (with parent token)
- [ ] Database saves parent profile correctly
- [ ] Database saves booking correctly
- [ ] All validation errors return proper messages

### Frontend ✅
- [ ] ParentProfile component renders on /parent/profile
- [ ] All 4 steps work with validation
- [ ] TutorSearch component renders on /search
- [ ] Filters and sorting work
- [ ] BookingFlow component renders on /booking
- [ ] All 3 steps work with validation
- [ ] Success pages redirect correctly
- [ ] Responsive design works on mobile/tablet

### Integration ✅
- [ ] Signup as parent → profile form
- [ ] Complete profile → search page
- [ ] Select tutor → booking page
- [ ] Complete booking → success page
- [ ] Data persists in database

---

## 📝 Test Report Template

```
TEST EXECUTION REPORT
Date: ____________
Tester: ____________

PASSED TESTS:
- [ ] Test 1: Backend API
- [ ] Test 2: Tutor Search API
- [ ] Test 3: Booking Creation
- [ ] Test 4: Parent Profile Form
- [ ] Test 5: Tutor Search Page
- [ ] Test 6: Booking Flow
- [ ] Test 7: Database

FAILED TESTS:
(List any failures here)

BUGS FOUND:
(List any bugs here)

NOTES:
(Additional observations)
```

---

## 🎉 Success Criteria

All tests pass when:
- ✅ Parent profile saves to database
- ✅ Tutor search returns matching tutors
- ✅ Booking creates with correct total cost
- ✅ All 4 profile steps work
- ✅ All 3 booking steps work
- ✅ Form validation works
- ✅ Database has correct data
- ✅ UI is responsive on all screen sizes
- ✅ Success pages redirect correctly
- ✅ No console errors

**Estimated time for all tests: 30-45 minutes**

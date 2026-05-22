# Comprehensive Testing Guide - Tutor Match Platform

## Quick Start (After Authentication Fix)

1. **Clear & Reseed Database**
   ```bash
   npm run seed:fresh
   ```

2. **Start Services** (if not running)
   - Backend: `npm start` (port 5001)
   - Frontend: `npm run dev` (port 3001)
   - MongoDB: Running on default port 27017

3. **Navigate to Login**
   - URL: `http://localhost:3001/login`

4. **Login Credentials**
   - Email: `parent.victoria.chen0@tutormatch.com`
   - Password: `ParentPassword123!`

---

## Feature Testing Checklist

### 1. Authentication & Registration
- [ ] Login with parent account (parent.victoria.chen0@tutormatch.com / ParentPassword123!)
- [ ] Verify token is stored in localStorage
- [ ] Access protected routes (dashboard, profile, etc.)
- [ ] Logout and verify token is cleared
- [ ] Register new parent account
- [ ] Verify email validation works
- [ ] Verify password requirements (min 6 chars)
- [ ] Try duplicate email registration (should fail)

### 2. Tutor Search & Discovery
- [ ] Search page loads with list of tutors
- [ ] Verify 5000+ tutors are displayed
- [ ] Search by subject (Math, English, Science, etc.)
- [ ] Search by name
- [ ] Filter by rating (3+, 4+, 4.5+)
- [ ] Filter by hourly rate (price range)
- [ ] Filter by availability (days of week)
- [ ] Sorting: by rating, by price, by experience
- [ ] Pagination works correctly
- [ ] Tutor cards show:
  - Profile picture
  - Name and rating
  - Hourly rate
  - Specialties
  - Experience/hours taught
  - "View Profile" button

### 3. Tutor Profile
- [ ] Click tutor to view full profile
- [ ] Profile displays:
  - Tutor name, bio, rating
  - Headline and description
  - Qualifications/certifications
  - Specialties and grade levels
  - Languages spoken
  - Hourly rate
  - Availability schedule
  - Reviews section with 3-5 reviews
- [ ] Reviews show:
  - Review title and rating (1-5 stars)
  - Reviewer name
  - Review comment
  - Review date
- [ ] "Book Now" button is visible and clickable
- [ ] Average rating is calculated correctly from reviews

### 4. Booking Flow
- [ ] Click "Book Now" from tutor profile
- [ ] Booking form displays correctly
- [ ] Select subject (from tutor's specialties)
- [ ] Select session type (online/in-person)
- [ ] Pick date from calendar (future dates only)
- [ ] Select time slot
- [ ] Enter duration (0.5, 1, 1.5, 2 hours)
- [ ] Price is calculated: rate × duration
- [ ] Booking summary shows all details
- [ ] Submit booking → Success message
- [ ] Booking appears in parent dashboard

### 5. Parent Dashboard
- [ ] Dashboard loads and displays:
  - Upcoming bookings
  - Booking history
  - Reviews submitted
  - Saved tutors (favorites)
- [ ] View upcoming sessions with:
  - Tutor name and photo
  - Subject and time
  - Duration and total cost
  - Status (Confirmed, In Progress, Completed)
- [ ] Cancel booking (if not started)
- [ ] Leave review for completed bookings
- [ ] Message tutor directly

### 6. Reviews & Ratings
- [ ] View reviews on tutor profile
- [ ] Leave review for completed session:
  - Star rating (1-5)
  - Review title
  - Comment/review text
  - Submit and verify it appears
- [ ] Verify tutor's average rating updates
- [ ] Verify review count increases

### 7. Tutor Profile (Tutor View)
- [ ] Login as tutor: {firstname}.{lastname}{number}@tutormatch.com / TutorPassword123!
- [ ] Dashboard shows:
  - Pending bookings
  - Upcoming sessions
  - Completed sessions
  - Overall rating and review count
  - Total hours taught
  - Earnings/payments
- [ ] Edit profile:
  - Update headline, description
  - Update specialties
  - Update availability
  - Upload/change profile picture
- [ ] Respond to reviews
- [ ] Leave review for parent (after session)

### 8. Messaging System
- [ ] Parent can send message to tutor
- [ ] Tutor can receive and read message
- [ ] Tutor can reply to parent
- [ ] Messages appear in order (chronological)
- [ ] Unread message count displays
- [ ] Message threads display properly
- [ ] Can attach files/documents (optional)

### 9. Session Notes & Feedback
- [ ] After booking is marked "Completed"
- [ ] Tutor can submit session notes:
  - Topics covered
  - Student understanding level
  - Homework assigned
  - Homework due date
  - Parent action items
  - Red flags/concerns
  - Additional notes
- [ ] Notes are visible to parent
- [ ] Parent can see recommendations

### 10. Payment Integration (Stripe)
- [ ] Payment method selection during booking
- [ ] Credit card form displays securely
- [ ] Payment processed successfully
- [ ] Booking status changes to "confirmed"
- [ ] Confirmation email sent
- [ ] Payment receipt accessible
- [ ] Stripe webhook updates booking status

### 11. Admin Features (if applicable)
- [ ] Admin login with admin account
- [ ] View all users (parents & tutors)
- [ ] View all bookings and their status
- [ ] View disputes/flagged bookings
- [ ] Resolve disputes with action (refund/keep)
- [ ] Suspend user account
- [ ] Generate reports

### 12. UI/UX Quality Checks
- [ ] No console errors (F12 developer tools)
- [ ] Responsive design (test on mobile view)
- [ ] Forms have proper validation messages
- [ ] Loading states display (spinners, skeletons)
- [ ] Error messages are clear and helpful
- [ ] Navigation between pages works smoothly
- [ ] Images load correctly
- [ ] Buttons are clickable and responsive
- [ ] No broken links

### 13. Performance Checks
- [ ] Page loads complete within 3 seconds
- [ ] Search results load quickly (< 1 second)
- [ ] Pagination doesn't lag
- [ ] Large list of reviews loads smoothly
- [ ] No unnecessary API calls in console

### 14. Data Integrity
- [ ] Database seeded with correct data:
  - 5000 tutors with diverse ethnic names
  - 500 parent accounts
  - 1500 bookings marked as completed
  - 1500 reviews with realistic ratings
  - Average rating ~4.24 stars
- [ ] Tutor names reflect Singapore diversity:
  - Chinese names (Wei Wong, Ming Lee, etc.)
  - Malay names (Azhar Abdullah, Fatima Ahmad, etc.)
  - Indian names (Rajesh Kumar, Priya Singh, etc.)
  - Eurasian names (Stephen de Souza, Maria Fernandes, etc.)

---

## Sample Test Scenarios

### Scenario 1: Parent Books a Tutor
1. Login as parent
2. Search for Math tutors
3. Filter by 4+ rating
4. Click on tutor "Wei Wong"
5. View profile and reviews
6. Click "Book Now"
7. Select: Math, Online, Tomorrow 3 PM, 1 hour
8. Review total cost
9. Submit booking
10. Verify in dashboard

### Scenario 2: Tutor Reviews Booking
1. Login as tutor (wei.wong1234@tutormatch.com)
2. View dashboard with bookings
3. Find completed booking from parent
4. Submit session notes
5. Logout

### Scenario 3: Parent Leaves Review
1. Login as parent
2. Go to dashboard
3. Find completed booking
4. Click "Leave Review"
5. Give 5 stars and write comment
6. Submit review
7. Verify it appears on tutor profile

---

## Known Test Data

### Sample Tutors (from seeded data)
```
Name: Wei Wong
Email: wei.wong1234@tutormatch.com
Password: TutorPassword123!
Subjects: Math, Science
Hourly Rate: $45-65
Rating: 4.2+ stars

Name: Sarah Chen
Email: sarah.chen567@tutormatch.com
Password: TutorPassword123!
Subjects: English
Hourly Rate: $55-75
Rating: 4.5+ stars
```

### Sample Parents (from seeded data)
```
Email: parent.victoria.chen0@tutormatch.com
Password: ParentPassword123!

Email: parent.michael.lee1@tutormatch.com
Password: ParentPassword123!
```

---

## Troubleshooting

### Login Still Failing?
- Verify backend is running: `curl http://localhost:5001/api/health`
- Check MongoDB is connected: MongoDB logs should show "Connected"
- Verify seed data exists: Check MongoDB directly or in admin panel
- Clear browser cache and localStorage
- Check browser console for network errors

### Tutors Not Showing in Search?
- Verify seed ran successfully: `npm run seed:fresh`
- Check tutor count in database
- Verify backend search endpoint working: `/api/search/tutors`
- Check network tab in dev tools

### Bookings Not Saving?
- Check backend logs for errors
- Verify parent is authenticated
- Check MongoDB connection
- Verify Stripe keys are configured (if payment enabled)

---

## Success Criteria

✅ All authentication flows work (login, registration, logout)
✅ Can search and view 5000+ tutors
✅ Can view detailed tutor profiles with reviews
✅ Can create and pay for bookings
✅ Can leave reviews and ratings
✅ Tutor and parent dashboards function
✅ Messaging works between users
✅ All data displays correctly
✅ No console errors or warnings
✅ Responsive on desktop and mobile

Once all items are checked, the platform is ready for launch! 🚀

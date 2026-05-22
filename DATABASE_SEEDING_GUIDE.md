# 🌱 Tutor Match Database Seeding Guide

## Problem Solved
The platform had an empty database of tutors - a "chicken and egg" problem where parents couldn't book tutors because there were no tutors available. This guide provides the solution with 1000 authentic, diverse tutor profiles.

## What Gets Seeded

The seed script generates **1000 realistic tutor profiles** with:

### Per Tutor Profile
- ✅ Realistic name (diverse first/last names)
- ✅ Unique email address
- ✅ Professional headline
- ✅ Detailed description
- ✅ Teaching experience (1-20 years)
- ✅ Qualifications/certifications
- ✅ Hourly rate ($25-$95/hr)
- ✅ Specialties (Math, English, Science, Languages, etc.)
- ✅ Grade levels (Elementary, Middle School, High School, College)
- ✅ Languages spoken (English, Spanish, French, Mandarin, etc.)
- ✅ Student ratings (0-5 stars with review counts)
- ✅ Total hours taught (0-4990 hours)
- ✅ Availability (Mon-Sun, configurable)
- ✅ Response time
- ✅ Completed/cancelled bookings
- ✅ Active status

## Quick Start (3 Steps)

### Step 1: Make Sure MongoDB is Running
```bash
# In a separate terminal, start MongoDB
mkdir -p ~/mongodb/data
mongod --dbpath ~/mongodb/data --port 27017
```

You should see: `Waiting for connections on port 27017`

### Step 2: Start Backend (if not already running)
```bash
cd /Users/mco/Documents/Tuition
PORT=5001 npm run dev
```

### Step 3: Run the Seed Script
```bash
# In another terminal, run one of these:
npm run seed
# OR
npm run seed:1000
# OR
node seed-tutors.js
```

### Expected Output
```
🌱 Starting to seed 1000 tutors...
✓ Created 50/1000 tutors (5%)
✓ Created 100/1000 tutors (10%)
... [progress continues] ...
✓ Created 1000/1000 tutors (100%)

✅ Successfully seeded 1000 tutor profiles!

📊 Database Summary:
   - Total Tutor Users: 1000
   - Total Tutor Profiles: 1000

📝 Sample Tutor:
   - Name: James Smith
   - Email: james.smith4521@tutormatch.com
   - Rate: $45/hr
   - Specialties: Math, Science
   - Rating: 4.7 ⭐ (23 reviews)
```

## Testing the Seeded Data

### 1. Parent Registration & Login
```
Email: victoria.chen@example.com
Password: SecurePass123!
(Or create a new parent account)
```

### 2. Search for Tutors
1. Dashboard → Find Tutors
2. Try searching by:
   - Subject: "Math"
   - Subject: "English" 
   - Grade Level: "High School"
   - Max Rate: "$75"

### 3. Expected Results
You should now see **dozens of matching tutors** instead of 0 results!

## Behind the Scenes

### Seed Script Details (`seed-tutors.js`)
- **Generates**: 1000 unique tutor profiles
- **Creates**: User records with hashed passwords
- **Creates**: TutorProfile records with all attributes
- **Password**: All tutors have password `TutorPassword123!`
- **Batch Size**: Processes 50 tutors at a time (efficient)
- **Error Handling**: Continues if individual tutor creation fails

### Data Diversity
The seed script includes:
- **160+ unique first names** (culturally diverse)
- **60+ unique last names** (culturally diverse)
- **10 subject specialties** distributed across tutors
- **5 grade levels** with varied combinations
- **Rating distribution**: 0-5 stars (realistic variety)
- **Experience range**: 1-20 years
- **Hourly rates**: $25-$95 (realistic range)
- **Availability**: Varied day/time combinations

## Database Queries for Verification

### Check Total Tutors
```javascript
// In MongoDB
db.users.countDocuments({ role: 'tutor' })
// Should return: 1000
```

### View Sample Tutors
```javascript
db.tutorprofiles.find({}).limit(5)
```

### Search by Subject
```javascript
db.tutorprofiles.find({ specialties: 'Math' }).count()
// Should return: ~300-400 tutors
```

## Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:27017"
**Problem**: MongoDB is not running
**Solution**:
```bash
mkdir -p ~/mongodb/data
mongod --dbpath ~/mongodb/data --port 27017
```

### Error: "Email already exists"
**Problem**: Script ran twice and created duplicates
**Solution**:
```bash
# Clear tutors and start fresh
# In MongoDB:
db.users.deleteMany({ role: 'tutor' })
db.tutorprofiles.deleteMany({})

# Then re-run seed
npm run seed
```

### No tutors showing in search
**Problem**: Seed script ran but data wasn't indexed
**Solution**:
1. Check MongoDB is running: `mongosh`
2. Verify data: `db.tutorprofiles.count()`
3. Check backend is running: See port 5001 message
4. Restart backend and try search again

### Search still returns 0 results
**Problem**: Filter may be too restrictive
**Solution**: 
- Try searching with NO filters (leave Subject blank)
- Check Max Rate is high enough ($75+)
- Verify you're logged in as a parent

## Manual Tutor Registration Alternative

If seeding doesn't work, register tutors manually:
1. Go to http://localhost:3000
2. Click "Become a Tutor"
3. Fill registration form
4. Complete tutor profile setup
5. Repeat 1000 times 😅 (Not recommended!)

## Performance Notes

### Seeding Time
- **1000 tutors**: ~30-60 seconds (depends on system)
- **5000 tutors**: ~2-3 minutes
- **10000 tutors**: ~5-10 minutes

### Database Size
- **1000 tutors**: ~2-3 MB
- Minimal MongoDB resources needed

### Search Performance
- With 1000 tutors, search results return in <100ms
- Can easily scale to 10,000+ tutors

## Production Deployment

Before deploying to production:

1. **Modify Email Domain**:
   Edit `seed-tutors.js` line with tutormatch.com domain:
   ```javascript
   const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 10000)}@yourdomain.com`;
   ```

2. **Change Default Password**:
   Use a secure password in `generateTutorData()`:
   ```javascript
   const password = await bcrypt.hash('SECURE_PASSWORD_HERE', 10);
   ```

3. **Run Once**:
   The script includes a check to skip if tutors already exist:
   ```javascript
   if (existingCount >= count) {
     console.log(`Already has ${existingCount} tutors. Skipping...`);
   }
   ```

4. **Verify Search Works**:
   After seeding, test the search API:
   ```bash
   curl -X POST http://localhost:5001/api/search \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"specialty":"Math"}'
   ```

## Next Steps

Now that you have tutors in the database:

1. ✅ **Test Full Booking Workflow**
   - Parent searches for tutor
   - Parent creates booking
   - Tutor accepts booking
   - Messages flow between them
   - Payment processing

2. ✅ **Test Review System**
   - After booking completion
   - Parent leaves review and rating
   - Review appears on tutor profile

3. ✅ **Load Testing**
   - Search performance with filters
   - Concurrent bookings
   - Real-time messaging

4. ✅ **Feature Testing**
   - All 40+ API endpoints
   - Dashboard features
   - Notification system
   - Payment integration

## Support

If you need to:
- **Seed 5000 tutors**: Edit `seed-tutors.js`, change final parameter from 1000 to 5000
- **Use different data**: Modify the name, subject, or language arrays
- **Clear database**: Use MongoDB Compass or mongosh

## Summary

✅ **Problem**: Empty tutor database  
✅ **Solution**: `npm run seed`  
✅ **Result**: 1000 realistic tutors ready for testing  
✅ **Time**: ~1 minute to run  
✅ **Ready to test**: Full platform workflows!

---

**Created**: May 22, 2026  
**Version**: 1.0  
**Status**: Ready for Development & Testing

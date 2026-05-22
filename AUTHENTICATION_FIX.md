# Authentication Fix - Double Hashing Issue

## Problem Identified

The authentication system was failing because passwords were being **double-hashed**:

1. **Seed scripts** were pre-hashing passwords before saving to database:
   ```javascript
   const password = await bcrypt.hash('ParentPassword123!', 10);
   const user = new User({ password, ... });
   ```

2. **User model** was hashing again in the pre-save hook:
   ```javascript
   userSchema.pre('save', async function(next) {
     const salt = await bcrypt.genSalt(10);
     this.password = await bcrypt.hash(this.password, salt);
   });
   ```

**Result**: Stored password was a hash of a hash, causing `bcrypt.compare()` to fail during login.

## Solution Implemented

### 1. Fixed seed-reviews.js
```javascript
// Before (WRONG):
const password = await bcrypt.hash('ParentPassword123!', 10);

// After (CORRECT):
const password = 'ParentPassword123!';
```

### 2. Fixed seed-tutors.js
```javascript
// Before (WRONG):
const password = await bcrypt.hash('TutorPassword123!', 10);

// After (CORRECT):
const password = 'TutorPassword123!';
```

### 3. Fixed User.js pre-save hook
```javascript
// Before (had logic error - missing return statements):
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();  // Should return!
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Missing next() call!
});

// After (CORRECT):
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();  // Return to exit early
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();  // Call next after hashing
});
```

## How to Verify the Fix

### Option 1: Fresh Database (Recommended)
```bash
npm run seed:fresh
```
This command:
1. Clears all existing data (`npm run clear`)
2. Seeds 5000 tutors with correct password hashing
3. Seeds 500 parents and 1500 reviews

### Option 2: Individual Commands
```bash
# Clear existing data
npm run clear

# Seed tutors
npm run seed

# Seed reviews and parent accounts
npm run seed:reviews
```

## Testing Login Credentials

After running the seed commands, use these credentials:

**Parent Account:**
- Email: `parent.victoria.chen0@tutormatch.com`
- Password: `ParentPassword123!`

**Tutor Account:**
- Email: `{firstname}.{lastname}{random}@tutormatch.com` (any seeded tutor)
- Password: `TutorPassword123!`

Example: `wei.wong1234@tutormatch.com` / `TutorPassword123!`

## Files Modified

1. ✅ `seed-reviews.js` - Line 96: Changed to plain password
2. ✅ `seed-tutors.js` - Line 270: Changed to plain password
3. ✅ `models/User.js` - Lines 100-107: Fixed pre-save hook logic
4. ✅ `package.json` - Added `clear` and `seed:fresh` scripts
5. ✅ `clear-db.js` - New file to clear database collections

## Expected Output After Successful Seeding

```
✅ Connected to MongoDB
✓ Found 0 existing tutors
🌱 Starting to seed 5000 tutors...
✓ Created 5000/5000 tutors (100%)

✅ Successfully seeded 5000 tutor profiles!

📊 Database Summary:
   - Total Tutor Users: 5000
   - Total Tutor Profiles: 5000

🌱 Starting to seed reviews...
   - Creating 500 parent accounts
   - Creating 1500 bookings
   - Creating 1500 reviews

✓ Created 500 parent accounts
✓ Created 1500 bookings
✓ Created 1500 reviews

✅ Successfully seeded reviews!

📊 Database Summary:
   - Total Parent Users: 500
   - Total Completed Bookings: 1500
   - Total Reviews: 1500
   - Average Rating: 4.24 ⭐
```

## Next Steps

1. Run `npm run seed:fresh` to populate database with corrected seeds
2. Login with parent account credentials above
3. Test complete UI workflow: search, booking, reviews
4. All authentication endpoints should now work correctly

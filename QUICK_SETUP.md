# ⚡ Quick Setup - 1000 Tutor Profiles

## 🚀 Three Terminal Tabs

### Terminal 1: MongoDB
```bash
mkdir -p ~/mongodb/data
mongod --dbpath ~/mongodb/data --port 27017
```
✅ Wait for: `Waiting for connections on port 27017`

### Terminal 2: Backend
```bash
cd /Users/mco/Documents/Tuition
PORT=5001 npm run dev
```
✅ Wait for: `Server running on port 5001` + `MongoDB connected: localhost`

### Terminal 3: Seed Database
```bash
cd /Users/mco/Documents/Tuition
npm run seed
```
✅ Wait for: `Successfully seeded 1000 tutor profiles!`

---

## 🎯 Verify It Works

1. **Check Database**:
   ```bash
   mongosh
   > use tutor-match
   > db.users.countDocuments({ role: 'tutor' })
   # Should show: 1000
   ```

2. **Test Search API**:
   - Navigate to: http://localhost:3000
   - Login as parent: victoria.chen@example.com / SecurePass123!
   - Click "Find Tutors"
   - Search for "Math" with max rate "$75"
   - Should see: 20+ tutors with ratings, prices, specialties

3. **View Sample Tutor**:
   - First tutor in results
   - Should have realistic profile: James Anderson, $45/hr, Math & Science specialist, 4.7⭐

---

## 📊 Result

✅ 1000 authentic tutor profiles  
✅ All searchable by subject, grade, price  
✅ Ready for parent bookings  
✅ Realistic ratings & experience  
✅ Can now test full workflows

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED 27017` | MongoDB not running - run Terminal 1 first |
| `0 tutors found` | Seeds didn't run - check Terminal 3 for errors |
| Email unique constraint | Already seeded - clear: `db.users.deleteMany({ role: 'tutor' })` |
| Port 5001 already in use | `lsof -i :5001` then `kill -9 <PID>` |

---

## 📖 Full Guide

See **DATABASE_SEEDING_GUIDE.md** for:
- Detailed explanation
- Data structure details
- Production deployment
- Performance notes
- Advanced configuration

---

**Time to complete**: ~2 minutes  
**Ready for testing**: Immediately after seeding completes!

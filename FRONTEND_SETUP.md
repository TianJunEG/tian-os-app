# Tutor Match Frontend Setup

Complete React frontend for the Tutor Match platform with authentication, tutor search, booking, payments, messaging, and more.

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── TutorSearchPage.jsx
│   │   ├── BookingPage.jsx
│   │   ├── PaymentPage.jsx
│   │   ├── BookingsPage.jsx
│   │   ├── MessagesPage.jsx
│   │   └── TutorProfilePage.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Features

### 🔐 Authentication
- User registration (Student/Parent and Tutor roles)
- JWT-based login
- Protected routes
- Session persistence

### 🔍 Tutor Search
- Smart matching algorithm integration
- Filter by subject, grade, price
- View tutor profiles and ratings
- One-click booking

### 📅 Booking System
- Create bookings with date/time selection
- Choose session type (online/in-person)
- Session details (location, meeting link)
- Add notes for tutor

### 💳 Stripe Payment
- Secure payment processing
- Payment intent creation
- Webhook handling
- Receipt and confirmation

### 💬 Messaging
- Real-time conversations
- Message history
- Read status tracking
- Edit and delete messages

### ⭐ Reviews & Ratings
- Leave reviews after sessions
- 5-star rating system
- View tutor ratings and feedback

### 👨‍🏫 Tutor Management
- Complete profile setup
- Manage specialties and rates
- Set availability
- View and update qualifications

## Installation

### 1. Clone & Install

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create `.env` file in frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## Running the Full Stack

### Terminal 1 - Backend API
```bash
cd /path/to/Tuition
npm install
npm run dev
```
Backend runs on `http://localhost:5000`

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`

## Testing the Platform

### As a Parent
1. Go to `http://localhost:3000`
2. Click "Sign Up" and register as Student/Parent
3. Go to "Find Tutors"
4. Search and filter by subject/rate
5. Click "Book Now" on a tutor
6. Fill in booking details
7. Proceed to payment (use test card: 4242 4242 4242 4242)
8. View bookings and messages

### As a Tutor
1. Register as Tutor
2. Click "My Profile" to complete profile
3. Set hourly rate, specialties, grades
4. Approve booking requests
5. Message with students
6. Leave reviews after sessions

## Key Pages

| Page | Path | Role | Description |
|------|------|------|-------------|
| Landing | `/` | Public | Intro and signup options |
| Login | `/login` | Public | User login |
| Register | `/register` | Public | User registration |
| Dashboard | `/dashboard` | Protected | Main hub with quick actions |
| Search | `/search` | Parent | Find and browse tutors |
| Booking | `/booking/:tutorId` | Parent | Schedule a session |
| Payment | `/payment/:bookingId` | Parent | Pay for booking |
| Bookings | `/bookings` | Both | View all bookings |
| Messages | `/messages` | Both | Chat with users |
| Tutor Profile | `/tutor/profile` | Tutor | Manage tutor profile |

## API Integration

The frontend uses a centralized API service (`src/services/api.js`) that:
- Handles all backend requests
- Manages JWT tokens automatically
- Redirects to login on 401 errors
- Provides typed API endpoints

### Example Usage
```javascript
import { searchAPI, bookingsAPI } from './services/api';

// Search tutors
const response = await searchAPI.searchTutors({
  specialty: 'Math',
  grade: 'High School',
  maxRate: 75
});

// Create booking
const booking = await bookingsAPI.createBooking({
  tutorId: 'xxx',
  subject: 'Algebra',
  duration: 1.5,
  ...
});
```

## Authentication Flow

1. User registers/logs in
2. JWT token stored in localStorage
3. Token added to all API requests automatically
4. Token checked on component mount
5. Auto-logout on 401 response

## State Management

Uses React Context for:
- User authentication state
- Token storage
- User role detection
- Protected routes

## Styling

- **Tailwind CSS** for utility styles
- **Lucide React** for icons
- **Responsive design** - mobile, tablet, desktop
- **Purple/Blue gradient** theme matching landing page

## Stripe Integration

### Test Mode
- Use test card: `4242 4242 4242 4242`
- Any future expiry
- Any 3-digit CVC

### Production
Replace `STRIPE_PUBLIC_KEY` in Payment component with live key

## Common Issues

**"Cannot find module"**
- Run `npm install` to ensure all dependencies installed

**"API requests failing"**
- Check backend is running on port 5000
- Verify VITE_API_URL points to correct backend

**"Login not working"**
- Check browser console for JWT errors
- Verify backend is accessible

**"Tailwind styles not showing"**
- Restart dev server
- Check tailwind.config.js paths are correct

## Next Steps

1. ✅ Frontend is ready for testing
2. Run both backend and frontend
3. Test full user journeys
4. Deploy backend (Heroku, AWS, etc.)
5. Deploy frontend (Vercel, Netlify, etc.)

## Support

Refer to:
- Backend docs: `BACKEND_README.md`
- API reference: `API_REFERENCE.md`
- Vite docs: https://vitejs.dev
- React docs: https://react.dev
- Tailwind docs: https://tailwindcss.com

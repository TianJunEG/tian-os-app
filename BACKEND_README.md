# Tutor Match Backend API

A comprehensive Node.js/Express API for a Fiverr-style tutoring marketplace platform with user authentication, tutor profiles, smart matching algorithm, bookings, payments (Stripe), messaging, and reviews.

## Project Structure

```
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js              # User schema (parent, tutor, admin)
│   ├── TutorProfile.js      # Tutor profile details
│   ├── Booking.js           # Booking/session records
│   ├── Payment.js           # Payment transactions
│   ├── Message.js           # Messages and conversations
│   └── Review.js            # Reviews and ratings
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── tutors.js            # Tutor management
│   ├── search.js            # Search and matching
│   ├── bookings.js          # Booking management
│   ├── payments.js          # Payment processing
│   ├── messages.js          # Messaging system
│   └── reviews.js           # Reviews and ratings
├── middleware/
│   └── auth.js              # JWT authentication
├── server.js                # Main server file
├── package.json             # Dependencies
├── .env.example             # Environment variables template
└── BACKEND_README.md        # This file
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update with your values:
- MongoDB URI (local or Atlas)
- JWT secret key
- Stripe API keys
- Webhook secret

### 3. Run Server
```bash
npm run dev
```

Server runs on `http://localhost:5001` by default (or `PORT` if set)

## Core Features

### Authentication
- User registration (parent/tutor roles)
- JWT-based login
- Password hashing with bcrypt
- Profile management

### Tutor Profiles
- Complete profile with specialties, rates, availability
- Ratings and reviews
- Experience tracking
- Certification management

### Smart Matching Algorithm
Tutors scored on:
- Specialty match (40pts)
- Grade level (30pts)
- Rating (20pts)
- Price alignment (10pts)
- Availability (10pts)
- Response time & experience (bonus)

### Bookings System
- Create sessions with duration & scheduling
- Payment integration before confirmation
- Status tracking (pending → confirmed → completed)
- Bilateral ratings after completion

### Stripe Payments
- Payment intents for secure payments
- Webhook handling
- 10% platform fee
- 90% tutor payout

### Messaging
- Direct conversations between users
- Read status tracking
- Edit/delete messages
- Persistent conversation history

### Reviews & Ratings
- Bi-directional reviews
- 5-star rating system
- Helpful markers
- Auto-calculated average ratings

## Key Endpoints

**Auth:**
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- PUT `/api/auth/update-profile`

**Tutors:**
- POST `/api/tutors/profile` (create/update)
- GET `/api/tutors` (list with filters)
- GET `/api/tutors/:id` (profile view)

**Search:**
- POST `/api/search/tutors` (smart matching)
- GET `/api/search/recommendations`
- GET `/api/search/categories`

**Bookings:**
- POST `/api/bookings` (create)
- GET `/api/bookings` (list)
- PUT `/api/bookings/:id/confirm`
- PUT `/api/bookings/:id/complete`

**Payments:**
- POST `/api/payments/create-intent`
- POST `/api/payments/confirm`
- POST `/api/payments/webhook`

**Messages:**
- POST `/api/messages/conversations`
- GET `/api/messages/:conversationId`
- POST `/api/messages` (send)

**Reviews:**
- POST `/api/reviews`
- GET `/api/reviews/user/:userId`
- PUT `/api/reviews/:id`

## Architecture

**Tech Stack:**
- Node.js + Express - Server framework
- MongoDB + Mongoose - Database
- JWT - Authentication
- Stripe - Payments
- bcryptjs - Password hashing
- express-validator - Input validation

**Database Schema:**
- Users (parents, tutors, admins)
- Tutor Profiles (rates, specialties, ratings)
- Bookings (sessions with lifecycle)
- Payments (Stripe integration)
- Messages (conversations)
- Reviews (bi-directional ratings)

**Security:**
- Password hashing
- JWT tokens
- Input validation
- Role-based access control
- Webhook verification

## Development

The backend is production-ready but can be extended with:
- Socket.io for real-time features
- Email notifications
- Admin analytics dashboard
- File uploads for certificates
- Video streaming integration
- Advanced search filters
- Bulk operations

## Next: Frontend Integration

The React frontend will:
1. Call auth endpoints to register/login
2. Display tutor search results from matching algorithm
3. Handle Stripe payment flow
4. Show booking calendar and management
5. Implement messaging UI
6. Display reviews and ratings

All endpoints are RESTful JSON APIs ready for frontend integration.

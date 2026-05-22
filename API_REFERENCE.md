# Tutor Match API Reference

## Authentication Endpoints

### Register
```
POST /api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "parent" | "tutor"
}
Response: { token, user }
```

### Login
```
POST /api/auth/login
Body: { "email": "john@example.com", "password": "password123" }
Response: { token, user }
```

### Get Current User
```
GET /api/auth/me
Auth: Bearer <token>
Response: { user }
```

### Update Profile
```
PUT /api/auth/update-profile
Auth: Bearer <token>
Body: { "name", "bio", "phone", "location", "avatar" }
Response: { user }
```

---

## Tutor Endpoints

### Create/Update Tutor Profile
```
POST /api/tutors/profile
Auth: Bearer <token> (tutor only)
Body: {
  "headline": "Expert Math Tutor",
  "description": "...",
  "specialties": ["Math", "Test Prep"],
  "grades": ["High School", "College"],
  "hourlyRate": 50,
  "languages": ["English", "Spanish"],
  "experience": "10 years teaching math"
}
Response: { tutorProfile }
```

### Get All Tutors
```
GET /api/tutors?specialty=Math&grade=High School&maxRate=75
Response: { count, tutors[] }
```

### Get Tutor Profile
```
GET /api/tutors/:tutorId
Response: { tutorProfile }
```

### Update Availability
```
PUT /api/tutors/availability
Auth: Bearer <token> (tutor only)
Body: {
  "availability": {
    "monday": true,
    "tuesday": false,
    ...
    "timeSlots": [
      { "day": "monday", "startTime": "09:00", "endTime": "17:00" }
    ]
  }
}
Response: { tutorProfile }
```

---

## Search & Matching

### Smart Search Tutors
```
POST /api/search/tutors
Auth: Bearer <token>
Body: {
  "specialty": "Math",
  "grade": "High School",
  "maxRate": 75,
  "preferredDay": "monday",
  "limit": 20
}
Response: { 
  count,
  tutors[] with compatibilityScore { score, maxScore, percentage }
}
```

### Get Recommendations
```
GET /api/search/recommendations
Auth: Bearer <token>
Response: { count, tutors[] }
```

### Get Categories
```
GET /api/search/categories
Response: { categories[] }
```

---

## Booking Endpoints

### Create Booking
```
POST /api/bookings
Auth: Bearer <token> (parent only)
Body: {
  "tutorId": "...",
  "subject": "Algebra Homework Help",
  "duration": 1.5,
  "scheduledDate": "2026-05-25",
  "startTime": "14:00",
  "endTime": "15:30",
  "sessionType": "online" | "in-person",
  "notes": "Focus on quadratic equations",
  "meetingLink": "https://zoom.us/...",
  "location": "123 Main St"
}
Response: { booking }
```

### Get Bookings
```
GET /api/bookings?status=pending&role=parent
Auth: Bearer <token>
Response: { count, bookings[] }
```

### Get Booking Details
```
GET /api/bookings/:bookingId
Auth: Bearer <token>
Response: { booking }
```

### Confirm Booking
```
PUT /api/bookings/:bookingId/confirm
Auth: Bearer <token> (tutor only)
Response: { booking with status: "confirmed" }
```

### Complete Booking
```
PUT /api/bookings/:bookingId/complete
Auth: Bearer <token> (tutor only)
Response: { booking with status: "completed" }
```

### Cancel Booking
```
PUT /api/bookings/:bookingId/cancel
Auth: Bearer <token>
Body: { "cancellationReason": "..." }
Response: { booking with status: "cancelled" }
```

---

## Payment Endpoints

### Create Payment Intent
```
POST /api/payments/create-intent
Auth: Bearer <token> (parent only)
Body: { "bookingId": "..." }
Response: { clientSecret, paymentId, amount }
```

### Confirm Payment
```
POST /api/payments/confirm
Auth: Bearer <token>
Body: { 
  "paymentIntentId": "...",
  "bookingId": "..."
}
Response: { payment, message: "Payment successful..." }
```

### Get Payment Details
```
GET /api/payments/:bookingId
Auth: Bearer <token>
Response: { payment }
```

### Webhook (Stripe)
```
POST /api/payments/webhook
Headers: stripe-signature: <signature>
Body: Stripe event (raw)
Response: { received: true }
```

---

## Messaging Endpoints

### Create/Get Conversation
```
POST /api/messages/conversations
Auth: Bearer <token>
Body: { "recipientId": "..." }
Response: { conversation }
```

### Get All Conversations
```
GET /api/messages/conversations
Auth: Bearer <token>
Response: { conversations[] }
```

### Get Messages
```
GET /api/messages/:conversationId?limit=50&offset=0
Auth: Bearer <token>
Response: { count, messages[] }
```

### Send Message
```
POST /api/messages
Auth: Bearer <token>
Body: {
  "conversationId": "...",
  "recipientId": "...",
  "content": "Hello! Are you available tomorrow?"
}
Response: { message }
```

### Edit Message
```
PUT /api/messages/:messageId
Auth: Bearer <token>
Body: { "content": "Updated message" }
Response: { message }
```

### Delete Message
```
DELETE /api/messages/:messageId
Auth: Bearer <token>
Response: { message: "Message deleted" }
```

---

## Review Endpoints

### Create Review
```
POST /api/reviews
Auth: Bearer <token>
Body: {
  "bookingId": "...",
  "rating": 5,
  "title": "Great tutor!",
  "comment": "Very helpful and patient..."
}
Response: { review }
```

### Get User Reviews
```
GET /api/reviews/user/:userId?limit=10&offset=0
Response: { count, total, reviews[] }
```

### Get Review
```
GET /api/reviews/:reviewId
Response: { review }
```

### Update Review
```
PUT /api/reviews/:reviewId
Auth: Bearer <token>
Body: { "rating": 4, "comment": "..." }
Response: { review }
```

### Mark Helpful
```
POST /api/reviews/:reviewId/helpful
Auth: Bearer <token>
Response: { review with updated helpful count }
```

### Delete Review
```
DELETE /api/reviews/:reviewId
Auth: Bearer <token>
Response: { message: "Review deleted" }
```

---

## Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad request
- **401** - Not authenticated
- **403** - Not authorized
- **404** - Not found
- **500** - Server error

## Headers

All requests except webhooks need:
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

## Testing with curl

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"test123","role":"parent"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"test123"}'

# Get current user (replace TOKEN)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Search tutors (replace TOKEN)
curl -X POST http://localhost:5000/api/search/tutors \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"specialty":"Math","maxRate":75}'
```

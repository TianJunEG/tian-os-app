#!/bin/bash

# Tutor Match Database Seeding Script
# This script populates the database with 1000 authentic tutor profiles

echo "🌱 Tutor Match Database Seeding"
echo "================================"
echo ""

# Check if MongoDB is running
echo "📡 Checking MongoDB connection..."
if ! command -v mongosh &> /dev/null; then
    echo "⚠️  mongosh not found. Make sure MongoDB is installed and running."
    echo "   Start MongoDB with: mongod --dbpath ~/mongodb/data --port 27017"
    exit 1
fi

# Start seeding
echo "📚 Starting to seed 1000 tutor profiles..."
echo ""

node seed-tutors.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Seeding completed successfully!"
    echo ""
    echo "📊 Next Steps:"
    echo "   1. Keep MongoDB and backend running"
    echo "   2. Start frontend: cd frontend && npm run dev"
    echo "   3. Navigate to: http://localhost:3000"
    echo "   4. Login as parent and search for tutors"
    echo ""
else
    echo ""
    echo "❌ Seeding failed. Check the errors above."
    exit 1
fi

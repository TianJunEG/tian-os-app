#!/bin/bash

echo "🔧 Tutor Match Platform - Service Startup"
echo "=========================================="
echo ""

# Kill any existing processes on port 5000
echo "1️⃣  Cleaning up port 5000..."
lsof -ti:5000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1
# Double check with fuser
fuser -k 5000/tcp 2>/dev/null || true
sleep 1
echo "   ✓ Port 5000 cleared"
echo ""

# Kill any existing MongoDB processes
echo "2️⃣  Restarting MongoDB..."
pkill -9 mongod 2>/dev/null || true
sleep 2

# Create MongoDB data directory if it doesn't exist
mkdir -p ~/mongodb/data 2>/dev/null

# Start MongoDB in the background with explicit dbpath
echo "   Starting MongoDB with dbpath: ~/mongodb/data"
mongod --dbpath ~/mongodb/data --port 27017 > ~/mongodb/mongod.log 2>&1 &
MONGOD_PID=$!
sleep 3

# Check if MongoDB started successfully
if ps -p $MONGOD_PID > /dev/null; then
    echo "   ✓ MongoDB started on port 27017 (PID: $MONGOD_PID)"
else
    echo "   ✗ MongoDB failed to start. Check ~/mongodb/mongod.log"
    cat ~/mongodb/mongod.log | tail -20
    exit 1
fi
echo ""

# Verify port 5000 is really free
echo "3️⃣  Verifying port 5000 is free..."
if lsof -i :5000 2>/dev/null; then
    echo "   ✗ Port 5000 still in use! Killing again..."
    lsof -ti:5000 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 2
else
    echo "   ✓ Port 5000 is free"
fi
echo ""

# Navigate to Tuition folder and start backend
echo "4️⃣  Starting backend server on port 5000..."
cd /Users/mco/Documents/Tuition
npm run dev

#!/bin/bash

echo "🔍 TutorMatch Port Diagnostics"
echo "=============================="
echo ""

# Check port 5001 (Backend)
echo "1️⃣  Checking port 5001 (Backend)..."
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  Port 5001 is IN USE"
    echo "   Processes using port 5001:"
    lsof -i :5001
    echo ""
    echo "   ☞ To kill: sudo lsof -ti :5001 | xargs kill -9"
else
    echo "   ✅ Port 5001 is FREE"
fi

echo ""

# Check port 3000 (Frontend)
echo "2️⃣  Checking port 3000 (Frontend)..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  Port 3000 is IN USE"
    echo "   Processes using port 3000:"
    lsof -i :3000
    echo ""
    echo "   ☞ To kill: sudo lsof -ti :3000 | xargs kill -9"
else
    echo "   ✅ Port 3000 is FREE"
fi

echo ""

# Check port 27017 (MongoDB)
echo "3️⃣  Checking port 27017 (MongoDB)..."
if lsof -Pi :27017 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  Port 27017 is IN USE"
    echo "   Processes using port 27017:"
    lsof -i :27017
    echo ""
    echo "   ☞ To kill: sudo lsof -ti :27017 | xargs kill -9"
else
    echo "   ✅ Port 27017 is FREE"
fi

echo ""
echo "=============================="
echo "Summary:"
echo "=============================="
echo "If all ports show ✅, you're ready to start services."
echo "If any show ⚠️, use the commands above to kill the processes."
echo ""
echo "Then run:"
echo "  Terminal 1: npm run db"
echo "  Terminal 2: npm run server"
echo "  Terminal 3: npm run client"

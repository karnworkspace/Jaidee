#!/bin/bash

echo "🎯 กำลังรันทั้ง Frontend และ Backend..."
echo ""

# รัน backend ใน background
echo "🔧 เริ่มรัน Backend..."
cd server
npm start &
BACKEND_PID=$!

# รอสักครู่แล้วรัน frontend
sleep 3
echo "🚀 เริ่มรัน Frontend..."
cd ../client
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ ระบบกำลังรัน..."
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "กด Ctrl+C เพื่อหยุดการทำงาน"

# รอให้ผู้ใช้กด Ctrl+C
trap "echo '🛑 กำลังหยุดระบบ...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait


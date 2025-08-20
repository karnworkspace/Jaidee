🚀 วิธี Run Backend และ Frontend

  ขั้นตอนที่ 1: เปิด Terminal 2 หน้าต่าง

  Terminal หน้าต่างที่ 1 (Backend):
  cd "/Users/nk-lamy/Desktop/GeminiCLI/jaidee/Jaidee/server"
  node index.js

  Terminal หน้าต่างที่ 2 (Frontend):
  cd "/Users/nk-lamy/Desktop/GeminiCLI/jaidee/Jaidee/client"
  npm start

  ขั้นตอนที่ 2: ตรวจสอบการทำงาน

  Backend ควรแสดง:
  Server listening at http://localhost:3001
  Credit Bureau fields migration completed
  Database initialized successfully

  Frontend ควรแสดง:
  Starting the development server...
  Compiled successfully!

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

  ขั้นตอนที่ 3: เข้าใช้งาน

  1. หน้าแรก: http://localhost:3000
  2. Admin Panel: http://localhost:3000/admin/banks

  🔧 คำสั่งเสริม:

  หยุด Server:
  # กด Ctrl+C ใน Terminal ที่ run อยู่

  ตรวจสอบ Backend API:
  curl http://localhost:3001/api/bank-rules

  ดู Port ที่ใช้งาน:
  lsof -i :3000  # Frontend
  lsof -i :3001  # Backend

  📱 URL สำคัญ:

  - Dashboard: http://localhost:3000
  - เพิ่มลูกค้า: http://localhost:3000/add-customer
  - Admin Panel: http://localhost:3000/admin/banks
  - API: http://localhost:3001/api/*
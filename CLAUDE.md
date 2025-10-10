# Claude Project Memory

## บทบาท (Role)
- Expert Full Stack Developer

## เป้าหมาย (Goal)
- ช่วยพัฒนาแอปพลิเคชันสำหรับการวิเคราะห์และทำรายงานสินเชื่ออย่างละเอียดในองค์กรอสังหาริมทรัพย์

## ภาษา (Language)
- ใช้ภาษาไทยในการสื่อสาร

## ขั้นตอนการทำงาน (Workflow)
- ก่อนดำเนินการแก้ไขโค้ดใดๆ จะต้องแจ้งให้ผู้ใช้ทราบก่อนเสมอว่าจะแก้ไขอะไร และขออนุญาตเพื่อดำเนินการ

## โครงสร้างโปรเจค (Project Structure)
- Client: React frontend application
- Server: Node.js backend API
- Docker: Containerized deployment configuration

## คำสั่งสำคัญ (Important Commands)
```bash
# Frontend (Client)
cd client
npm install
npm start

# Backend (Server)
cd server
npm install
npm start

# Docker
docker-compose up -d
```

## หมายเหตุสำคัญ (Important Notes)
- โปรเจคนี้เป็นแอปพลิเคชันสำหรับวิเคราะห์และรายงานสินเชื่อ
- ใช้ Docker สำหรับการ deploy
- มี frontend และ backend แยกกัน

## สถานะล่าสุด (Latest Status)

### 📅 **Update: 10 ตุลาคม 2025**

#### 🔍 ตรวจสอบและแก้ไข Code ใน Docker

**ปัญหาที่พบ:**
1. User restore version กลับไป ทำให้โค้ดไม่ตรงกับเอกสาร CLAUDE.md
2. Login endpoint ใช้ `user.password` แทน `user.password_hash` (Bug)

**การแก้ไข:**
1. **แก้ไข Login Bug** ✅
   - ไฟล์: `server/index.js:1444`
   - เปลี่ยนจาก: `comparePassword(password, user.password)`
   - เป็น: `comparePassword(password, user.password_hash)`
   - Rebuild Docker image และทดสอบสำเร็จ

2. **ทดสอบระบบ Loan Problems & Action Plans** ✅
   - สร้าง test script: `test-add-customer.sh`
   - ทดสอบเพิ่มลูกค้าใหม่พร้อม:
     - 3 Loan Problems: "ปัญหาหนี้สูง", "รายได้ไม่พอ", "ไม่มีหลักประกัน"
     - 3 Action Plans: "ลดหนี้", "เพิ่มรายได้", "หาผู้ค้ำประกัน"
   - ✅ POST /api/customers - บันทึกสำเร็จ
   - ✅ GET /api/customers/:id - ดึงข้อมูลสำเร็จ
   - ✅ Database (loan_problems, action_plans) - บันทึกถูกต้อง

**ผลการทดสอบ:**
- ✅ Login ระบบทำงานถูกต้อง
- ✅ Loan Problems บันทึกและแสดงผลครบถ้วน
- ✅ Action Plans บันทึกและแสดงผลครบถ้วน
- ✅ API Response มี structure ถูกต้อง

---

### ✅ งานที่เสร็จแล้ว (Completed)

#### 1. MySQL Database Setup
- Database: `jaidee_db`
- User: `jaidee_user`
- Password: `jaidee123`
- Tables: customers, loan_problems, action_plans, bank_rules, reports, users

#### 2. Loan Problems & Action Plans System
- **server/database.js**
  - มีการ filter undefined/null/empty string ถูกต้อง (บรรทัด 229-230, 243-244, 315-330)
  - Function `insertCustomerWithDetails()` ทำงานถูกต้อง
  - Function `updateCustomerWithDetails()` ทำงานถูกต้อง
  - Function `getCustomerWithDetails()` ดึงข้อมูล loanProblems และ actionPlans ครบถ้วน

- **server/index.js**
  - POST /api/customers - ส่ง loanProblem และ actionPlan parameters ถูกต้อง (บรรทัด 1667-1671)
  - PUT /api/customers/:id - ส่ง loanProblem และ actionPlan parameters ถูกต้อง (บรรทัด 1773-1778)

#### 3. Authentication System
- Login endpoint แก้ไขแล้ว ใช้ `password_hash` ถูกต้อง
- JWT Token generation ทำงานปกติ
- User roles: admin, data_entry, data_user

## 📊 KPI Calculation Logic

### 1. **Potential Score (คะแนนศักยภาพ)**
คำนวณจากความสามารถในการปรับปรุงสถานะทางการเงิน:

```javascript
Potential Score = (actionPlanProgress × 0.5) + (dsrScore × 0.5)
```

**DSR Score** คำนวณจาก DSR (Debt Service Ratio):
- DSR < 40% → **100 คะแนน** (สถานะ: ดีเยี่ยม)
- DSR 40-60% → **75 คะแนน** (สถานะ: เฝ้าระวัง)
- DSR > 60% → **50 คะแนน** (สถานะ: ต้องปรับปรุง)

**สูตร DSR:**
```
DSR = (หนี้ปัจจุบัน / รายได้) × 100
```

---

## 📋 To-Do List ต่อไป

### 🔴 Priority 1: Security & Environment (สำคัญมาก!)
- [ ] **แก้ไข hardcoded secrets** ใน production
  - `server/auth.js:5` - JWT_SECRET → ใช้ environment variable
  - `server/index.js:59` - session secret → ใช้ environment variable
  - `server/auth.js:128,140,151` - เปลี่ยน default passwords
- [ ] สร้างไฟล์ `.env.example` สำหรับ server
- [ ] ตรวจสอบและอัพเดท Docker environment variables ใน `docker-compose.mysql.yml`

### 🟡 Priority 2: Testing & Bug Fixes
- [ ] ทดสอบการแก้ไขลูกค้า (PUT endpoint) พร้อม Loan Problems
- [ ] ทดสอบการลบ Loan Problems / Action Plans
- [ ] ทดสอบ edge cases (empty arrays, null values, etc.)
- [ ] แก้ MySQL configuration warnings (acquireTimeout, timeout, reconnect)
- [ ] แก้ Session Store warning (ควรใช้ Redis แทน MemoryStore)

### 🟢 Priority 3: Database & Performance
- [ ] Review และ optimize MySQL queries
- [ ] ตั้งค่า database indexes ให้เหมาะสม
- [ ] Backup strategy สำหรับ production database

### 🔵 Priority 4: Features & Improvements
- [ ] เพิ่ม error handling และ logging ที่ดีขึ้น
- [ ] Documentation สำหรับ API endpoints
- [ ] เพิ่ม validation สำหรับ input data

---

## 🛠️ Tools & Scripts

### test-add-customer.sh
Script สำหรับทดสอบการเพิ่มลูกค้าใหม่พร้อม Loan Problems และ Action Plans

```bash
./test-add-customer.sh
```

### Docker Commands
```bash
# Start with MySQL
docker-compose -f docker-compose.mysql.yml up -d

# Rebuild backend after code changes
docker-compose -f docker-compose.mysql.yml build backend
docker-compose -f docker-compose.mysql.yml up -d backend

# View logs
docker logs jaidee-backend --tail 50

# Access phpMyAdmin
http://localhost:8080
```

---

## 📌 Known Issues

### MySQL2 Warnings (ไม่ร้ายแรง)
```
Ignoring invalid configuration option passed to Connection: acquireTimeout
Ignoring invalid configuration option passed to Connection: timeout
Ignoring invalid configuration option passed to Connection: reconnect
```
**แก้ไข:** ควรลบ options เหล่านี้ออกจาก `database.js` หรือใช้เฉพาะใน Pool config

### Session Store Warning
```
Warning: connect.session() MemoryStore is not designed for a production environment
```
**แก้ไข:** ควรใช้ Redis-based session store สำหรับ production

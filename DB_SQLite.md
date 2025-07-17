# 📊 คู่มือการใช้งาน SQLite Database - โปรเจค Jaidee

## 🎯 ภาพรวมของระบบ Database

โปรเจค Jaidee ใช้ **SQLite** เป็นฐานข้อมูลหลัก โดยเก็บข้อมูลในไฟล์ `jaidee.sqlite` ที่โฟลเดอร์ `server/`

### 📁 โครงสร้างไฟล์
```
Jaidee/
├── server/
│   ├── jaidee.sqlite      ← ไฟล์ Database
│   ├── database.js        ← Database connection & functions
│   ├── index.js           ← API endpoints
│   └── package.json
└── client/
```

## 🗄️ โครงสร้าง Database

### 1. ตาราง `customers` (ข้อมูลลูกค้าหลัก)
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  phone TEXT,
  job TEXT,
  position TEXT,
  businessOwnerType TEXT DEFAULT 'ไม่ใช่เจ้าของธุรกิจ',
  privateBusinessType TEXT,
  projectName TEXT,
  unit TEXT,
  readyToTransfer TEXT,
  propertyValue REAL,
  -- ... ฟิลด์อื่นๆ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. ตาราง `loan_problems` (ปัญหาสินเชื่อ)
```sql
CREATE TABLE loan_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  problem TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
);
```

### 3. ตาราง `action_plans` (แผนการดำเนินการ)
```sql
CREATE TABLE action_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  plan TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
);
```

## 🔧 เครื่องมือในการจัดการ Database

### 1. DB Browser for SQLite (GUI - แนะนำ)

#### การติดตั้ง:
```bash
brew install --cask db-browser-for-sqlite
```

#### การใช้งาน:
1. **เปิดแอป:** หา "DB Browser for SQLite" ใน Applications
2. **เปิด Database:** File → Open Database → เลือก `jaidee.sqlite`
3. **ดูข้อมูล:** แท็บ "Browse Data" → เลือกตาราง

#### แท็บสำคัญ:
- **Database Structure:** ดูโครงสร้างตาราง
- **Browse Data:** ดู/แก้ไขข้อมูล
- **Execute SQL:** รันคำสั่ง SQL
- **DB Schema:** ดูคำสั่ง CREATE TABLE

### 2. Terminal/Command Line

#### เปิด SQLite CLI:
```bash
cd /Users/nk-lamy/Desktop/GeminiCLI/jaidee/Jaidee/server
sqlite3 jaidee.sqlite
```

#### คำสั่งพื้นฐาน:
```sql
-- ดูตารางทั้งหมด
.tables

-- ดูโครงสร้างตาราง
.schema customers

-- ดูข้อมูลลูกค้าทั้งหมด
SELECT * FROM customers;

-- ดูข้อมูลลูกค้าล่าสุด 5 คน
SELECT name, phone, projectName FROM customers ORDER BY created_at DESC LIMIT 5;

-- ออกจากโปรแกรม
.quit
```

## 📊 คำสั่ง SQL ที่ใช้บ่อย

### การดูข้อมูล (SELECT)

```sql
-- ดูลูกค้าทั้งหมด
SELECT * FROM customers;

-- ดูลูกค้าพร้อมปัญหาสินเชื่อ
SELECT c.name, c.phone, lp.problem 
FROM customers c 
LEFT JOIN loan_problems lp ON c.id = lp.customer_id;

-- ดูลูกค้าที่มีปัญหาสินเชื่อ
SELECT c.name, COUNT(lp.id) as problem_count 
FROM customers c 
LEFT JOIN loan_problems lp ON c.id = lp.customer_id 
GROUP BY c.id 
HAVING problem_count > 0;

-- ค้นหาลูกค้าตามชื่อ
SELECT * FROM customers WHERE name LIKE '%นาย%';

-- ค้นหาตามโครงการ
SELECT * FROM customers WHERE projectName = 'เสนา เฟส 1';

-- ดูลูกค้าที่สร้างวันนี้
SELECT * FROM customers WHERE DATE(created_at) = DATE('now');
```

### การอัปเดตข้อมูล (UPDATE)

```sql
-- อัปเดตเบอร์โทรลูกค้า
UPDATE customers 
SET phone = '081-234-5678', updated_at = CURRENT_TIMESTAMP 
WHERE id = 1;

-- อัปเดตสถานะการเงิน
UPDATE customers 
SET financialStatus = 'ปรับปรุงแล้ว' 
WHERE id = 1;
```

### การลบข้อมูล (DELETE)

```sql
-- ลบลูกค้า (จะลบข้อมูลที่เกี่ยวข้องใน loan_problems และ action_plans อัตโนมัติ)
DELETE FROM customers WHERE id = 1;

-- ลบปัญหาสินเชื่อเฉพาะ
DELETE FROM loan_problems WHERE id = 1;
```

## 🛠️ การบำรุงรักษา Database

### สำรองข้อมูล (Backup)
```bash
# คัดลอกไฟล์ database
cp jaidee.sqlite jaidee_backup_$(date +%Y%m%d).sqlite

# หรือ Export เป็น SQL
sqlite3 jaidee.sqlite .dump > jaidee_backup_$(date +%Y%m%d).sql
```

### กู้คืนข้อมูล (Restore)
```bash
# กู้คืนจากไฟล์ backup
cp jaidee_backup_20240715.sqlite jaidee.sqlite

# หรือกู้คืนจาก SQL file
sqlite3 jaidee_new.sqlite < jaidee_backup_20240715.sql
```

### ตรวจสอบความสมบูรณ์
```sql
-- ตรวจสอบ Database integrity
PRAGMA integrity_check;

-- ดูขนาดของ Database
.databases

-- ดูสถิติตาราง
ANALYZE;
```

## 📈 การติดตามประสิทธิภาพ

### คำสั่งสำหรับสถิติ

```sql
-- จำนวนลูกค้าทั้งหมด
SELECT COUNT(*) as total_customers FROM customers;

-- ลูกค้าแยกตามสถานะการเงิน
SELECT financialStatus, COUNT(*) as count 
FROM customers 
GROUP BY financialStatus;

-- ลูกค้าที่มีปัญหาสินเชื่อ
SELECT 
  c.name,
  COUNT(lp.id) as problem_count,
  COUNT(ap.id) as action_plan_count
FROM customers c
LEFT JOIN loan_problems lp ON c.id = lp.customer_id
LEFT JOIN action_plans ap ON c.id = ap.customer_id
GROUP BY c.id;

-- ข้อมูลลูกค้าใหม่ในแต่ละเดือน
SELECT 
  strftime('%Y-%m', created_at) as month,
  COUNT(*) as new_customers
FROM customers
GROUP BY month
ORDER BY month DESC;
```

## ⚠️ ข้อควรระวัง

### 1. การแก้ไขข้อมูลผ่าน DB Browser
- ข้อมูลที่แก้ไขโดยตรงจะไม่ผ่าน business logic
- ไม่มีการคำนวณ KPIs และ loan estimation ใหม่
- ควรใช้เป็นเครื่องมือดูข้อมูล มากกว่าแก้ไข

### 2. การลบข้อมูล
- การลบลูกค้าจะลบข้อมูลที่เกี่ยวข้องทั้งหมด
- ไม่สามารถกู้คืนได้ ควรสำรองข้อมูลก่อน

### 3. การสำรองข้อมูล
- ควรสำรองข้อมูลเป็นประจำ
- ไฟล์ `jaidee.sqlite` เป็นไฟล์เดียวที่เก็บข้อมูลทั้งหมด

## 🔒 การรักษาความปลอดภัย

### ปฏิบัติที่ดี:
- ไม่แชร์ไฟล์ `jaidee.sqlite` ออกนอกทีม
- สำรองข้อมูลเป็นประจำ
- ใช้ Git ignore สำหรับไฟล์ database

### ไฟล์ .gitignore:
```
# Database files
*.sqlite
*.db
```

## 🚀 การพัฒนาต่อ

### เมื่อต้องการเพิ่มฟิลด์ใหม่:
1. แก้ไขไฟล์ `database.js` → function `initializeDatabase()`
2. เพิ่มฟิลด์ใน table schema
3. Restart server เพื่อใช้ schema ใหม่

### เมื่อต้องการเพิ่มตารางใหม่:
1. เพิ่ม CREATE TABLE statement ใน `initializeDatabase()`
2. สร้าง helper functions สำหรับ CRUD operations
3. อัปเดต API endpoints ใน `index.js`

## 📞 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:

#### 1. ไฟล์ Database หาย
```bash
# ตรวจสอบว่าไฟล์อยู่ไหน
ls -la /Users/nk-lamy/Desktop/GeminiCLI/jaidee/Jaidee/server/*.sqlite

# ถ้าหาย ให้ restart server เพื่อสร้างใหม่
cd /Users/nk-lamy/Desktop/GeminiCLI/jaidee/Jaidee/server
node index.js
```

#### 2. Database locked
```bash
# ปิดแอปพลิเคชันทั้งหมดที่เปิดไฟล์ database
# หรือ restart server
```

#### 3. ข้อมูลไม่อัปเดต
```bash
# ตรวจสอบว่า server รันอยู่
ps aux | grep node

# Restart server
cd /Users/nk-lamy/Desktop/GeminiCLI/jaidee/Jaidee/server
node index.js
```

---

## 📚 แหล่งข้อมูลเพิ่มเติม

- [SQLite Official Documentation](https://sqlite.org/docs.html)
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [SQL Tutorial](https://www.w3schools.com/sql/)

---

**สร้างโดย:** Technology Team - Sena Development  
**วันที่อัปเดต:** 15 กรกฎาคม 2567  
**เวอร์ชัน:** 1.0
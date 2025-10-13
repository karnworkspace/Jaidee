# Jaidee Database Schema Documentation

**Database:** `jaidee_db`
**Database Type:** MySQL 8.0
**Character Set:** utf8mb4
**Generated:** October 13, 2025

---

## 📊 Database Overview

| Table | Records | Description |
|-------|---------|-------------|
| `customers` | 686 | ข้อมูลลูกค้าและรายละเอียดสินเชื่อ |
| `loan_problems` | 2,563 | ปัญหาสินเชื่อของลูกค้า |
| `action_plans` | 877 | แผนการแก้ไขปัญหาสินเชื่อ |
| `bank_rules` | 12 | กฎเกณฑ์และเงื่อนไขของธนาคาร |
| `reports` | 0 | รายงานการวิเคราะห์สินเชื่อ |
| `users` | 3 | ผู้ใช้งานระบบ |

---

## 📋 Table Schemas

### 1. `customers` - ข้อมูลลูกค้า

**Primary Key:** `id`
**Indexes:**
- `idx_date` on `date`
- `idx_name` on `name`

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | รหัสลูกค้า (PK) |
| `date` | DATE | NO | - | วันที่บันทึกข้อมูล |
| `name` | VARCHAR(255) | NO | - | ชื่อ-นามสกุล |
| `age` | INT | YES | NULL | อายุ |
| `phone` | VARCHAR(50) | YES | NULL | เบอร์โทร |
| `job` | VARCHAR(255) | YES | NULL | อาชีพ |
| `position` | VARCHAR(255) | YES | NULL | ตำแหน่ง |
| `businessOwnerType` | VARCHAR(100) | YES | 'ไม่ใช่เจ้าของธุรกิจ' | ประเภทเจ้าของธุรกิจ |
| `privateBusinessType` | VARCHAR(255) | YES | NULL | ประเภทธุรกิจส่วนตัว |
| `projectName` | VARCHAR(255) | YES | NULL | ชื่อโครงการ |
| `unit` | VARCHAR(100) | YES | NULL | เลขห้อง/ยูนิต |
| `readyToTransfer` | VARCHAR(50) | YES | NULL | ช่วงเวลาที่พร้อมโอน |
| `propertyValue` | DECIMAL(15,2) | YES | NULL | มูลค่าทรัพย์ (หลังหักส่วนลด) |
| `rentToOwnValue` | DECIMAL(15,2) | YES | NULL | มูลค่าเช่าออม |
| `monthlyRentToOwnRate` | DECIMAL(15,2) | YES | NULL | อัตราเช่าออมรายเดือน |
| `propertyPrice` | DECIMAL(15,2) | YES | NULL | มูลค่าทรัพย์เต็มจำนวน |
| `discount` | DECIMAL(15,2) | YES | 0.00 | ส่วนลด (บาท) |
| `installmentMonths` | INT | YES | 12 | จำนวนงวด (เดือน) |
| `overpaidRent` | DECIMAL(15,2) | YES | 0.00 | ค่าเช่าที่ชำระเกิน |
| `rentRatePerMillion` | DECIMAL(15,2) | YES | 4100.00 | อัตราค่าเช่าต่อล้าน |
| `guaranteeMultiplier` | DECIMAL(5,2) | YES | 2.00 | ตัวคูณค่าประกัน |
| `prepaidRentMultiplier` | DECIMAL(5,2) | YES | 1.00 | ตัวคูณค่าเช่าล่วงหน้า |
| `transferYear` | INT | YES | 1 | ปีที่โอน |
| `annualInterestRate` | DECIMAL(5,2) | YES | 1.80 | อัตราดอกเบี้ยต่อปี (%) |
| `income` | DECIMAL(15,2) | YES | NULL | รายได้ (บาท/เดือน) |
| `debt` | DECIMAL(15,2) | YES | NULL | ภาระหนี้ (บาท/เดือน) |
| `maxDebtAllowed` | DECIMAL(15,2) | YES | NULL | ภาระหนี้สูงสุดที่อนุญาต |
| `loanTerm` | DECIMAL(5,2) | YES | NULL | ระยะเวลาผ่อน (ปี) |
| `ltv` | DECIMAL(5,2) | YES | NULL | LTV (%) |
| `ltvNote` | TEXT | YES | NULL | หมายเหตุ LTV |
| `maxLoanAmount` | DECIMAL(15,2) | YES | NULL | วงเงินกู้สูงสุด |
| `targetDate` | DATE | YES | NULL | เป้าหมายยื่นกู้ |
| `officer` | VARCHAR(255) | YES | 'นายพิชญ์ สุดทัน' | ผู้วิเคราะห์ CAA |
| `selectedBank` | VARCHAR(255) | YES | NULL | ธนาคารที่ลูกค้าควรเลือก |
| `targetBank` | VARCHAR(255) | YES | NULL | ธนาคารเป้าหมาย |
| `recommendedLoanTerm` | DECIMAL(5,2) | YES | NULL | ระยะเวลาผ่อนที่แนะนำ (ปี) |
| `recommendedInstallment` | DECIMAL(15,2) | YES | NULL | อัตราผ่อนที่แนะนำ (บาท/เดือน) |
| `potentialScore` | DECIMAL(5,2) | YES | NULL | คะแนนศักยภาพ |
| `degreeOfOwnership` | DECIMAL(5,2) | YES | NULL | ระดับความเป็นเจ้าของ |
| `financialStatus` | VARCHAR(100) | YES | NULL | สถานะทางการเงิน |
| `actionPlanProgress` | DECIMAL(5,2) | YES | NULL | ความคืบหน้าแผนปฏิบัติการ (%) |
| `paymentHistory` | TEXT | YES | NULL | ประวัติการชำระเงิน (JSON) |
| `accountStatuses` | TEXT | YES | NULL | สถานะบัญชี (JSON) |
| `livnexCompleted` | TINYINT(1) | YES | 0 | เสร็จสิ้นการใช้บริการ Livnex |
| `creditScore` | DECIMAL(5,2) | YES | NULL | คะแนนเครดิต |
| `creditNotes` | TEXT | YES | NULL | หมายเหตุเครดิต |
| `created_at` | TIMESTAMP | YES | CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| `updated_at` | TIMESTAMP | YES | CURRENT_TIMESTAMP | วันที่อัปเดตล่าสุด |

---

### 2. `loan_problems` - ปัญหาสินเชื่อ

**Primary Key:** `id`
**Foreign Key:** `customer_id` → `customers(id)` ON DELETE CASCADE

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | รหัสปัญหา (PK) |
| `customer_id` | INT | YES | NULL | รหัสลูกค้า (FK) |
| `problem` | TEXT | NO | - | รายละเอียดปัญหา |
| `created_at` | TIMESTAMP | YES | CURRENT_TIMESTAMP | วันที่บันทึก |

**Example Problems:**
- "ยังไม่มีประสงค์ขึ้นข้อมูลเข้อเพื่อที่อยู่อาศัยกับธนาคาร"
- "เอกสาร/ข้อมูลประกอบการพิจารณาไม่สมบูรณ์"
- "ต้องการใช้บริการ Livnex"

---

### 3. `action_plans` - แผนแก้ไขปัญหา

**Primary Key:** `id`
**Foreign Key:** `customer_id` → `customers(id)` ON DELETE CASCADE

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | รหัสแผน (PK) |
| `customer_id` | INT | YES | NULL | รหัสลูกค้า (FK) |
| `plan` | TEXT | NO | - | รายละเอียดแผน |
| `created_at` | TIMESTAMP | YES | CURRENT_TIMESTAMP | วันที่บันทึก |

**Example Plans:**
- "รอเอามาเขียวขาดจากบริษัท Livnex ก่อน"
- "ผู้เช่าออมเป็นพ่าวขาด"
- "ภาระหนี้สูง(ต้องลด)"

---

### 4. `bank_rules` - กฎเกณฑ์ธนาคาร

**Primary Key:** `id`
**Unique Key:** `bank_code`

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | รหัสกฎ (PK) |
| `bank_code` | VARCHAR(50) | NO | - | รหัสธนาคาร (UNIQUE) |
| `bank_name` | VARCHAR(255) | NO | - | ชื่อธนาคาร |
| `criteria` | TEXT | YES | NULL | เกณฑ์การพิจารณา |
| `dsr_high` | DECIMAL(5,2) | YES | NULL | DSR สูงสุด (%) |
| `dsr_low` | DECIMAL(5,2) | YES | NULL | DSR ต่ำสุด (%) |
| `min_income_for_dsr_high` | INT | YES | NULL | รายได้ขั้นต่ำสำหรับ DSR สูง |
| `age_min` | INT | YES | NULL | อายุขั้นต่ำ |
| `age_max` | INT | YES | NULL | อายุสูงสุด |
| `max_term` | INT | YES | NULL | ระยะเวลากู้สูงสุด (ปี) |
| `ltv_type1` | DECIMAL(5,2) | YES | NULL | LTV ประเภท 1 |
| `ltv_type2_over_2years` | DECIMAL(5,2) | YES | NULL | LTV ประเภท 2 (>2 ปี) |
| `ltv_type2_under_2years` | DECIMAL(5,2) | YES | NULL | LTV ประเภท 2 (<2 ปี) |
| `ltv_type3` | DECIMAL(5,2) | YES | NULL | LTV ประเภท 3 |
| `installment_rates` | TEXT | YES | NULL | อัตราผ่อนชำระ (JSON) |
| `interest_rates` | TEXT | YES | NULL | อัตราดอกเบี้ย (JSON) |
| `partnership_type` | VARCHAR(100) | YES | 'Standard_Commercial' | ประเภทความร่วมมือ |
| `min_credit_score` | INT | YES | 600 | คะแนนเครดิตขั้นต่ำ |
| `max_ltv_rent_to_own` | DECIMAL(5,2) | YES | 80.00 | LTV สูงสุดสำหรับเช่าออม (%) |
| `preferred_interest_rate` | DECIMAL(5,2) | YES | 4.50 | อัตราดอกเบี้ยที่ต้องการ (%) |
| `max_term_rent_to_own` | INT | YES | 25 | ระยะเวลาสูงสุดเช่าออม (ปี) |
| `special_programs` | TEXT | YES | NULL | โปรแกรมพิเศษ (JSON) |
| `livnex_bonus` | INT | YES | 0 | โบนัส Livnex |
| `exclude_status` | TEXT | YES | NULL | สถานะที่ยกเว้น (JSON) |
| `acceptable_grades` | TEXT | YES | NULL | เกรดที่ยอมรับ (JSON) |
| `loan_weight` | DECIMAL(3,2) | YES | 0.40 | น้ำหนักสินเชื่อ |
| `rent_to_own_weight` | DECIMAL(3,2) | YES | 0.30 | น้ำหนักเช่าออม |
| `credit_weight` | DECIMAL(3,2) | YES | 0.30 | น้ำหนักเครดิต |
| `is_active` | TINYINT(1) | YES | 1 | สถานะใช้งาน |
| `created_at` | TIMESTAMP | YES | CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | TIMESTAMP | YES | CURRENT_TIMESTAMP | วันที่อัปเดต |

**Banks in System:**
- GHB - ธนาคารอาคารสงเคราะห์
- GSB - ธนาคารออมสิน
- KTB - ธนาคารกรุงไทย
- SCB - ธนาคารไทยพาณิชย์
- BBL - ธนาคารกรุงเทพ
- KBANK - ธนาคารกสิกรไทย
- TTB - ธนาคารทีเอ็มบีธนชาต
- BAY - ธนาคารกรุงศรีอยุธยา
- KKP - ธนาคารเกียรตินาคิน
- LHB - ธนาคารแลนด์ แอนด์ เฮ้าส์
- UOB - ธนาคารยูโอบี
- IBANK - ธนาคารอิสลามแห่งประเทศไทย

---

### 5. `reports` - รายงานวิเคราะห์

**Primary Key:** `id`
**Foreign Key:** `customer_id` → `customers(id)` ON DELETE CASCADE

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | รหัสรายงาน (PK) |
| `customer_id` | INT | YES | NULL | รหัสลูกค้า (FK) |
| `customer_name` | VARCHAR(255) | NO | - | ชื่อลูกค้า |
| `report_date` | DATE | NO | - | วันที่รายงาน |
| `selected_installment` | INT | YES | NULL | งวดที่เลือก |
| `additional_notes` | TEXT | YES | NULL | หมายเหตุเพิ่มเติม |
| `debt_limit` | INT | YES | NULL | วงเงินหนี้ที่อนุญาต |
| `loan_term_after` | INT | YES | NULL | ระยะเวลากู้หลังการวิเคราะห์ |
| `analyst` | VARCHAR(255) | YES | NULL | ผู้วิเคราะห์ |
| `created_at` | TIMESTAMP | YES | CURRENT_TIMESTAMP | วันที่สร้าง |

---

### 6. `users` - ผู้ใช้งานระบบ

**Primary Key:** `id`
**Unique Key:** `username`

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| `id` | INT | NO | AUTO_INCREMENT | รหัสผู้ใช้ (PK) |
| `username` | VARCHAR(100) | NO | - | ชื่อผู้ใช้ (UNIQUE) |
| `password_hash` | VARCHAR(255) | NO | - | รหัสผ่าน (Hashed) |
| `full_name` | VARCHAR(255) | NO | - | ชื่อเต็ม |
| `role` | ENUM | NO | - | บทบาท: admin, data_entry, data_user |
| `department` | ENUM | NO | - | แผนก: แผนกขาย, CO |
| `is_active` | TINYINT(1) | NO | 1 | สถานะใช้งาน |
| `created_at` | TIMESTAMP | YES | CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | TIMESTAMP | YES | CURRENT_TIMESTAMP | วันที่อัปเดต |

**Default Users:**
1. **admin** - System Administrator (admin role)
2. **data_entry** - Data Entry User (data_entry role)
3. **data_user** - Data Viewer (data_user role)

---

## 🔗 Relationships

```
customers (1) ──────< (N) loan_problems
          │
          └─────────< (N) action_plans
          │
          └─────────< (N) reports
```

### Foreign Key Constraints:
- `loan_problems.customer_id` → `customers.id` ON DELETE CASCADE
- `action_plans.customer_id` → `customers.id` ON DELETE CASCADE
- `reports.customer_id` → `customers.id` ON DELETE CASCADE

---

## 📈 KPI Calculations

### 1. DSR (Debt Service Ratio)
```
DSR = (หนี้ปัจจุบัน / รายได้) × 100
```

**DSR Grading:**
- DSR < 40% → **100 คะแนน** (ดีเยี่ยม)
- DSR 40-60% → **75 คะแนน** (เฝ้าระวัง)
- DSR > 60% → **50 คะแนน** (ต้องปรับปรุง)

### 2. Potential Score (คะแนนศักยภาพ)
```
Potential Score = (actionPlanProgress × 0.5) + (dsrScore × 0.5)
```

### 3. Rent-to-Own Calculations
- **Monthly Rent:** `(propertyValue / 1,000,000) × rentRatePerMillion`
- **Guarantee:** `monthlyRent × guaranteeMultiplier`
- **Prepaid Rent:** `monthlyRent × prepaidRentMultiplier`
- **Accumulated Savings:** Sum of monthly installments with interest

---

## 🛠️ Recent Updates

### October 13, 2025
1. ✅ **Date Validation Fix**
   - Added `sanitizeDate()` function for date fields
   - Converts partial dates (YYYY-MM) to full MySQL format (YYYY-MM-DD)
   - Applied to `customers.date` and `customers.targetDate`

2. ✅ **Report Insert Bug Fix**
   - Added `sanitizeValue()` to all `insertReport()` parameters
   - Fixed "Bind parameters must not contain undefined" error

3. ✅ **SQLite to MySQL Migration**
   - Migrated 682/688 customers (99%)
   - Migrated 2,555 loan problems (100%)
   - Migrated 869 action plans (100%)
   - Thai date conversion: DD/MM/BBBB (พ.ศ.) → YYYY-MM-DD (ค.ศ.)

---

## 📝 Notes

- **Character Set:** utf8mb4 (supports Thai language and emojis)
- **Timezone:** +07:00 (Bangkok)
- **Collation:** utf8mb4_unicode_ci
- **Engine:** InnoDB (supports transactions and foreign keys)

---

## 🔐 Security Considerations

1. **Password Storage:** Bcrypt hashing with salt rounds = 10
2. **JWT Authentication:** Tokens expire after session
3. **Role-Based Access Control (RBAC):**
   - `admin`: Full access
   - `data_entry`: Can create and edit customers
   - `data_user`: Read-only access

---

**Generated by:** Claude Code
**Documentation Version:** 1.0
**Last Updated:** October 13, 2025

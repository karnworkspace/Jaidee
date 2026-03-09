# DOC2026 Changelog

## Commit 1: `3c7061e` — Refactor server/index.js monolith into modular architecture
- แตก `index.js` จาก 2,212 บรรทัด → 66 บรรทัด + 14 modules
- สร้าง `config/bankConstants.js` — ค่าคงที่ธนาคาร (refbank rates, credit grades, LTV rules)
- สร้าง `services/creditAnalysis.js` — วิเคราะห์เครดิต (interpretCreditScore, classify3BProblems, generateLivNexRecommendations)
- สร้าง `services/loanCalculation.js` — คำนวณสินเชื่อ (calculateKPIs, calculateApprovalProbability, calculateLoanEstimation)
- สร้าง `services/rentToOwn.js` — คำนวณเช่าออม (calculateRentToOwnEstimation, amortizationTable)
- สร้าง `services/bankMatching.js` — จับคู่ธนาคาร (calculateEnhancedBankMatching, calculateBankMatchingWithCreditBureau)
- สร้าง `services/customerService.js` — รวม duplicated calculation logic เป็น `enrichCustomerWithCalculations()`
- สร้าง `routes/auth.js` — Login/Logout/Me endpoints
- สร้าง `routes/customers.js` — Customer CRUD
- สร้าง `routes/bankRules.js` — Bank rules CRUD
- สร้าง `routes/problems.js` — Loan problems API
- สร้าง `routes/reports.js` — Reports + PDF generation
- สร้าง `routes/rentToOwn.js` — Rent-to-own calculation
- สร้าง `routes/csvImport.js` — CSV import/debug/clear

## Commit 2: `53c0953` — Add DOC2026 database migration and fix critical Docker persistence issue
- สร้าง `migrations.js` — ระบบ migration idempotent (รันซ้ำได้ปลอดภัย)
- เพิ่ม 5 ตารางใหม่:
  - `loan_applications` — APP-IN case tracking + status workflow (10 สถานะ)
  - `bureau_requests` — Bureau check history + form 1&2 + consent + 3-month duplicate
  - `debt_items` — รายละเอียดหนี้แยกประเภท + auto-calculation ตาม DOC2026
  - `livnex_tracking` — สถานะหลัง approve (Active/Transfer/Cancel)
  - `ca_recommendations` — คำแนะนำ CA + DSR breakdown + CO tracking
- เพิ่ม 18 columns ใน customers table (loan_status, consent, co-borrower, plot_number, etc.)
- เพิ่ม CRUD functions 19 ตัวใน `database.js` สำหรับตารางใหม่ทั้ง 5
- Debt auto-calculation: revolving_personal/other=5%, credit_card=8%, installment=monthly, joint_loan=monthly/2
- Migrate ข้อมูล debt เดิม 565 records → debt_items (type='legacy')
- **แก้ Critical bug**: DB path จาก `/app/jaidee.sqlite` → `/app/data/jaidee.sqlite` ให้ตรง Docker volume mount
- เพิ่ม `*.sqlite` ใน `.dockerignore` ป้องกัน sensitive data ใน Docker image
- เพิ่ม healthcheck ใน `docker-compose.production.yml`

## Commit 3: `cb2ae23` — Add DOC2026 API routes for 5 new tables
- สร้าง `routes/loanApplications.js` — GET(by customer), GET(by id), POST, PUT
- สร้าง `routes/bureauRequests.js` — GET(by customer), GET(recent/3mo check), POST(+duplicate check), PUT
- สร้าง `routes/debtItems.js` — GET(by customer), GET(summary), POST, PUT, DELETE + debt_type validation
- สร้าง `routes/livnexTracking.js` — GET(by customer), POST, PUT
- สร้าง `routes/caRecommendations.js` — GET(by customer), POST, PUT
- แก้ `index.js` — import + mount routes ที่ `/api/loan-applications`, `/api/bureau-requests`, `/api/debt-items`, `/api/livnex-tracking`, `/api/ca-recommendations`
- ทุก endpoint มี authenticateToken + requireRole + input validation

## Commit 4: `b6a08a0` — Remove old DB file, add deprecated backup to gitignore
- ลบ `server/jaidee.sqlite` จาก repo (ย้ายไป `data/` แล้ว)
- เพิ่ม `*.sqlite.backup_deprecated` ใน `.gitignore`

## Commit 5 — Add workflow state machine + DSR calculation
- สร้าง `services/workflowService.js` — state machine ควบคุม loan_status transitions
  - กำหนด transitions: new→document_check→bureau_check→analyzing→approved/rejected→transferred/cancelled
  - ป้องกัน invalid transitions (เช่น document_check→approved ตรงไม่ได้)
  - `validateTransition()` + `getNextStatuses()` functions
- เพิ่ม workflow validation ใน `routes/loanApplications.js` PUT endpoint
- เพิ่ม `GET /:id/next-statuses` endpoint แสดง transitions ที่อนุญาต
- เพิ่ม `GET /customer/:customerId/dsr` endpoint ใน `routes/debtItems.js`
  - คำนวณ DSR = total_calculated_debt / income * 100
  - พร้อม breakdown แต่ละรายการหนี้

## Commit 6 — Add APP-IN auto-generation service
- สร้าง `services/appInService.js` — auto-generate เลข APP-IN format `APPIN-YYMM-XXXX`
  - ดึง sequence สูงสุดของเดือนปัจจุบันจาก DB แล้ว +1
  - zero-padded 4 หลัก (รองรับ 9,999 เคส/เดือน)
- แก้ `routes/loanApplications.js` POST — auto-generate ถ้าไม่ส่ง app_in_number มา
- ยังรองรับการใส่เลข APP-IN เองได้ (กรณี REM LivNex ส่งมา)

## Commit 7 — Add LivNex tracking business logic
- เพิ่ม validation ใน POST `/api/livnex-tracking`:
  - ถ้าส่ง loan_application_id มา ต้องเป็น status `approved` เท่านั้น
- เพิ่ม status transition validation ใน PUT `/api/livnex-tracking/:id`:
  - approved → active, cancelled
  - active → transferred, cancelled
  - transferred, cancelled → terminal (ไม่เปลี่ยนได้)

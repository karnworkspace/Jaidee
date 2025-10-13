# คู่มือความสัมพันธ์ของข้อมูลในระบบ Jaidee

**เอกสารฉบับนี้อธิบาย:** ความสัมพันธ์ระหว่าง Frontend, Backend และ Database ในระบบ Jaidee
**อัปเดตล่าสุด:** 13 ตุลาคม 2025

---

## 📊 ภาพรวมสถาปัตยกรรมระบบ

```
┌─────────────────┐      HTTP/REST API       ┌─────────────────┐      SQL Queries      ┌─────────────────┐
│                 │ ───────────────────────> │                 │ ──────────────────────> │                 │
│   FRONTEND      │                          │   BACKEND       │                        │   DATABASE      │
│   (React)       │ <─────────────────────── │   (Node.js)     │ <────────────────────── │   (MySQL 8.0)   │
│                 │      JSON Response       │                 │      Result Set        │                 │
└─────────────────┘                          └─────────────────┘                        └─────────────────┘
```

---

## 🗂️ โครงสร้างความสัมพันธ์ของ Database

### แผนภาพ Entity Relationship (ER Diagram)

```
┌──────────────────────────────────────┐
│          customers (แม่)              │
│  PK: id                               │
│  - date, name, age, phone             │
│  - income, debt, propertyValue        │
│  - targetBank, officer                │
│  - created_at, updated_at             │
└──────────────┬───────────────────────┘
               │
               │ ONE-TO-MANY (1:N)
               │
       ┌───────┴────────┬──────────────────┬────────────────┐
       │                │                  │                │
       ▼                ▼                  ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│loan_problems │  │action_plans  │  │   reports    │  │              │
│     (ลูก)    │  │     (ลูก)    │  │     (ลูก)    │  │              │
├──────────────┤  ├──────────────┤  ├──────────────┤  │              │
│PK: id        │  │PK: id        │  │PK: id        │  │              │
│FK: customer  │  │FK: customer  │  │FK: customer  │  │              │
│   _id        │  │   _id        │  │   _id        │  │              │
│- problem     │  │- plan        │  │- report_date │  │              │
│- created_at  │  │- created_at  │  │- analyst     │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

                            ┌──────────────┐
                            │  bank_rules  │
                            │  (อิสระ)     │
                            ├──────────────┤
                            │PK: id        │
                            │UK: bank_code │
                            │- bank_name   │
                            │- dsr_high    │
                            │- ltv_*       │
                            └──────────────┘

                            ┌──────────────┐
                            │    users     │
                            │  (อิสระ)     │
                            ├──────────────┤
                            │PK: id        │
                            │UK: username  │
                            │- password    │
                            │- role        │
                            └──────────────┘
```

### ความสัมพันธ์:
- **customers → loan_problems**: 1 ลูกค้ามีได้หลายปัญหา (1:N)
- **customers → action_plans**: 1 ลูกค้ามีได้หลายแผนแก้ไข (1:N)
- **customers → reports**: 1 ลูกค้ามีได้หลายรายงาน (1:N)
- **bank_rules**: ไม่มีความสัมพันธ์กับตารางอื่น (ใช้สำหรับคำนวณ)
- **users**: ไม่มีความสัมพันธ์กับตารางอื่น (ใช้สำหรับ Authentication)

---

## 📋 การไหลของข้อมูล: Frontend → Backend → Database

### 1. สร้างลูกค้าใหม่ (Create Customer)

#### 1.1 Frontend Form (`CustomerForm.js`)

**Component:** `src/components/CustomerForm.js`

```javascript
const [formData, setFormData] = useState({
  // 📋 ข้อมูลเบื้องต้น
  date: '2025-10-13',              // → customers.date
  officer: 'นายพิชญ์ สุดทัน',       // → customers.officer

  // 👤 ข้อมูลส่วนบุคคล
  name: 'ทดสอบ ลูกค้าใหม่',        // → customers.name
  age: 35,                         // → customers.age
  phone: '0812345678',             // → customers.phone
  job: 'พนักงานบริษัทเอกชน',       // → customers.job
  position: 'หัวหน้าฝ่าย',         // → customers.position

  // 💳 ข้อมูลการเงิน
  income: 50000,                   // → customers.income
  debt: 15000,                     // → customers.debt
  targetDate: '2026-10',           // → customers.targetDate (แปลงเป็น 2026-10-01)
  targetBank: 'GHB',               // → customers.targetBank

  // 🏠 ข้อมูลทรัพย์สิน
  projectName: 'เสนาคิทท์ เทพารักษ์',  // → customers.projectName
  unit: '12/345',                  // → customers.unit
  propertyPrice: 1900000,          // → customers.propertyPrice
  discount: 50000,                 // → customers.discount
  ltv: 90,                         // → customers.ltv
  readyToTransfer: '2026-12',      // → customers.readyToTransfer

  // 💰 ข้อมูลการเช่าออม
  propertyType: 'แนวสูง',          // ใช้คำนวณ rentRatePerMillion
  rentRatePerMillion: 4100,        // → customers.rentRatePerMillion
  installmentMonths: 36,           // → customers.installmentMonths
  transferYear: 1,                 // → customers.transferYear
});

// 🔴 ปัญหาสินเชื่อ (Dynamic Array)
const [selectedProblems, setSelectedProblems] = useState([
  'ยังไม่มีประสงค์ขึ้นข้อมูลเข้อเพื่อที่อยู่อาศัยกับธนาคาร',
  'เอกสาร/ข้อมูลประกอบการพิจารณาไม่สมบูรณ์'
]);  // → loan_problems table (multiple rows)

// 🟢 แผนแก้ไข (Dynamic Array)
const [selectedSolutions, setSelectedSolutions] = useState([
  'รอเอามาเขียวขาดจากบริษัท Livnex ก่อน',
  'ภาระหนี้สูง(ต้องลด)'
]);  // → action_plans table (multiple rows)
```

#### 1.2 Backend Endpoint (`index.js`)

**API:** `POST /api/customers`

```javascript
app.post('/api/customers', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  // 1. รับข้อมูลจาก Frontend
  const requestBody = req.body;

  // 2. คำนวณ KPIs (ไม่ได้เก็บใน DB บางส่วน)
  const kpis = calculateKPIs(requestBody);
  // → potentialScore, financialStatus, degreeOfOwnership

  // 3. เตรียมข้อมูลลูกค้า
  const customerData = {
    ...requestBody,
    loanProblem: requestBody.loanProblem || [],   // Array
    actionPlan: requestBody.actionPlan || [],     // Array
    ...kpis
  };

  // 4. บันทึกข้อมูลลงฐานข้อมูล
  const customerId = await insertCustomerWithDetails(
    customerData,              // → customers table
    customerData.loanProblem,  // → loan_problems table (multiple inserts)
    customerData.actionPlan    // → action_plans table (multiple inserts)
  );

  // 5. ดึงข้อมูลที่บันทึกแล้วกลับมา
  const newCustomer = await getCustomerWithDetails(customerId);

  // 6. เพิ่มข้อมูลที่คำนวณได้ (ไม่ได้เก็บใน DB)
  newCustomer.loanEstimation = calculateLoanEstimation(customerData);
  newCustomer.rentToOwnEstimation = calculateRentToOwn(customerData);

  res.status(201).json({
    message: 'Customer added successfully',
    customer: newCustomer
  });
});
```

#### 1.3 Database Layer (`database.js`)

**Function:** `insertCustomerWithDetails()`

```javascript
const insertCustomerWithDetails = async (customerData, loanProblems = [], actionPlans = []) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 📝 1. บันทึกข้อมูลลูกค้าลง customers table
    const [customerResult] = await connection.execute(`
      INSERT INTO customers (
        date, name, age, phone, job, position,
        income, debt, targetDate, targetBank,
        propertyPrice, discount, ltv, ...
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ...)
    `, [
      sanitizeDate(customerData.date),           // แปลง date format
      sanitizeValue(customerData.name),
      sanitizeValue(customerData.age),
      // ... ฟิลด์อื่นๆ
    ]);

    const customerId = customerResult.insertId;   // ได้ ID ของลูกค้าที่สร้างใหม่

    // 🔴 2. บันทึกปัญหาสินเชื่อ (วน loop)
    if (loanProblems && loanProblems.length > 0) {
      const validProblems = loanProblems.filter(p => p !== null && p !== '');

      for (const problem of validProblems) {
        await connection.execute(
          'INSERT INTO loan_problems (customer_id, problem) VALUES (?, ?)',
          [customerId, problem]   // เชื่อมด้วย customer_id (FK)
        );
      }
    }

    // 🟢 3. บันทึกแผนแก้ไข (วน loop)
    if (actionPlans && actionPlans.length > 0) {
      const validPlans = actionPlans.filter(p => p !== null && p !== '');

      for (const plan of validPlans) {
        await connection.execute(
          'INSERT INTO action_plans (customer_id, plan) VALUES (?, ?)',
          [customerId, plan]      // เชื่อมด้วย customer_id (FK)
        );
      }
    }

    await connection.commit();
    return customerId;

  } catch (error) {
    await connection.rollback();
    throw error;
  }
};
```

#### 1.4 ผลลัพธ์ใน Database

**ตาราง customers:**
```sql
| id  | date       | name              | age | income  | debt   | targetBank | created_at          |
|-----|------------|-------------------|-----|---------|--------|------------|---------------------|
| 687 | 2025-10-13 | ทดสอบ ลูกค้าใหม่  | 35  | 50000   | 15000  | GHB        | 2025-10-13 10:00:00 |
```

**ตาราง loan_problems:**
```sql
| id   | customer_id | problem                                          | created_at          |
|------|-------------|--------------------------------------------------|---------------------|
| 2564 | 687         | ยังไม่มีประสงค์ขึ้นข้อมูลเข้อเพื่อที่อยู่...    | 2025-10-13 10:00:00 |
| 2565 | 687         | เอกสาร/ข้อมูลประกอบการพิจารณาไม่สมบูรณ์          | 2025-10-13 10:00:00 |
```

**ตาราง action_plans:**
```sql
| id  | customer_id | plan                                      | created_at          |
|-----|-------------|-------------------------------------------|---------------------|
| 878 | 687         | รอเอามาเขียวขาดจากบริษัท Livnex ก่อน      | 2025-10-13 10:00:00 |
| 879 | 687         | ภาระหนี้สูง(ต้องลด)                       | 2025-10-13 10:00:00 |
```

---

### 2. ดึงข้อมูลลูกค้า (Read Customer)

#### 2.1 Backend Endpoint

**API:** `GET /api/customers/:id`

```javascript
app.get('/api/customers/:id', authenticateToken, async (req, res) => {
  const customerId = parseInt(req.params.id);

  // ดึงข้อมูลลูกค้าพร้อมปัญหาและแผนแก้ไข
  const customer = await getCustomerWithDetails(customerId);

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  res.json(customer);
});
```

#### 2.2 Database Layer

**Function:** `getCustomerWithDetails()`

```javascript
const getCustomerWithDetails = async (customerId) => {
  // 1. ดึงข้อมูลลูกค้าจาก customers table
  const customer = await executeQuery(
    'SELECT * FROM customers WHERE id = ?',
    [customerId]
  );

  if (customer.length === 0) return null;

  // 2. ดึงปัญหาสินเชื่อ (JOIN โดย customer_id)
  const loanProblems = await executeQuery(
    'SELECT * FROM loan_problems WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId]
  );

  // 3. ดึงแผนแก้ไข (JOIN โดย customer_id)
  const actionPlans = await executeQuery(
    'SELECT * FROM action_plans WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId]
  );

  // 4. รวมข้อมูลทั้งหมด
  return {
    ...customer[0],
    loanProblems: loanProblems || [],     // Array of problems
    actionPlans: actionPlans || []        // Array of plans
  };
};
```

#### 2.3 Response กลับไปยัง Frontend

```json
{
  "id": 687,
  "date": "2025-10-13",
  "name": "ทดสอบ ลูกค้าใหม่",
  "age": 35,
  "phone": "0812345678",
  "income": "50000.00",
  "debt": "15000.00",
  "targetBank": "GHB",
  "propertyPrice": "1900000.00",
  "discount": "50000.00",
  "ltv": "90.00",
  "created_at": "2025-10-13T03:00:00.000Z",
  "updated_at": "2025-10-13T03:00:00.000Z",

  "loanProblems": [
    {
      "id": 2564,
      "customer_id": 687,
      "problem": "ยังไม่มีประสงค์ขึ้นข้อมูลเข้อเพื่อที่อยู่อาศัยกับธนาคาร",
      "created_at": "2025-10-13T03:00:00.000Z"
    },
    {
      "id": 2565,
      "customer_id": 687,
      "problem": "เอกสาร/ข้อมูลประกอบการพิจารณาไม่สมบูรณ์",
      "created_at": "2025-10-13T03:00:00.000Z"
    }
  ],

  "actionPlans": [
    {
      "id": 878,
      "customer_id": 687,
      "plan": "รอเอามาเขียวขาดจากบริษัท Livnex ก่อน",
      "created_at": "2025-10-13T03:00:00.000Z"
    },
    {
      "id": 879,
      "customer_id": 687,
      "plan": "ภาระหนี้สูง(ต้องลด)",
      "created_at": "2025-10-13T03:00:00.000Z"
    }
  ]
}
```

---

### 3. แก้ไขข้อมูลลูกค้า (Update Customer)

#### 3.1 Backend Endpoint

**API:** `PUT /api/customers/:id`

```javascript
app.put('/api/customers/:id', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  const customerId = parseInt(req.params.id);

  // 1. ตรวจสอบว่าลูกค้ามีอยู่จริง
  const existingCustomer = await getCustomerWithDetails(customerId);
  if (!existingCustomer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // 2. รวมข้อมูลเดิมกับข้อมูลใหม่
  const updatedCustomerData = { ...existingCustomer, ...req.body };

  // 3. คำนวณ KPIs ใหม่
  const kpis = calculateKPIs(updatedCustomerData);

  // 4. อัปเดตข้อมูล
  await updateCustomerWithDetails(
    customerId,
    { ...updatedCustomerData, ...kpis },
    req.body.loanProblem || [],    // ปัญหาใหม่
    req.body.actionPlan || []       // แผนใหม่
  );

  res.json({ message: 'Customer updated successfully' });
});
```

#### 3.2 Database Layer

**Function:** `updateCustomerWithDetails()`

```javascript
const updateCustomerWithDetails = async (customerId, customerData, loanProblems = [], actionPlans = []) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 📝 1. อัปเดตข้อมูลลูกค้า
    await connection.execute(`
      UPDATE customers SET
        date=?, name=?, age=?, phone=?, income=?, debt=?, targetBank=?,
        targetDate=?, propertyPrice=?, discount=?, ltv=?, ...
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `, [
      sanitizeDate(customerData.date),
      sanitizeValue(customerData.name),
      // ... ฟิลด์อื่นๆ
      customerId
    ]);

    // 🔴 2. ลบปัญหาเก่าทั้งหมด
    await connection.execute(
      'DELETE FROM loan_problems WHERE customer_id = ?',
      [customerId]
    );

    // 🔴 3. เพิ่มปัญหาใหม่
    if (loanProblems && loanProblems.length > 0) {
      const validProblems = loanProblems.filter(p => p !== null && p !== '');
      for (const problem of validProblems) {
        await connection.execute(
          'INSERT INTO loan_problems (customer_id, problem) VALUES (?, ?)',
          [customerId, problem]
        );
      }
    }

    // 🟢 4. ลบแผนเก่าทั้งหมด
    await connection.execute(
      'DELETE FROM action_plans WHERE customer_id = ?',
      [customerId]
    );

    // 🟢 5. เพิ่มแผนใหม่
    if (actionPlans && actionPlans.length > 0) {
      const validPlans = actionPlans.filter(p => p !== null && p !== '');
      for (const plan of validPlans) {
        await connection.execute(
          'INSERT INTO action_plans (customer_id, plan) VALUES (?, ?)',
          [customerId, plan]
        );
      }
    }

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    throw error;
  }
};
```

---

### 4. ลบข้อมูลลูกค้า (Delete Customer)

#### 4.1 Backend Endpoint

**API:** `DELETE /api/customers/:id`

```javascript
app.delete('/api/customers/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const customerId = parseInt(req.params.id);

  // ลบลูกค้า (CASCADE จะลบ loan_problems และ action_plans อัตโนมัติ)
  await deleteCustomer(customerId);

  res.json({ message: 'Customer deleted successfully' });
});
```

#### 4.2 Database Layer

**Function:** `deleteCustomer()`

```javascript
const deleteCustomer = async (customerId) => {
  // ลบลูกค้า - Foreign Key Constraint จะลบข้อมูลที่เกี่ยวข้องโดยอัตโนมัติ
  // ON DELETE CASCADE ใน loan_problems และ action_plans
  await executeQuery('DELETE FROM customers WHERE id = ?', [customerId]);

  // ผลลัพธ์:
  // ✅ ลบใน customers (id=687)
  // ✅ ลบใน loan_problems (customer_id=687) ทั้งหมด (CASCADE)
  // ✅ ลบใน action_plans (customer_id=687) ทั้งหมด (CASCADE)
  // ✅ ลบใน reports (customer_id=687) ทั้งหมด (CASCADE)
};
```

---

## 🔍 การคำนวณและข้อมูลที่ไม่ได้เก็บในฐานข้อมูล

### ข้อมูลที่คำนวณแบบ Real-time (ไม่เก็บใน DB)

| ข้อมูล | คำนวณโดย | ใช้ฟิลด์จาก DB |
|--------|----------|----------------|
| **DSR** | `calculateKPIs()` | `debt` ÷ `income` × 100 |
| **propertyValue** | Frontend | `propertyPrice` - `discount` |
| **monthlyRent** | `calculateRentToOwn()` | `propertyValue` × `rentRatePerMillion` ÷ 1,000,000 |
| **loanEstimation** | `calculateLoanEstimation()` | `income`, `debt`, `ltv`, `loanTerm`, `targetBank` |
| **enhancedBankMatching** | `enhancedBankMatching()` | ทุกฟิลด์ + `bank_rules` table |
| **creditBureauAnalysis** | `analyzeCreditBureau()` | `creditScore`, `paymentHistory`, `accountStatuses` |

### ข้อมูลที่เก็บในฐานข้อมูล

| ข้อมูล | เก็บใน Table | ประเภท | ความถี่ในการอัปเดต |
|--------|--------------|--------|-------------------|
| **potentialScore** | `customers.potentialScore` | DECIMAL(5,2) | ทุกครั้งที่ save |
| **financialStatus** | `customers.financialStatus` | VARCHAR(100) | ทุกครั้งที่ save |
| **degreeOfOwnership** | `customers.degreeOfOwnership` | DECIMAL(5,2) | ทุกครั้งที่ save |
| **actionPlanProgress** | `customers.actionPlanProgress` | DECIMAL(5,2) | อัปเดตด้วยตนเอง |

---

## 🔗 ตัวอย่างการเชื่อมโยงข้อมูลแบบละเอียด

### Scenario: ผู้ใช้แก้ไขลูกค้า ID 687

```
1️⃣ Frontend (CustomerForm.js)
   User แก้ไข: income = 60000, เพิ่มปัญหา "ขาดเอกสาร"
   ↓
   fetch('http://localhost:3001/api/customers/687', {
     method: 'PUT',
     body: JSON.stringify({
       income: 60000,
       loanProblem: ['ปัญหา1', 'ปัญหา2', 'ขาดเอกสาร']
     })
   })

2️⃣ Backend (index.js)
   ↓
   PUT /api/customers/687
   ↓
   calculateKPIs({ ...existingData, income: 60000 })
   ↓
   updateCustomerWithDetails(687, updatedData, newProblems, ...)

3️⃣ Database (database.js)
   ↓
   BEGIN TRANSACTION

   UPDATE customers
   SET income=60000, updated_at=NOW()
   WHERE id=687;

   DELETE FROM loan_problems WHERE customer_id=687;

   INSERT INTO loan_problems (customer_id, problem) VALUES
     (687, 'ปัญหา1'),
     (687, 'ปัญหา2'),
     (687, 'ขาดเอกสาร');

   COMMIT;

4️⃣ Response
   ↓
   {
     message: 'Customer updated successfully',
     customer: { id: 687, income: 60000, loanProblems: [...] }
   }

5️⃣ Frontend Update
   ↓
   navigate('/customer/687') → แสดงข้อมูลใหม่
```

---

## 📌 Foreign Key Constraints และ Cascading

### การตั้งค่า Foreign Keys

```sql
-- loan_problems
ALTER TABLE loan_problems
ADD CONSTRAINT fk_loan_problems_customer
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE CASCADE;

-- action_plans
ALTER TABLE action_plans
ADD CONSTRAINT fk_action_plans_customer
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE CASCADE;

-- reports
ALTER TABLE reports
ADD CONSTRAINT fk_reports_customer
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE CASCADE;
```

### ผลของ CASCADE:

เมื่อลบ `customers.id = 687`:
- ✅ **loan_problems** ที่มี `customer_id = 687` ถูกลบอัตโนมัติ
- ✅ **action_plans** ที่มี `customer_id = 687` ถูกลบอัตโนมัติ
- ✅ **reports** ที่มี `customer_id = 687` ถูกลบอัตโนมัติ

---

## 🛡️ Data Validation และ Sanitization

### Frontend Validation (CustomerForm.js)

```javascript
// Required fields
<input type="text" name="name" required />
<input type="number" name="age" required min="18" max="100" />
<input type="tel" name="phone" pattern="[0-9]{10}" required />

// Date format
<input type="month" name="targetDate" />  // → "2026-10"

// Select validation
<select name="targetBank" required>
  <option value="GHB">ธนาคารอาคารสงเคราะห์ (GHB)</option>
  ...
</select>
```

### Backend Validation (database.js)

```javascript
// sanitizeValue() - แปลง undefined/null/empty → null
const sanitizeValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    return trimmed;
  }
  return value;
};

// sanitizeDate() - แปลง partial date → full date
const sanitizeDate = (dateValue) => {
  if (!dateValue) return null;

  // "2026-10" → "2026-10-01"
  if (dateValue.match(/^\d{4}-\d{2}$/)) {
    return `${dateValue}-01`;
  }

  return dateValue;
};
```

---

## 📊 ตัวอย่าง SQL Queries ที่ใช้บ่อย

### 1. ดึงลูกค้าพร้อมปัญหาและแผน

```sql
SELECT
  c.*,
  GROUP_CONCAT(DISTINCT lp.problem SEPARATOR '|') as problems,
  GROUP_CONCAT(DISTINCT ap.plan SEPARATOR '|') as plans
FROM customers c
LEFT JOIN loan_problems lp ON c.id = lp.customer_id
LEFT JOIN action_plans ap ON c.id = ap.customer_id
WHERE c.id = 687
GROUP BY c.id;
```

### 2. ค้นหาลูกค้าที่มีปัญหาเฉพาะ

```sql
SELECT DISTINCT c.*
FROM customers c
INNER JOIN loan_problems lp ON c.id = lp.customer_id
WHERE lp.problem LIKE '%Livnex%';
```

### 3. สถิติปัญหาสินเชื่อยอดนิยม

```sql
SELECT
  problem,
  COUNT(*) as count
FROM loan_problems
GROUP BY problem
ORDER BY count DESC
LIMIT 10;
```

### 4. ลูกค้าที่ยังไม่มีแผนแก้ไข

```sql
SELECT c.*
FROM customers c
LEFT JOIN action_plans ap ON c.id = ap.customer_id
WHERE ap.id IS NULL;
```

---

## 🎯 Best Practices

### ✅ DO:
- ใช้ Transaction เมื่อบันทึกข้อมูลหลายตาราง
- ใช้ `sanitizeValue()` และ `sanitizeDate()` เสมอก่อนบันทึก
- ตรวจสอบ Foreign Key ก่อนลบข้อมูล
- ใช้ Prepared Statements (?) เพื่อป้องกัน SQL Injection
- เก็บ `created_at` และ `updated_at` ทุกตาราง

### ❌ DON'T:
- ส่ง undefined เข้า SQL query (ใช้ null แทน)
- ลบข้อมูลโดยไม่มี backup
- Hard-code วันที่ในรูปแบบภาษาไทย (ใช้ MySQL DATE format)
- Skip validation ใน Frontend
- ละเว้น error handling ใน Transaction

---

**สร้างโดย:** Claude Code
**เวอร์ชั่น:** 1.0
**อัปเดตล่าสุด:** 13 ตุลาคม 2025

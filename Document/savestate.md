# SAVESTATE: สถานะปัจจุบันของ LIVNEX Consumer Advise Web Application

เอกสารนี้สรุปสถานะปัจจุบันของโปรเจกต์ LIVNEX Consumer Advise Web Application รวมถึงประวัติการพัฒนาที่สำคัญ ขั้นตอนการออกแบบ และ Logic การคำนวณหลัก เพื่อให้สามารถสานต่อการทำงานได้อย่างต่อเนื่อง

---

## 1. สถานะปัจจุบันของโปรเจกต์ (หลังการปรับปรุงวันที่ 8 กรกฎาคม)

โปรเจกต์อยู่ในสถานะที่ **โครงสร้างพื้นฐานและฟังก์ชันการทำงานหลักของ MVP ได้รับการพัฒนาและปรับปรุงแล้ว** โดยมีรายละเอียดดังนี้:

*   **Frontend (Client):**
    *   พัฒนาด้วย React.js (Create React App) และใช้ CSS Modules สำหรับการจัดสไตล์
    *   มีการจัดการ Routing ด้วย `react-router-dom`
    *   หน้า Dashboard แสดงรายการลูกค้าพร้อม KPI เบื้องต้น
    *   หน้า Customer Detail แสดงรายละเอียดลูกค้าพร้อม KPI และตารางประมาณการวงเงินกู้
    *   หน้า Customer Form (เพิ่ม/แก้ไข) ได้รับการปรับปรุงให้มีความละเอียดและยืดหยุ่นมากขึ้น โดยมีการแยกฟิลด์, เพิ่มฟิลด์เฉพาะสำหรับเจ้าของธุรกิจ, และใช้ Dynamic Textarea สำหรับ "ปัญหาด้านสินเชื่อ" และ "แผนการดำเนินการ" รวมถึงฟิลด์สำหรับ "อัตราผ่อนของธนาคารที่ลูกค้าควรเลือกสินเชื่อ"
*   **Backend (Server):**
    *   พัฒนาด้วย Node.js และ Express.js
    *   มี API สำหรับจัดการข้อมูลลูกค้า (GET, POST, PUT)
    *   มี Logic การคำนวณ KPI (Potential Score, Degree of Ownership, Financial Status)
    *   มี Logic การคำนวณตารางประมาณการวงเงินกู้ตามสูตร Excel ที่ได้รับ
    *   ข้อมูลลูกค้าถูกเก็บแบบ In-memory (จะหายไปเมื่อ Server Restart)

---

## 2. ประวัติการพัฒนาที่สำคัญ (Development History)

เราได้ดำเนินการพัฒนาโปรเจกต์นี้ตามขั้นตอนหลักๆ ดังนี้:

*   **การเริ่มต้นและทำความเข้าใจ Requirement:** วิเคราะห์เอกสารโปรเจกต์และ Google Sheet เพื่อทำความเข้าใจวัตถุประสงค์และฟีเจอร์หลักของแอปพลิเคชัน (เครื่องมือติดตามและพัฒนาศักยภาพลูกค้าเพื่อการขอสินเชื่อ)
*   **การตั้งค่า Project Environment:** สร้างโครงสร้าง Client/Server เบื้องต้น และพยายามตั้งค่า Tailwind CSS
*   **การแก้ไขปัญหา Tailwind CSS และเปลี่ยนไปใช้ CSS Modules:** พบปัญหาในการตั้งค่า Tailwind CSS จึงตัดสินใจเปลี่ยนมาใช้ CSS Modules เพื่อให้ UI แสดงผลได้อย่างถูกต้อง
*   **การสร้างระบบฟอร์มและเชื่อมต่อ Backend (In-memory):** พัฒนาฟอร์มสำหรับเพิ่มลูกค้าและเชื่อมต่อกับ Backend เพื่อบันทึกข้อมูล (ใช้ In-memory storage ชั่วคราว)
*   **การอัปเดตข้อมูลลูกค้าและคำนวณ KPI ใน Backend:** เพิ่มฟังก์ชันการแก้ไขข้อมูลลูกค้าและปรับปรุง Logic การคำนวณ KPI และประมาณการวงเงินกู้ใน Backend
*   **การปรับปรุงฟอร์มและแสดงผลข้อมูลเพิ่มเติม (วันที่ 8 กรกฎาคม):** ปรับปรุงฟอร์มให้ละเอียดขึ้น (แยกฟิลด์, Dynamic Input) และปรับการแสดงผลในหน้ารายละเอียดลูกค้าให้สอดคล้องกัน

---

## 3. ขั้นตอนการออกแบบและ Logic การคำนวณ

### 3.1 การออกแบบ (Design Steps)

การออกแบบ UI/UX ของแอปพลิเคชันเน้นความสะอาด ใช้งานง่าย และแสดงข้อมูลสำคัญได้อย่างชัดเจน:

*   **Dashboard:** แสดงภาพรวมของลูกค้าแต่ละรายพร้อม KPI หลัก เพื่อให้เจ้าหน้าที่สามารถติดตามสถานะได้อย่างรวดเร็ว
*   **Customer Detail:** แสดงข้อมูลรายละเอียดทั้งหมดของลูกค้า รวมถึง KPI และตารางประมาณการวงเงินกู้ เพื่อให้เจ้าหน้าที่สามารถวิเคราะห์และให้คำแนะนำได้}
*   **Customer Form:** ออกแบบให้สามารถกรอกข้อมูลลูกค้าได้อย่างละเอียด รองรับทั้งการเพิ่มและแก้ไขข้อมูล โดยมีการจัดกลุ่มฟิลด์ให้เข้าใจง่าย และใช้ Dynamic Input สำหรับข้อมูลที่อาจมีหลายรายการ (เช่น ปัญหาด้านสินเชื่อ, แผนการดำเนินการ)

### 3.2 Logic Scripts สำหรับการคำนวณ (Backend: `server/index.js`)

Backend มี Logic การคำนวณหลัก 2 ส่วน:

#### 3.2.1 การคำนวณ KPI (`calculateKPIs`)

*   **วัตถุประสงค์:** คำนวณ Potential Score, Degree of Ownership, Financial Status (DSR)
*   **Input:** `income`, `debt`, `propertyValue`, `actionPlanProgress` (จากข้อมูลลูกค้า)
*   **Logic:**
    *   **Degree of Ownership:** `(income / propertyValue) * 100` (เป็นค่าประมาณการ)
    *   **Financial Status (DSR):**
        *   คำนวณ DSR: `(debt / income) * 100`
        *   กำหนดสถานะ:
            *   DSR < 40%: 'ดีเยี่ยม' (dsrScore = 100)
            *   DSR < 60%: 'ดีขึ้น' (dsrScore = 75)
            *   DSR >= 60%: 'ต้องปรับปรุง' (dsrScore = 50)
    *   **Potential Score:** `(actionPlanProgress * 0.5) + (dsrScore * 0.5)` (เป็นค่าประมาณการ)

#### 3.2.2 การคำนวณประมาณการวงเงินกู้ (`calculateLoanEstimation`)

*   **วัตถุประสงค์:** สร้างตารางประมาณการวงเงินกู้สูงสุดที่ลูกค้าสามารถกู้ได้ ภายใต้สถานการณ์ภาระหนี้และระยะเวลาผ่อนชำระที่แตกต่างกัน
*   **Input:** `income`, `currentDebt`, `propertyValue`, `ltv`
*   **Constants:**
    *   `loanTerms`: ระยะเวลาผ่อนชำระ (ปี) เช่น `[40, 30, 20, 10]`
    *   `installmentRatesPerMillion`: อัตราผ่อนต่อล้านบาทสำหรับแต่ละระยะเวลาผ่อน
    *   `debtReductionPercentages`: เปอร์เซ็นต์การลดภาระหนี้ เช่น `[0, 0.1, 0.2, 0.3, 0.5, 0.7, 1]` (0% คือภาระหนี้ปัจจุบัน, 100% คือไม่มีหนี้)
    *   `INCOME_PERCENTAGE_FOR_LOAN`: เปอร์เซ็นต์ของรายได้ที่สามารถนำมาคำนวณวงเงินกู้ได้ (ปัจจุบัน 70%)
*   **Logic (ตามสูตร Excel):**
    *   คำนวณ `ltvLimit`: `propertyValue * (ltv / 100)` (วงเงินกู้สูงสุดตาม LTV)
    *   สำหรับแต่ละ Scenario การลดภาระหนี้:
        *   คำนวณ `remainingDebt`: ภาระหนี้ที่เหลือใน Scenario นั้นๆ
        *   คำนวณ `availablePayment`: `(income * INCOME_PERCENTAGE_FOR_LOAN) - remainingDebt`
        *   สำหรับแต่ละ `loanTerm`:
            *   คำนวณ `estimatedLoanAmount`: `(availablePayment / installmentRatesPerMillion[term]) * 1,000,000`
            *   `finalLoanAmount`: `MIN(estimatedLoanAmount, ltvLimit)` (เลือกค่าน้อยที่สุดระหว่างวงเงินที่คำนวณได้กับวงเงินตาม LTV)

---

## 4. Key Files & Technologies

*   **Frontend:**
    *   `client/src/App.js`: Main application component, handles routing.
    *   `client/src/components/Dashboard.js`: Customer list and overview.
    *   `client/src/components/CustomerDetail.js`: Detailed customer view.
    *   `client/src/components/CustomerForm.js`: Form for adding/editing customers.
    *   `client/src/components/*.module.css`: CSS Modules for component-specific styling.
    *   `package.json` (client): React, react-router-dom.
*   **Backend:**
    *   `server/index.js`: Express.js server, API endpoints, KPI and loan estimation logic.
    *   `package.json` (server): express, cors.

---

## 5. การปรับปรุงเพิ่มเติม (วันที่ 9 กรกฎาคม)

ในเซสชันนี้ ได้มีการปรับปรุงและเพิ่มเติมฟังก์ชันการทำงานหลายส่วนตาม Requirement ที่เปลี่ยนแปลงไป ดังนี้:

### 5.1 การปรับโครงสร้างข้อมูล (Backend & Form)
*   **เป้าหมาย:** เพิ่มข้อมูลเกี่ยวกับโครงการและสถานะของลูกค้า
*   **Backend (`server/index.js`):**
    *   เพิ่มฟิลด์ใหม่ 3 ฟิลด์ (`projectName`, `unit`, `readyToTransfer`) เข้าไปใน customer object เพื่อรองรับข้อมูลใหม่
    *   แก้ไข API endpoint `POST /api/customers` และ `PUT /api/customers/:id` ให้สามารถรับและบันทึกข้อมูลใหม่เหล่านี้ได้
*   **Frontend (`client/src/components/CustomerForm.js`):**
    *   เพิ่มช่อง Input สำหรับ `projectName`, `unit` (เปลี่ยนจาก `roomNumber`), และ `readyToTransfer` ในฟอร์ม
    *   อัปเดต State (`formData`) ในฟอร์มให้สอดคล้องกับโครงสร้างข้อมูลใหม่

### 5.2 การปรับปรุง UI/UX ของ Dashboard
*   **เป้าหมาย:** เปลี่ยน Layout และข้อมูลที่แสดงผลในหน้า Dashboard
*   **`Dashboard.js`:**
    *   เปลี่ยน Layout จากเดิมที่วางแผนจะเป็น Card-based กลับมาเป็น **Row-based (ตาราง)** ตาม Requirement ล่าสุด
    *   เปลี่ยนคอลัมน์ที่แสดงผลเป็น: **"ชื่อ-สกุล", "โครงการ", "ห้อง", และ "เป้าหมายยื่นกู้"**
    *   คอลัมน์ "เป้าหมายยื่นกู้" จะดึงข้อมูลจากฟิลด์ `targetDate` ของลูกค้ามาแสดงผล

### 5.3 การปรับปรุงฟอร์ม (Form Usability)
*   **เป้าหมาย:** ทำให้ฟอร์มใช้งานง่ายและชัดเจนขึ้น
*   **`CustomerForm.js` & `CustomerForm.module.css`:**
    *   **ฟิลด์บังคับ (Mandatory Fields):**
        *   เพิ่ม Attribute `required` ใน HTML ให้กับทุกฟิลด์ที่ผู้ใช้ระบุว่าจำเป็นต้องกรอก เพื่อป้องกันการส่งข้อมูลที่ไม่สมบูรณ์
        *   เพิ่ม **เครื่องหมายดอกจันสีแดง (`*`)** ที่ท้าย Label ของฟิลด์ที่บังคับกรอก เพื่อให้ผู้ใช้ทราบว่าเป็นฟิลด์ที่ต้องกรอก
    *   **การจัดรูปแบบตัวเลข (Number Formatting):**
        *   เพิ่ม Logic ในการจัดรูปแบบตัวเลขสำหรับช่อง Input ที่เกี่ยวกับจำนวนเงิน (`propertyValue`, `income`, `debt`, `recommendedInstallment`)
        *   ตัวเลขที่แสดงในช่อง Input จะมีเครื่องหมาย `,` คั่นทุกๆ 3 หลัก (เช่น 1,250,000) เพื่อให้อ่านง่ายขึ้น
        *   State ของข้อมูลยังคงเก็บเป็นตัวเลขปกติเพื่อให้คำนวณได้ถูกต้อง

---

## 6. การเพิ่มฟีเจอร์ประมาณการเช่าออม

ในเซสชันนี้ ได้มีการเพิ่มฟีเจอร์ประมาณการเช่าออม (Rent-to-Own Estimation) เข้ามาในระบบ ดังนี้:

### 6.1 Backend (`server/index.js`)
*   **การคำนวณ:**
    *   เพิ่มฟังก์ชัน `calculateRentToOwnEstimation` เพื่อคำนวณตารางเช่าออม
    *   ฟังก์ชันนี้รับ `rentToOwnValue` (มูลค่าเช่าออม) และ `monthlyRentToOwnRate` (อัตราค่าเช่าออมรายเดือน) เป็น Input
    *   คำนวณ `ยอดชำระรวม`, `ชำระเงินต้นค่าทรัพย์` (ซึ่งเท่ากับยอดชำระรวมเมื่อไม่มีเงินประกันและดอกเบี้ย), และ `คงเหลือเงินต้นค่าทรัพย์` สำหรับงวด 6, 12, 18, 24, 30, 36 เดือน
*   **การบันทึกข้อมูล:**
    *   เพิ่มฟิลด์ `rentToOwnValue`, `monthlyRentToOwnRate`, และ `rentToOwnEstimation` เข้าไปใน Customer Object
    *   แก้ไข API endpoint `POST /api/customers` และ `PUT /api/customers/:id` เพื่อให้มีการคำนวณและบันทึกข้อมูลเช่าออมเมื่อมีการเพิ่มหรือแก้ไขลูกค้า

### 6.2 Frontend Form (`client/src/components/CustomerForm.js`)
*   **การกรอกข้อมูล:**
    *   เพิ่มช่อง Input สำหรับ `มูลค่าเช่าออม` (`rentToOwnValue`) และ `อัตราค่าเช่าออมรายเดือน` (`monthlyRentToOwnRate`) ในฟอร์ม
    *   อัปเดต State (`formData`) ในฟอร์มให้รองรับฟิลด์ใหม่เหล่านี้

### 6.3 Frontend Detail (`client/src/components/CustomerDetail.js`)
*   **การแสดงผล:**
    *   เพิ่มส่วนใหม่เพื่อแสดง **"ประมาณการตารางเช่าออม"**
    *   แสดง `มูลค่าเช่าออม` และ `อัตราค่าเช่าออมรายเดือน` ที่กรอกเข้ามา
    *   แสดงตารางที่มีคอลัมน์ **"งวด (เดือน)", "ยอดชำระรวม", "ชำระเงินต้นค่าทรัพย์", และ "คงเหลือเงินต้นค่าทรัพย์"** โดยดึงข้อมูลจาก `customer.rentToOwnEstimation`
    *   ใช้ฟังก์ชัน `formatNumber` เพื่อจัดรูปแบบตัวเลขให้มีเครื่องหมาย `,` คั่นหลักพันในตารางและข้อมูลที่แสดง

---

## 7. การปรับปรุงเพิ่มเติม (วันที่ 11 กรกฎาคม - ช่วงเช้า)

ในเซสชันนี้ ได้มีการปรับปรุงและเพิ่มเติมฟังก์ชันการทำงานหลายส่วน ดังนี้:

### 7.1 การปรับปรุงฟอร์มลูกค้า (CustomerForm.js)
*   **ฟิลด์ 'ช่วงเวลาที่พร้อมโอน'**: เปลี่ยนจาก `input type="text"` เป็น `input type="month"` และกำหนดให้เป็นฟิลด์บังคับ (`required`) เพื่อให้ผู้ใช้สามารถเลือกเดือนและปีได้ง่ายขึ้น
*   **การเพิ่มฟิลด์สำหรับคำนวณเช่าออมแบบละเอียด**: เพิ่มช่องกรอกข้อมูลใหม่ในส่วน "ข้อมูลการเช่าออม (Rent-to-Own Evaluation)" ได้แก่ `propertyPrice`, `discount`, `installmentMonths`, `overpaidRent`, `rentRatePerMillion`, `guaranteeMultiplier`, `prepaidRentMultiplier`, `transferYear`, และ `annualInterestRate`
*   **การแสดงผลลัพธ์การคำนวณเช่าออมแบบ Real-time**: เพิ่มส่วนแสดงผลลัพธ์ (Read-only Display) สำหรับการคำนวณเช่าออมแบบละเอียดในหน้าฟอร์ม โดยใช้ `calculatedRentToOwnResults` state และฟังก์ชัน `calculateRentToOwn` จาก `rentToOwnCalculator.js` พร้อมแสดงตารางการผ่อนชำระ
*   **การลบฟิลด์ที่ซ้ำซ้อน**: ลบช่องกรอก "มูลค่าเช่าออม (บาท)" และ "อัตราค่าเช่าออมรายเดือน (บาท)" ออกจาก `CustomerForm.js` เนื่องจากข้อมูลเหล่านี้ถูกแทนที่ด้วยฟิลด์การคำนวณเช่าออมแบบละเอียดแล้ว
*   **การเพิ่ม CSS สำหรับตาราง**: เพิ่ม CSS styles ที่จำเป็นสำหรับตารางการผ่อนชำระใน `CustomerForm.module.css`

### 7.2 การปรับปรุง Backend (server/index.js)
*   **การเพิ่มฟิลด์ใหม่ใน Customer Object**: เพิ่มฟิลด์ `propertyPrice`, `discount`, `installmentMonths`, `overpaidRent`, `rentRatePerMillion`, `guaranteeMultiplier`, `prepaidRentMultiplier`, `transferYear`, และ `annualInterestRate` เข้าไปใน Customer Object ทั้งใน `app.post` และ `app.put` endpoints
*   **การปรับปรุง Logic การคำนวณเช่าออมแบบละเอียด**: เปลี่ยนชื่อฟังก์ชัน `calculateDetailedRentToOwnEstimation` เป็น `calculateRentToOwnAmortizationTable` และปรับปรุง Logic ให้สร้างตารางการผ่อนชำระ (amortization table) ตาม Pseudocode ใหม่ รวมถึงการเพิ่มแถว "สิ้นงวดที่ 36"
*   **การแก้ไขปัญหาการบันทึกข้อมูลซ้ำซ้อน**: แก้ไขข้อผิดพลาดใน `app.post` และ `app.put` ที่มีการกำหนดค่าฟิลด์ซ้ำซ้อนและผิดรูปแบบ
*   **การสร้าง API Endpoint ใหม่สำหรับการคำนวณเช่าออม**: เพิ่ม `POST /api/calculate-rent-to-own` endpoint พร้อม Logic การคำนวณ, Validation, และ Response Body ตาม Specification ที่กำหนด

### 7.3 การปรับปรุง Frontend Detail (CustomerDetail.js)
*   **การแสดงผลลัพธ์การประเมินเช่าออมแบบละเอียด**: ลบส่วน "ประมาณการตารางเช่าออม" เดิมออก และปรับปรุงส่วน "ผลลัพธ์การประเมินเช่าออม" ให้แสดงข้อมูลสรุปและตารางการผ่อนชำระที่คำนวณได้จาก Backend ในรูปแบบตารางที่จัดระเบียบ
*   **การเพิ่ม CSS สำหรับตาราง**: เพิ่ม CSS styles ที่จำเป็นสำหรับตารางการผ่อนชำระใน `CustomerDetail.module.css` รวมถึงการจัดสไตล์สำหรับงวดแรกและงวดสุดท้าย

### 7.4 การเพิ่ม Utility Function (client/src/utils/rentToOwnCalculator.js)
*   **การสร้างไฟล์ Utility Function**: สร้างไฟล์ `client/src/utils/rentToOwnCalculator.js` เพื่อเก็บ Logic การคำนวณเช่าออม (`calculateRentToOwn`) สำหรับใช้งานใน Frontend โดยรองรับ `annualInterestRate` และ Logic สำหรับ "สิ้นงวดที่ 36"

---

## 8. การปรับปรุงเพิ่มเติม (วันที่ 11 กรกฎาคม - ช่วงบ่าย)

ในเซสชันนี้ ได้มีการปรับปรุงและแก้ไขเพิ่มเติม ดังนี้:

### 8.1 การปรับปรุง Backend (server/index.js)
*   **การแก้ไข Logic การแทรกแถว "สิ้นงวด"**: ปรับปรุง `calculateRentToOwnAmortizationTable` เพื่อให้สามารถแทรกแถว "สิ้นงวดที่ 12", "สิ้นงวดที่ 24", และ "สิ้นงวดที่ 36" ได้อย่างถูกต้องตามเงื่อนไข `installmentMonths` และ Logic การคำนวณ `payment`, `interest`, `principalPaid`, `remainingPrincipal` สำหรับแถวพิเศษเหล่านี้
*   **การแก้ไข Syntax Error**: แก้ไข `SyntaxError: Unexpected token ')'` ใน `server/index.js` ที่เกิดจากวงเล็บเกินหรือขาดหายไปในฟังก์ชัน `calculateRentToOwnAmortizationTable`

### 8.2 การปรับปรุง Frontend (CustomerForm.js, CustomerDetail.js, RentToOwnTable.js, RentToOwnTable.module.css)
*   **การนำคอมโพเนนต์ `RentToOwnTable` มาใช้**: สร้างคอมโพเนนต์ `RentToOwnTable.js` เพื่อจัดการการแสดงผลตารางการผ่อนชำระแบบย่อ-ขยาย (Collapsed/Expanded View) และนำไปใช้แทนที่ Logic การแสดงผลตารางเดิมใน `CustomerForm.js` และ `CustomerDetail.js`
*   **การแปลง Tailwind CSS เป็น CSS Modules**: แปลงคลาส Tailwind CSS ที่ใช้ใน `RentToOwnTable.js` ให้เป็นกฎ CSS ที่เทียบเท่าใน `RentToOwnTable.module.css` เพื่อให้สอดคล้องกับ Project Convention
*   **การลบ CSS ที่ไม่จำเป็น**: ลบ CSS styles ที่เกี่ยวข้องกับการจัดสไตล์ตารางเดิมออกจาก `CustomerForm.module.css` และ `CustomerDetail.module.css` เนื่องจากตอนนี้การจัดสไตล์ตารางถูกจัดการโดย `RentToOwnTable.module.css`
*   **การแก้ไขข้อผิดพลาด `row.installment.includes is not a function`**: เพิ่มการตรวจสอบประเภทของ `row.installment` ใน `RentToOwnTable.js` ก่อนที่จะเรียกใช้เมธอด `includes()` เพื่อป้องกันข้อผิดพลาดเมื่อ `installment` เป็นตัวเลข
*   **การปรับปรุงการแสดงผลแถว "สิ้นงวด" ใน UI**: ปรับปรุง `RentToOwnTable.js` เพื่อให้แถว "สิ้นงวด" แสดง "–" แทนค่าติดลบในคอลัมน์ "ชำระเงินต้น" และแสดงยอดคงเหลือเงินต้นอย่างเหมาะสม เพื่อความเข้าใจง่ายของผู้ใช้

---

## 9. การปรับปรุงเพิ่มเติม (วันที่ 12 กรกฎาคม 2568)

ในเซสชันนี้ ได้มีการปรับปรุงและแก้ไขเพิ่มเติม ดังนี้:

### 9.1 การปรับปรุง Logic การคำนวณ Loanband และการแสดงผล

*   **เป้าหมาย:** แก้ไขปัญหาการคำนวณวงเงินกู้สูงสุดในตาราง Loanband ให้ถูกต้องตามมูลค่าทรัพย์สินหลังหักส่วนลด และปรับปรุงการแสดงผลใน UI ให้ตรงตาม UX/UI ที่ออกแบบไว้
*   **Backend (`server/index.js`):**
    *   **การแก้ไข `calculateLoanEstimation`:**
        *   **วิธีคิด:** เดิมฟังก์ชันนี้รับ `propertyValue` ซึ่งเป็นมูลค่าทรัพย์สินตั้งต้น ทำให้ `ltvLimit` (วงเงินสูงสุดที่จำกัดโดย LTV) คำนวณจากค่าที่ยังไม่หักส่วนลด ซึ่งไม่ถูกต้องตาม Requirement ใหม่
        *   **การดำเนินการ:** เปลี่ยน Parameter ของ `calculateLoanEstimation` จาก `propertyValue` เป็น `propertyPrice` และ `discount` แทน จากนั้นคำนวณ `propertyAfterDiscount = propertyPrice - discount` ภายในฟังก์ชัน และใช้ `propertyAfterDiscount` นี้ในการคำนวณ `ltvLimit` (`ltvLimit = propertyAfterDiscount * ltvPercentage`)
        *   **ผลลัพธ์:** วงเงินกู้สูงสุดที่คำนวณได้จะถูกจำกัดด้วยมูลค่าทรัพย์สินหลังหักส่วนลดอย่างถูกต้อง
    *   **การอัปเดตการเรียกใช้ฟังก์ชัน:**
        *   **วิธีคิด:** เมื่อเปลี่ยน Parameter ของ `calculateLoanEstimation` แล้ว ต้องอัปเดตการเรียกใช้ฟังก์ชันนี้ใน `app.post` และ `app.put` ให้ส่งค่า `propertyPrice` และ `discount` ที่ถูกต้องจาก `req.body` ไปยังฟังก์ชัน
        *   **การดำเนินการ:** แก้ไข `app.post` และ `app.put` ให้ส่ง `parseFloat(req.body.propertyPrice) || 0` และ `parseFloat(req.body.discount) || 0` ไปยัง `calculateLoanEstimation`
*   **Frontend (`client/src/components/CustomerDetail.js`):**
    *   **การปรับปรุงการแสดงผลตาราง Loanband:**
        *   **วิธีคิด:** ตาราง Loanband เดิมแสดงผลไม่ตรงตาม UX/UI ที่ต้องการ โดยเฉพาะเรื่องลำดับคอลัมน์และการจัดการค่าว่าง/N/A
        *   **การดำเนินการ:** ปรับปรุงการวนลูปในส่วน `<thead>` และ `<tbody>` ของตาราง "ประมาณการวงเงินที่จะสามารถกู้ได้" ให้ใช้ `loanTerms` ที่กำหนดไว้ (`[40, 30, 20, 10]`) เป็นหลักในการสร้างคอลัมน์และดึงข้อมูล เพื่อให้ลำดับคอลัมน์คงที่และถูกต้องเสมอ
        *   **การจัดการค่าว่าง/N/A:** เพิ่มเงื่อนไขการตรวจสอบ `amount === 'N/A' || amount === null || amount === undefined` เพื่อแสดงผลเป็น "-" แทนค่าที่ไม่ถูกต้องหรือไม่มีข้อมูล
        *   **การจัดรูปแบบตัวเลข:** ใช้ `formatNumber(amount)` เพื่อจัดรูปแบบตัวเลขให้มีเครื่องหมาย `,` คั่นหลักพันตามที่ต้องการ
        *   **ผลลัพธ์:** ตารางแสดงผลถูกต้องตาม UX/UI ที่ออกแบบไว้ ทั้งลำดับคอลัมน์ การจัดการค่าว่าง และการจัดรูปแบบตัวเลข

### 9.2 การปรับปรุงฟอร์มลูกค้า (CustomerForm.js)

*   **เป้าหมาย:** เพิ่มช่องกรอก LTV และยกเลิกการบังคับกรอกฟิลด์ "ระยะเวลาผ่อนที่แนะนำ (ปี)" และ "อัตราผ่อนที่แนะนำ (บาท/เดือน)"
*   **Frontend (`client/src/components/CustomerForm.js`):**
    *   **การเพิ่มช่องกรอก LTV:**
        *   **วิธีคิด:** ค่า LTV มีความสำคัญต่อการคำนวณ Loanband แต่ยังไม่มีช่องให้กรอกในฟอร์ม ทำให้ค่า LTV เป็น 0 เสมอเมื่อส่งไป Backend
        *   **การดำเนินการ:** เพิ่ม `<input type="number" name="ltv" ... required />` สำหรับ LTV (%) ในส่วนข้อมูลทรัพย์สินของฟอร์ม
        *   **ผลลัพธ์:** ผู้ใช้สามารถกรอกค่า LTV ได้ ทำให้การคำนวณ Loanband ที่ Backend ทำงานได้อย่างสมบูรณ์
    *   **การยกเลิก Mandatory Fields:**
        *   **วิธีคิด:** ฟิลด์ "ระยะเวลาผ่อนที่แนะนำ (ปี)" และ "อัตราผ่อนที่แนะนำ (บาท/เดือน)" ถูกกำหนดให้เป็น `required` ซึ่งอาจไม่จำเป็นเสมอไป
        *   **การดำเนินการ:** ลบ `required` attribute และ `<span>` ที่แสดงเครื่องหมาย `*` ออกจาก input fields ของ "ระยะเวลาผ่อนที่แนะนำ (ปี)" และ "อัตราผ่อนที่แนะนำ (บาท/เดือน)"
        *   **ผลลัพธ์:** ผู้ใช้สามารถบันทึกข้อมูลได้โดยไม่ต้องกรอกข้อมูลในฟิลด์เหล่านี้

### 9.3 การเพิ่มปุ่มนำทาง

*   **เป้าหมาย:** เพิ่มปุ่ม "กลับหน้าแรก" ในหน้าเพิ่ม/แก้ไขลูกค้า และหน้ารายละเอียดลูกค้า เพื่อปรับปรุง User Experience
*   **Frontend (`client/src/components/CustomerForm.js`):**
    *   **การเพิ่มปุ่ม "กลับหน้าแรก":**
        *   **วิธีคิด:** เพื่อให้ผู้ใช้สามารถกลับไปยังหน้า Dashboard ได้ง่ายขึ้นจากหน้าฟอร์ม
        *   **การดำเนินการ:** เพิ่ม `<button type="button" onClick={() => navigate('/')} className={styles.cancelButton}>กลับหน้าแรก</button>` ข้างปุ่ม "ยกเลิก"
        *   **ผลลัพธ์:** ผู้ใช้มีทางเลือกในการนำทางกลับหน้าแรกโดยตรง
*   **Frontend (`client/src/components/CustomerDetail.js`):**
    *   **การเพิ่มและย้ายปุ่ม "กลับหน้าแรก":**
        *   **วิธีคิด:** เพื่อให้ผู้ใช้สามารถกลับไปยังหน้า Dashboard ได้ง่ายขึ้นจากหน้ารายละเอียดลูกค้า และจัดวางปุ่มให้เหมาะสมกับ UI
        *   **การดำเนินการ:**
            *   เพิ่ม `<Link to="/" className={styles.editButton}>กลับหน้าแรก</Link>` ในส่วนท้ายของหน้า (ภายใน `div` ที่มี `className={styles.footerButtons}`)
            *   ลบปุ่ม "กลับหน้าแรก" ที่เคยอยู่ด้านบนของหน้าจอออก
        *   **ผลลัพธ์:** ปุ่ม "กลับหน้าแรก" แสดงผลที่ด้านล่างของหน้ารายละเอียดลูกค้า ทำให้ UI ดูเป็นระเบียบและใช้งานง่ายขึ้น

---

**จัดทำโดย:** Gemini CLI Agent
**วันที่:** 9 กรกฎาคม 2568
**อัปเดตล่าสุด:** 12 กรกฎาคม 2568
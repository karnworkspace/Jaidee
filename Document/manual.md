# คู่มือการรัน LIVNEX Consumer Advise Web Application

เอกสารนี้อธิบายขั้นตอนการรันส่วน Frontend (React Application) และ Backend (Node.js/Express.js) ของ LIVNEX Consumer Advise Web Application

---

## ข้อกำหนดเบื้องต้น

*   ติดตั้ง Node.js และ npm (หรือ yarn) บนเครื่องของคุณ

---

## 1. การรัน Backend Server

Backend Server ทำหน้าที่จัดการ API และข้อมูลของแอปพลิเคชัน

1.  **เปิด Terminal ใหม่:** เปิดหน้าต่าง Terminal หรือ Command Prompt ขึ้นมา
2.  **ไปยังโฟลเดอร์ Backend:** ใช้คำสั่ง `cd` เพื่อเข้าไปยังโฟลเดอร์ `server` ของโปรเจกต์
    ```bash
    cd /Users/nk-lamy/Desktop/GeminiCLI/Jaidee/livnex-consumer-advise-app/server
    ```
3.  **ติดตั้ง Dependencies (ครั้งแรกเท่านั้น):** หากคุณเพิ่ง Clone โปรเจกต์มา หรือเพิ่งลบ `node_modules` ไป ให้ติดตั้งแพ็คเกจที่จำเป็นก่อน
    ```bash
    npm install
    ```
4.  **รัน Server:**
    ```bash
    node index.js
    ```
    *   คุณควรจะเห็นข้อความ `Server listening at http://localhost:3001` ใน Terminal ซึ่งแสดงว่า Backend Server กำลังทำงานอยู่*

---

## 2. การรัน Frontend Application

Frontend Application คือส่วนที่คุณจะใช้งานผ่านเว็บเบราว์เซอร์

1.  **เปิด Terminal ใหม่:** เปิดหน้าต่าง Terminal หรือ Command Prompt ขึ้นมา (แยกจาก Terminal ที่รัน Backend)
2.  **ไปยังโฟลเดอร์ Frontend:** ใช้คำสั่ง `cd` เพื่อเข้าไปยังโฟลเดอร์ `client` ของโปรเจกต์
    ```bash
    cd /Users/nk-lamy/Desktop/GeminiCLI/Jaidee/livnex-consumer-advise-app/client
    ```
3.  **ติดตั้ง Dependencies (ครั้งแรกเท่านั้น):** หากคุณเพิ่ง Clone โปรเจกต์มา หรือเพิ่งลบ `node_modules` ไป ให้ติดตั้งแพ็คเกจที่จำเป็นก่อน
    ```bash
    npm install
    ```
4.  **รัน Application:**
    ```bash
    npm start
    ```
    *   คำสั่งนี้จะเปิดเว็บเบราว์เซอร์ขึ้นมาโดยอัตโนมัติ (โดยปกติคือ `http://localhost:3000`) และแสดงผลหน้า Dashboard ของแอปพลิเคชัน*

---

**หมายเหตุ:**

*   คุณต้องรัน **Backend Server ก่อนเสมอ** ก่อนที่จะรัน Frontend Application
*   หากคุณปิด Terminal ที่รัน Server หรือ Application อยู่ การทำงานของส่วนนั้นจะหยุดลง
*   ข้อมูลลูกค้าที่บันทึกใน Backend ตอนนี้จะหายไปเมื่อ Server ถูกปิดหรือ Restart เนื่องจากยังใช้ In-memory storage ในอนาคตจะมีการเชื่อมต่อกับฐานข้อมูลจริง

---

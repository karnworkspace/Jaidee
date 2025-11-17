# 📄 คู่มือการใช้งาน PDF Generator ใหม่

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. Backend (เสร็จสมบูรณ์ ✓)
- ✅ ติดตั้ง `puppeteer` ใน `server/package.json`
- ✅ สร้างไฟล์ `server/pdfGenerator.js` - สร้าง PDF จาก HTML template
- ✅ เพิ่ม API endpoint `/api/reports/generate-pdf` ใน `server/index.js` (บรรทัด 1546-1580)
- ✅ แก้ไข `server/Dockerfile` ให้รองรับ Puppeteer

### 2. Frontend (ต้องแก้ไขด้วยมือ)
- ✅ ลบ imports: `jsPDF` และ `html2canvas` จาก `client/src/components/ConsumerAdviseReport.js`
- ⚠️ ต้องแทนที่ฟังก์ชัน `handlePrint` (ดูขั้นตอนด้านล่าง)

---

## 🔧 ขั้นตอนการแก้ไข Frontend

### ไฟล์: `client/src/components/ConsumerAdviseReport.js`

**1. ลบ imports เก่า (บรรทัด 1-5):**
```javascript
// ❌ ลบบรรทัดนี้
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
```

**2. แทนที่ฟังก์ชัน `handlePrint` (บรรทัดประมาณ 140-489):**

ลบโค้ดเก่าทั้งหมดตั้งแต่:
```javascript
const handlePrint = async () => {
  // ... โค้ดเก่ายาวมาก (350 บรรทัด)
};
```

แทนที่ด้วยโค้ดใหม่จากไฟล์ [`client/src/components/ConsumerAdviseReport.new.js`](client/src/components/ConsumerAdviseReport.new.js)

หรือคัดลอกจากด้านล่าง:

```javascript
const handlePrint = async () => {
  try {
    if (!reportData) {
      alert('กรุณารอข้อมูลโหลดเสร็จก่อนพิมพ์');
      return;
    }

    // แสดงสถานะกำลังพิมพ์
    const printButton = document.querySelector('.printButton');
    if (printButton) {
      printButton.textContent = '🖨️ กำลังสร้าง PDF...';
      printButton.disabled = true;
    }

    // เตรียมข้อมูลสำหรับส่งไป Backend
    const pdfData = {
      ...reportData,
      selectedInstallment,
      additionalNotes,
      debtLimit: parseInt(debtLimit),
      loanTermAfter: parseInt(loanTermAfter)
    };

    // เรียก Backend API
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'http://backend:3001/api/reports/generate-pdf'  // ใน Docker network
      : 'http://localhost:3001/api/reports/generate-pdf'; // Local development

    const response = await authenticatedFetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify(pdfData)
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // รับ PDF blob จาก response
    const blob = await response.blob();

    // สร้าง download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `รายงาน_Consumer_Advise_${customerData?.name || 'Report'}_${new Date().toLocaleDateString('th-TH')}.pdf`;
    link.download = fileName;

    // คลิกเพื่อดาวน์โหลด
    document.body.appendChild(link);
    link.click();

    // ลบ link
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert('✅ สร้าง PDF เรียบร้อยแล้ว!\n\nไฟล์: ' + fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('❌ เกิดข้อผิดพลาดในการสร้าง PDF\n\nError: ' + error.message);
  } finally {
    // รีเซ็ตปุ่ม
    const printButton = document.querySelector('.printButton');
    if (printButton) {
      printButton.textContent = '🖨️ พิมพ์ Report';
      printButton.disabled = false;
    }
  }
};
```

---

## 🐳 การ Build และ Run ด้วย Docker

### 1. Stop containers เดิม
```bash
docker-compose down
```

### 2. Rebuild images (ต้องทำเพราะ Dockerfile เปลี่ยน)
```bash
docker-compose build --no-cache
```

### 3. Start containers ใหม่
```bash
docker-compose up -d
```

### 4. ตรวจสอบ logs
```bash
# ดู logs ของ backend
docker-compose logs -f backend

# ดู logs ของ frontend
docker-compose logs -f frontend
```

---

## 🧪 การทดสอบ

### 1. เข้าใช้งานระบบ
```
http://localhost:3000
```

### 2. ทดสอบสร้าง PDF
1. เลือกลูกค้า
2. กดปุ่ม "พิมพ์ Report"
3. PDF จะถูกสร้างโดย Backend (Puppeteer)
4. ไฟล์ PDF จะดาวน์โหลดอัตโนมัติ
5. **ตรวจสอบ**: ขนาดไฟล์ควรพอดี A4 ไม่เกินขอบ

---

## 🔍 Troubleshooting

### ปัญหา: PDF ไม่ถูกสร้าง
**วิธีแก้:**
```bash
# ตรวจสอบ logs ของ backend
docker-compose logs backend | grep -i "pdf\|error\|puppeteer"
```

### ปัญหา: Puppeteer ไม่ทำงาน
**วิธีแก้:**
```bash
# เข้าไปใน backend container
docker exec -it jaidee-backend sh

# ตรวจสอบว่า dependencies ติดตั้งครบ
ls -la /usr/lib | grep -i chrome

# ทดสอบ puppeteer
node -e "const puppeteer = require('puppeteer'); console.log('Puppeteer OK')"
```

### ปัญหา: CORS Error
**วิธีแก้:**
ตรวจสอบว่า Frontend เรียก API ถูกต้อง:
- Production: `http://backend:3001` (ใน Docker network)
- Development: `http://localhost:3001` (Local)

---

## 📊 ข้อดีของวิธีใหม่

✅ **PDF ขนาดพอดี A4** - ใช้ Puppeteer ตั้งค่าได้แม่นยำ
✅ **ไม่ต้องพึ่ง Browser** - Backend สร้าง PDF ให้
✅ **ประสิทธิภาพดีขึ้น** - ไม่ต้อง render ใน Browser
✅ **รองรับฟอนต์ไทย** - Puppeteer ติดตั้งฟอนต์ได้
✅ **Scalable** - Backend สามารถ scale ได้อิสระ

---

## 📝 สรุป

### ✅ Backend: พร้อมใช้งาน
- Dockerfile แก้ไขแล้ว
- API endpoint พร้อมแล้ว
- PDF Generator พร้อมแล้ว

### ⚠️ Frontend: ต้องแก้ไขด้วยมือ
1. ลบ imports: `jsPDF`, `html2canvas`
2. แทนที่ฟังก์ชัน `handlePrint`
3. Rebuild Docker containers

### 🚀 ขั้นตอนถัดไป
```bash
# 1. แก้ไข Frontend (ตามขั้นตอนด้านบน)
# 2. Rebuild และ Start
docker-compose down
docker-compose build --no-cache
docker-compose up -d
# 3. ทดสอบ
open http://localhost:3000
```

---

**สร้างโดย**: Claude Code
**วันที่**: 12/11/2568

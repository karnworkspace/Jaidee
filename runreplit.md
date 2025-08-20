# runreplit.md
## คู่มือการ Import Branch จาก GitHub แล้วรัน `client + server` พร้อมกันใน Replit

---

## ✅ STEP 1: เตรียม Repository บน GitHub

- ให้โครงสร้างโปรเจกต์มีลักษณะ:

```
/
├── client/        # React app
├── server/        # Node.js backend
├── package.json   # ระดับ root
└── .replit
```

- ให้ branch ที่ต้องการใช้งานชื่อว่า `jaideev2` (หรือชื่ออื่นที่ต้องการ)

---

## ✅ STEP 2: Import Repo เข้า Replit

1. ไปที่ [Replit.com](https://replit.com/)
2. เลือก `+ Create` → `Import from GitHub`
3. วาง URL repo เช่น:

```
https://github.com/karnworkspace/Jaidee
```

4. กด `Import` (Replit จะ import เฉพาะ default branch: `main`)

---

## ✅ STEP 3: สลับไปยัง Branch ที่ต้องการ

หลัง import เสร็จ ให้เปิด **Shell** แล้วพิมพ์:

```bash
git fetch origin
git checkout jaideev2
```

> หากเจอ error เช่น “not a git repo” ให้รันชุดนี้แทน:

```bash
git init
git remote add origin https://github.com/karnworkspace/Jaidee.git
git fetch origin
git checkout -b jaideev2 origin/jaideev2
```

---

## ✅ STEP 4: ติดตั้ง Dependencies

### ติดตั้งใน client:

```bash
cd client
npm install
```

### ติดตั้งใน server:

```bash
cd ../server
npm install
```

---

## ✅ STEP 5: เพิ่ม script ให้รันพร้อมกัน

### เปิดไฟล์ `package.json` ใน root แล้วใส่:

```json
{
  "name": "jaidee-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start:all": "concurrently \"npm start --prefix client\" \"npm run dev --prefix server\""
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

---

## ✅ STEP 6: เพิ่ม script ให้ฝั่ง server

### เปิด `server/package.json` แล้วเพิ่มใน `scripts`:

```json
"scripts": {
  "dev": "node index.js"
}
```

> แก้ชื่อไฟล์ `index.js` ให้ตรงกับของคุณ ถ้าใช้ชื่ออื่น เช่น `server.js` ให้แก้ `"dev"` ให้ตรง

---

## ✅ STEP 7: ติดตั้ง concurrently

กลับไป Shell ที่ root แล้วพิมพ์:

```bash
npm install concurrently --save-dev
```

---

## ✅ STEP 8: ตั้งค่า `.replit`

เปิดไฟล์ `.replit` แล้วแก้เป็น:

```ini
modules = ["nodejs-20", "web"]

run = "npm run start:all"

[nix]
channel = "stable-25_05"
```

---

## ✅ STEP 9: กด ▶️ `Run` ที่ปุ่มด้านบน

ระบบจะ:
- รัน React app ที่ `client`
- รัน Node.js API ที่ `server`
- ทุกอย่างแสดงผลพร้อมกันใน Console

---

## 🎉 เสร็จสิ้น พร้อมใช้งานแล้ว!

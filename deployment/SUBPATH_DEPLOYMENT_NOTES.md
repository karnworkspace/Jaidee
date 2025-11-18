# 📝 Jaidee Subpath Deployment Configuration

## สรุปการ Deploy บน Production Server

**Production URL:** http://167.179.239.122/jaidee
**Server:** 172.22.22.11 (Ubuntu 24.04.3 LTS)
**Deployment Date:** 18/11/2568

---

## 🎯 Architecture Overview

```
Internet (167.179.239.122)
    ↓
[Firewall - UFW]
    ↓
[Nginx :80] - Reverse Proxy
    ↓
    ├─ / → SENA App (port 3000)
    └─ /jaidee → Jaidee App
           ├─ /jaidee → Frontend Container :3100 (React)
           └─ /jaidee/api → Backend Container :3101 (Node.js + Puppeteer)
```

---

## 📂 สิ่งที่ต้องแก้ไขเพื่อรองรับ Subpath `/jaidee`

### 1. Frontend Configuration

#### `client/package.json`
```json
{
  "homepage": "/jaidee",
  "scripts": {
    "build": "PUBLIC_URL=/jaidee react-scripts build"
  }
}
```

#### `client/src/App.js`
```javascript
<Router basename="/jaidee">
  <AuthProvider>
    <AppContent />
  </AuthProvider>
</Router>
```

#### `client/src/config/api.js`
```javascript
// API Configuration
const API_BASE_URL = "/jaidee";

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  ME: `${API_BASE_URL}/api/auth/me`,
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  CUSTOMER_BY_ID: (id) => `${API_BASE_URL}/api/customers/${id}`,
  BANK_RULES: `${API_BASE_URL}/api/bank-rules`,
  BANK_RULE_BY_CODE: (code) => `${API_BASE_URL}/api/bank-rules/${code}`,
  PROBLEMS_CATEGORIES: `${API_BASE_URL}/api/problems/categories`,
  PROBLEMS_OTHER: `${API_BASE_URL}/api/problems/other`,
  PROBLEMS_DETAILS: (category) =>
    `${API_BASE_URL}/api/problems/details/${encodeURIComponent(category)}`,
  PROBLEMS_SOLUTION: (category, detail) =>
    `${API_BASE_URL}/api/problems/solution/${encodeURIComponent(category)}/${encodeURIComponent(detail)}`,
  PROBLEMS_OTHER_SOLUTION: (problem) =>
    `${API_BASE_URL}/api/problems/other-solution/${encodeURIComponent(problem)}`,
  REPORTS: `${API_BASE_URL}/api/reports`,
  REPORT_BY_CUSTOMER: (customerId) =>
    `${API_BASE_URL}/api/reports/${customerId}`,
};
```

**หมายเหตุ:** ห้าม hardcode URL เป็น `https://jaidee-backend.onrender.com` หรือ `http://localhost:3001` ใน production code

### 2. Component Files ที่ต้องใช้ API_ENDPOINTS

ไฟล์เหล่านี้ต้อง import และใช้ `API_ENDPOINTS` จาก config:

```javascript
import { API_ENDPOINTS } from '../config/api';
```

**ไฟล์ที่แก้ไข:**
- ✅ `client/src/components/LoanProblemSelector.js`
- ✅ `client/src/components/CustomerForm.js`
- ✅ `client/src/components/ConsumerAdviseReport.js`
- ✅ `client/src/components/BankAdmin.js`
- ✅ `client/src/contexts/AuthContext.js` (ใช้ LOGIN, LOGOUT, ME endpoints)

### 3. Backend Configuration

#### `server/Dockerfile`
เพิ่ม Thai fonts สำหรับ PDF generation:
```dockerfile
RUN apt-get update && apt-get install -y \
    fonts-thai-tlwg \
    fonts-noto-cjk \
    # ... other dependencies
```

### 4. Docker Compose Configuration

#### `deployment/docker-compose.production.yml`
```yaml
services:
  backend:
    container_name: jaidee-backend-prod
    ports:
      - "3101:3001"  # เปลี่ยนจาก 3001 เป็น 3101 เพื่อไม่ชนกับ SENA
    networks:
      - jaidee-network

  frontend:
    container_name: jaidee-frontend-prod
    ports:
      - "3100:80"    # เปลี่ยนจาก 3000 เป็น 3100 เพื่อไม่ชนกับ SENA
    networks:
      - jaidee-network
```

### 5. Nginx Configuration

#### `deployment/nginx-multi-app.conf`
```nginx
server {
    listen 80;
    server_name 167.179.239.122;

    # SENA Application (Root Path)
    location / {
        proxy_pass http://localhost:3000;
        # ... proxy settings
    }

    # Jaidee Frontend (path: /jaidee)
    location /jaidee {
        rewrite ^/jaidee(/.*)$ $1 break;
        rewrite ^/jaidee$ / break;
        proxy_pass http://localhost:3100;
        proxy_set_header X-Forwarded-Prefix /jaidee;
    }

    # Jaidee API (path: /jaidee/api)
    location /jaidee/api {
        limit_req zone=api_limit burst=20 nodelay;
        rewrite ^/jaidee(/api.*)$ $1 break;
        proxy_pass http://localhost:3101;

        # Increased timeout for PDF generation
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

---

## 🔄 Deployment Workflow

### Initial Setup (ครั้งแรกเท่านั้น)

```bash
# 1. Upload code to server
cd /Users/nk-lamy/Desktop/Coding/jaidee/jaideevreport
rsync -avz --exclude 'node_modules' ./ admindigital@172.22.22.11:~/jaidee-app/

# 2. SSH to server
ssh admindigital@172.22.22.11

# 3. Build and run containers
cd ~/jaidee-app
docker compose -f deployment/docker-compose.production.yml build --no-cache
docker compose -f deployment/docker-compose.production.yml up -d

# 4. Setup Nginx (if not done)
sudo cp ~/jaidee-app/deployment/nginx-multi-app.conf /etc/nginx/sites-available/jaidee
sudo ln -s /etc/nginx/sites-available/jaidee /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Code Update Workflow

```bash
# จาก Mac - push code
git add -A
git commit -m "Update message"
git push origin main

# บน Production Server
ssh admindigital@172.22.22.11
cd ~/jaidee-app
git pull origin main

# Rebuild only changed service
docker compose -f deployment/docker-compose.production.yml stop frontend
docker compose -f deployment/docker-compose.production.yml build frontend --no-cache
docker compose -f deployment/docker-compose.production.yml up -d

# หรือ rebuild ทั้งหมด
docker compose -f deployment/docker-compose.production.yml down
docker compose -f deployment/docker-compose.production.yml build --no-cache
docker compose -f deployment/docker-compose.production.yml up -d
```

---

## 🐛 Common Issues และวิธีแก้

### ปัญหา: Static files (CSS/JS) ไม่โหลด

**อาการ:** MIME type errors ใน console
```
Refused to apply style from 'http://167.179.239.122/static/css/main.css'
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

**สาเหตุ:** React app ไม่รู้ว่ากำลังรันอยู่ที่ subpath `/jaidee`

**วิธีแก้:**
1. ตรวจสอบ `package.json` มี `"homepage": "/jaidee"`
2. ตรวจสอบ build script ใช้ `PUBLIC_URL=/jaidee`
3. Rebuild frontend container

### ปัญหา: API calls ได้ 404 Not Found

**อาการ:**
```
POST http://167.179.239.122/api/auth/login 404 (Not Found)
```

**สาเหตุ:** API endpoint ไม่มี prefix `/jaidee`

**วิธีแก้:**
1. ตรวจสอบว่าใช้ `API_ENDPOINTS` จาก `config/api.js`
2. ห้าม hardcode URL ใน component
3. ตรวจสอบว่า `API_BASE_URL = "/jaidee"`

### ปัญหา: CORS errors

**อาการ:**
```
Access to fetch at 'https://jaidee-backend.onrender.com/api/...'
from origin 'http://167.179.239.122' has been blocked by CORS policy
```

**สาเหตุ:** Code ยังเรียก external domain แทนที่จะเรียกผ่าน Nginx proxy

**วิธีแก้:**
1. ค้นหา hardcoded URLs ทั้งหมด:
   ```bash
   grep -r "jaidee-backend.onrender.com" client/src/
   grep -r "localhost:3001" client/src/
   ```
2. แทนที่ด้วย `API_ENDPOINTS`
3. Rebuild frontend

### ปัญหา: Thai fonts ไม่แสดงใน PDF

**สาเหตุ:** Docker container ไม่มี Thai fonts

**วิธีแก้:**
1. ตรวจสอบ `server/Dockerfile` มี fonts packages:
   ```dockerfile
   fonts-thai-tlwg
   fonts-noto-cjk
   ```
2. Rebuild backend container:
   ```bash
   docker compose -f deployment/docker-compose.production.yml build backend --no-cache
   ```

### ปัญหา: Router ทำงานผิดพลาด

**อาการ:** กด refresh หรือ direct URL ใด ๆ ได้ 404

**สาเหตุ:** React Router ไม่มี `basename` หรือ Nginx config ผิด

**วิธีแก้:**
1. ตรวจสอบ `App.js` มี `basename="/jaidee"`
2. ตรวจสอบ Nginx config มี rewrite rules ถูกต้อง

---

## 📊 Monitoring Commands

### ตรวจสอบ Containers
```bash
docker ps
docker compose -f deployment/docker-compose.production.yml logs -f
docker stats
```

### ตรวจสอบ Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/multi-app-access.log
sudo tail -f /var/log/nginx/multi-app-error.log
```

### ตรวจสอบ Network
```bash
# ทดสอบ frontend local
curl http://localhost:3100

# ทดสอบ backend local
curl http://localhost:3101/api/health

# ทดสอบ frontend ผ่าน Nginx
curl http://167.179.239.122/jaidee

# ทดสอบ API ผ่าน Nginx
curl http://167.179.239.122/jaidee/api/health
```

### ใช้ Monitoring Script
```bash
cd ~/jaidee-app/deployment
./monitoring.sh
```

---

## 🔒 Security Features

- ✅ UFW Firewall เปิดเฉพาะ ports 22, 80, 443
- ✅ Nginx rate limiting (API: 10 req/s, General: 30 req/s)
- ✅ Security headers (XSS, Clickjacking protection)
- ✅ Containers isolated in private network
- ✅ Authentication required for all API endpoints

---

## 📞 Important URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://167.179.239.122/jaidee |
| **API Health** | http://167.179.239.122/jaidee/api/health |
| **Login** | http://167.179.239.122/jaidee (auto redirects) |
| **SENA App** | http://167.179.239.122 |

---

## 🎉 Verified Working Features

- ✅ Login/Logout with JWT authentication
- ✅ Dashboard - list all customers
- ✅ Customer Form - create/edit customers
- ✅ Loan Problem Selector - load categories and problems
- ✅ PDF Report Generation with Thai fonts
- ✅ Report data persistence in database
- ✅ Bank Admin - manage bank rules
- ✅ Rent-to-Own calculator
- ✅ All API endpoints working through Nginx proxy

---

## 📝 Notes for Future Development

### เมื่อเพิ่ม API Endpoint ใหม่

1. เพิ่ม endpoint ใน `client/src/config/api.js`:
   ```javascript
   export const API_ENDPOINTS = {
     // ... existing endpoints
     NEW_ENDPOINT: `${API_BASE_URL}/api/new-endpoint`,
   };
   ```

2. ใช้ใน component:
   ```javascript
   import { API_ENDPOINTS } from '../config/api';

   const response = await authenticatedFetch(API_ENDPOINTS.NEW_ENDPOINT);
   ```

3. **ห้าม** hardcode URL:
   ```javascript
   // ❌ ผิด
   fetch('https://jaidee-backend.onrender.com/api/new-endpoint')
   fetch('http://localhost:3001/api/new-endpoint')
   fetch('/api/new-endpoint')

   // ✅ ถูก
   authenticatedFetch(API_ENDPOINTS.NEW_ENDPOINT)
   ```

### การ Test บน Local Development

เมื่อพัฒนาบน local และต้องการ test ที่ `localhost:3000` (root path):

1. เปลี่ยน `client/package.json`:
   ```json
   "scripts": {
     "start": "react-scripts start",
     "build": "react-scripts build"
   }
   ```

2. เปลี่ยน `client/src/config/api.js`:
   ```javascript
   const API_BASE_URL = ""; // empty for local dev
   ```

3. เปลี่ยน `client/src/App.js`:
   ```javascript
   <Router> {/* no basename */}
   ```

4. หรือใช้ environment variable:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_BASE_PATH || "";
   ```

---

## 🔗 Related Files

- `deployment/docker-compose.production.yml` - Production container config
- `deployment/nginx-multi-app.conf` - Nginx reverse proxy config
- `deployment/DEPLOYMENT_GUIDE.md` - Full deployment guide
- `deployment/PRODUCTION_SUMMARY.md` - Quick reference
- `deployment/monitoring.sh` - System monitoring script
- `deployment/troubleshooting.sh` - Troubleshooting script

---

**Created by:** Claude Code
**Last Updated:** 18/11/2568
**Production Server:** 167.179.239.122 (NAT from 172.22.22.11)
**Status:** ✅ Successfully Deployed and Running

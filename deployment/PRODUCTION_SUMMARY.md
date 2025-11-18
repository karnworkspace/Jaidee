# 🚀 สรุป Production Deployment

## 📊 ข้อมูล Server
- **Public IP:** `167.179.239.122`
- **Internal IP:** `172.22.22.11`
- **OS:** Ubuntu 24.04.3 LTS
- **Access:** `http://167.179.239.122`

---

## 🎯 สิ่งที่ต้องทำ (Quick Start)

### 1️⃣ Upload Code ขึ้น Server
```bash
# จาก Mac
cd /Users/nk-lamy/Desktop/Coding/jaidee/jaideevreport
rsync -avz --exclude 'node_modules' ./ admindigital@172.22.22.11:~/jaidee-app/
```

### 2️⃣ Setup Firewall (ครั้งแรกเท่านั้น)
```bash
ssh admindigital@172.22.22.11
cd ~/jaidee-app/deployment
chmod +x firewall-setup.sh
sudo ./firewall-setup.sh
```

### 3️⃣ Build & Run Docker
```bash
cd ~/jaidee-app
docker compose -f deployment/docker-compose.production.yml build --no-cache
docker compose -f deployment/docker-compose.production.yml up -d
```

### 4️⃣ Setup Nginx (ครั้งแรกเท่านั้น)
```bash
sudo apt install nginx -y
sudo cp ~/jaidee-app/deployment/nginx-jaidee-public.conf /etc/nginx/sites-available/jaidee
sudo ln -s /etc/nginx/sites-available/jaidee /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5️⃣ ทดสอบ
```bash
# จาก Browser
http://167.179.239.122
```

---

## 📁 ไฟล์ Deployment ที่สำคัญ

| ไฟล์ | ใช้ทำอะไร |
|------|-----------|
| `check-server.sh` | ตรวจสอบความพร้อมของ server |
| `docker-compose.production.yml` | Configuration สำหรับ production |
| `nginx-jaidee-public.conf` | Nginx config สำหรับ public IP |
| `firewall-setup.sh` | Setup UFW firewall อัตโนมัติ |
| `ssl-setup.sh` | Setup SSL certificate (domain หรือ self-signed) |
| `monitoring.sh` | ตรวจสอบสถานะระบบ |
| `DEPLOYMENT_GUIDE.md` | คู่มือครบวงจร |

---

## 🔒 Security Features

### ✅ Firewall (UFW)
- Port 22 (SSH) - เปิด + rate limiting
- Port 80 (HTTP) - เปิด
- Port 443 (HTTPS) - เปิด
- Ports อื่นๆ - ปิดทั้งหมด

### ✅ Nginx Security
- Rate limiting (API: 10 req/s, General: 30 req/s)
- Security headers (XSS, Clickjacking protection)
- Hide nginx version
- Block sensitive files access

### ✅ Docker Security
- Containers isolated in private network
- Only exposed ports: 3000, 3001
- Data persistence outside containers

---

## 📊 Monitoring

### ใช้ Monitoring Script
```bash
cd ~/jaidee-app/deployment
./monitoring.sh
```

**แสดงข้อมูล:**
- Container status
- CPU/Memory usage
- Disk space
- Network connectivity
- Recent errors
- SSL expiry

### Auto Monitoring (Optional)
```bash
crontab -e
# เพิ่ม:
*/5 * * * * ~/jaidee-app/deployment/monitoring.sh >> ~/jaidee-monitoring.log
```

---

## 🔄 Update Code

### วิธีที่ 1: Git Pull (แนะนำ)
```bash
ssh admindigital@172.22.22.11
cd ~/jaidee-app
git pull origin main
docker compose -f deployment/docker-compose.production.yml down
docker compose -f deployment/docker-compose.production.yml build --no-cache
docker compose -f deployment/docker-compose.production.yml up -d
```

### วิธีที่ 2: Rsync
```bash
# จาก Mac
rsync -avz --exclude 'node_modules' ./ admindigital@172.22.22.11:~/jaidee-app/

# SSH เข้าไป restart
ssh admindigital@172.22.22.11 "cd ~/jaidee-app && docker compose -f deployment/docker-compose.production.yml restart"
```

---

## 🌐 SSL Certificate (Optional)

### ถ้ามี Domain
1. Point domain A record → 167.179.239.122
2. รัน `sudo ./ssl-setup.sh` เลือกตัวเลือก 1
3. Uncomment HTTPS block ใน nginx config

### ถ้าไม่มี Domain
1. รัน `sudo ./ssl-setup.sh` เลือกตัวเลือก 2
2. จะได้ self-signed certificate
3. Browser จะเตือน (กด Advanced → Proceed)

---

## 🐛 Troubleshooting

### ปัญหา: เข้าเว็บไม่ได้
```bash
# ตรวจสอบ containers
docker ps

# ดู logs
docker compose -f deployment/docker-compose.production.yml logs -f

# ตรวจสอบ Nginx
sudo systemctl status nginx
sudo nginx -t
```

### ปัญหา: API ไม่ทำงาน
```bash
# ตรวจสอบ backend
docker logs jaidee-backend-prod

# ทดสอบ API
curl http://localhost:3001/api/health
```

### ปัญหา: Port ถูกใช้งาน
```bash
# หา process ที่ใช้ port
sudo netstat -tulpn | grep -E ":(80|443|3000|3001)"

# หยุด process
sudo kill -9 <PID>
```

---

## 📞 URLs

| Service | URL |
|---------|-----|
| Frontend | http://167.179.239.122 |
| API | http://167.179.239.122/api |
| API Health | http://167.179.239.122/api/health |

---

## ✅ Checklist

หลัง Deploy ครั้งแรก ให้ตรวจสอบ:

- [ ] Firewall enabled (port 22, 80, 443 เปิดอยู่)
- [ ] Docker containers running (2 containers)
- [ ] Nginx running and configured
- [ ] Frontend accessible via public IP
- [ ] API responding (test /api/health)
- [ ] PDF generation working (Thai fonts)
- [ ] Monitoring script working
- [ ] SSL certificate (ถ้ามี domain)

---

## 🎉 สรุป

**Deployment Architecture:**
```
Internet (167.179.239.122)
    ↓
[Firewall - UFW]
    ↓
[Nginx :80/:443] - Reverse Proxy
    ↓
    ├─ / → Frontend Container :3000 (React)
    └─ /api → Backend Container :3001 (Node.js + Puppeteer)
```

**Features:**
- ✅ PDF generation with Thai fonts
- ✅ Firewall protection
- ✅ Rate limiting
- ✅ Auto-restart containers
- ✅ Data persistence
- ✅ Monitoring scripts
- ✅ SSL ready

---

**สร้างโดย:** Claude Code
**วันที่:** 17/11/2568
**Public Access:** http://167.179.239.122

# 🚀 คู่มือการ Deploy ขึ้น Production Server

## 📋 ข้อมูล Production Server
- **Internal IP:** 172.22.22.11
- **Public IP:** 167.179.239.122 (NAT)
- **OS:** Ubuntu 24.04.3 LTS
- **SSH User:** admindigital
- **SSH Command:** `ssh admindigital@172.22.22.11`
- **Public Access:** `http://167.179.239.122` (หลังจาก setup Nginx)

---

## 🔍 ขั้นตอนที่ 1: ตรวจสอบ Production Server

### 1.1 SSH เข้า Server
```bash
ssh admindigital@172.22.22.11
```

### 1.2 ตรวจสอบระบบ
```bash
# Download check script จาก local (รันจาก Mac)
scp deployment/check-server.sh admindigital@172.22.22.11:~/
```

```bash
# รันบน Production Server
cd ~
chmod +x check-server.sh
./check-server.sh
```

### 1.3 ตรวจสอบสิ่งที่ต้องมี
- ✅ Docker version 20.x ขึ้นไป
- ✅ Docker Compose v2.x ขึ้นไป
- ✅ Nginx ติดตั้งแล้ว (หรือจะติดตั้งใหม่)
- ✅ Port 80, 443 ว่าง (หรือ Nginx ใช้งานอยู่)
- ✅ Disk space เพียงพอ (แนะนำอย่างน้อย 10GB ว่าง)

---

## 📦 ขั้นตอนที่ 2: Upload Code ขึ้น Production

### 2.1 สร้าง Directory บน Server
```bash
# รันบน Production Server
mkdir -p ~/jaidee-app
cd ~/jaidee-app
```

### 2.2 Upload ทั้งโปรเจค (รันจาก Mac)

**วิธีที่ 1: ใช้ rsync (แนะนำ)**
```bash
# จาก Mac (ที่ directory โปรเจค)
cd /Users/nk-lamy/Desktop/Coding/jaidee/jaideevreport

# Sync ทั้งโปรเจค (ยกเว้น node_modules)
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'client/build' \
  --exclude 'server/data' \
  ./ admindigital@172.22.22.11:~/jaidee-app/
```

**วิธีที่ 2: ใช้ Git (หาก server เข้าถึง GitHub ได้)**
```bash
# รันบน Production Server
cd ~/jaidee-app
git clone https://github.com/karnworkspace/Jaidee.git .
```

### 2.3 ตรวจสอบไฟล์
```bash
# รันบน Production Server
cd ~/jaidee-app
ls -la
```

---

## 🐳 ขั้นตอนที่ 3: Build และ Run Docker

### 3.1 Copy Production Docker Compose
```bash
# รันบน Production Server
cd ~/jaidee-app
cp deployment/docker-compose.production.yml docker-compose.yml
```

### 3.2 Build Images
```bash
# Build backend (จะใช้เวลาพอสมควรเพราะต้องติดตั้ง Thai fonts)
docker compose build backend --no-cache

# Build frontend
docker compose build frontend --no-cache
```

### 3.3 Run Containers
```bash
# Start containers
docker compose up -d

# ตรวจสอบ logs
docker compose logs -f backend
docker compose logs -f frontend
```

### 3.4 ทดสอบ
```bash
# ทดสอบ Backend API
curl http://localhost:3001/api/health

# ทดสอบ Frontend
curl http://localhost:3000
```

---

## 🔒 ขั้นตอนที่ 4: Setup Firewall (Security)

### 4.1 Upload Firewall Script
```bash
# จาก Mac
scp deployment/firewall-setup.sh admindigital@172.22.22.11:~/jaidee-app/deployment/
```

### 4.2 Run Firewall Setup
```bash
# SSH เข้า server
ssh admindigital@172.22.22.11

# Run script
cd ~/jaidee-app/deployment
chmod +x firewall-setup.sh
sudo ./firewall-setup.sh
```

**Script จะทำอะไร:**
- ✅ ติดตั้ง UFW (Uncomplicated Firewall)
- ✅ อนุญาต Port 22 (SSH) พร้อม rate limiting
- ✅ อนุญาต Port 80 (HTTP)
- ✅ อนุญาต Port 443 (HTTPS)
- ✅ ปิด Ports อื่นๆ ทั้งหมด
- ✅ เปิดใช้งาน Firewall

### 4.3 ตรวจสอบ Firewall Status
```bash
sudo ufw status verbose
```

---

## 🌐 ขั้นตอนที่ 5: Setup Nginx

### 4.1 ตรวจสอบ Nginx
```bash
# ตรวจสอบว่ามี Nginx หรือยัง
which nginx

# ถ้ายังไม่มี ให้ติดตั้ง
sudo apt update
sudo apt install nginx -y

# ตรวจสอบสถานะ
sudo systemctl status nginx
```

### 5.2 สร้าง Nginx Config
```bash
# Copy config file สำหรับ Public IP
sudo cp ~/jaidee-app/deployment/nginx-jaidee-public.conf /etc/nginx/sites-available/jaidee

# ตรวจสอบ config
sudo nano /etc/nginx/sites-available/jaidee
# ตรวจสอบว่า server_name เป็น 167.179.239.122
```

### 4.3 Enable Site
```bash
# สร้าง symlink
sudo ln -s /etc/nginx/sites-available/jaidee /etc/nginx/sites-enabled/

# ทดสอบ config
sudo nginx -t

# ถ้า OK ให้ reload
sudo systemctl reload nginx
```

### 4.4 เปิด Firewall (ถ้ามี)
```bash
# Ubuntu UFW
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

---

---

## 🔒 ขั้นตอนที่ 6: Setup SSL (Optional แต่แนะนำ)

### ⚠️ หมายเหตุสำคัญ
Let's Encrypt ไม่สามารถออก SSL certificate สำหรับ IP address ได้
มี 2 ตัวเลือก:

**ตัวเลือกที่ 1: ใช้ Domain Name (แนะนำ)**
- ซื้อ domain (เช่น jaidee.livnex.co)
- Point A record ไปที่ 167.179.239.122
- ใช้ Let's Encrypt ออก SSL ฟรี

**ตัวเลือกที่ 2: ใช้ Self-Signed Certificate**
- สร้าง SSL certificate เอง
- Browser จะเตือนว่าไม่ปลอดภัย
- ใช้ได้กับ internal/testing

### วิธีใช้ Script (รองรับทั้ง 2 ตัวเลือก)

### 6.1 Upload SSL Script
```bash
# จาก Mac
scp deployment/ssl-setup.sh admindigital@172.22.22.11:~/jaidee-app/deployment/
```

### 6.2 Run SSL Setup
```bash
# SSH เข้า server
ssh admindigital@172.22.22.11

# Run script
cd ~/jaidee-app/deployment
chmod +x ssl-setup.sh
sudo ./ssl-setup.sh
```

**Script จะถามให้เลือก:**
- `1` = Domain-based SSL (ต้องมี domain)
- `2` = Self-Signed Certificate (ไม่ต้องมี domain)
- `0` = ยกเลิก

### 6.3 หลังจาก Setup SSL
```bash
# แก้ไข Nginx config ให้เปิดใช้ HTTPS
sudo nano /etc/nginx/sites-available/jaidee

# Uncomment ส่วน HTTPS server block
# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

---

## 📊 ขั้นตอนที่ 7: Monitoring และดูแลระบบ

### 7.1 Upload Monitoring Script
```bash
# จาก Mac
scp deployment/monitoring.sh admindigital@172.22.22.11:~/jaidee-app/deployment/
```

### 7.2 ใช้ Monitoring Script
```bash
# SSH เข้า server
ssh admindigital@172.22.22.11

# Run monitoring
cd ~/jaidee-app/deployment
chmod +x monitoring.sh
./monitoring.sh
```

**Script จะแสดง:**
- ✅ Docker containers status
- ✅ CPU และ Memory usage
- ✅ Disk space
- ✅ Network connectivity
- ✅ Recent logs (errors)
- ✅ Nginx status
- ✅ SSL certificate expiry

### 7.3 ตั้ง Cron Job สำหรับ Auto-monitoring
```bash
# Edit crontab
crontab -e

# เพิ่มบรรทัดนี้ (ตรวจสอบทุก 5 นาที และบันทึก log)
*/5 * * * * ~/jaidee-app/deployment/monitoring.sh >> ~/jaidee-monitoring.log 2>&1
```

---

## 🎯 ขั้นตอนที่ 8: ตรวจสอบและทดสอบ

### 6.1 ตรวจสอบ Containers
```bash
docker ps
docker compose logs -f
```

### 6.2 ตรวจสอบ Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/jaidee-access.log
```

### 8.3 ทดสอบจาก Browser
```
# ทดสอบจาก Public IP
http://167.179.239.122

# หรือถ้ามี domain แล้ว
http://yourdomain.com

# ถ้า setup SSL แล้ว
https://167.179.239.122
# หรือ
https://yourdomain.com
```

### 8.4 ทดสอบ API
```bash
# ทดสอบจากเครื่อง Mac
curl http://167.179.239.122/api/health
```

---

## 📝 การ Update Code ในอนาคต

### วิธีที่ 1: Pull จาก Git
```bash
# SSH เข้า server
ssh admindigital@172.22.22.11

# Pull code ใหม่
cd ~/jaidee-app
git pull origin main

# Rebuild และ restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

### วิธีที่ 2: Sync จาก Local
```bash
# จาก Mac
rsync -avz --exclude 'node_modules' \
  --exclude '.git' \
  ./ admindigital@172.22.22.11:~/jaidee-app/

# SSH เข้าไป restart
ssh admindigital@172.22.22.11 "cd ~/jaidee-app && docker compose restart"
```

---

## 🔧 Troubleshooting

### ปัญหา: Docker build ล้มเหลว
```bash
# ลบ cache แล้ว build ใหม่
docker compose down
docker system prune -a
docker compose build --no-cache
```

### ปัญหา: Nginx ไม่ทำงาน
```bash
# ตรวจสอบ logs
sudo tail -f /var/log/nginx/error.log

# ทดสอบ config
sudo nginx -t
```

### ปัญหา: Port ถูกใช้งานอยู่
```bash
# ตรวจสอบว่า port ไหนถูกใช้
sudo netstat -tulpn | grep -E ":(80|443|3000|3001)"

# หยุด process ที่ใช้ port
sudo kill -9 <PID>
```

### ปัญหา: Thai fonts ไม่แสดง
```bash
# เข้าไปใน container ตรวจสอบ
docker exec -it jaidee-backend-prod sh
fc-list | grep -i thai

# ถ้าไม่มี ให้ rebuild อีกครั้ง
docker compose build backend --no-cache
```

---

## 📊 Monitoring

### ตรวจสอบ Resource Usage
```bash
# CPU และ Memory
docker stats

# Disk
df -h

# Logs
docker compose logs --tail=100 -f
```

### Backup Database
```bash
# Backup SQLite database
cd ~/jaidee-app
docker compose exec backend cp /app/data/database.sqlite /app/data/database.backup.$(date +%Y%m%d).sqlite
```

---

## 🎉 สรุป

หลังจากทำทุกขั้นตอนแล้ว คุณจะมี:

✅ Application รันบน Docker containers
✅ Nginx ทำหน้าที่ reverse proxy
✅ SSL certificate (ถ้า setup)
✅ Auto-restart containers เมื่อ server reboot
✅ Thai fonts รองรับการสร้าง PDF

**URL สำหรับเข้าใช้งาน:**
- Production: `http://yourdomain.com` หรือ `http://172.22.22.11`
- API: `http://yourdomain.com/api`

---

**สร้างโดย:** Claude Code
**วันที่:** 17/11/2568

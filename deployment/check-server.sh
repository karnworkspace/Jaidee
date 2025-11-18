#!/bin/bash

echo "======================================"
echo "🔍 ตรวจสอบ Production Server"
echo "======================================"
echo ""

# Check OS
echo "📌 OS Information:"
cat /etc/os-release | grep -E "PRETTY_NAME|VERSION"
echo ""

# Check Docker
echo "📌 Docker Version:"
docker --version
docker compose version
echo ""

# Check Nginx
echo "📌 Nginx Status:"
if command -v nginx &> /dev/null; then
    nginx -v
    sudo systemctl status nginx --no-pager | head -5
else
    echo "❌ Nginx ไม่ได้ติดตั้ง"
fi
echo ""

# Check ports
echo "📌 Ports ที่ใช้งานอยู่:"
sudo netstat -tulpn | grep -E ":(80|443|3000|3001)" || echo "ไม่มี port 80, 443, 3000, 3001 ที่ active"
echo ""

# Check disk space
echo "📌 Disk Space:"
df -h / | awk 'NR==1 || /\/$/'
echo ""

# Check memory
echo "📌 Memory:"
free -h | head -2
echo ""

# Check running containers
echo "📌 Docker Containers ที่รันอยู่:"
docker ps -a
echo ""

# Check Docker networks
echo "📌 Docker Networks:"
docker network ls
echo ""

# Check current directory
echo "📌 Current Directory:"
pwd
ls -la
echo ""

echo "======================================"
echo "✅ ตรวจสอบเสร็จสิ้น"
echo "======================================"

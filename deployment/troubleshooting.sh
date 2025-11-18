#!/bin/bash

# Troubleshooting Script for Jaidee Production Issues
# ใช้เมื่อเว็บไม่ขึ้นหรือมีปัญหา

echo "======================================"
echo "🔧 Jaidee Troubleshooting"
echo "======================================"
echo ""

echo "📌 ขั้นตอนที่ 1: ตรวจสอบ Docker Containers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps -a
echo ""

BACKEND_RUNNING=$(docker ps | grep jaidee-backend-prod | wc -l)
FRONTEND_RUNNING=$(docker ps | grep jaidee-frontend-prod | wc -l)

if [ $BACKEND_RUNNING -eq 0 ]; then
    echo "❌ Backend container ไม่ได้รัน!"
    echo "   กำลังดู logs..."
    docker logs jaidee-backend-prod --tail 50
    echo ""
    echo "   กำลัง restart backend..."
    docker restart jaidee-backend-prod
    sleep 5
fi

if [ $FRONTEND_RUNNING -eq 0 ]; then
    echo "❌ Frontend container ไม่ได้รัน!"
    echo "   กำลังดู logs..."
    docker logs jaidee-frontend-prod --tail 50
    echo ""
    echo "   กำลัง restart frontend..."
    docker restart jaidee-frontend-prod
    sleep 5
fi

echo ""
echo "📌 ขั้นตอนที่ 2: ทดสอบ Local Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "ทดสอบ Frontend (port 3000):"
curl -I http://localhost:3000 2>&1 | head -5
echo ""

echo "ทดสอบ Backend (port 3001):"
curl -I http://localhost:3001/api/health 2>&1 | head -5
echo ""

echo "📌 ขั้นตอนที่ 3: ตรวจสอบ Nginx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -10
echo ""

echo "Nginx Config Test:"
sudo nginx -t
echo ""

echo "Recent Nginx Errors:"
sudo tail -20 /var/log/nginx/jaidee-error.log 2>/dev/null || echo "No error log found"
echo ""

echo "📌 ขั้นตอนที่ 4: ตรวจสอบ Ports"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo netstat -tulpn | grep -E ":(80|443|3000|3001)"
echo ""

echo "📌 ขั้นตอนที่ 5: ตรวจสอบ Firewall"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo ufw status
echo ""

echo "======================================"
echo "📝 คำแนะนำ"
echo "======================================"
echo ""

if [ $BACKEND_RUNNING -eq 0 ] || [ $FRONTEND_RUNNING -eq 0 ]; then
    echo "⚠️  พบปัญหา: Containers ไม่ได้รัน"
    echo ""
    echo "แก้ไข:"
    echo "  1. ดู logs: docker logs jaidee-backend-prod"
    echo "  2. Rebuild: cd ~/jaidee-app && docker compose -f deployment/docker-compose.production.yml build --no-cache"
    echo "  3. Restart: docker compose -f deployment/docker-compose.production.yml up -d"
fi

echo ""
echo "ถ้ายังมีปัญหา ให้รัน:"
echo "  docker compose -f ~/jaidee-app/deployment/docker-compose.production.yml logs -f"
echo ""
echo "======================================"

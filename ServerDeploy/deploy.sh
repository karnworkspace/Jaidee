#!/bin/bash
# ============================================
# Jaidee System - Production Deploy Script
# Server: 172.22.22.11 (admindigital)
# Path: /home/admindigital/jaidee-app/
# ============================================

set -e

echo "=========================================="
echo "  Jaidee System - Production Deploy"
echo "=========================================="

APP_DIR="/home/admindigital/jaidee-app"
DEPLOY_DIR="$APP_DIR/ServerDeploy"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 1. สร้าง backup directory
echo ""
echo "[1/6] สำรองข้อมูล database..."
mkdir -p "$BACKUP_DIR"
if [ -f "$APP_DIR/server/data/jaidee.sqlite" ]; then
    cp "$APP_DIR/server/data/jaidee.sqlite" "$BACKUP_DIR/jaidee_${TIMESTAMP}.sqlite"
    echo "  -> Backup: $BACKUP_DIR/jaidee_${TIMESTAMP}.sqlite"
else
    echo "  -> ไม่พบไฟล์ database (จะสร้างใหม่)"
fi

# 2. Pull latest code
echo ""
echo "[2/6] ดึงโค้ดล่าสุดจาก GitHub..."
cd "$APP_DIR"
git fetch origin
git checkout March2026
git pull origin March2026
echo "  -> Branch: March2026 (latest)"

# 3. Stop old containers
echo ""
echo "[3/6] หยุด containers เก่า..."
cd "$DEPLOY_DIR"
docker compose -f docker-compose.production.yml down 2>/dev/null || true
# กรณี deploy จาก deployment/ เดิม
cd "$APP_DIR/deployment" 2>/dev/null && docker compose -f docker-compose.production.yml down 2>/dev/null || true
cd "$DEPLOY_DIR"

# 4. Build new images
echo ""
echo "[4/6] Build images ใหม่ (no-cache)..."
docker compose -f docker-compose.production.yml build --no-cache

# 5. Start containers
echo ""
echo "[5/6] เริ่ม containers ใหม่..."
docker compose -f docker-compose.production.yml up -d

# 6. Verify
echo ""
echo "[6/6] ตรวจสอบสถานะ..."
sleep 5
docker ps --filter "name=jaidee" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=========================================="
echo "  Deploy สำเร็จ!"
echo "  Frontend: http://167.179.239.122/jaidee"
echo "  Backend:  http://167.179.239.122/jaidee/api"
echo "  Backup:   $BACKUP_DIR/jaidee_${TIMESTAMP}.sqlite"
echo "=========================================="

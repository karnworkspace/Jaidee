#!/bin/bash

# Firewall Setup Script for Jaidee Production Server
# สำหรับเพิ่มความปลอดภัยให้ production server

echo "======================================"
echo "🔒 Jaidee Firewall Setup"
echo "======================================"
echo ""

# ตรวจสอบว่ารันด้วย sudo หรือไม่
if [ "$EUID" -ne 0 ]; then
    echo "❌ กรุณารัน script นี้ด้วย sudo"
    echo "   sudo ./firewall-setup.sh"
    exit 1
fi

echo "📌 ขั้นตอนที่ 1: ติดตั้ง UFW (Uncomplicated Firewall)"
apt-get update
apt-get install -y ufw

echo ""
echo "📌 ขั้นตอนที่ 2: ตั้งค่า Default Policies"
# Deny all incoming by default
ufw default deny incoming

# Allow all outgoing by default
ufw default allow outgoing

echo ""
echo "📌 ขั้นตอนที่ 3: อนุญาต SSH (Port 22) - สำคัญมาก!"
ufw allow 22/tcp comment 'SSH'

echo ""
echo "📌 ขั้นตอนที่ 4: อนุญาต HTTP และ HTTPS"
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

echo ""
echo "📌 ขั้นตอนที่ 5: Rate Limiting สำหรับ SSH (ป้องกัน brute force)"
ufw limit 22/tcp

echo ""
echo "📌 ขั้นตอนที่ 6: แสดงกฎ Firewall ทั้งหมด"
ufw show added

echo ""
echo "⚠️  กำลังเปิดใช้งาน Firewall..."
echo "    (จะไม่ตัดการเชื่อมต่อ SSH ที่มีอยู่)"
echo ""

# Enable firewall
ufw --force enable

echo ""
echo "======================================"
echo "✅ Firewall Setup เสร็จสมบูรณ์"
echo "======================================"
echo ""

# Show status
echo "📊 สถานะ Firewall:"
ufw status verbose

echo ""
echo "📝 หมายเหตุ:"
echo "  - Port 22 (SSH): เปิดอยู่ พร้อม rate limiting"
echo "  - Port 80 (HTTP): เปิดอยู่"
echo "  - Port 443 (HTTPS): เปิดอยู่"
echo "  - Ports อื่นๆ: ปิดทั้งหมด (ปลอดภัย)"
echo ""
echo "  Docker containers สามารถสื่อสารกันภายใน"
echo "  โดยไม่ต้องเปิด port ภายนอก"
echo ""

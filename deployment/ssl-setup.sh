#!/bin/bash

# SSL Certificate Setup Script using Let's Encrypt
# สำหรับ IP-based SSL certificate (ใช้ certbot DNS challenge หรือ standalone)

echo "======================================"
echo "🔒 SSL Certificate Setup"
echo "======================================"
echo ""

# ตรวจสอบว่ารันด้วย sudo หรือไม่
if [ "$EUID" -ne 0 ]; then
    echo "❌ กรุณารัน script นี้ด้วย sudo"
    echo "   sudo ./ssl-setup.sh"
    exit 1
fi

PUBLIC_IP="167.179.239.122"

echo "📌 Public IP: $PUBLIC_IP"
echo ""

echo "⚠️  หมายเหตุสำคัญ:"
echo "   Let's Encrypt ไม่สามารถออก SSL certificate สำหรับ IP address ได้"
echo "   มี 2 ตัวเลือก:"
echo ""
echo "   1. ใช้ Domain Name (แนะนำ)"
echo "      - ซื้อ domain (เช่น jaidee.com)"
echo "      - Point A record ไปที่ 167.179.239.122"
echo "      - ใช้ Let's Encrypt ออก SSL ฟรี"
echo ""
echo "   2. ใช้ Self-Signed Certificate"
echo "      - สร้าง SSL certificate เอง"
echo "      - Browser จะเตือนว่าไม่ปลอดภัย"
echo "      - ใช้ได้กับ internal/testing"
echo ""

read -p "เลือกตัวเลือก (1=Domain, 2=Self-Signed, 0=ยกเลิก): " choice

case $choice in
    1)
        echo ""
        echo "📝 คุณเลือก: Domain-based SSL"
        echo ""
        read -p "กรุณาใส่ domain name ของคุณ (เช่น jaidee.livnex.co): " DOMAIN

        if [ -z "$DOMAIN" ]; then
            echo "❌ ไม่ได้ระบุ domain"
            exit 1
        fi

        echo ""
        echo "📌 ติดตั้ง Certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx

        echo ""
        echo "📌 ตรวจสอบว่า DNS ชี้มาที่ server นี้หรือยัง..."
        RESOLVED_IP=$(dig +short $DOMAIN | tail -n1)

        echo "   Domain: $DOMAIN"
        echo "   Resolves to: $RESOLVED_IP"
        echo "   Public IP: $PUBLIC_IP"
        echo ""

        if [ "$RESOLVED_IP" != "$PUBLIC_IP" ]; then
            echo "⚠️  คำเตือน: DNS ยังไม่ชี้มาที่ server นี้"
            echo "   กรุณาตั้งค่า DNS A record ให้ $DOMAIN ชี้มา $PUBLIC_IP"
            echo ""
            read -p "ต้องการดำเนินการต่อหรือไม่? (y/N): " continue
            if [ "$continue" != "y" ] && [ "$continue" != "Y" ]; then
                echo "ยกเลิกการติดตั้ง SSL"
                exit 0
            fi
        fi

        echo ""
        echo "📌 ขอ SSL Certificate จาก Let's Encrypt..."
        certbot --nginx -d $DOMAIN

        echo ""
        echo "📌 ตั้งค่า Auto-renewal..."
        certbot renew --dry-run

        echo ""
        echo "✅ SSL Certificate ติดตั้งเรียบร้อย!"
        echo "   สามารถเข้าถึงได้ที่: https://$DOMAIN"
        ;;

    2)
        echo ""
        echo "📝 คุณเลือก: Self-Signed Certificate"
        echo ""

        # สร้าง directory สำหรับเก็บ certificate
        mkdir -p /etc/nginx/ssl

        echo "📌 สร้าง Self-Signed Certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/nginx/ssl/jaidee-selfsigned.key \
            -out /etc/nginx/ssl/jaidee-selfsigned.crt \
            -subj "/C=TH/ST=Bangkok/L=Bangkok/O=Jaidee/CN=$PUBLIC_IP"

        echo ""
        echo "📌 สร้าง Diffie-Hellman parameters..."
        openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048

        echo ""
        echo "✅ Self-Signed Certificate สร้างเรียบร้อย!"
        echo ""
        echo "📝 ใช้ certificate นี้ใน Nginx config:"
        echo "   ssl_certificate /etc/nginx/ssl/jaidee-selfsigned.crt;"
        echo "   ssl_certificate_key /etc/nginx/ssl/jaidee-selfsigned.key;"
        echo "   ssl_dhparam /etc/nginx/ssl/dhparam.pem;"
        echo ""
        echo "⚠️  หมายเหตุ: Browser จะแสดงคำเตือนเมื่อเข้าใช้ HTTPS"
        echo "   เพราะ certificate ไม่ได้รับการรับรองจาก CA"
        ;;

    0)
        echo "ยกเลิกการติดตั้ง SSL"
        exit 0
        ;;

    *)
        echo "❌ ตัวเลือกไม่ถูกต้อง"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "✅ SSL Setup เสร็จสมบูรณ์"
echo "======================================"

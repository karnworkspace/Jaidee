#!/bin/bash

# Monitoring Script for Jaidee Production Server
# ตรวจสอบสถานะ containers, resources, และ logs

echo "======================================"
echo "📊 Jaidee Production Monitoring"
echo "======================================"
echo "เวลา: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Docker Containers Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 Docker Containers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Count running containers
RUNNING=$(docker ps -q | wc -l)
TOTAL=$(docker ps -aq | wc -l)

if [ $RUNNING -eq $TOTAL ] && [ $RUNNING -gt 0 ]; then
    echo -e "${GREEN}✅ Containers: $RUNNING/$TOTAL กำลังทำงาน${NC}"
else
    echo -e "${RED}⚠️  Containers: $RUNNING/$TOTAL กำลังทำงาน${NC}"
fi
echo ""

# 2. Resource Usage
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💻 Resource Usage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# CPU & Memory
echo "Container Stats:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

# Disk Usage
echo "Disk Usage:"
df -h / | awk 'NR==1 {print $0} NR==2 {print $0; if ($5+0 > 80) print "⚠️  Warning: Disk usage > 80%"}'
echo ""

# Memory
echo "System Memory:"
free -h | head -2
MEMORY_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ $MEMORY_USAGE -gt 80 ]; then
    echo -e "${YELLOW}⚠️  Warning: Memory usage > 80%${NC}"
fi
echo ""

# 3. Network & Connectivity
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Network Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if services are responding
echo "Service Health Check:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "Frontend (3000): ${GREEN}✅ OK ($HTTP_STATUS)${NC}"
else
    echo -e "Frontend (3000): ${RED}❌ ERROR ($HTTP_STATUS)${NC}"
fi

if [ "$API_STATUS" = "200" ]; then
    echo -e "Backend (3001):  ${GREEN}✅ OK ($API_STATUS)${NC}"
else
    echo -e "Backend (3001):  ${RED}❌ ERROR ($API_STATUS)${NC}"
fi
echo ""

# 4. Recent Logs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Recent Logs (Last 10 lines)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps | grep -q "jaidee-backend"; then
    echo ""
    echo "Backend Logs:"
    docker logs jaidee-backend-prod --tail 10 2>&1 | grep -E "Error|error|ERROR|Warning|warning" || echo "No errors found"
fi

if docker ps | grep -q "jaidee-frontend"; then
    echo ""
    echo "Frontend Logs:"
    docker logs jaidee-frontend-prod --tail 10 2>&1 | grep -E "Error|error|ERROR|Warning|warning" || echo "No errors found"
fi
echo ""

# 5. Nginx Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Nginx Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"

    # Check recent access
    echo ""
    echo "Recent Access (Last 5):"
    tail -5 /var/log/nginx/jaidee-access.log 2>/dev/null | awk '{print $1, $7, $9}' || echo "No logs found"

    # Check errors
    ERROR_COUNT=$(tail -50 /var/log/nginx/jaidee-error.log 2>/dev/null | wc -l)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Recent Nginx Errors: $ERROR_COUNT${NC}"
        tail -5 /var/log/nginx/jaidee-error.log 2>/dev/null
    fi
else
    echo -e "${RED}❌ Nginx is not running${NC}"
fi
echo ""

# 6. SSL Certificate (if exists)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 SSL Certificate"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "/etc/letsencrypt/live" ]; then
    CERT_DIRS=$(ls /etc/letsencrypt/live 2>/dev/null)
    if [ ! -z "$CERT_DIRS" ]; then
        for CERT_DIR in $CERT_DIRS; do
            if [ -f "/etc/letsencrypt/live/$CERT_DIR/cert.pem" ]; then
                EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$CERT_DIR/cert.pem | cut -d= -f2)
                echo "Domain: $CERT_DIR"
                echo "Expires: $EXPIRY"

                # Check if expiring soon (30 days)
                EXPIRY_TIMESTAMP=$(date -d "$EXPIRY" +%s)
                NOW_TIMESTAMP=$(date +%s)
                DAYS_LEFT=$(( ($EXPIRY_TIMESTAMP - $NOW_TIMESTAMP) / 86400 ))

                if [ $DAYS_LEFT -lt 30 ]; then
                    echo -e "${YELLOW}⚠️  Certificate expires in $DAYS_LEFT days${NC}"
                else
                    echo -e "${GREEN}✅ Certificate valid for $DAYS_LEFT days${NC}"
                fi
            fi
        done
    else
        echo "No SSL certificates found"
    fi
else
    echo "No SSL certificates installed"
fi
echo ""

# 7. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ISSUES=0

# Check containers
if [ $RUNNING -ne $TOTAL ] || [ $RUNNING -eq 0 ]; then
    echo -e "${RED}❌ Container issues detected${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check services
if [ "$HTTP_STATUS" != "200" ] || [ "$API_STATUS" != "200" ]; then
    echo -e "${RED}❌ Service connectivity issues${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check nginx
if ! systemctl is-active --quiet nginx; then
    echo -e "${RED}❌ Nginx is down${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check resources
if [ $MEMORY_USAGE -gt 90 ]; then
    echo -e "${YELLOW}⚠️  High memory usage${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All systems operational${NC}"
else
    echo -e "${YELLOW}⚠️  Found $ISSUES issue(s)${NC}"
fi

echo ""
echo "======================================"
echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"

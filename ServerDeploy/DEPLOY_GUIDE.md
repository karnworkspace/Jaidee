# Jaidee Production Deploy Guide

## Server Info
- IP: 172.22.22.11 (internal) / 167.179.239.122 (public)
- User: admindigital
- App Path: /home/admindigital/jaidee-app/
- Branch: March2026

## Quick Deploy

### 1. SSH เข้า server
```bash
ssh admindigital@172.22.22.11
```

### 2. รัน deploy script
```bash
cd /home/admindigital/jaidee-app/ServerDeploy
chmod +x deploy.sh
./deploy.sh
```

## Manual Deploy (ทีละขั้น)

### 1. สำรอง database
```bash
cp /home/admindigital/jaidee-app/server/data/jaidee.sqlite ~/jaidee_backup_$(date +%Y%m%d).sqlite
```

### 2. Pull code ใหม่
```bash
cd /home/admindigital/jaidee-app
git pull origin March2026
```

### 3. Rebuild & restart
```bash
cd /home/admindigital/jaidee-app/ServerDeploy
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d
```

### 4. ตรวจสอบ
```bash
docker ps --filter "name=jaidee"
```

## Port Mapping
| Service | Container Port | Host Port | Nginx Path |
|---------|---------------|-----------|------------|
| Frontend | 80 | 3100 | /jaidee |
| Backend | 3001 | 3101 | /jaidee/api |

## Rollback
```bash
# หยุด containers
cd /home/admindigital/jaidee-app/ServerDeploy
docker compose -f docker-compose.production.yml down

# กลับไป commit เดิม
cd /home/admindigital/jaidee-app
git log --oneline -5
git checkout <commit-hash>

# Build ใหม่
cd ServerDeploy
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

# Restore database (ถ้าจำเป็น)
cp ~/backups/jaidee_YYYYMMDD.sqlite /home/admindigital/jaidee-app/server/data/jaidee.sqlite
docker restart jaidee-backend-prod
```

## Troubleshooting
```bash
# ดู logs
docker logs jaidee-backend-prod --tail 50
docker logs jaidee-frontend-prod --tail 50

# เช็ค health
curl http://localhost:3101/api/health
curl http://localhost:3100/jaidee/

# Restart Nginx (ถ้าจำเป็น)
sudo nginx -t && sudo systemctl reload nginx
```

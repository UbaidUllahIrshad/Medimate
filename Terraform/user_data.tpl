#!/bin/bash
# Enable error logging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=== Starting Automated MediMate Deployment ==="

# 1. Update system packages and install Docker, Docker Compose V2, Git, and Curl
apt-get update -y
apt-get install -y docker.io docker-compose-v2 git curl
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu

# 2. Clone MediMate repository into /home/ubuntu
cd /home/ubuntu
rm -rf Medimate
git clone https://github.com/UbaidUllahIrshad/Medimate.git
cd Medimate

# 3. Fetch public IP dynamically for CLIENT_URL
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)

# 4. Automatically generate backend/.env file
cat <<EOF > backend/.env
PORT=5000
NODE_ENV=production
DB_HOST=postgres-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=0011
DB_NAME=medimate
JWT_SECRET=medimate_production_jwt_secret_key_2026_secure
CLIENT_URL=http://${PUBLIC_IP}
EOF

# 5. Fix file permissions for ubuntu user
chown -R ubuntu:ubuntu /home/ubuntu/Medimate

# 6. Launch Docker containers using Compose V2
echo "=== Building and Starting Docker Containers ==="
docker compose up --build -d

# 7. Wait for PostgreSQL and Express backend to stabilize
echo "=== Waiting 20 seconds for containers to initialize ==="
sleep 20

# 8. Automatically initialize PostgreSQL database tables
echo "=== Initializing Database Schema ==="
docker exec pern-backend npm run db:init

echo "=== MediMate Deployment Finished Successfully ==="
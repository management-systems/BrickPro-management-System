#!/bin/bash
# BrickPro — AWS EC2 Deployment Script
# Run this on a fresh Ubuntu 22.04 EC2 instance
# Usage: bash deploy.sh

set -e

echo "🧱 BrickPro Deployment Starting..."

# 1. Install Docker
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Install Docker Compose plugin
echo "📦 Installing Docker Compose..."
sudo apt update
sudo apt install -y docker-compose-plugin nginx certbot python3-certbot-nginx

# 3. Clone repo
echo "📥 Cloning BrickPro..."
cd ~
git clone https://github.com/Mandy2555/Brick-pro-ManagementSystems.in.git brickpro
cd brickpro

# 4. Create .env
echo "🔐 Creating .env..."
cat > .env << 'EOF'
SMTP_PASS=qzsllfyadvnpxpni
EOF

# 5. Build and start containers
echo "🐳 Building Docker containers..."
sudo docker compose up --build -d

# 6. Wait for DB to be ready
echo "⏳ Waiting for database..."
sleep 10

# 7. Run migrations
echo "📊 Running database migrations..."
sudo docker compose exec -T backend npx prisma db push

# 8. Seed super admin
echo "👤 Seeding super admin..."
curl -s -X POST http://localhost:4000/api/super-admin/seed || true

# 9. Setup Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/brickpro > /dev/null << 'NGINX'
server {
    listen 80;
    server_name brickpro.managementsystems.in;
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name admin.brickpro.managementsystems.in;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.brickpro.managementsystems.in;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/brickpro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "✅ BrickPro Deployed Successfully!"
echo ""
echo "📌 Next steps:"
echo "1. Point DNS A records to this server's IP"
echo "2. Run: sudo certbot --nginx -d brickpro.managementsystems.in -d admin.brickpro.managementsystems.in -d api.brickpro.managementsystems.in"
echo ""
echo "🌐 URLs (after DNS):"
echo "   Web:   https://brickpro.managementsystems.in"
echo "   Admin: https://admin.brickpro.managementsystems.in"
echo "   API:   https://api.brickpro.managementsystems.in"
echo ""
echo "🔑 Super Admin Login:"
echo "   Email: admin@managementsystems.in"
echo "   Password: Admin@2024"
echo ""

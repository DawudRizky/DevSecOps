#!/bin/bash

# Backup script for NPM and WordPress configurations
# This script saves current configurations before cleanup

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🔄 Backing up NPM and WordPress Configurations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if containers are running
NPM_RUNNING=$(docker ps --filter "name=nginx-proxy-manager" --format "{{.Names}}" 2>/dev/null)
WP_RUNNING=$(docker ps --filter "name=vulnerable-wordpress" --format "{{.Names}}" 2>/dev/null)

if [ -z "$NPM_RUNNING" ] && [ -z "$WP_RUNNING" ]; then
    echo -e "${RED}❌ No running containers found. Please start the services first.${NC}"
    exit 1
fi

# ============================================
# Backup Nginx Proxy Manager
# ============================================
if [ ! -z "$NPM_RUNNING" ]; then
    echo -e "${BLUE}📦 Backing up Nginx Proxy Manager...${NC}"
    
    NPM_BACKUP_DIR="$BACKUP_DIR/npm_$TIMESTAMP"
    mkdir -p "$NPM_BACKUP_DIR"
    
    # Backup SQLite database (contains all proxy hosts, SSL certs, users, etc.)
    echo -e "${YELLOW}  → Backing up NPM database...${NC}"
    docker cp nginx-proxy-manager:/data/database.sqlite "$NPM_BACKUP_DIR/database.sqlite" 2>/dev/null || {
        echo -e "${RED}    ⚠ Failed to backup database${NC}"
    }
    
    # Backup nginx configurations
    echo -e "${YELLOW}  → Backing up NPM nginx configs...${NC}"
    docker cp nginx-proxy-manager:/data/nginx "$NPM_BACKUP_DIR/nginx" 2>/dev/null || {
        echo -e "${YELLOW}    ⚠ No custom nginx configs found${NC}"
    }
    
    # Backup SSL certificates
    echo -e "${YELLOW}  → Backing up SSL certificates...${NC}"
    docker cp nginx-proxy-manager:/etc/letsencrypt "$NPM_BACKUP_DIR/letsencrypt" 2>/dev/null || {
        echo -e "${YELLOW}    ⚠ No SSL certificates found${NC}"
    }
    
    # Create a symlink to latest backup
    rm -f "$BACKUP_DIR/npm_latest"
    ln -s "npm_$TIMESTAMP" "$BACKUP_DIR/npm_latest"
    
    echo -e "${GREEN}  ✅ NPM backup saved to: $NPM_BACKUP_DIR${NC}\n"
else
    echo -e "${YELLOW}⚠ Nginx Proxy Manager is not running, skipping backup${NC}\n"
fi

# ============================================
# Backup WordPress
# ============================================
if [ ! -z "$WP_RUNNING" ]; then
    echo -e "${BLUE}📦 Backing up WordPress...${NC}"
    
    WP_BACKUP_DIR="$BACKUP_DIR/wordpress_$TIMESTAMP"
    mkdir -p "$WP_BACKUP_DIR"
    
    # Backup WordPress files
    echo -e "${YELLOW}  → Backing up WordPress files...${NC}"
    docker cp vulnerable-wordpress:/var/www/html "$WP_BACKUP_DIR/wordpress_files" 2>/dev/null || {
        echo -e "${RED}    ⚠ Failed to backup WordPress files${NC}"
    }
    
    # Backup installed plugins list
    echo -e "${YELLOW}  → Getting list of installed plugins...${NC}"
    docker exec vulnerable-wordpress ls /var/www/html/wp-content/plugins > "$WP_BACKUP_DIR/installed_plugins.txt" 2>/dev/null || {
        echo -e "${YELLOW}    ⚠ Could not list plugins${NC}"
    }
    
    # Backup active plugins from database
    echo -e "${YELLOW}  → Extracting active plugins from database...${NC}"
    docker exec wordpress-mysql sh -c "mysqldump -u wordpress -pvulnerable_wp_pass wordpress wp_options --where=\"option_name='active_plugins'\"" > "$WP_BACKUP_DIR/active_plugins.sql" 2>/dev/null || {
        echo -e "${YELLOW}    ⚠ Could not extract active plugins${NC}"
    }
    
    # Backup full WordPress database
    echo -e "${YELLOW}  → Backing up WordPress database...${NC}"
    docker exec wordpress-mysql sh -c "mysqldump -u wordpress -pvulnerable_wp_pass wordpress" > "$WP_BACKUP_DIR/wordpress_db.sql" 2>/dev/null || {
        echo -e "${RED}    ⚠ Failed to backup database${NC}"
    }
    
    # Get WordPress configuration info
    echo -e "${YELLOW}  → Saving WordPress configuration info...${NC}"
    cat > "$WP_BACKUP_DIR/wp_config.txt" << EOF
WordPress Installation Info
Backup Date: $(date)

WordPress Version:
EOF
    docker exec vulnerable-wordpress cat /var/www/html/wp-includes/version.php | grep "wp_version" >> "$WP_BACKUP_DIR/wp_config.txt" 2>/dev/null || true
    
    # Create a symlink to latest backup
    rm -f "$BACKUP_DIR/wordpress_latest"
    ln -s "wordpress_$TIMESTAMP" "$BACKUP_DIR/wordpress_latest"
    
    echo -e "${GREEN}  ✅ WordPress backup saved to: $WP_BACKUP_DIR${NC}\n"
else
    echo -e "${YELLOW}⚠ WordPress is not running, skipping backup${NC}\n"
fi

# ============================================
# Create restoration instructions
# ============================================
cat > "$BACKUP_DIR/RESTORE_INSTRUCTIONS.txt" << 'EOF'
RESTORATION INSTRUCTIONS
========================

This backup contains:
1. Nginx Proxy Manager configuration (database, nginx configs, SSL certs)
2. WordPress files, database, and plugin information

TO RESTORE:
-----------

Option 1: Automatic Restoration
    Run: ./scripts/deploy.sh --restore

Option 2: Manual Restoration
    1. Start services: ./scripts/deploy.sh
    2. Restore configs: ./scripts/restore-config.sh

BACKUP LOCATIONS:
-----------------
EOF

if [ ! -z "$NPM_RUNNING" ]; then
    echo "NPM Backup: $NPM_BACKUP_DIR" >> "$BACKUP_DIR/RESTORE_INSTRUCTIONS.txt"
fi

if [ ! -z "$WP_RUNNING" ]; then
    echo "WordPress Backup: $WP_BACKUP_DIR" >> "$BACKUP_DIR/RESTORE_INSTRUCTIONS.txt"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Backup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Backup saved to: ${BACKUP_DIR}${NC}"
echo -e "${YELLOW}Latest backups accessible via:${NC}"
[ ! -z "$NPM_RUNNING" ] && echo -e "  ${GREEN}→ $BACKUP_DIR/npm_latest${NC}"
[ ! -z "$WP_RUNNING" ] && echo -e "  ${GREEN}→ $BACKUP_DIR/wordpress_latest${NC}"

echo -e "\n${BLUE}To restore after cleanup:${NC}"
echo -e "  ${YELLOW}./scripts/deploy.sh --restore${NC}"
echo -e "\n${BLUE}Or manually:${NC}"
echo -e "  ${YELLOW}./scripts/restore-config.sh${NC}\n"

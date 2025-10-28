#!/bin/bash

# Restore script for NPM and WordPress configurations
# This script restores previously backed up configurations

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

BACKUP_DIR="$(dirname "$0")/../backups"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🔄 Restoring NPM and WordPress Configurations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ No backup directory found at $BACKUP_DIR${NC}"
    echo -e "${YELLOW}Please run ./scripts/backup-config.sh first${NC}"
    exit 1
fi

# Check for specific backup or use latest
NPM_BACKUP=""
WP_BACKUP=""

if [ ! -z "$1" ]; then
    # Use specified backup timestamp
    NPM_BACKUP="$BACKUP_DIR/npm_$1"
    WP_BACKUP="$BACKUP_DIR/wordpress_$1"
else
    # Use latest backups
    [ -L "$BACKUP_DIR/npm_latest" ] && NPM_BACKUP="$BACKUP_DIR/npm_latest"
    [ -L "$BACKUP_DIR/wordpress_latest" ] && WP_BACKUP="$BACKUP_DIR/wordpress_latest"
fi

# Wait for containers to be ready
echo -e "${YELLOW}⏳ Waiting for containers to be ready...${NC}"
sleep 5

# ============================================
# Restore Nginx Proxy Manager
# ============================================
if [ -d "$NPM_BACKUP" ]; then
    echo -e "\n${BLUE}📦 Restoring Nginx Proxy Manager...${NC}"
    
    # Check if NPM container is running
    NPM_RUNNING=$(docker ps --filter "name=nginx-proxy-manager" --format "{{.Names}}" 2>/dev/null)
    if [ -z "$NPM_RUNNING" ]; then
        echo -e "${RED}❌ Nginx Proxy Manager container is not running${NC}"
        echo -e "${YELLOW}Please start it first with: docker-compose up -d nginx-proxy-manager${NC}"
    else
        # Stop NPM temporarily
        echo -e "${YELLOW}  → Stopping NPM temporarily...${NC}"
        docker stop nginx-proxy-manager > /dev/null
        
        # Restore database
        if [ -f "$NPM_BACKUP/database.sqlite" ]; then
            echo -e "${YELLOW}  → Restoring NPM database...${NC}"
            docker cp "$NPM_BACKUP/database.sqlite" nginx-proxy-manager:/data/database.sqlite
        fi
        
        # Restore nginx configs
        if [ -d "$NPM_BACKUP/nginx" ]; then
            echo -e "${YELLOW}  → Restoring nginx configurations...${NC}"
            docker cp "$NPM_BACKUP/nginx/." nginx-proxy-manager:/data/nginx/
        fi
        
        # Restore SSL certificates
        if [ -d "$NPM_BACKUP/letsencrypt" ]; then
            echo -e "${YELLOW}  → Restoring SSL certificates...${NC}"
            docker cp "$NPM_BACKUP/letsencrypt/." nginx-proxy-manager:/etc/letsencrypt/
        fi
        
        # Restart NPM
        echo -e "${YELLOW}  → Restarting NPM...${NC}"
        docker start nginx-proxy-manager > /dev/null
        sleep 3
        
        echo -e "${GREEN}  ✅ NPM configuration restored${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No NPM backup found, skipping restoration${NC}"
fi

# ============================================
# Restore WordPress
# ============================================
if [ -d "$WP_BACKUP" ]; then
    echo -e "\n${BLUE}📦 Restoring WordPress...${NC}"
    
    # Check if WordPress container is running
    WP_RUNNING=$(docker ps --filter "name=vulnerable-wordpress" --format "{{.Names}}" 2>/dev/null)
    WPDB_RUNNING=$(docker ps --filter "name=wordpress-mysql" --format "{{.Names}}" 2>/dev/null)
    
    if [ -z "$WP_RUNNING" ] || [ -z "$WPDB_RUNNING" ]; then
        echo -e "${RED}❌ WordPress containers are not running${NC}"
        echo -e "${YELLOW}Please start them first with: docker-compose up -d wordpress wordpress-db${NC}"
    else
        # Wait for MySQL to be ready
        echo -e "${YELLOW}  → Waiting for MySQL to be ready...${NC}"
        sleep 10
        
        # Restore database
        if [ -f "$WP_BACKUP/wordpress_db.sql" ]; then
            echo -e "${YELLOW}  → Restoring WordPress database...${NC}"
            docker exec -i wordpress-mysql sh -c "mysql -u wordpress -pvulnerable_wp_pass wordpress" < "$WP_BACKUP/wordpress_db.sql" 2>/dev/null || {
                echo -e "${RED}    ⚠ Failed to restore database${NC}"
            }
        fi
        
        # Restore WordPress files (selective restore to avoid overwriting core)
        if [ -d "$WP_BACKUP/wordpress_files" ]; then
            echo -e "${YELLOW}  → Restoring WordPress plugins...${NC}"
            
            # Restore wp-content (plugins, themes, uploads)
            if [ -d "$WP_BACKUP/wordpress_files/wp-content/plugins" ]; then
                docker cp "$WP_BACKUP/wordpress_files/wp-content/plugins/." vulnerable-wordpress:/var/www/html/wp-content/plugins/ 2>/dev/null || {
                    echo -e "${YELLOW}    ⚠ Could not restore plugins${NC}"
                }
            fi
            
            if [ -d "$WP_BACKUP/wordpress_files/wp-content/themes" ]; then
                echo -e "${YELLOW}  → Restoring WordPress themes...${NC}"
                docker cp "$WP_BACKUP/wordpress_files/wp-content/themes/." vulnerable-wordpress:/var/www/html/wp-content/themes/ 2>/dev/null || {
                    echo -e "${YELLOW}    ⚠ Could not restore themes${NC}"
                }
            fi
            
            if [ -d "$WP_BACKUP/wordpress_files/wp-content/uploads" ]; then
                echo -e "${YELLOW}  → Restoring WordPress uploads...${NC}"
                docker cp "$WP_BACKUP/wordpress_files/wp-content/uploads/." vulnerable-wordpress:/var/www/html/wp-content/uploads/ 2>/dev/null || {
                    echo -e "${YELLOW}    ⚠ Could not restore uploads${NC}"
                }
            fi
            
            # Fix permissions
            echo -e "${YELLOW}  → Fixing permissions...${NC}"
            docker exec vulnerable-wordpress chown -R www-data:www-data /var/www/html/wp-content
        fi
        
        # Restart WordPress
        echo -e "${YELLOW}  → Restarting WordPress...${NC}"
        docker restart vulnerable-wordpress > /dev/null
        sleep 3
        
        echo -e "${GREEN}  ✅ WordPress configuration restored${NC}"
        
        # Show restored plugins
        if [ -f "$WP_BACKUP/installed_plugins.txt" ]; then
            echo -e "\n${BLUE}  📋 Restored plugins:${NC}"
            cat "$WP_BACKUP/installed_plugins.txt" | while read plugin; do
                [ -n "$plugin" ] && echo -e "     ${GREEN}→${NC} $plugin"
            done
        fi
    fi
else
    echo -e "${YELLOW}⚠ No WordPress backup found, skipping restoration${NC}"
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Restoration Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Services restored from backup${NC}"
echo -e "${BLUE}NPM Admin:${NC} http://localhost:81"
echo -e "${BLUE}WordPress:${NC} http://wordpress.tujuh\n"

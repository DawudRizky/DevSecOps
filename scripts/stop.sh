#!/bin/bash

# Complete cleanup script for Vulnerable Web App
# This script will restore the machine to its original state before deployment

set -e

echo "🛑 Complete Cleanup - Restoring Machine to Original State..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Check for --no-backup flag
SKIP_BACKUP=false
if [ "$1" == "--no-backup" ]; then
    SKIP_BACKUP=true
    echo -e "${YELLOW}⚠️  Skipping backup (--no-backup flag set)${NC}\n"
fi

# Function to print colored messages
print_step() {
    echo -e "\n${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Step 0: Backup configurations before cleanup
if [ "$SKIP_BACKUP" = false ]; then
    print_step "STEP 0: Backing up current configurations"
    SCRIPT_DIR="$(dirname "$0")"
    
    # Check if containers are running
    CONTAINERS_RUNNING=$(docker ps --filter "name=nginx-proxy-manager" --filter "name=vulnerable-wordpress" --format "{{.Names}}" | wc -l)
    
    if [ "$CONTAINERS_RUNNING" -gt 0 ]; then
        echo -e "${YELLOW}Creating backup of NPM and WordPress configurations...${NC}"
        if [ -f "$SCRIPT_DIR/backup-config.sh" ]; then
            bash "$SCRIPT_DIR/backup-config.sh" || {
                echo -e "${RED}⚠️  Backup failed, but continuing with cleanup${NC}"
            }
        else
            echo -e "${YELLOW}⚠️  backup-config.sh not found, skipping backup${NC}"
        fi
    else
        echo -e "${YELLOW}No running containers found, skipping backup${NC}"
    fi
else
    echo -e "${YELLOW}Backup skipped${NC}"
fi

# Step 1: Stop all Docker Compose services
print_step "STEP 1: Stopping all Docker Compose services"
echo -e "${YELLOW}Running docker-compose down...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✅ Docker Compose services stopped${NC}"

# Step 2: Stop and remove all containers
print_step "STEP 2: Removing all project containers"
echo -e "${YELLOW}Stopping and removing project containers...${NC}"
CONTAINERS=(
    "vulnapp-webapp"
    "nginx-proxy-manager"
    "vulnerable-wordpress"
    "wordpress-mysql"
)

for container in "${CONTAINERS[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${YELLOW}  → Removing container: ${container}${NC}"
        docker stop "$container" 2>/dev/null || true
        docker rm -f "$container" 2>/dev/null || true
    fi
done
echo -e "${GREEN}✅ All project containers removed${NC}"

# Step 3: Stop Supabase and remove its containers
print_step "STEP 3: Stopping Supabase and removing containers"
echo -e "${YELLOW}Stopping Supabase...${NC}"
cd "$(dirname "$0")/.." || exit 1
supabase stop 2>/dev/null || true

# Stop any lingering Supabase projects
supabase stop --project-id managment 2>/dev/null || true

# Remove Supabase containers
echo -e "${YELLOW}Removing Supabase containers...${NC}"
SUPABASE_CONTAINERS=$(docker ps -a --filter "name=supabase" --format "{{.Names}}" 2>/dev/null)
if [ ! -z "$SUPABASE_CONTAINERS" ]; then
    for container in $SUPABASE_CONTAINERS; do
        echo -e "${YELLOW}  → Removing: ${container}${NC}"
        docker stop "$container" 2>/dev/null || true
        docker rm -f "$container" 2>/dev/null || true
    done
fi
echo -e "${GREEN}✅ Supabase containers removed${NC}"

# Step 4: Remove all project volumes
print_step "STEP 4: Removing all project volumes"
echo -e "${YELLOW}Removing named volumes...${NC}"
VOLUMES=(
    "npm-data"
    "npm-letsencrypt"
    "wordpress-data"
    "wordpress-db-data"
    "vulnapps-example_npm-data"
    "vulnapps-example_npm-letsencrypt"
    "vulnapps-example_wordpress-data"
    "vulnapps-example_wordpress-db-data"
)

for volume in "${VOLUMES[@]}"; do
    if docker volume ls --format '{{.Name}}' | grep -q "^${volume}$"; then
        echo -e "${YELLOW}  → Removing volume: ${volume}${NC}"
        docker volume rm "$volume" 2>/dev/null || true
    fi
done

# Remove Supabase volumes
echo -e "${YELLOW}Removing Supabase volumes...${NC}"
SUPABASE_VOLUMES=$(docker volume ls --filter "name=supabase" --format "{{.Name}}" 2>/dev/null)
if [ ! -z "$SUPABASE_VOLUMES" ]; then
    for volume in $SUPABASE_VOLUMES; do
        echo -e "${YELLOW}  → Removing: ${volume}${NC}"
        docker volume rm "$volume" 2>/dev/null || true
    done
fi
echo -e "${GREEN}✅ All project volumes removed${NC}"

# Step 5: Remove all project images
print_step "STEP 5: Removing all project images"
echo -e "${YELLOW}Removing project images...${NC}"
IMAGES=(
    "vulnapps-example-webapp"
    "vulnapps-example_webapp"
    "jc21/nginx-proxy-manager:latest"
    "wordpress:5.4.2-php7.4-apache"
    "mysql:5.7"
)

for image in "${IMAGES[@]}"; do
    if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "$image"; then
        echo -e "${YELLOW}  → Removing image: ${image}${NC}"
        docker rmi -f "$image" 2>/dev/null || true
    fi
done

# Remove Supabase images
echo -e "${YELLOW}Removing Supabase images...${NC}"
SUPABASE_IMAGES=$(docker images --format '{{.Repository}}:{{.Tag}}' | grep "supabase" 2>/dev/null)
if [ ! -z "$SUPABASE_IMAGES" ]; then
    echo "$SUPABASE_IMAGES" | while read image; do
        echo -e "${YELLOW}  → Removing: ${image}${NC}"
        docker rmi -f "$image" 2>/dev/null || true
    done
fi
echo -e "${GREEN}✅ All project images removed${NC}"

# Step 6: Remove Docker network
print_step "STEP 6: Removing Docker network"
echo -e "${YELLOW}Removing vulnapp-network...${NC}"
docker network rm vulnapp-network 2>/dev/null || true
echo -e "${GREEN}✅ Docker network removed${NC}"

# Step 7: Clean up dangling resources
print_step "STEP 7: Cleaning up dangling Docker resources"
echo -e "${YELLOW}Removing dangling images...${NC}"
docker image prune -f 2>/dev/null || true

echo -e "${YELLOW}Removing unused volumes...${NC}"
docker volume prune -f 2>/dev/null || true

echo -e "${YELLOW}Removing unused networks...${NC}"
docker network prune -f 2>/dev/null || true

echo -e "${YELLOW}Removing build cache...${NC}"
docker builder prune -f 2>/dev/null || true
echo -e "${GREEN}✅ Dangling resources cleaned${NC}"

# Step 8: Clean up Supabase local data
print_step "STEP 8: Cleaning up Supabase local data"
if [ -d "supabase/.branches" ]; then
    echo -e "${YELLOW}Cleaning Supabase branches data...${NC}"
    rm -rf supabase/.branches/* 2>/dev/null || true
fi
if [ -d "supabase/.temp" ]; then
    echo -e "${YELLOW}Cleaning Supabase temp data...${NC}"
    rm -rf supabase/.temp/* 2>/dev/null || true
fi
echo -e "${GREEN}✅ Supabase local data cleaned${NC}"

# Step 9: Remove node_modules directories
print_step "STEP 9: Removing node_modules directories"
echo -e "${YELLOW}Removing root node_modules...${NC}"
if [ -d "node_modules" ]; then
    NODE_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    rm -rf node_modules
    echo -e "${GREEN}  ✓ Removed root node_modules (${NODE_SIZE})${NC}"
fi

echo -e "${YELLOW}Removing listener node_modules...${NC}"
if [ -d "project-management/listener/node_modules" ]; then
    LISTENER_SIZE=$(du -sh project-management/listener/node_modules 2>/dev/null | cut -f1)
    rm -rf project-management/listener/node_modules
    echo -e "${GREEN}  ✓ Removed listener node_modules (${LISTENER_SIZE})${NC}"
fi

# Remove any other node_modules that might exist
echo -e "${YELLOW}Scanning for other node_modules...${NC}"
find . -name "node_modules" -type d -prune 2>/dev/null | while read dir; do
    if [ -d "$dir" ]; then
        echo -e "${YELLOW}  → Removing: ${dir}${NC}"
        rm -rf "$dir"
    fi
done
echo -e "${GREEN}✅ All node_modules removed (can be regenerated with npm install)${NC}"

# Step 10: Summary
print_step "🎉 CLEANUP COMPLETE!"
echo -e "${GREEN}The machine has been restored to its original state.${NC}"
echo -e "\n${BLUE}Cleaned resources:${NC}"
echo -e "  ✓ All Docker containers stopped and removed"
echo -e "  ✓ All Docker volumes removed (data deleted)"
echo -e "  ✓ All Docker images removed"
echo -e "  ✓ Docker network removed"
echo -e "  ✓ Build cache cleared"
echo -e "  ✓ Supabase services stopped"
echo -e "  ✓ Supabase local data cleared"
echo -e "  ✓ node_modules removed (~160MB freed)"
echo -e "\n${YELLOW}Note: Docker itself is still installed and running${NC}"
echo -e "${YELLOW}To verify cleanup, run: docker ps -a && docker images && docker volume ls${NC}"

if [ "$SKIP_BACKUP" = false ] && [ -d "$(dirname "$0")/../backups" ]; then
    echo -e "\n${BLUE}💾 Configuration backup available!${NC}"
    echo -e "${GREEN}To restore after redeployment:${NC}"
    echo -e "  ${YELLOW}./scripts/deploy.sh --restore${NC}"
    echo -e "${GREEN}Or manually:${NC}"
    echo -e "  ${YELLOW}./scripts/restore-config.sh${NC}"
fi

echo -e "\n${BLUE}To redeploy:${NC}"
echo -e "  ${GREEN}1.${NC} npm install (to restore dependencies)"
echo -e "  ${GREEN}2.${NC} ./scripts/deploy.sh"
echo -e "\n${GREEN}You can now run ./scripts/deploy.sh to start fresh!${NC}\n"

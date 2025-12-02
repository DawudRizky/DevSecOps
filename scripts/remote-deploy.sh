#!/bin/bash
# remote-deploy.sh - Deployment script for kelompok-tujuh webapp
# This script runs on the target machine (dso507@10.34.100.160)
# Called remotely by Jenkins via SSH

set -e  # Exit on any error
set -u  # Exit on undefined variable

# Parameters
VERSION=${1:-secure}
IMAGE_TAR=${2:-webapp-${VERSION}.tar.gz}
BUILD_NUMBER=${3:-0}
BRANCH_NAME=${4:-unknown}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_FILE="/tmp/${IMAGE_TAR}"
CONTAINER_NAME="vulnapp-webapp"
NETWORK_NAME="vulnapp-network"
IMAGE_TAG_VERSIONED="webapp-${BRANCH_NAME}-${BUILD_NUMBER}:${VERSION}"
IMAGE_TAG_LATEST="webapp:${VERSION}"
IMAGE_TAG_BRANCH="webapp:${BRANCH_NAME}-latest"
PROJECT_DIR="/home/dso507/kelompok-tujuh"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo "═══════════════════════════════════════════"
    echo "  $1"
    echo "═══════════════════════════════════════════"
}

# Safety check - ensure we're on the right machine
if [ "$USER" != "dso507" ]; then
    print_error "This script should only run as user 'dso507'"
    print_error "Current user: $USER"
    exit 1
fi

print_header "Kelompok Tujuh - Webapp Deployment"
print_info "Version: $VERSION"
print_info "Image File: $IMAGE_FILE"
print_info "Container: $CONTAINER_NAME"
print_info "Started: $(date)"
echo ""

# Step 1: Verify image file exists
print_info "Checking image file..."
if [ ! -f "$IMAGE_FILE" ]; then
    print_error "Image file not found: $IMAGE_FILE"
    print_error "Available files in /tmp:"
    ls -lh /tmp/*.tar.gz 2>/dev/null || echo "No tar.gz files found"
    exit 1
fi

IMAGE_SIZE=$(du -h "$IMAGE_FILE" | cut -f1)
print_success "Image file found (${IMAGE_SIZE})"

# Step 2: Load Docker image
print_info "Loading Docker image..."
if gunzip -c "$IMAGE_FILE" | docker load; then
    print_success "Docker image loaded successfully"
else
    print_error "Failed to load Docker image"
    exit 1
fi

# Step 3: Tag the loaded image
print_info "Tagging image with multiple tags..."
LOADED_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "webapp-dso507" | head -1)
if [ -n "$LOADED_IMAGE" ]; then
    # Tag with build-specific version (never gets overwritten)
    docker tag "$LOADED_IMAGE" "$IMAGE_TAG_VERSIONED"
    print_success "Image tagged: ${IMAGE_TAG_VERSIONED}"
    
    # Only tag as 'webapp:secure' or 'webapp:vulnerable' if from the correct branch
    if [[ ("$VERSION" == "secure" && "$BRANCH_NAME" == "main") || \
          ("$VERSION" == "vulnerable" && "$BRANCH_NAME" == "webapp-vulnerable") ]]; then
        docker tag "$LOADED_IMAGE" "$IMAGE_TAG_LATEST"
        print_success "Image tagged: ${IMAGE_TAG_LATEST}"
    else
        print_warning "Skipping ${IMAGE_TAG_LATEST} tag - version/branch mismatch"
        print_warning "  VERSION=${VERSION}, BRANCH=${BRANCH_NAME}"
    fi
    
    # Always tag with branch-latest for tracking
    docker tag "$LOADED_IMAGE" "$IMAGE_TAG_BRANCH"
    print_success "Image tagged: ${IMAGE_TAG_BRANCH}"
else
    print_warning "Could not find loaded image, assuming it's already tagged"
fi

# Step 4: Verify network exists
print_info "Checking Docker network..."
if docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    print_success "Network exists: ${NETWORK_NAME}"
else
    print_warning "Network not found, creating: ${NETWORK_NAME}"
    docker network create "$NETWORK_NAME"
    print_success "Network created"
fi

# Step 5: Stop existing container
print_info "Stopping existing container..."
if docker ps -a --filter "name=${CONTAINER_NAME}" --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    print_success "Existing container removed"
else
    print_info "No existing container found"
fi

# Wait for cleanup
sleep 2

# Step 6: Deploy new container
print_info "Deploying new container..."
DEPLOY_IMAGE="$IMAGE_TAG_VERSIONED"
print_info "Using image: ${DEPLOY_IMAGE}"

docker run -d \
    --name "$CONTAINER_NAME" \
    --network "$NETWORK_NAME" \
    --restart unless-stopped \
    -p 3000:80 \
    --add-host host.docker.internal:host-gateway \
    -e NODE_ENV=production \
    -e DEPLOYED_VERSION="${VERSION}" \
    -e DEPLOYED_BRANCH="${BRANCH_NAME}" \
    -e DEPLOYED_BUILD="${BUILD_NUMBER}" \
    -e DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "$DEPLOY_IMAGE"

print_success "Container deployed: ${CONTAINER_NAME}"

# Step 7: Health check
print_info "Running health checks..."
sleep 3

MAX_ATTEMPTS=10
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    print_info "Health check attempt ${ATTEMPT}/${MAX_ATTEMPTS}..."
    
    if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
        print_success "Health check passed!"
        break
    fi
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        print_error "Health check failed after ${MAX_ATTEMPTS} attempts"
        print_error "Container logs:"
        docker logs "$CONTAINER_NAME" --tail 50
        exit 1
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
done

# Step 8: Display deployment info
print_header "Deployment Summary"
echo "✅ Status: SUCCESS"
echo "📦 Version: $VERSION"
echo "🌿 Branch: $BRANCH_NAME"
echo "🏗️  Build: #$BUILD_NUMBER"
echo "🐳 Container: $CONTAINER_NAME"
echo "🖼️  Image: $IMAGE_TAG_VERSIONED"
echo "🌐 Local URL: http://localhost:3000"
echo "🌐 Public URL: http://project.tujuh"
echo "📅 Deployed: $(date)"
echo ""

# Display container info
print_info "Container information:"
docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

# Step 9: Cleanup
print_info "Cleaning up temporary files..."
rm -f "$IMAGE_FILE"
rm -f "/tmp/remote-deploy.sh"

# Remove old/dangling images to save space
print_info "Removing old images..."
docker image prune -f >/dev/null 2>&1 || true

print_success "Cleanup complete"

print_header "Deployment Complete"
print_success "Webapp is now running with ${VERSION} version!"
echo ""

exit 0

#!/bin/bash
# setup-jenkins-ssh.sh - Setup SSH keys for Jenkins CI/CD
# Run this on the deployment target machine (dso507@10.34.100.160)

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║   Jenkins SSH Setup - Kelompok Tujuh             ║
║   Target: dso507@10.34.100.160                    ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration
KEY_NAME="jenkins_kelompok_tujuh"
KEY_PATH="$HOME/.ssh/${KEY_NAME}"
KEY_COMMENT="jenkins-deploy-kelompok-tujuh"

# Check if running as correct user
if [ "$USER" != "dso507" ]; then
    echo -e "${RED}❌ This script must be run as user 'dso507'${NC}"
    echo -e "${RED}   Current user: $USER${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Running as correct user: dso507${NC}"
echo ""

# Ensure .ssh directory exists
echo -e "${BLUE}📁 Checking .ssh directory...${NC}"
if [ ! -d "$HOME/.ssh" ]; then
    mkdir -p "$HOME/.ssh"
    chmod 700 "$HOME/.ssh"
    echo -e "${GREEN}✅ Created .ssh directory${NC}"
else
    echo -e "${GREEN}✅ .ssh directory exists${NC}"
fi

# Check if key already exists
if [ -f "$KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  SSH key already exists: $KEY_PATH${NC}"
    read -p "Do you want to regenerate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Using existing key${NC}"
    else
        echo -e "${YELLOW}⚠️  Backing up existing key...${NC}"
        mv "$KEY_PATH" "${KEY_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
        mv "${KEY_PATH}.pub" "${KEY_PATH}.pub.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        echo -e "${GREEN}✅ Backup created${NC}"
    fi
fi

# Generate SSH key if not exists
if [ ! -f "$KEY_PATH" ]; then
    echo -e "${BLUE}🔑 Generating SSH key pair...${NC}"
    ssh-keygen -t ed25519 -C "$KEY_COMMENT" -f "$KEY_PATH" -N ""
    echo -e "${GREEN}✅ SSH key pair generated${NC}"
else
    echo -e "${GREEN}✅ Using existing SSH key${NC}"
fi

# Set proper permissions
chmod 600 "$KEY_PATH"
chmod 644 "${KEY_PATH}.pub"

# Add public key to authorized_keys
echo -e "${BLUE}🔐 Adding public key to authorized_keys...${NC}"
if [ ! -f "$HOME/.ssh/authorized_keys" ]; then
    touch "$HOME/.ssh/authorized_keys"
    chmod 600 "$HOME/.ssh/authorized_keys"
fi

# Check if key is already in authorized_keys
PUB_KEY=$(cat "${KEY_PATH}.pub")
if grep -qF "$PUB_KEY" "$HOME/.ssh/authorized_keys"; then
    echo -e "${GREEN}✅ Public key already in authorized_keys${NC}"
else
    cat "${KEY_PATH}.pub" >> "$HOME/.ssh/authorized_keys"
    echo -e "${GREEN}✅ Public key added to authorized_keys${NC}"
fi

# Verify permissions
chmod 600 "$HOME/.ssh/authorized_keys"
chmod 700 "$HOME/.ssh"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SSH Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""

# Display key information
echo -e "${BLUE}📋 Key Information:${NC}"
echo -e "   Location: $KEY_PATH"
echo -e "   Public Key: ${KEY_PATH}.pub"
echo -e "   Fingerprint:"
ssh-keygen -lf "$KEY_PATH"
echo ""

# Test local SSH
echo -e "${BLUE}🧪 Testing local SSH connection...${NC}"
if ssh -i "$KEY_PATH" -o BatchMode=yes -o StrictHostKeyChecking=no "$USER@localhost" "echo 'SSH test successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ Local SSH test successful${NC}"
else
    echo -e "${YELLOW}⚠️  Local SSH test failed (this is OK if SSH server is not configured)${NC}"
fi
echo ""

# Display private key for Jenkins
echo -e "${YELLOW}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  COPY THE PRIVATE KEY BELOW FOR JENKINS          ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}=== BEGIN PRIVATE KEY ===${NC}"
cat "$KEY_PATH"
echo -e "${GREEN}=== END PRIVATE KEY ===${NC}"
echo ""

# Display public key
echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PUBLIC KEY (for reference)                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
cat "${KEY_PATH}.pub"
echo ""

# Instructions
echo -e "${YELLOW}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  NEXT STEPS                                       ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo "1. Copy the PRIVATE KEY above (including BEGIN and END lines)"
echo "2. Go to Jenkins: http://10.34.100.163:8080/"
echo "3. Navigate to: Manage Jenkins → Credentials → System → Global"
echo "4. Click 'Add Credentials'"
echo "5. Configure:"
echo "   - Kind: SSH Username with private key"
echo "   - ID: ssh-deploy-dso507"
echo "   - Username: dso507"
echo "   - Private Key: Paste the key from above"
echo "6. Click 'Create'"
echo ""
echo -e "${GREEN}Then proceed with Jenkins job setup!${NC}"
echo ""

# Save instructions to file
INSTRUCTIONS_FILE="$HOME/jenkins-ssh-instructions.txt"
cat > "$INSTRUCTIONS_FILE" << EOF
Jenkins SSH Setup Instructions
================================

Date: $(date)
User: $USER
Host: $(hostname)
IP: $(hostname -I | awk '{print $1}')

Private Key Location: $KEY_PATH
Public Key Location: ${KEY_PATH}.pub

Key Fingerprint:
$(ssh-keygen -lf "$KEY_PATH")

Jenkins Credential Configuration:
- Kind: SSH Username with private key
- ID: ssh-deploy-dso507
- Username: dso507
- Private Key: Use the key from $KEY_PATH

Test SSH Connection:
ssh -i $KEY_PATH dso507@10.34.100.160 "echo 'SSH connection successful'"

Private Key (copy this to Jenkins):
-----------------------------------
$(cat "$KEY_PATH")
-----------------------------------

Public Key (for reference):
-----------------------------------
$(cat "${KEY_PATH}.pub")
-----------------------------------
EOF

echo -e "${GREEN}✅ Instructions saved to: $INSTRUCTIONS_FILE${NC}"
echo ""

# Final summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SUMMARY                                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo "✅ SSH key pair generated"
echo "✅ Public key added to authorized_keys"
echo "✅ Permissions set correctly"
echo "✅ Instructions saved to file"
echo ""
echo -e "${GREEN}Ready for Jenkins configuration!${NC}"
echo ""

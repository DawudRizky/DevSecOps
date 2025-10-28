# 🚨 Payload Collection - Security Research Only

This folder contains various malicious payloads for testing file upload vulnerabilities and demonstrating security flaws. **USE ONLY IN ISOLATED ENVIRONMENTS FOR RESEARCH PURPOSES**.

## 📁 File Categories

### JavaScript Payloads
- **`malicious_payload.js`** - Advanced client-side exploitation
  - Data exfiltration (cookies, localStorage, sessionStorage)
  - Network reconnaissance
  - Persistent backdoor creation
  - DOM manipulation attacks

- **`backdoor_access.js`** - Server/Database access payload
  - Database credential harvesting
  - Admin panel access attempts
  - Privilege escalation vectors

- **`reverse_shell.js`** - Basic reverse shell simulation
  - System information gathering
  - Cookie/session theft
  - Persistent access mechanisms

### Python Payloads
- **`reverse_shell.py`** - Python-based reverse shell
  - System reconnaissance
  - Command execution simulation
  - Data exfiltration
  - Persistence mechanisms

- **`server_penetration.py`** - Advanced server penetration
  - Database connection exploitation
  - File system access
  - Privilege escalation
  - Network scanning

### Shell Scripts
- **`reverse_shell.sh`** - Bash reverse shell
  - Multiple reverse shell techniques
  - System information gathering
  - Persistence via cron jobs

- **`advanced_backdoor.sh`** - Advanced backdoor installation
  - SSH key injection
  - Service persistence
  - Log cleaning
  - Network tunneling

### HTML/XSS Payloads
- **`innocent_document.html`** - HTML with embedded JavaScript
  - Cross-Site Scripting (XSS)
  - Form data interception
  - Persistent XSS installation
  - Multiple attack vectors

## ⚠️ Security Warning

**CRITICAL**: These files contain actual malicious code designed to:
- Steal sensitive data
- Gain unauthorized access
- Establish persistent backdoors
- Execute arbitrary commands
- Compromise system security

## 🎯 Vulnerability Demonstration

These payloads demonstrate:
1. **File Upload Vulnerabilities** - Unrestricted file upload with execution
2. **XSS Attacks** - Cross-site scripting through file uploads
3. **Remote Code Execution** - Arbitrary code execution via uploaded files
4. **Data Exfiltration** - Stealing sensitive information
5. **Privilege Escalation** - Gaining elevated access
6. **Persistent Access** - Maintaining long-term compromise

## 🔧 Usage Instructions

1. **Testing Environment**: Only use in isolated, non-production environments
2. **Upload Method**: Use the vulnerable file upload feature in the application
3. **Auto-Execution**: Files are automatically executed during "security scanning"
4. **Monitoring**: Check browser console and listener server for results
5. **Cleanup**: Remove payloads after testing

## 📡 Data Collection

All payloads send captured data to the local listener server:
- **Endpoint**: `http://localhost:3001/collect`
- **Backdoor Endpoint**: `http://localhost:3001/backdoor/:action`
- **Captured Data**: Stored in `../listener/captured_data/`

## 🛡️ Mitigation

To prevent these attacks:
1. **File Type Validation** - Strict whitelist of allowed extensions
2. **Content Scanning** - Actual malware/script detection
3. **Sandboxed Execution** - Never execute uploaded content directly
4. **Input Sanitization** - Proper validation and escaping
5. **CSP Headers** - Content Security Policy implementation
6. **File Quarantine** - Isolate uploaded files from execution paths

---

**⚠️ DISCLAIMER**: This collection is for educational and security research purposes only. Unauthorized use of these payloads against systems you don't own is illegal and unethical.
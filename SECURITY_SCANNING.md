# 🔒 Security Scanning in CI/CD Pipeline

## Overview

The Jenkins CI/CD pipeline includes three layers of automated security scanning to prevent deployment of vulnerable code:

1. **SAST** (Static Application Security Testing) - Semgrep
2. **Container Scanning** - Trivy
3. **DAST** (Dynamic Application Security Testing) - OWASP ZAP

## Security Scanning Stages

### 1. 🛡️ SAST - Semgrep

**When:** After Docker build, before deployment
**Scans:** Source code for security vulnerabilities

**Detects:**
- Cross-Site Scripting (XSS)
- SQL Injection
- Command Injection
- Insecure cryptography
- Hardcoded secrets
- Dangerous function usage (eval, innerHTML)
- Authentication/Authorization issues

**Failure Criteria:** Any ERROR or WARNING severity findings

**Example Vulnerabilities Detected:**
```typescript
// ❌ Will fail SAST
dangerouslySetInnerHTML={{ __html: userInput }}  // XSS vulnerability
eval(userCode)                                    // Code injection
```

### 2. 🐳 Container Scan - Trivy

**When:** After Docker build (parallel with Semgrep)
**Scans:** Docker image and dependencies

**Detects:**
- Known CVEs in base images
- Vulnerable npm packages
- Outdated dependencies
- OS-level vulnerabilities

**Failure Criteria:** HIGH or CRITICAL severity CVEs

**Example Output:**
```
Found 3 HIGH/CRITICAL vulnerabilities
- CVE-2024-12345: Node.js Remote Code Execution
- CVE-2024-67890: OpenSSL Buffer Overflow
```

### 3. 🎯 DAST - OWASP ZAP

**When:** After deployment (only non-DRY_RUN)
**Scans:** Running application

**Detects:**
- XSS in running app
- SQL Injection attempts
- CSRF vulnerabilities
- Security header issues
- Authentication bypass
- Session management issues

**Failure Criteria:** HIGH risk findings

**Target:** `http://10.34.100.160:3000`

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. Build Docker Image                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  2. Security Scanning (Parallel)                       │
│     ┌──────────────────┬──────────────────┐           │
│     │  SAST (Semgrep)  │  Trivy (CVEs)    │           │
│     └──────────────────┴──────────────────┘           │
│                                                         │
│     ❌ FAIL if vulnerabilities found                   │
│     ✅ PASS if clean                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  3. Deploy to Target                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  4. DAST (OWASP ZAP)                                   │
│     ❌ FAIL if HIGH risk found                         │
│     ✅ PASS if acceptable risk                          │
└────────────────────────────────────────────────────────┘
```

## Expected Behavior

### Secure Version (main branch)
```bash
✅ SAST: No vulnerabilities
✅ Trivy: Clean dependencies
✅ DAST: No high-risk issues
→ Deployment SUCCEEDS
```

### Vulnerable Version (webapp-vulnerable branch)
```bash
❌ SAST: XSS, eval() usage detected
❌ Trivy: Outdated packages with CVEs
❌ DAST: XSS exploitable in runtime
→ Deployment FAILS
```

## Security Reports

After each build, security reports are archived:

- **`semgrep-report.json`** - SAST findings with severity, file, line number
- **`trivy-report.json`** - CVE list with CVSS scores
- **`zap-report.html`** - Human-readable DAST report
- **`zap-report.json`** - Machine-readable DAST data
- **`zap-report.md`** - Markdown summary

**Access:** Jenkins Build → Artifacts

## Viewing Scan Results

### In Jenkins Console Output:

**SAST Failure:**
```
❌ SAST FAILED: Found 3 security vulnerabilities
[ERROR] javascript.react.security.dangerouslysetinnerhtml: XSS vulnerability in src/components/TaskCard.tsx:45
[WARNING] javascript.lang.security.eval-detected: eval() usage in src/lib/utils.ts:123
```

**Trivy Failure:**
```
❌ CONTAINER SCAN FAILED: Found 5 HIGH/CRITICAL vulnerabilities
Library: lodash
Installed: 4.17.20
Vulnerability: CVE-2021-23337
Severity: HIGH
```

**DAST Failure:**
```
❌ DAST FAILED: Found 2 HIGH risk vulnerabilities
[HIGH] Cross Site Scripting (Reflected): User input reflected without encoding
[HIGH] SQL Injection: Parameter vulnerable to SQLi
```

## Demo Scenario

### 1. Deploy Secure Version
```bash
# In Jenkins:
VERSION: secure
DRY_RUN: false

Expected Result:
✅ All security scans pass
✅ Deployment succeeds
```

### 2. Attempt Vulnerable Version
```bash
# In Jenkins:
VERSION: vulnerable
DRY_RUN: false

Expected Result:
❌ SAST detects dangerouslySetInnerHTML, eval()
❌ Pipeline fails with security violations
❌ Deployment BLOCKED
```

### 3. View Security Reports
```bash
# Download from Jenkins:
Build #X → Artifacts → semgrep-report.json

# Review findings:
{
  "results": [
    {
      "check_id": "javascript.react.security.dangerouslysetinnerhtml",
      "path": "src/components/TaskCard.tsx",
      "start": {"line": 45},
      "extra": {
        "severity": "ERROR",
        "message": "Detected usage of dangerouslySetInnerHTML"
      }
    }
  ]
}
```

## Tool Versions

- **Semgrep:** Latest (auto-updated via pip)
- **Trivy:** Latest (installed via apt)
- **OWASP ZAP:** stable Docker image

## Configuration

### Semgrep Rules
- **Config:** `--config=auto` (community rules)
- **Excludes:** `node_modules/`, `dist/`, `*.test.ts`

### Trivy Thresholds
- **Severity:** HIGH, CRITICAL only
- **Exit Code:** 1 if vulnerabilities found

### ZAP Configuration
- **Scan Type:** Baseline (passive + active)
- **Target:** Deployed application URL
- **Risk Threshold:** HIGH

## Troubleshooting

### False Positives

If legitimate code is flagged:

**Semgrep:**
```typescript
// nosemgrep: javascript.react.security.dangerouslysetinnerhtml
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

**Trivy:**
```dockerfile
# Accept known CVE with justification
# .trivyignore file
CVE-2024-12345  # False positive, not exploitable in our context
```

### Tool Installation Issues

Tools are auto-installed on first run:
- Semgrep: `pip3 install semgrep`
- Trivy: via apt repository
- ZAP: Docker pull on demand

## Security Gate Philosophy

**Shift-Left Security:**
- Catch vulnerabilities early (SAST)
- Verify dependencies (Trivy)
- Test runtime behavior (DAST)

**Defense in Depth:**
- Multiple scanning layers
- Different vulnerability classes
- Both static and dynamic analysis

**Fail Fast:**
- Stop deployment immediately on HIGH/CRITICAL
- Provide actionable feedback
- Archive reports for review

## Next Steps

1. **Run secure deployment** → All scans pass ✅
2. **Attempt vulnerable deployment** → Scans fail ❌
3. **Review security reports** → Understand findings
4. **Fix vulnerabilities** → Remediate in code
5. **Re-run pipeline** → Verify fixes

---

**The security scanning ensures only verified, secure code reaches production!** 🔒

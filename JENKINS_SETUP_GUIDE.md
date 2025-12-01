# Jenkins CI/CD Setup Guide - Kelompok Tujuh

## Overview
This guide explains how to set up Jenkins CI/CD pipeline for deploying the vulnerable/secure webapp versions on the shared Jenkins server at `http://10.34.100.163:8080/`.

**Target Machine:** `dso507@10.34.100.160`  
**Deployment URL:** `http://project.tujuh`

---

## Prerequisites

✅ Jenkins server running at: `http://10.34.100.163:8080/`  
✅ SSH access from Jenkins to deployment machine  
✅ Docker installed on deployment machine  
✅ Git repository: `https://github.com/DawudRizky/DevSecOps.git`

---

## Step 1: SSH Key Setup (On Your Machine - 10.34.100.160)

Run the SSH setup script:

```bash
cd /home/dso507/kelompok-tujuh/scripts
./setup-jenkins-ssh.sh
```

This will:
1. Generate SSH key pair for Jenkins
2. Add public key to authorized_keys
3. Display the private key (copy this for Jenkins)

**Manual Steps:**

```bash
# 1. Generate SSH key
ssh-keygen -t ed25519 -C "jenkins-deploy-kelompok-tujuh" -f ~/.ssh/jenkins_kelompok_tujuh -N ""

# 2. Add public key to authorized_keys
cat ~/.ssh/jenkins_kelompok_tujuh.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 3. Display private key (copy this!)
echo "=== COPY THIS PRIVATE KEY FOR JENKINS ==="
cat ~/.ssh/jenkins_kelompok_tujuh
echo "=== END OF PRIVATE KEY ==="

# 4. Test SSH (from Jenkins machine or ask admin)
ssh -i ~/.ssh/jenkins_kelompok_tujuh dso507@10.34.100.160 "echo 'SSH connection successful'"
```

---

## Step 2: Add SSH Credentials to Jenkins

1. **Access Jenkins:** http://10.34.100.163:8080/
2. **Navigate to:** Manage Jenkins → Credentials → System → Global credentials
3. **Click:** "Add Credentials"
4. **Configure:**
   - **Kind:** SSH Username with private key
   - **Scope:** Global
   - **ID:** `ssh-deploy-dso507` (important - used in Jenkinsfile)
   - **Description:** `SSH key for dso507 webapp deployment`
   - **Username:** `dso507`
   - **Private Key:** Select "Enter directly"
     - Paste the private key from Step 1
   - **Passphrase:** Leave empty (if key has no passphrase)
5. **Click:** "Create"

**Verify credential ID matches Jenkinsfile:**
```groovy
SSH_CRED_ID = 'ssh-deploy-dso507'  // Must match!
```

---

## Step 3: Create Jenkins Pipeline Job

### 3.1 Create New Job

1. **Go to:** Jenkins Dashboard → New Item
2. **Enter name:** `kelompok-tujuh-webapp-deploy-dso507`
   - ⚠️ Include your username to avoid conflicts!
3. **Select:** Pipeline
4. **Click:** OK

### 3.2 Configure General Settings

1. **Description:**
   ```
   CI/CD pipeline for Kelompok Tujuh webapp deployment.
   Switches between vulnerable and secure versions.
   Target: dso507@10.34.100.160
   URL: http://project.tujuh
   ```

2. **Check:** "This project is parameterized"
   - **Parameter 1:**
     - Type: Choice Parameter
     - Name: `VERSION`
     - Choices (one per line):
       ```
       secure
       vulnerable
       ```
     - Description: `Select webapp version to deploy`
   
   - **Parameter 2:**
     - Type: String Parameter
     - Name: `TARGET_HOST`
     - Default Value: `dso507@10.34.100.160`
     - Description: `Deployment target SSH (user@host)`
   
   - **Parameter 3:**
     - Type: Boolean Parameter
     - Name: `DRY_RUN`
     - Default: `false`
     - Description: `Build only, do not deploy`

3. **Build Triggers:** (Optional)
   - Leave unchecked for manual deployment
   - Or check "GitHub hook trigger" if you want automatic builds

4. **Advanced Project Options:**
   - Display Name: `Kelompok Tujuh - Webapp Deploy (dso507)`

### 3.3 Configure Pipeline

1. **Pipeline section:**
   - **Definition:** Pipeline script from SCM
   
2. **SCM:** Git
   - **Repository URL:** `https://github.com/DawudRizky/DevSecOps.git`
   - **Credentials:** 
     - If public repo: leave as "none"
     - If private: add GitHub credentials (Username with password or token)
   - **Branch Specifier:** `*/main`
   
3. **Script Path:** `Jenkinsfile`
   - This file should be in the root of your repository

4. **Lightweight checkout:** Check this option (faster)

### 3.4 Save Configuration

Click "Save" at the bottom

---

## Step 4: Push Jenkinsfile to Repository

```bash
cd /home/dso507/kelompok-tujuh

# Check if Jenkinsfile exists
ls -la Jenkinsfile

# Add to git
git add Jenkinsfile
git add scripts/remote-deploy.sh

# Commit
git commit -m "Add Jenkins CI/CD pipeline for webapp deployment"

# Push to GitHub
git push origin main
```

---

## Step 5: Test the Pipeline

### 5.1 First Dry Run (Safe Test)

1. **Go to job:** http://10.34.100.163:8080/job/kelompok-tujuh-webapp-deploy-dso507/
2. **Click:** "Build with Parameters"
3. **Configure:**
   - VERSION: `secure`
   - TARGET_HOST: `dso507@10.34.100.160`
   - DRY_RUN: `✓ checked`
4. **Click:** "Build"

**This will:**
- ✅ Checkout code
- ✅ Build Docker image
- ❌ NOT deploy (dry run mode)

**Expected Output:**
```
✅ Dry run completed successfully - Image built but not deployed
```

### 5.2 Deploy Secure Version

1. **Click:** "Build with Parameters"
2. **Configure:**
   - VERSION: `secure`
   - TARGET_HOST: `dso507@10.34.100.160`
   - DRY_RUN: `☐ unchecked`
3. **Click:** "Build"

**Watch the console output:**
- 📥 Checkout Source
- 🔨 Build Docker Image
- 💾 Save Image
- 📤 Transfer to Target
- 🚀 Deploy on Target
- 🏥 Health Check
- ✅ Success!

### 5.3 Verify Deployment

```bash
# On your machine
docker ps | grep vulnapp-webapp
curl http://localhost:3000
```

**Or visit:** http://project.tujuh

### 5.4 Deploy Vulnerable Version

1. **Click:** "Build with Parameters"
2. **Configure:**
   - VERSION: `vulnerable`
   - DRY_RUN: `☐ unchecked`
3. **Click:** "Build"

---

## Step 6: Demonstration Workflow

### Scenario: Security Patch Deployment

**Initial State - Vulnerable:**
```
1. Deploy vulnerable version via Jenkins
2. Demonstrate exploits (XSS, RCE, cookie theft)
3. Show security team discovers vulnerabilities
```

**Patching Process:**
```
4. Trigger Jenkins pipeline with VERSION=secure
5. Jenkins builds secure version
6. Automatic deployment with health checks
7. Zero-downtime deployment
```

**Verification:**
```
8. Test same exploits - they fail
9. Show security improvements
10. Demonstrate rollback capability (if needed)
```

---

## Step 7: Monitoring and Troubleshooting

### View Build History

- **Job page:** Shows all builds with status
- **Console Output:** Click build number → "Console Output"
- **Build Timeline:** See duration of each stage

### Common Issues

**1. SSH Connection Failed**
```
Error: Permission denied (publickey)
```
**Fix:**
- Verify SSH credentials in Jenkins
- Test SSH manually: `ssh dso507@10.34.100.160 "echo test"`
- Check authorized_keys on target machine

**2. Docker Image Build Failed**
```
Error: Cannot connect to Docker daemon
```
**Fix:**
- Ensure Docker is running on Jenkins machine
- Check Jenkins user has Docker permissions

**3. Health Check Failed**
```
Error: curl: (7) Failed to connect
```
**Fix:**
- Check if container is running: `docker ps`
- Check container logs: `docker logs vulnapp-webapp`
- Verify port 3000 is not blocked

**4. Transfer Failed**
```
Error: scp: No such file or directory
```
**Fix:**
- Ensure /tmp directory exists and is writable
- Check disk space on target machine

### Useful Commands (On Target Machine)

```bash
# Check running containers
docker ps

# View webapp logs
docker logs vulnapp-webapp -f

# Restart container
docker restart vulnapp-webapp

# Check container details
docker inspect vulnapp-webapp

# Manual cleanup
docker stop vulnapp-webapp
docker rm vulnapp-webapp
docker rmi webapp:secure webapp:vulnerable

# Check disk space
df -h
docker system df
```

---

## Step 8: Advanced Features (Optional)

### Enable Build Notifications

Add to Jenkinsfile `post` section:
```groovy
post {
    success {
        emailext (
            subject: "✅ Deployment Success: ${params.VERSION}",
            body: "Webapp deployed successfully!",
            to: "your-email@example.com"
        )
    }
}
```

### Add Slack Notifications

Install Slack plugin and add:
```groovy
post {
    success {
        slackSend(
            color: 'good',
            message: "Deployed ${params.VERSION} to production"
        )
    }
}
```

### Schedule Automatic Deployments

In job configuration → Build Triggers:
- Check "Build periodically"
- Schedule: `H 2 * * *` (every night at 2 AM)

---

## Security Best Practices

✅ **Credentials:** Never hardcode passwords/keys in Jenkinsfile  
✅ **Cleanup:** Pipeline automatically removes Docker images after build  
✅ **Isolation:** Uses unique container names to avoid conflicts  
✅ **Timeouts:** 30-minute timeout prevents hanging builds  
✅ **Logging:** All actions logged for audit trail  
✅ **Rollback:** Can redeploy previous version anytime  

---

## Quick Reference

**Jenkins URL:** http://10.34.100.163:8080/  
**Job Name:** kelompok-tujuh-webapp-deploy-dso507  
**Target:** dso507@10.34.100.160  
**Webapp URL:** http://project.tujuh  
**SSH Credential ID:** ssh-deploy-dso507  

**Deploy Commands:**
```bash
# Secure version
Build with Parameters → VERSION=secure → Build

# Vulnerable version  
Build with Parameters → VERSION=vulnerable → Build

# Dry run (test only)
Build with Parameters → DRY_RUN=true → Build
```

---

## Support

**Issues?** Check:
1. Console Output in Jenkins
2. Container logs: `docker logs vulnapp-webapp`
3. SSH connectivity: `ssh dso507@10.34.100.160`
4. Network connectivity: `ping 10.34.100.160`

**Need help?** Contact Jenkins admin or check documentation.

---

## Summary

You now have a fully automated CI/CD pipeline that can:
- ✅ Build vulnerable or secure webapp versions
- ✅ Deploy to target machine via SSH
- ✅ Perform health checks
- ✅ Rollback if needed
- ✅ Clean up automatically
- ✅ Run safely in shared Jenkins environment

**Next:** Run your first deployment! 🚀

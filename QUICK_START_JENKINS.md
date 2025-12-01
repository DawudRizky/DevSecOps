# Quick Start Guide - Jenkins CI/CD

## 🚀 Quick Deployment Steps

### 1. Setup SSH Keys (One-time setup)

```bash
cd /home/dso507/kelompok-tujuh/scripts
./setup-jenkins-ssh.sh
```

**Copy the private key shown** - you'll need it for Jenkins!

---

### 2. Configure Jenkins (One-time setup)

1. Go to: http://10.34.100.163:8080/
2. Add SSH Credentials:
   - Manage Jenkins → Credentials → System → Global → Add Credentials
   - Kind: **SSH Username with private key**
   - ID: **ssh-deploy-dso507**
   - Username: **dso507**
   - Private Key: **Paste from step 1**
   - Save

3. Create Pipeline Job:
   - New Item → `kelompok-tujuh-webapp-deploy-dso507` → Pipeline
   - Check: "This project is parameterized"
   - Add 3 parameters:
     * Choice: `VERSION` (secure, vulnerable)
     * String: `TARGET_HOST` = `dso507@10.34.100.160`
     * Boolean: `DRY_RUN` = false
   - Pipeline Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository: `https://github.com/DawudRizky/DevSecOps.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
   - Save

---

### 3. Push to GitHub

```bash
cd /home/dso507/kelompok-tujuh
git add Jenkinsfile scripts/ JENKINS_SETUP_GUIDE.md QUICK_START_JENKINS.md
git commit -m "Add Jenkins CI/CD pipeline"
git push origin main
```

---

### 4. Deploy!

**Deploy Secure Version:**
1. Go to: http://10.34.100.163:8080/job/kelompok-tujuh-webapp-deploy-dso507/
2. Click: "Build with Parameters"
3. Select: VERSION = `secure`
4. Click: "Build"
5. Wait ~2-3 minutes
6. Check: http://project.tujuh ✅

**Deploy Vulnerable Version:**
1. Same steps, but VERSION = `vulnerable`

---

## 🎬 Demo Workflow

### Scenario: Security Patching

**Step 1: Show Vulnerable App**
```
1. Deploy vulnerable version via Jenkins
2. Demonstrate exploits
3. Show plaintext passwords in cookies
```

**Step 2: Security Team Response**
```
4. Trigger Jenkins pipeline (VERSION=secure)
5. Watch automated deployment
6. Verify health checks pass
```

**Step 3: Verify Patches**
```
7. Test same exploits - they fail
8. Show security improvements
9. Demonstrate rollback capability
```

---

## 📊 Architecture

```
Jenkins (10.34.100.163:8080)
    ↓ (SSH)
Your Machine (10.34.100.160)
    ↓ 
Docker Container (vulnapp-webapp)
    ↓
NPM Reverse Proxy
    ↓
http://project.tujuh
```

---

## 🔧 Common Commands

```bash
# Check deployment status
docker ps | grep vulnapp-webapp

# View logs
docker logs vulnapp-webapp -f

# Manual restart
docker restart vulnapp-webapp

# Check which version is running
curl http://localhost:3000

# Manual cleanup
docker stop vulnapp-webapp && docker rm vulnapp-webapp
```

---

## 🐛 Troubleshooting

**Build fails with SSH error?**
- Check credentials: Manage Jenkins → Credentials
- Test SSH: `ssh dso507@10.34.100.160 "echo test"`

**Health check fails?**
- Check container: `docker ps`
- Check logs: `docker logs vulnapp-webapp`
- Check network: `docker network inspect vulnapp-network`

**Can't access project.tujuh?**
- Check NPM config points to vulnapp-webapp:80
- Check container is running on port 3000
- Check /etc/hosts has project.tujuh entry

---

## 📚 Full Documentation

See **JENKINS_SETUP_GUIDE.md** for complete details.

---

## ✅ Checklist

Before demo:
- [ ] SSH keys configured
- [ ] Jenkins credentials added
- [ ] Pipeline job created
- [ ] Test dry run successful
- [ ] Test deployment successful
- [ ] Can access http://project.tujuh
- [ ] Can switch between versions
- [ ] Prepared demo script

Ready to demo! 🎉

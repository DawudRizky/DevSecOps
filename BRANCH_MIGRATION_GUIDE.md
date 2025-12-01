# Branch-Based CI/CD Implementation Guide

## 🎯 Overview

This guide explains how to migrate from the directory-based approach to a proper branch-based Git workflow for the webapp deployment.

---

## 📊 Current vs Proposed Structure

### Current (Directory-Based)
```
main branch
├── project-management/          # Vulnerable version
└── project-management-secure/   # Secure version
```

**Problems:**
- ❌ Code duplication
- ❌ Changes must be made twice
- ❌ Confusing which is "source of truth"
- ❌ Large repository size

### Proposed (Branch-Based)
```
main branch                      # Secure version (production)
  └── webapp/                    # Single source

webapp-vulnerable branch         # Vulnerable version (demo)
  └── webapp/                    # Same structure, different code
```

**Benefits:**
- ✅ No code duplication
- ✅ Clear version control
- ✅ Smaller repository
- ✅ Industry-standard approach
- ✅ Easy to see differences (git diff)
- ✅ Proper branching strategy

---

## 🔄 Migration Steps

### Phase 1: Backup Current Setup (5 minutes)

```bash
cd /home/dso507/kelompok-tujuh

# Create backup branch (just in case)
git checkout -b backup-before-migration
git push origin backup-before-migration

# Return to main
git checkout main
```

---

### Phase 2: Create New Structure (10 minutes)

```bash
# 1. Rename project-management-secure to webapp (this becomes main)
git mv project-management-secure webapp

# 2. Remove project-management directory (we'll recreate as branch)
git rm -rf project-management

# 3. Update .gitignore if needed
echo "webapp/node_modules/" >> .gitignore
echo "webapp/dist/" >> .gitignore

# 4. Commit changes
git add -A
git commit -m "Refactor: migrate to single webapp directory (secure version)"
git push origin main
```

---

### Phase 3: Create Vulnerable Branch (15 minutes)

```bash
# 1. Create vulnerable branch from main
git checkout -b webapp-vulnerable

# 2. Copy vulnerable code from backup
# (We need to restore project-management files)
git checkout backup-before-migration -- project-management

# 3. Replace webapp/ with vulnerable version
rm -rf webapp/
mv project-management/ webapp/

# 4. Commit vulnerable version
git add -A
git commit -m "feat: create vulnerable branch with intentional security flaws"
git push origin webapp-vulnerable

# 5. Return to main
git checkout main
```

---

### Phase 4: Update Docker Compose (5 minutes)

Update `docker-compose.yml` to use single webapp:

```yaml
version: '3.8'

services:
  # Single Web Application (version controlled by Git branch)
  webapp:
    build:
      context: ./webapp
      dockerfile: Dockerfile
    container_name: vulnapp-webapp
    restart: unless-stopped
    ports:
      - "3000:80"
    networks:
      - vulnapp-network
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - NODE_ENV=production

  # Infrastructure services remain unchanged
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
    networks:
      - vulnapp-network
    environment:
      DB_SQLITE_FILE: "/data/database.sqlite"

  wordpress:
    build:
      context: ./wordpress
      dockerfile: Dockerfile
    container_name: vulnerable-wordpress
    restart: unless-stopped
    ports:
      - "8080:80"
    networks:
      - vulnapp-network
    environment:
      WORDPRESS_DB_HOST: wordpress-db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: vulnerable_wp_pass
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_DEBUG: 'true'
    volumes:
      - wordpress-data:/var/www/html
      - ./wordpress/vulnerable-plugins/social-warfare:/var/www/html/wp-content/plugins-custom/social-warfare:ro
      - ./wordpress/vulnerable-plugins/wp-file-manager:/var/www/html/wp-content/plugins-custom/wp-file-manager:ro
    depends_on:
      - wordpress-db

  wordpress-db:
    image: mysql:5.7
    container_name: wordpress-mysql
    restart: unless-stopped
    networks:
      - vulnapp-network
    environment:
      MYSQL_ROOT_PASSWORD: root_vulnerable_pass
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: vulnerable_wp_pass
    volumes:
      - wordpress-db-data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

networks:
  vulnapp-network:
    external: true

volumes:
  npm-data:
    name: npm-data
  npm-letsencrypt:
    name: npm-letsencrypt
  wordpress-data:
    name: wordpress-data
  wordpress-db-data:
    name: wordpress-db-data
```

Commit:
```bash
git add docker-compose.yml
git commit -m "Update docker-compose to use single webapp directory"
git push origin main

# Also update in vulnerable branch
git checkout webapp-vulnerable
git add docker-compose.yml
git commit -m "Update docker-compose to use single webapp directory"
git push origin webapp-vulnerable

git checkout main
```

---

### Phase 5: Update Jenkinsfile (5 minutes)

Update Jenkinsfile to use branches instead of directories:

```groovy
stage('📥 Checkout Source') {
    steps {
        script {
            // Determine which branch to checkout
            def branchName = params.VERSION == 'vulnerable' ? 'webapp-vulnerable' : 'main'
            
            echo "Checking out branch: ${branchName}"
            checkout([
                $class: 'GitSCM',
                branches: [[name: "*/${branchName}"]],
                userRemoteConfigs: [[url: env.GIT_REPO]]
            ])
        }
    }
}

stage('📂 Verify Source') {
    steps {
        script {
            env.SOURCE_DIR = 'webapp'  // Always 'webapp' now
            
            if (params.VERSION == 'vulnerable') {
                env.VERSION_DISPLAY = '🔴 VULNERABLE (Unsecure)'
            } else {
                env.VERSION_DISPLAY = '🟢 SECURE (Patched)'
            }
            
            echo """
            📂 Source Directory: ${env.SOURCE_DIR}
            📋 Version: ${env.VERSION_DISPLAY}
            """
            
            // Verify source directory exists
            sh """
                if [ ! -d "${env.SOURCE_DIR}" ]; then
                    echo "❌ ERROR: Source directory not found!"
                    exit 1
                fi
                ls -la ${env.SOURCE_DIR}/
            """
        }
    }
}
```

---

## 🎬 Branch Strategy Explanation

### Main Branch (main)
- **Purpose:** Production-ready secure version
- **Content:** Secure webapp implementation
- **Deployment:** Default deployment target
- **Protection:** Can add branch protection rules

### Vulnerable Branch (webapp-vulnerable)
- **Purpose:** Demo/testing vulnerable version
- **Content:** Intentionally vulnerable implementation
- **Deployment:** For security demonstrations
- **Note:** Clearly marked as vulnerable

---

## 📊 Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Git Repository                       │
│                                                          │
│  main branch               webapp-vulnerable branch     │
│  ├── webapp/               ├── webapp/                  │
│  │   ├── src/              │   ├── src/                 │
│  │   │   ├── (secure)      │   │   ├── (vulnerable)    │
│  │   └── Dockerfile        │   └── Dockerfile           │
│  ├── wordpress/            ├── wordpress/               │
│  ├── Jenkinsfile           ├── Jenkinsfile              │
│  └── docker-compose.yml    └── docker-compose.yml       │
│                                                          │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
             │                          │
             ↓                          ↓
       ┌─────────┐              ┌─────────────┐
       │ Jenkins │              │   Jenkins   │
       │ Build   │              │    Build    │
       │ (main)  │              │ (vulnerable)│
       └────┬────┘              └──────┬──────┘
            │                          │
            ↓                          ↓
    ┌──────────────┐          ┌──────────────┐
    │  Secure      │          │  Vulnerable  │
    │  Deployment  │          │  Deployment  │
    └──────────────┘          └──────────────┘
```

---

## 🔍 Comparison Between Versions

### View Differences
```bash
# See what's different between branches
git diff main webapp-vulnerable

# See specific file differences
git diff main webapp-vulnerable -- webapp/src/contexts/AuthContext.tsx
git diff main webapp-vulnerable -- webapp/src/components/Files/Files.tsx
```

### Key Differences to Expect

**AuthContext.tsx:**
- Main: Uses proper authentication with Supabase
- Vulnerable: Stores plaintext passwords in cookies

**Files.tsx:**
- Main: Safe file preview with syntax highlighting
- Vulnerable: Uses eval() for code execution

**Chat.tsx:**
- Main: Uses DOMPurify to sanitize HTML
- Vulnerable: Uses innerHTML without sanitization

---

## 🧪 Testing the New Setup

### Test Build Locally

```bash
# Test secure version
git checkout main
cd webapp
docker build -t webapp:secure .

# Test vulnerable version
git checkout webapp-vulnerable
cd webapp
docker build -t webapp:vulnerable .

# Return to main
git checkout main
```

### Test Jenkins Deployment

1. **Deploy Secure:**
   - VERSION: `secure`
   - Jenkins checks out `main` branch
   - Builds from `webapp/`

2. **Deploy Vulnerable:**
   - VERSION: `vulnerable`
   - Jenkins checks out `webapp-vulnerable` branch
   - Builds from `webapp/`

---

## 📋 Migration Checklist

- [ ] Backup current setup (create backup branch)
- [ ] Create new structure on main (webapp/)
- [ ] Remove old directories
- [ ] Commit and push main
- [ ] Create webapp-vulnerable branch
- [ ] Copy vulnerable code to webapp/ in new branch
- [ ] Commit and push vulnerable branch
- [ ] Update docker-compose.yml (both branches)
- [ ] Update Jenkinsfile (both branches)
- [ ] Test local builds (both branches)
- [ ] Update Jenkins job configuration
- [ ] Test Jenkins deployment
- [ ] Update documentation
- [ ] Delete backup branch (if everything works)

---

## 🎯 Benefits of Branch-Based Approach

### For Development
- ✅ Single source of truth per version
- ✅ Easy to see changes (`git diff`)
- ✅ No code duplication
- ✅ Standard Git workflow

### For CI/CD
- ✅ Jenkins uses standard branch checkout
- ✅ Clear version selection
- ✅ Easier to add more versions (new branches)
- ✅ Better integration with Git

### For Demo
- ✅ Clear separation of versions
- ✅ Easy to explain ("we switch branches")
- ✅ Shows proper DevOps practices
- ✅ Professional approach

---

## 🔄 Alternative: Tag-Based Strategy

Instead of branches, you could use tags:

```bash
# Tag vulnerable version
git tag -a v1.0-vulnerable -m "Vulnerable version for demo"

# Tag secure version
git tag -a v1.0-secure -m "Secure patched version"

# Jenkins parameter: VERSION = tag name
```

**Pros:** Immutable versions  
**Cons:** Less flexible than branches

---

## 📚 Git Commands Reference

```bash
# Switch between versions
git checkout main                  # Secure version
git checkout webapp-vulnerable     # Vulnerable version

# Compare versions
git diff main webapp-vulnerable

# See branch list
git branch -a

# Create new branch
git checkout -b feature-new-version

# Merge changes (if needed)
git checkout main
git merge webapp-vulnerable -- webapp/src/some-shared-component.tsx
```

---

## 🚨 Important Notes

1. **Infrastructure Unchanged:**
   - WordPress, NPM, MySQL are NOT in branches
   - They remain the same in all branches
   - Only webapp/ code changes between branches

2. **Branch Protection:**
   - Consider protecting `main` branch on GitHub
   - Require pull requests for changes
   - Add code review process

3. **Documentation:**
   - Keep README updated in both branches
   - Document which branch is which
   - Add branch description in GitHub

4. **Maintenance:**
   - When fixing bugs, decide which branch needs it
   - Shared components might need updates in both
   - Use cherry-pick for selective updates

---

## ✅ Success Criteria

Migration is successful when:
- ✅ Only one `webapp/` directory exists
- ✅ Two branches: `main` and `webapp-vulnerable`
- ✅ Jenkins can build from both branches
- ✅ Deployment works for both versions
- ✅ Can switch between versions via Jenkins
- ✅ No code duplication
- ✅ Git history is clean

---

**Ready to migrate? Follow the steps in Phase 1-5!**

# Jenkins Job Configuration Update - Branch-Based Deployment

## ✅ Migration Complete!

You've successfully migrated from directory-based to branch-based structure:

```
✅ Created webapp/ directory
✅ Created main branch (secure version)
✅ Created webapp-vulnerable branch (vulnerable version)
✅ Deleted old directories (project-management, project-management-secure)
✅ Fixed Jenkinsfile (removed double checkout issue)
✅ Pushed changes to GitHub
```

---

## 🔧 Jenkins Job Configuration Update Required

The Jenkins job needs to be updated to support dynamic branch selection based on the VERSION parameter.

### Current Issue:
- Jenkins job is configured to always checkout from `main` branch
- But we need it to checkout `webapp-vulnerable` when VERSION=vulnerable
- And checkout `main` when VERSION=secure

### Solution: Configure Multiple Branch Specifiers

---

## 📋 Step-by-Step Configuration

### 1. Access Jenkins Job

Go to: http://10.34.100.163:8080/job/kelompok-tujuh-webapp-deploy-dso507/configure

### 2. Update Pipeline → SCM Configuration

Scroll to **Pipeline** section → **SCM: Git**

**Current Configuration:**
```
Branch Specifier: */main
```

**Update to:**
```
Branch Specifier (for branches to build): ${VERSION == 'secure' ? 'main' : 'webapp-vulnerable'}
```

**OR use this approach (Multiple Branch Specifiers):**

Click "Add Branch" and configure:
```
Branch Specifier #1: */main
Branch Specifier #2: */webapp-vulnerable
```

Then Jenkins will build from whichever branch the job needs based on parameters.

### 3. Alternative: Use Branch Expression

If the above doesn't work, use this in the **Branches to build** section:

**Branch Specifier:**
```
${env.VERSION == 'vulnerable' ? 'webapp-vulnerable' : 'main'}
```

### 4. Recommended Configuration (Best Approach)

Since Jenkins parameters aren't available during SCM checkout, the best approach is:

**Create TWO separate configurations or use Multibranch Pipeline:**

#### Option A: Keep Current Job, Use Multibranch Strategy

Instead of a single Pipeline job, create a **Multibranch Pipeline** job:

1. **New Item** → Name: `kelompok-tujuh-webapp-multibranch`
2. **Type:** Multibranch Pipeline
3. **Branch Sources:** Git
   - Repository URL: `https://github.com/DawudRizky/DevSecOps.git`
   - Discover branches: All branches
   - Or specifically: `main` and `webapp-vulnerable`
4. **Build Configuration:**
   - Mode: by Jenkinsfile
   - Script Path: `Jenkinsfile`

This will create TWO sub-jobs automatically:
- `kelompok-tujuh-webapp-multibranch/main` (secure version)
- `kelompok-tujuh-webapp-multibranch/webapp-vulnerable` (vulnerable version)

#### Option B: Use Generic Webhook or Manual Branch Selection

Update the current job:

1. **Pipeline Definition:** Pipeline script from SCM
2. **Branches to build:** `**` (all branches)
3. **Additional option:** Add "Lightweight checkout"

Then the Jenkinsfile will verify it's on the correct branch and fail with a helpful message if not.

---

## 🎯 Recommended Quick Fix (Easiest)

Use the **simpler approach** - configure Jenkins to allow multiple branches:

### Steps:

1. Go to job configuration
2. Under **Pipeline** → **Definition:** Pipeline script from SCM
3. Under **SCM:** Git
4. **Branches to build:** Change from `*/main` to:
   ```
   */main */webapp-vulnerable
   ```
   (space-separated or one per line)

5. Leave everything else the same
6. **Save**

Now when you trigger a build:
- Jenkins will checkout from `main` (as configured in Jenkins)
- The Jenkinsfile will verify if it's on the correct branch
- If VERSION=vulnerable but on main, it will show a clear error message

---

## 🔄 Alternative: Simple Two-Step Process

Since the parameter-based branch selection is complex in declarative pipeline, use this approach:

### For Secure Version:
1. Ensure Jenkins job is configured with: **Branch Specifier: */main**
2. Build with: **VERSION=secure**

### For Vulnerable Version:
1. **Temporarily** change Jenkins job configuration
2. **Branch Specifier: */webapp-vulnerable**
3. Build with: **VERSION=vulnerable**
4. Change back to `*/main` when done

**OR** create two separate Jenkins jobs:
- `kelompok-tujuh-secure` → always builds from `main`
- `kelompok-tujuh-vulnerable` → always builds from `webapp-vulnerable`

---

## ✅ Recommended Final Solution

### Create a Generic Webhook-Triggered Job

1. **Keep current job configuration**
2. Set **Branch Specifier:** `**` (all branches)
3. **Manually trigger** the correct branch:

```bash
# From your machine, trigger Jenkins with specific branch
curl -X POST http://10.34.100.163:8080/job/kelompok-tujuh-webapp-deploy-dso507/buildWithParameters \
  -d "VERSION=secure" \
  -d "TARGET_HOST=dso507@10.34.100.160" \
  -d "DRY_RUN=false"
```

### OR Use the Multibranch Pipeline (Professional Approach)

This is the **industry standard** way:

1. Create new Multibranch Pipeline job
2. It auto-discovers branches
3. Each branch gets its own build job
4. No parameter needed - just select which branch to build

---

## 🎬 For Your Demo - Quick Solution

**Recommended for immediate demo:**

### Option 1: Two Separate Jobs (5 minutes setup)

**Job 1:** `kelompok-tujuh-secure`
- Branch: `*/main`
- Parameters: Same as current
- Builds secure version

**Job 2:** `kelompok-tujuh-vulnerable`
- Branch: `*/webapp-vulnerable`
- Parameters: Same as current
- Builds vulnerable version

**Demo flow:**
1. Show vulnerable app → Trigger Job 2
2. Demonstrate exploits
3. Deploy secure version → Trigger Job 1
4. Verify patches work

### Option 2: Keep Single Job, Manual Branch Change (Current)

Keep your current job, but:
1. For secure: Ensure Branch = `*/main`, run build
2. For vulnerable: Change Branch = `*/webapp-vulnerable`, run build

---

## 📝 Current Status

Your Jenkinsfile is now **fixed** and ready to work with the branch-based structure. The remaining issue is just the Jenkins job configuration to select the correct branch.

**What's Working:**
- ✅ Repository structure is correct
- ✅ Both branches exist with webapp/ directory
- ✅ Jenkinsfile is fixed (no double checkout)
- ✅ Both branches have updated Jenkinsfile

**What Needs Update:**
- ⚠️ Jenkins job branch configuration

---

## 🚀 Next Steps

Choose one approach:

### Quick (for immediate testing):
```bash
# Option 1: Update Jenkins job branch specifier
Go to job config → Change Branch to: */main */webapp-vulnerable

# Then test:
- Build with VERSION=secure (should fail with helpful message if on wrong branch)
- Manually ensure Jenkins is on correct branch in config
```

### Professional (recommended after demo):
```bash
# Create Multibranch Pipeline
# Automatically handles branch selection
# Industry standard approach
```

---

## 🧪 Testing

1. **Update Jenkins job** (choose option above)
2. **Run dry run:**
   - VERSION: `secure`
   - DRY_RUN: `true`
3. **Check console output:**
   - Should show: "Current Branch: main"
   - Should build successfully
4. **If it fails**, check the error message - it will tell you if you're on wrong branch

---

**Which approach do you prefer?**
1. Two separate jobs (easiest)
2. Multibranch pipeline (professional)
3. Manual branch switching in current job (demo-ready)

Let me know and I'll guide you through the setup!

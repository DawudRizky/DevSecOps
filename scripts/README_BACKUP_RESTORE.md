# Backup & Restore System

This directory contains scripts for complete lifecycle management of the vulnerable applications deployment, including backup, cleanup, and restoration.

## 📁 Available Scripts

### 1. `backup-config.sh` - Configuration Backup
Saves current NPM and WordPress configurations for later restoration.

**What it backs up:**
- **Nginx Proxy Manager:**
  - SQLite database (proxy hosts, SSL configs, users)
  - Nginx configuration files
  - Let's Encrypt SSL certificates
  
- **WordPress:**
  - Complete WordPress files (plugins, themes, uploads)
  - Full MySQL database dump
  - List of installed plugins
  - Active plugins configuration

**Usage:**
```bash
./scripts/backup-config.sh
```

**Output:**
- Creates timestamped backups in `backups/` directory
- Creates symlinks `npm_latest` and `wordpress_latest` pointing to most recent backups
- Generates `RESTORE_INSTRUCTIONS.txt` with restoration guide

---

### 2. `restore-config.sh` - Configuration Restoration
Restores previously backed up configurations to running containers.

**What it restores:**
- NPM database with all proxy host configurations
- NPM nginx configs and SSL certificates
- WordPress database with all content and settings
- WordPress plugins, themes, and uploaded files
- File permissions

**Usage:**
```bash
# Restore from latest backup
./scripts/restore-config.sh

# Restore from specific backup (use timestamp)
./scripts/restore-config.sh 20251028_070726
```

**Prerequisites:**
- Containers must be running before restoration
- Backup directory must exist

---

### 3. `stop.sh` - Complete Cleanup
**⚠️ DESTRUCTIVE OPERATION** - Completely removes all deployment artifacts and restores machine to pre-deployment state.

**What it removes:**
- All Docker containers (webapp, NPM, WordPress, MySQL, Supabase)
- All Docker volumes (deletes all data)
- All Docker images (built and pulled)
- Docker networks
- Build cache
- Supabase local data

**Usage:**
```bash
./scripts/stop.sh
```

**Important:** This script does NOT back up automatically. Run `backup-config.sh` first if you want to preserve your configurations!

---

### 4. `deploy.sh` - Deployment
Starts all services and optionally restores from backup.

**Standard deployment:**
```bash
./scripts/deploy.sh
```

**Deployment with automatic restoration:**
```bash
./scripts/deploy.sh --restore
```

---

## 🔄 Complete Workflow Examples

### Example 1: Fresh Start (Preserve Current Config)

```bash
# 1. Backup current configuration
./scripts/backup-config.sh

# 2. Complete cleanup
./scripts/stop.sh

# 3. Fresh deployment
./scripts/deploy.sh

# 4. Restore your configurations
./scripts/restore-config.sh
```

### Example 2: Quick Reset with Auto-Restore

```bash
# 1. Backup
./scripts/backup-config.sh

# 2. Cleanup
./scripts/stop.sh

# 3. Deploy and restore in one command
./scripts/deploy.sh --restore
```

### Example 3: Regular Backup Routine

```bash
# Backup before making risky changes
./scripts/backup-config.sh

# Make your changes...
# If something breaks:

./scripts/restore-config.sh
```

---

## 📂 Backup Directory Structure

```
backups/
├── npm_20251028_070726/
│   ├── database.sqlite          # All NPM configurations
│   ├── nginx/                   # Nginx config files
│   └── letsencrypt/             # SSL certificates
├── wordpress_20251028_070726/
│   ├── wordpress_db.sql         # Full database dump
│   ├── wordpress_files/         # All WP files
│   ├── installed_plugins.txt   # Plugin list
│   ├── active_plugins.sql      # Active plugins data
│   └── wp_config.txt           # WP version info
├── npm_latest -> npm_20251028_070726          # Symlink to latest
├── wordpress_latest -> wordpress_20251028_070726  # Symlink to latest
└── RESTORE_INSTRUCTIONS.txt
```

---

## 🛡️ Safety Features

1. **Timestamped Backups:** Each backup is uniquely timestamped, preventing accidental overwrites
2. **Symlinks to Latest:** Easy access to most recent backups via `*_latest` symlinks
3. **Idempotent Operations:** Scripts can be run multiple times safely
4. **Clear Status Messages:** Color-coded output shows progress and issues
5. **Graceful Failures:** Scripts continue even if some operations fail

---

## ⚙️ Configuration

### Backup Retention
Backups are never automatically deleted. To clean old backups:

```bash
# List all backups
ls -lh backups/

# Remove specific backup
rm -rf backups/npm_20251028_070552
rm -rf backups/wordpress_20251028_070552

# Keep only last 5 backups (example)
cd backups && ls -t npm_* | tail -n +6 | xargs rm -rf
cd backups && ls -t wordpress_* | tail -n +6 | xargs rm -rf
```

### Backup Location
Default: `./backups/` relative to project root

To change, edit `BACKUP_DIR` in both `backup-config.sh` and `restore-config.sh`

---

## 🔍 Troubleshooting

### "No backup directory found"
**Solution:** Run `./scripts/backup-config.sh` first to create a backup

### "Container is not running"
**Solution:** Start services first with `./scripts/deploy.sh`

### "Failed to backup database"
**Causes:**
- Container not healthy/starting
- Insufficient permissions
- Disk space full

**Solution:** 
```bash
# Check container status
docker ps -a

# Check logs
docker logs nginx-proxy-manager
docker logs vulnerable-wordpress

# Check disk space
df -h
```

### Restore doesn't seem to work
**Solution:**
1. Verify backup exists: `ls -lh backups/npm_latest backups/wordpress_latest`
2. Check containers are running: `docker ps`
3. Wait longer for MySQL to initialize (try running restore again after 30 seconds)

---

## 📊 Verification Commands

```bash
# Verify backup was created
ls -lh backups/

# Check backup sizes
du -sh backups/*

# List backed up WordPress plugins
cat backups/wordpress_latest/installed_plugins.txt

# Verify containers are running after restore
docker ps

# Check NPM is accessible
curl -I http://localhost:81

# Check WordPress is accessible
curl -I http://localhost:8080
```

---

## 🎯 Best Practices

1. **Backup Before Major Changes:** Always backup before:
   - Installing new plugins
   - Updating WordPress
   - Changing NPM proxy configurations
   - Running exploits/tests

2. **Regular Backups:** Create backups at regular intervals during development

3. **Test Restores:** Periodically test restore process to ensure backups are valid

4. **Document Custom Configurations:** Keep notes of any manual configurations not captured by backups

5. **Cleanup Old Backups:** Regularly remove old backups to save disk space

---

## 🚨 Important Notes

- **Backups are local only:** Stored in `./backups/`, not in version control
- **No automatic backup:** Must manually run `backup-config.sh`
- **Stop.sh is destructive:** Creates no backup automatically
- **Database passwords:** Hardcoded in scripts (vulnerable_wp_pass) - acceptable for lab environment only
- **Git ignored:** `backups/` directory is in `.gitignore` to prevent accidental commits

---

## 🔗 Related Files

- `deploy.sh` - Full deployment with optional restore
- `stop.sh` - Complete cleanup (use with caution)
- `docker-compose.yml` - Container definitions
- `backups/.gitignore` - Prevents backup commits

---

**Last Updated:** October 28, 2025

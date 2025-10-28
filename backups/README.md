# Backups Directory

## ⚠️ Important: Backups are Local Only

This directory stores **local backups** of your NPM and WordPress configurations. 

### 🚫 Why Backups Are NOT in Git

Backups are excluded from version control because they:
- **Contain sensitive data**: database credentials, user data, SSL private keys
- **Are very large**: 70MB+ per backup (WordPress files alone = 67MB)
- **Are machine-specific**: represent YOUR local deployment state
- **Change frequently**: would bloat repository history

### 📁 What Gets Backed Up

Each backup includes:

#### NPM Backup (`npm_TIMESTAMP/`)
```
npm_20251028_070726/
├── database.sqlite      # All proxy hosts, SSL configs, users (104KB)
├── nginx/              # Custom nginx configurations
└── letsencrypt/        # SSL certificates
```

#### WordPress Backup (`wordpress_TIMESTAMP/`)
```
wordpress_20251028_070726/
├── wordpress_db.sql         # Full database dump (916KB)
├── wordpress_files/         # All WP files (67MB)
│   ├── wp-content/
│   │   ├── plugins/         # Installed plugins
│   │   ├── themes/          # Installed themes
│   │   └── uploads/         # Media files
│   └── ...
├── installed_plugins.txt    # List of plugins
├── active_plugins.sql       # Active plugins config
└── wp_config.txt           # WP version info
```

### 🔗 Symlinks to Latest

The backup system maintains symlinks to the most recent backups:
- `npm_latest` → most recent NPM backup
- `wordpress_latest` → most recent WordPress backup

These are used by `restore-config.sh` when no specific timestamp is provided.

### 💾 Managing Backups

#### Create a Backup
```bash
./scripts/backup-config.sh
```

#### Restore Latest Backup
```bash
./scripts/restore-config.sh
```

#### Restore Specific Backup
```bash
./scripts/restore-config.sh 20251028_070726
```

#### List All Backups
```bash
ls -lh backups/
```

#### Check Backup Sizes
```bash
du -sh backups/*
```

#### Clean Old Backups (Manual)
```bash
# Keep only last 5 backups
cd backups
ls -t npm_* | tail -n +6 | xargs rm -rf
ls -t wordpress_* | tail -n +6 | xargs rm -rf
```

### 📦 Reference Backup Structure

A minimal `reference_backup/` is included in the repository to document:
- Expected backup directory structure
- File types and organization
- Example plugin lists
- Configuration file formats

**Note:** Large files (databases, wordpress_files) are excluded from the reference backup.

### 🔒 Security Note

**NEVER commit actual backups to Git** because they contain:
- ✗ Database passwords and connection strings
- ✗ User credentials and session data
- ✗ SSL private keys and certificates
- ✗ API keys and secrets
- ✗ Personal/sensitive content

### 🎯 Backup Workflow

```bash
# Before making changes
./scripts/backup-config.sh

# Make changes, test exploits, etc.
# ...

# If something breaks
./scripts/restore-config.sh

# Complete cleanup and fresh start
./scripts/stop.sh        # Creates backup automatically
./scripts/deploy.sh      # Fresh deployment
./scripts/restore-config.sh  # Restore your configs
```

### 📊 Typical Backup Sizes

- NPM: ~100-200KB (configurations only)
- WordPress: ~70-100MB (includes all files and database)
- **Total per backup**: ~70-100MB

After 10 backups, you'll have ~700MB-1GB of backup data locally.

### ⚙️ Customization

To change backup location, edit these files:
- `scripts/backup-config.sh` - `BACKUP_DIR` variable
- `scripts/restore-config.sh` - `BACKUP_DIR` variable

---

**For complete backup/restore documentation, see:** `scripts/README_BACKUP_RESTORE.md`

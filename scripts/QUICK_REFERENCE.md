# Quick Reference Card

## 🎯 Common Operations

### Backup Current Configuration
```bash
./scripts/backup-config.sh
```
**Creates:** Timestamped backup in `backups/` directory

---

### Complete Cleanup (⚠️ Deletes Everything)
```bash
./scripts/stop.sh
```
**Removes:** All containers, volumes, images, networks, cache

---

### Fresh Deployment
```bash
./scripts/deploy.sh
```
**Starts:** All services from scratch

---

### Restore Last Backup
```bash
./scripts/restore-config.sh
```
**Restores:** NPM and WordPress configs from latest backup

---

## 🔄 Common Workflows

### Reset Everything (Keep Config)
```bash
./scripts/backup-config.sh  # Backup first
./scripts/stop.sh            # Clean everything
./scripts/deploy.sh          # Deploy fresh
./scripts/restore-config.sh  # Restore configs
```

### Quick Test/Reset Cycle
```bash
# Before risky changes
./scripts/backup-config.sh

# Make changes, test exploits, etc...

# If something breaks, restore
./scripts/restore-config.sh
```

---

## 📊 Status & Verification

### Check Running Containers
```bash
docker ps
```

### View Logs
```bash
docker logs nginx-proxy-manager
docker logs vulnerable-wordpress
docker logs wordpress-mysql
```

### List Backups
```bash
ls -lh backups/
```

### Check Latest Backup
```bash
ls -lh backups/npm_latest backups/wordpress_latest
```

---

## 🚨 Emergency Recovery

### Service Not Starting?
```bash
# Check what's running
docker ps -a

# Stop everything
./scripts/stop.sh

# Clean Docker completely
docker system prune -a --volumes -f

# Redeploy
./scripts/deploy.sh
```

### Backup Corrupted?
```bash
# List all backups with timestamps
ls -lh backups/

# Restore from specific backup
./scripts/restore-config.sh 20251028_070726
```

---

## 🔍 What Each Script Does

| Script | Backup? | Delete? | Deploy? | Restore? |
|--------|---------|---------|---------|----------|
| `backup-config.sh` | ✅ Yes | ❌ No | ❌ No | ❌ No |
| `restore-config.sh` | ❌ No | ❌ No | ❌ No | ✅ Yes |
| `stop.sh` | ❌ No | ✅ YES | ❌ No | ❌ No |
| `deploy.sh` | ❌ No | ❌ No | ✅ Yes | 🟡 Optional |

---

## 📞 Quick Troubleshooting

**Problem:** "No backup directory found"
**Solution:** Run `./scripts/backup-config.sh` first

**Problem:** "Container is not running"  
**Solution:** Run `./scripts/deploy.sh` first

**Problem:** Restore doesn't work
**Solution:** Wait 30 seconds for MySQL, then try again

**Problem:** Port already in use
**Solution:** Run `./scripts/stop.sh` to clean everything

---

## 📱 Access Points

- **NPM Admin:** http://localhost:81
- **WordPress Direct:** http://localhost:8080  
- **WordPress via NPM:** http://wordpress.tujuh
- **Project App Direct:** http://localhost:3000
- **Project App via NPM:** http://project.tujuh
- **Supabase Studio:** http://localhost:54323

---

**For detailed documentation:** See `README_BACKUP_RESTORE.md`

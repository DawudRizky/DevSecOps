#!/bin/bash

# WordPress Plugin Auto-Installation Script
# Installs and activates vulnerable plugins for DevSecOps testing

echo "🔌 WordPress Plugin Auto-Installation Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for WordPress to be ready
echo "⏳ Waiting for WordPress to be ready..."
sleep 15

# Check if WordPress is installed
until wp core is-installed --path=/var/www/html --allow-root 2>/dev/null; do
    echo "⏳ Waiting for WordPress installation..."
    sleep 5
done

echo "✅ WordPress is ready!"

# Function to copy and activate plugin
install_plugin() {
    local plugin_name=$1
    local plugin_slug=$2
    
    echo ""
    echo "📦 Installing ${plugin_name}..."
    
    # Check if plugin directory exists in plugins-custom
    if [ -d "/var/www/html/wp-content/plugins-custom/${plugin_slug}" ]; then
        echo "  → Copying plugin files..."
        cp -r "/var/www/html/wp-content/plugins-custom/${plugin_slug}" "/var/www/html/wp-content/plugins/"
        
        # Set proper permissions
        chown -R www-data:www-data "/var/www/html/wp-content/plugins/${plugin_slug}"
        
        echo "  → Activating plugin..."
        if wp plugin activate "${plugin_slug}" --path=/var/www/html --allow-root 2>/dev/null; then
            echo "  ✅ ${plugin_name} installed and activated!"
        else
            echo "  ⚠️  Plugin copied but activation failed (may need manual activation)"
        fi
    else
        echo "  ❌ Plugin directory not found: /var/www/html/wp-content/plugins-custom/${plugin_slug}"
    fi
}

# Install plugins
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Installing Vulnerable Plugins"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

install_plugin "WP File Manager" "wp-file-manager"
install_plugin "Social Warfare" "social-warfare"

# Fix permissions for WP File Manager
echo ""
echo "🔧 Setting up plugin directories and permissions..."
echo "  → Creating WP File Manager directories..."
mkdir -p /var/www/html/wp-content/uploads/wp-file-manager-pro/fm_backup
mkdir -p /var/www/html/wp-content/uploads/wp-file-manager-pro/fm_logs

echo "  → Setting proper ownership and permissions..."
chown -R www-data:www-data /var/www/html/wp-content/uploads
chmod -R 755 /var/www/html/wp-content/uploads
chown -R www-data:www-data /var/www/html/wp-content/plugins/wp-file-manager
chmod -R 755 /var/www/html/wp-content/plugins/wp-file-manager

echo "  ✅ Permissions set successfully!"

# List installed plugins
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Installed Plugins:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
wp plugin list --path=/var/www/html --allow-root

echo ""
echo "✅ Plugin installation complete!"
echo "⚠️  WARNING: These plugins contain known vulnerabilities"
echo "    Use only in controlled testing environments!"

#!/bin/bash

# Auto-install WordPress after deployment
# This script waits for WordPress container to be ready and installs it

echo "⏳ Waiting for WordPress container to be ready..."
sleep 20

echo "🔧 Installing WordPress with WP-CLI..."
docker exec vulnerable-wordpress wp core install \
    --url=http://wordpress.tujuh \
    --title="Vulnerable WordPress" \
    --admin_user=admin \
    --admin_password=admin \
    --admin_email=admin@vulnerable.local \
    --path=/var/www/html \
    --allow-root

echo "✅ WordPress installation complete!"
echo ""
echo "🔌 The vulnerable plugins will be automatically installed and activated."
echo "   Please wait 30-60 seconds for the auto-installation to complete."
echo ""
echo "📝 WordPress Credentials:"
echo "   URL: http://wordpress.tujuh (or http://localhost:8080 for direct access)"
echo "   Username: admin"
echo "   Password: admin"

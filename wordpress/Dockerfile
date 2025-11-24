# Vulnerable WordPress with Auto-Plugin Installation
FROM wordpress:5.4.2-php7.4-apache

# Fix Debian Buster repository (moved to archive)
RUN sed -i 's/deb.debian.org/archive.debian.org/g' /etc/apt/sources.list && \
    sed -i 's/security.debian.org/archive.debian.org/g' /etc/apt/sources.list && \
    sed -i '/stretch-updates/d' /etc/apt/sources.list

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && \
    chmod +x wp-cli.phar && \
    mv wp-cli.phar /usr/local/bin/wp

# Install required packages (less for wp-cli compatibility)
RUN apt-get update && \
    apt-get install -y less default-mysql-client && \
    rm -rf /var/lib/apt/lists/*

# Copy and set up custom entrypoint
COPY custom-entrypoint.sh /usr/local/bin/custom-entrypoint.sh
COPY install-plugins.sh /usr/local/bin/install-plugins.sh
RUN chmod +x /usr/local/bin/custom-entrypoint.sh /usr/local/bin/install-plugins.sh

ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["apache2-foreground"]

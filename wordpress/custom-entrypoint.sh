#!/bin/bash
set -e

# Start the plugin auto-installation in the background
(/usr/local/bin/install-plugins.sh &)

# Run the original WordPress entrypoint
exec docker-entrypoint.sh apache2-foreground

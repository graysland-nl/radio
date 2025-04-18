#!/bin/bash

# Create necessary directories
mkdir -p logs
mkdir -p web
mkdir -p admin
mkdir -p config

# Install Node.js dependencies
cd admin
npm install express body-parser express-basic-auth
cd ..

# Copy the default Icecast configuration
cp /nix/store/*icecast*/etc/icecast.xml icecast.xml

# Modify the configuration to work with Replit
sed -i 's/<port>8000<\/port>/<port>${PORT:-8000}<\/port>/' icecast.xml
sed -i 's/<source-password>hackme<\/source-password>/<source-password>${SOURCE_PASSWORD:-hackme}<\/source-password>/' icecast.xml
sed -i 's/<relay-password>hackme<\/relay-password>/<relay-password>${RELAY_PASSWORD:-hackme}<\/relay-password>/' icecast.xml
sed -i 's/<admin-password>hackme<\/admin-password>/<admin-password>${ADMIN_PASSWORD:-hackme}<\/admin-password>/' icecast.xml

# Add admin interface configuration
sed -i '/<paths>/a \        <admin>admin</admin>' icecast.xml
sed -i '/<paths>/a \        <webroot>web</webroot>' icecast.xml
sed -i '/<paths>/a \        <logdir>logs</logdir>' icecast.xml

# Start admin interface in the background
node admin/index.js &

# Start Icecast2
icecast -c icecast.xml 
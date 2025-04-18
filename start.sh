#!/bin/bash

# Create necessary directories
mkdir -p logs
mkdir -p web
mkdir -p config
mkdir -p schedule

# Install Node.js dependencies for schedule receiver
cd schedule
npm install
cd ..

# Install Icecast if not already installed
if ! command -v icecast &> /dev/null; then
    echo "Installing Icecast..."
    nix-env -iA nixpkgs.icecast
fi

# Create icecast.xml if it doesn't exist
if [ ! -f icecast.xml ]; then
    echo "Creating icecast.xml configuration..."
    cat > icecast.xml << 'EOL'
<?xml version="1.0"?>
<icecast>
    <location>Earth</location>
    <limits>
        <clients>100</clients>
        <sources>4</sources>
        <queue-size>524288</queue-size>
        <client-timeout>30</client-timeout>
        <header-timeout>15</header-timeout>
        <source-timeout>10</source-timeout>
        <burst-on-connect>1</burst-on-connect>
        <burst-size>65535</burst-size>
    </limits>
    <authentication>
        <source-password>${SOURCE_PASSWORD:-test}</source-password>
        <relay-password>${RELAY_PASSWORD:-test}</relay-password>
    </authentication>
    <hostname>localhost</hostname>
    <listen-socket>
        <port>${PORT:-8000}</port>
    </listen-socket>
    <paths>
        <webroot>web</webroot>
        <logdir>logs</logdir>
        <basedir>/usr/share/icecast</basedir>
    </paths>
    <logging>
        <accesslog>access.log</accesslog>
        <errorlog>error.log</errorlog>
        <loglevel>3</loglevel>
    </logging>
    <security>
        <chroot>0</chroot>
    </security>
</icecast>
EOL
fi

# Start schedule receiver in the background
cd schedule
node receiver.js &
cd ..

# Start Icecast2
icecast -c icecast.xml 
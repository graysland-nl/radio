class IcecastAdmin {
    constructor() {
        this.baseUrl = window.location.origin;
        this.adminPassword = prompt('Enter admin password:') || 'hackme';
        this.updateInterval = 5000; // 5 seconds
        this.initialize();
    }

    async initialize() {
        this.setupEventListeners();
        await this.checkServerStatus();
        this.startUpdates();
    }

    setupEventListeners() {
        document.getElementById('kick-all').addEventListener('click', () => this.kickAllListeners());
        document.getElementById('reload-config').addEventListener('click', () => this.reloadConfig());
        document.getElementById('shutdown').addEventListener('click', () => this.shutdownServer());
    }

    async checkServerStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/admin/stats`, {
                headers: {
                    'Authorization': `Basic ${btoa(`admin:${this.adminPassword}`)}`
                }
            });
            
            if (response.ok) {
                this.updateStatus(true);
                const stats = await response.json();
                this.updateStats(stats);
            } else {
                this.updateStatus(false);
            }
        } catch (error) {
            console.error('Error checking server status:', error);
            this.updateStatus(false);
        }
    }

    updateStatus(isOnline) {
        const indicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (isOnline) {
            indicator.className = 'status-indicator status-online';
            statusText.textContent = 'Online';
        } else {
            indicator.className = 'status-indicator status-offline';
            statusText.textContent = 'Offline';
        }
    }

    updateStats(stats) {
        document.getElementById('listener-count').textContent = stats.listeners || 0;
        document.getElementById('source-count').textContent = stats.source_clients || 0;
        document.getElementById('uptime').textContent = this.formatUptime(stats.uptime || 0);
        
        this.updateMountPoints(stats.mountpoints || {});
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateMountPoints(mountpoints) {
        const container = document.getElementById('mount-points-list');
        container.innerHTML = '';

        Object.entries(mountpoints).forEach(([mount, data]) => {
            const mountPoint = document.createElement('div');
            mountPoint.className = 'mount-point';
            
            mountPoint.innerHTML = `
                <div class="mount-point-info">
                    <strong>${mount}</strong>
                    <span>Listeners: ${data.listeners || 0}</span>
                    <span>Bitrate: ${data.bitrate || 'N/A'} kbps</span>
                </div>
                <div class="mount-point-actions">
                    <button class="btn" onclick="admin.kickMountListeners('${mount}')">Kick Listeners</button>
                </div>
            `;
            
            container.appendChild(mountPoint);
        });
    }

    async kickAllListeners() {
        if (!confirm('Are you sure you want to kick all listeners?')) return;
        
        try {
            const response = await fetch(`${this.baseUrl}/admin/killclients`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`admin:${this.adminPassword}`)}`
                }
            });
            
            if (response.ok) {
                alert('All listeners have been kicked');
                this.checkServerStatus();
            } else {
                alert('Failed to kick listeners');
            }
        } catch (error) {
            console.error('Error kicking listeners:', error);
            alert('Error kicking listeners');
        }
    }

    async kickMountListeners(mount) {
        if (!confirm(`Are you sure you want to kick all listeners from ${mount}?`)) return;
        
        try {
            const response = await fetch(`${this.baseUrl}/admin/killmount?mount=/${mount}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`admin:${this.adminPassword}`)}`
                }
            });
            
            if (response.ok) {
                alert(`Listeners on ${mount} have been kicked`);
                this.checkServerStatus();
            } else {
                alert('Failed to kick listeners');
            }
        } catch (error) {
            console.error('Error kicking mount listeners:', error);
            alert('Error kicking listeners');
        }
    }

    async reloadConfig() {
        try {
            const response = await fetch(`${this.baseUrl}/admin/reloadconfig`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`admin:${this.adminPassword}`)}`
                }
            });
            
            if (response.ok) {
                alert('Configuration reloaded successfully');
            } else {
                alert('Failed to reload configuration');
            }
        } catch (error) {
            console.error('Error reloading configuration:', error);
            alert('Error reloading configuration');
        }
    }

    async shutdownServer() {
        if (!confirm('Are you sure you want to shutdown the server?')) return;
        
        try {
            const response = await fetch(`${this.baseUrl}/admin/shutdown`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`admin:${this.adminPassword}`)}`
                }
            });
            
            if (response.ok) {
                alert('Server is shutting down');
                this.updateStatus(false);
            } else {
                alert('Failed to shutdown server');
            }
        } catch (error) {
            console.error('Error shutting down server:', error);
            alert('Error shutting down server');
        }
    }

    startUpdates() {
        setInterval(() => this.checkServerStatus(), this.updateInterval);
    }
}

// Initialize the admin interface
const admin = new IcecastAdmin(); 
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configuration
const SCHEDULE_ENDPOINT = process.env.SCHEDULE_ENDPOINT;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 60000; // 1 minute
const SCHEDULE_FILE = path.join(__dirname, 'current_schedule.json');
const ICECAST_URL = process.env.ICECAST_URL;
const ICECAST_ADMIN = process.env.ICECAST_ADMIN;
const ICECAST_PASSWORD = process.env.ICECAST_PASSWORD;
const MOUNT_POINT = process.env.MOUNT_POINT;

// Validate required environment variables
const requiredEnvVars = {
    SCHEDULE_ENDPOINT,
    ICECAST_URL,
    ICECAST_ADMIN,
    ICECAST_PASSWORD,
    MOUNT_POINT
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

// Helper function to make authenticated requests to Icecast
async function makeIcecastRequest(endpoint, method = 'GET', data = null) {
    const url = `${ICECAST_URL}${endpoint}`;
    const auth = Buffer.from(`${ICECAST_ADMIN}:${ICECAST_PASSWORD}`).toString('base64');
    
    const options = {
        method,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Icecast request failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Icecast request error:', error);
        throw error;
    }
}

// Update Icecast metadata
async function updateIcecastMetadata(title) {
    try {
        // First, get the current mount point status
        const status = await makeIcecastRequest(`/admin/stats`);
        const mount = status.icestats.source.find(s => s.mount === MOUNT_POINT);
        
        if (!mount) {
            throw new Error(`Mount point ${MOUNT_POINT} not found`);
        }
        
        // Update the metadata
        await makeIcecastRequest(`/admin/metadata`, 'POST', {
            mount: MOUNT_POINT,
            mode: 'updinfo',
            song: title
        });
        
        console.log(`Updated Icecast metadata to: ${title}`);
    } catch (error) {
        console.error('Error updating Icecast metadata:', error);
        throw error;
    }
}

// Switch Icecast source
async function switchSource(trackUrl) {
    try {
        // First, get the current mount point status
        const status = await makeIcecastRequest(`/admin/stats`);
        const mount = status.icestats.source.find(s => s.mount === MOUNT_POINT);
        
        if (!mount) {
            throw new Error(`Mount point ${MOUNT_POINT} not found`);
        }
        
        // Update the source URL
        await makeIcecastRequest(`/admin/fallbacks`, 'POST', {
            mount: MOUNT_POINT,
            fallback: trackUrl
        });
        
        console.log(`Switched Icecast source to: ${trackUrl}`);
    } catch (error) {
        console.error('Error switching Icecast source:', error);
        throw error;
    }
}

// Helper function to validate schedule format
function validateSchedule(schedule) {
    if (!schedule || typeof schedule !== 'object') {
        throw new Error('Invalid schedule format: schedule must be an object');
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
        if (!Array.isArray(schedule[day])) {
            throw new Error(`Invalid schedule format: ${day} must be an array`);
        }

        for (const slot of schedule[day]) {
            if (!slot.id || !slot.title || !slot.startTime || typeof slot.duration !== 'number') {
                throw new Error(`Invalid slot format in ${day}: missing required fields`);
            }

            // Validate time format (HH:MM)
            if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.startTime)) {
                throw new Error(`Invalid time format in ${day}: ${slot.startTime}`);
            }
        }
    }

    return true;
}

async function fetchSchedule() {
    try {
        console.log('Fetching schedule from:', SCHEDULE_ENDPOINT);
        const response = await fetch(SCHEDULE_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const schedule = await response.json();
        
        // Validate the schedule format
        validateSchedule(schedule);
        
        // Save the schedule to a file
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
        console.log('Schedule updated successfully');
        
        // Process the schedule for Icecast
        await processScheduleForIcecast(schedule);
        
    } catch (error) {
        console.error('Error fetching schedule:', error);
        // If there's an error, try to use the last known good schedule
        try {
            if (fs.existsSync(SCHEDULE_FILE)) {
                const lastSchedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8'));
                console.log('Using last known good schedule due to error');
                await processScheduleForIcecast(lastSchedule);
            }
        } catch (readError) {
            console.error('Error reading last known good schedule:', readError);
        }
    }
}

async function processScheduleForIcecast(schedule) {
    try {
        // Get current day and time
        const now = new Date();
        const currentDay = now.toLocaleLowerCase('en-US', { weekday: 'long' });
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        
        // Find current show
        const daySchedule = schedule[currentDay] || [];
        const currentShow = daySchedule.find(slot => {
            const slotStart = new Date(`1970/01/01 ${slot.startTime}`);
            const slotEnd = new Date(slotStart.getTime() + slot.duration * 60 * 1000);
            const current = new Date(`1970/01/01 ${currentTime}`);
            
            return current >= slotStart && current < slotEnd;
        });
        
        if (currentShow) {
            console.log(`Current show: ${currentShow.title} (${currentShow.startTime})`);
            
            // Update Icecast metadata with current show title
            await updateIcecastMetadata(currentShow.title);
            
            // If the show has tracks, switch to the first track
            if (currentShow.tracks && currentShow.tracks.length > 0) {
                await switchSource(currentShow.tracks[0]);
            }
        } else {
            console.log('No show currently scheduled');
            // Optionally, you could set a default source or metadata here
        }
    } catch (error) {
        console.error('Error processing schedule for Icecast:', error);
    }
}

// Initial fetch
fetchSchedule();

// Set up polling
setInterval(fetchSchedule, POLL_INTERVAL);

// Handle process termination
process.on('SIGTERM', () => {
    console.log('Schedule receiver shutting down...');
    process.exit(0);
}); 
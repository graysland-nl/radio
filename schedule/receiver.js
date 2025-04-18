const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const SCHEDULE_ENDPOINT = process.env.SCHEDULE_ENDPOINT || 'https://your-vercel-app.vercel.app/api/schedule';
const POLL_INTERVAL = process.env.POLL_INTERVAL || 60000; // 1 minute
const SCHEDULE_FILE = path.join(__dirname, 'current_schedule.json');

async function fetchSchedule() {
    try {
        const response = await fetch(SCHEDULE_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const schedule = await response.json();
        
        // Save the schedule to a file
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
        console.log('Schedule updated successfully');
        
        // Here you can add logic to process the schedule and update Icecast
        // For example, you might want to update metadata or switch sources based on the schedule
        
    } catch (error) {
        console.error('Error fetching schedule:', error);
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
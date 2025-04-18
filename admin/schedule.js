// Schedule management for Icecast
let currentSchedule = {};

// Function to validate schedule data
const validateSchedule = (schedule) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.every(day => Array.isArray(schedule[day]));
};

// Function to handle incoming schedule updates
const handleScheduleUpdate = (req, res) => {
    const schedule = req.body;
    
    // Validate schedule format
    if (!validateSchedule(schedule)) {
        res.status(400).json({ error: 'Invalid schedule format' });
        return;
    }
    
    // Update current schedule
    currentSchedule = schedule;
    
    // Save schedule to file
    try {
        fs.writeFileSync('config/schedule.json', JSON.stringify(schedule, null, 2));
        res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Error saving schedule:', error);
        res.status(500).json({ error: 'Error saving schedule' });
    }
};

// Function to get current schedule
const getSchedule = () => {
    try {
        if (fs.existsSync('config/schedule.json')) {
            const scheduleData = fs.readFileSync('config/schedule.json', 'utf-8');
            currentSchedule = JSON.parse(scheduleData);
        }
        return currentSchedule;
    } catch (error) {
        console.error('Error reading schedule:', error);
        return {};
    }
};

// Function to get current show based on time
const getCurrentShow = () => {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const daySchedule = currentSchedule[currentDay] || [];
    return daySchedule.find(show => {
        const showTime = new Date(`1970/01/01 ${show.startTime}`);
        const showEnd = new Date(showTime.getTime() + (show.duration * 60 * 1000));
        const currentDateTime = new Date(`1970/01/01 ${currentTime}`);
        return currentDateTime >= showTime && currentDateTime < showEnd;
    });
};

// Export functions
module.exports = {
    handleScheduleUpdate,
    getSchedule,
    getCurrentShow
}; 
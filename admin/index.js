const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const schedule = require('./schedule');

const app = express();
const port = process.env.ADMIN_PORT || 8001;

// Middleware
app.use(bodyParser.json());

// Basic authentication
const adminAuth = basicAuth({
    users: { [process.env.ICECAST_ADMIN || 'admin']: process.env.ICECAST_PASSWORD || 'hackme' },
    challenge: true,
    realm: 'Icecast Admin'
});

// Schedule routes
app.post('/admin/schedule', adminAuth, schedule.handleScheduleUpdate);
app.get('/admin/schedule', adminAuth, (req, res) => {
    res.json(schedule.getSchedule());
});
app.get('/admin/schedule/current', adminAuth, (req, res) => {
    res.json(schedule.getCurrentShow());
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`Icecast admin interface listening on port ${port}`);
    schedule.getSchedule(); // Load initial schedule
}); 
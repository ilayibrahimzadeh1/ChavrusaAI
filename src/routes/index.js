const express = require('express');
const apiRoutes = require('./api');

const router = express.Router();

// Mount API routes
router.use('/api', apiRoutes);

// Health check at root level (for load balancers)
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Torah Learning App'
    });
});

module.exports = router;
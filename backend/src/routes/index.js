const express = require('express');
const reportsRouter = require('./reports');
const teamsRouter = require('./teams');
const authRouter = require('./auth');
const adminRouter = require('./admin');
const mlRouter = require('./ml');
const webhooksRouter = require('./webhooks');

const router = express.Router();

router.use('/reports', reportsRouter);
router.use('/teams', teamsRouter);
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/ml', mlRouter);
router.use('/webhooks', webhooksRouter);

module.exports = router;
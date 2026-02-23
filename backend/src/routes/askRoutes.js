const express = require('express');
const { handleAskData, handleAskSummary } = require('../controllers/askController');
const { validateAskRequest } = require('../middleware/validator');

const router = express.Router();

router.post('/data', validateAskRequest, handleAskData);
router.post('/summary', handleAskSummary);

module.exports = router;

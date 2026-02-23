function validateAskRequest(req, res, next) {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Valid question string is required.' });
    }
    next();
}

module.exports = { validateAskRequest };

const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool(config.db);

module.exports = {
    query: (text, params) => pool.query(text, params),
};

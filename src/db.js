const { Pool } = require('pg');
const pool = new Pool({
  user: 'fneuser',
  password: 'fnepassword',
  host: 'localhost',
  port: 5432,
  database: 'fnedb',
});
module.exports = pool; 
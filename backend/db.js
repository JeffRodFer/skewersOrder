const { Pool } = require('pg');
require('dotenv').config();

// Configura a conexão usando a URL segura do .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Necessário para conexões seguras em nuvem (Neon)
    rejectUnauthorized: false 
  }
});

// Exporta a conexão para ser usada no server.js
module.exports = pool;